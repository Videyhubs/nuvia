/**
 * lucky-popup.js — LUCKY DRAW POPUP (PURE HTML/CSS/JS)
 * ------------------------------------------------------------------
 * Popup iklan lucky draw bergaya GIF (animasi CSS, BUKAN file .gif).
 *
 * Spec:
 *   - Tailwind CDN + Inter font + Iconify (lucide set)
 *   - Glass-morphism dark theme
 *   - Spinning conic-gradient border (@property --gradient-angle)
 *   - 3D spinning coin, shimmer $100 text, PayPal logo SVG
 *   - Luck meter (count-up 73–92%)
 *   - Spots remaining (random decay)
 *   - Claim button → open CPA URL new tab + confetti + success toast
 *   - Popup notifications bottom-left (winner random, weighted prize pool)
 *   - Close button (X) pada main card
 *   - Background orbs (3 blurred circles)
 *
 * API (drop-in replacement for old gif-ads.js):
 *   import { mountLuckyPopup } from './lucky-popup.js?v=44';
 *   mountLuckyPopup();
 */

/* =========================================================
   KONFIGURASI — EDIT DI SINI
   ========================================================= */
const CFG = {
  /* ➜ GANTI dengan link offer / CPA kamu. */
  CLAIM_URL: 'https://app.trcefy.com/click?pid=2&offer_id=576&sub2=u261441&sub5=s1PP',

  TOTAL_PRIZE: 100,                 /* $100 */

  SHOW_DELAY_MS: 4000,              /* popup pertama muncul setelah 4 dtk */
  RESPAWN_MS: 60000,                /* setelah di-close, muncul lagi 60 dtk */
  SHOW_ON_SAFELINK: true,

  COUNTDOWN_START_SEC: 599,         /* 09:59 */
  SPOTS_START: 7,
  SPOTS_MIN: 1,
  SPOTS_DECAY_MS: 8000,

  POPUP_FIRST_DELAY_MS: 3000,
  POPUP_MIN_GAP_MS: 5000,
  POPUP_MAX_GAP_MS: 9000,
  POPUP_VISIBLE_MAX: 3,
  POPUP_AUTO_REMOVE_MS: 4500,

  LUCK_TARGET_MIN: 73,
  LUCK_TARGET_MAX: 92,
  LUCK_DELAY_MS: 2500
};

/* =========================================================
   WINNER NAMES (25 unique, no repeat until all used)
   ========================================================= */
const WINNER_NAMES = [
  'Michael R.', 'Sarah K.', 'David L.', 'Emma W.', 'James B.',
  'Lisa M.', 'John S.', 'Maria G.', 'Robert T.', 'Anna P.',
  'Thomas H.', 'Karen N.', 'Daniel F.', 'Sophie A.', 'Brian O.',
  'Nina V.', 'Kevin J.', 'Laura C.', 'Mark D.', 'Rachel E.',
  'Chris Y.', 'Helen Q.', 'Paul Z.', 'Olivia R.', 'Ethan B.'
];

/* =========================================================
   WEIGHTED PRIZE POOL
   ========================================================= */
const PRIZES = [
  { amount: 5,   weight: 30, color: '#6b7280', icon: '🪙' },
  { amount: 10,  weight: 25, color: '#6b7280', icon: '🪙' },
  { amount: 25,  weight: 20, color: '#818cf8', icon: '💰' },
  { amount: 50,  weight: 15, color: '#a5b4fc', icon: '💎' },
  { amount: 100, weight: 10, color: '#fbbf24', icon: '🏆' }
];
const PRIZE_POOL = PRIZES.flatMap(function (p) {
  return Array(p.weight).fill(p);
});

/* =========================================================
   TIME AGO POOL (uniform random, banyak variasi)
   ========================================================= */
const TIME_AGO = [
  'just now', '3s ago', '5s ago', '8s ago', '12s ago', '18s ago',
  '24s ago', '32s ago', '45s ago', '58s ago', '1m ago', '2m ago',
  '3m ago', '4m ago', '5m ago'
];

function pickTimeAgo() {
  /* uniform random — tidak ada bias ke "just now" lagi */
  return TIME_AGO[Math.floor(Math.random() * TIME_AGO.length)];
}

/* =========================================================
   STATE
   ========================================================= */
let nameQueue = [];
let activePopups = [];
let popupSchedulerStarted = false;

/* =========================================================
   MOUNT POPUP
   ========================================================= */
