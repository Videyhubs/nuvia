/* ────────────────────────────────────────────────
   Database Module — Config, Factory, Singleton
   Mendukung: cPanel (MySQL via PHP), JSONBin.io
   ──────────────────────────────────────────────── */

import { JsonBinAdapter } from './jsonbin-adapter.js?v=32';
import { RestApiAdapter } from './rest-adapter.js?v=32';

var _adapter = null;
var _config = null;
var _ready = false;

var CONFIG_FILE = '/db-config.json';
var STORAGE_KEY = 'vgen_db_config';

/* ---- Config Persistence ---- */

function loadLocalConfig() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveLocalConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) { /* ignore */ }
}

/* ---- Adapter Factory ---- */

function createAdapter(config) {
  switch (config.type) {
    case 'cpanel':
    case 'restapi':
      return new RestApiAdapter(config);
    case 'jsonbin':
      return new JsonBinAdapter(config);
    default:
      /* Auto-detect: kalau ada apiUrl, gunakan REST */
      if (config.apiUrl) return new RestApiAdapter(config);
      return new JsonBinAdapter(config);
  }
}

/* ---- Public API ---- */

/**
 * Init database — panggil sekali saat app startup.
 * Priority: db-config.json (online) > localStorage (fallback)
 */
export async function initDb() {
  if (_ready) return;

  /* 1. Coba fetch db-config.json dari server */
  try {
    var res = await fetch(CONFIG_FILE + '?v=11');
    if (res.ok) {
      var config = await res.json();
      if (config && config.type) {
        _config = config;
        _adapter = createAdapter(config);
        _ready = true;
        saveLocalConfig(config);
        console.log('[DB] Config loaded from ' + CONFIG_FILE + ' -> ' + config.type);
        return;
      }
    }
  } catch (e) { /* silent */ }

  /* 2. Fallback ke localStorage */
  var localConfig = loadLocalConfig();
  if (localConfig && localConfig.type) {
    _config = localConfig;
    _adapter = createAdapter(localConfig);
    _ready = true;
    console.log('[DB] Config loaded from localStorage -> ' + localConfig.type);
    return;
  }

  console.log('[DB] No database configured. Shortlink hanya berlaku di browser ini.');
}

/** Get adapter instance (null if not configured) */
export function getDb() {
  return _adapter;
}

/** Whether database is configured and ready */
export function isDbReady() {
  return _ready && !!_adapter;
}

/** Get current config */
export function getDbConfig() {
  return _config;
}

/** Get database type name */
export function getDbName() {
  if (!_adapter) return 'None';
  return _adapter.name || _config.type || 'Unknown';
}

/** Get configured domains list (multi-domain shortlink) */
export function getDomains() {
  if (_config && Array.isArray(_config.domains) && _config.domains.length > 0) {
    return _config.domains;
  }
  return [];
}
