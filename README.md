# Mahabharat 2.0 — Interactive Epic Experience

A scroll-driven, cinematic retelling of the Mahabharata. Pure HTML/CSS/JS,
GSAP + ScrollTrigger for animation, Locomotive Scroll for the smoothed
scroll feel. No backend, no build step, no framework.

---

## ⚠️ Running locally — read this first

`index.html` loads its JavaScript as **ES modules**
(`<script type="module" src="js/main.js">`). Browsers block ES module
imports over the `file://` protocol for security reasons (CORS), so
**double-clicking `index.html` will not work** — the page will load but
none of the animations will run, and your browser console will show
module/CORS errors.

You need a local static server. Any of these work, from the project's
root folder:

```bash
# Option A — Node (no install needed if you have npx)
npx serve .

# Option B — Python 3 (built into most systems)
python3 -m http.server 8000

# Option C — VS Code
# Right-click index.html → "Open with Live Server"
```

Then open the URL it prints (e.g. `http://localhost:3000` or
`http://localhost:8000`) in your browser.

---

## Folder structure

```
mahabharat-2.0/
├── index.html
├── game.html
├── README.md
├── PROGRESS.md
├── .nojekyll
├── css/
│   ├── reset.css
│   ├── variables.css      # design tokens: colors, type, spacing
│   ├── main.css            # every chapter's layout/styling
│   ├── animations.css      # keyframes + the .reveal utility
│   └── responsive.css      # tablet/mobile pass, all chapters
├── js/
│   ├── main.js              # entry point — boots everything in order
│   ├── cursor.js
│   ├── gamePage.js          # starts the standalone rules/game page
│   ├── kurukshetraGame.js   # turn-based Pandavas vs computer game
│   ├── smoothScroll.js      # Locomotive Scroll <-> ScrollTrigger bridge
│   ├── chapters/
│   │   ├── invocation.js
│   │   ├── beginning.js
│   │   ├── characters.js
│   │   ├── diceGame.js
│   │   ├── exile.js
│   │   ├── roadToWar.js
│   │   ├── kurukshetra.js
│   │   ├── bhagavadGita.js
│   │   ├── aftermath.js
│   │   └── closing.js
│   └── utils/
│       ├── helpers.js       # reduced-motion check, debounce, splitText
│       ├── particles.js     # canvas ember/mote field (reused twice)
│       └── scrollReveal.js  # generic .reveal → .is-visible utility
└── assets/svg/               # standalone copies of the inlined SVGs
```

All CSS/JS/asset paths are relative (no leading `/`), so this folder
works unmodified from a domain root **or** a subpath — including GitHub
Pages project sites (`username.github.io/repo-name/`).

---

## Deploying

- **GitHub Pages**: push this folder to a repo, enable Pages on the
  `main` branch (root). The included `.nojekyll` file stops GitHub's
  Jekyll processor from touching anything.
- **Netlify / Vercel**: drag-and-drop the folder (or connect the repo)
  with the build command left empty and the publish directory set to
  the project root. No config file is needed for a static site like
  this one.

---

## Offline use

The experience is a static site and includes a service worker that caches
its HTML, styles, scripts, SVGs, and the animation/font CDN resources. Open
the site once while online from `localhost` or its deployed HTTPS URL and
allow the service worker a moment to finish installing. Later visits can
load from that browser's cache while offline. Service workers do not run
from `file://`, and a first-ever visit still needs a connection.

## Main animation techniques

- **Offline cache** (`sw.js`) — pre-caches the local experience and attempts
  to cache its CDN dependencies on installation. Requests use the network
  when available and fall back to the saved response offline.

- **Locomotive Scroll ↔ ScrollTrigger bridge** (`smoothScroll.js`) —
  every scroll-triggered animation reads position from Locomotive's
  smoothed value via a `ScrollTrigger.scrollerProxy`, the standard
  integration pattern between the two libraries.
- **Hand-rolled `splitText()`** (`utils/helpers.js`) — wraps each word
  or character in a `<span>` for stagger animation. GSAP's own
  SplitText plugin does the same thing, but this keeps the project
  dependency-free and avoids pinning to a specific GSAP version's
  plugin bundle.