export function mountLuckyPopup() {
  if (window.__luckyPopMounted) return;
  window.__luckyPopMounted = true;

  /* Skip di halaman generator */
  var pageMode = document.documentElement.getAttribute('data-mode');
  if (pageMode === 'generator') return;

  /* Skip di safelink kalau di-disable */
  if (document.body.classList.contains('is-safelink') && !CFG.SHOW_ON_SAFELINK) {
    return;
  }

  /* Inject Tailwind, Inter, Iconify (hanya jika belum ada) */
  injectExternalDeps();

  /* Inject CSS */
  injectStyles();

  /* Inject background orbs */
  var orbs = document.createElement('div');
  orbs.innerHTML =
    '<div class="lucky-pop-orb lucky-pop-orb-1"></div>' +
    '<div class="lucky-pop-orb lucky-pop-orb-2"></div>' +
    '<div class="lucky-pop-orb lucky-pop-orb-3"></div>';
  document.body.appendChild(orbs);

  /* Inject confetti container */
  var confettiC = document.createElement('div');
  confettiC.className = 'lucky-pop-confetti-container';
  confettiC.id = 'luckyPopConfetti';
  document.body.appendChild(confettiC);

  /* Inject success toast */
  var toast = document.createElement('div');
  toast.className = 'lucky-pop-success-toast';
  toast.id = 'luckyPopToast';
  toast.innerHTML =
    '<iconify-icon icon="lucide:party-popper"></iconify-icon>' +
    '<span>Congratulations! Redirecting to claim your prize...</span>';
  document.body.appendChild(toast);

  /* Inject popup stack */
  var popupStack = document.createElement('div');
  popupStack.className = 'lucky-pop-popup-stack';
  popupStack.id = 'luckyPopStack';
  document.body.appendChild(popupStack);

  /* Inject main card wrapper (overlay) */
  var overlay = document.createElement('div');
  overlay.className = 'lucky-pop-overlay';
  overlay.id = 'luckyPopOverlay';
  overlay.innerHTML = buildMainCardHtml();
  document.body.appendChild(overlay);

  /* Mulai: tampil setelah delay */
  var showTimer = setTimeout(function () { showCard(); }, CFG.SHOW_DELAY_MS);

  /* Init interactions */
  initCardInteractions();
  startLuckMeter();
  startCountdown();
  startSpots();

  /* Start popup notifications (hanya sekali, walau mount banyak kali) */
  if (!popupSchedulerStarted) {
    popupSchedulerStarted = true;
    setTimeout(function () {
      /* popup pertama: batch 2 */
      spawnWinnerPopup();
      setTimeout(function () { spawnWinnerPopup(); }, 250);
      scheduleNextPopup();
    }, CFG.POPUP_FIRST_DELAY_MS);
  }
}

/* =========================================================
   EXTERNAL DEPS — TAILWIND, INTER, ICONIFY
   ========================================================= */
function injectExternalDeps() {
  /* Tailwind */
  if (!document.querySelector('script[data-lucky-pop-tailwind]')) {
    var tw = document.createElement('script');
    tw.src = 'https://cdn.tailwindcss.com';
    tw.setAttribute('data-lucky-pop-tailwind', 'true');
    document.head.appendChild(tw);
  }

  /* Inter font */
  if (!document.querySelector('link[data-lucky-pop-inter]')) {
    var l1 = document.createElement('link');
    l1.rel = 'preconnect';
    l1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(l1);

    var l2 = document.createElement('link');
    l2.rel = 'preconnect';
    l2.href = 'https://fonts.gstatic.com';
    l2.crossOrigin = 'anonymous';
    document.head.appendChild(l2);

    var l3 = document.createElement('link');
    l3.rel = 'stylesheet';
    l3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    l3.setAttribute('data-lucky-pop-inter', 'true');
    document.head.appendChild(l3);
  }

  /* Iconify */
  if (!document.querySelector('script[data-lucky-pop-iconify]')) {
    var ic = document.createElement('script');
    ic.src = 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js';
    ic.setAttribute('data-lucky-pop-iconify', 'true');
    document.head.appendChild(ic);
  }
}

/* =========================================================
   BUILD MAIN CARD HTML
   ========================================================= */
