// ===========================================================
// CURSOR GLOW
// A soft warm glow that follows the cursor everywhere on the
// page, not just within one section — the "cursor as an active
// ingredient" principle behind a lot of current award-winning
// sites, done here with a plain CSS radial-gradient plus two
// GSAP quickTo tweens on the --mx/--my custom properties (GSAP
// can animate CSS custom properties directly; the gradient in
// main.css re-reads them on every frame automatically). No
// canvas, no WebGL — deliberately, so it stays predictable
// without ever being seen render. Skipped on touch (no hover)
// and under reduced motion.
// ===========================================================

import { prefersReducedMotion, isTouchDevice } from './utils/helpers.js';

export function initCursorGlow() {
  if (prefersReducedMotion() || isTouchDevice()) return;

  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  // Lock the custom properties to pixel units from the start —
  // the CSS fallback (var(--mx, 50%)) is a %, and letting GSAP
  // infer units from that instead of a plain px number is exactly
  // the kind of mismatch that silently breaks a custom-property tween.
  gsap.set(glow, { '--mx': window.innerWidth / 2 + 'px', '--my': window.innerHeight / 2 + 'px' });

  const moveX = gsap.quickTo(glow, '--mx', { duration: 0.55, ease: 'power2' });
  const moveY = gsap.quickTo(glow, '--my', { duration: 0.55, ease: 'power2' });

  window.addEventListener('mousemove', (e) => {
    moveX(e.clientX);
    moveY(e.clientY);
  });

  gsap.to(glow, { opacity: 1, duration: 1, delay: 0.3 });
}
