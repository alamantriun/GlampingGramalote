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
gsap.fromTo('.galeria-inner > div:first-child', {
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
