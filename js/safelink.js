/**
 * Safelink Interstitial (v4 — Auto-direct + Header title + Article image)
 * -----------------------------------------------------------------------
 * Features:
 *   - Pre-fetch k-value from DB (cross-domain)
 *   - Countdown timer (configurable 1-5 seconds)
 *   - Auto-direct ON/OFF (configurable)
 *   - Article title as page header & document.title
 *   - Article image for organic look
 *   - Shuffle button to change article
 */

import { getRandomArticle } from './safelink-articles.js?v=35';
import { decodeKValue } from './utils.js?v=35';
import { isDbReady, getDb } from './db/index.js?v=35';
import { ShortStore } from './storage.js?v=35';

/* =========================================================
   CONFIG — EDIT HERE
   ========================================================= */
const SAFELINK_CFG = {
  /* Countdown delay in seconds.
     - Fixed 2 seconds: { min: 2, max: 2 }
     - Random 1-5 seconds: { min: 1, max: 5 } */
  DELAY: { min: 2, max: 2 },

  /* Continue button text */
  CONTINUE_TEXT: 'Continue to Video',

  /* Auto-redirect after countdown + k-value ready.
     true  = visitor auto-redirected (no click needed)
     false = visitor must click Continue button */
  AUTO_REDIRECT: true,

  /* Fallback URL — jika slug tidak ditemukan di DB/localStorage,
     auto-redirect ke URL ini (biasanya smartlink monetization). */
  FALLBACK_URL: 'https://omg10.com/4/10410353',

  /* Auto-redirect ke FALLBACK_URL jika link not found.
     true  = auto-redirect (visitor tidak lihat error)
     false = tampilkan error message (DEFAULT — kembali ke behavior sebelumnya) */
  AUTO_FALLBACK_ON_NOT_FOUND: false
};


/* =========================================================
   STATE
   ========================================================= */
var _prefetchedKValue = null;
var _prefetchError = null;
var _prefetchNotFound = false;  /* flag: true jika slug tidak ditemukan */
var _prefetchDone = false;
var _currentArticle = null;


/* =========================================================
   RENDER SAFELINK PAGE
   ========================================================= */
