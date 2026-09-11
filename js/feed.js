/* ────────────────────────────────────────────────
   Streaming Grid Feed (Netflix-style)
   Fetches videos from DB, decodes k-values,
   shows poster grid with video thumbnails,
   click → open player
   ──────────────────────────────────────────────── */

import { isDbReady, getDb } from './db/index.js?v=37';
import { decodeKValue, formatTimeAgo, getFilenameFromPath } from './utils.js?v=37';

var feedLinks = [];

var CDNS = [
  { key: 'slicedrive', name: 'Slicedrive', base: 'https://cdn.slicedrive.com' },
  { key: 'videy',      name: 'Videy',      base: 'https://cdn2.videy.co' },
  { key: 'aceimg',     name: 'Aceimg',     base: 'https://cdn.aceimg.com' },
  { key: 'xxfollow',   name: 'Xxfollow',   base: 'https://www.xxxfollow.com' },
  { key: 'xfree',      name: 'Xfree',      base: 'https://cdn.xfree.com' }
];

/* ── Render Feed ── */
export function renderFeed(container, mode) {
  document.body.classList.remove('is-player');
  document.body.classList.add('is-feed');

  var isTrending = mode === 'trending';
  var navActiveHome = isTrending ? '' : ' active';
  var navActiveTrending = isTrending ? ' active' : '';

  container.innerHTML =
    '<div class="feed-wrapper" id="feed-wrapper">' +
      '<div class="feed-header">' +
        '<div class="feed-logo">Vid<span class="logo-dot">Flow</span></div>' +
        '<div class="feed-header-actions">' +
          '<a href="/" class="feed-header-btn' + navActiveHome + '" title="Home"><i class="fa-solid fa-house"></i></a>' +
          '<a href="/?trending=1" class="feed-header-btn' + navActiveTrending + '" title="Trending"><i class="fa-solid fa-fire"></i></a>' +
        '</div>' +
      '</div>' +
      '<div class="feed-scroll" id="feed-scroll">' +
        '<div class="feed-loading-screen" id="feed-loader">' +
          '<div class="feed-spinner"></div>' +
          '<p>Loading videos...</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<nav class="bottom-nav">' +
      '<a href="/" class="nav-item' + navActiveHome + '">' +
        '<i class="fa-solid fa-house"></i>' +
        '<span>Home</span>' +
      '</a>' +
      '<a href="/?trending=1" class="nav-item' + navActiveTrending + '">' +
        '<i class="fa-solid fa-fire"></i>' +
        '<span>Trending</span>' +
      '</a>' +
    '</nav>' +
    '<div class="toast" id="toast"></div>';

  loadFeedVideos(isTrending);
}

