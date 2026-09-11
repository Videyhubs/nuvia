import { decodeKValue, formatTimeAgo, getFilenameFromPath } from './utils.js?v=37';
import { loadVideo } from './cdn-loader.js?v=37';
import { isDbReady, getDb } from './db/index.js?v=37';

/* =========================================================
   CONFIGURATION
   ========================================================= */
const CFG = {
  /* SMARTLINK */
  REDIRECT_URL:
    'https://omg10.com/4/10410353',

  /* 'banner' atau 'button' */
  MONETIZATION_MODE: 'banner',

  /* BUTTON */
  SHOW_SKIP_BTN: false,
  BUTTON_TEXT: 'Click here to watch full video!',

  /* BANNER */
  BANNER: {
    ENABLED: true,
    DELAY: 1500,
    SHOW_CLOSE: true
  },

  /* ADSTERRA */
  ADSTERRA: {
    KEY: '508bcf5f3702d4bd48d225b529385479',
    FORMAT: 'iframe',
    WIDTH: 320,
    HEIGHT: 50,
    PARAMS: {},
    SCRIPT_URL:
      'https://fundingfashioned.com/508bcf5f3702d4bd48d225b529385479/invoke.js'
  },

  /* VIDEO CDN — tambahkan field `key` untuk matching dengan k-value */
  VIDEO_CDNS: [
    { key: 'slicedrive', name: 'Slicedrive', base: 'https://cdn.slicedrive.com' },
    { key: 'videy',      name: 'Videy',      base: 'https://cdn2.videy.co' },
    { key: 'aceimg',     name: 'Aceimg',     base: 'https://cdn.aceimg.com' },
    { key: 'xxfollow',   name: 'Xxfollow',   base: 'https://www.xxxfollow.com' },
    { key: 'xfree',      name: 'Xfree',      base: 'https://cdn.xfree.com' }
  ],

  FALLBACK: 'voDWqx8K1.mp4',
  CDN_TIMEOUT: 5000
};


/* =========================================================
   HELPERS
   ========================================================= */
function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';

  var m = Math.floor(sec / 60);
  var s = Math.floor(sec % 60);

  return m + ':' + String(s).padStart(2, '0');
}

function escapeHTML(str) {
  if (!str) return '';

  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));

  return div.innerHTML;
}


/* =========================================================
   RENDER PLAYER
   ========================================================= */
