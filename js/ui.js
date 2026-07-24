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
