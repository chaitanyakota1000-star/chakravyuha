// ===========================================================
// CHAPTER 3 — THE GREAT CHARACTERS
// A bespoke, museum-grade tarot card carousel and lore viewer.
// Features:
// - Faction filter rail (All, Pandavas, Kauravas, Elders, Divine)
// - Interactive 3-tier lore tabs (Lineage, Arms & Astras, War Turning Point)
// - Pointer drag / swipe with snap-to-card
// - Responsive dots, live 01/12 counter, prev/next arrows & keyboard nav
// - Subtle 3D card tilt & custom cursor magnetics
// ===========================================================

import { prefersReducedMotion, debounce, isTouchDevice } from '../utils/helpers.js';
import { initMagnetic } from '../utils/magnetic.js';

export function initCharacters() {
  const root = document.querySelector('.characters-carousel');
  if (!root) return;

  const viewport = root.querySelector('.characters-viewport');
  const track = root.querySelector('.characters-track');
  const allCards = [...root.querySelectorAll('.character-card')];
  const prevBtn = root.querySelector('.carousel-btn--prev');
  const nextBtn = root.querySelector('.carousel-btn--next');
  const dotsWrap = document.querySelector('.carousel-dots');
  const counterCurr = document.querySelector('.counter-curr');
  const counterTotal = document.querySelector('.counter-total');
  const filterChips = [...document.querySelectorAll('.filter-chip')];

  if (!track || allCards.length === 0) return;

  const reduced = prefersReducedMotion();
  let cards = [...allCards];
  let dots = [];
  let index = 0;
  let cardStep = 0;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let baseX = 0;
  let isDragging = false;
  let hasMoved = false;

  // --- Build dot indicators ---
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    dots = cards.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to character ${i + 1} of ${cards.length}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goTo(i);
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    window.__mahabharatCursor?.bindHoverTargets();
    initMagnetic([prevBtn, nextBtn, ...dots].filter(Boolean), { strength: 0.4 });
  }

  function measure() {
    if (cards.length === 0) return;
    const cardRect = cards[0].getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
    cardStep = cardRect.width + gap;
  }

  function clampIndex(i) {
    if (cards.length === 0) return 0;
    return Math.max(0, Math.min(cards.length - 1, i));
  }

  // --- 3D tilt on hover ---
  if (!reduced && !isTouchDevice()) {
    allCards.forEach((card) => {
      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2' });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY(px * 10);
        rotateX(py * -10);
      });
      card.addEventListener('mouseleave', () => {
        rotateX(0);
        rotateY(0);
      });
    });
  }

  function updateActiveStates() {
    cards.forEach((card, i) => {
      const active = i === index;
      card.classList.toggle('character-card--active', active);
      card.setAttribute('aria-current', active ? 'true' : 'false');
    });
    dots.forEach((dot, i) => dot.classList.toggle('carousel-dot--active', i === index));

    if (counterCurr) {
      counterCurr.textContent = String(index + 1).padStart(2, '0');
    }
    if (counterTotal) {
      counterTotal.textContent = String(cards.length).padStart(2, '0');
    }
  }

  function goTo(i, opts = {}) {
    index = clampIndex(i);
    const targetX = -index * cardStep;
    if (reduced) {
      gsap.set(track, { x: targetX });
    } else {
      gsap.to(track, { x: targetX, duration: opts.duration ?? 0.55, ease: 'power3.out' });
    }
    updateActiveStates();
  }

  // --- Button + keyboard nav ---
  prevBtn?.addEventListener('click', () => goTo(index - 1));
  nextBtn?.addEventListener('click', () => goTo(index + 1));

  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', 'Character carousel, use arrow keys to navigate');
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End') goTo(cards.length - 1);
  });

  // --- Interactive Lore Tabs (Lineage / Astras / Role) ---
  track.addEventListener('click', (e) => {
    // If the user just completed a drag gesture, do not switch tabs
    if (hasMoved) return;

    const tab = e.target.closest('.lore-tab');
    if (!tab) return;

    const card = tab.closest('.character-card');
    if (!card) return;

    const targetPanel = tab.getAttribute('data-tab');
    if (!targetPanel) return;

    // Toggle active tab buttons inside this card
    const cardTabs = card.querySelectorAll('.lore-tab');
    cardTabs.forEach((t) => t.classList.toggle('lore-tab--active', t === tab));

    // Toggle active panel content inside this card
    const cardPanels = card.querySelectorAll('.lore-panel');
    cardPanels.forEach((p) => {
      const match = p.getAttribute('data-panel') === targetPanel;
      p.classList.toggle('lore-panel--active', match);
    });
  });

  // --- Faction Filter Rail ---
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-filter') || 'all';

      // Update chip styling
      filterChips.forEach((c) => c.classList.toggle('filter-chip--active', c === chip));

      // Filter character cards
      allCards.forEach((card) => {
        const faction = card.getAttribute('data-faction');
        const visible = filter === 'all' || faction === filter;
        card.classList.toggle('character-card--hidden', !visible);
      });

      // Update cards array with currently visible elements
      cards = allCards.filter((c) => !c.classList.contains('character-card--hidden'));

      // Re-build dots and reset position to 0
      buildDots();
      measure();
      goTo(0, { duration: 0.35 });
    });
  });

  // --- Pointer drag / swipe ---
  track.addEventListener('pointerdown', (e) => {
    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX;
    baseX = -index * cardStep;
    track.setPointerCapture(e.pointerId);
    gsap.killTweensOf(track);
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 7) {
      hasMoved = true;
    }
    dragCurrentX = diff;
    gsap.set(track, { x: baseX + dragCurrentX });
  });

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    const threshold = cardStep * 0.18;
    if (dragCurrentX <= -threshold) {
      goTo(index + 1);
    } else if (dragCurrentX >= threshold) {
      goTo(index - 1);
    } else {
      goTo(index); // snap back
    }
    dragCurrentX = 0;
    setTimeout(() => {
      hasMoved = false;
    }, 60);
  }

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('pointerleave', () => {
    if (isDragging) endDrag();
  });

  // --- Initial Setup ---
  buildDots();
  measure();
  updateActiveStates();
  gsap.set(track, { x: 0 });

  window.addEventListener(
    'resize',
    debounce(() => {
      measure();
      goTo(index, { duration: 0 });
    }, 150)
  );

  window.addEventListener('load', () => {
    measure();
  });
}
