// ===========================================================
// COLOR WASH
// A fixed, mix-blend-mode:color overlay whose hue shifts as the
// user scrolls through the whole page — warm gold at the
// Invocation, cooling through Exile, peaking ember-red at
// Kurukshetra, settling calm through the Gita, warming again by
// the Closing. One ScrollTrigger spanning the entire document;
// onUpdate reads overall progress (0–1) and interpolates between
// a small set of color stops. Skipped under reduced motion, like
// every other scroll-tied visual effect in this project.
// ===========================================================

import { prefersReducedMotion } from './helpers.js';

const STOPS = [
  { p: 0.0, c: [40, 32, 20] }, // Invocation — warm dark gold
  { p: 0.15, c: [24, 27, 38] }, // Beginning — cool dusk
  { p: 0.3, c: [42, 22, 16] }, // Dice Game — ember warning
  { p: 0.52, c: [58, 18, 12] }, // Kurukshetra — deep ember peak
  { p: 0.66, c: [26, 22, 36] }, // Bhagavad Gita — calm indigo
  { p: 0.82, c: [38, 30, 20] }, // Aftermath — settling gold
  { p: 1.0, c: [44, 35, 19] }, // Closing — warm gold
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function colorAt(progress) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (progress >= a.p && progress <= b.p) {
      const t = (progress - a.p) / (b.p - a.p || 1);
      const r = Math.round(lerp(a.c[0], b.c[0], t));
      const g = Math.round(lerp(a.c[1], b.c[1], t));
      const bch = Math.round(lerp(a.c[2], b.c[2], t));
      return `rgb(${r}, ${g}, ${bch})`;
    }
  }
  const last = STOPS[STOPS.length - 1].c;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

export function initColorWash() {
  if (prefersReducedMotion()) return;

  const el = document.querySelector('.color-wash');
  const container = document.querySelector('main[data-scroll-container]');
  if (!el || !container) return;

  ScrollTrigger.create({
    trigger: container,
    scroller: '[data-scroll-container]',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      el.style.backgroundColor = colorAt(self.progress);
    },
  });
}