function buildMainCardHtml() {
  return (
    '<div class="lucky-pop-main-card" id="luckyPopCard">' +
      '<div class="lucky-pop-card-inner">' +

        /* Close button */
        '<button class="lucky-pop-card-close" id="luckyPopClose" aria-label="Close popup" type="button">' +
          '<iconify-icon icon="lucide:x"></iconify-icon>' +
        '</button>' +

        /* Prize Section */
        '<div class="lucky-pop-prize-section">' +
          '<span class="lucky-pop-sparkle s1">✦</span>' +
          '<span class="lucky-pop-sparkle s2">✧</span>' +
          '<span class="lucky-pop-sparkle s3">✦</span>' +
          '<span class="lucky-pop-sparkle s4">✧</span>' +
          '<span class="lucky-pop-sparkle s5">✦</span>' +

          '<div class="lucky-pop-coin-3d">' +
            '<img class="lucky-pop-coin-logo" alt="PayPal" draggable="false" src="data:image/png;base64,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" />' +
          '</div>' +

          '<div class="lucky-pop-shimmer-100">$100</div>' +

          '<div class="lucky-pop-pp-badge">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">' +
              '<path d="M7.076 21.337H2.77a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.75 1.32 4.41.017 1.27-.07 2.42-.35 3.59-1.27 5.4-5.09 7.83-10.34 7.83H7.076z" fill="#fff"/>' +
              '<path d="M2.77 21.337L4.944.901A1.06 1.06 0 0 1 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.42.477.74 1.024.97 1.65h-3.32c-.524 0-.972.382-1.054.901l-2.78 17.736H2.77z" fill="#fff" opacity="0.55"/>' +
            '</svg>' +
            '<span>PayPal Verified</span>' +
          '</div>' +
        '</div>' +

        /* 3. Main Text */
        '<h2 class="lucky-pop-main-h2">Before You Watch the Video...</h2>' +
        '<p class="lucky-pop-main-p">' +
          'Try your luck today! You could be the lucky winner to receive ' +
          '<span class="hl">$100 directly to your PayPal account</span>. ' +
          'Don\'t miss this chance!' +
        '</p>' +

        /* 4. Luck Meter */
        '<div class="lucky-pop-luck-meter">' +
          '<div class="lucky-pop-luck-meter-label">' +
            '<span>Your Luck Meter</span>' +
            '<span class="pct" id="luckyPopLuckPct">0%</span>' +
          '</div>' +
          '<div class="lucky-pop-luck-bar">' +
            '<div class="lucky-pop-luck-fill" id="luckyPopLuckFill"></div>' +
          '</div>' +
        '</div>' +

        /* 5. Spots Remaining */
        '<div class="lucky-pop-spots" id="luckyPopSpotsBox">' +
          '<span class="lucky-pop-ping-dot"></span>' +
          '<span>Only <span class="count" id="luckyPopSpotsCount">7</span> spots remaining today!</span>' +
        '</div>' +

        /* 6. Claim Button */
        '<button class="lucky-pop-claim-btn" id="luckyPopClaimBtn" type="button">' +
          '<iconify-icon icon="lucide:gift"></iconify-icon>' +
          '<span>Claim Your $100 Prize Now</span>' +
          '<iconify-icon icon="lucide:arrow-right" class="arrow"></iconify-icon>' +
        '</button>' +

        /* 7. Trust Indicators */
        '<div class="lucky-pop-trust-row">' +
          '<div class="lucky-pop-trust-item verified">' +
            '<iconify-icon icon="lucide:badge-check"></iconify-icon>' +
            '<span>Verified</span>' +
          '</div>' +
          '<div class="lucky-pop-trust-item secure">' +
            '<iconify-icon icon="lucide:shield-check"></iconify-icon>' +
            '<span>Secure</span>' +
          '</div>' +
          '<div class="lucky-pop-trust-item instant">' +
            '<iconify-icon icon="lucide:zap"></iconify-icon>' +
            '<span>Instant Payout</span>' +
          '</div>' +
          '<div class="lucky-pop-trust-item ends">' +
            '<iconify-icon icon="lucide:clock"></iconify-icon>' +
            '<span>Ends Soon</span>' +
          '</div>' +
        '</div>' +

        /* 8. Countdown Timer */
        '<div class="lucky-pop-countdown-row">' +
          '<span class="lucky-pop-countdown-label">Offer expires in:</span>' +
          '<div class="lucky-pop-countdown-boxes">' +
            '<div class="lucky-pop-countdown-box" id="luckyPopCdMin">09</div>' +
            '<div class="lucky-pop-countdown-box">:</div>' +
            '<div class="lucky-pop-countdown-box" id="luckyPopCdSec">59</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>'
  );
}

/* =========================================================
   INTERACTIONS
   ========================================================= */
function initCardInteractions() {
  var overlay = document.getElementById('luckyPopOverlay');
  var closeBtn = document.getElementById('luckyPopClose');
  var claimBtn = document.getElementById('luckyPopClaimBtn');

  /* Close button */
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      hideCard();
      scheduleRespawn();
    });
  }

  /* Backdrop click */
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        hideCard();
        scheduleRespawn();
      }
    });
  }

  /* ESC */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
      hideCard();
      scheduleRespawn();
    }
  });

  /* Claim button */
  if (claimBtn) {
    var clicked = false;
    claimBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      /* 60 confetti pieces */
      fireConfetti(60);

      /* burst centered on claim button */
      var rect = claimBtn.getBoundingClientRect();
      var centerX = (rect.left + rect.width / 2) / window.innerWidth * 100;
      setTimeout(function () { fireConfetti(30, centerX); }, 100);

      /* success toast */
      showSuccessToast();

      /* open CPA offer in new tab */
      if (!clicked) {
        clicked = true;
        setTimeout(function () {
          window.open(CFG.CLAIM_URL, '_blank', 'noopener,noreferrer');
          setTimeout(function () { clicked = false; }, 1500);
        }, 600);
      }
    });
  }
}

