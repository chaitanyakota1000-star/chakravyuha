// ===========================================================
// CHAPTER NAVIGATION
// A fixed rail of dots, one per chapter, built from the chapters
// that already exist in the DOM (reads each section's own
// aria-label rather than duplicating a hardcoded title list, so
// it can't drift out of sync with the markup). Clicking a dot
// scrolls to that chapter via Locomotive Scroll's own scrollTo
// (native anchor jumping doesn't account for Locomotive's
// transform-based smooth scroll). The active dot is tracked with
// one ScrollTrigger per chapter using onToggle, which is cheap
// and avoids any manual scroll-position math.
// ===========================================================

import { prefersReducedMotion } from './utils/helpers.js';
import { initMagnetic } from './utils/magnetic.js';

export function initChapterNav(locomotiveScroll) {
  const sections = document.querySelectorAll('main[data-scroll-container] > section[data-scroll-section]');
  const nav = document.querySelector('.chapter-nav');
  if (!nav || sections.length === 0) return;

  const reduced = prefersReducedMotion();

  const dots = Array.from(sections).map((section) => {
    const label = section.getAttribute('aria-label') || 'Chapter';
    const dot = document.createElement('button');
    dot.className = 'chapter-nav__dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to: ${label}`);

    const tooltip = document.createElement('span');
    tooltip.className = 'chapter-nav__tooltip';
    tooltip.textContent = label;
    dot.appendChild(tooltip);

    dot.addEventListener('click', () => {
      if (locomotiveScroll) {
        locomotiveScroll.scrollTo(section, { duration: reduced ? 0 : 1200 });
      } else {
        section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      }
    });

    nav.appendChild(dot);

    ScrollTrigger.create({
      trigger: section,
      scroller: '[data-scroll-container]',
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        dot.classList.toggle('chapter-nav__dot--active', self.isActive);
        dot.setAttribute('aria-current', self.isActive ? 'true' : 'false');
      },
    });

    return dot;
  });

  initMagnetic(dots, { strength: 0.5 });
}
