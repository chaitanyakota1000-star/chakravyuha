// ===========================================================
// CHAPTER 8 — THE BHAGAVAD GITA MOMENT
// The war pauses. Tone drops to stillness: a small, slow chakra
// (no ambient fast spin this time — just a single settling
// rotation) and two verse lines typed out character-by-character,
// one after the other, with a blinking caret on the active line.
// The "typewriter" reuses the same splitText() helper as every
// other chapter, just with type:'chars' and a near-zero stagger.
// ===========================================================

import { splitText, prefersReducedMotion } from '../utils/helpers.js';

export function initBhagavadGita() {
  const reduced = prefersReducedMotion();
  const chakra = document.querySelector('.gita__chakra');
  const framing = document.querySelector('.gita__framing');
  const verses = document.querySelectorAll('.gita__verse');

  if (reduced) return; // content is visible by default in CSS

  gsap.set(chakra, { scale: 0.6, opacity: 0, rotate: -30, transformOrigin: '50% 50%' });
  gsap.set(framing, { opacity: 0, y: 16 });

  const intro = gsap.timeline({
    scrollTrigger: {
      trigger: '.chapter-gita',
      scroller: '[data-scroll-container]',
      start: 'top 65%',
      once: true,
    },
  });

  intro
    .to(chakra, { scale: 1, opacity: 1, rotate: 0, duration: 1.4, ease: 'power3.out' })
    .to(framing, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
    .to(chakra, { rotate: 15, duration: 3, ease: 'sine.inOut' }, '-=0.2'); // one slow settle, not a spin loop

  // Typewriter, one verse at a time, only once each verse is reached.
  verses.forEach((verse) => {
    const chars = splitText(verse, 'chars');
    gsap.set(chars, { opacity: 0 });
    verse.classList.add('gita__verse--caret');

    ScrollTrigger.create({
      trigger: verse,
      scroller: '[data-scroll-container]',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(chars, {
          opacity: 1,
          duration: 0.01,
          stagger: 0.028,
          ease: 'none',
          onComplete: () => verse.classList.remove('gita__verse--caret'),
        });
      },
    });
  });
}
