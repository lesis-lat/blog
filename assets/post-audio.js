(function () {
  var SPEEDS = [1, 1.25, 1.5, 1.75, 2];
  var SPEED_KEY = 'post-audio-speed';

  function formatTime(seconds) {
    var total = Math.max(0, Math.floor(seconds || 0));
    var rest = total % 60;
    return Math.floor(total / 60) + ':' + (rest < 10 ? '0' : '') + rest;
  }

  function formatSpeed(speed) {
    return speed.toLocaleString(document.documentElement.lang || undefined) + '×';
  }

  function readSpeed() {
    try {
      var saved = parseFloat(window.localStorage.getItem(SPEED_KEY));
      return SPEEDS.indexOf(saved) === -1 ? 1 : saved;
    } catch (error) {
      return 1;
    }
  }

  function saveSpeed(speed) {
    try {
      window.localStorage.setItem(SPEED_KEY, String(speed));
    } catch (error) {
    }
  }

  function setupPlayer(root) {
    var audio = root.querySelector('audio');
    var player = root.querySelector('.post-audio-player');
    var toggle = root.querySelector('[data-post-audio-toggle]');
    var seek = root.querySelector('[data-post-audio-seek]');
    var current = root.querySelector('[data-post-audio-current]');
    var speedButton = root.querySelector('[data-post-audio-speed]');
    if (!audio || !player || !toggle || !seek || !current || !speedButton) {
      return;
    }

    var duration = parseFloat(seek.max) || 0;
    var dragging = false;

    function renderState() {
      var playing = !audio.paused && !audio.ended;
      root.classList.toggle('is-playing', playing);
      toggle.setAttribute('aria-label', playing ? toggle.dataset.labelPause : toggle.dataset.labelPlay);
    }

    function renderTime(seconds) {
      current.textContent = formatTime(seconds);
      seek.setAttribute('aria-valuetext', formatTime(seconds) + ' / ' + formatTime(duration));
    }

    function setSpeed(speed) {
      audio.defaultPlaybackRate = speed;
      audio.playbackRate = speed;
      speedButton.textContent = formatSpeed(speed);
      speedButton.setAttribute('aria-label', speedButton.dataset.label + ' ' + formatSpeed(speed));
    }

    toggle.addEventListener('click', function () {
      if (!audio.paused) {
        audio.pause();
        return;
      }

      var playback = audio.play();
      if (playback && playback.catch) {
        playback.catch(renderState);
      }
    });

    seek.addEventListener('input', function () {
      dragging = true;
      renderTime(seek.value);
    });

    seek.addEventListener('change', function () {
      audio.currentTime = parseFloat(seek.value);
      dragging = false;
    });

    speedButton.addEventListener('click', function () {
      var next = SPEEDS[(SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length];
      setSpeed(next);
      saveSpeed(next);
    });

    audio.addEventListener('loadedmetadata', function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        duration = audio.duration;
        seek.max = String(duration);
      }
    });

    audio.addEventListener('timeupdate', function () {
      if (!dragging) {
        seek.value = String(audio.currentTime);
        renderTime(audio.currentTime);
      }
    });

    audio.addEventListener('play', function () {
      renderState();
      if ('mediaSession' in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: root.dataset.title,
          artist: root.dataset.artist,
          album: 'LESIS Blog',
          artwork: root.dataset.artwork ? [{ src: root.dataset.artwork }] : []
        });
      }
    });
    audio.addEventListener('pause', renderState);
    audio.addEventListener('ended', renderState);
    audio.addEventListener('error', function () {
      audio.pause();
      root.hidden = true;
    });

    setSpeed(readSpeed());
    renderTime(0);
    audio.removeAttribute('controls');
    audio.hidden = true;
    player.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-post-audio]').forEach(setupPlayer);
  });
})();