export function renderSafelink(container, slug) {
  document.body.classList.add('is-safelink');
  document.body.classList.remove('is-player', 'is-feed');

  if (!slug) {
    renderError(container, 'Token safelink not found. Please open the original link again.');
    return;
  }

  console.log('[Safelink] Render for slug:', slug);

  /* Reset state */
  _prefetchedKValue = null;
  _prefetchError = null;
  _prefetchNotFound = false;
  _prefetchDone = false;

  /* Pick random article */
  var article = getRandomArticle();
  _currentArticle = article;
  console.log('[Safelink] Article:', article.category, '-', article.title);

  /* Set document title to article title (SEO + tab label) */
  document.title = article.title + ' — VidFlow';

  /* Calculate delay */
  var minDelay = Math.max(1, SAFELINK_CFG.DELAY.min);
  var maxDelay = Math.max(minDelay, SAFELINK_CFG.DELAY.max);
  var delaySec = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  /* Render page */
  container.innerHTML = buildSafelinkHTML(article, delaySec);

  /* Pre-fetch k-value immediately (background) */
  prefetchKValue(slug);

  /* Setup countdown */
  setupCountdown(delaySec, function() {
    var continueBtn = document.getElementById('safelink-continue');

    /* Cek not-found FIRST — auto-fallback ke smartlink */
    if (_prefetchDone && _prefetchNotFound && SAFELINK_CFG.AUTO_FALLBACK_ON_NOT_FOUND) {
      console.log('[Safelink] Link not found, auto-fallback to:', SAFELINK_CFG.FALLBACK_URL);
      /* Update UI untuk show redirecting */
      if (continueBtn) {
        continueBtn.classList.remove('disabled');
        continueBtn.classList.add('loading');
        continueBtn.disabled = false;
        continueBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Redirecting...';
      }
      var statusPill = document.getElementById('safelink-status-pill');
      if (statusPill) {
        statusPill.classList.add('ready');
        statusPill.innerHTML =
          '<i class="fa-solid fa-circle-check"></i>' +
          '<span class="safelink-status-text">Redirecting...</span>';
      }
      /* Redirect ke fallback URL */
      setTimeout(function() {
        window.location.href = SAFELINK_CFG.FALLBACK_URL;
      }, 500);
      return;
    }

    if (_prefetchDone && _prefetchedKValue) {
      /* k-value ready → enable Continue + auto-direct if configured */
      enableContinueBtn();

      if (SAFELINK_CFG.AUTO_REDIRECT) {
        console.log('[Safelink] Auto-redirect enabled, redirecting...');
        /* Small delay so user sees the "ready" state before redirect */
        setTimeout(function() {
          doContinue(slug);
        }, 300);
      }
    } else if (_prefetchDone && _prefetchError) {
      showError(_prefetchError);
    } else {
      /* Prefetch still running — wait */
      if (continueBtn) {
        continueBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Fetching link...';
      }
      var pollTries = 0;
      var pollInterval = setInterval(function() {
        pollTries++;
        /* Cek not-found di poll juga */
        if (_prefetchDone && _prefetchNotFound && SAFELINK_CFG.AUTO_FALLBACK_ON_NOT_FOUND) {
          clearInterval(pollInterval);
          console.log('[Safelink] Link not found (poll), auto-fallback to:', SAFELINK_CFG.FALLBACK_URL);
          if (continueBtn) {
            continueBtn.classList.remove('disabled');
            continueBtn.classList.add('loading');
            continueBtn.innerHTML =
              '<i class="fa-solid fa-spinner fa-spin"></i> Redirecting...';
          }
          setTimeout(function() {
            window.location.href = SAFELINK_CFG.FALLBACK_URL;
          }, 500);
          return;
        }
        if (_prefetchDone && _prefetchedKValue) {
          clearInterval(pollInterval);
          enableContinueBtn();
          if (SAFELINK_CFG.AUTO_REDIRECT) {
            setTimeout(function() { doContinue(slug); }, 300);
          }
        } else if (_prefetchDone && _prefetchError) {
          clearInterval(pollInterval);
          showError(_prefetchError);
        } else if (pollTries > 50) {
          clearInterval(pollInterval);
          showError('Timeout: cannot fetch link from database. Check DB connection.');
        }
      }, 200);
    }
  });

  /* Continue button click handler (for manual click when AUTO_REDIRECT=false) */
  var continueBtn = document.getElementById('safelink-continue');
  if (continueBtn) {
    continueBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (continueBtn.classList.contains('disabled')) return;
      doContinue(slug);
    });
  }

  /* Shuffle button */
  var shuffleBtn = document.getElementById('safelink-shuffle');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var newArticle = getRandomArticle(article.title);
      replaceArticle(newArticle);
    });
  }
}


/* =========================================================
   PRE-FETCH k-value
   ========================================================= */
