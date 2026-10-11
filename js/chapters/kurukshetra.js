// ===========================================================
// CHAPTER 7 — KURUKSHETRA (THE GREAT WAR)
// The most technically involved chapter: the section pins while
// a sequence of short phrases cross-fades in a scrubbed montage,
// a canvas ember field burns behind it (started/stopped via
// IntersectionObserver so it never runs off-screen), and each
// new fragment lands with a short, *non-scrubbed* flash + shake
// AND a character glitch/scramble-in, so the punctuation feels
// snappy and chaotic rather than tied to scroll speed. The
// scramble is real-time (its own short GSAP timeline per
// character), deliberately decoupled from the scrubbed master
// timeline that only handles each fragment's opacity — the same
// separation of concerns the flash/shake already used.
// Under reduced motion: no pin, no montage, no particles, no
// scramble — every fragment is simply shown, stacked and still.
// ===========================================================

import { prefersReducedMotion, splitText } from '../utils/helpers.js';
import { createEmberField } from '../utils/particles.js';

export function initKurukshetra() {
  const reduced = prefersReducedMotion();
  const section = document.querySelector('.chapter-kurukshetra');
  const canvas = document.querySelector('.kurukshetra__embers');
  const pin = document.querySelector('.kurukshetra__pin');
  const flashEl = document.querySelector('.kurukshetra__flash');
  const fragments = gsap.utils.toArray('.war-fragment');

  if (!section) return;

  // Embers only ever run while the section is actually visible.
  // Particle count is trimmed on smaller/likely lower-powered
  // devices to keep the canvas cheap.
  if (canvas && !reduced) {
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    const field = createEmberField(canvas, { count: isMobile ? 26 : 55 });
    if (field) {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? field.start() : field.stop())),
        { threshold: 0.1 }
      );
      observer.observe(section);
    }
  }

  if (reduced || fragments.length === 0) {
    // Static fallback: readable, still, no animation
    gsap.set(fragments, { opacity: 1, y: 0 });
    return;
  }

  const GLYPHS = '田水火風雷光影卍ᚱᛟΔΣΩ✶∴';

  // Split each fragment into characters once at setup, capturing the
  // real text before we start overwriting it — splitText() mutates
  // the DOM, so calling it again on every scramble would break.
  const fragmentChars = fragments.map((frag) => {
    const chars = splitText(frag, 'chars');
    chars.forEach((span) => {
      span.dataset.real = span.textContent;
    });
    return chars;
  });

  function scrambleIn(chars) {
    chars.forEach((span, i) => {
      gsap
        .timeline({ delay: i * 0.018 })
        .to(span, {
          duration: 0.03,
          repeat: 3,
          onRepeat: () => {
            span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          },
        })
        .call(() => {
          span.textContent = span.dataset.real;
        });
    });
  }

  function flash() {
    if (flashEl) gsap.fromTo(flashEl, { opacity: 0.4 }, { opacity: 0, duration: 0.35, ease: 'power2.out' });
    if (pin) gsap.fromTo(pin, { x: -6 }, { x: 0, duration: 0.25, ease: 'power3.out' });
  }

  // Fluid scroll reveals: each fragment activates cleanly as it scrolls into view
  // without pinning or distorting Locomotive Scroll's section coordinate cache.
  fragments.forEach((frag, i) => {
    gsap.fromTo(
      frag,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: frag,
          scroller: '[data-scroll-container]',
          start: 'top 85%',
          once: true,
          onEnter: () => {
            scrambleIn(fragmentChars[i]);
            if (i > 0) flash();
          },
        },
      }
    );
  });
}