/* =========================================================
   SHOW / HIDE CARD
   ========================================================= */
function showCard() {
  var overlay = document.getElementById('luckyPopOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  void overlay.offsetWidth;
  overlay.classList.add('show');
  document.body.classList.add('lucky-pop-lock');
}
function hideCard() {
  var overlay = document.getElementById('luckyPopOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.classList.remove('lucky-pop-lock');
  setTimeout(function () {
    if (overlay && !overlay.classList.contains('show')) {
      overlay.style.display = 'none';
    }
  }, 350);
}
function scheduleRespawn() {
  setTimeout(function () { showCard(); }, CFG.RESPAWN_MS);
}

/* =========================================================
   LUCK METER
   ========================================================= */
function startLuckMeter() {
  var targetPct = Math.floor(Math.random() *
    (CFG.LUCK_TARGET_MAX - CFG.LUCK_TARGET_MIN + 1)) + CFG.LUCK_TARGET_MIN;
  var fill = document.getElementById('luckyPopLuckFill');
  var pctEl = document.getElementById('luckyPopLuckPct');
  if (!fill || !pctEl) return;
  fill.style.setProperty('--target-pct', targetPct + '%');

  setTimeout(function () {
    var start = performance.now();
    var duration = 3000;
    function step(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(targetPct * eased);
      pctEl.textContent = val + '%';
      if (p < 1) requestAnimationFrame(step);
      else pctEl.textContent = targetPct + '%';
    }
    requestAnimationFrame(step);
  }, CFG.LUCK_DELAY_MS);
}

/* =========================================================
   COUNTDOWN
   ========================================================= */
function startCountdown() {
  var remaining = CFG.COUNTDOWN_START_SEC;
  var minEl = document.getElementById('luckyPopCdMin');
  var secEl = document.getElementById('luckyPopCdSec');
  if (!minEl || !secEl) return;
  function tick() {
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;
    minEl.textContent = String(m).padStart(2, '0');
    secEl.textContent = String(s).padStart(2, '0');
    if (remaining > 0) remaining--;
    else remaining = CFG.COUNTDOWN_START_SEC;
  }
  tick();
  setInterval(tick, 1000);
}

/* =========================================================
   SPOTS REMAINING
   ========================================================= */
function startSpots() {
  var spots = CFG.SPOTS_START;
  var countEl = document.getElementById('luckyPopSpotsCount');
  var boxEl = document.getElementById('luckyPopSpotsBox');
  if (!countEl || !boxEl) return;
  setInterval(function () {
    if (spots > CFG.SPOTS_MIN) {
      var dec = Math.floor(Math.random() * 2) + 1;
      spots = Math.max(CFG.SPOTS_MIN, spots - dec);
      countEl.textContent = spots;
      boxEl.classList.remove('flash');
      void boxEl.offsetWidth;
      boxEl.classList.add('flash');
    } else {
      spots = CFG.SPOTS_START;
      countEl.textContent = spots;
    }
  }, CFG.SPOTS_DECAY_MS);
}

/* =========================================================
   POPUP NOTIFICATIONS (winner random)
   ========================================================= */
function nextName() {
  if (nameQueue.length === 0) {
    nameQueue = WINNER_NAMES.slice();
    for (var i = nameQueue.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = nameQueue[i];
      nameQueue[i] = nameQueue[j];
      nameQueue[j] = tmp;
    }
  }
  return nameQueue.pop();
}

function pickPrize() {
  return PRIZE_POOL[Math.floor(Math.random() * PRIZE_POOL.length)];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function spawnWinnerPopup() {
  var stack = document.getElementById('luckyPopStack');
  if (!stack) return;

  /* enforce max visible */
  while (activePopups.length >= CFG.POPUP_VISIBLE_MAX) {
    var oldest = activePopups[0];
    removePopup(oldest, true);
  }

  var prize = pickPrize();
  var name = nextName();
  var timeAgo = pickTimeAgo();

  var el = document.createElement('div');
  el.className = 'lucky-pop-winner-popup';
  el.style.setProperty('--accent', prize.color);
  el.innerHTML =
    '<div class="lucky-pop-pp-icon" style="font-size:18px;">' + prize.icon + '</div>' +
    '<div class="lucky-pop-pp-body">' +
      '<div class="lucky-pop-pp-name-row">' +
        '<span class="lucky-pop-pp-name">' + escapeHtml(name) + '</span>' +
        '<iconify-icon icon="lucide:check-circle-2" class="lucky-pop-pp-check"></iconify-icon>' +
      '</div>' +
      '<div class="lucky-pop-pp-detail">' +
        'won <span class="amt" style="color:' + prize.color + ';">$' + prize.amount + '</span>' +
        '<span class="via"> via PayPal</span>' +
      '</div>' +
    '</div>' +
    '<div class="lucky-pop-pp-time">' + timeAgo + '</div>' +
    '<button class="lucky-pop-pp-close" aria-label="Dismiss" type="button">' +
      '<iconify-icon icon="lucide:x"></iconify-icon>' +
    '</button>';

  /* close button */
  var closeBtn = el.querySelector('.lucky-pop-pp-close');
  closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    removePopup(el, false);
  });

  stack.appendChild(el);
  activePopups.push(el);

  /* auto-remove */
  var autoTimer = setTimeout(function () { removePopup(el, true); }, CFG.POPUP_AUTO_REMOVE_MS);
  el._autoTimer = autoTimer;
}

function removePopup(el, animate) {
  if (!el || !el.parentNode) return;
  if (el._autoTimer) { clearTimeout(el._autoTimer); el._autoTimer = null; }
  var idx = activePopups.indexOf(el);
  if (idx !== -1) activePopups.splice(idx, 1);
  if (animate) {
    el.classList.add('exit');
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, { once: true });
  } else {
    if (el.parentNode) el.parentNode.removeChild(el);
  }
}

