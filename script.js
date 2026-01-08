// Minimal Adaptive Wallpaper - responsive + hiDPI + smooth transition
// Copia este archivo tal cual.

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d', { alpha: false }); // alpha false slightly faster
let DPR = Math.max(window.devicePixelRatio || 1, 1);

let width = 0;
let height = 0;
let particles = [];
let transition = 0; // 0 => night, 1 => day
let target = 1;
const MIN_PARTICLES = 40;
const MAX_PARTICLES = 200;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Resize canvas with DPR handling
function resizeCanvas() {
  DPR = Math.max(window.devicePixelRatio || 1, 1);
  width = Math.max(window.innerWidth, 1);
  height = Math.max(window.innerHeight, 1);

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  canvas.width = Math.floor(width * DPR);
  canvas.height = Math.floor(height * DPR);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing so coordinates use CSS pixels
  initParticles(); // re-init particles so distribution fits new size
}

// Determine day/night (adjust hours if quieres)
function isDay() {
  const h = new Date().getHours();
  return h >= 7 && h < 19;
}

// Particle implementation - parameters scale with area
class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    // size scaled by screen diagonal
    const diag = Math.sqrt(width * width + height * height);
    this.size = (Math.random() * 1.2 + 0.4) * (diag / 1600);
    const speedBase = (diag / 2000) * 0.12; // tiny base speed scaled
    this.speedX = (Math.random() - 0.5) * speedBase;
    this.speedY = (Math.random() - 0.5) * speedBase;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < -10) this.x = width + 10;
    if (this.x > width + 10) this.x = -10;
    if (this.y < -10) this.y = height + 10;
    if (this.y > height + 10) this.y = -10;
  }

  draw(rgb) {
    ctx.fillStyle = `rgb(${rgb}, ${rgb}, ${rgb})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Create particle count proportional to area, clamped
function initParticles() {
  particles = [];
  const area = Math.max(width * height, 1);
  // density factor: tune the denominator to taste
  let count = Math.round(area / 7000);
  count = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));

  for (let i = 0; i < count; i++) particles.push(new Particle());
}

// Linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animate() {
  // update target based on current hour
  target = isDay() ? 1 : 0;

  // If user prefers reduced motion, snap instantly
  if (reducedMotion) transition = target;
  else transition = lerp(transition, target, 0.02); // smoothing factor for fade

  // bg: 0=black, 255=white
  const bgVal = Math.round(lerp(0, 255, transition));
  const fgVal = 255 - bgVal;

  // paint background and particles
  ctx.fillStyle = `rgb(${bgVal},${bgVal},${bgVal})`;
  ctx.fillRect(0, 0, width, height);

  // particles
  particles.forEach(p => {
    p.update();
    p.draw(fgVal);
  });

  // update CSS variable for clock color (so text matches)
  document.documentElement.style.setProperty('--fg', `${fgVal},${fgVal},${fgVal}`);

  // next frame
  if (!reducedMotion) requestAnimationFrame(animate);
}

// Clock (tabular numbers)
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const clock = document.getElementById('clock');
  if (clock) clock.textContent = `${h}:${m}`;
}

// Initial setup
function start() {
  resizeCanvas();
  updateClock();
  // If reduced motion, draw once and use interval; otherwise use animation loop
  if (reducedMotion) {
    // single draw + periodic updates
    const bgVal = Math.round(isDay() ? 255 : 0);
    const fgVal = 255 - bgVal;
    ctx.fillStyle = `rgb(${bgVal},${bgVal},${bgVal})`;
    ctx.fillRect(0, 0, width, height);
    particles.forEach(p => p.draw(fgVal));
  } else {
    requestAnimationFrame(animate);
  }
}

// Handle resizing responsively (debounced)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
  }, 120);
});

// Recalculate reduced motion if system setting changes
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  reducedMotion = e.matches;
});

// Update clock every second (keeps it exact)
setInterval(updateClock, 1000);

// Kick off
start();
