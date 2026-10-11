// ===========================================================
// HELPERS
// Small, dependency-free utilities shared across every chapter.
// ===========================================================

/** True if the user's OS/browser requests reduced motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True on touch-primary devices (used to skip the custom cursor). */
export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Standard debounce — used for resize/scroll-adjacent listeners. */
export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Manual text splitter — replaces GSAP's SplitText (a paid Club
 * GreenSock plugin) with a free equivalent. Wraps each word (or
 * character) in its own <span> so GSAP can stagger-animate them,
 * while keeping the original text available to screen readers via
 * aria-label on the parent and aria-hidden on the generated spans.
 *
 * @param {HTMLElement} element
 * @param {'words'|'chars'} type
 * @returns {HTMLElement[]} the generated spans, in order
 */
export function splitText(element, type = 'words') {
  const text = element.textContent.trim();
  element.textContent = '';
  element.setAttribute('aria-label', text);

  const spans = [];
  const units = type === 'chars' ? [...text] : text.split(' ');

  units.forEach((unit, i) => {
    const span = document.createElement('span');
    span.className = type === 'chars' ? 'split-char' : 'split-word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = unit;
    element.appendChild(span);
    spans.push(span);

    if (type === 'words' && i < units.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });

  return spans;
}