function scheduleNextPopup() {
  var gap = CFG.POPUP_MIN_GAP_MS +
    Math.floor(Math.random() * (CFG.POPUP_MAX_GAP_MS - CFG.POPUP_MIN_GAP_MS + 1));
  setTimeout(function () {
    /* 50% chance batch (2-3 popups), 50% solo */
    var batchRoll = Math.random();
    var count = 1;
    if (batchRoll < 0.30) count = 3;
    else if (batchRoll < 0.55) count = 2;

    for (var i = 0; i < count; i++) {
      /* stagger 200ms antar popup dalam batch supaya tidak tabrakan visual */
      (function (delay) {
        setTimeout(function () { spawnWinnerPopup(); }, delay);
      })(i * 200);
    }
    scheduleNextPopup();
  }, gap);
}

/* =========================================================
   CONFETTI
   ========================================================= */
var CONFETTI_COLORS = ['#6366f1', '#a855f7', '#fbbf24', '#ec4899', '#10b981', '#3b82f6', '#f43f5e'];

function fireConfetti(burstCount, centerX = null) {
  var container = document.getElementById('luckyPopConfetti');
  if (!container) return;
  container.classList.add('active');
  for (var i = 0; i < burstCount; i++) {
    var piece = document.createElement('div');
    piece.className = 'lucky-pop-confetti-piece';
    var size = Math.random() * 8 + 6;
    var isCircle = Math.random() > 0.5;
    piece.style.width = size + 'px';
    piece.style.height = (isCircle ? size : size * 1.4) + 'px';
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.left = (centerX !== null ? centerX + (Math.random() * 40 - 20) : Math.random() * 100) + '%';
    piece.style.top = (centerX !== null ? 0 : -20) + 'px';
    piece.style.borderRadius = isCircle ? '50%' : '2px';
    piece.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.6) + 's';
    piece.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
    container.appendChild(piece);
    piece.addEventListener('animationend', function () {
      if (this.parentNode) this.parentNode.removeChild(this);
    }, { once: true });
  }
  setTimeout(function () {
    if (container.children.length === 0) container.classList.remove('active');
  }, 5500);
}

/* =========================================================
   SUCCESS TOAST
   ========================================================= */
var successTimer = null;
function showSuccessToast() {
  var toast = document.getElementById('luckyPopToast');
  if (!toast) return;
  toast.classList.add('show');
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 4000);
}

/* =========================================================
   INJECT STYLES
   ========================================================= */
function injectStyles() {
  if (document.getElementById('lucky-pop-styles')) return;
  var style = document.createElement('style');
  style.id = 'lucky-pop-styles';
  style.textContent = luckyPopCSS();
  document.head.appendChild(style);
}

/* =========================================================
   ALL CSS (long string)
   ========================================================= */
