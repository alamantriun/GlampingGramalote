// ── Registrar plugin ──────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
ScrollTrigger.normalizeScroll(true);

// ── Animación inicial del HERO ────────────────────────────────────
gsap.set(['.hero-badge', '.hero h1', '.hero-sub', '.hero-location', '.hero-cta', '.hero-scroll'], { autoAlpha: 0, y: 30 });
gsap.to('.hero-badge',    { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' });
gsap.to('.hero h1',       { autoAlpha: 1, y: 0, duration: 1,   delay: 0.55, ease: 'power3.out' });
gsap.to('.hero-sub',      { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.75, ease: 'power3.out' });
gsap.to('.hero-location', { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.9,  ease: 'power3.out' });
gsap.to('.hero-cta',      { autoAlpha: 1, y: 0, duration: 0.7, delay: 1.05, ease: 'power3.out' });
gsap.to('.hero-scroll',   { autoAlpha: 1, y: 0, duration: 0.6, delay: 1.3,  ease: 'power3.out' });

// ── Canvas Frame Sequence (Scroll Effect) ─────────────────────────
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");
const frameCount = 40;
const currentFrame = index => `img/frames/${(index + 1).toString().padStart(2, '0')}.jpg`;

const images = [];
const frames = { frame: frameCount - 1 };

// Preload all frame images with Promise for reliable first-load
function preloadFrames() {
  const promises = [];
  for (let i = 0; i < frameCount; i++) {
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = currentFrame(i);
      images.push(img);
    });
    promises.push(promise);
  }
  return Promise.all(promises);
}

// DPR global para consistencia entre resizeCanvas y render
let _dpr = Math.min(window.devicePixelRatio || 1, 2); // cap en 2 para evitar exceso

function resizeCanvas() {
  _dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Setear dimensiones físicas del canvas
  heroCanvas.width = Math.round(w * _dpr);
  heroCanvas.height = Math.round(h * _dpr);
  // Dimensiones CSS (lógicas)
  heroCanvas.style.width = w + 'px';
  heroCanvas.style.height = h + 'px';
  // Resetear transform antes de aplicar escala DPR
  heroCtx.setTransform(1, 0, 0, 1, 0, 0);
  heroCtx.scale(_dpr, _dpr);
  // Interpolación bicúbica para suavizar el escalado de los frames (720p → pantalla HiDPI)
  heroCtx.imageSmoothingEnabled = true;
  heroCtx.imageSmoothingQuality = 'high';
  render();
}

function render() {
  // Tamaño lógico (CSS pixels)
  const w = heroCanvas.width / _dpr;
  const h = heroCanvas.height / _dpr;
  heroCtx.clearRect(0, 0, w, h);
  // Asegurar interpolación suave en cada fotograma
  heroCtx.imageSmoothingEnabled = true;
  heroCtx.imageSmoothingQuality = 'high';
  const img = images[Math.round(frames.frame)];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  
  const hRatio = w / img.naturalWidth;
  const vRatio = h / img.naturalHeight;
  let ratio = Math.max(hRatio, vRatio);
  
  if (w <= 768) {
    // En móviles, limitamos el ratio para que no haga un zoom excesivo
    ratio = Math.max(hRatio, vRatio * 0.55);
  }

  const drawWidth  = img.naturalWidth  * ratio;
  const drawHeight = img.naturalHeight * ratio;
  const offsetX = (w - drawWidth)  / 2;
  const offsetY = (h - drawHeight) / 2;
  
  heroCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                    offsetX, offsetY, drawWidth, drawHeight);
}

// Inicializar canvas inmediatamente para evitar glitches
resizeCanvas();

preloadFrames().then(() => {
  render();
  const preloader = document.getElementById('page-preloader');
  if (preloader) {
    preloader.classList.add('hide-loader');
    setTimeout(() => {
      preloader.style.display = 'none';
      ScrollTrigger.refresh();
    }, 600);
  } else {
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }
});
window.addEventListener("resize", resizeCanvas);

// ══════════════════════════════════════════════════════════════════
//  CINEMATIC SCROLL SYSTEM — Estilo Apple
//  Todas las animaciones están AMARRADAS al progreso del scroll
//  (scrub), NO basadas en tiempo. Usa solo transform/opacity/filter
//  para garantizar 60fps con aceleración por hardware.
//
//  CONFIGURACIÓN RÁPIDA:
//  • scrub: 0.8  → suavidad de interpolación (0=instantáneo, 2=muy lento)
//  • start/end  → marcadores de inicio/fin del efecto
//  • pin: true   → fija la sección mientras se anima
// ══════════════════════════════════════════════════════════════════

// ─── [1] HERO: Pin + Frame Sequence + Texto Fade-out con Blur ────
// El hero se fija en pantalla. Los frames avanzan con el scroll.
// El texto desaparece progresivamente con blur + translate hacia arriba.
const HERO_SCRUB = 0.8;       // ← MODIFICABLE: suavidad del scrub del hero
const isMobile = window.innerWidth <= 768;
const HERO_PIN_DISTANCE = isMobile ? '150%' : '250%'; // Más corto en móvil

let tlHero = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",          // ← MODIFICABLE: cuándo empieza el pin
    end: "+=" + HERO_PIN_DISTANCE,
    scrub: HERO_SCRUB,
    pin: true,
    anticipatePin: 1,          // evita saltos al entrar en pin
  }
});

