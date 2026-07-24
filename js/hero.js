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
const currentFrame = index => `img/frames/${(index + 1).toString().padStart(2, '0')}.png`;

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

// Esperar a que todas las imágenes carguen antes del primer render
preloadFrames().then(() => {
  resizeCanvas();
  setTimeout(() => ScrollTrigger.refresh(), 100);
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
