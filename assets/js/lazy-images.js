// Lazy-load images using IntersectionObserver
(function () {
  function loadImg(img) {
    if (img._loaded) return;
    var src = img.getAttribute('data-src');
    if (!src) return;
    img.src = src;
    img.removeAttribute('data-src');
    img._loaded = true;
  }

  function init() {
    var imgs = document.querySelectorAll('img.lazy-img');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            loadImg(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, {rootMargin: '200px 0px'});
      imgs.forEach(function (img) { io.observe(img); });
    } else {
      // fallback: load after DOM ready
      imgs.forEach(function (img) { loadImg(img); });
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
