#!/usr/bin/env ruby
# frozen_string_literal: true

require "cgi"
require "date"
require "digest"
require "fileutils"
require "json"
require "net/http"
require "open3"
require "optparse"
require "time"
require "uri"
require "yaml"
require "kramdown"
require "kramdown-parser-gfm"

ROOT = File.expand_path("..", __dir__)
POSTS_GLOB = File.join(ROOT, "_posts", "**", "*.md")
MANIFEST_PATH = File.join(ROOT, "_data", "audio.yml")
TRANSLATIONS_PATH = File.join(ROOT, "_data", "translations.yml")
AUDIO_DIR = "assets/audio"

NARRATION = YAML.safe_load_file(File.join(__dir__, "narration.yml"))
MODEL = NARRATION.fetch("model")
VOICES = NARRATION.fetch("voices")
SETTINGS = NARRATION["settings"]
PRONUNCIATIONS = NARRATION.fetch("pronunciations")
API_BASE = ENV.fetch("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io/v1").chomp("/")
api_host = URI(API_BASE)
unless (api_host.scheme == "https" && api_host.host == "api.elevenlabs.io") ||
       (api_host.scheme == "http" && %w[127.0.0.1 localhost].include?(api_host.host))
  abort "ELEVENLABS_BASE_URL must point to https://api.elevenlabs.io or to a mock on localhost."
end
DEFAULT_MAX = 6

CHUNK_LIMIT = 2_000
CONTEXT_LIMIT = 100
OUTPUT_FORMAT = "mp3_44100_192"
SAMPLE_RATE = 44_100
BYTES_PER_SECOND = SAMPLE_RATE * 2
CHUNK_GAP = "\0".b * (BYTES_PER_SECOND * 0.4).to_i
BITRATE = "128k"
LOUDNORM = "I=-16:TP=-1.5:LRA=11"

