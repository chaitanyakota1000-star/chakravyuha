# Progress Log

## Split 1 — Foundation, Design System & Invocation ✅
- Project skeleton, folder structure
- Design tokens: void/ash/gold/ember/indigo/parchment palette, Cinzel + Cormorant Garamond type
- Locomotive Scroll ↔ GSAP ScrollTrigger bridge
- Custom cursor (dot + ring), skipped on touch/reduced-motion
- Loader/preloader
- Chapter 1 — Invocation: chakra spin-in, split-text title reveal, ambient glow, scroll-parallax exit

## Split 2 — Origins, Characters & Dishonor ✅
- Chapter 2 — The Beginning: word-stagger lineage text, parallax lineage-tree SVG + glow
- Chapter 3 — The Great Characters: drag/swipe/click/keyboard carousel, 6 original character emblems
- Chapter 4 — The Dice Game & Dishonor: ember vignette, reveal panels
- Generalized `initScrollReveal()` utility (`.reveal` class)

## Split 3 — Exile, Road to War, Kurukshetra, Bhagavad Gita ✅
- Chapter 5 — Exile: muted tone, scroll-drawn wandering path (real `getTotalLength()`)
- Chapter 6 — Road to War: converging army blocks, sharper/faster text pacing
- Chapter 7 — Kurukshetra: pinned scroll montage, canvas ember field, flash + shake beats
- Chapter 8 — Bhagavad Gita: chakra returns (calm), character-by-character typewriter verses
- New reusable `utils/particles.js` (canvas ember/mote field)

## Split 4 — Aftermath, Closing, Polish & Deployment ✅
- Chapter 9 — Aftermath & Wisdom: reflective pacing, reused particle field (light motes)
- Chapter 10 — Closing Reflection: chakra completes one final full-circle rotation
- **Bug fix**: Kurukshetra's pin `end` value changed from an ambiguous `'+=300%'` to the
  unambiguous `'bottom bottom'`, tied directly to the section's real rendered height
- Mobile: particle counts trimmed, Kurukshetra's pin runway shortened via CSS only
  (`min-height` on `.chapter-kurukshetra` — no JS to keep in sync, thanks to the fix above)
- Carousel: resize handler debounced, Home/End keyboard support added
- Full responsive pass: tablet (1024px) + mobile (720px) + small-phone (380px) breakpoints
  across all ten chapters
- Final `ScrollTrigger.refresh()` after boot, plus a second refresh once web fonts finish
  swapping in (font swap can shift section heights after the first refresh)
- `README.md` with local-run instructions (**a local server is required** — ES modules don't
  load over `file://`), deployment notes, and a documented list of trade-offs/future work
- `.nojekyll` added for GitHub Pages

## Split 5 — Bug Fixes & Interactivity Layer ✅
- **Bug fix (cursor lag)**: custom cursor was centered with a static CSS `transform: translate(-50%,-50%)`,
  which GSAP's `x`/`y` quickTo tweens silently overwrote the instant the mouse moved. Fixed by centering
  via GSAP's own `xPercent`/`yPercent`, which compose with `x`/`y` instead of colliding with them.
- **Bug fix (blank gap after Kurukshetra)**: the pin target was a smaller inner div inside an outer
  section with a manually inflated `min-height`. ScrollTrigger's auto-generated spacer (sized to the
  actual pin duration) didn't match that manual height, leaving dead space after unpin. Fixed by pinning
  the section itself directly, with pin duration set entirely in JS (`pinDistance()`, pixel-based) — no
  CSS height needs to be kept in sync with it anymore.
