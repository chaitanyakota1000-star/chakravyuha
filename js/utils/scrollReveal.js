// ===========================================================
// SCROLL REVEAL
// Generic utility: any element with class="reveal" fades/lifts
// into place the first time it crosses 85% of the viewport.
// The actual transition lives in css/animations.css — this file
// only toggles the .is-visible class via ScrollTrigger, reading
// position through the same Locomotive-driven scroller every
// other scroll-triggered animation uses.
// ===========================================================

export function initScrollReveal(scroller = '[data-scroll-container]') {
  const elements = document.querySelectorAll('.reveal:not([data-reveal-bound])');

  elements.forEach((el) => {
    el.dataset.revealBound = 'true';
    ScrollTrigger.create({
      trigger: el,
      scroller,
      start: 'top 85%',
      once: true,
      onEnter: () => el.classList.add('is-visible'),
    });
  });
}
