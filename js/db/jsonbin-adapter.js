/* ────────────────────────────────────────────────
   JSONBin.io Adapter
   Free: 10K requests/month, 3 bins
   Signup: https://jsonbin.io
   ──────────────────────────────────────────────── */

export class JsonBinAdapter {
  constructor(config) {
    this.apiKey = config.jsonbinApiKey || '';
    this.binId = config.jsonbinBinId || '';
    this.baseUrl = 'https://api.jsonbin.io/v3';
    this.name = 'JSONBin.io';
  }

  /* ---- Internal: read / write entire bin ---- */
  async readBin() {
    if (!this.binId) {
      return this.createBin();
    }
    const res = await fetch(this.baseUrl + '/b/' + this.binId + '/latest', {
      headers: {
        'X-Master-Key': this.apiKey,
        'X-Bin-Meta': 'false'
      }
    });
    if (!res.ok) {
      if (res.status === 404) return this.createBin();
      throw new Error('JSONBin read error: ' + res.status);
    }
    const data = await res.json();
    if (data && typeof data === 'object' && data.links) return data;
    if (data && typeof data === 'object' && data.record && data.record.links) return data.record;
    return { links: [] };
  }

  async createBin() {
    const res = await fetch(this.baseUrl + '/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': this.apiKey,
        'X-Bin-Private': 'true',
        'X-Bin-Name': 'vgen-links'
      },
      body: JSON.stringify({ links: [] })
    });
    if (!res.ok) throw new Error('JSONBin create error: ' + res.status);
    const result = await res.json();
    this.binId = result.metadata ? result.metadata.id : (result.id || '');
    this.saveBinId();
    return { links: [] };
  }

  async writeBin(data) {
    if (!this.binId) await this.createBin();
    const res = await fetch(this.baseUrl + '/b/' + this.binId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': this.apiKey
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('JSONBin write error: ' + res.status);
  }

  saveBinId() {
    try {
      var stored = localStorage.getItem('vgen_db_config');
      var config = stored ? JSON.parse(stored) : {};
      config.jsonbinBinId = this.binId;
      localStorage.setItem('vgen_db_config', JSON.stringify(config));
    } catch (e) { /* ignore */ }
  }

  /* ---- Adapter Interface ---- */

  async testConnection() {
    if (!this.apiKey) return { ok: false, msg: 'API Key belum diisi' };
    try {
      var data = await this.readBin();
      return { ok: !!data, msg: 'Terhubung ke JSONBin.io' };
    } catch (err) {
      return { ok: false, msg: String(err) };
    }
  }

  async getLinkByCode(code) {
    var data = await this.readBin();
    var links = data.links || [];
    for (var i = 0; i < links.length; i++) {
      if (links[i].code === code) return links[i];
    }
    return null;
  }

  async createLink(code, url) {
    var data = await this.readBin();
    if (!data.links) data.links = [];
    var link = {
      code: code,
      url: url,
      clicks: 0,
      created_at: new Date().toISOString()
    };
    data.links.push(link);
    await this.writeBin(data);
    return link;
  }

  async incrementClicks(code) {
    try {
      var data = await this.readBin();
      var links = data.links || [];
      for (var i = 0; i < links.length; i++) {
        if (links[i].code === code) {
          links[i].clicks = (links[i].clicks || 0) + 1;
          break;
        }
      }
      await this.writeBin(data);
    } catch (e) { /* fire-and-forget */ }
  }
}
