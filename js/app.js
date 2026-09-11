import { getRoute } from './router.js?v=37';
import { renderGenerator } from './generator.js?v=37';
import { renderPlayer } from './player.js?v=37';
import { renderFeed } from './feed.js?v=37';
import { renderSafelink } from './safelink.js?v=37';
import { generateRandomFilename } from './utils.js?v=37';
import { initDb } from './db/index.js?v=37';

/* ═══════════════════════════════════════════════════════════════
   Routing:

   /g/                        → Generator page
   /?k=...                    → Player (dari safelink Continue)
   /?vid=<slug>               → Safelink interstitial (artikel + countdown)
   /{slug}                    → Shortlink → RENDER SAFELINK LANGSUNG
                                (tidak ada redirect, URL tetap sama)
   /?trending=1               → Trending feed
   /                          → Home feed (videos from DB)
   ═══════════════════════════════════════════════════════════════ */

(async function() {
  var app = document.getElementById('app');
  if (!app) return;

  var pageMode = document.documentElement.getAttribute('data-mode') || 'main';

  /* ── Generator Mode (/g/) ── */
  if (pageMode === 'generator') {
    await initDb();
    renderGenerator(app);
    return;
  }

  /* ── Main Mode ── */
  var dbPromise = initDb();
  var storedRedirect = sessionStorage.getItem('spa_redirect');
  var originalPathAndQuery = storedRedirect || '';
  var route = getRoute();

  /* ── SAFELINK INTERSTITIAL ──
     Dua trigger:
     1. ?vid=slug (eksplisit)
     2. /{slug} (shortlink — render langsung, tanpa redirect) */
  var safelinkSlug = route.safelinkSlug || route.shortSlug;
  if (safelinkSlug && (route.isSafelink || route.isShortRedirect)) {
    /* Update URL bar ke /?vid=slug agar refresh tetap aman */
    try {
      var vidParam = 'vid=' + encodeURIComponent(safelinkSlug);
      if (window.location.search !== '?' + vidParam) {
        history.replaceState(null, '', '/?' + vidParam);
      }
    } catch (e) { /* ignore */ }

    renderSafelink(app, safelinkSlug);
    dbPromise.catch(function() {});
    return;
  }

  /* ---- Check trending query param ---- */
  var isTrending = route.params && route.params.has('trending');

  /* ---- PLAYER LANGSUNG (ada ?k=) ──
     Hanya tercapai via safelink Continue. ── */
  if (route.isPlayer) {
    renderPlayer(app, route);
    pushPlayerUrl(route.kValue, originalPathAndQuery);
    dbPromise.catch(function() {});
    return;
  }

  /* ---- HOME or TRENDING → Feed ---- */
  await dbPromise;
  renderFeed(app, isTrending ? 'trending' : 'feed');

})();

/* ── Helper: push fake player URL to address bar ── */
function pushPlayerUrl(kValue, originalUrl) {
  try {
    if (originalUrl && originalUrl.includes('?k=')) {
      history.replaceState(null, '', originalUrl);
    } else if (kValue) {
      var fakeName = generateRandomFilename();
      history.replaceState(null, '', '/' + fakeName + '?k=' + kValue);
    }
  } catch (e) {}
}