async function loadFeedVideos(isTrending) {
  var scrollEl = document.getElementById('feed-scroll');
  var loaderEl = document.getElementById('feed-loader');
  if (!scrollEl) return;

  console.log('[Feed] loadFeedVideos started, isTrending:', isTrending);

  if (!isDbReady()) {
    console.warn('[Feed] DB not ready');
    showFeedEmpty(scrollEl, 'Database not connected.');
    return;
  }

  var db = getDb();
  console.log('[Feed] DB apiUrl:', db.apiUrl || '(unknown)');

  var allLinks;
  try {
    allLinks = await db.getAllLinks();
    console.log('[Feed] getAllLinks returned:', allLinks ? allLinks.length : 0, 'links');
    if (allLinks && allLinks.length > 0) {
      console.log('[Feed] Sample link:', JSON.stringify(allLinks[0]).substring(0, 200));
    }
  } catch (e) {
    console.error('[Feed] getAllLinks error:', e);
    showFeedEmpty(scrollEl, 'Failed to load videos from database.');
    return;
  }

  if (!allLinks || allLinks.length === 0) {
    console.warn('[Feed] No links in DB');
    showFeedEmpty(scrollEl, 'No videos yet.');
    return;
  }

  var playerLinks = [];
  var skippedCount = 0;
  for (var i = 0; i < allLinks.length; i++) {
    var link = allLinks[i];
    if (!link || !link.url) {
      console.warn('[Feed] Link ' + i + ' has no url, skipping');
      skippedCount++;
      continue;
    }
    var decoded = decodeKValue(link.url);
    if (!decoded) {
      console.warn('[Feed] Link ' + i + ' (code: ' + link.code + ') decode failed');
      skippedCount++;
      continue;
    }
    if (!decoded.filename) {
      /* Smartlink or invalid — skip silently */
      skippedCount++;
      continue;
    }

    /* Untuk display filename */
    var displayFilename = decoded.filename;
    if (decoded.sourceUrl) {
      var fnFromSource = getFilenameFromPath(decoded.sourceUrl.replace(/^https?:\/\/[^/]+\//, ''));
      if (fnFromSource) displayFilename = fnFromSource;
    } else if (decoded.cdnPath) {
      var fnFromPath = getFilenameFromPath(decoded.cdnPath);
      if (fnFromPath) displayFilename = fnFromPath;
    }
    playerLinks.push({
      link: link,
      kValue: link.url,
      filename: displayFilename,
      sourceUrl: decoded.sourceUrl || '',
      cdnKey: decoded.cdnKey || '',
      cdnPath: decoded.cdnPath || '',
      clicks: link.clicks || 0,
      code: link.code || '',
      short_url: link.short_url || '',
      created_at: link.created_at || '',
      ext: getExtension(displayFilename)
    });
  }

  console.log('[Feed] Player links:', playerLinks.length, '| Skipped:', skippedCount);

  if (playerLinks.length === 0) {
    console.warn('[Feed] No playable videos found (all entries are smartlinks or invalid)');
    showFeedEmpty(scrollEl, 'No playable videos found.');
    return;
  }

  feedLinks = playerLinks;

  var html = '';

  if (isTrending) {
    playerLinks.sort(function(a, b) { return b.clicks - a.clicks; });
    html += '<div class="feed-section">' +
      '<div class="feed-section-title"><i class="fa-solid fa-fire"></i> Trending Videos</div>' +
      '<div class="feed-grid">';
    for (var j = 0; j < playerLinks.length; j++) {
      html += buildCardHTML(playerLinks[j], j, true);
    }
    html += '</div></div>';
  } else {
    var byClicks = playerLinks.slice().sort(function(a, b) { return b.clicks - a.clicks; });
    var byDate = playerLinks.slice().sort(function(a, b) {
      var ta = new Date(a.created_at).getTime() || 0;
      var tb = new Date(b.created_at).getTime() || 0;
      return tb - ta;
    });

    var trendingCount = Math.min(8, byClicks.length);
    html += '<div class="feed-section">' +
      '<div class="feed-section-title"><i class="fa-solid fa-fire"></i> Trending This Week</div>' +
      '<div class="feed-grid">';
    for (var t = 0; t < trendingCount; t++) {
      html += buildCardHTML(byClicks[t], t, true, t + 1);
    }
    html += '</div></div>';

    html += '<div class="feed-section">' +
      '<div class="feed-section-title"><i class="fa-solid fa-clock"></i> Latest Videos</div>' +
      '<div class="feed-grid">';
    for (var d = 0; d < byDate.length; d++) {
      html += buildCardHTML(byDate[d], d, false);
    }
    html += '</div></div>';
  }

  if (loaderEl) loaderEl.remove();
  scrollEl.insertAdjacentHTML('beforeend', html);

  lazyLoadThumbnails();
}

function getExtension(filename) {
  if (!filename) return 'mp4';
  var parts = filename.split('.');
  if (parts.length > 1) return parts.pop().toLowerCase();
  return 'mp4';
}

function buildCardHTML(item, index, showRank, rank) {
  var titleText = item.filename.replace(/\.[^.]+$/, '');
  if (titleText.length > 40) titleText = titleText.substring(0, 40) + '...';

  var timeStr = item.created_at ? formatTimeAgo(new Date(item.created_at).getTime()) : '';
  var clicksStr = formatCount(item.clicks);
  var ext = (item.ext || 'mp4').toUpperCase();

  var badgeClass = 'hd';
  var badgeText = 'HD';
  if (ext !== 'MP4' && ext !== 'MKV') {
    badgeClass = 'tv';
    badgeText = ext;
  }

  var rankHTML = (showRank && rank) ? '<div class="feed-card-rank">' + rank + '</div>' : '';
  /* Direct player link — homepage & feed bypass safelink.
     Shortlink (/?vid=) tetap untuk URL yang di-share externally. */
  var playerHref = item.kValue ? ('/?k=' + encodeURIComponent(item.kValue)) : ('/' + escapeHTML(item.code || 'video') + '.' + (item.ext || 'mp4'));

  return '<a href="' + playerHref + '" class="feed-card" data-index="' + index + '" data-code="' + escapeHTML(item.code) + '" data-filename="' + escapeHTML(item.filename) + '" data-source-url="' + escapeHTML(item.sourceUrl || '') + '" data-cdn-key="' + escapeHTML(item.cdnKey || '') + '" data-cdn-path="' + escapeHTML(item.cdnPath || '') + '">' +
    '<div class="feed-card-thumb" data-filename="' + escapeHTML(item.filename) + '" data-source-url="' + escapeHTML(item.sourceUrl || '') + '" data-cdn-key="' + escapeHTML(item.cdnKey || '') + '" data-cdn-path="' + escapeHTML(item.cdnPath || '') + '"><i class="fa-solid fa-film"></i></div>' +
    '<div class="feed-card-play"><i class="fa-solid fa-play"></i></div>' +
    rankHTML +
    '<span class="feed-card-badge ' + badgeClass + '">' + badgeText + '</span>' +
    '<div class="feed-card-overlay">' +
      '<div class="feed-card-title">' + escapeHTML(titleText) + '</div>' +
      '<div class="feed-card-meta">' +
        '<i class="fa-solid fa-star"></i> ' + clicksStr +
        '<span class="meta-sep"></span>' +
        (timeStr ? timeStr : ext) +
      '</div>' +
    '</div>' +
  '</a>';
}

function lazyLoadThumbnails() {
  var cards = document.querySelectorAll('.feed-card[data-filename]');
  if (!cards.length) return;

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var card = entry.target;
      obs.unobserve(card);
      loadCardThumbnail(card);
    });
  }, { rootMargin: '300px' });

  cards.forEach(function(card) { obs.observe(card); });
}

