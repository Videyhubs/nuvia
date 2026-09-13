/**
 * gif-ads.js — IKLAN MELAYANG DI TENGAH LAYAR (CENTER FLOATING AD)
 * ------------------------------------------------------------------
 * Update (request user):
 *   - Posisi: TENGAH layar (bukan kiri/kanan lagi) + backdrop blur
 *   - Copy GIF: bahasa Inggris jujur — "Enter your email & verify,
 *     then wait. Good luck!" (TANPA kata "code", tanpa urgency palsu)
 *
 * Fitur:
 *   - Desain GIF RANDOM setiap tampil (4 desain, anti-repeat)
 *   - Muncul di TENGAH layar dengan backdrop gelap + blur (modern)
 *   - Rotasi desain otomatis selagi tampil
 *   - AUTO CLOSE (default 20 dtk) supaya tidak mengganggu terlalu lama
 *   - Tutup via: tombol X, klik area gelap, atau tekan ESC
 *   - Setelah ditutup → muncul kembali otomatis (RESPAWN)
 *   - Scroll halaman dikunci selama iklan tampil (seperti modal modern)
 *
 * Cara pakai (di app.js):
 *   import { mountFloatingAd } from './gif-ads.js?v=41';
 *   mountFloatingAd();
 */

/* =========================================================
   KONFIGURASI — EDIT DI SINI
   ========================================================= */
const FLOATING_CFG = {
  /* ➜ GANTI dengan link offer / CPA kamu nanti.
     (Sementara masih contoh: klik sengaja diabaikan selama
      URL masih mengandung "example.com") */
  CLICK_URL: 'https://app.trcefy.com/click?pid=2&offer_id=576&sub2=u261441&sub5=s1SUBID1HERE',

  /* Daftar desain iklan GIF (folder /ads/) — dipilih RANDOM.
     Semua desain sudah pakai copy Inggris jujur:
     "Enter your email & verify — then wait. Good luck!" */
  ADS: [
    { src: '/ads/float-paypal-claim.gif',   label: 'PayPal Bonus Event' },
    { src: '/ads/float-gift-giveaway.gif',  label: 'Giveaway Prize' },
    { src: '/ads/float-coin-rain.gif',      label: 'PayPal Cash Giveaway' },
    { src: '/ads/float-flash-reward.gif',   label: 'Flash Reward' }
  ],

  SHOW_DELAY_MS: 4000,     /* tampil pertama kali setelah 4 detik */
  ROTATE_MS: 25000,        /* ganti desain tiap 25 detik selagi tampil */
  AUTO_CLOSE_MS: 20000,    /* auto-tutup setelah 20 detik (0 = nonaktif) */
  RESPAWN_MS: 45000,       /* setelah di-close, muncul lagi 45 detik */
  SHOW_ON_SAFELINK: true   /* tampilkan juga di halaman safelink */
};


/* =========================================================
   MOUNT FLOATING AD (CENTER)
   ========================================================= */
