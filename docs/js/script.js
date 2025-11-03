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
});


// =====================================
// FIM dos módulos do script principal
// =====================================