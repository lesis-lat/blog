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
})();
