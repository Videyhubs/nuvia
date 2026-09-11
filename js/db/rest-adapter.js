/* ────────────────────────────────────────────────
   REST API Adapter (cPanel PHP Proxy)
   Kompatibel dengan api-proxy.php
   ──────────────────────────────────────────────── */

export class RestApiAdapter {
  constructor(config) {
    this.apiUrl = (config.apiUrl || config.restApiUrl || '').replace(/\/+$/, '');
    this.apiKey = config.apiKey || '';
    this.name = 'cPanel MySQL';
  }

  async request(body) {
    var headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    var res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return await res.json();
  }

  async testConnection() {
    if (!this.apiUrl) return { ok: false, msg: 'API URL belum diisi' };
    try {
      var data = await this.request({ action: 'ping' });
      return { ok: data.ok !== false, msg: data.msg || 'Terhubung ke API' };
    } catch (err) {
      return { ok: false, msg: String(err) };
    }
  }

  async getLinkByCode(code) {
    var data = await this.request({ action: 'get_link', code: code });
    return data.link || null;
  }

  async getRandomLink() {
    var data = await this.request({ action: 'get_random_link' });
    return data.link || null;
  }

  async getAllLinks() {
    var data = await this.request({ action: 'get_all_links' });
    return data.links || [];
  }

  async getStats() {
    var data = await this.request({ action: 'stats' });
    return data;
  }

  async createLink(code, url, playerUrl, shortUrl) {
    var data = await this.request({
      action: 'create_link',
      code: code,
      url: url,
      player_url: playerUrl || '',
      short_url: shortUrl || ''
    });
    var link = data.link || { code: code, url: url, player_url: playerUrl, short_url: shortUrl, clicks: 0, created_at: new Date().toISOString() };
    if (data.duplicate) link.duplicate = true;
    return link;
  }

  async incrementClicks(code) {
    try {
      await this.request({ action: 'increment_clicks', code: code });
    } catch (e) { /* fire-and-forget */ }
  }

  async deleteLink(code) {
    var data = await this.request({ action: 'delete_link', code: code });
    return data;
  }

  async clearAllLinks() {
    var data = await this.request({ action: 'clear_all_links' });
    return data;
  }
}