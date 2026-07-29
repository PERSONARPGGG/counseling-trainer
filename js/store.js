import { CONFIG } from './config.js';
import { calcWeightedTotal } from './utils/helpers.js';

const KEYS = {
  PROFILE: 'counselor_profile',
  SCENARIOS: 'scenarios',
  SESSIONS: 'sessions',
  CLIENTS: 'clients',
  PENDING: 'pending_session',
  SETTINGS: 'simulator_settings'
};

const MAX_SESSIONS = 50;

const SESSION_SCHEMA = {
  id: 'string', client_id: 'string', difficulty: 'string',
  session_number: 'number', date: 'string', duration_minutes: 'number',
  turns_completed: 'number', total_turns: 'number',
  scores: 'object', weighted_total: 'number',
  ai_confidence: 'number', highlights: 'object',
  hidden_emotions: 'object', improvements: 'object',
  counselor_notes: 'object', references: 'object',
  keywords: 'object', milestones_achieved: 'object'
};

function validateSession(data) {
  const errors = [];
  Object.keys(SESSION_SCHEMA).forEach(k => {
    if (data[k] === undefined || data[k] === null) {
      if (k === 'weighted_total' && data.scores) {
        data[k] = calcWeightedTotal(data.scores);
      } else if (['references', 'milestones_achieved', 'keywords'].includes(k)) {
        data[k] = data[k] || [];
      } else if (k === 'ai_confidence') {
        data[k] = data[k] || 0;
      } else if (k === 'highlights') {
        data[k] = data[k] || [];
      } else if (k === 'hidden_emotions') {
        data[k] = data[k] || [];
      } else if (k === 'improvements') {
        data[k] = data[k] || [];
      } else if (k === 'counselor_notes') {
        data[k] = data[k] || [];
      }
    }
  });
  return { data, errors };
}

function get(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function set(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
}

export const store = {
  getProfile() {
    return get(KEYS.PROFILE, {
      name: '', orientation: '', experience: '',
      strengths: [], weaknesses: [], confidence: 5,
      level: 1, total_sessions: 0, onboarding_done: false
    });
  },
  saveProfile(p) { return set(KEYS.PROFILE, p); },

  getSettings() {
    const d = store._defaultSettings();
    return { ...d, ...get(KEYS.SETTINGS, {}) };
  },
  _defaultSettings() {
    return {
      ai_mode: false, model: 'qwen/qwen2-7b-instruct:free',
      onboarding_done: false, dark_mode: false, warm_mode: false,
      font_size: 'medium', auto_save: true, sound_enabled: false,
      api_key: ''
    };
  },
  saveSettings(s) { return set(KEYS.SETTINGS, s); },

  getScenarios() { return get(KEYS.SCENARIOS, []); },
  saveScenarios(s) { return set(KEYS.SCENARIOS, s); },

  getSessions() { return get(KEYS.SESSIONS, []); },
  saveSessions(s) {
    if (s.length > MAX_SESSIONS) s = s.slice(-MAX_SESSIONS);
    return set(KEYS.SESSIONS, s);
  },
  addSession(session) {
    const { data } = validateSession(session);
    const list = this.getSessions();
    list.push(data);
    return this.saveSessions(list);
  },
  getSession(id) {
    return this.getSessions().find(s => s.id === id) || null;
  },
  searchSessions(query) {
    const q = query.toLowerCase();
    return this.getSessions().filter(s => {
      return s.date?.includes(q) || s.client_id?.includes(q) || s.difficulty?.includes(q);
    });
  },
  deleteSession(id) {
    const list = this.getSessions().filter(s => s.id !== id);
    return this.saveSessions(list);
  },

  getClients() { return get(KEYS.CLIENTS, []); },
  saveClients(c) { return set(KEYS.CLIENTS, c); },
  updateClient(clientId, data) {
    const list = this.getClients();
    const idx = list.findIndex(c => c.client_id === clientId);
    if (idx > -1) { list[idx] = { ...list[idx], ...data }; }
    else { list.push(data); }
    return this.saveClients(list);
  },
  getClient(clientId) {
    return this.getClients().find(c => c.client_id === clientId) || null;
  },

  getPendingSession() { return get(KEYS.PENDING, null); },
  savePendingSession(s) { return set(KEYS.PENDING, s); },
  clearPendingSession() { localStorage.removeItem(KEYS.PENDING); },

  genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  formatDate(d) {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  },

  getStats() {
    const sessions = this.getSessions();
    const clients = this.getClients();
    const profile = this.getProfile();
    if (!sessions.length) {
      return { totalSessions: 0, avgScore: 0, bestScore: 0, worstScore: 0, totalClients: clients.length, level: profile.level || 1 };
    }
    const scores = sessions.map(s => s.weighted_total || calcWeightedTotal(s.scores));
    return {
      totalSessions: sessions.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      totalClients: clients.length,
      level: profile.level || 1,
      recentTrend: scores.slice(-5)
    };
  },

  exportData() {
    return {
      profile: this.getProfile(),
      settings: this.getSettings(),
      sessions: this.getSessions(),
      clients: this.getClients(),
      exportedAt: new Date().toISOString(),
      version: '1.1'
    };
  },
  importData(data) {
    if (data.profile) this.saveProfile(data.profile);
    if (data.settings) this.saveSettings(data.settings);
    if (data.sessions) this.saveSessions(data.sessions);
    if (data.clients) this.saveClients(data.clients);
  },
  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
  clearSettings() {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.SETTINGS);
  }
};
