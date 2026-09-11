export function getDomain() {
  return window.location.hostname;
}

export function getProtocol() {
  return window.location.protocol.replace(':', '');
}

/**
 * getRandomDomain(domains) — pilih random domain dari list.
 * @param {string[]} domains - array domain dari db-config.json
 * @returns {string} domain random, atau current hostname jika list kosong
 */
export function getRandomDomain(domains) {
  if (!domains || domains.length === 0) return getDomain();
  return domains[Math.floor(Math.random() * domains.length)];
}

export function extractFilenameFromUrl(input) {
  if (!input || typeof input !== 'string') return '';
  let url;
  try {
    url = new URL(input);
  } catch {
    const parts = input.split('/');
    const last = parts[parts.length - 1];
    if (last && last.includes('.')) {
      return decodeURIComponent(last.split('?')[0].split('#')[0]);
    }
    return '';
  }
  const pathname = url.pathname;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '';
  const last = parts[parts.length - 1];
  return decodeURIComponent(last.split('?')[0].split('#')[0]);
}

/* ────────────────────────────────────────────────────────────
   CDN Detection & Path Extraction
   ──────────────────────────────────────────────────────────── */

/**
 * Daftar CDN yang dikenal (key dipakai di k-value).
 * Urutan di sini HANYA untuk definisi; urutan fallback
 * saat load ditentukan oleh cdn-loader.js.
 */
export const KNOWN_CDNS = [
  { key: 'slicedrive', name: 'Slicedrive', base: 'https://cdn.slicedrive.com' },
  { key: 'videy',      name: 'Videy',      base: 'https://cdn2.videy.co' },
  { key: 'aceimg',     name: 'Aceimg',     base: 'https://cdn.aceimg.com' },
  { key: 'xxfollow',   name: 'Xxfollow',   base: 'https://www.xxxfollow.com' },
  { key: 'xfree',      name: 'Xfree',      base: 'https://cdn.xfree.com' }
];

/**
 * detectCdn(url) — deteksi CDN dari sebuah URL.
 * @returns {object|null} CDN object {key,name,base} atau null jika tidak cocok
 */
export function detectCdn(input) {
  if (!input || typeof input !== 'string') return null;
  var hostname = '';
  try {
    hostname = new URL(input).hostname.toLowerCase();
  } catch (e) {
    /* input mungkin path relatif → coba match by base URL substring */
    var lower = input.toLowerCase();
    for (var i = 0; i < KNOWN_CDNS.length; i++) {
      if (lower.indexOf(KNOWN_CDNS[i].base.toLowerCase()) !== -1) {
        return KNOWN_CDNS[i];
      }
    }
    return null;
  }
  for (var j = 0; j < KNOWN_CDNS.length; j++) {
    var cdnHost = '';
    try { cdnHost = new URL(KNOWN_CDNS[j].base).hostname.toLowerCase(); }
    catch (e2) { continue; }
    if (cdnHost === hostname) return KNOWN_CDNS[j];
  }
  return null;
}

/**
 * extractPathFromUrl(url, cdnBase) — ambil path relatif terhadap cdnBase.
 * Contoh:
 *   ('https://www.xxxfollow.com/media/fans/post_public/0/947/548197.mp4',
 *    'https://www.xxxfollow.com')
 *     → 'media/fans/post_public/0/947/548197.mp4'
 *
 *   ('https://cdn.slicedrive.com/voDWqx8K1.mp4',
 *    'https://cdn.slicedrive.com')
 *     → 'voDWqx8K1.mp4'
 */
