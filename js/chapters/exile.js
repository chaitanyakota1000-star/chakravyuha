// ===========================================================
// CHAPTER 5 — EXILE AND TRIALS
// Deliberately the quietest chapter since the Invocation: a
// muted overlay desaturates the section's mood, pacing is
// slower (longer durations, gentler eases than neighbouring
// chapters), and a single wandering path draws itself across
// the scroll range — using the SVG path's own real length via
// getTotalLength(), not a guessed dasharray value.
// ===========================================================

import { prefersReducedMotion } from '../utils/helpers.js';

export function initExile() {
  const path = document.querySelector('.exile__path');
  if (path) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    if (prefersReducedMotion()) {
      path.style.strokeDashoffset = '0';
    } else {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.chapter-exile',
          scroller: '[data-scroll-container]',
          start: 'top 70%',
          end: 'bottom 40%',
          scrub: 0.6,
        },
      });
    }
  }

  // Text in this chapter reveals slower than the default .reveal
  // timing to reinforce the "waiting years" pacing.
  const paras = document.querySelectorAll('.exile__text');
  if (prefersReducedMotion()) return;

  paras.forEach((p) => {
    gsap.set(p, { opacity: 0, y: 30 });
    gsap.to(p, {
      opacity: 1,
      y: 0,
      duration: 1.6,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: p,
        scroller: '[data-scroll-container]',
        start: 'top 85%',
        once: true,
      },
    });
  });
}