async function prefetchKValue(slug) {
  console.log('[Safelink] Pre-fetch k-value for slug:', slug);

  var kValue = null;
  try {
    kValue = ShortStore.get(slug);
    if (kValue) {
      console.log('[Safelink] k-value found in localStorage (same-domain)');
    }
  } catch (e) { /* ignore */ }

  if (!kValue) {
    console.log('[Safelink] localStorage empty, trying DB lookup...');

    var tries = 0;
    while (!isDbReady() && tries < 50) {
      await new Promise(function(r) { setTimeout(r, 100); });
      tries++;
    }

    if (!isDbReady()) {
      console.warn('[Safelink] DB not ready after 5 seconds');
      _prefetchError = 'Database not connected. Ensure db-config.json and api-proxy.php are available.';
      _prefetchDone = true;
      return;
    }

    try {
      var db = getDb();
      console.log('[Safelink] DB lookup for slug:', slug);
      console.log('[Safelink] DB apiUrl:', db.apiUrl || '(unknown)');
      var link = await db.getLinkByCode(slug);
      console.log('[Safelink] DB response:', link ? 'found' : 'null',
        link ? ('| url length: ' + (link.url || '').length) : '');
      if (link && link.url) {
        kValue = link.url;
        console.log('[Safelink] k-value found in DB, length:', kValue.length);
        db.incrementClicks(slug).catch(function() {});
      } else {
        console.warn('[Safelink] Slug not found in DB:', slug);
      }
    } catch (e) {
      console.error('[Safelink] DB lookup error:', e);
      _prefetchError = 'Failed to contact database: ' + (e.message || String(e));
      _prefetchDone = true;
      return;
    }
  }

  if (!kValue) {
    _prefetchError = 'Link not found. Slug "' + slug + '" does not exist in database or localStorage.';
    _prefetchNotFound = true;  /* flag untuk auto-fallback */
    _prefetchDone = true;
    console.warn('[Safelink] Link not found, will auto-fallback to:', SAFELINK_CFG.FALLBACK_URL);
    return;
  }

  var decoded = decodeKValue(kValue);
  if (!decoded || (!decoded.filename && decoded.type !== 'smartlink')) {
    _prefetchError = 'Link is invalid or corrupted.';
    _prefetchDone = true;
    return;
  }

  _prefetchedKValue = kValue;
  _prefetchDone = true;
  console.log('[Safelink] Pre-fetch complete. k-value ready.');
}


/* =========================================================
   ENABLE CONTINUE BUTTON
   ========================================================= */
function enableContinueBtn() {
  var continueBtn = document.getElementById('safelink-continue');
  if (!continueBtn) return;

  continueBtn.classList.remove('disabled');
  continueBtn.classList.add('ready');
  continueBtn.disabled = false;
  continueBtn.innerHTML =
    '<i class="fa-solid fa-play"></i> ' +
    escapeHtml(SAFELINK_CFG.CONTINUE_TEXT);

  var statusPill = document.getElementById('safelink-status-pill');
  if (statusPill) {
    statusPill.classList.add('ready');
    statusPill.innerHTML =
      '<i class="fa-solid fa-circle-check"></i>' +
      '<span class="safelink-status-text">Link ready!</span>';
  }
}


/* =========================================================
   DO CONTINUE
   ========================================================= */
function doContinue(slug) {
  if (!_prefetchedKValue) {
    console.warn('[Safelink] doContinue called but k-value not ready');
    return;
  }

  var continueBtn = document.getElementById('safelink-continue');
  if (continueBtn) {
    continueBtn.classList.add('loading');
    continueBtn.classList.remove('ready');
    continueBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Redirecting...';
  }

  var decoded = decodeKValue(_prefetchedKValue);
  console.log('[Safelink] Continue — decoded:', decoded.type || 'player', decoded.filename || decoded.url);

  if (decoded.type === 'smartlink' && decoded.url) {
    console.log('[Safelink] Redirect to smartlink:', decoded.url);
    window.location.href = decoded.url;
    return;
  }

  if (decoded.filename) {
    var targetUrl = '/?k=' + encodeURIComponent(_prefetchedKValue);
    console.log('[Safelink] Navigate to player:', targetUrl);
    window.location.href = targetUrl;
    return;
  }

  showError('Unknown link format.');
}


/* =========================================================
   SHOW ERROR
   ========================================================= */
function showError(msg) {
  console.error('[Safelink] Error:', msg);
  var continueBtn = document.getElementById('safelink-continue');
  if (continueBtn) {
    continueBtn.classList.remove('loading', 'ready');
    continueBtn.classList.add('disabled');
    continueBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Failed';
  }
  var actionCard = document.querySelector('.safelink-action-card');
  if (actionCard) {
    var existing = actionCard.querySelector('.safelink-error-inline');
    if (existing) existing.remove();

    var errEl = document.createElement('div');
    errEl.className = 'safelink-error-inline';
    errEl.innerHTML =
      '<i class="fa-solid fa-triangle-exclamation"></i> ' +
      escapeHtml(msg);
    actionCard.appendChild(errEl);
  }
}


/* =========================================================
   HTML BUILDER
   ========================================================= */