export function renderPlayer(container, route) {
  document.body.classList.add('is-player');
  document.body.classList.remove('is-feed');

  let btnShown = false;
  let redirectUrl = CFG.REDIRECT_URL;
  let controlsTimer = null;
  let bannerClosed = false;


  /* =========================================================
     PLAYER HTML
     Banner sekarang DI DALAM plr-container.
     ========================================================= */
  container.innerHTML =
    '<div class="plr-page" id="plr-page">' +

      '<div class="plr-player-wrap">' +

        '<div class="plr-container" id="plr-container">' +

          '<div class="plr-vignette"></div>' +

          '<video ' +
            'id="plr-video" ' +
            'autoplay ' +
            'playsinline ' +
            'muted ' +
            'disablePictureInPicture ' +
            'controlsList="nodownload">' +
          '</video>' +

          /* CONTROLS */
          '<div class="plr-controls" id="plr-controls">' +

            '<button class="plr-ctrl-btn" id="plr-btn-pp" title="Play/Pause">' +
              '<i class="fa-solid fa-pause"></i>' +
            '</button>' +

            '<span class="plr-time" id="plr-time">0:00 / 0:00</span>' +

            '<div class="plr-vol-wrap">' +

              '<button class="plr-ctrl-btn" id="plr-btn-vol" title="Mute/Unmute">' +
                '<i class="fa-solid fa-volume-xmark"></i>' +
              '</button>' +

              '<input ' +
                'type="range" ' +
                'class="plr-vol-slider" ' +
                'id="plr-vol-slider" ' +
                'min="0" max="1" step="0.05" value="0">' +

            '</div>' +

            '<button class="plr-ctrl-btn plr-fs-btn" id="plr-fs-btn" title="Fullscreen">' +
              '<i class="fa-solid fa-expand"></i>' +
            '</button>' +

          '</div>' +

          /*
           * MONETIZATION AREA
           * Banner akan diposisikan absolute bottom-center.
           */
          '<div class="plr-monetization-wrap" id="plr-monetization-wrap"></div>' +

          /* SKIP BUTTON MODE */
          '<button class="plr-skip" id="plr-skip">' +
            '<i class="fa-solid fa-play"></i> ' +
            '<span>' + escapeHTML(CFG.BUTTON_TEXT) + '</span>' +
          '</button>' +

        '</div>' +

        /* DOWNLOAD */
        '<a class="plr-download" id="plr-download" href="#">' +

          '<div class="dl-icon">' +
            '<i class="fa-solid fa-arrow-down"></i>' +
          '</div>' +

          '<div class="dl-text">' +
            '<span class="dl-main">Download Video</span>' +
            '<span class="dl-sub">MP4 HD Quality</span>' +
          '</div>' +

          '<div class="dl-arrow">' +
            '<i class="fa-solid fa-chevron-right"></i>' +
          '</div>' +

        '</a>' +

      '</div>' +

      /* RECOMMENDED */
      '<div class="plr-rec-section" id="plr-rec-section">' +

        '<div class="plr-rec-title">' +
          '<i class="fa-solid fa-clapperboard"></i> Recommended Videos' +
        '</div>' +

        '<div class="feed-grid" id="plr-rec-grid">' +
          '<div class="feed-loading-screen">' +
            '<div class="feed-spinner"></div>' +
          '</div>' +
        '</div>' +

      '</div>' +

    '</div>' +

    '<div class="toast" id="toast"></div>';


  /* =========================================================
     ELEMENTS
     ========================================================= */
  const containerEl = document.getElementById('plr-container');
  const videoEl = document.getElementById('plr-video');
  const skipBtn = document.getElementById('plr-skip');
  const controlsEl = document.getElementById('plr-controls');
  const btnPP = document.getElementById('plr-btn-pp');
  const btnVol = document.getElementById('plr-btn-vol');
  const volSlider = document.getElementById('plr-vol-slider');
  const timeDisplay = document.getElementById('plr-time');
  const downloadBtn = document.getElementById('plr-download');
  const monetizationWrap = document.getElementById('plr-monetization-wrap');


  /* =========================================================
     ADD INLINE CSS UNTUK BANNER
     Tidak perlu mengubah file CSS jika kamu belum mau.
     ========================================================= */
  function addBannerStyles() {
    if (document.getElementById('plr-ad-banner-styles')) return;

    var style = document.createElement('style');
    style.id = 'plr-ad-banner-styles';

    style.textContent =
      '.plr-container{position:relative;}' +

      '.plr-monetization-wrap.plr-ad-banner-wrap{' +
        'position:absolute;' +
        'left:50%;' +
        'bottom:12px;' +
        'transform:translateX(-50%);' +
        'width:320px;' +
        'max-width:calc(100% - 20px);' +
        'height:50px;' +
        'z-index:50;' +
      '}' +

      '.plr-ad-banner{' +
        'position:relative;' +
        'width:320px;' +
        'max-width:100%;' +
        'height:50px;' +
        'margin:0 auto;' +
      '}' +

      '.plr-ad-content{' +
        'width:320px;' +
        'height:50px;' +
        'max-width:100%;' +
        'overflow:hidden;' +
      '}' +

      '.plr-ad-label{' +
        'position:absolute;' +
        'left:0;' +
        'top:-12px;' +
        'font-size:8px;' +
        'line-height:10px;' +
        'opacity:.55;' +
        'pointer-events:none;' +
        'z-index:60;' +
      '}' +

      '.plr-ad-close{' +
        'position:absolute;' +
        'top:-9px;' +
        'right:-9px;' +
        'width:22px;' +
        'height:22px;' +
        'padding:0;' +
        'border:0;' +
        'border-radius:50%;' +
        'background:rgba(0,0,0,.85);' +
        'color:#fff;' +
        'font-size:17px;' +
        'line-height:22px;' +
        'cursor:pointer;' +
        'z-index:100;' +
      '}' +

      '@media(max-width:480px){' +
        '.plr-monetization-wrap.plr-ad-banner-wrap{' +
          'bottom:10px;' +
          'max-width:calc(100% - 16px);' +
        '}' +
        '.plr-ad-banner{' +
          'max-width:100%;' +
        '}' +
      '}';

    document.head.appendChild(style);
  }

  addBannerStyles();


  /* =========================================================
     POPUNDER
     ========================================================= */
  (function () {
    var s = document.createElement('script');
    s.dataset.zone = '10918787';
    s.src = 'https://al5sm.com/tag.min.js';
    document.body.appendChild(s);
  })();


  /* =========================================================
     HISTATS
     ========================================================= */
  window._Hasync = window._Hasync || [];
  window._Hasync.push(['Histats.start', '1,4996898,4,0,0,0,00010000']);
  window._Hasync.push(['Histats.fasi', '1']);
  window._Hasync.push(['Histats.track_hits', '']);

  (function () {
    var hs = document.createElement('script');
    hs.type = 'text/javascript';
    hs.async = true;
    hs.src = '//s10.histats.com/js15_as.js';

    (
      document.getElementsByTagName('head')[0] ||
      document.getElementsByTagName('body')[0]
    ).appendChild(hs);
  })();


  /* =========================================================
     DISABLE RIGHT CLICK
     ========================================================= */
  containerEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });


  /* =========================================================
     CONTROLS
     ========================================================= */
  function showControls() {
    controlsEl.classList.add('visible');

    clearTimeout(controlsTimer);

    controlsTimer = setTimeout(hideControls, 3000);
  }

  function hideControls() {
    controlsEl.classList.remove('visible');
  }

  containerEl.addEventListener('mousemove', showControls);

  containerEl.addEventListener(
    'touchstart',
    showControls,
    { passive: true }
  );


  /* =========================================================
     PLAY / PAUSE
     ========================================================= */
  function updatePPIcon() {
    var icon = btnPP.querySelector('i');

    if (videoEl.paused) {
      icon.className = 'fa-solid fa-play';
    } else {
      icon.className = 'fa-solid fa-pause';
    }
  }

  btnPP.addEventListener('click', function (e) {
    e.stopPropagation();

    if (videoEl.paused) {
      videoEl.play().catch(function () {});
    } else {
      videoEl.pause();
    }

    updatePPIcon();
  });

  videoEl.addEventListener('play', updatePPIcon);
  videoEl.addEventListener('pause', updatePPIcon);


  /* =========================================================
     VOLUME
     ========================================================= */
  function updateVolIcon() {
    var icon = btnVol.querySelector('i');

    if (videoEl.muted || videoEl.volume === 0) {
      icon.className = 'fa-solid fa-volume-xmark';
    } else if (videoEl.volume < 0.5) {
      icon.className = 'fa-solid fa-volume-low';
    } else {
      icon.className = 'fa-solid fa-volume-high';
    }
  }

  btnVol.addEventListener('click', function (e) {
    e.stopPropagation();

    videoEl.muted = !videoEl.muted;

    volSlider.value = videoEl.muted
      ? 0
      : videoEl.volume;

    updateVolIcon();
  });

  volSlider.addEventListener('input', function (e) {
    e.stopPropagation();

    videoEl.volume = parseFloat(volSlider.value);
    videoEl.muted = videoEl.volume === 0;

    updateVolIcon();
  });

  volSlider.addEventListener('click', function (e) {
    e.stopPropagation();
  });


  /* =========================================================
     FULLSCREEN
     ========================================================= */
  const fsBtn = document.getElementById('plr-fs-btn');

  function updateFsIcon() {
    if (!fsBtn) return;

    var icon = fsBtn.querySelector('i');

    if (document.fullscreenElement) {
      icon.className = 'fa-solid fa-compress';
    } else {
      icon.className = 'fa-solid fa-expand';
    }
  }

  if (fsBtn) {
    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();

      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerEl.requestFullscreen().catch(function () {});
      }

      updateFsIcon();
    });
  }

  document.addEventListener(
    'fullscreenchange',
    updateFsIcon
  );


  /* =========================================================
     BLOCK SEEKING
     ========================================================= */
  videoEl.addEventListener('seeking', function () {
    if (videoEl._lastSeekable !== undefined) {
      videoEl.currentTime = videoEl._lastSeekable;
    }
  });


  /* =========================================================
     BLOCK PLAYBACK RATE
     ========================================================= */
  videoEl.addEventListener('ratechange', function () {
    if (videoEl.playbackRate !== 1) {
      videoEl.playbackRate = 1;
      videoEl.currentTime = 0;

      if (!videoEl.paused) {
        videoEl.play().catch(function () {});
      }
    }
  });


  /* =========================================================
     BLOCK KEYBOARD SEEK / SPEED
     ========================================================= */
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') {
      return;
    }

    var blockedKeys = [
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      '<',
      '>',
      ',',
      '.'
    ];

    if (blockedKeys.indexOf(e.key) !== -1) {
      e.preventDefault();
      e.stopPropagation();
    }
  });


  /* =========================================================
     TIME DISPLAY
     ========================================================= */
  videoEl.addEventListener('timeupdate', function () {
    videoEl._lastSeekable = videoEl.currentTime;

    timeDisplay.textContent =
      formatTime(videoEl.currentTime) +
      ' / ' +
      formatTime(videoEl.duration);
  });

  videoEl.addEventListener('loadedmetadata', function () {
    timeDisplay.textContent =
      '0:00 / ' +
      formatTime(videoEl.duration);
  });


  /* =========================================================
     SMARTLINK REDIRECT
     ========================================================= */
  function doRedirect() {
    if (!redirectUrl) return;

    window.location.href = redirectUrl;
  }


  /* =========================================================
     BUTTON
     ========================================================= */
  function triggerButton() {
    if (btnShown) return;

    btnShown = true;
    skipBtn.classList.add('visible');
  }


  /* =========================================================
     GET MODE
     ========================================================= */
  function getMonetizationMode() {
    var mode = String(
      CFG.MONETIZATION_MODE || ''
    ).toLowerCase();

    return mode === 'banner'
      ? 'banner'
      : 'button';
  }


  /* =========================================================
     SETUP MONETIZATION
     ========================================================= */
  function setupMonetization() {
    var mode = getMonetizationMode();

    if (mode === 'button') {
      monetizationWrap.style.display = 'none';
      skipBtn.style.display = '';

      if (!CFG.SHOW_SKIP_BTN) {
        skipBtn.style.display = 'none';
        return;
      }

      var btnDelay = 30000 + Math.random() * 10000;

      setTimeout(function () {
        triggerButton();
      }, btnDelay);

      return;
    }

    /* BANNER MODE */
    skipBtn.style.display = 'none';

    if (!CFG.BANNER.ENABLED) return;

    setTimeout(function () {
      if (!bannerClosed) {
        createBanner();
      }
    }, CFG.BANNER.DELAY);
  }


  /* =========================================================
     CREATE BANNER
     ========================================================= */
  function createBanner() {
    if (!monetizationWrap || bannerClosed) return;

    monetizationWrap.innerHTML = '';
    monetizationWrap.className =
      'plr-monetization-wrap plr-ad-banner-wrap';

    var bannerBox = document.createElement('div');
    bannerBox.className = 'plr-ad-banner';

    var adContent = document.createElement('div');
    adContent.className = 'plr-ad-content';

    bannerBox.appendChild(adContent);


    /* CLOSE BUTTON */
    if (CFG.BANNER.SHOW_CLOSE) {
      var closeBtn = document.createElement('button');

      closeBtn.type = 'button';
      closeBtn.className = 'plr-ad-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute(
        'aria-label',
        'Close advertisement'
      );

      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        bannerClosed = true;

        monetizationWrap.style.display = 'none';
        monetizationWrap.innerHTML = '';
      });

      bannerBox.appendChild(closeBtn);
    }

    monetizationWrap.appendChild(bannerBox);
    monetizationWrap.style.display = 'block';

    injectAdsterraBanner(adContent);
  }


  /* =========================================================
     LOAD ORIGINAL ADSTERRA BANNER
     ========================================================= */
  function injectAdsterraBanner(target) {
    if (!target) return;

    try {
      /*
       * Menggunakan scoped/global atOptions sesuai
       * format kode banner asli.
       */
      var optionsScript = document.createElement('script');

      optionsScript.type = 'text/javascript';

      optionsScript.text =
        "var atOptions = {" +
          "'key':'" + CFG.ADSTERRA.KEY + "'," +
          "'format':'" + CFG.ADSTERRA.FORMAT + "'," +
          "'height':" + CFG.ADSTERRA.HEIGHT + "," +
          "'width':" + CFG.ADSTERRA.WIDTH + "," +
          "'params':{}" +
        "};";

      /*
       * Beberapa script iklan membaca atOptions secara global.
       * Simpan juga pada window untuk kompatibilitas.
       */
      window.atOptions = {
        key: CFG.ADSTERRA.KEY,
        format: CFG.ADSTERRA.FORMAT,
        height: CFG.ADSTERRA.HEIGHT,
        width: CFG.ADSTERRA.WIDTH,
        params: CFG.ADSTERRA.PARAMS
      };

      var invokeScript = document.createElement('script');

      invokeScript.type = 'text/javascript';
      invokeScript.src = CFG.ADSTERRA.SCRIPT_URL;

      /*
       * Jangan async agar konfigurasi sudah tersedia
       * sebelum invoke.js dijalankan.
       */
      invokeScript.async = false;

      target.appendChild(optionsScript);
      target.appendChild(invokeScript);

    } catch (err) {
      target.innerHTML = '';
    }
  }


  /* =========================================================
     INITIALIZE MONETIZATION
     ========================================================= */
  setupMonetization();


  /* =========================================================
     DOWNLOAD → SMARTLINK
     ========================================================= */
  downloadBtn.addEventListener('click', function (e) {
    e.preventDefault();
    doRedirect();
  });


  /* =========================================================
     RECOMMENDATIONS
     ========================================================= */
  function loadRecommendations(currentFilename) {
    var recGrid =
      document.getElementById('plr-rec-grid');

    if (!recGrid) return;

    if (!isDbReady()) {
      setTimeout(function () {
        loadRecommendations(currentFilename);
      }, 1000);

      return;
    }

    var db = getDb();

    db.getAllLinks()
      .then(function (allLinks) {
        if (!allLinks || allLinks.length === 0) {
          recGrid.innerHTML = '';
          return;
        }

        var items = [];

        for (var i = 0; i < allLinks.length; i++) {
          var link = allLinks[i];

          if (!link || !link.url) continue;

          var decoded = decodeKValue(link.url);

          if (
            decoded &&
            decoded.filename &&
            decoded.filename !== currentFilename
          ) {
            /* Untuk display filename:
               - V3 (sourceUrl): pakai segment terakhir dari sourceUrl
               - V2 (cdnPath): pakai segment terakhir dari cdnPath
               - V1 (filename): pakai filename langsung */
            var displayFilename = decoded.filename;
            if (decoded.sourceUrl) {
              var fnFromSource = getFilenameFromPath(decoded.sourceUrl.replace(/^https?:\/\/[^/]+\//, ''));
              if (fnFromSource) displayFilename = fnFromSource;
            } else if (decoded.cdnPath) {
              var fnFromPath = getFilenameFromPath(decoded.cdnPath);
              if (fnFromPath) displayFilename = fnFromPath;
            }
            items.push({
              filename: displayFilename,
              kValue: link.url,  /* k-value untuk direct player link */
              sourceUrl: decoded.sourceUrl || '',
              cdnKey: decoded.cdnKey || '',
              cdnPath: decoded.cdnPath || '',
              code: link.code || '',
              clicks: link.clicks || 0,
              created_at: link.created_at || '',
              ext: getExt(displayFilename)
            });
          }
        }

        if (items.length === 0) {
          recGrid.innerHTML = '';
          return;
        }

        items.sort(function (a, b) {
          return b.clicks - a.clicks;
        });

        var show = items.slice(0, 12);
        var html = '';

        for (var j = 0; j < show.length; j++) {
          html += buildRecCard(show[j], j);
        }

        recGrid.innerHTML = html;
        lazyLoadRecThumbnails(recGrid);
      })
      .catch(function () {
        if (recGrid) {
          recGrid.innerHTML = '';
        }
      });
  }


  function buildRecCard(item, index) {
    var titleText =
      item.filename.replace(/\.[^.]+$/, '');

    if (titleText.length > 40) {
      titleText =
        titleText.substring(0, 40) + '...';
    }

    /* Direct player link — recommendations bypass safelink.
       Shortlink (/?vid=) tetap untuk URL yang di-share externally. */
    var href = item.kValue
      ? ('/?k=' + encodeURIComponent(item.kValue))
      : ('/' + escapeHTML(item.code || 'video') + '.' + (item.ext || 'mp4'));

    var ext =
      (item.ext || 'mp4').toUpperCase();

    var badgeClass = 'hd';
    var badgeText = 'HD';

    if (ext !== 'MP4' && ext !== 'MKV') {
      badgeClass = 'tv';
      badgeText = ext;
    }

    var timeStr = item.created_at
      ? formatTimeAgo(
          new Date(item.created_at).getTime()
        )
      : '';

    return (
      '<a href="' + href + '" ' +
        'class="feed-card" ' +
        'data-index="' + index + '" ' +
        'data-code="' + escapeHTML(item.code) + '" ' +
        'data-filename="' + escapeHTML(item.filename) + '" ' +
        'data-source-url="' + escapeHTML(item.sourceUrl || '') + '" ' +
        'data-cdn-key="' + escapeHTML(item.cdnKey || '') + '" ' +
        'data-cdn-path="' + escapeHTML(item.cdnPath || '') + '">' +

        '<div class="feed-card-thumb" ' +
          'data-filename="' +
          escapeHTML(item.filename) +
          '" ' +
          'data-source-url="' + escapeHTML(item.sourceUrl || '') + '" ' +
          'data-cdn-key="' + escapeHTML(item.cdnKey || '') + '" ' +
          'data-cdn-path="' + escapeHTML(item.cdnPath || '') + '">' +
          '<i class="fa-solid fa-film"></i>' +
        '</div>' +

        '<div class="feed-card-play">' +
          '<i class="fa-solid fa-play"></i>' +
        '</div>' +

        '<span class="feed-card-badge ' +
          badgeClass +
          '">' +
          badgeText +
        '</span>' +

        '<div class="feed-card-overlay">' +
          '<div class="feed-card-title">' +
            escapeHTML(titleText) +
          '</div>' +

          '<div class="feed-card-meta">' +
            '<i class="fa-solid fa-star"></i> ' +
            formatCount(item.clicks) +
            '<span class="meta-sep"></span>' +
            (timeStr || ext) +
          '</div>' +
        '</div>' +

      '</a>'
    );
  }


  /* =========================================================
     LAZY LOAD THUMBNAILS
     ========================================================= */
  function lazyLoadRecThumbnails(recContainer) {
    var cards =
      recContainer.querySelectorAll(
        '.feed-card[data-filename]'
      );

    if (!cards.length) return;

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var card = entry.target;

          obs.unobserve(card);

          loadRecCardThumbnail(card);
        });
      },
      {
        rootMargin: '300px'
      }
    );

    cards.forEach(function (card) {
      obs.observe(card);
    });
  }


  function loadRecCardThumbnail(card) {
    var thumbEl =
      card.querySelector('.feed-card-thumb');

    if (
      !thumbEl ||
      thumbEl.classList.contains('thumb-loaded')
    ) {
      return;
    }

    var filename =
      card.getAttribute('data-filename');
    var sourceUrl =
      card.getAttribute('data-source-url') || '';
    var cdnKey =
      card.getAttribute('data-cdn-key') || '';
    var cdnPath =
      card.getAttribute('data-cdn-path') || '';

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
      for (var k = 0; k < CFG.VIDEO_CDNS.length; k++) {
        if (CFG.VIDEO_CDNS[k].key === cdnKey) {
          var url2 = CFG.VIDEO_CDNS[k].base.replace(/\/+$/, '') + '/' + cdnPath.replace(/^\/+/, '');
          attempts.push({ url: url2 });
          break;
        }
      }
    }
    for (var m = 0; m < CFG.VIDEO_CDNS.length; m++) {
      var url3 = CFG.VIDEO_CDNS[m].base.replace(/\/+$/, '') + '/' + filename.replace(/^\/+/, '');
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
      if (attemptIdx >= attempts.length) {
        return;
      }
      var url = attempts[attemptIdx].url;

      var vid = document.createElement('video');

      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.crossOrigin = 'anonymous';

      var seeked = false;

      vid.addEventListener('loadeddata', function () {
        try {
          vid.currentTime = 1;
        } catch (e) {}
      });

      vid.addEventListener('seeked', function () {
        if (seeked) return;

        seeked = true;

        try {
          var canvas =
            document.createElement('canvas');

          canvas.width =
            vid.videoWidth || 320;

          canvas.height =
            vid.videoHeight || 240;

          var ctx =
            canvas.getContext('2d');

          ctx.drawImage(
            vid,
            0,
            0,
            canvas.width,
            canvas.height
          );

          var dataUrl =
            canvas.toDataURL(
              'image/jpeg',
              0.7
            );

          thumbEl.style.backgroundImage =
            'url(' + dataUrl + ')';

          thumbEl.style.backgroundSize = 'cover';
          thumbEl.style.backgroundPosition = 'center';

          thumbEl.innerHTML = '';

          thumbEl.classList.add('thumb-loaded');

        } catch (e) {
          /* CORS fallback */
          thumbEl.innerHTML = '';
          thumbEl.classList.add('thumb-loaded');
        }

        vid.removeAttribute('src');
        vid.load();
      });

      vid.addEventListener('error', function () {
        attemptIdx++;
        tryNext();
      });

      vid.src = url;
    }

    tryNext();
  }


  /* =========================================================
     HELPERS
     ========================================================= */
  function getExt(filename) {
    if (!filename) return 'mp4';

    var parts = filename.split('.');

    if (parts.length > 1) {
      return parts.pop().toLowerCase();
    }

    return 'mp4';
  }

  function formatCount(n) {
    if (!n) return '0';

    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    }

    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }

    return String(n);
  }


  /* =========================================================
     INIT
     ========================================================= */
  (async function init() {
    const kParam = route.kValue;

    const decoded =
      decodeKValue(kParam) || {};

    let filename =
      decoded.filename;

    /* sourceUrl (format V3 — URL lengkap), cdnKey+cdnPath (format V2) */
    var sourceUrl = decoded.sourceUrl || '';
    var cdnKey = decoded.cdnKey || '';
    var cdnPath = decoded.cdnPath || '';

    if (!filename) {
      /* Jika ada sourceUrl, ekstrak filename dari sana */
      if (sourceUrl) {
        try {
          var u = new URL(sourceUrl);
          var parts = u.pathname.split('/').filter(Boolean);
          if (parts.length > 0) {
            filename = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
          }
        } catch (e) { /* ignore */ }
      }
      if (!filename) filename = CFG.FALLBACK;
    }

    /* Jika ada cdnPath, pastikan filename display = segment terakhir */
    if (!sourceUrl && cdnPath) {
      var fnFromPath = getFilenameFromPath(cdnPath);
      if (fnFromPath) filename = fnFromPath;
    }


    /* BUTTON CLICK */
    skipBtn.addEventListener(
      'click',
      function (e) {
        e.stopPropagation();
        doRedirect();
      }
    );


    /* VIDEO ENDED → SMARTLINK */
    videoEl.addEventListener(
      'ended',
      function () {
        doRedirect();
      }
    );


    /* LOAD RECOMMENDATIONS */
    loadRecommendations(filename);


    /* LOAD VIDEO - prioritas: sourceUrl > cdnKey+cdnPath > filename fallback */
    try {
      var videoInfo = {
        filename: filename,
        sourceUrl: sourceUrl,
        cdnKey: cdnKey,
        cdnPath: cdnPath
      };
      await loadVideo(
        videoEl,
        videoInfo,
        CFG.VIDEO_CDNS,
        null,
        CFG.CDN_TIMEOUT
      );
    } catch (err) {
      setTimeout(doRedirect, 3000);
      return;
    }

  })();
}
