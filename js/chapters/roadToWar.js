// ===========================================================
// CHAPTER 6 — THE ROAD TO WAR
// Tension rendered abstractly rather than literally: two angled
// blocks (Pandava gold, Kaurava ember) slide in from opposite
// edges and converge toward center as the user scrolls, stopping
// just short of touching — the war hasn't started yet. Text here
// uses shorter durations and a sharper ease than earlier chapters
// (power2 → power4) as the one deliberate "faster pacing" cue.
// ===========================================================

import { prefersReducedMotion } from '../utils/helpers.js';

export function initRoadToWar() {
  const reduced = prefersReducedMotion();
  const left = document.querySelector('.road__army--pandava');
  const right = document.querySelector('.road__army--kaurava');
  const paras = document.querySelectorAll('.road__text');

  if (left && right) {
    if (reduced) {
      gsap.set([left, right], { xPercent: 0 });
    } else {
      gsap.set(left, { xPercent: -140 });
      gsap.set(right, { xPercent: 140 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.chapter-road',
          scroller: '[data-scroll-container]',
          start: 'top 75%',
          end: 'bottom 30%',
          scrub: 0.5,
        },
      });
      tl.to(left, { xPercent: -6, ease: 'none' }, 0);
      tl.to(right, { xPercent: 6, ease: 'none' }, 0);
    }
  }

  if (reduced) return;

  paras.forEach((p, i) => {
    gsap.set(p, { opacity: 0, y: 22 });
    gsap.to(p, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      delay: i * 0.05,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: p,
        scroller: '[data-scroll-container]',
        start: 'top 85%',
        once: true,
      },
    });
  });
}
