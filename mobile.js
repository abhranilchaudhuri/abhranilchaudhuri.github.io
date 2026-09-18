/* Mobile enhancement. Original desktop panels and content remain in place. */
(function () {
  'use strict';
  // Keep this query identical to mobile.css, including phone landscape mode.
  const media = window.matchMedia('(max-width: 767px), (max-width: 950px) and (max-height: 500px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const panels = Array.from(slides[2].querySelectorAll('.swipe-panel'));
  const pages = [slides[0], slides[1], ...panels, slides[6]];
  const names = ['Home', 'About me', 'Experience', 'Projects', 'University engagements', 'Education', 'Connect'];
  const anchors = ['home', 'about', 'experience', 'projects', 'university', 'education', 'connect'];
  const containers = [slides[0].querySelector('.slide-content'), slides[1].querySelector('.slide-content'), ...panels, slides[6].querySelector('.slide-content')];
  let current = 0;
  let framePending = false;
  let resizeTimer;

  const headerTemplate = document.createElement('template');
  headerTemplate.innerHTML = '<header class="mobile-section-header"><a class="mobile-wordmark" href="#home" data-mobile-goto="0" aria-label="Abhranil’s Portfolio — Home">ABHRANIL’S<br>PORTFOLIO</a><button type="button" class="mobile-menu-toggle" aria-controls="mobile-menu" aria-expanded="false" aria-label="Open navigation menu">MENU<img src="menu.svg" width="28" height="28" alt=""></button></header>';
  containers.forEach((container, index) => {
    container.prepend(headerTemplate.content.cloneNode(true));
    pages[index].classList.add('mobile-page');
    pages[index].setAttribute('tabindex', '-1');
  });

  const menu = document.createElement('dialog');
  menu.id = 'mobile-menu';
  menu.className = 'mobile-menu';
  menu.setAttribute('aria-labelledby', 'mobile-menu-title');
  menu.innerHTML = '<div class="mobile-menu-heading"><h2 id="mobile-menu-title">Menu</h2><button type="button" class="mobile-menu-close" aria-label="Close navigation menu">CLOSE</button></div><nav aria-label="Mobile navigation">' + names.map((name, index) => '<a href="#' + anchors[index] + '" data-mobile-goto="' + index + '">' + name + '</a>').join('') + '</nav>';
  document.body.append(menu);
  const toggles = Array.from(document.querySelectorAll('.mobile-menu-toggle'));
  const menuLinks = Array.from(menu.querySelectorAll('a'));

  function closeMenu() {
    if (menu.open) menu.close();
  }
  toggles.forEach(button => button.addEventListener('click', () => {
    if (!media.matches) return;
    button.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('mobile-menu-open');
    document.body.classList.add('mobile-menu-open');
    menu.showModal();
    menu.querySelector('.mobile-menu-close').focus();
  }));
  menu.querySelector('.mobile-menu-close').addEventListener('click', closeMenu);
  menu.addEventListener('click', event => {
    const rect = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeMenu();
  });
  menu.addEventListener('close', () => {
    document.documentElement.classList.remove('mobile-menu-open');
    document.body.classList.remove('mobile-menu-open');
    toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
  });

  function goTo(index, smooth = true, updateHash = true) {
    if (!media.matches || !Number.isInteger(index) || !pages[index]) return false;
    closeMenu();
    current = index;
    if (updateHash && location.hash !== '#' + anchors[index]) {
      history.pushState(null, '', '#' + anchors[index]);
    }
    pages[index].scrollIntoView({block: 'start', behavior: smooth && !reduceMotion.matches ? 'smooth' : 'instant'});
    pages[index].focus({preventScroll: true});
    return true;
  }
  document.querySelectorAll('[data-mobile-goto]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    goTo(Number(link.dataset.mobileGoto));
  }));

  // Native document scrolling makes every card and every skill reachable.
  function updatePosition() {
    framePending = false;
    if (!media.matches) return;
    let index = 0;
    pages.forEach((page, i) => { if (page.getBoundingClientRect().top <= 120) index = i; });
    current = index;
    menuLinks.forEach((link, i) => {
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (media.matches && !framePending) {
      framePending = true;
      requestAnimationFrame(updatePosition);
    }
  }, {passive: true});

  function followHash() {
    const index = anchors.indexOf(location.hash.slice(1));
    if (media.matches && index >= 0) goTo(index, false, false);
  }
  window.addEventListener('hashchange', followHash);
  window.addEventListener('popstate', followHash);
  window.addEventListener('load', followHash, {once: true});

  // A phone rotation or resized window can enter or leave native scroll mode.
  media.addEventListener('change', () => {
    clearTimeout(resizeTimer);
    closeMenu();
    if (media.matches) {
      const index = window.__portfolio ? window.__portfolio.current() : current;
      requestAnimationFrame(() => goTo(index, false, false));
    } else {
      const index = current;
      const restore = () => {
        if (media.matches) return;
        if (window.__portfolio?.isAnimating()) {
          resizeTimer = setTimeout(restore, 60);
          return;
        }
        window.scrollTo({top: 0, left: 0, behavior: 'instant'});
        window.__portfolio?.goTo(index);
      };
      restore();
    }
  });

  window.portfolioMobile = {isActive: () => media.matches, goTo, current: () => current};
})();
