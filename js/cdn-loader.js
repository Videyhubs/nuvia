/**
 * loadVideo — coba memuat video dari daftar upaya dengan strategi bertingkat:
 *
 *  1. Jika ada sourceUrl (format V3) → coba URL tersebut LANGSUNG (prioritas tertinggi)
 *  2. Jika ada cdnKey + cdnPath (format V2) → coba CDN sumber dengan path PENUH
 *  3. Fallback: coba semua CDN dengan filename (segment terakhir)
 *
 * @param {HTMLVideoElement} videoElement
 * @param {object|string} videoInfo — { filename, sourceUrl?, cdnKey?, cdnPath? }
 *        atau string filename (backward compat dengan pemanggilan lama)
 * @param {Array} cdnsArray — daftar CDN { key?, name, base }
 * @param {HTMLElement} statusElement — opsional, untuk update UI status
 * @param {number} timeoutMs — timeout per CDN
 */
export function loadVideo(videoElement, videoInfo, cdnsArray, statusElement, timeoutMs) {
  return new Promise(function(resolve, reject) {
    if (!cdnsArray || cdnsArray.length === 0) {
      reject(new Error('No CDN available'));
      return;
    }

    /* Normalisasi videoInfo —支持 backward compat (string filename lama) */
    var info = videoInfo || {};
    if (typeof videoInfo === 'string') {
      info = { filename: videoInfo };
    }
    var filename = info.filename || '';
    var sourceUrl = info.sourceUrl || '';
    var cdnKey = info.cdnKey || '';
    var cdnPath = info.cdnPath || '';

    if (!filename && !sourceUrl && !cdnPath) {
      reject(new Error('No filename, sourceUrl, or cdnPath provided'));
      return;
    }

    /* Susun urutan upaya */
    var attempts = [];

    /* Prioritas 1: sourceUrl (format V3) — coba URL lengkap langsung */
    if (sourceUrl) {
      /* Cari CDN yang match untuk label status */
      var sourceCdn = null;
      for (var s = 0; s < cdnsArray.length; s++) {
        try {
          var cdnHost = '';
          try { cdnHost = new URL(cdnsArray[s].base).hostname.toLowerCase(); }
          catch (e) { continue; }
          var srcHost = '';
          try { srcHost = new URL(sourceUrl).hostname.toLowerCase(); }
          catch (e) { srcHost = ''; }
          if (srcHost && cdnHost === srcHost) {
            sourceCdn = cdnsArray[s];
            break;
          }
        } catch (e) { /* ignore */ }
      }
      attempts.push({
        cdn: sourceCdn || { name: 'Source' },
        url: sourceUrl,
        label: (sourceCdn ? sourceCdn.name : 'Source') + ' (direct)'
      });
    }

    /* Prioritas 2: cdnKey + cdnPath (format V2) */
    if (cdnKey && cdnPath) {
      for (var i = 0; i < cdnsArray.length; i++) {
        if (cdnsArray[i].key === cdnKey) {
          var cdn = cdnsArray[i];
          var url2 = cdn.base.replace(/\/+$/, '') + '/' + cdnPath.replace(/^\/+/, '');
          attempts.push({
            cdn: cdn,
            url: url2,
            label: cdn.name + ' (source path)'
          });
          break;
        }
      }
    }

    /* Prioritas 3: coba semua CDN dengan filename (fallback) */
    for (var j = 0; j < cdnsArray.length; j++) {
      var cdn3 = cdnsArray[j];
      var url3 = cdn3.base.replace(/\/+$/, '') + '/' + filename.replace(/^\/+/, '');
      attempts.push({
        cdn: cdn3,
        url: url3,
        label: cdn3.name
      });
    }

    /* Hilangkan duplikat URL (bisa terjadi bila sourceUrl = CDN+filename) */
    var seenUrls = {};
    var uniqueAttempts = [];
    for (var d = 0; d < attempts.length; d++) {
      if (!seenUrls[attempts[d].url]) {
        seenUrls[attempts[d].url] = true;
        uniqueAttempts.push(attempts[d]);
      }
    }
    attempts = uniqueAttempts;

    let attemptIndex = 0;
    let currentTimeout = null;
    let onCanPlay = null;
    let onError = null;

    function updateStatus(cdn, state) {
      if (!statusElement) return;
      let dotClass = 'trying';
      if (state === 'fail') dotClass = 'fail';
      if (state === 'ok') dotClass = 'ok';
      statusElement.innerHTML = '<div class="load-status-line"><span class="cdn-dot ' + dotClass + '"></span>' + cdn.name + '</div>';
    }

    function cleanup() {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      if (videoElement) {
        if (onCanPlay) videoElement.removeEventListener('canplay', onCanPlay);
        if (onError) videoElement.removeEventListener('error', onError);
      }
      onCanPlay = null;
      onError = null;
    }

    function tryNext() {
      if (attemptIndex >= attempts.length) {
        cleanup();
        reject(new Error('All CDNs failed (tried ' + attempts.length + ' URLs)'));
        return;
      }

      var attempt = attempts[attemptIndex];
      var cdn = attempt.cdn;
      var url = attempt.url;

      updateStatus(cdn, 'trying');

      onCanPlay = function() {
        cleanup();
        updateStatus(cdn, 'ok');
        resolve(url);
      };

      onError = function() {
        cleanup();
        updateStatus(cdn, 'fail');
        attemptIndex++;
        tryNext();
      };

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('error', onError);

      videoElement.src = url;
      videoElement.load();

      currentTimeout = setTimeout(function() {
        cleanup();
        updateStatus(cdn, 'fail');
        attemptIndex++;
        tryNext();
      }, timeoutMs);
    }

    tryNext();
  });
}