SMART_QUOTES = { lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" }.freeze
TYPOGRAPHIC_SYMBOLS = {
  mdash: "—", ndash: "–", hellip: "…",
  laquo: "«", raquo: "»", laquo_space: "« ", raquo_space: " »"
}.freeze
SILENT_HTML = %w[audio iframe img noscript picture script style sup svg video].freeze
HTML_CONTAINERS = %w[article aside blockquote dd details div dl figure footer header li main nav ol section ul].freeze
HTML_BLOCKS = (HTML_CONTAINERS + %w[dt figcaption h1 h2 h3 h4 h5 h6 img p picture pre summary table]).freeze
KRAMDOWN_BLOCKS = %i[blockquote codeblock dl header hr ol p table ul].freeze
URL_PATTERN = %r{\b(?:https?://|www\.)[^\s<>]+}

Post = Struct.new(:path, :key, :lang, :title, :author, :body, :text, keyword_init: true) do
  def id = "#{key}/#{lang}"
  def url = "/#{AUDIO_DIR}/#{key}/#{lang}.mp3"
  def file = File.join(ROOT, AUDIO_DIR, key, "#{lang}.mp3")
  def voice = VOICES[lang].to_s

  def digest
    @digest ||= Digest::SHA256.hexdigest(JSON.generate([title, author, body]))[0, 16]
  end
end

class SpeechText
  def initialize(notes)
    @notes = notes
  end

  def paragraphs(markdown)
    root = Kramdown::Document.new(markdown, input: "GFM", hard_wrap: false).root
    out = []
    block(root, out)
    out
  end

  private

  def block(el, out)
    case el.type
    when :p
      if bare_url?(el)
        note(out, :links)
      elsif (images = only_images(el))
        images.each { |img| image(out, img.attr["alt"]) }
      else
        add(out, inline(el.children))
      end
    when :header, :dt
      add(out, inline(el.children), terminate: true)
    when :codeblock
      note(out, :code)
    when :table
      note(out, :table)
    when :html_element
      html_block(el, out)
    when :raw
      add(out, strip_tags(el.value))
    when :root, :blockquote, :ul, :ol, :li, :dl, :dd
      el.children.each { |child| block(child, out) }
    end
  end

  def html_block(el, out)
    return image(out, el.attr["alt"]) if el.value == "img"
    return image(out, el.children.find { |child| child.value == "img" }&.attr&.fetch("alt", nil)) if el.value == "picture"
    return if SILENT_HTML.include?(el.value)
    return note(out, :code) if el.value == "pre"
    return note(out, :table) if el.value == "table"
    return add(out, inline(el.children), terminate: el.value.match?(/\Ah[1-6]\z/)) unless HTML_CONTAINERS.include?(el.value)

    pending = []
    el.children.each do |child|
      if block_child?(child)
        add(out, inline(pending))
        pending.clear
        block(child, out)
      else
        pending << child
      end
    end
    add(out, inline(pending))
  end

  def block_child?(el)
    el.type == :html_element ? HTML_BLOCKS.include?(el.value) : KRAMDOWN_BLOCKS.include?(el.type)
  end

  def bare_url?(el)
    children = el.children.reject { |child| child.type == :text && child.value.strip.empty? }
    return false unless children.size == 1

    child = children.first
    child = child.children.first if child.type == :a && child.children.size == 1
    child.type == :text && child.value.strip.match?(/\A#{URL_PATTERN}\z/)
  end

  def only_images(el)
    children = el.children.reject { |child| child.type == :br || (child.type == :text && child.value.strip.empty?) }
    images = children.map { |child| child.type == :a && child.children.size == 1 ? child.children.first : child }
    images if images.any? && images.all? { |child| child.type == :img || (child.type == :html_element && child.value == "img") }
  end

  def image(out, alt)
    alt = alt.to_s.gsub(/\s+/, " ").strip.sub(/[.!?…]+\z/, "")
    alt.empty? ? note(out, :image) : add(out, @notes.fetch(:image_alt).gsub("%{description}", alt))
  end

  def inline(children)
    children.map { |child| span(child) }.join
  end

  def span(el)
    case el.type
    when :text then read_urls(el.value)
    when :codespan then el.value
    when :a then link(el)
    when :smart_quote then SMART_QUOTES.fetch(el.value, "")
    when :typographic_sym then TYPOGRAPHIC_SYMBOLS.fetch(el.value, "")
    when :entity then el.value.char
    when :br then " "
    when :raw then strip_tags(el.value)
    when :html_element then SILENT_HTML.include?(el.value) ? "" : inline(el.children)
    when :em, :strong, :abbreviation, :p then inline(el.children)
    else ""
    end
  end

  def link(el)
    label = inline(el.children).strip
    label.empty? ? host(el.attr["href"].to_s) : label
  end

  def read_urls(text)
    text.gsub(URL_PATTERN) do |url|
      tail = +""
      while url.match?(/[.,;:!?)]\z/) && (url[-1] != ")" || url.count(")") > url.count("("))
        tail.prepend(url[-1])
        url = url[0..-2]
      end
      host(url) + tail
    end
  end

  def host(url)
    url = "https://#{url}" unless url.match?(%r{\A[a-z]+://}i)
    URI.parse(url).host.to_s.delete_prefix("www.")
  rescue URI::InvalidURIError
    ""
  end

  def strip_tags(html)
    read_urls(CGI.unescapeHTML(html.gsub(/<[^>]*>/, " ")))
  end

  def add(out, text, terminate: false)
    text = text.gsub(/\s*\[\d+(?:\s*[,–-]\s*\d+)*\]/, "").tr("[]", "()").gsub(/\s+/, " ").strip
    return if text.empty?

    text += "." if terminate && !text.match?(/[.!?:;…]\z/)
    out << text
  end

  def note(out, kind)
    text = @notes.fetch(kind)
    out << text unless out.last == text
  end
end

class AudioGenerator
  def initialize(options)
    @options = options
    @translations = YAML.safe_load_file(TRANSLATIONS_PATH)
    @manifest = File.exist?(MANIFEST_PATH) ? (YAML.safe_load_file(MANIFEST_PATH) || {}) : {}
    @lock = Mutex.new
  end

  def run
    posts = load_posts
    pending = posts.select { |post| @options[:force] || stale?(post) }
    if @options[:since]
      changed = changed_paths(@options[:since])
      pending, waiting = pending.partition { |post| changed.include?(post.path) }
    end
    orphans = @options[:only] ? [] : orphaned_entries(posts)

    dump_text(posts) if @options[:text_dir]
    report(posts, pending, orphans, waiting || [])
    if pending.size > @options[:max]
      warn "Stopping: #{pending.size} posts to narrate, more than --max #{@options[:max]}. Nothing was sent " \
           "to ElevenLabs. Narrate them on purpose with --only, or raise --max."
      return 2
    end
    write_output("changes", pending.size + orphans.size)
    return 0 if @options[:dry_run] || (pending.empty? && orphans.empty?)

    preflight!(pending) unless pending.empty?
    orphans.each { |key, lang| remove(key, lang) }
    failures = generate(pending)
    save_manifest
    failures.empty? ? 0 : 1
  end

  private

  def load_posts
    posts = Dir.glob(POSTS_GLOB).sort.filter_map { |path| load_post(path) }
    if @options[:only]
      unknown = @options[:only] - posts.map(&:key)
      unless unknown.empty?
        abort "No post has the translation_key #{unknown.join(', ')}. Valid keys: #{posts.map(&:key).uniq.sort.join(', ')}"
      end
      posts = posts.select { |post| @options[:only].include?(post.key) }
    end

    duplicates = posts.group_by(&:id).select { |_, group| group.size > 1 }
    unless duplicates.empty?
      abort "Duplicate translation_key/lang pairs: " +
            duplicates.map { |id, group| "#{id} (#{group.map { |p| File.basename(p.path) }.join(', ')})" }.join("; ")
    end
    posts
  end

  def load_post(path)
    source = File.read(path, encoding: "UTF-8")
    match = source.match(/\A---\s*\n(.*?)\n---\s*\n/m) or return
    front = YAML.safe_load(match[1], permitted_classes: [Date, Time]) || {}
    return if front["audio"] == false || front["published"] == false

    lang = front["lang"].to_s
    unless VOICES.key?(lang)
      warn "Skipping #{relative(path)}: unsupported lang #{lang.inspect}"
      return
    end

    key = front["translation_key"] || File.basename(path, ".md").sub(/\A\d{4}-\d{2}-\d{2}-/, "")
    body = match.post_match.gsub("\r\n", "\n").strip
    post = Post.new(path: path, key: key, lang: lang, title: front["title"].to_s.strip, author: front["author"], body: body)
    post.text = speech_text(post, body)
    post
  end

  def speech_text(post, markdown)
    audio = @translations.fetch(post.lang).fetch("audio")
    notes = { code: audio.fetch("spoken_code"), table: audio.fetch("spoken_table"), links: audio.fetch("spoken_links"),
              image: audio.fetch("spoken_image"), image_alt: audio.fetch("spoken_image_alt") }
    body = SpeechText.new(notes).paragraphs(markdown)
    body.shift if normalize(body.first) == normalize(post.title)

    intro = [post.title.match?(/[.!?]\z/) ? post.title : "#{post.title}."]
    intro << audio.fetch("spoken_author").gsub("%{author}", post.author) if post.author
    intro << audio.fetch("spoken_disclosure")
    pronounce((intro + body).join("\n\n"), post.lang)
  end

  def pronounce(text, lang)
    (PRONUNCIATIONS[lang] || {}).reduce(text) do |result, (word, spoken)|
      result.gsub(/(?<![\p{Alnum}_])#{Regexp.escape(word)}(?![\p{Alnum}_])/, spoken)
    end
  end

  def normalize(text)
    text.to_s.downcase.gsub(/[^\p{Alnum}]+/, "")
  end

  def stale?(post)
    entry = @manifest.dig(post.key, post.lang)
    entry.nil? || entry["hash"] != post.digest || !File.exist?(post.file)
  end

  def orphaned_entries(posts)
    expected = posts.map { |post| [post.key, post.lang] }
    @manifest.flat_map { |key, langs| langs.keys.map { |lang| [key, lang] } } - expected
  end

  def report(posts, pending, orphans, waiting)
    characters = pending.sum { |post| post.text.length }
    puts "#{posts.size} posts, #{posts.size - pending.size - waiting.size} up to date, #{pending.size} to narrate " \
         "(#{characters} characters, ~#{(characters / 900.0).ceil} min of audio), #{orphans.size} to remove."
    pending.each { |post| puts "  narrate #{post.id} (#{post.text.length} chars) #{relative(post.path)}" }
    orphans.each { |key, lang| puts "  remove  #{key}/#{lang}" }
    return if waiting.empty?

    puts "#{waiting.size} other posts have no current audio but were not changed since #{@options[:since][0, 7]}; " \
         "they wait for a manual run."
  end

  def changed_paths(since)
    output, error, status = Open3.capture3("git", "-C", ROOT, "diff", "--name-only", "--no-renames", since, "HEAD",
                                           "--", "_posts")
    abort "Cannot list the posts changed since #{since}: #{error.strip}" unless status.success?

    output.lines.map { |line| File.join(ROOT, line.chomp) }
  end

  def dump_text(posts)
    posts.each do |post|
      path = File.join(@options[:text_dir], post.key, "#{post.lang}.txt")
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, "#{post.text}\n")
    end
  end

  def preflight!(pending)
    load_api_key!
    missing = pending.map(&:lang).uniq.select { |lang| VOICES[lang].to_s.empty? }
    abort "No voice set in script/narration.yml for: #{missing.join(', ')}" unless missing.empty?

    begin
      _, status = Open3.capture2e("ffmpeg", "-version")
      abort "ffmpeg did not run correctly." unless status.success?
    rescue Errno::ENOENT
      abort "ffmpeg is not installed."
    end

    pending.map(&:lang).uniq.sort.each { |lang| check_voice!(lang) }
  end

  def load_api_key!
    key = ENV.delete("ELEVENLABS_API_KEY").to_s.strip
    if key.empty? && (path = ENV["ELEVENLABS_API_KEY_FILE"].to_s) != ""
      key = File.read(File.expand_path(path)).strip
    end
    abort "Set ELEVENLABS_API_KEY or ELEVENLABS_API_KEY_FILE." if key.empty?

    @api_key = key
  rescue SystemCallError => e
    abort "Could not read ELEVENLABS_API_KEY_FILE (#{e.class})."
  end

  def check_voice!(lang)
    response = api_request(Net::HTTP::Get, "voices/#{VOICES[lang]}")
    case response
    when Net::HTTPSuccess
      voice = JSON.parse(response.body)
      labels = (voice["labels"] || {}).values_at("language", "accent").compact.join(", ")
      puts "Voice #{lang}: #{voice['name']}#{" (#{labels})" unless labels.empty?}"
    when Net::HTTPUnauthorized, Net::HTTPForbidden
      abort "ElevenLabs rejected the API key (HTTP #{response.code})."
    else
      warn "Could not look up the #{lang} voice (HTTP #{response.code}); trying it anyway."
    end
  end

  def api_request(type, path, body = nil)
    uri = URI("#{API_BASE}/#{path}")
    request = type.new(uri, "xi-api-key" => @api_key, "Content-Type" => "application/json")
    request.body = body if body
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", read_timeout: 300) do |http|
      http.request(request)
    end
  end

  def redact(text)
    @api_key ? text.to_s.gsub(@api_key, "[redacted]") : text.to_s
  end

  def generate(posts)
    queue = Queue.new
    posts.each { |post| queue << post }
    failures = []

    workers = Array.new([@options[:jobs], posts.size].min) do
      Thread.new do
        while (post = (queue.pop(true) rescue nil))
          begin
            record(post, narrate(post))
          rescue StandardError => e
            @lock.synchronize { failures << post }
            warn "Failed #{post.id}, nothing published for it: #{e.class}: #{redact(e.message)}"
          end
        end
      end
    end
    workers.each(&:join)
    failures
  end

  def narrate(post)
    started = Time.now
    parts = chunks(post.text)
    request_ids = []
    pcm = parts.each_with_index.map do |chunk, index|
      previous = request_ids.last(3)
      context = { previous_request_ids: previous,
                  previous_text: previous.empty? && index.positive? ? closing(parts[index - 1]) : nil,
                  future_text: parts[index + 1] && opening(parts[index + 1]) }
      audio, request_id = synthesize(post, chunk, context)
      request_ids << request_id if request_id
      decode(audio)
    end.join(CHUNK_GAP)
    encode(post, pcm)
    duration = pcm.bytesize.fdiv(BYTES_PER_SECOND).round
    puts "Narrated #{post.id}: #{duration}s of audio in #{(Time.now - started).round}s"
    duration
  end

  def chunks(text)
    pieces = text.split("\n\n").flat_map { |paragraph| split_long(paragraph) }
    pieces.each_with_object([]) do |piece, out|
      if out.empty? || out.last.length + piece.length + 2 > CHUNK_LIMIT
        out << piece.dup
      else
        out.last << "\n\n" << piece
      end
    end
  end

  def split_long(paragraph)
    return [paragraph] if paragraph.length <= CHUNK_LIMIT

    sentences = paragraph.split(/(?<=[.!?…;:])\s+/)
                         .flat_map { |sentence| sentence.length > CHUNK_LIMIT ? sentence.scan(/.{1,#{CHUNK_LIMIT}}(?:\s|\z)/m) : [sentence] }
    sentences.each_with_object([]) do |sentence, out|
      if out.empty? || out.last.length + sentence.length + 1 > CHUNK_LIMIT
        out << sentence.strip.dup
      else
        out.last << " " << sentence.strip
      end
    end
  end

  def opening(text)
    return text if text.length <= CONTEXT_LIMIT

    text[0, CONTEXT_LIMIT + 1][/\A.*(?=\s)/m]&.rstrip || text[0, CONTEXT_LIMIT]
  end

  def closing(text)
    return text if text.length <= CONTEXT_LIMIT

    text[-(CONTEXT_LIMIT + 1)..][/(?<=\s).*\z/m]&.lstrip || text[-CONTEXT_LIMIT..]
  end

  def synthesize(post, text, context, attempt: 1)
    body = { inputs: [{ text: text, voice_id: post.voice }], model_id: MODEL, language_code: post.lang,
             settings: SETTINGS, **context }
    response = api_request(Net::HTTP::Post, "text-to-dialogue?output_format=#{OUTPUT_FORMAT}",
                           JSON.generate(body.reject { |_, value| value.nil? || value == [] }))
    return [response.body.b, response["request-id"]] if response.is_a?(Net::HTTPSuccess)

    message = redact("HTTP #{response.code}: #{response.body.to_s[0, 300]}")
    raise message unless retryable?(response) && attempt < 5

    retry_after(response, attempt, message)
    synthesize(post, text, context, attempt: attempt + 1)
  rescue Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET, OpenSSL::SSL::SSLError => e
    raise if attempt >= 5

    retry_after(nil, attempt, e.class.to_s)
    synthesize(post, text, context, attempt: attempt + 1)
  end

  def retryable?(response)
    response.code == "429" || response.code.start_with?("5")
  end

  def retry_after(response, attempt, reason)
    delay = response&.[]("retry-after").to_f
    delay = 2**attempt if delay <= 0
    warn "Retrying in #{delay}s (#{reason})"
    sleep delay
  end

  PCM_FORMAT = ["-f", "s16le", "-ar", SAMPLE_RATE.to_s, "-ac", "1"].freeze
  PCM_INPUT = [*PCM_FORMAT, "-i", "pipe:0"].freeze

  def decode(mp3)
    pcm, error, status = Open3.capture3(
      "ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "mp3", "-i", "pipe:0", *PCM_FORMAT, "pipe:1",
      stdin_data: mp3, binmode: true
    )
    raise "ffmpeg could not decode the narration: #{error.lines.last(3).join.strip}" unless status.success? && !pcm.empty?

    pcm
  end

  def encode(post, pcm)
    FileUtils.mkdir_p(File.dirname(post.file))
    partial = "#{post.file}.partial"
    _, error, status = Open3.capture3(
      "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *PCM_INPUT,
      "-af", "#{loudnorm(pcm)}:linear=true", "-ar", SAMPLE_RATE.to_s,
      "-codec:a", "libmp3lame", "-b:a", BITRATE, "-id3v2_version", "3",
      "-metadata", "title=#{post.title}",
      "-metadata", "artist=#{post.author || 'LESIS'}",
      "-metadata", "album=LESIS Blog",
      "-metadata", "comment=AI-generated narration (ElevenLabs #{MODEL})",
      "-f", "mp3", partial,
      stdin_data: pcm, binmode: true
    )
    raise "ffmpeg failed: #{error}" unless status.success?

    File.rename(partial, post.file)
  ensure
    FileUtils.rm_f(partial) if partial
  end

  def loudnorm(pcm)
    _, output, status = Open3.capture3(
      "ffmpeg", "-hide_banner", "-nostats", *PCM_INPUT,
      "-af", "loudnorm=#{LOUDNORM}:print_format=json", "-f", "null", "-",
      stdin_data: pcm, binmode: true
    )
    raise "ffmpeg loudness analysis failed: #{output.lines.last(5).join}" unless status.success?

    report = output[/^\[Parsed_loudnorm[^\n]*\n(\{.*?\})/m, 1] or raise "loudnorm printed no measurement"
    measured = JSON.parse(report)
    unless measured["input_i"].to_s.match?(/\A-?\d+(?:\.\d+)?\z/)
      raise "the narration came back silent or too short to measure (#{measured['input_i']} LUFS)"
    end

    "loudnorm=#{LOUDNORM}:measured_I=#{measured['input_i']}:measured_TP=#{measured['input_tp']}" \
      ":measured_LRA=#{measured['input_lra']}:measured_thresh=#{measured['input_thresh']}" \
      ":offset=#{measured['target_offset']}"
  end

  def record(post, duration)
    @lock.synchronize do
      (@manifest[post.key] ||= {})[post.lang] = {
        "url" => post.url,
        "hash" => post.digest,
        "duration" => duration,
        "size" => File.size(post.file),
        "model" => MODEL,
        "voice" => post.voice,
        "generated_at" => Time.now.utc.iso8601
      }
      save_manifest
    end
  end

  def remove(key, lang)
    FileUtils.rm_f(File.join(ROOT, AUDIO_DIR, key, "#{lang}.mp3"))
    dir = File.join(ROOT, AUDIO_DIR, key)
    Dir.rmdir(dir) if Dir.exist?(dir) && Dir.empty?(dir)
    @manifest[key].delete(lang)
    @manifest.delete(key) if @manifest[key].empty?
    puts "Removed #{key}/#{lang}"
  end

  def save_manifest
    return if @manifest.empty? && !File.exist?(MANIFEST_PATH)

    sorted = @manifest.sort.to_h { |key, langs| [key, langs.sort.to_h] }
    File.write(MANIFEST_PATH, "# Generated by script/generate_audio.rb. Do not edit by hand.\n" +
                              YAML.dump(sorted).delete_prefix("---\n"))
  end

  def write_output(name, value)
    return unless ENV["GITHUB_OUTPUT"]

    File.write(ENV["GITHUB_OUTPUT"], "#{name}=#{value}\n", mode: "a")
  end

  def relative(path)
    path.delete_prefix("#{ROOT}/")
  end
end

options = { dry_run: false, force: false, jobs: 3, max: DEFAULT_MAX, only: nil, since: nil, text_dir: nil }
OptionParser.new do |parser|
  parser.banner = "Usage: script/generate_audio.rb [options]"
  parser.on("--dry-run", "List what would change without calling the API or writing files") { options[:dry_run] = true }
  parser.on("--force", "Narrate again even when the audio is up to date") { options[:force] = true }
  parser.on("--max N", Integer, "Stop without narrating if more than N posts need it (default #{DEFAULT_MAX})") do |n|
    options[:max] = [n, 0].max
  end
  parser.on("--since SHA", /\A\h{7,40}\z/, "Only posts changed between this commit and HEAD") do |sha|
    options[:since] = sha
  end
  parser.on("--only KEYS", Array, "Only these translation_keys (comma separated)") { |keys| options[:only] = keys.map(&:strip).reject(&:empty?) }
  parser.on("--jobs N", Integer, "Posts narrated in parallel (default 3)") { |n| options[:jobs] = [n, 1].max }
  parser.on("--text-dir DIR", "Write the spoken text of every post to DIR for review") do |dir|
    options[:text_dir] = File.expand_path(dir)
  end
end.parse!

exit AudioGenerator.new(options).run
