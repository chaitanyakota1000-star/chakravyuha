// ===========================================================
// MAGNETIC HOVER
// Elements pull toward the cursor as it enters their bounding
// box, proportional to distance from center, and spring back on
// mouseleave. Pure GSAP quickTo, no plugin — the same technique
// documented across current GSAP hover-effect galleries. Skipped
// entirely on touch devices (mousemove doesn't mean the same
// thing there) and under reduced motion.
// ===========================================================

import { prefersReducedMotion, isTouchDevice } from './helpers.js';

export function initMagnetic(elements, options = {}) {
  if (prefersReducedMotion() || isTouchDevice()) return;

  const strength = options.strength ?? 0.35;
  const list = elements instanceof Element ? [elements] : Array.from(elements || []);

  list.forEach((el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = 'true';

    const moveX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const moveY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      moveX(relX * strength);
      moveY(relY * strength);
    });

    el.addEventListener('mouseleave', () => {
      moveX(0);
      moveY(0);
    });
  });
}
