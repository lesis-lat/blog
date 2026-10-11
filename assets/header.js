(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var frame = null;
  function update() {
    frame = null;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', function () {
    if (frame === null) frame = requestAnimationFrame(update);
  }, { passive: true });
  update();

  var nav = header.querySelector('.site-nav');
  var toggle = header.querySelector('[data-menu-toggle]');
  if (!nav || !toggle) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (nav.classList.contains('is-open') && !nav.contains(event.target)) {
      setOpen(false);
    }
  });
})();