// Fase 1 (0→0.6): Efecto "Amanecer". Transición limpia de noche a día puro.
tlHero
  // El fondo oscuro se ilumina a blanco puro
  .to('.hero', { background: '#ffffff', ease: 'power2.inOut', duration: 0.6 }, 0.1)
  // Las estrellas desaparecen suavemente
  .to('#star-canvas', { autoAlpha: 0, ease: 'power2.inOut', duration: 0.5 }, 0.1)
  // El domo aparece ya con el brillo ajustado para que su fondo gris sea blanco puro desde el principio
  .fromTo('#hero-canvas', 
    { opacity: 0, scale: 1.05, filter: 'blur(4px) brightness(1.08)' },
    { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1.08)', ease: 'power2.inOut', duration: 0.6, immediateRender: false }, 0.1)
  .to(frames, {
    frame: 0,
    snap: "frame",
    ease: "none",
    onUpdate: render,
    duration: 2
  }, 0)
  // Texto principal se eleva y desenfoca
  .fromTo('.hero h1',
    { y: 0, autoAlpha: 1, filter: 'blur(0px)' },
    { y: -120, autoAlpha: 0, filter: 'blur(12px)', ease: 'power2.in', duration: 1, immediateRender: false }, 0)
  // Elementos secundarios desaparecen más rápido
  .fromTo(['.hero-badge', '.hero-sub', '.hero-location', '.hero-cta', '.hero-scroll'],
    { y: 0, autoAlpha: 1, filter: 'blur(0px)' },
    { y: -60, autoAlpha: 0, filter: 'blur(6px)', ease: 'power2.in', duration: 0.7, immediateRender: false }, 0)
  // Fase 2 (0.4→1.2): Nombre de empresa aparece cinematográficamente
  .fromTo('.hero-company-name', {
    autoAlpha: 0,
    scale: 0.9,
    filter: 'blur(20px)',
  }, {
    autoAlpha: 1,
    scale: 1,
    filter: 'blur(0px)',
    ease: 'power1.out',
    duration: 0.8,
    immediateRender: false
  }, 0.4);

// ─── [2] STRIP MARQUEE: Entrada suave con scrub ──────────────────
gsap.from('.strip-track', {
  autoAlpha: 0,
  y: 30,
  ease: 'none',
  scrollTrigger: {
    trigger: '.strip',
    start: 'top 95%',           // ← MODIFICABLE
    end: 'top 70%',
    scrub: 0.5,                 // ← MODIFICABLE
  }
});

// ─── [3] ABOUT / NOSOTROS: Pin de imagen + Texto reveal progresivo ─
// La imagen queda sticky mientras los textos se revelan uno a uno
// con efecto blur-to-clear + slide-up, amarrados al scroll.
const ABOUT_SCRUB = 1;          // ← MODIFICABLE: suavidad del about

// Imagen: parallax scale-down sutil mientras se hace scroll
gsap.fromTo('.about-img-wrap img', {
  scale: 1.12,
  filter: 'brightness(0.85)',
}, {
  scale: 1,
  filter: 'brightness(1)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#nosotros',
    start: 'top 80%',            // ← MODIFICABLE
    end: 'bottom 20%',
    scrub: ABOUT_SCRUB,
  }
});

// Imagen entra desde la izquierda con scrub
gsap.from('.about-img-wrap', {
  x: -80,
  autoAlpha: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#nosotros',
    start: 'top 85%',
    end: 'top 50%',
    scrub: ABOUT_SCRUB,
  }
});

// Cada elemento de texto se revela en secuencia con blur + slide
gsap.utils.toArray('.about-grid > div:last-child > *').forEach((el, i) => {
  gsap.fromTo(el, {
    autoAlpha: 0,
    y: 50,
    filter: 'blur(8px)',
  }, {
    autoAlpha: 1,
    y: 0,
    filter: 'blur(0px)',
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#nosotros',
      // Cada elemento empieza un poco más tarde (stagger por posición)
      start: `top ${75 - i * 8}%`,   // ← MODIFICABLE: stagger visual
      end: `top ${45 - i * 8}%`,
      scrub: ABOUT_SCRUB,
    }
  });
});

// ─── [4] CONTADORES ANIMADOS ─────────────────────────────────────
const counters = [
  { el: document.querySelector('.stat-box:nth-child(1) .stat-num'), target: 280, suffix: '+', decimals: 0 },
  { el: document.querySelector('.stat-box:nth-child(2) .stat-num'), target: 5.6, suffix: 'k', decimals: 1 },
  { el: document.querySelector('.stat-box:nth-child(3) .stat-num'), target: 12,  suffix: '°C', decimals: 0 },
  { el: document.querySelector('.stat-box:nth-child(4) .stat-num'), target: 100, suffix: '%', decimals: 0 },
];
ScrollTrigger.create({
  trigger: '.about-stats', start: 'top 80%',
  once: true,
  onEnter: () => {
    counters.forEach(c => {
      if (!c.el) return;
      gsap.to({ val: 0 }, {
        val: c.target, duration: 2, ease: 'power2.out',
        onUpdate() { c.el.textContent = parseFloat(this.targets()[0].val).toFixed(c.decimals) + c.suffix; }
      });
    });
  }
});

// Stat boxes: entrada suave (sin scrub para evitar que crezcan/decrezcan)
gsap.utils.toArray('.stat-box').forEach((box, i) => {
  gsap.fromTo(box, {
    autoAlpha: 0,
    y: 40,
    scale: 0.9,
  }, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    duration: 0.8,
    ease: 'power2.out',
    delay: i * 0.15,
    scrollTrigger: {
      trigger: '.about-stats',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });
});

