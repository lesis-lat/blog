(function () {
  var path = window.location.pathname;
  var lang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (/^\/en(\/|$)/.test(path)) lang = 'en';
  if (/^\/es(\/|$)/.test(path)) lang = 'es';

  var message = document.querySelector('[data-not-found-lang="' + lang + '"]');
  if (message) {
    document.querySelectorAll('[data-not-found-lang]').forEach(function (item) {
      item.hidden = item !== message;
    });
    document.documentElement.lang = message.lang;
  }

  function normalizePath(value) {
    if (!value) return '/';
    var normalized = value;
    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/, '');
    }
    return normalized;
  }

  function addCandidate(map, legacyPath, targetPath) {
    if (!legacyPath || !targetPath) return;
    var legacy = normalizePath(legacyPath);
    if (legacy === normalizePath(targetPath)) return;
    if (!map[legacy]) map[legacy] = targetPath;
    if (!legacy.endsWith('.html')) {
      map[legacy + '.html'] = targetPath;
    }
    if (!legacy.endsWith('/')) {
      map[legacy + '/'] = targetPath;
    }
  }

  var source = document.getElementById('not-found-redirects');
  var entries = [];
  try {
    entries = source ? JSON.parse(source.textContent) : [];
  } catch (error) {
    entries = [];
  }

  var redirects = {};
  entries.forEach(function (entry) {
    (entry.legacy || []).forEach(function (legacy) {
      addCandidate(redirects, legacy, entry.target);
    });
  });

  var target = redirects[normalizePath(path)];
  if (target) {
    window.location.replace(target);
  }
})();