function loadCardThumbnail(card) {
  var thumbEl = card.querySelector('.feed-card-thumb');
  if (!thumbEl || thumbEl.classList.contains('thumb-loaded')) return;

  var filename = card.getAttribute('data-filename');
  var sourceUrl = card.getAttribute('data-source-url') || '';
  var cdnKey = card.getAttribute('data-cdn-key') || '';
  var cdnPath = card.getAttribute('data-cdn-path') || '';
  if (!filename && !sourceUrl && !cdnPath) return;

  /* Susun urutan upaya:
     1. sourceUrl langsung (V3)
     2. cdnKey + cdnPath (V2)
     3. Semua CDN dengan filename (fallback) */
  var attempts = [];
  if (sourceUrl) {
    attempts.push({ url: sourceUrl });
  }
  if (cdnKey && cdnPath) {
    for (var k = 0; k < CDNS.length; k++) {
      if (CDNS[k].key === cdnKey) {
        var url2 = CDNS[k].base.replace(/\/+$/, '') + '/' + cdnPath.replace(/^\/+/, '');
        attempts.push({ url: url2 });
        break;
      }
    }
  }
  for (var m = 0; m < CDNS.length; m++) {
    var url3 = CDNS[m].base.replace(/\/+$/, '') + '/' + filename.replace(/^\/+/, '');
    attempts.push({ url: url3 });
  }

  /* Hilangkan duplikat */
  var seen = {};
  var unique = [];
  for (var d = 0; d < attempts.length; d++) {
    if (!seen[attempts[d].url]) {
      seen[attempts[d].url] = true;
      unique.push(attempts[d]);
    }
  }
  attempts = unique;

  var attemptIdx = 0;

  function tryNext() {
    if (attemptIdx >= attempts.length) return;
    var url = attempts[attemptIdx].url;

    var vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    vid.crossOrigin = 'anonymous';

    var seeked = false;
    vid.addEventListener('loadeddata', function() {
      vid.currentTime = 1;
    });
    vid.addEventListener('seeked', function() {
      if (seeked) return;
      seeked = true;
      try {
        var canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || 320;
        canvas.height = vid.videoHeight || 240;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        thumbEl.style.backgroundImage = 'url(' + dataUrl + ')';
        thumbEl.style.backgroundSize = 'cover';
        thumbEl.style.backgroundPosition = 'center';
        thumbEl.innerHTML = '';
        thumbEl.classList.add('thumb-loaded');
      } catch (e) {
        tryVideoPoster(vid);
      }
      vid.removeAttribute('src');
      vid.load();
    });
    vid.addEventListener('error', function() {
      attemptIdx++;
      tryNext();
    });

    vid.src = url;
  }

  function tryVideoPoster(vid) {
    thumbEl.style.backgroundImage = 'url(' + vid.src + ')';
    thumbEl.style.backgroundSize = 'cover';
    thumbEl.style.backgroundPosition = 'center';
    thumbEl.innerHTML = '';
    thumbEl.classList.add('thumb-loaded');
  }

  tryNext();
}

function showFeedEmpty(container, msg) {
  container.innerHTML =
    '<div class="feed-empty">' +
      '<i class="fa-solid fa-film"></i>' +
      '<p>' + msg + '</p>' +
    '</div>';
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}