- **Chapter navigation rail**: fixed dot rail, one per chapter, built from each section's own
  `aria-label` (can't drift out of sync with markup), click-to-jump via Locomotive's `scrollTo`,
  active-chapter tracking via one `ScrollTrigger` per section.
- **Magnetic hover** (`utils/magnetic.js`): reusable utility, applied to carousel buttons/dots and the
  chapter nav dots — elements pull toward the cursor within their bounds, spring back on leave.
- **Film-grain overlay**: pure CSS/SVG `feTurbulence` noise, no image asset, animated position shift.
- **Cursor context labels**: the cursor ring grows into a labeled pill (`data-cursor-text="Drag"`) over
  the character carousel.
- **3D tilt on character cards**: GSAP `rotationX`/`rotationY` following the cursor within each card.
  Required moving the "active card" visual cue from a CSS `transform` to `box-shadow`/`border`, for the
  same reason as the cursor bug fix above — GSAP and CSS can't both drive `transform` on one element.
- **Glitch/scramble text** on the Kurukshetra war fragments: characters cycle through a handful of
  non-Latin glyphs before settling on the real text, as an independent real-time effect layered on top
  of (not replacing) the existing scrubbed opacity fade — same separation-of-concerns pattern the
  flash/shake beats already used.
- **Scroll-linked color wash**: one `ScrollTrigger` spanning the whole document, subtly tinting the
  page (`mix-blend-mode: color`) through gold → dusk → ember → indigo → gold as the story progresses.
- **Cursor-reactive glow background**: a soft radial glow follows the cursor across the entire page
  (not just one section), done in plain CSS + two GSAP custom-property tweens rather than WebGL/shaders
  — chosen deliberately over a full shader background since it can be verified correct by reading the
  code, without ever needing to see it render.
- All eight additions respect `prefers-reduced-motion` and are skipped on touch where hover doesn't
  apply (magnetic, tilt, cursor glow, cursor labels).

### Honest caveat
The three new full-page overlays (cursor glow, color wash, grain) rely on CSS stacking-context
reasoning (z-index values chosen so they sit above chapter content but below the cursor/loader) that
hasn't been visually confirmed in a live browser. The logic is sound on paper — worth a real look
before calling it final.

## Split 6 — Kurukshetra Strategy Game ✅
- Added a separate rules and gameplay page linked from the story after the war montage.
- The player commands Yudhishthira, Bhima, and Arjuna; a local rule-based opponent commands Duryodhana, Karna, and Bhishma.
- Six-by-six board supports a move and an attack per champion each round, melee attacks, and two-square straight-line attacks for Arjuna and Karna. Champions have distinct vitality and attack strength.
- Added turn/round status, health roster, battle log, finish-turn and restart controls, touch-friendly squares, and keyboard grid navigation.
- Game logic is local JavaScript with no network calls or player accounts; the service-worker cache includes its module.

## Split 7 — Chakravyuha Action Game & Strategy Combat Bugfixes ✅
- **Bug fix (Strategy Game Kill/Targeting)**: Fixed issue where players could not attack or kill diagonally adjacent rivals or easily strike enemies.
  - Enabled 8-directional attacks (diagonal + orthogonal) for melee and ranged champions.
  - Added smart step-and-strike: clicking an enemy when in reach automatically moves and strikes in one action.
  - Preserved champion selection when moves remain so champions can attack then move smoothly.
  - Rebalanced warrior damage (Bhima 3 power, Arjuna 3 power, Yudhi 2 power) so enemies can be decisively eliminated.
  - Fixed victory detection and instructions when all Kauravas retreat.
- **Chakravyuha: The Labyrinth of Kings (`chakravyuha.html`)**:
  - Implemented fast-paced real-time 2D canvas action roguelite as Abhimanyu.
  - Mathematical simulation of 7 concentric rotating rings with alternating directions and gates.
  - Divine Astras (Agneyastra, Varunastra, Vayuastra, Chariot Wheel Fury).
  - Metaprogression system (*Veera Swarga*) with persistent Karmic Embers (*Punya*) saved in `localStorage`.
  - Procedural Web Audio API sound synthesizer (war conch, bow twangs, astra hums, wheel crushing).
  - Touch-friendly virtual controls for mobile and tablet play.
- **Integration**: Added gateway buttons in `index.html` and `game.html`, and updated service-worker cache to `v5`.

## Not done / deliberately deferred
- No illustrated character portraits (symbolic line-art emblems only — see README)
- No audio/music layer
- No Open Graph / Twitter card meta tags
- No LICENSE file (left to the project owner to decide)
- Narrative copy throughout is original paraphrase, not a specific cited translation —
  revisit if you want wording closer to a particular published translation