export function extractPathFromUrl(input, cdnBase) {
  if (!input || typeof input !== 'string') return '';
  if (!cdnBase) {
    /* Fallback: ambil path setelah hostname */
    try {
      var u = new URL(input);
      var p = u.pathname.replace(/^\/+/, '');
      return decodeURIComponent(p);
    } catch (e) {
      return '';
    }
  }
  var base = cdnBase.replace(/\/+$/, '');
  /* Coba parse sebagai URL absolut */
  try {
    var url = new URL(input);
    var baseUrl;
    try { baseUrl = new URL(cdnBase); } catch (e) { return ''; }
    if (url.hostname.toLowerCase() === baseUrl.hostname.toLowerCase()) {
      var path = url.pathname.replace(/^\/+/, '');
      return decodeURIComponent(path);
    }
    /* Host tidak cocok → kembalikan path relatif apa adanya */
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch (e2) {
    /* Input bukan URL absolut → anggap path relatif, trim leading slash */
    return input.replace(/^\/+/, '');
  }
}

/**
 * getFilenameFromPath(path) — ambil segment terakhir dari sebuah path
 * sebagai filename untuk display.
 */
export function getFilenameFromPath(path) {
  if (!path || typeof path !== 'string') return '';
  var clean = path.split('?')[0].split('#')[0];
  var parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return '';
  return decodeURIComponent(parts[parts.length - 1]);
}

/* ---- base64url encode / decode ---- */

function btoURLSafe(b64) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromURLSafe(b64url) {
  var s = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
}

/**
 * generateKValue — encode filename (+ optional source URL) ke base64.
 *
 * Format LAMA (original, backward compat):
 *   filename|rand10|rand6
 *
 * Format V2 (cdnKey + cdnPath, backward compat):
 *   filename|rand10|rand6|cdnKey|cdnRelativePath
 *
 * Format V3 (sourceUrl — RECOMMENDED, paling robust):
 *   filename|rand10|rand6|sourceUrl
 *
 * - filename: nama file display (segment terakhir), mis. "548197.mp4"
 * - sourceUrl: URL LENGKAP file video, mis.
 *   "https://www.xxxfollow.com/media/fans/post_public/0/947/548197.mp4"
 *
 * Jika sourceUrl diberikan → format V3 dipakai (prioritas tertinggi).
 * Jika cdnKey + cdnRelativePath diberikan (tanpa sourceUrl) → format V2.
 * Jika keduanya kosong → format lama (coba semua CDN dengan filename).
 */
export function generateKValue(realFilename, sourceUrl, cdnKey, cdnRelativePath) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!';
  let rand10 = '';
  for (let i = 0; i < 10; i++) {
    rand10 += Math.floor(Math.random() * 10);
  }
  let rand6 = '';
  for (let i = 0; i < 6; i++) {
    rand6 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  var raw = realFilename + '|' + rand10 + '|' + rand6;
  if (sourceUrl) {
    /* Format V3 — sourceUrl penuh */
    raw += '|' + sourceUrl;
  } else if (cdnKey && cdnRelativePath) {
    /* Format V2 — cdnKey + cdnRelativePath */
    raw += '|' + cdnKey + '|' + cdnRelativePath;
  }
  return btoa(raw);
}

/* Encode filename ke URL-safe base64 slug (untuk shortlink path) */
export function filenameToSlug(filename) {
  if (!filename) return '';
  return btoURLSafe(btoa(filename));
}

/* Encode full k-value ke URL-safe base64 slug (shortlink random setiap generate) */
export function kValueToSlug(kValue) {
  if (!kValue) return '';
  return btoURLSafe(kValue);
}

/* Decode URL-safe base64 slug kembali ke base64 k-value */
export function slugToK(slug) {
  if (!slug || typeof slug !== 'string') return null;
  try {
    return fromURLSafe(slug);
  } catch {
    return null;
  }
}

export function generateSmartlinkKValue(url) {
  var raw = 'SMARTLINK|' + url;
  return btoa(raw);
}

export function decodeKValue(k) {
  if (!k || typeof k !== 'string') return { filename: null };
  try {
    const decoded = atob(k);
    /* Validasi: harus printable ASCII */
    if (!/^[\x20-\x7E]+$/.test(decoded)) return { filename: null };
    const parts = decoded.split('|');
    const first = parts[0];
    if (!first) return { filename: null };

    /* Cek format smartlink: SMARTLINK|url */
    if (first === 'SMARTLINK' && parts.length >= 2 && parts[1]) {
      /* Backward compat: old format 3 parts (shopee|omg), new format 2 parts (url) */
      var smartUrl = parts.length >= 3 ? parts[2] : parts[1];
      return { type: 'smartlink', url: smartUrl };
    }

    /* Validasi: harus terlihat seperti filename video */
    if (!first.includes('.')) return { filename: null };
    if (first.length < 5 || first.length > 200) return { filename: null };

    /* Format V3: filename|rand10|rand6|sourceUrl
       Deteksi: parts.length === 4 DAN parts[3] mulai dengan http:// atau https:// */
    if (parts.length === 4 && parts[3] && /^https?:\/\//i.test(parts[3])) {
      return {
        filename: first,
        sourceUrl: parts[3]
      };
    }

    /* Format V2: filename|rand10|rand6|cdnKey|cdnRelativePath */
    if (parts.length >= 5 && parts[3] && parts[4]) {
      return {
        filename: first,
        cdnKey: parts[3],
        cdnPath: parts[4]
      };
    }

    /* Format lama: filename|rand10|rand6 */
    return { filename: first };
  } catch {
    return { filename: null };
  }
}

/* Extract slug from a shortlink path.
   e.g. "/aBcDeF.mp4" → "aBcDeF", "/x/aBcDeF.mp4" → "aBcDeF"
*/
export function extractSlugFromPath(path) {
  if (!path) return '';
  var parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return '';
  var last = parts[parts.length - 1];
  /* remove extension */
  var dot = last.lastIndexOf('.');
  if (dot > 0) {
    return last.substring(0, dot);
  }
  return last;
}

export function randomChar() {
  var chars = 'abcdefghijklmnopqrstuvwxyz';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

export function generateShortId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomFilename() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < 8; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name + '.mp4';
}

export function randomId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm lalu';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'j lalu';
  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + ' ' + HH + ':' + MM;
}

let toastTimer = null;

export function showToast(msg, isError) {
  const el = document.getElementById('toast');
  if (!el) return;
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  el.classList.remove('err-toast');
  const iconClass = isError ? 'err' : 'ok';
  const iconName = isError ? 'fa-circle-xmark' : 'fa-circle-check';
  el.innerHTML = '<i class="fa-solid ' + iconName + ' ' + iconClass + '"></i>' + escapeHtml(msg);
  if (isError) el.classList.add('err-toast');
  el.classList.add('show');
  toastTimer = setTimeout(function() {
    el.classList.remove('show', 'err-toast');
    toastTimer = null;
  }, 3000);
}

export function copyText(text, btnElement) {
  function success() {
    if (btnElement) {
      var orig = btnElement.innerHTML;
      btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      btnElement.classList.add('copied');
      setTimeout(function() {
        btnElement.innerHTML = orig;
        btnElement.classList.remove('copied');
      }, 2000);
    }
    showToast('Berhasil disalin ke clipboard', false);
  }
  function fail() {
    /* Fallback: hidden textarea + execCommand */
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) { success(); return; }
    } catch (e) { /* ignore */ }
    showToast('Gagal menyalin ke clipboard', true);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(success).catch(fail);
  } else {
    fail();
  }
}