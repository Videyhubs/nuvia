/* Cache hasil geo check supaya tidak fetch berulang kali */
var _geoCache = null;

async function checkCountry() {
  if (_geoCache !== null) return _geoCache;
  try {
    const res = await fetch('https://ipinfo.io/json');
    if (!res.ok) return '';
    const data = await res.json();
    _geoCache = data.country || '';
    return _geoCache;
  } catch {
    return '';
  }
}

export async function checkVietnam() {
  const c = await checkCountry();
  return c === 'VN';
}

export async function checkIndonesia() {
  const c = await checkCountry();
  return c === 'ID';
}

export function isMobile() {
  if (window.innerWidth <= 768) return true;
  const ua = navigator.userAgent || navigator.vendor || '';
  const patterns = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return patterns.test(ua);
}