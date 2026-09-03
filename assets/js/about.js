// about.js
// Shared SPA loader for About and Work fragments with matching slide animation.
(function () {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  const root = document.getElementById('mainContent');
  if (!root) {
    window.openAbout = function () { window.location.href = '/about'; };
    window.openWork = function () { window.location.href = '/work'; };
    window.openContact = function () { window.location.href = '/contact'; };
    window.openGateMg = function () { window.location.href = '/work/gate-mg'; };
    window.openGateRedbull = function () { window.location.href = '/work/gate-redbull'; };
    window.closeSpaPage = function () { window.history.back(); };
    window.closeAbout = window.closeSpaPage;
    window.closeWork = window.closeSpaPage;
    window.closeContact = window.closeSpaPage;
    window.closeGateMg = window.closeSpaPage;
    window.closeGateRedbull = window.closeSpaPage;
    return;
  }

  let originalHTML = root.innerHTML;
  let originalScroll = 0;
  let currentPage = null;
  let closingViaHistory = false;

  function bindSpaTargetLinks(scope) {
    if (!scope) return;
    const links = scope.querySelectorAll('[data-spa-target]');
    links.forEach((link) => {
      if (link.dataset.spaBound === '1') return;
      link.dataset.spaBound = '1';
      link.addEventListener('click', (event) => {
        const target = link.getAttribute('data-spa-target');
        if (!target) return;
        
        // Bypass SPA for work projects, let default navigation handle it
        if (target.startsWith('work/')) {
          return;
        }

        event.preventDefault();
        if (target === 'about') {
          loadPage('about', true);
          return;
        }
        if (target === 'work') {
          loadPage('work', true);
          return;
        }
        if (target === 'contact') {
          loadPage('contact', true);
          return;
        }
      });
    });
  }

  // Persist scroll position across full-page reloads so we can restore after replacing DOM
  window.addEventListener('beforeunload', () => {
    try {
      const data = { path: location.pathname || '', y: window.scrollY || window.pageYOffset || 0 };
      sessionStorage.setItem('spa-scroll', JSON.stringify(data));
    } catch (e) { }
  });

  // Wait for all <link rel="stylesheet"> elements inside a container to finish loading.
  // Resolves immediately if none are found or all are already loaded.
  function waitForFragmentStyles(container, timeout) {
    timeout = timeout || 3000;
    var links = Array.from(container.querySelectorAll('link[rel="stylesheet"]'));
    if (!links.length) return Promise.resolve();
    var promises = links.map(function (link) {
      // Already loaded (sheet is available)
      if (link.sheet) return Promise.resolve();
      return new Promise(function (resolve) {
        var done = false;
        function finish() { if (!done) { done = true; resolve(); } }
        link.addEventListener('load', finish);
        link.addEventListener('error', finish);
        // Safety timeout so we never block indefinitely
        setTimeout(finish, timeout);
      });
    });
    return Promise.all(promises);
  }

  function loadPage(pageName, pushState = true) {
    if (currentPage === pageName) return Promise.resolve();

    const token = Symbol(pageName);
    loadPage._token = token;

    // Prevent FOUC on SPA-triggered page navigation.
    if (pushState && (pageName === 'about' || pageName === 'work' || pageName === 'contact' || pageName.startsWith('work/'))) {
      try {
        document.documentElement.classList.add('spa-loading');
        document.body.classList.add('spa-loading');
      } catch (e) { }
    }

    const scriptEl = document.querySelector('script[src*="about.js"]');
    let absolutePrefix = '/';
    if (scriptEl && scriptEl.src) {
      try {
        const url = new URL(scriptEl.src, window.location.href);
        const match = url.pathname.match(/^(.*)\/assets\/js\/about\.js/i);
        if (match) {
          absolutePrefix = match[1] + '/';
        }
      } catch (e) {}
    }

    const isWorkProject = pageName.startsWith('work/');
    const fetchUrl = isWorkProject ? `${absolutePrefix}${pageName}.html` : `${absolutePrefix}${pageName}-content.html`;

    return fetch(fetchUrl, { cache: 'no-store' })
      .then(r => r.text())
      .then(html => {
        if (loadPage._token !== token) return;

        let contentHtml = html;
        if (isWorkProject) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const mainContentEl = doc.getElementById('mainContent');
          if (mainContentEl) {
            contentHtml = mainContentEl.innerHTML;
          }
        }

        if (!currentPage) {
          originalHTML = root.innerHTML;
          originalScroll = window.scrollY || window.pageYOffset || 0;
        }

        root.classList.remove('page-exit');
        root.classList.remove('page-enter');
        root.innerHTML = contentHtml;

        // Rewrite relative paths in the loaded fragment using the absolute prefix
        if (absolutePrefix) {
          root.querySelectorAll('img[src], video[src], source[src], video[poster], video[data-fallback], iframe[data-fallback]').forEach(el => {
            if (el.hasAttribute('src')) {
              const srcVal = el.getAttribute('src');
              if (srcVal && !srcVal.startsWith('http') && !srcVal.startsWith('data:')) {
                try { el.setAttribute('src', new URL(srcVal, window.location.origin + absolutePrefix).pathname); } catch(e){}
              }
            }
            const posterVal = el.getAttribute('poster');
            if (posterVal && !posterVal.startsWith('http') && !posterVal.startsWith('data:')) {
              try { el.setAttribute('poster', new URL(posterVal, window.location.origin + absolutePrefix).pathname); } catch(e){}
            }
            const fallbackVal = el.getAttribute('data-fallback');
            if (fallbackVal && !fallbackVal.startsWith('http') && !fallbackVal.startsWith('data:')) {
              try { el.setAttribute('data-fallback', new URL(fallbackVal, window.location.origin + absolutePrefix).pathname); } catch(e){}
            }
          });

          root.querySelectorAll('a[href], link[href]').forEach(el => {
            const hrefVal = el.getAttribute('href');
            if (hrefVal && !hrefVal.startsWith('http') && !hrefVal.startsWith('mailto:') && !hrefVal.startsWith('javascript:') && !hrefVal.startsWith('#')) {
              try { el.setAttribute('href', new URL(hrefVal, window.location.origin + absolutePrefix).pathname); } catch(e){}
            }
          });
        }

        bindSpaTargetLinks(root);

        if (document.body) {
          document.body.dataset.sitePage = pageName;
        }

        if (typeof window.applySiteLanguage === 'function') {
          window.applySiteLanguage(root, pageName);
        }

        if (typeof window.initEmbeddedMediaFallback === 'function') {
          window.initEmbeddedMediaFallback(root);
        }
        if (typeof window.initLazyIframes === 'function') {
          window.initLazyIframes(root);
        }

        if (typeof window.initWorkMediaFallback === 'function') {
          window.initWorkMediaFallback(root);
        }

        document.body.classList.remove('spa-about', 'spa-work', 'spa-contact', 'spa-gate-mg', 'spa-gate_mg', 'spa-gate-redbull', 'spa-gate_redbull');
        document.body.className = document.body.className.replace(/\bspa-work-\S+/g, '');
        document.body.classList.add(`spa-${pageName.replace('/', '-')}`);

        requestAnimationFrame(() => root.classList.add('page-enter'));
        // Reset scroll position to top when switching pages
        const resetScroll = () => {
          window.scrollTo(0, 0);
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        };
        resetScroll();
        requestAnimationFrame(() => {
          resetScroll();
          setTimeout(resetScroll, 10);
          setTimeout(resetScroll, 50);
          setTimeout(resetScroll, 100);
          setTimeout(resetScroll, 300); // extra wait for heavy pages
        });
        // We no longer reset scroll on animationend because long animations (like 3s for gate projects) 
        // will snap the user back to the top if they've already started scrolling.
        root.addEventListener('animationend', function onEnterEnd() {
          root.removeEventListener('animationend', onEnterEnd);
        }, { once: true });

        // Trigger GSAP text transition animations synchronously before paint
        // to prevent flash (GSAP sets initial opacity:0 before browser renders)
        if (typeof window.initSpaPageAnimations === 'function') {
          window.initSpaPageAnimations(pageName);
        }
        currentPage = pageName;

        // Reveal page only after injected stylesheets (e.g. gate-mg.css) are parsed,
        // to prevent a flash of unstyled content.
        if (pushState) {
          waitForFragmentStyles(root, 3000).then(function () {
            requestAnimationFrame(function () {
              try {
                window.scrollTo(0, 0);
                if (document.documentElement) document.documentElement.scrollTop = 0;
                if (document.body) document.body.scrollTop = 0;
                document.documentElement.classList.remove('spa-loading');
                document.body.classList.remove('spa-loading');
              } catch (e) { }
            });
          });
        }



        const closeBtn = document.getElementById(`${pageName}CloseBtn`);
        if (closeBtn) closeBtn.addEventListener('click', () => closePage(true));

        if (pushState && window.history && window.history.pushState) {
          try {
            const lang = (window.getCurrentSiteLanguage && window.getCurrentSiteLanguage()) || 'en';
            const prefix = lang === 'zh' ? '/zh' : '';
            window.history.pushState({ spa: pageName }, '', `${prefix}/${pageName}`);
            window.dispatchEvent(new CustomEvent('spa-navigation-changed', { detail: { page: pageName, lang } }));
          } catch (e) { }
        }
      })
      .catch(err => {
        console.error(`Failed to load ${pageName}.html, falling back to full navigation`, err);
        window.location.href = `/${pageName}`;
      });
  }

  function closePage(replaceState = true) {
    if (!currentPage) return;

    const pageName = currentPage;
    if (replaceState && window.history && window.history.state && window.history.state.spa === pageName) {
      closingViaHistory = true;
    }

    root.classList.remove('page-enter');
    root.classList.add('page-exit');
    root.addEventListener('animationend', function handler() {
      root.removeEventListener('animationend', handler);
      root.classList.remove('page-exit');
      root.innerHTML = originalHTML;
      document.body.classList.remove('spa-about', 'spa-work', 'spa-contact', 'spa-gate-mg', 'spa-gate_mg');
      document.body.className = document.body.className.replace(/\bspa-work-\S+/g, '');
      if (document.body) {
        document.body.dataset.sitePage = 'home';
      }
      if (typeof window.applySiteLanguage === 'function') {
        window.applySiteLanguage(root, 'home');
      }
      window.scrollTo({ top: originalScroll });
      try { document.documentElement.classList.remove('spa-loading'); document.body.classList.remove('spa-loading'); } catch (e) { }

      // Re-initialize home page GSAP animations after restoring DOM
      if (typeof window.initHomeAnimations === 'function') {
        requestAnimationFrame(() => window.initHomeAnimations());
      }
      currentPage = null;
    });

    if (replaceState && window.history && window.history.state && window.history.state.spa === pageName) {
      try { window.history.back(); } catch (e) { }
    }
  }

  window.addEventListener('popstate', (e) => {
    if (closingViaHistory) {
      closingViaHistory = false;
      return;
    }

    const state = e.state || {};
    if (state.spa === 'about' || state.spa === 'work' || state.spa === 'contact') {
      loadPage(state.spa, false);
    } else if (currentPage) {
      closePage(false);
    }
  });

  window.openAbout = function () { return loadPage('about', true); };
  window.openWork = function () { return loadPage('work', true); };
  window.openContact = function () { return loadPage('contact', true); };
  window.openGateMg = function () { window.location.href = '/work/gate-mg'; };
  window.openGateRedbull = function () { window.location.href = '/work/gate-redbull'; };
  window.loadPage = loadPage;
  window.closeSpaPage = closePage;
  window.closeAbout = closePage;
  window.closeWork = closePage;
  window.closeContact = closePage;
  window.closeGateMg = closePage;
  window.closeGateRedbull = closePage;

  // Load SPA fragment from URL path on initial load (so refresh keeps current view)
  function loadFromPath() {
    const path = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const isZh = path.startsWith('zh');
    const page = (isZh ? path.replace(/^zh\/?/, '') : path).toLowerCase();

    if (page === 'about' || page === 'work' || page === 'contact') {
      if (document.body) {
        document.body.dataset.sitePage = page;
      }
      if (window.history && window.history.replaceState) {
        try {
          window.history.replaceState({ spa: page }, '', window.location.pathname);
        } catch (e) { }
      }
      // load without pushing a new history entry
      loadPage(page, false).then(() => {
        // Wait for images/videos then poll the fragment height until stable,
        // then restore scroll and reveal the fragment.
        const waitForMedia = (container, timeout = 800) => {
          try {
            const imgs = Array.from(container.querySelectorAll('img'));
            const vids = Array.from(container.querySelectorAll('video'));
            const promises = [];
            imgs.forEach(img => {
              if (img.complete) return;
              promises.push(new Promise(res => { img.addEventListener('load', res); img.addEventListener('error', res); }));
            });
            vids.forEach(v => {
              if (v.readyState >= 2) return;
              promises.push(new Promise(res => { v.addEventListener('loadedmetadata', res); v.addEventListener('error', res); }));
            });
            if (promises.length === 0) return Promise.resolve();
            return Promise.race([Promise.all(promises), new Promise(res => setTimeout(res, timeout))]);
          } catch (e) { return Promise.resolve(); }
        };

        const waitForStableHeight = (container, options = {}) => {
          const interval = options.interval || 100;
          const timeout = options.timeout || 1200;
          return new Promise(resolve => {
            let last = container.scrollHeight;
            let stableCount = 0;
            const start = Date.now();
            const t = setInterval(() => {
              const nowH = container.scrollHeight;
              if (nowH === last) {
                stableCount += 1;
              } else {
                stableCount = 0;
                last = nowH;
              }
              // consider stable if unchanged for two consecutive checks
              if (stableCount >= 2) {
                clearInterval(t);
                resolve();
              }
              if (Date.now() - start > timeout) {
                clearInterval(t);
                resolve();
              }
            }, interval);
          });
        };

        waitForMedia(root, 1000).then(() => waitForStableHeight(root, { interval: 120, timeout: 1600 })).then(() => {
          try {
            const raw = sessionStorage.getItem('spa-scroll');
            if (raw) {
              const obj = JSON.parse(raw);
              if ((obj.path || '') === (location.pathname || '')) {
                window.scrollTo({ top: obj.y });
                sessionStorage.removeItem('spa-scroll');
              }
            }
          } catch (e) { }
          try { document.documentElement.classList.remove('spa-loading'); document.body.classList.remove('spa-loading'); } catch (e) { }
        });
      });
    }
  }

  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFromPath);
  } else {
    loadFromPath();
  }

  bindSpaTargetLinks(document);

})();
