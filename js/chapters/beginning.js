// ===========================================================
// CHAPTER 2 — THE BEGINNING
// The lineage is told through two short paragraphs whose words
// reveal in a stagger as each paragraph enters view — a quieter
// echo of the Invocation's title reveal, now driven by scroll
// instead of load. The branching lineage-tree SVG behind the
// text drifts at its own speed via Locomotive's native
// data-scroll-speed parallax (no extra JS required for that part).
// ===========================================================

import { splitText, prefersReducedMotion } from '../utils/helpers.js';

export function initBeginning() {
  const reduced = prefersReducedMotion();
  const paragraphs = document.querySelectorAll('.beginning__text');

  paragraphs.forEach((p) => {
    if (reduced) return; // paragraphs are visible by default in CSS

    const words = splitText(p, 'words');
    gsap.set(words, { opacity: 0, yPercent: 60 });

    gsap.to(words, {
      opacity: 1,
      yPercent: 0,
      duration: 0.7,
      stagger: 0.015,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: p,
        scroller: '[data-scroll-container]',
        start: 'top 80%',
        once: true,
      },
    });
  });
}