export function mountFloatingAd() {
  /* Cegah double-mount */
  if (window.__gifFloatAdMounted) return;
  window.__gifFloatAdMounted = true;

  /* Jangan tampil di halaman generator (halaman admin) */
  var pageMode = document.documentElement.getAttribute('data-mode');
  if (pageMode === 'generator') return;

  /* Bisa dimatikan untuk halaman safelink via config */
  if (document.body.classList.contains('is-safelink') &&
      !FLOATING_CFG.SHOW_ON_SAFELINK) {
    return;
  }

  /* Inject CSS sekali */
  injectStyles();

  /* ── Build DOM: backdrop (tengah) → kartu iklan ── */
  var wrap = document.createElement('div');
  wrap.className = 'gif-float-ad';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Sponsored promotion');

  var box = document.createElement('div');
  box.className = 'gif-float-box';

  var adLink = document.createElement('a');
  adLink.className = 'gif-float-link';
  adLink.href = 'javascript:void(0)';
  adLink.setAttribute('rel', 'nofollow sponsored noopener');

  var img = document.createElement('img');
  img.className = 'gif-float-img';
  img.alt = 'Special Offer';
  img.draggable = false;

  adLink.appendChild(img);

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gif-float-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Tutup iklan');

  var chip = document.createElement('span');
  chip.className = 'gif-float-chip';
  chip.innerHTML = '<i class="fa-solid fa-bullhorn"></i> AD';

  box.appendChild(adLink);
  box.appendChild(closeBtn);
  box.appendChild(chip);
  wrap.appendChild(box);
  document.body.appendChild(wrap);

  var currentIdx = -1;
  var autoTimer = null;
  var respawnTimer = null;

  /* ── Pilih desain RANDOM (bukan yang sama dengan sebelumnya) ── */
  function pickRandomAd() {
    var n = FLOATING_CFG.ADS.length;
    if (n <= 1) return 0;

    var idx = Math.floor(Math.random() * n);
    var guard = 0;
    while (idx === currentIdx && guard < 10) {
      idx = Math.floor(Math.random() * n);
      guard++;
    }
    return idx;
  }

  /* ── Tampilkan desain berikutnya (DI TENGAH) ── */
  function showAd(withAnim) {
    clearTimeout(respawnTimer);

    var idx = pickRandomAd();
    currentIdx = idx;

    var ad = FLOATING_CFG.ADS[idx];

    /* Preload dulu agar tidak "flash" kosong */
    var pre = new Image();
    pre.onload = function () {
      img.src = ad.src;
      img.alt = ad.label || 'Special Offer';

      wrap.style.display = 'grid';
      if (withAnim) {
        wrap.classList.remove('show');
        box.classList.remove('pop');
        /* force reflow agar animasi restart */
        void wrap.offsetWidth;
        wrap.classList.add('show');
        box.classList.add('pop');
      } else {
        wrap.classList.add('show');
        box.classList.add('pop');
      }

      document.body.classList.add('gif-ad-lock');

      /* Auto-close agar tidak menutupi konten terlalu lama */
      clearTimeout(autoTimer);
      if (FLOATING_CFG.AUTO_CLOSE_MS > 0) {
        autoTimer = setTimeout(function () {
          hideAd();
          scheduleRespawn();
        }, FLOATING_CFG.AUTO_CLOSE_MS);
      }
    };
    pre.onerror = function () {
      /* GIF gagal load — coba desain lain sekali */
      if (FLOATING_CFG.ADS.length > 1) {
        setTimeout(function () { showAd(false); }, 500);
      }
    };
    pre.src = ad.src;
  }

  function hideAd() {
    clearTimeout(autoTimer);
    wrap.classList.remove('show');
    box.classList.remove('pop');
    document.body.classList.remove('gif-ad-lock');
    /* tunggu animasi keluar sebelum display none */
    setTimeout(function () {
      if (!wrap.classList.contains('show')) {
        wrap.style.display = 'none';
      }
    }, 350);
  }

  function scheduleRespawn() {
    clearTimeout(respawnTimer);
    respawnTimer = setTimeout(function () {
      showAd(true);
    }, FLOATING_CFG.RESPAWN_MS);
  }

  /* ── Klik iklan → buka link offer di tab baru ── */
  adLink.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var url = FLOATING_CFG.CLICK_URL;
    if (!url || url.indexOf('example.com') !== -1) return;
    window.open(url, '_blank', 'noopener');
  });

  /* ── Tombol close → sembunyikan, lalu respawn nanti ── */
  closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    hideAd();
    scheduleRespawn();
  });

  /* ── Klik area gelap (di luar kartu) → tutup ── */
  wrap.addEventListener('click', function (e) {
    if (e.target === wrap) {
      hideAd();
      scheduleRespawn();
    }
  });

  /* ── Tekan ESC → tutup ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wrap.classList.contains('show')) {
      hideAd();
      scheduleRespawn();
    }
  });

  /* ── Rotasi otomatis: desain baru selagi tampil ── */
  if (FLOATING_CFG.ROTATE_MS > 0) {
    setInterval(function () {
      if (wrap.classList.contains('show')) {
        showAd(true);
      }
    }, FLOATING_CFG.ROTATE_MS);
  }

  /* ── Mulai: tampil pertama kali ── */
  setTimeout(function () {
    showAd(true);
  }, FLOATING_CFG.SHOW_DELAY_MS);
}


/* =========================================================
   STYLES — iklan melayang DI TENGAH layar
   (backdrop gelap blur + kartu pop-in modern)
   ========================================================= */