function buildSafelinkHTML(article, delaySec) {
  var paragraphsHTML = '';
  for (var i = 0; i < article.paragraphs.length; i++) {
    paragraphsHTML +=
      '<p class="safelink-article-p">' +
        escapeHtml(article.paragraphs[i]) +
      '</p>';
  }

  /* Article image (organic look) */
  var imageHTML = '';
  if (article.image) {
    imageHTML =
      '<div class="safelink-article-image-wrap">' +
        '<img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '" ' +
          'class="safelink-article-image" loading="lazy" ' +
          'onerror="this.parentElement.style.display=\'none\'">' +
        '<div class="safelink-article-image-overlay"></div>' +
        '<div class="safelink-article-cat-badge">' +
          '<i class="fa-solid fa-tag"></i> ' + escapeHtml(article.category) +
        '</div>' +
      '</div>';
  }

  return '' +
    '<div class="safelink-page">' +

      '<div class="safelink-header">' +
        '<div class="safelink-logo">Vid<span class="logo-dot">Flow</span></div>' +
        '<div class="safelink-status-pill" id="safelink-status-pill">' +
          '<span class="safelink-spinner"></span>' +
          '<span class="safelink-status-text">Preparing link...</span>' +
        '</div>' +
      '</div>' +

      '<article class="safelink-card safelink-article-card">' +
        imageHTML +
        '<div class="safelink-article-content">' +
          '<div class="safelink-article-meta">' +
            '<span class="safelink-article-cat">' +
              '<i class="fa-solid fa-tag"></i> ' + escapeHtml(article.category) +
            '</span>' +
            '<span class="safelink-article-time">' +
              '<i class="fa-regular fa-clock"></i> ' + escapeHtml(article.readTime) +
            '</span>' +
            '<button class="safelink-shuffle-btn" id="safelink-shuffle" title="Shuffle article">' +
              '<i class="fa-solid fa-shuffle"></i>' +
            '</button>' +
          '</div>' +

          '<h1 class="safelink-article-title">' + escapeHtml(article.title) + '</h1>' +
          '<p class="safelink-article-excerpt">' + escapeHtml(article.excerpt) + '</p>' +

          '<div class="safelink-article-body" id="safelink-article-body">' +
            paragraphsHTML +
          '</div>' +
        '</div>' +
      '</article>' +

      '<div class="safelink-action-card">' +
        '<div class="safelink-countdown-wrap" id="safelink-countdown-wrap">' +
          '<div class="safelink-countdown-ring">' +
            '<svg viewBox="0 0 60 60" class="safelink-ring-svg">' +
              '<circle cx="30" cy="30" r="26" class="safelink-ring-bg"></circle>' +
              '<circle cx="30" cy="30" r="26" class="safelink-ring-fg" id="safelink-ring-fg"></circle>' +
            '</svg>' +
            '<span class="safelink-countdown-num" id="safelink-countdown-num">' + delaySec + '</span>' +
          '</div>' +
          '<div class="safelink-countdown-label">' +
            '<strong>Please wait...</strong>' +
            '<span>Link will be ready in a few seconds</span>' +
          '</div>' +
        '</div>' +

        '<button class="safelink-continue-btn disabled" id="safelink-continue" disabled>' +
          '<i class="fa-solid fa-hourglass-half"></i> ' +
          '<span>Please wait ' + delaySec + ' seconds...</span>' +
        '</button>' +

        '<p class="safelink-disclaimer">' +
          '<i class="fa-solid fa-shield-halved"></i> ' +
          'You will be redirected to the video content after the countdown.' +
        '</p>' +
      '</div>' +

      '<footer class="safelink-footer">' +
        '<span>&copy; ' + new Date().getFullYear() + ' VidFlow</span>' +
        '<span class="safelink-footer-dot">&middot;</span>' +
        '<span>Safelink Protected</span>' +
      '</footer>' +
    '</div>';
}


/* =========================================================
   COUNTDOWN
   ========================================================= */