function luckyPopCSS() {
  return `
/* ============ CSS PROPERTY (spinning border) ============ */
@property --lucky-pop-gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* ============ BASE ============ */
.lucky-pop-overlay * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

/* ============ BACKGROUND ORBS ============ */
.lucky-pop-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 9990;
  will-change: transform;
}
.lucky-pop-orb-1 { width: 380px; height: 380px; background: rgba(99,102,241,0.10); top: -80px; left: -80px; animation: lpOrbFloat1 8s ease-in-out infinite; }
.lucky-pop-orb-2 { width: 420px; height: 420px; background: rgba(168,85,247,0.10); bottom: -100px; right: -100px; animation: lpOrbFloat2 9s ease-in-out infinite; }
.lucky-pop-orb-3 { width: 300px; height: 300px; background: rgba(251,191,36,0.05); top: 40%; left: 60%; animation: lpOrbFloat3 10s ease-in-out infinite; }
@keyframes lpOrbFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px, 30px); } }
@keyframes lpOrbFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px, -40px); } }
@keyframes lpOrbFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-50px, 20px); } }

/* ============ OVERLAY ============ */
.lucky-pop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9995;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(5, 5, 10, 0.78);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.lucky-pop-overlay.show {
  opacity: 1;
  pointer-events: auto;
}
body.lucky-pop-lock { overflow: hidden; }

/* ============ MAIN CARD ============ */
.lucky-pop-main-card {
  position: relative;
  z-index: 10;
  max-width: 32rem;
  width: 100%;
  padding: 4px;
  border-radius: 1.5rem;
  background: conic-gradient(from var(--lucky-pop-gradient-angle),
    #6366f1, #a855f7, #fbbf24, #ec4899, #6366f1);
  animation: lpBorderSpin 2.5s linear infinite, lpGlowPulse 4s ease-in-out infinite;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.05),
              0 20px 80px rgba(99,102,241,0.3),
              0 0 100px rgba(168,85,247,0.2);
  transform: scale(0.85);
  transition: transform 0.35s ease;
}
.lucky-pop-overlay.show .lucky-pop-main-card {
  transform: scale(1);
}
@keyframes lpBorderSpin { to { --lucky-pop-gradient-angle: 360deg; } }
@keyframes lpGlowPulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 20px 80px rgba(99,102,241,0.3), 0 0 100px rgba(168,85,247,0.2); }
  50%      { box-shadow: 0 0 0 1px rgba(255,255,255,0.10), 0 30px 100px rgba(99,102,241,0.5), 0 0 140px rgba(168,85,247,0.35); }
}

.lucky-pop-card-inner {
  position: relative;
  background: rgba(10, 10, 18, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.4rem;
  padding: 1.75rem 1.5rem;
  overflow: hidden;
}
@media (min-width: 768px) { .lucky-pop-card-inner { padding: 2.25rem 2rem; } }

/* ============ CLOSE BUTTON ============ */
.lucky-pop-card-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(10, 12, 20, 0.7);
  color: #d4d4d8;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease;
}
.lucky-pop-card-close:hover {
  background: #ef4444;
  color: #fff;
  transform: rotate(90deg) scale(1.1);
  border-color: rgba(255,255,255,0.4);
}
.lucky-pop-card-close iconify-icon { font-size: 14px; }

/* ============ TOP BADGE ============ */
.lucky-pop-flex-center { display: flex; justify-content: center; }
.lucky-pop-top-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(245, 158, 11, 0.10);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 9999px;
  color: #fbbf24;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  animation: lpFadeSlideUp 0.6s ease-out both;
}
.lucky-pop-top-badge iconify-icon { font-size: 12px; }

/* ============ PRIZE SECTION ============ */
.lucky-pop-prize-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px 0 8px;
  animation: lpScalePop 0.7s cubic-bezier(0.18,1.35,0.32,1) 0.1s both;
}
.lucky-pop-coin-3d {
  width: 240px;
  height: auto;
  display: block;
  background: transparent;
  box-shadow: none;
  animation: none;
  position: relative;
  filter: drop-shadow(0 8px 28px rgba(0, 112, 186, 0.5));
}
.lucky-pop-coin-3d::before { display: none; }
.lucky-pop-coin-3d svg, .lucky-pop-coin-3d img.lucky-pop-coin-logo {
  width: 100%;
  height: auto;
  position: relative;
  z-index: 2;
  filter: none;
  display: block;
  object-fit: contain;
}
@keyframes lpCoinSpin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }

.lucky-pop-shimmer-100 {
  font-size: 52px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(90deg, #ffffff 0%, #818cf8 25%, #ffffff 50%, #818cf8 75%, #ffffff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: lpShimmerText 3s linear infinite;
  letter-spacing: -0.03em;
}
@keyframes lpShimmerText { to { background-position: 200% center; } }

.lucky-pop-pp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(96, 165, 250, 0.10);
  border: 1px solid rgba(96, 165, 250, 0.30);
  border-radius: 9999px;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 600;
  animation: lpPpPulse 2.5s ease-in-out infinite;
}
.lucky-pop-pp-badge svg { width: 14px; height: 16px; display: block; }
@keyframes lpPpPulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(96,165,250,0.4)); }
  50%      { filter: drop-shadow(0 0 12px rgba(96,165,250,0.8)); }
}

.lucky-pop-sparkle {
  position: absolute;
  color: #fbbf24;
  font-weight: 900;
  text-shadow: 0 0 8px rgba(251,191,36,0.8);
  pointer-events: none;
  animation: lpSparkleAnim 1.8s ease-in-out infinite;
}
.lucky-pop-sparkle.s1 { top: 6%; left: 14%; font-size: 14px; animation-delay: 0s; }
.lucky-pop-sparkle.s2 { top: 22%; right: 10%; font-size: 18px; animation-delay: 0.4s; animation-duration: 2.2s; }
.lucky-pop-sparkle.s3 { bottom: 18%; left: 6%; font-size: 12px; animation-delay: 0.8s; animation-duration: 1.6s; }
.lucky-pop-sparkle.s4 { bottom: 8%; right: 14%; font-size: 16px; animation-delay: 1.2s; animation-duration: 2.4s; }
.lucky-pop-sparkle.s5 { top: 50%; left: 2%; font-size: 10px; animation-delay: 0.6s; animation-duration: 2.0s; }
@keyframes lpSparkleAnim {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50%      { opacity: 1; transform: scale(1.1); }
}

/* ============ MAIN TEXT ============ */
.lucky-pop-main-h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1.3;
  margin-top: 12px;
  animation: lpFadeSlideUp 0.6s ease-out 0.2s both;
}
@media (min-width: 768px) { .lucky-pop-main-h2 { font-size: 1.5rem; } }
.lucky-pop-main-p {
  color: #a3a3a3;
  text-align: center;
  font-size: 14px;
  line-height: 1.55;
  margin: 8px 0 0 0;
  animation: lpFadeSlideUp 0.6s ease-out 0.3s both;
}
@media (min-width: 768px) { .lucky-pop-main-p { font-size: 15px; } }
.lucky-pop-main-p .hl { color: #818cf8; font-weight: 600; }

/* ============ LUCK METER ============ */
.lucky-pop-luck-meter {
  margin-top: 20px;
  animation: lpFadeSlideUp 0.6s ease-out 0.4s both;
}
.lucky-pop-luck-meter-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #d4d4d8;
  margin-bottom: 6px;
}
.lucky-pop-luck-meter-label .pct {
  font-family: ui-monospace, monospace;
  color: #818cf8;
  font-weight: 700;
  font-size: 13px;
}
.lucky-pop-luck-bar {
  height: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05);
}
.lucky-pop-luck-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  border-radius: 4px;
  animation: lpProgressFill 3s ease-out 2.5s forwards;
  box-shadow: 0 0 12px rgba(168,85,247,0.5);
}
@keyframes lpProgressFill {
  from { width: 0%; }
  to   { width: var(--target-pct, 85%); }
}

/* ============ SPOTS REMAINING ============ */
.lucky-pop-spots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 13px;
  font-weight: 600;
  margin-top: 16px;
  animation: lpFadeSlideUp 0.6s ease-out 0.5s both;
}
.lucky-pop-ping-dot {
  position: relative;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}
.lucky-pop-ping-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #ef4444;
  border-radius: 50%;
  animation: lpPing 1.5s cubic-bezier(0,0,0.2,1) infinite;
}
.lucky-pop-ping-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #ef4444;
  border-radius: 50%;
}
@keyframes lpPing {
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
.lucky-pop-spots.flash { animation: lpRedFlash 0.6s ease-out; }
@keyframes lpRedFlash {
  0% { background: rgba(239, 68, 68, 0.5); }
  100% { background: rgba(239, 68, 68, 0.08); }
}
.lucky-pop-spots .count { color: #fff; font-weight: 800; }

/* ============ CLAIM BUTTON ============ */
.lucky-pop-claim-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #9333ea 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  border: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: lpClaimPulse 2s ease-in-out infinite;
  text-decoration: none;
  margin-top: 20px;
}
.lucky-pop-claim-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 40px rgba(99,102,241,0.7), 0 0 0 1px rgba(255,255,255,0.2) inset;
}
.lucky-pop-claim-btn:active { transform: scale(0.98); }
@keyframes lpClaimPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
  50%      { transform: scale(1.03); box-shadow: 0 10px 30px rgba(99,102,241,0.6), 0 0 0 1px rgba(255,255,255,0.15) inset; }
}
.lucky-pop-claim-btn iconify-icon { font-size: 18px; }
.lucky-pop-claim-btn .arrow { animation: lpArrowJiggle 1.4s ease-in-out infinite; }
@keyframes lpArrowJiggle {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(4px); }
}

/* ============ TRUST INDICATORS ============ */
.lucky-pop-trust-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 16px;
  animation: lpFadeSlideUp 0.6s ease-out 0.7s both;
}
.lucky-pop-trust-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  text-align: center;
}
.lucky-pop-trust-item iconify-icon { font-size: 16px; }
.lucky-pop-trust-item span { font-size: 10px; color: #a3a3a3; font-weight: 500; }
.lucky-pop-trust-item.verified iconify-icon { color: #3b82f6; }
.lucky-pop-trust-item.secure iconify-icon   { color: #10b981; }
.lucky-pop-trust-item.instant iconify-icon  { color: #fbbf24; }
.lucky-pop-trust-item.ends iconify-icon     { color: #ef4444; }

/* ============ COUNTDOWN ============ */
.lucky-pop-countdown-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
  animation: lpFadeSlideUp 0.6s ease-out 0.8s both;
}
.lucky-pop-countdown-label { font-size: 12px; color: #71717a; }
.lucky-pop-countdown-boxes { display: flex; gap: 4px; }
.lucky-pop-countdown-box {
  min-width: 32px;
  padding: 4px 6px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 6px;
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* ============ ENTRANCE ANIMATIONS ============ */
@keyframes lpFadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lpScalePop {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}

/* ============ POPUP NOTIFICATIONS ============ */
.lucky-pop-popup-stack {
  position: fixed;
  bottom: 24px;
  left: 24px;
  max-width: 320px;
  width: calc(100vw - 48px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
  pointer-events: none;
}
@media (max-width: 480px) {
  .lucky-pop-popup-stack { bottom: 16px; left: 16px; right: 16px; max-width: none; width: auto; }
}
.lucky-pop-winner-popup {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(15, 15, 22, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  animation: lpPopupSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
  pointer-events: auto;
  overflow: hidden;
}
.lucky-pop-winner-popup.exit { animation: lpPopupSlideOut 0.4s ease-in both; }
@keyframes lpPopupSlideIn {
  from { opacity: 0; transform: translateX(-120%); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes lpPopupSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-120%); }
}
.lucky-pop-winner-popup::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent, #818cf8);
}
.lucky-pop-pp-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.06);
}
.lucky-pop-pp-body { flex: 1; min-width: 0; }
.lucky-pop-pp-name-row { display: flex; align-items: center; gap: 4px; }
.lucky-pop-pp-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lucky-pop-pp-check { color: #10b981; font-size: 12px; flex-shrink: 0; }
.lucky-pop-pp-detail {
  font-size: 11px;
  color: #a3a3a3;
  margin-top: 2px;
  line-height: 1.3;
}
.lucky-pop-pp-detail .amt { font-weight: 700; }
.lucky-pop-pp-detail .via { color: #71717a; }
.lucky-pop-pp-time {
  flex-shrink: 0;
  font-size: 10px;
  color: #525252;
  align-self: flex-start;
  margin-top: 2px;
}
.lucky-pop-pp-close {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border: 0;
  background: transparent;
  color: #525252;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  padding: 0;
}
.lucky-pop-pp-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
.lucky-pop-pp-close iconify-icon { font-size: 12px; }

/* ============ CONFETTI ============ */
.lucky-pop-confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  opacity: 0;
  overflow: hidden;
}
.lucky-pop-confetti-container.active { opacity: 1; }
.lucky-pop-confetti-piece {
  position: absolute;
  top: -20px;
  will-change: transform, opacity;
  animation: lpConfettiFall linear forwards;
}
@keyframes lpConfettiFall {
  0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg) scale(0.5); opacity: 0; }
}

/* ============ SUCCESS TOAST ============ */
.lucky-pop-success-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(-16px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: rgba(6, 78, 59, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 12px;
  color: #d1fae5;
  font-size: 14px;
  font-weight: 600;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
  max-width: calc(100vw - 32px);
}
.lucky-pop-success-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.lucky-pop-success-toast iconify-icon { color: #10b981; font-size: 18px; }

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .lucky-pop-main-card,
  .lucky-pop-main-card *::before,
  .lucky-pop-main-card *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

/* ============ MOBILE ============ */
@media (max-width: 480px) {
  .lucky-pop-overlay { padding: 12px; }
  .lucky-pop-card-inner { padding: 1.5rem 1.25rem; }
  .lucky-pop-shimmer-100 { font-size: 44px; }
  .lucky-pop-main-h2 { font-size: 1.1rem; }
  .lucky-pop-main-p { font-size: 13px; }
  .lucky-pop-claim-btn { font-size: 13px; padding: 12px 14px; }
  .lucky-pop-trust-item span { font-size: 9px; }
}
`;
}
