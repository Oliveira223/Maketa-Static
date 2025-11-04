// =====================================
// MÓDULO PRINCIPAL (organização em seções)
// =====================================

// Evita snap direcional enquanto navega por clique no menu
let navLockUntil = 0;

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
        // Trava o snap por um curto período durante a rolagem de navegação
        navLockUntil = Date.now() + 1400; // ~1.4s
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

  // Carrosel de Projetos
  initProjectsCarousel();
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
      // Se a navegação por clique ainda está em curso, não faça snap
      if (now < navLockUntil) return;
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

// =============================
// MÓDULO: Carrosel de Projetos
// - Carrega maquetes de docs/data/maquetes.json
// - Renderiza até 10 capas como slides com scroll-snap
// - Cria bolinhas (dots) para navegação e estado ativo
// =============================
function initProjectsCarousel() {
  try {
    const track = document.getElementById('carousel-track');
    const dotsRoot = document.getElementById('carousel-dots');
    if (!track || !dotsRoot) return;

    const render = (maquetes) => {
      const list = Array.isArray(maquetes) ? maquetes : [];
      const covers = list
        .map(m => m?.cover)
        .filter(Boolean)
        .slice(0, 10);

      // Limpa
      track.innerHTML = '';
      dotsRoot.innerHTML = '';

      if (covers.length === 0) {
        track.innerHTML = '<div class="carousel-empty">Sem imagens de projetos</div>';
        return;
      }

      // Renderiza slides
      covers.forEach((src, i) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.setAttribute('role', 'listitem');
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Capa do projeto ' + (i + 1);
        img.loading = 'lazy';
        item.appendChild(img);
        track.appendChild(item);
      });

      // Renderiza dots
      const items = Array.from(track.children);
      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Ir para slide ' + (i + 1));
        dot.addEventListener('click', () => {
          const el = items[i];
          if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        dotsRoot.appendChild(dot);
      });

      // Atualiza dot ativo conforme scroll
      const setActiveByIndex = (idx) => {
        const dots = Array.from(dotsRoot.children);
        dots.forEach((d, j) => d.classList.toggle('active', j === idx));
      };

      const getNearestIndex = () => {
        const scrollLeft = track.scrollLeft;
        let bestIdx = 0;
        let bestDist = Infinity;
        items.forEach((el, idx) => {
          const dist = Math.abs(el.offsetLeft - scrollLeft);
          if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
        });
        return bestIdx;
      };

      let rafId = null;
      const onScroll = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => setActiveByIndex(getNearestIndex()));
      };
      track.addEventListener('scroll', onScroll, { passive: true });

      // Resize recalcula item offsets
      window.addEventListener('resize', () => setActiveByIndex(getNearestIndex()));
    };

    // Carrega JSON
    fetch('docs/data/maquetes.json', { cache: 'no-cache' })
      .then(res => res.ok ? res.json() : [])
      .then(render)
      .catch(() => render([]));
  } catch (err) {
    console.warn('Falha ao inicializar carrosel de projetos:', err);
  }
}