// ─── [5] HOSPEDAJES: Título pin + Cards stagger cinematográfico ──
const CARDS_SCRUB = 0.8;        // ← MODIFICABLE

// Header de hospedajes: reveal con blur
gsap.fromTo('.hospedajes-header', {
  autoAlpha: 0,
  y: 60,
  filter: 'blur(10px)',
}, {
  autoAlpha: 1,
  y: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#hospedajes',
    start: 'top 80%',
    end: 'top 50%',
    scrub: CARDS_SCRUB,
  }
});

// Cards: cada una entra con delay escalonado + scale + rotación sutil
gsap.utils.toArray('.card').forEach((card, i) => {
  gsap.fromTo(card, {
    autoAlpha: 0,
    y: 100,
    scale: 0.88,
    rotateX: 8,
    filter: 'blur(6px)',
  }, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.cards-grid',
      start: `top ${85 - i * 8}%`,   // ← MODIFICABLE: stagger de cards
      end: `top ${50 - i * 8}%`,
      scrub: CARDS_SCRUB,
    }
  });
});

// Tilt 3D interactivo en cards (se mantiene - no es scroll)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -14;
    gsap.to(card, { rotateY: x, rotateX: y, transformPerspective: 900, duration: 0.3, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'elastic.out(1,0.7)' });
  });
});

// ─── [6] EXPERIENCIAS: Scale-in progresivo con scrub ─────────────
const EXP_SCRUB = 0.7;          // ← MODIFICABLE

// Título de experiencias
gsap.fromTo('.exp-inner > div:first-child', {
  autoAlpha: 0,
  y: 50,
  filter: 'blur(8px)',
}, {
  autoAlpha: 1,
  y: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#experiencias',
    start: 'top 80%',
    end: 'top 55%',
    scrub: EXP_SCRUB,
  }
});

// Cada item de experiencia con scale + fade + stagger por posición
gsap.utils.toArray('.exp-item').forEach((item, i) => {
  gsap.fromTo(item, {
    autoAlpha: 0,
    scale: 0.82,
    y: 50,
    filter: 'blur(5px)',
  }, {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.exp-grid',
      start: `top ${88 - i * 6}%`,    // ← MODIFICABLE: stagger
      end: `top ${58 - i * 6}%`,
      scrub: EXP_SCRUB,
    }
  });
});

// ─── [7] GALERÍA: Parallax reveal + scale individual ─────────────
const GAL_SCRUB = 0.9;           // ← MODIFICABLE

// Título galería
gsap.fromTo('.galeria-header', {
  autoAlpha: 0,
  y: 40,
  filter: 'blur(6px)',
}, {
  autoAlpha: 1,
  y: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#galeria',
    start: 'top 80%',
    end: 'top 55%',
    scrub: GAL_SCRUB,
  }
});

// Cada imagen de la galería aparece con scale-up + parallax vertical
gsap.utils.toArray('.galeria-item').forEach((item, i) => {
  gsap.fromTo(item, {
    autoAlpha: 0,
    scale: 0.85,
    y: 60 + (i * 15),              // parallax diferencial
  }, {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.galeria-grid',
      start: `top ${90 - i * 6}%`,
      end: `top ${55 - i * 6}%`,
      scrub: GAL_SCRUB,
    }
  });
});

// Parallax sutil en las imágenes de galería (efecto profundidad)
gsap.utils.toArray('.galeria-item img').forEach((img, i) => {
  gsap.fromTo(img, {
    scale: 1.15,
  }, {
    scale: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: img.parentElement,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    }
  });
});

// ─── [8] RESERVA: Split reveal izquierda/derecha ─────────────────
const RES_SCRUB = 0.8;           // ← MODIFICABLE

// Columna izquierda (contacto)
gsap.fromTo('#reservar > .reserva-inner > div:first-child', {
  autoAlpha: 0,
  x: -80,
  filter: 'blur(8px)',
}, {
  autoAlpha: 1,
  x: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#reservar',
    start: 'top 75%',
    end: 'top 40%',
    scrub: RES_SCRUB,
  }
});

// Links de contacto stagger
gsap.utils.toArray('.contact-link').forEach((link, i) => {
  gsap.fromTo(link, {
    autoAlpha: 0,
    x: -50,
    filter: 'blur(4px)',
  }, {
    autoAlpha: 1,
    x: 0,
    filter: 'blur(0px)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.contact-links',
      start: `top ${82 - i * 7}%`,
      end: `top ${58 - i * 7}%`,
      scrub: RES_SCRUB,
    }
  });
});

// Formulario entra desde la derecha
gsap.fromTo('.form-box', {
  autoAlpha: 0,
  x: 80,
  rotateY: -5,
  filter: 'blur(8px)',
}, {
  autoAlpha: 1,
  x: 0,
  rotateY: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#reservar',
    start: 'top 70%',
    end: 'top 35%',
    scrub: RES_SCRUB,
  }
});

// ─── [9] UBICACIÓN: Map reveal con scale ─────────────────────────
gsap.fromTo('.ubi-inner > div:first-child', {
  autoAlpha: 0,
  y: 50,
  filter: 'blur(6px)',
}, {
  autoAlpha: 1,
  y: 0,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '#ubicacion',
    start: 'top 78%',
    end: 'top 50%',
    scrub: 0.8,
  }
});

