// ===========================================================
// CHAPTER 1 — INVOCATION (KRISHNA & SUDARSHANA CHAKRA)
// Orchestrated load-in sequence:
// - Clean, unwatermarked Lord Krishna background fades in
// - Divine cyan halo blooms behind Krishna's crown
// - 3D rotating Sudarshana Chakra scales in directly above his raised finger
// - Sacred title words reveal with staggered ascent
// - Parallax exit keeps Krishna and the Chakra locked together on scroll
// ===========================================================

import { splitText, prefersReducedMotion } from '../utils/helpers.js';

export function initInvocation() {
  const reduced = prefersReducedMotion();

  const title = document.querySelector('.invocation__title');
  const subtitle = document.querySelector('.invocation__subtitle');
  const shloka = document.querySelector('.invocation__sacred-shloka');
  const stage = document.querySelector('.invocation__krishna-stage');
  const krishnaBg = document.querySelector('.invocation__krishna-bg');
  const aura = document.querySelector('.invocation__divine-aura');
  const chakraStage = document.querySelector('.invocation__chakra-stage');
  const scrollCue = document.querySelector('.invocation__scroll-cue');
  const content = document.querySelector('.invocation__content');

  if (reduced) {
    // Content is already visible by default in CSS; nothing to animate.
    return;
  }

  const words = splitText(title, 'words');

  if (words?.length) gsap.set(words, { yPercent: 130, opacity: 0 });
  if (shloka) gsap.set(shloka, { opacity: 0, y: 15 });
  if (krishnaBg) gsap.set(krishnaBg, { opacity: 0 });
  if (aura) gsap.set(aura, { opacity: 0 });
  if (chakraStage) gsap.set(chakraStage, { opacity: 0 });
  if (subtitle) gsap.set(subtitle, { opacity: 0, y: 18 });
  if (scrollCue) gsap.set(scrollCue, { opacity: 0 });

  const intro = gsap.timeline({ delay: 0.1 });

  if (krishnaBg) {
    intro.to(krishnaBg, { opacity: 1, duration: 1.2, ease: 'power2.out' });
  }
  if (aura) {
    intro.to(aura, { opacity: 0.9, duration: 1.0, ease: 'power3.out' }, '-=0.9');
  }
  if (chakraStage) {
    intro.to(chakraStage, { opacity: 1, duration: 1.1, ease: 'power2.out' }, '-=0.8');
  }
  if (shloka) {
    intro.to(shloka, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.7');
  }
  if (words?.length) {
    intro.to(words, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power4.out' }, '-=0.6');
  }
  if (subtitle) {
    intro.to(subtitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4');
  }
  if (scrollCue) {
    intro.to(scrollCue, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');
  }

  // Scroll-driven exit parallax: Stage and content glide synchronously
  if (stage) {
    gsap.to(stage, {
      y: 70,
      ease: 'none',
      scrollTrigger: {
        trigger: '.chapter-invocation',
        scroller: '[data-scroll-container]',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  if (chakraStage) {
    gsap.to(chakraStage, {
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: {
        trigger: '.chapter-invocation',
        scroller: '[data-scroll-container]',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  if (content) {
    gsap.to(content, {
      opacity: 0,
      y: -80,
      scrollTrigger: {
        trigger: '.chapter-invocation',
        scroller: '[data-scroll-container]',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  if (scrollCue) {
    gsap.to(scrollCue, {
      opacity: 0,
      scrollTrigger: {
        trigger: '.chapter-invocation',
        scroller: '[data-scroll-container]',
        start: 'top top',
        end: '30% top',
        scrub: true,
      },
    });
  }
}