function setupCountdown(totalSec, onComplete) {
  var numEl = document.getElementById('safelink-countdown-num');
  var ringFg = document.getElementById('safelink-ring-fg');
  var countdownWrap = document.getElementById('safelink-countdown-wrap');

  if (!numEl) return;

  var radius = 26;
  var circumference = 2 * Math.PI * radius;
  if (ringFg) {
    ringFg.style.strokeDasharray = circumference;
    ringFg.style.strokeDashoffset = 0;
  }

  var startTime = Date.now();
  var totalMs = totalSec * 1000;

  function tick() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(1, elapsed / totalMs);
    var currentDisplay = Math.max(0, Math.ceil(totalSec - (elapsed / 1000)));

    if (numEl) numEl.textContent = currentDisplay;
    if (ringFg) ringFg.style.strokeDashoffset = circumference * progress;

    if (elapsed >= totalMs) {
      if (numEl) numEl.textContent = '0';
      if (ringFg) ringFg.style.strokeDashoffset = circumference;
      if (countdownWrap) countdownWrap.classList.add('done');
      onComplete();
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}


/* =========================================================
   ERROR RENDER
   ========================================================= */
function renderError(container, msg) {
  container.innerHTML =
    '<div class="safelink-page">' +
      '<div class="safelink-card safelink-error">' +
        '<div class="safelink-error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
        '<h1 class="safelink-error-title">Link Not Valid</h1>' +
        '<p class="safelink-error-text">' + escapeHtml(msg) + '</p>' +
        '<a href="/" class="safelink-btn-home"><i class="fa-solid fa-house"></i> Back to Home</a>' +
      '</div>' +
    '</div>';
}


/* =========================================================
   REPLACE ARTICLE (shuffle)
   ========================================================= */
function replaceArticle(article) {
  _currentArticle = article;

  /* Update document title */
  document.title = article.title + ' — VidFlow';

  var bodyEl = document.getElementById('safelink-article-body');
  if (!bodyEl) return;

  var paragraphsHTML = '';
  for (var i = 0; i < article.paragraphs.length; i++) {
    paragraphsHTML +=
      '<p class="safelink-article-p">' +
        escapeHtml(article.paragraphs[i]) +
      '</p>';
  }

  /* Fade out content, replace, fade in */
  var contentEl = document.querySelector('.safelink-article-content');
  if (contentEl) contentEl.style.opacity = '0';

  /* Fade out image */
  var imageWrap = document.querySelector('.safelink-article-image-wrap');
  if (imageWrap) imageWrap.style.opacity = '0';

  setTimeout(function() {
    /* Update title */
    var titleEl = document.querySelector('.safelink-article-title');
    var excerptEl = document.querySelector('.safelink-article-excerpt');
    var catEl = document.querySelector('.safelink-article-cat');
    var catBadgeEl = document.querySelector('.safelink-article-cat-badge');
    var timeEl = document.querySelector('.safelink-article-time');

    if (titleEl) titleEl.textContent = article.title;
    if (excerptEl) excerptEl.textContent = article.excerpt;
    if (catEl) catEl.innerHTML = '<i class="fa-solid fa-tag"></i> ' + escapeHtml(article.category);
    if (catBadgeEl) catBadgeEl.innerHTML = '<i class="fa-solid fa-tag"></i> ' + escapeHtml(article.category);
    if (timeEl) timeEl.innerHTML = '<i class="fa-regular fa-clock"></i> ' + escapeHtml(article.readTime);

    /* Update image */
    if (imageWrap && article.image) {
      var img = imageWrap.querySelector('.safelink-article-image');
      if (img) {
        img.src = article.image;
        img.alt = article.title;
      }
      imageWrap.style.display = '';
    } else if (imageWrap && !article.image) {
      imageWrap.style.display = 'none';
    }

    /* Update body */
    bodyEl.innerHTML = paragraphsHTML;

    /* Fade in */
    if (contentEl) contentEl.style.opacity = '1';
    if (imageWrap) imageWrap.style.opacity = '1';
  }, 250);
}


/* =========================================================
   HELPERS
   ========================================================= */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}