function injectStyles() {
  if (document.getElementById('gif-float-ad-styles')) return;

  var style = document.createElement('style');
  style.id = 'gif-float-ad-styles';

  style.textContent =
    /* backdrop full-screen, kartu diposisikan TENGAH via grid */
    '.gif-float-ad{' +
      'position:fixed;' +
      'inset:0;' +
      'z-index:9990;' +
      'display:grid;' +
      'place-items:center;' +
      'padding:20px;' +
      'background:rgba(4,7,16,.68);' +
      '-webkit-backdrop-filter:blur(7px);' +
      'backdrop-filter:blur(7px);' +
      'opacity:0;' +
      'pointer-events:none;' +
      'transition:opacity .35s ease;' +
    '}' +

    '.gif-float-ad.show{' +
      'opacity:1;' +
      'pointer-events:auto;' +
    '}' +

    /* kunci scroll halaman selama iklan tampil */
    'body.gif-ad-lock{overflow:hidden;}' +

    /* kartu iklan (wrap img + tombol close + chip) */
    '.gif-float-box{' +
      'position:relative;' +
      'width:300px;' +
      'max-width:calc(100vw - 32px);' +
      'filter:drop-shadow(0 24px 60px rgba(0,0,0,.6));' +
    '}' +

    '.gif-float-ad.show .gif-float-box{' +
      'animation:gifFloatPop .5s cubic-bezier(.18,1.35,.32,1) both;' +
    '}' +

    '.gif-float-link{' +
      'display:block;' +
      'position:relative;' +
      'border-radius:18px;' +
      'cursor:pointer;' +
    '}' +

    '.gif-float-link:active{transform:scale(.97);}' +

    /* cincin glow halus di sekeliling kartu (kesan premium) */
    '.gif-float-link::after{' +
      'content:"";' +
      'position:absolute;' +
      'inset:-3px;' +
      'border-radius:21px;' +
      'background:linear-gradient(135deg,rgba(34,211,238,.55),' +
        'rgba(139,92,246,.55),rgba(250,204,21,.55));' +
      'z-index:-1;' +
      'filter:blur(10px);' +
      'opacity:.8;' +
      'animation:gifGlowPulse 2.6s ease-in-out infinite;' +
    '}' +

    '.gif-float-img{' +
      'display:block;' +
      'width:300px;' +
      'max-width:100%;' +
      'height:auto;' +
      'border-radius:18px;' +
      'user-select:none;' +
      '-webkit-user-drag:none;' +
    '}' +

    /* chip "AD" kecil di pojok kiri atas */
    '.gif-float-chip{' +
      'position:absolute;' +
      'left:10px;' +
      'top:-9px;' +
      'padding:2px 8px;' +
      'border-radius:20px;' +
      'background:linear-gradient(135deg,#22d3ee,#38bdf8);' +
      'color:#06202c;' +
      'font:700 9px/14px Inter,-apple-system,sans-serif;' +
      'letter-spacing:.08em;' +
      'box-shadow:0 3px 10px rgba(34,211,238,.4);' +
      'pointer-events:none;' +
      'z-index:5;' +
    '}' +
    '.gif-float-chip i{font-size:8px;margin-right:3px;}' +

    /* tombol close modern di pojok kanan atas kartu */
    '.gif-float-close{' +
      'position:absolute;' +
      'top:-12px;' +
      'right:-12px;' +
      'width:34px;' +
      'height:34px;' +
      'padding:0;' +
      'border:2px solid rgba(255,255,255,.3);' +
      'border-radius:50%;' +
      'background:rgba(10,12,20,.94);' +
      'color:#fff;' +
      'font-size:20px;' +
      'line-height:28px;' +
      'cursor:pointer;' +
      'z-index:10;' +
      'transition:transform .15s ease, background .2s ease;' +
      'box-shadow:0 6px 18px rgba(0,0,0,.55);' +
    '}' +
    '.gif-float-close:hover{' +
      'background:#fe2c55;' +
      'transform:rotate(90deg) scale(1.1);' +
    '}' +

    '@keyframes gifFloatPop{' +
      'from{opacity:0;transform:translateY(28px) scale(.82);}' +
      'to{opacity:1;transform:translateY(0) scale(1);}' +
    '}' +

    '@keyframes gifGlowPulse{' +
      '0%,100%{opacity:.55;}' +
      '50%{opacity:.95;}' +
    '}' +

    /* layar kecil: kartu sedikit lebih ringkas */
    '@media(max-width:480px){' +
      '.gif-float-ad{padding:14px;}' +
      '.gif-float-box{width:min(300px,88vw);}' +
      '.gif-float-img{width:100%;}' +
      '.gif-float-close{top:-10px;right:-8px;}' +
    '}' +

    /* hormati preferensi reduce-motion */
    '@media(prefers-reduced-motion:reduce){' +
      '.gif-float-ad.show .gif-float-box{animation:none;}' +
      '.gif-float-link::after{animation:none;}' +
    '}';

  document.head.appendChild(style);
}
