source "https://rubygems.org"

gem "jekyll", "~> 4.4"
gem "webrick"

group :jekyll_plugins do
  gem "jekyll-sitemap"
end

install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
  gem "tzinfo", "~> 2.0"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.2.0", :install_if => Gem.win_platform?
