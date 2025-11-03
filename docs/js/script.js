// =====================================
// MÓDULO PRINCIPAL (organização em seções)
// =====================================

document.addEventListener('DOMContentLoaded', () => {
  // Contexto compartilhado
  const navLinks = Array.from(document.querySelectorAll('.hero-nav .nav-link'));
  const navList = document.querySelector('.hero-nav .nav-list');
  // Simplificado: sem controle de scroll automático

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

    // Removido: atualização automática pelo viewport

    // Clique nos links: deixa o navegador rolar para a âncora e atualiza o ativo
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const target = link.getAttribute('data-target');
        if (target) setActiveNav(target);
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

    // Define ativo inicial para "Início" (top)
    setActiveNav('top');
  }

  // Inicialização
  initNavigation();
  initComponents();
  // Snap direcional: puxa para a seção quando 90% estiver visível ao rolar para baixo
  initDirectionalSnap();
});




// =============================
// MÓDULO: Snap Direcional
// - Ao rolar para baixo: quando 90% de uma seção estiver visível,
//   rola suavemente para alinhar a seção no topo (100vh já definido no CSS)
// - Ao rolar para cima: não faz snap
// =============================
function initDirectionalSnap() {
  try {
    const sections = Array.from(document.querySelectorAll('section.section1, section.section2, section.section3'));
    if (sections.length === 0) return;

    let lastY = window.scrollY;
    let direction = 'down';
    const snappedSet = new Set();
    const SNAP_THRESHOLD = 0.85; // 90%
    const COOLDOWN_MS = 500; // evita múltiplos snaps em sequência
    let lastSnapAt = 0;

    // Detecta direção do scroll
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) > 2) {
        direction = delta > 0 ? 'down' : 'up';
      }
      lastY = y;
    }, { passive: true });

    // Observer principal: aciona quando >= 90% visível
    const observer = new IntersectionObserver((entries) => {
      const now = Date.now();
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (direction !== 'down') return; // só ao rolar para baixo
        if (entry.intersectionRatio < SNAP_THRESHOLD) return;

        const el = entry.target;
        const alreadySnapped = snappedSet.has(el);
        const cooldownOk = (now - lastSnapAt) > COOLDOWN_MS;
        const top = el.getBoundingClientRect().top;

        // Evita snap se já está alinhado ou se acabou de snapar
        if (!alreadySnapped && cooldownOk && top > 1) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          snappedSet.add(el);
          lastSnapAt = now;
        }
      });
    }, { threshold: [SNAP_THRESHOLD] });

    sections.forEach(sec => observer.observe(sec));

    // Reseta marcação quando a seção não está mais majoritariamente visível
    const resetObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
          snappedSet.delete(entry.target);
        }
      });
    }, { threshold: [0, 0.2] });

    sections.forEach(sec => resetObserver.observe(sec));
  } catch (err) {
    console.warn('Falha ao inicializar snap direcional:', err);
  }
}