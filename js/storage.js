const STORAGE_KEY = 'vgen_history';
const SHORT_MAP_KEY = 'vgen_shortmap';
const MAX_ITEMS = 30;
const MAX_SHORTS = 200;

const History = {
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  },

  add(realFilename, shortUrl, playerUrl) {
    const items = this.getAll();
    const filtered = items.filter(function(item) {
      return item.filename !== realFilename;
    });
    filtered.unshift({
      filename: realFilename,
      shortId: shortUrl,
      playerUrl: playerUrl,
      createdAt: Date.now()
    });
    const trimmed = filtered.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  },

  remove(index) {
    const items = this.getAll();
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/* Mapping random short ID → k-value (untuk shortlink pendek) */
const ShortStore = {
  get(id) {
    try {
      const map = JSON.parse(localStorage.getItem(SHORT_MAP_KEY) || '{}');
      return map[id] || null;
    } catch {
      return null;
    }
  },

  set(id, kValue) {
    try {
      const map = JSON.parse(localStorage.getItem(SHORT_MAP_KEY) || '{}');
      map[id] = kValue;
      /* Batasi jumlah entry agar localStorage tidak penuh */
      const keys = Object.keys(map);
      if (keys.length > MAX_SHORTS) {
        /* Hapus entry paling lama (first keys) */
        var toDelete = keys.length - MAX_SHORTS;
        for (var i = 0; i < toDelete; i++) {
          delete map[keys[i]];
        }
      }
      localStorage.setItem(SHORT_MAP_KEY, JSON.stringify(map));
    } catch (e) {
      /* localStorage penuh, coba hapus setengah entry lama */
      try {
        const map = JSON.parse(localStorage.getItem(SHORT_MAP_KEY) || '{}');
        const keys = Object.keys(map);
        var half = Math.floor(keys.length / 2);
        for (var i = 0; i < half; i++) {
          delete map[keys[i]];
        }
        map[id] = kValue;
        localStorage.setItem(SHORT_MAP_KEY, JSON.stringify(map));
      } catch (e2) { /* gagal total, abaikan */ }
    }
  }
};

export default History;
export { ShortStore };
