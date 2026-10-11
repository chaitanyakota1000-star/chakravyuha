// ===========================================================
// MAIN
// Entry point. Waits for full asset load, hides the preloader,
// then boots the cursor, smooth-scroll engine, chapters, and the
// cross-cutting interactivity layer (chapter nav, cursor glow,
// color wash) added afterward — those need the chapters and the
// Locomotive instance to already exist, so they boot last.
// ===========================================================

import { initCursor } from './cursor.js';
import { initCursorGlow } from './cursorGlow.js';
import { initSmoothScroll } from './smoothScroll.js';
import { initScrollReveal } from './utils/scrollReveal.js';
import { initColorWash } from './utils/colorWash.js';
import { initChapterNav } from './chapterNav.js';
import { initInvocation } from './chapters/invocation.js';
import { initBeginning } from './chapters/beginning.js';
import { initCharacters } from './chapters/characters.js';
import { initDiceGame } from './chapters/diceGame.js';
import { initExile } from './chapters/exile.js';
import { initRoadToWar } from './chapters/roadToWar.js';
import { initKurukshetra } from './chapters/kurukshetra.js';
import { initBhagavadGita } from './chapters/bhagavadGita.js';
import { initAftermath } from './chapters/aftermath.js';
import { initClosing } from './chapters/closing.js';

document.addEventListener('DOMContentLoaded', () => {
  // Cache the static experience after the first online visit so it can
  // be reopened without a network connection on supported browsers.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // The page still works normally when service workers are unavailable.
    });
  }

  gsap.registerPlugin(ScrollTrigger);

  const loader = document.querySelector('.loader');

  const boot = () => {
    initCursor();
    initCursorGlow();
    window.__mahabharatScroll = initSmoothScroll();
    initInvocation();
    initBeginning();
    initCharacters();
    initDiceGame();
    initExile();
    initRoadToWar();
    initKurukshetra();
    initBhagavadGita();
    initAftermath();
    initClosing();
    initScrollReveal();
    initChapterNav(window.__mahabharatScroll);
    initColorWash();

    // Every chapter is now initialized, some of which (pins,
    // parallax) depend on final layout — refresh once now, and
    // once more when web fonts finish swapping in, since a font
    // swap can shift section heights after the first refresh.
    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };

  const onReady = () => {
    // Initialize all chapters, layout and initial hidden states while loader is still completely opaque
    document.body.classList.remove('is-loading');
    boot();

    // Smoothly dissolve the loader to reveal the cleanly initialized page
    gsap.to(loader, {
      opacity: 0,
      duration: 0.5,
      delay: 0.08,
      ease: 'power2.out',
      onComplete: () => {
        if (loader) loader.style.display = 'none';
      },
    });
  };

  if (document.readyState === 'complete') {
    onReady();
  } else {
    window.addEventListener('load', onReady);
  }
});
