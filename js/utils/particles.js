// ===========================================================
// PARTICLES
// A small, dependency-free canvas particle field — used for the
// rising embers behind Kurukshetra. Deliberately simple: no
// physics library, just position + velocity + fade, respawned
// in place once a particle dies or drifts off-canvas.
// Caller controls start()/stop() so it only runs while the
// section is actually on screen (see kurukshetra.js).
// ===========================================================

export function createEmberField(canvas, options = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const count = options.count ?? 55;
  const colors = options.colors ?? ['#d1481f', '#9c2b1f', '#c9a55c'];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let particles = [];
  let rafId = null;
  let running = false;

  function resize() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }

  function spawn(fromBottom = true) {
    return {
      x: Math.random() * canvas.width,
      y: fromBottom ? canvas.height + Math.random() * 40 : Math.random() * canvas.height,
      r: (Math.random() * 1.5 + 0.5) * dpr,
      speed: (Math.random() * 0.5 + 0.25) * dpr,
      drift: (Math.random() - 0.5) * 0.35 * dpr,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: Math.random() * 0.6 + 0.4,
    };
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      p.life -= 0.0032;
      if (p.y < -10 || p.life <= 0) Object.assign(p, spawn(true));

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (running) rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    particles = Array.from({ length: count }, () => spawn(false));
    window.addEventListener('resize', resize);
    tick();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { start, stop };
}