- **Generic scroll-reveal utility** (`utils/scrollReveal.js`) — any
  element with `class="reveal"` fades/lifts into place once, the
  first time it crosses 85% of the viewport. Six of the ten chapters
  use this directly instead of writing bespoke reveal code.
- **Reusable canvas particle field** (`utils/particles.js`) — one
  small ember/mote system, reused with different colors, counts and
  moods for Kurukshetra's fire and Aftermath's settling light.
  Started/stopped via `IntersectionObserver` so it never runs
  off-screen.
- **Scroll-drawn SVG path** (Chapter 5, Exile) — animates
  `stroke-dashoffset` from the path's own `getTotalLength()`, not a
  guessed dasharray value, so it works regardless of the path's shape.
- **Pinned scroll montage** (Chapter 7, Kurukshetra) — an outer
  artificially-tall section (`min-height`) drives the scroll distance
  while an inner wrapper pins; `end: 'bottom bottom'` ties the pin
  duration unambiguously to that section's real rendered height, so
  `responsive.css` can safely give mobile a shorter pin runway with
  nothing else to keep in sync.
- **Typewriter reveal** (Chapter 8, Bhagavad Gita) — reuses
  `splitText(el, 'chars')` with a near-zero stagger, plus a CSS
  `::after` caret that blinks only while that line is still "typing."

---

## Play the Kurukshetra game

In **Command the Field**, you lead Yudhishthira, Bhima, and Arjuna against
computer-controlled Duryodhana, Karna, and Bhishma. Select a Pandava, then
choose a highlighted empty square to move or a highlighted rival to strike.
You can move once and attack once with each champion per round, including
attacking after moving. Green squares show movement; red squares show rivals
in attack range. The combat log shows damage dealt and remaining vitality.
Arjuna and Karna can attack two squares away in a straight line. Finish your
turn when ready, and the computer will take its turn. A side wins when all
three opposing champions retreat.
The opponent uses a local strategy routine, so no account or network access
is involved. Use the arrow keys to move between board squares and Enter or
Space to select one.

The main story page links to `game.html`, which contains the complete rules
and playable battlefield. Use **Back to the story** to return to the epic.

## Accessibility

- `prefers-reduced-motion: reduce` is respected in every chapter: the
  custom cursor, ScrollTrigger pins, particle fields, screen-flash/
  shake, and all decorative motion are skipped outright, with content
  shown fully visible and static instead (checked in every chapter
  script individually, not just globally).
- The character carousel is fully keyboard-operable (arrow keys,
  Home/End) in addition to drag/swipe and button navigation.
- Decorative SVGs and canvases are `aria-hidden`; the two chakra
  illustrations that aren't purely decorative carry a descriptive
  `aria-label` instead.
- Every chapter `<section>` has an `aria-label` naming it, giving
  screen readers a clear landmark structure through the single-page
  scroll.

---

## Known trade-offs / future enhancements

- **Character art is symbolic, not illustrated.** Each character uses
  a simple hand-drawn line emblem rather than a portrait, to avoid any
  likeness/copyright question and keep the project asset-light. A
  natural next step would be commissioning or painting original
  character portraits.
- **Narrative copy is original paraphrase**, not sourced from a
  specific translation — written to capture the epic's well-known
  beats and themes without reproducing any copyrighted text. Swap in
  your own preferred phrasing/translation excerpts freely.
- **No audio layer.** A subtle ambient score or conch/veena stings at
  chapter transitions (muted by default, with a visible mute toggle)
  would meaningfully deepen the "cinematic" feel.
- **Locomotive Scroll v4** is a mature but not actively-developed
  library. If you outgrow it, **Lenis** (from the same original
  author's studio) is the modern successor and pairs with
  ScrollTrigger the same way.
- **GSAP's Club-only plugins are now free** (SplitText, DrawSVGPlugin,
  MorphSVGPlugin, etc., since GreenSock's 2024 acquisition by
  Webflow). This project intentionally avoids them to stay
  dependency-light, but swapping the hand-rolled `splitText()` for
  official `SplitText`, or the manual path-draw for `DrawSVGPlugin`,
  would trim some code.
- **No `<meta>` Open Graph/Twitter card tags** yet — worth adding
  before sharing the link publicly.
- Add a `LICENSE` file (MIT is a reasonable default for a portfolio
  piece) if you intend to open-source the code.
