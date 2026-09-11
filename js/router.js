import { extractSlugFromPath, slugToK, decodeKValue } from './utils.js?v=37';
import { ShortStore } from './storage.js?v=37';

export function getRoute() {
  var stored = sessionStorage.getItem('spa_redirect');
  var path = '/';
  var search = '';

  if (stored) {
    sessionStorage.removeItem('spa_redirect');
    var qIdx = stored.indexOf('?');
    if (qIdx !== -1) {
      path = stored.substring(0, qIdx);
      search = stored.substring(qIdx);
    } else {
      path = stored;
    }
  }

  /* Fallback: baca langsung dari URL bar (untuk .htaccess / Laragon) */
  if (path === '/') path = window.location.pathname;
  if (!search) search = window.location.search;

  var params = new URLSearchParams(search);
  var kValue = null;
  var isShortRedirect = false;
  var shortSlug = null;
  var isSafelink = false;
  var safelinkSlug = null;

  /* Method 0: ?vid=slug — halaman safelink interstitial */
  if (params.has('vid')) {
    isSafelink = true;
    safelinkSlug = params.get('vid');
  }

  /* Method 1: ?k= query param (player link — dari safelink continue) */
  if (!isSafelink && params.has('k')) {
    kValue = params.get('k');
  }

  /* Method 2: path-based (shortlink) */
  if (!isSafelink && !kValue && path && path !== '/') {
    var slug = extractSlugFromPath(path);
    if (slug && slug.length >= 6) {
      shortSlug = slug;
      isShortRedirect = true; /* Optimistik: slug 6+ char = potensi shortlink */

      /* Sync lookup: cek localStorage ShortStore */
      try {
        var storedK = ShortStore.get(slug);
        if (storedK) {
          kValue = storedK;
        }
      } catch (e) { /* ignore */ }

      /* Sync fallback: cek base64 decode (format lama) */
      if (!kValue) {
        try {
          var potentialK = slugToK(slug);
          if (potentialK) {
            var test = decodeKValue(potentialK);
            if (test.filename) {
              kValue = potentialK;
            }
          }
        } catch (e) { /* ignore */ }
      }
    }
  }

  return {
    path: path,
    params: params,
    kValue: kValue,
    shortSlug: shortSlug,
    isSafelink: isSafelink,
    safelinkSlug: safelinkSlug,
    isGenerator: !isSafelink && !kValue && !isShortRedirect,
    isPlayer: !!kValue && !isShortRedirect && !isSafelink,
    isShortRedirect: isShortRedirect
  };
}
