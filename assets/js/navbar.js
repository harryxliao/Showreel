document.addEventListener("DOMContentLoaded", function() {

  // mark that JS has initialized so CSS can reveal interactive UI without flashing
  try { document.body.classList.add('js-ready'); } catch(e){}

  // --- 1. 背景影片播放防護 ---
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo && typeof heroVideo.play === 'function') {
    let playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => console.warn("影片自動播放被阻擋:", error));
    }
  }

  // --- 2. 桌面版選單互動 ---
  const menuLinks = document.querySelectorAll('.main-menu-link');
  // 選取所有 Logo (含桌面與手機)
  const logoLinks = document.querySelectorAll('.logo-link'); 
  const mobileMenu = document.getElementById('mobileMenu');
  const openMenuBtn = document.getElementById('openMenuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const langToggles = document.querySelectorAll('[data-lang-toggle]');

  function getCurrentPageName() {
    const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const isZh = path.startsWith('zh');
    const page = isZh ? path.replace(/^zh\/?/, '') : path;
    if (page === 'about' || page === 'work' || page === 'contact' || page.startsWith('work/')) {
      return page;
    }
    return (document.body && document.body.dataset.sitePage) || 'home';
  }

  function updateDesktopMenu(clickedLink) {
    menuLinks.forEach(item => {
      item.classList.remove('active');
    });
    if (clickedLink && clickedLink.classList.contains('main-menu-link')) {
      clickedLink.classList.add('active');
    }

    if (typeof window.applySiteLanguage === 'function') {
      window.applySiteLanguage(document, getCurrentPageName());
    }
  }

  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      updateDesktopMenu(this);
      // 【修改文字： console 輸出改為 Harry Liao 相關】
      const href = this.getAttribute('href');
      console.log('桌面選單準備切換，目標網址:', href);
      let page = '';
      if (href === '/' || href === '/index.html' || href === '/zh' || href === '/zh/' || href === '/zh/index.html') {
        page = '';
      } else if (href && href.startsWith('/')) {
        const cleanPath = href.replace(/^\/+/, '').replace(/\/+$/, '');
        page = cleanPath.startsWith('zh') ? cleanPath.replace(/^zh\/?/, '') : cleanPath;
      }

      if (page === 'about') { if (window.openAbout) { window.openAbout(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/about' : '/about'; } return; }
      if (page === 'work') { if (window.openWork) { window.openWork(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/work/' : '/work/'; } return; }
      if (page === 'contact') { if (window.openContact) { window.openContact(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/contact' : '/contact'; } return; }
      if (page.startsWith('work/')) { 
        const isZh = window.location.pathname.startsWith('/zh');
        window.location.href = isZh ? '/zh/' + page : '/' + page; 
        return; 
      }
      // If desktop Home clicked, navigate to the real index page
      if (page === '') { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/' : '/'; return; }
      // 其他路由仍保留預設行為（可自行改為 client-side 路由）
    });
  });

  // 點擊 Logo 回首頁
  logoLinks.forEach(logo => {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      // If this logo is inside the mobile menu, always go to the real index page
      if (mobileMenu && mobileMenu.contains(this)) {
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
        window.location.href = '/';
        return;
      }

      const homeLink = document.querySelector('.main-menu-link[href="/#"]') || document.querySelector('.main-menu-link[href="/"]');
      if (homeLink) {
        updateDesktopMenu(homeLink);
      }
      // Desktop logo should go to the real index
      window.location.href = '/';
      // 【修改文字： console 輸出改為 Harry Liao 相關】
      console.log('Logo 點擊，準備切換回首頁:', this.getAttribute('href'));
    });
  });

  if (typeof window.applySiteLanguage === 'function') {
    window.applySiteLanguage(document, getCurrentPageName());
  }

  // --- 3. 手機版全螢幕選單互動 ---

  // 開啟選單
  if (openMenuBtn && mobileMenu) {
    openMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden'; // 鎖定背景滾動
    });
  }

  // 關閉選單
  if (closeMenuBtn && mobileMenu) {
    closeMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = ''; // 恢復背景滾動
    });
  }

  // 手機版選單切換（使用與桌面相同的 href 解析）
  mobileLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      mobileLinks.forEach(item => item.classList.remove('active'));
      this.classList.add('active');
      const href = this.getAttribute('href');
      console.log('手機選單點擊，目標:', href);

      let page = '';
      if (href === '/' || href === '/index.html' || href === '/zh' || href === '/zh/' || href === '/zh/index.html') {
        page = '';
      } else if (href && href.startsWith('/')) {
        const cleanPath = href.replace(/^\/+/, '').replace(/\/+$/, '');
        page = cleanPath.startsWith('zh') ? cleanPath.replace(/^zh\/?/, '') : cleanPath;
      }

      if (page === 'about') { if (window.openAbout) { window.openAbout(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/about' : '/about'; } mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; return; }
      if (page === 'work') { if (window.openWork) { window.openWork(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/work/' : '/work/'; } mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; return; }
      if (page === 'contact') { if (window.openContact) { window.openContact(); } else { window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/contact' : '/contact'; } mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; return; }
      if (page.startsWith('work/')) { 
        const isZh = window.location.pathname.startsWith('/zh');
        window.location.href = isZh ? '/zh/' + page : '/' + page; 
        return; 
      }
      // If mobile Home is clicked, always navigate to the real index page
      if (page === '') { mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; window.location.href = window.location.pathname.startsWith('/zh') ? '/zh/' : '/'; return; }

      // 預設延遲收起選單
      setTimeout(() => {
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      }, 400);
    });
  });

  langToggles.forEach((button) => {
    button.addEventListener('click', () => {
      if (typeof window.toggleSiteLanguage === 'function') {
        window.toggleSiteLanguage(document, getCurrentPageName());
      }
      if (typeof window.applySiteLanguage === 'function') {
        window.applySiteLanguage(document, getCurrentPageName());
      }
    });
  });

  // 同步選單狀態（在載入或 path 變更時保持點點在對應選單）
  function syncMenuToPath() {
    const page = getCurrentPageName();
    const prefix = window.location.pathname.includes('/zh') ? '/zh' : '';

    // desktop
    const desktopSelector = (page && page !== 'home') ? `.main-menu-link[href="${prefix}/${page}"]` : `.main-menu-link[href="${prefix}/"]`;
    const desktopLink = document.querySelector(desktopSelector) || document.querySelector(`.main-menu-link[href="/${page === 'home' ? '' : page}"]`);
    if (desktopLink) updateDesktopMenu(desktopLink);

    // mobile
    mobileLinks.forEach(item => item.classList.remove('active'));
    const mobileSelector = (page && page !== 'home') ? `.mobile-link[href="${prefix}/${page}"]` : `.mobile-link[href="${prefix}/"]`;
    const mobileLink = document.querySelector(mobileSelector) || document.querySelector(`.mobile-link[href="/${page === 'home' ? '' : page}"]`);
    if (mobileLink) mobileLink.classList.add('active');

    if (typeof window.applySiteLanguage === 'function') {
      window.applySiteLanguage(document, page);
    }
  }

  // run once and on path changes
  syncMenuToPath();
  window.addEventListener('popstate', syncMenuToPath);
  window.addEventListener('spa-navigation-changed', syncMenuToPath);

});
