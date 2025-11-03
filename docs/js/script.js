// =====================================
// MÓDULO PRINCIPAL (organização em seções)
// =====================================

document.addEventListener('DOMContentLoaded', () => {
  // Contexto compartilhado
  const sections = Array.from(document.querySelectorAll('header, .section1, .section2, .section3'));
  const navLinks = Array.from(document.querySelectorAll('.hero-nav .nav-link'));
  const navList = document.querySelector('.hero-nav .nav-list');
  let activeLockUntil = 0; // evita "voltadas" durante scroll suave

  // =============================
  // MÓDULO: COMPONENTES (templates)
  // Responsável por carregar HTML de componentes reutilizáveis
  // =============================
  function initComponents() {
    const loadComponent = async (selector, url) => {
      try {
        const el = document.querySelector(selector);
        if (!el) return;
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        el.innerHTML = html;
      } catch (err) {
        console.warn('Falha ao carregar componente', selector, err);
      }
    };
    // Footer
    loadComponent('#footer-root', 'docs/templates/components/footer.html');
  }

  // =============================
  // MÓDULO: NAVEGAÇÃO (menu/slider)
  // Cuida do estado ativo e do destaque do item selecionado
  // =============================
  function initNavigation() {
    const setActiveNav = (id) => {
      navLinks.forEach(a => {
        const target = a.getAttribute('data-target');
        a.classList.toggle('active', target === id);
      });

      // Move o slider para o item ativo
      try {
        if (!navList) return;
        const active = navLinks.find(a => a.classList.contains('active'));
        if (!active) return;
        const aRect = active.getBoundingClientRect();
        const lRect = navList.getBoundingClientRect();
        const styles = getComputedStyle(navList);
        const pad = Number(parseFloat(styles.getPropertyValue('--slider-pad'))) || 0;
        const offsetY = Number(parseFloat(styles.getPropertyValue('--slider-offset-y'))) || 0;
        const x = (aRect.left - lRect.left) - pad;
        const y = (aRect.top - lRect.top) - pad + offsetY;
        const w = aRect.width + pad * 2;
        const h = aRect.height + pad * 2;
        navList.style.setProperty('--slider-x', Math.round(x) + 'px');
        navList.style.setProperty('--slider-y', Math.round(y) + 'px');
        navList.style.setProperty('--slider-w', Math.round(w) + 'px');
        navList.style.setProperty('--slider-h', Math.round(h) + 'px');
      } catch (_) { /* silencioso */ }
    };

    // Observer para atualizar o ativo conforme seções entram na viewport
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const threshold = Number(el.dataset.snapThreshold || 0.6);
        if (entry.intersectionRatio >= threshold) {
          if (performance.now() < activeLockUntil) return; // evitar "voltadas"
          const id = el.tagName.toLowerCase() === 'header' ? 'top' : (el.id || null);
          if (id) setActiveNav(id);
        }
      });
    }, { threshold: [0.5, 0.7, 0.9] });

    sections.forEach(el => io.observe(el));

    // Clique nos links: rolagem suave + atualização imediata do ativo
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        let el = null;
        if (target === 'top') el = document.querySelector('header');
        else el = document.getElementById(target);
        if (el) {
          activeLockUntil = performance.now() + 1200;
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveNav(target);
        }
      });
    });

    // Recalcula o slider ao redimensionar
    window.addEventListener('resize', () => {
      const current = navLinks.find(a => a.classList.contains('active'));
      if (current) {
        const id = current.getAttribute('data-target');
        if (id) setActiveNav(id);
      }
    });
  }

  // =============================
  // MÓDULO: SCROLL SNAP (direção)
  // Habilita snap somente ao rolar para baixo
  // =============================
  function initScrollSnap() {
    const setSnapEnabled = (enabled) => {
      const html = document.documentElement;
      const body = document.body;
      if (enabled) {
        html.classList.remove('no-snap');
        body.classList.remove('no-snap');
      } else {
        html.classList.add('no-snap');
        body.classList.add('no-snap');
      }
    };

    // Mouse wheel
    let lastInputTime = 0;
    window.addEventListener('wheel', (e) => {
      const now = performance.now();
      if (now - lastInputTime < 80) return;
      lastInputTime = now;
      setSnapEnabled(e.deltaY > 0);
    }, { passive: true });

    // Touch
    let touchStartY = null;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (touchStartY == null) return;
      const cy = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - cy; // dedo para cima => rolar para baixo
      setSnapEnabled(dy > 0);
    }, { passive: true });
    window.addEventListener('touchend', () => { touchStartY = null; }, { passive: true });

    // Teclado
    window.addEventListener('keydown', (e) => {
      const downKeys = ['ArrowDown', 'PageDown', 'Space'];
      const upKeys = ['ArrowUp', 'PageUp', 'Home'];
      if (downKeys.includes(e.key)) setSnapEnabled(true);
      else if (upKeys.includes(e.key)) setSnapEnabled(false);
    }, { passive: true });

    // Estado inicial
    setSnapEnabled(true);
  }

  // Inicialização
  initNavigation();
  initScrollSnap();
  initComponents();
});


// =====================================
// FIM dos módulos do script principal
// =====================================