gsap.fromTo('.map-placeholder', {
  autoAlpha: 0,
  scale: 0.9,
  filter: 'blur(4px)',
}, {
  autoAlpha: 1,
  scale: 1,
  filter: 'blur(0px)',
  ease: 'none',
  scrollTrigger: {
    trigger: '.map-placeholder',
    start: 'top 85%',
    end: 'top 55%',
    scrub: 0.8,
  }
});

// ─── [10] FOOTER: Reveal progresivo ──────────────────────────────
gsap.utils.toArray('.footer-top > *').forEach((el, i) => {
  gsap.fromTo(el, {
    autoAlpha: 0,
    y: 40,
  }, {
    autoAlpha: 1,
    y: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: 'footer',
      start: `top ${92 - i * 5}%`,
      end: `top ${72 - i * 5}%`,
      scrub: 0.6,
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  BOOKING WIZARD — Sistema de reservas paso a paso
// ══════════════════════════════════════════════════════════════
let bkState = {
  step: 1,
  accommodation: '',
  campingType: '', // 'propia' or 'alquiler'
  cuatrimoto: 'none', // 'none', '1h', '2h'
  checkin: null,
  checkout: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  selecting: 'checkin', // 'checkin' or 'checkout'
};

// ── Pricing config ──────────────────────────────────────────────────
const PRICING = {
  'Domo Glamping': { perNight: 95000 },
  'Plan Romántico': { firstNight: 105000, extraNight: 95000 },
  'Zona Camping': { propia: 50000, alquiler: 70000 },
  cuatrimoto: { '1h': 70000, '2h': 100000 }
};

function formatCOP(n) {
  return '$' + n.toLocaleString('es-CO');
}

function selectCampingType(type) {
  bkState.campingType = type;
  document.querySelectorAll('#bk-camping-options .bk-radio-card').forEach(c => c.classList.remove('selected'));
  const id = type === 'propia' ? 'bk-camp-own' : 'bk-camp-rent';
  document.getElementById(id).classList.add('selected');
  document.getElementById('btn-to-step2').disabled = false;
  updatePriceBreakdown();
}

function selectCuatrimoto(val) {
  bkState.cuatrimoto = val;
  document.querySelectorAll('#bk-addons .bk-radio-card').forEach(c => c.classList.remove('selected'));
  const id = val === 'none' ? 'bk-cuatri-none' : val === '1h' ? 'bk-cuatri-1h' : 'bk-cuatri-2h';
  document.getElementById(id).classList.add('selected');
  updatePriceBreakdown();
}

function calculatePrice() {
  const nights = bkState.checkin && bkState.checkout
    ? Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24)) : 0;
  if (nights < 1) return { total: 0, lines: [], nights: 0 };

  const lines = [];
  let total = 0;
  const acc = bkState.accommodation;

  if (acc === 'Domo Glamping') {
    const sub = PRICING['Domo Glamping'].perNight * nights;
    lines.push({ label: `Domo Glamping × ${nights} noche${nights > 1 ? 's' : ''}`, amount: sub });
    total += sub;
  } else if (acc === 'Plan Romántico') {
    const first = PRICING['Plan Romántico'].firstNight;
    lines.push({ label: '1ra noche (con decoración)', amount: first });
    total += first;
    if (nights > 1) {
      const extra = PRICING['Plan Romántico'].extraNight * (nights - 1);
      lines.push({ label: `${nights - 1} noche${nights > 2 ? 's' : ''} adicional${nights > 2 ? 'es' : ''}`, amount: extra });
      total += extra;
    }
  } else if (acc === 'Zona Camping') {
    const rate = bkState.campingType === 'alquiler'
      ? PRICING['Zona Camping'].alquiler
      : PRICING['Zona Camping'].propia;
    const typeLabel = bkState.campingType === 'alquiler' ? 'Carpa alquilada' : 'Espacio (carpa propia)';
    const sub = rate * nights;
    lines.push({ label: `${typeLabel} × ${nights} noche${nights > 1 ? 's' : ''}`, amount: sub });
    total += sub;
  }

  // Cuatrimoto add-on
  if (bkState.cuatrimoto !== 'none') {
    const cuatriPrice = PRICING.cuatrimoto[bkState.cuatrimoto];
    const cuatriLabel = bkState.cuatrimoto === '1h' ? 'Cuatrimoto 1 hora' : 'Cuatrimoto 2 horas';
    lines.push({ label: cuatriLabel, amount: cuatriPrice });
    total += cuatriPrice;
  }

  return { total, lines, nights };
}

function updatePriceBreakdown() {
  const breakdown = document.getElementById('bk-price-breakdown');
  if (!breakdown) return;
  const { total, lines, nights } = calculatePrice();
  if (nights < 1 || lines.length === 0) {
    breakdown.style.display = 'none';
    return;
  }
  breakdown.style.display = 'block';
  const linesContainer = document.getElementById('bk-price-lines');
  linesContainer.innerHTML = '';
  lines.forEach(l => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between;';
    const lbl = document.createElement('span');
    lbl.textContent = l.label;
    const amt = document.createElement('span');
    amt.style.fontWeight = '500';
    amt.textContent = formatCOP(l.amount);
    div.appendChild(lbl);
    div.appendChild(amt);
    linesContainer.appendChild(div);
  });
  document.getElementById('bk-price-total').textContent = formatCOP(total);
}

// ─── INTEGRACIÓN SUPABASE (API REST) & WOMPI ──────────────────────────────
const SEC = GlampingSecurity;
const SUPABASE_URL = 'https://jezkrdxmpkttckzxfayq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemtyZHhtcGt0dGNrenhmYXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjM5MzksImV4cCI6MjEwMDM5OTkzOX0.6xTM-NGS-P_yVhbMrg6M8yJvBAwCtSk4A75u2Ev6Flc';

function getSupabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

let bookedDates = []; // Se llenará desde Supabase

// Cargar SDK de Wompi (Opcional, para el futuro)
try {
  const wompiScript = document.createElement('script');
  wompiScript.src = 'https://checkout.wompi.co/widget.js';
  document.head.appendChild(wompiScript);
} catch (e) {
  console.error("Error cargando Wompi", e);
}

// Se llama automáticamente cuando el usuario selecciona un hospedaje
async function fetchBookedDates() {
  if (!bkState.accommodation || !SEC.isValidAccommodation(bkState.accommodation)) return;
  try {
    const filters = [
      'select=fecha_llegada,fecha_salida',
      'estado=neq.cancelado',
      SEC.buildEqFilter('hospedaje', bkState.accommodation)
    ].join('&');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas?${filters}`,
      { headers: getSupabaseHeaders() }
    );
      
    if (!res.ok) throw new Error('Error al consultar disponibilidad');
    const data = await res.json();
    
    // Procesar todos los rangos de fechas ocupados
    const newBookedDates = new Set();
    data.forEach(reserva => {
      let current = new Date(reserva.fecha_llegada + 'T00:00:00');
      const end = new Date(reserva.fecha_salida + 'T00:00:00');
      // No bloqueamos la fecha de salida exacta para que otro usuario pueda entrar ese mismo día
      while (current < end) {
        newBookedDates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });
    
    bookedDates = Array.from(newBookedDates);
    // Si estamos en el paso 2, re-renderizar calendario
    if (bkState.step === 2) renderCalendar();
    
  } catch (err) {
    console.error("Error obteniendo reservas:", err);
  }
}


function selectAccommodation(el, name) {
  if (!SEC.isValidAccommodation(name)) return;
  document.querySelectorAll('.bk-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  bkState.accommodation = name;

  // Show/hide camping sub-options
  const campOpts = document.getElementById('bk-camping-options');
  if (name === 'Zona Camping') {
    campOpts.style.display = 'block';
    // Only enable next if camping type is selected
    document.getElementById('btn-to-step2').disabled = !bkState.campingType;
  } else {
    campOpts.style.display = 'none';
    bkState.campingType = '';
    document.getElementById('btn-to-step2').disabled = false;
  }

  fetchBookedDates();
}

function goToStep(step) {
  // Validate before proceeding
  if (step === 2 && !bkState.accommodation) return;
  if (step === 3 && (!bkState.checkin || !bkState.checkout)) return;

  bkState.step = step;

  // Hide all panels
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById('bk-step-' + i);
    if (panel) panel.style.display = 'none';
  }

  // Show current panel
  const current = document.getElementById('bk-step-' + step);
  if (current) {
    current.style.display = 'block';
    current.style.animation = 'none';
    current.offsetHeight; // reflow
    current.style.animation = '';
  }

  // Update step indicators
  document.querySelectorAll('.step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sn === step) s.classList.add('active');
    else if (sn < step) s.classList.add('completed');
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('active', i < step - 1);
  });

  // Step-specific setup
  if (step === 2) {
    document.getElementById('selected-acc-label').textContent = bkState.accommodation;
    bkState.selecting = 'checkin';
    bkState.checkin = null;
    bkState.checkout = null;
    updateDateDisplays();
    renderCalendar();
  }
  if (step === 3) fillPaymentSummary();
  if (step === 4) fillConfirmSummary();

  // Scroll to top of section
  document.getElementById('reservar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Calendar ────────────────────────────────────────────────
const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function changeMonth(dir) {
  bkState.calMonth += dir;
  if (bkState.calMonth > 11) { bkState.calMonth = 0; bkState.calYear++; }
  if (bkState.calMonth < 0) { bkState.calMonth = 11; bkState.calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('bk-cal-days');
  const label = document.getElementById('bk-cal-month-label');
  if (!container || !label) return;

  label.textContent = monthNames[bkState.calMonth] + ' ' + bkState.calYear;
  container.innerHTML = '';

  const firstDay = new Date(bkState.calYear, bkState.calMonth, 1);
  let startDay = firstDay.getDay() - 1; // Monday = 0
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(bkState.calYear, bkState.calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'bk-day empty';
    container.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.className = 'bk-day';
    btn.textContent = d;
    const dateObj = new Date(bkState.calYear, bkState.calMonth, d);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Past days
    if (dateObj < today) {
      btn.classList.add('disabled');
    }
    // Today
    else if (dateObj.getTime() === today.getTime()) {
      btn.classList.add('today');
    }
    // Booked days
    if (bookedDates.includes(dateStr)) {
      btn.classList.add('booked');
    }
    // Selected range
    if (bkState.checkin && dateStr === bkState.checkin.toISOString().split('T')[0]) {
      btn.classList.add('selected');
    }
    if (bkState.checkout && dateStr === bkState.checkout.toISOString().split('T')[0]) {
      btn.classList.add('selected');
    }
    if (bkState.checkin && bkState.checkout && dateObj > bkState.checkin && dateObj < bkState.checkout) {
      btn.classList.add('in-range');
    }

    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled') || btn.classList.contains('booked')) return;
      handleDayClick(dateObj);
    });

    container.appendChild(btn);
  }
}

function handleDayClick(dateObj) {
  if (bkState.selecting === 'checkin') {
    bkState.checkin = dateObj;
    bkState.checkout = null;
    bkState.selecting = 'checkout';
  } else {
    if (dateObj <= bkState.checkin) {
      bkState.checkin = dateObj;
      bkState.checkout = null;
      bkState.selecting = 'checkout';
    } else {
      // Check if any booked date falls in range
      const hasConflict = bookedDates.some(bd => {
        const bDate = new Date(bd + 'T00:00:00');
        return bDate >= bkState.checkin && bDate < dateObj;
      });
      if (hasConflict) {
        showAvailMsg('Las fechas seleccionadas incluyen días ocupados. Elige otro rango.', false);
        return;
      }
      bkState.checkout = dateObj;
      bkState.selecting = 'checkin';
    }
  }
  updateDateDisplays();
  renderCalendar();
}

function formatDate(d) {
  if (!d) return '—';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return day + '/' + month + '/' + d.getFullYear();
}

function updateDateDisplays() {
  document.getElementById('bk-checkin-display').textContent = bkState.checkin ? formatDate(bkState.checkin) : 'Selecciona en el calendario';
  document.getElementById('bk-checkout-display').textContent = bkState.checkout ? formatDate(bkState.checkout) : '—';

  let nights = 0;
  if (bkState.checkin && bkState.checkout) {
    nights = Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24));
  }
  document.getElementById('bk-nights-display').textContent = nights;

  const btn = document.getElementById('btn-to-step3');
  if (bkState.checkin && bkState.checkout && nights > 0) {
    btn.disabled = false;
    showAvailMsg('✅ ¡Fechas disponibles! ' + nights + ' noche' + (nights > 1 ? 's' : '') + ' seleccionada' + (nights > 1 ? 's' : '') + '.', true);
    updatePriceBreakdown();
  } else {
    btn.disabled = true;
    document.getElementById('bk-availability-msg').className = 'bk-avail-msg';
    document.getElementById('bk-availability-msg').textContent = '';
  }
}

function showAvailMsg(text, available) {
  const el = document.getElementById('bk-availability-msg');
  el.textContent = text;
  el.className = 'bk-avail-msg ' + (available ? 'available' : 'unavailable');
}

function fillPaymentSummary() {
  const { total, lines, nights } = calculatePrice();
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const container = document.getElementById('bk-payment-summary');
  container.innerHTML = '';
  SEC.appendSafeParagraph(container, 'Hospedaje', bkState.accommodation || '—');
  if (bkState.accommodation === 'Zona Camping' && bkState.campingType) {
    SEC.appendSafeParagraph(container, 'Tipo carpa', bkState.campingType === 'alquiler' ? 'Alquiler de carpa' : 'Carpa propia');
  }
  SEC.appendSafeParagraph(container, 'Fechas', formatDate(bkState.checkin) + ' → ' + formatDate(bkState.checkout));
  SEC.appendSafeParagraph(container, 'Noches', String(nights));
  SEC.appendSafeParagraph(container, 'Personas', personas);
  if (bkState.cuatrimoto !== 'none') {
    SEC.appendSafeParagraph(container, 'Cuatrimoto', bkState.cuatrimoto === '1h' ? '1 hora ($70.000)' : '2 horas ($100.000)');
  }
  // Price breakdown
  if (lines.length > 0) {
    const breakdownDiv = document.createElement('div');
    breakdownDiv.style.cssText = 'margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid var(--crema-oscuro);';
    lines.forEach(l => {
      const p = document.createElement('p');
      p.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.85rem; margin: 0.2rem 0;';
      p.innerHTML = `<span>${l.label}</span><span style="font-weight:500">${formatCOP(l.amount)}</span>`;
      breakdownDiv.appendChild(p);
    });
    const totalP = document.createElement('p');
    totalP.style.cssText = 'display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--crema-oscuro); color: var(--ambar);';
    totalP.innerHTML = `<span>Total</span><span>${formatCOP(total)}</span>`;
    breakdownDiv.appendChild(totalP);
    container.appendChild(breakdownDiv);
  }
}

function fillConfirmSummary() {
  const { total, lines, nights } = calculatePrice();
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const nombre = SEC.sanitizeText(document.getElementById('bk-nombre').value, 100) || '—';
  const container = document.getElementById('bk-confirm-summary');
  container.innerHTML = '';
  const fields = [
    ['Nombre', nombre],
    ['Hospedaje', bkState.accommodation || '—'],
    ['Llegada', formatDate(bkState.checkin)],
    ['Salida', formatDate(bkState.checkout)],
    ['Noches', String(nights)],
    ['Personas', personas],
    ['Total', total > 0 ? formatCOP(total) : 'Por confirmar']
  ];
  if (bkState.accommodation === 'Zona Camping' && bkState.campingType) {
    fields.splice(2, 0, ['Tipo carpa', bkState.campingType === 'alquiler' ? 'Alquiler de carpa' : 'Carpa propia']);
  }
  if (bkState.cuatrimoto !== 'none') {
    fields.splice(-1, 0, ['Cuatrimoto', bkState.cuatrimoto === '1h' ? '1 hora' : '2 horas']);
  }
  fields.forEach(([label, value]) => {
    const div = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.textContent = label;
    const span = document.createElement('span');
    span.textContent = value;
    if (label === 'Total') span.style.cssText = 'font-family: var(--heading); font-size: 1.2rem; color: var(--ambar);';
    div.appendChild(lbl);
    div.appendChild(span);
    container.appendChild(div);
  });
}

async function iniciarPagoWompi() {
  const nombre = SEC.sanitizeText(document.getElementById('bk-nombre').value, 100);
  const telefono = SEC.normalizePhone(document.getElementById('bk-telefono').value);
  const mensaje = SEC.sanitizeText(document.getElementById('bk-mensaje').value, 500);
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const nights = bkState.checkin && bkState.checkout ? Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24)) : 0;

  if (!SEC.isValidAccommodation(bkState.accommodation)) {
    alert('Selecciona un hospedaje válido.');
    goToStep(1);
    return;
  }
  if (!bkState.checkin || !bkState.checkout || nights < 1) {
    alert('Selecciona fechas válidas.');
    goToStep(2);
    return;
  }
  if (!SEC.isValidName(nombre)) {
    alert('Ingresa un nombre válido (solo letras, mínimo 2 caracteres).');
    goToStep(3);
    return;
  }
  if (!SEC.isValidPhone(telefono)) {
    alert('Ingresa un número de WhatsApp válido (10 dígitos).');
    goToStep(3);
    return;
  }
  if (!SEC.isValidPersonas(personas)) {
    alert('Selecciona un número de personas válido.');
    goToStep(2);
    return;
  }
  
  if (!nombre || !telefono) {
    alert('Por favor regresa al paso 3 e ingresa tu nombre y WhatsApp para poder contactarte.');
    return;
  }

  // Anti-Spam: Honeypot check
  const honeypot = document.getElementById('bk-honeypot');
  if (honeypot && honeypot.value !== '') {
    console.warn("Bot detectado (Honeypot llenado). Abortando.");
    return; // Silently reject
  }

  // Anti-Spam: Rate limiting (1 reserva cada 5 minutos por navegador)
  const lastResTime = localStorage.getItem('last_reservation_time');
  if (lastResTime) {
    const timeDiff = Date.now() - parseInt(lastResTime);
    if (timeDiff < 5 * 60 * 1000) { // 5 minutos
      alert('Has realizado demasiadas solicitudes recientes. Por favor espera unos minutos e intenta de nuevo.');
      return;
    }
  }

  const btn = document.getElementById('bk-wompi-btn');
  const errorLabel = document.getElementById('bk-wompi-error');
  btn.disabled = true;
  btn.querySelector('span') ? btn.querySelector('span').textContent = 'Enviando...' : btn.textContent = 'Enviando...';
  errorLabel.style.display = 'none';

  try {
    let insertId = 'PENDIENTE';
    
    const checkinStr = bkState.checkin.toISOString().split('T')[0];
    const checkoutStr = bkState.checkout.toISOString().split('T')[0];

    if (!SEC.isValidIsoDate(checkinStr) || !SEC.isValidIsoDate(checkoutStr)) {
      throw new Error('Fechas inválidas');
    }

    const overlapFilters = [
      'select=id',
      'estado=neq.cancelado',
      SEC.buildEqFilter('hospedaje', bkState.accommodation),
      SEC.buildDateFilter('fecha_llegada', 'lt', checkoutStr),
      SEC.buildDateFilter('fecha_salida', 'gt', checkinStr)
    ].join('&');

    const overlapRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas?${overlapFilters}`,
      { headers: getSupabaseHeaders() }
    );
    
    if (!overlapRes.ok) throw new Error('Error al verificar disponibilidad');
    const overlaps = await overlapRes.json();
    
    if (overlaps && overlaps.length > 0) {
      alert('⚠️ Lo sentimos, alguien más acaba de reservar esas fechas mientras completabas el formulario. Por favor, selecciona otras fechas.');
      btn.disabled = false;
      btn.textContent = 'Enviar comprobante por WhatsApp';
      await fetchBookedDates();
      goToStep(2);
      return;
    }

    // 2. Guardar en Supabase como 'pendiente'
    const { total: precioTotal } = calculatePrice();
    const newReservation = {
      hospedaje: bkState.accommodation,
      fecha_llegada: checkinStr,
      fecha_salida: checkoutStr,
      noches: nights,
      personas: personas,
      nombre_cliente: nombre,
      telefono_cliente: telefono,
      notas: mensaje,
      estado: 'pendiente',
      precio_total: precioTotal,
      tipo_carpa: bkState.accommodation === 'Zona Camping' ? bkState.campingType : null,
      cuatrimoto: bkState.cuatrimoto === 'none' ? null : bkState.cuatrimoto
    };

    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas`,
      {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify(newReservation)
      }
    );

    if (!insertRes.ok) throw new Error('Error al guardar la reserva');
    
    // Marcar tiempo para evitar spam
    localStorage.setItem('last_reservation_time', Date.now().toString());

    // To get the inserted ID we must fetch it. 
    // In PostgREST (Supabase), returning the inserted row is done by sending `Prefer: return=representation`.
    // My getSupabaseHeaders() already includes this!
    const insertedData = await insertRes.json();
    if (insertedData && insertedData.length > 0) {
      insertId = insertedData[0].id;
    }

    // 2. Construir mensaje de WhatsApp
    let msg = '🏕 *RESERVA - Glamping Culumpulos Gramalote*\n\n';
    msg += '📋 *Datos de la reserva:*\n';
    msg += '• *Hospedaje:* ' + bkState.accommodation + '\n';
    if (bkState.accommodation === 'Zona Camping' && bkState.campingType) {
      msg += '• *Tipo carpa:* ' + (bkState.campingType === 'alquiler' ? 'Alquiler de carpa' : 'Carpa propia') + '\n';
    }
    msg += '• *Llegada:* ' + formatDate(bkState.checkin) + '\n';
    msg += '• *Salida:* ' + formatDate(bkState.checkout) + '\n';
    msg += '• *Noches:* ' + nights + '\n';
    msg += '• *Personas:* ' + personas + '\n';
    if (bkState.cuatrimoto !== 'none') {
      msg += '• *Cuatrimoto:* ' + (bkState.cuatrimoto === '1h' ? '1 hora' : '2 horas') + '\n';
    }
    const { total: totalPrice } = calculatePrice();
    if (totalPrice > 0) {
      msg += '\n💰 *Total estimado:* ' + formatCOP(totalPrice) + '\n';
    }
    msg += '👤 *Datos personales:*\n';
    msg += '• *Nombre:* ' + nombre + '\n';
    if (telefono) msg += '• *WhatsApp:* ' + telefono + '\n';
    if (mensaje) msg += '\n📝 *Notas:* ' + mensaje + '\n';
    msg += `\n*ID Reserva:* ${insertId}\n`;
    msg += '\n💰 *Adjunto mi comprobante de pago.*\n';
    msg += '¡Quedo atento a la confirmación de mi reserva para bloquear las fechas en la web! 🌿';

    // Abrir WhatsApp
    window.open('https://wa.me/573204201013?text=' + encodeURIComponent(msg), '_blank');
    
    btn.textContent = 'Enviado correctamente';
    btn.style.background = 'var(--verde-claro)';
    
    // Recargar fechas por si acaso, aunque no se bloquean hasta que el admin las apruebe
    await fetchBookedDates();
    
  } catch (err) {
    console.error("Error al crear la reserva", err);
    errorLabel.textContent = 'Error guardando en base de datos, intenta enviar por WhatsApp manualmente.';
    errorLabel.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Intentar de nuevo';
  }
}


document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

window.addEventListener('scroll', () => {
  const mobile = window.innerWidth <= 768;
  document.getElementById('nav').style.padding = window.scrollY > 80
    ? (mobile ? '0.6rem 1.2rem' : '0.8rem 3rem')
    : (mobile ? '1rem 1.2rem' : '1.2rem 3rem');
  const prog = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  document.getElementById('scroll-progress').style.width = prog + '%';
  const bt = document.getElementById('back-top');
  if (window.scrollY > 500) bt.classList.add('visible'); else bt.classList.remove('visible');
});


// ── Magic Card Spotlight ───────────────────────────────────────────
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

// ── Mobile Menu ────────────────────────────────────────────────────
function toggleMobileMenu() {
  const m = document.getElementById('mobile-menu');
  const h = document.getElementById('hamburger');
  m.classList.toggle('open'); h.classList.toggle('open');
  document.body.style.overflow = m.classList.contains('open') ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Star Particles ─────────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 160; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.3, a: Math.random(), da: (Math.random() - 0.5) * 0.008 + 0.003 });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.a += s.da; if (s.a > 1 || s.a < 0) s.da *= -1;
      ctx.beginPath(); ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,245,200,' + Math.max(0, Math.min(1, s.a)) + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Lightbox ───────────────────────────────────────────────────────
const lbImgs = [];
let lbIdx = 0;
document.querySelectorAll('.galeria-item img').forEach((img, i) => {
  lbImgs.push({ src: img.src, alt: img.alt });
  img.parentElement.addEventListener('click', () => openLightbox(i));
});
function openLightbox(i) {
  lbIdx = i;
  document.getElementById('lightbox-img').src = lbImgs[i].src;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}
function lbNext() { lbIdx = (lbIdx + 1) % lbImgs.length; document.getElementById('lightbox-img').src = lbImgs[lbIdx].src; }
function lbPrev() { lbIdx = (lbIdx - 1 + lbImgs.length) % lbImgs.length; document.getElementById('lightbox-img').src = lbImgs[lbIdx].src; }
document.getElementById('lightbox').addEventListener('click', function(e) { if (e.target === this) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowRight') lbNext(); if (e.key === 'ArrowLeft') lbPrev(); });

// Recalcular ScrollTrigger cuando TODAS las imágenes hayan cargado
window.addEventListener('load', () => {
  setTimeout(() => ScrollTrigger.refresh(), 300);
});
// Recalcular al rotar pantalla en móvil
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    resizeCanvas();
    ScrollTrigger.refresh();
  }, 400);
});
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.closeLightbox = closeLightbox;
window.lbPrev = lbPrev;
window.lbNext = lbNext;
window.selectAccommodation = selectAccommodation;
window.goToStep = goToStep;
window.changeMonth = changeMonth;
window.iniciarPagoWompi = iniciarPagoWompi;
window.selectCampingType = selectCampingType;
window.selectCuatrimoto = selectCuatrimoto;

// Initialize cuatrimoto default
selectCuatrimoto('none');
