// ===========================================================
// CHAPTER 9 — AFTERMATH & WISDOM
// The quietest chapter after Kurukshetra's intensity. Text pacing
// is slowed purely in CSS (see .chapter-aftermath .reveal in
// main.css) so no bespoke stagger logic is needed here — this
// chapter's only job is the particle field, reusing the exact
// same utility from Chapter 7 with fewer, slower, warmer motes:
// proof the Split 3 particle system generalizes, as planned.
// ===========================================================

import { prefersReducedMotion } from '../utils/helpers.js';
import { createEmberField } from '../utils/particles.js';

export function initAftermath() {
  const reduced = prefersReducedMotion();
  const section = document.querySelector('.chapter-aftermath');
  const canvas = document.querySelector('.aftermath__motes');
  if (!section || !canvas || reduced) return;

  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const field = createEmberField(canvas, {
    count: isMobile ? 16 : 30,
    colors: ['#f0d799', '#c9a55c', '#ece4d3'],
  });
  if (!field) return;

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? field.start() : field.stop())),
    { threshold: 0.1 }
  );
  observer.observe(section);
}
