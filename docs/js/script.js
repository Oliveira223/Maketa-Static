// =====================================
// ROLAGEM SUAVE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
  const sections = Array.from(document.querySelectorAll('header, .section1, .section2, .section3'));
  const navLinks = Array.from(document.querySelectorAll('.hero-nav .nav-link'));
  const navList = document.querySelector('.hero-nav .nav-list');
  // lock para evitar que o slider volte durante o scroll suave após clique
  let activeLockUntil = 0;

  const setActiveNav = (id) => {
    navLinks.forEach(a => {
      const target = a.getAttribute('data-target');
      a.classList.toggle('active', target === id);
    });

    // Move slider para o item ativo
    try {
      if (!navList) return;
      const active = navLinks.find(a => a.classList.contains('active'));
      if (!active) return;
      const aRect = active.getBoundingClientRect();
      const lRect = navList.getBoundingClientRect();
      const styles = getComputedStyle(navList);
      const pad = Number(parseFloat(styles.getPropertyValue('--slider-pad'))) || 0;
      const offsetY = Number(parseFloat(styles.getPropertyValue('--slider-offset-y'))) || 0;
      // padding uniforme: expande igualmente no eixo X e Y
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

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const threshold = Number(el.dataset.snapThreshold || 0.6);   // limiar de visibilidade

      if (entry.intersectionRatio >= threshold) {
        // Durante scroll programático, não troque o ativo para evitar "voltadas"
        if (performance.now() < activeLockUntil) return;
        // atualiza estado ativo do menu
        const id = el.tagName.toLowerCase() === 'header' ? 'top' : (el.id || null);
        if (id) setActiveNav(id);
      }
    });
  }, { threshold: [0.5, 0.7, 0.9] });

  sections.forEach(el => io.observe(el));

  // navegação: clique -> rolagem suave
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      let el = null;
      if (target === 'top') el = document.querySelector('header');
      else el = document.getElementById(target);
      if (el) {
        // bloquear updates do observer enquanto o scroll suave acontece
        activeLockUntil = performance.now() + 1200;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveNav(target);
      }
    });
  });

  // Recalcular slider ao redimensionar
  window.addEventListener('resize', () => {
    const current = navLinks.find(a => a.classList.contains('active'));
    if (current) {
      const id = current.getAttribute('data-target');
      if (id) setActiveNav(id);
    }
  });
});


// ===================================
//
// ===================================