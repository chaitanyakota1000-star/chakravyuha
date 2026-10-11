const CACHE_NAME = 'mahabharat-2.0-v10';
const CORE_FILES = [
  './',
  './index.html',
  './game.html',
  './chakravyuha.html',
  './favicon.ico',
  './css/reset.css',
  './css/variables.css',
  './css/main.css',
  './css/animations.css',
  './css/responsive.css',
  './css/chakravyuha.css',
  './js/main.js',
  './js/gamePage.js',
  './js/cursor.js',
  './js/cursorGlow.js',
  './js/smoothScroll.js',
  './js/chapterNav.js',
  './js/utils/helpers.js',
  './js/utils/colorWash.js',
  './js/utils/magnetic.js',
  './js/utils/particles.js',
  './js/utils/scrollReveal.js',
  './js/chapters/invocation.js',
  './js/chapters/beginning.js',
  './js/chapters/characters.js',
  './js/chapters/diceGame.js',
  './js/chapters/exile.js',
  './js/chapters/roadToWar.js',
  './js/chapters/kurukshetra.js',
  './js/kurukshetraGame.js',
  './js/chakravyuha/main.js',
  './js/chakravyuha/demoPlayer.js',
  './js/chakravyuha/audio.js',
  './js/chakravyuha/entities.js',
  './js/chakravyuha/formation.js',
  './js/chakravyuha/astras.js',
  './js/chakravyuha/metaprogression.js',
  './js/chapters/bhagavadGita.js',
  './js/chapters/aftermath.js',
  './js/chapters/closing.js',
  './assets/svg/chakra.svg',
  './assets/img/krishna_sudarshana_clean.jpg',
  './assets/img/krishna_sudarshana_user.jpg',
  './assets/img/krishna_sudarshana.jpg',
  './assets/img/arjuna_portrait.jpg',
  './assets/img/karna_portrait.jpg',
  './assets/img/bhishma_portrait.jpg',
  './assets/img/draupadi_portrait.jpg',
  './assets/img/duryodhana_portrait.jpg',
  './assets/img/yudhishthira_portrait.jpg',
  './assets/img/bhima_portrait.jpg',
  './assets/img/abhimanyu_stand.jpg',
  './assets/img/drona_portrait.jpg',
  './assets/img/ashwatthama_portrait.jpg',
  './assets/img/shakuni_portrait.jpg',
];
const REMOTE_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js',
  'https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.css',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,500&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_FILES);
      // A failed CDN request should not prevent the local experience from
      // being cached. Successful responses are saved for later offline use.
      await Promise.allSettled(REMOTE_FILES.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          return caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy))
            .then(() => response);
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return (await caches.match('./index.html')) || Response.error();
        }
        return Response.error();
      })
  );
});
