// ===========================================================
// SMOOTH SCROLL
// Wires Locomotive Scroll to GSAP's ScrollTrigger so every
// chapter's scroll-triggered animation reads position from the
// smoothed scroll value instead of the native (unsmoothed) one.
// This is the standard Locomotive <-> ScrollTrigger bridge.
// ===========================================================

import { prefersReducedMotion, debounce } from './utils/helpers.js';

export function initSmoothScroll() {
  const container = document.querySelector('[data-scroll-container]');
  const reduced = prefersReducedMotion();

  const scroll = new LocomotiveScroll({
    el: container,
    smooth: !reduced,
    smoothMobile: false,
    lerp: 0.09,
    multiplier: 1,
  });

  scroll.on('scroll', ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(container, {
    scrollTop(value) {
      return arguments.length
        ? scroll.scrollTo(value, { duration: 0, disableLerp: true })
        : scroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: container.style.transform ? 'transform' : 'fixed',
  });

  ScrollTrigger.addEventListener('refresh', () => scroll.update());
  ScrollTrigger.refresh();

  window.addEventListener(
    'resize',
    debounce(() => scroll.update(), 200)
  );

  return scroll;
}
