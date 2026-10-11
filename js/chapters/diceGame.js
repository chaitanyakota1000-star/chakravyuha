// ===========================================================
// CHAPTER 4 — THE DICE GAME & DISHONOR
// Visually the tensest moment so far: a dim, slow-flickering
// vignette (a single looping GSAP tween, kept in the same
// animation pipeline as every other chapter) behind two narrative
// panels that use the generic .reveal utility. No new reveal
// logic needed here — this chapter mainly proves the Split 2
// scroll-reveal system generalizes cleanly, as planned.
// ===========================================================

import { prefersReducedMotion } from '../utils/helpers.js';

export function initDiceGame() {
  if (prefersReducedMotion()) return; // vignette flicker is decorative only

  const vignette = document.querySelector('.dice__vignette');
  if (!vignette) return;

  gsap.to(vignette, {
    opacity: 0.85,
    duration: 0.15,
    repeat: -1,
    yoyo: true,
    repeatDelay: 2.4,
    ease: 'power1.inOut',
  });
}
