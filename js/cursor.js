// ===========================================================
// CURSOR
// Dot + trailing ring, skipped entirely on touch devices and
// under reduced-motion (native cursor stays visible instead).
// Elements can additionally carry data-cursor-text="Drag" (etc.)
// to grow the ring into a labeled pill instead of just the
// default "active" state — used sparingly, only where it adds a
// real affordance (the character carousel), not on every link.
// ===========================================================

import { prefersReducedMotion, isTouchDevice } from './utils/helpers.js';

export function initCursor() {
  if (prefersReducedMotion() || isTouchDevice()) return;

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const label = document.querySelector('.cursor-label');
  if (!dot || !ring) return;

  // Center on the cursor via xPercent/yPercent, NOT a static CSS
  // transform — GSAP's x/y tweens overwrite the whole `transform`
  // property, so a plain `transform: translate(-50%,-50%)` in CSS
  // gets silently wiped out the instant quickTo starts writing x/y.
  // xPercent/yPercent are separate GSAP-tracked transform components
  // that compose additively with x/y instead of colliding with them.
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

  const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power3' });
  const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power3' });
  const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.3, ease: 'power3' });
  const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.3, ease: 'power3' });

  let cursorStarted = false;
  window.addEventListener('mousemove', (e) => {
    if (!cursorStarted) {
      cursorStarted = true;
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      document.body.classList.add('custom-cursor-active');
    }
    moveDotX(e.clientX);
    moveDotY(e.clientY);
    moveRingX(e.clientX);
    moveRingY(e.clientY);
  });

  // Any element can opt into the "active" ring state via .cursor-hover;
  // a data-cursor-text attribute additionally grows the ring into a
  // pill carrying that text, and hides the small dot while it's shown.
  const bindHoverTargets = () => {
    document.querySelectorAll('a, button, .cursor-hover').forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      const text = el.dataset.cursorText;

      el.addEventListener('mouseenter', () => {
        ring.classList.add('cursor-ring--active');
        if (text && label) {
          label.textContent = text;
          ring.classList.add('cursor-ring--label');
          gsap.to(dot, { opacity: 0, duration: 0.2 });
        }
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('cursor-ring--active');
        if (text && label) {
          ring.classList.remove('cursor-ring--label');
          label.textContent = '';
          gsap.to(dot, { opacity: 1, duration: 0.2 });
        }
      });
    });
  };

  bindHoverTargets();
  // Re-bind is exposed so later chapters (character cards, etc.)
  // can call it after injecting new interactive elements.
  window.__mahabharatCursor = { bindHoverTargets };
}
