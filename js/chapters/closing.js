// ===========================================================
// CHAPTER 10 — CLOSING REFLECTION
// A deliberate callback to the Invocation: the same chakra
// returns once more, settles in, then completes exactly one full
// rotation scrubbed across the chapter's own scroll range — the
// story closing the circle it opened with. No repeat/loop this
// time; the rotation finishes once and holds.
// ===========================================================

import { prefersReducedMotion } from '../utils/helpers.js';

export function initClosing() {
  if (prefersReducedMotion()) return; // content is visible by default in CSS

  const chakra = document.querySelector('.closing__chakra');
  const credit = document.querySelector('.closing__credit');
  if (!chakra) return;

  gsap.set(chakra, { scale: 0.7, opacity: 0, rotate: 0, transformOrigin: '50% 50%' });
  gsap.set(credit, { opacity: 0 });

  const intro = gsap.timeline({
    scrollTrigger: {
      trigger: '.chapter-closing',
      scroller: '[data-scroll-container]',
      start: 'top 70%',
      once: true,
    },
  });
  intro
    .to(chakra, { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' })
    .to(credit, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4');

  gsap.to(chakra, {
    rotate: 360,
    ease: 'none',
    scrollTrigger: {
      trigger: '.chapter-closing',
      scroller: '[data-scroll-container]',
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 0.8,
    },
  });
}
