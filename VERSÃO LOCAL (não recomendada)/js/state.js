/**
 * state.js — Pure JavaScript state management with pub/sub + localStorage persistence.
 * Replaces Zustand store (minus the Placar/points system).
 */

// ── Default State Shape ─────────────────────────────────────────────

const DEFAULT_STATE = {
  user: null,          // { id, username, email, role, minecraftName } or null
  token: null,         // JWT token string or null
  currentLocale: 'pt',
  currentView: 'landing',
  soundEnabled: true,
  highContrast: false,
  largeText: false,
  audioDescription: false,
  biomeTheme: 'forest', // 'forest' | 'nether' | 'end'
  selfcareTasks: {},   // { taskKey: boolean }
  selfcareDate: new Date().toISOString().slice(0, 10),
  chatMessages: [],
  friends: [],
  friendRequests: [],
  ventMessages: [],
  quizScore: null,
  quizTotal: null,
  notifications: [],
};

const STORAGE_KEY = 'minecraft-support-app';

// ── Internal State ──────────────────────────────────────────────────

// Deep clone helper (structuredClone not needed — we only deal with plain JSON-safe values)
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Hydrate persisted fields from localStorage on first load
let _state = clone(DEFAULT_STATE);

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    // Merge only the keys that were persisted in the original Zustand store
    const persistedKeys = [
      'user', 'token', 'currentView', 'currentLocale', 'soundEnabled',
      'highContrast', 'largeText', 'audioDescription',
      'biomeTheme', 'selfcareTasks', 'selfcareDate',
    ];
    for (const key of persistedKeys) {
      if (key in saved) {
        _state[key] = saved[key];
      }
    }
  }
} catch (_e) {
  /* ignore corrupt data */
}

// Subscriber maps: key-specific and wildcard
const _subscribers = {};   // { key: [callback, ...] }
const _subscribersAll = []; // [callback, ...]

// ── Persistence ─────────────────────────────────────────────────────

function persist() {
  try {
    const toSave = {
      user: _state.user,
      token: _state.token,
      currentView: _state.currentView,
      soundEnabled: _state.soundEnabled,
      highContrast: _state.highContrast,
      largeText: _state.largeText,
      audioDescription: _state.audioDescription,
      biomeTheme: _state.biomeTheme,
      selfcareTasks: _state.selfcareTasks,
      selfcareDate: _state.selfcareDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (_e) {
    /* quota exceeded or private mode — ignore */
  }
}

// ── Notify Subscribers ──────────────────────────────────────────────

function notify(changedKeys) {
  // Key-specific subscribers
  for (const key of changedKeys) {
    if (_subscribers[key]) {
      for (const cb of _subscribers[key]) {
        try { cb(_state[key], key); } catch (_e) { /* swallow */ }
      }
    }
  }
  // Wildcard subscribers get the full state snapshot + changed keys
  for (const cb of _subscribersAll) {
    try { cb(clone(_state), changedKeys); } catch (_e) { /* swallow */ }
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get the full state object (shallow clone).
 */
export function getState() {
  return clone(_state);
}

/**
 * Get a single state value by key.
 */
export function get(key) {
  return _state[key];
}

/**
 * Set a single key and trigger notifications.
 */
export function set(key, value) {
  _state[key] = value;
  persist();
  notify([key]);
}

/**
 * Merge a partial updates object into state, persist, and notify all changed keys.
 */
export function setState(updates) {
  const changedKeys = Object.keys(updates);
  for (const key of changedKeys) {
    _state[key] = updates[key];
  }
  persist();
  notify(changedKeys);
}

// ── Auth ────────────────────────────────────────────────────────────

export function setAuth(user, token) {
  setState({ user, token });
}

export function logout() {
  setState({ user: null, token: null, currentView: 'landing' });
}

// ── Navigation ──────────────────────────────────────────────────────

export function setView(view) {
  set('currentView', view);
}

// ── Sound ───────────────────────────────────────────────────────────

export function toggleSound() {
  set('soundEnabled', !_state.soundEnabled);
}

// ── Accessibility ───────────────────────────────────────────────────

export function toggleHighContrast() {
  set('highContrast', !_state.highContrast);
}

export function toggleLargeText() {
  set('largeText', !_state.largeText);
}

export function toggleAudioDescription() {
  set('audioDescription', !_state.audioDescription);
}

export function resetAccessibility() {
  setState({
    highContrast: false,
    largeText: false,
    audioDescription: false,
    soundEnabled: true,
  });
}

// ── Biome Theme ─────────────────────────────────────────────────────

export function setBiomeTheme(theme) {
  set('biomeTheme', theme);
}

export function cycleBiomeTheme() {
  const order = ['forest', 'nether', 'end'];
  const idx = order.indexOf(_state.biomeTheme);
  set('biomeTheme', order[(idx + 1) % order.length]);
}

// ── Self-care Checklist ─────────────────────────────────────────────

export function toggleSelfcareTask(key) {
  const today = new Date().toISOString().slice(0, 10);
  if (_state.selfcareDate !== today) {
    // New day — start fresh with just this task checked
    setState({ selfcareTasks: { [key]: true }, selfcareDate: today });
    return;
  }
  const updated = { ..._state.selfcareTasks, [key]: !_state.selfcareTasks[key] };
  set('selfcareTasks', updated);
}

export function resetDailySelfcare() {
  set('selfcareTasks', {});
}

// ── Notifications ───────────────────────────────────────────────────

export function addNotification(notification) {
  const item = {
    ...notification,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    read: false,
  };
  const updated = [item, ..._state.notifications].slice(0, 50);
  set('notifications', updated);
}

export function clearNotification(id) {
  set('notifications', _state.notifications.filter(n => n.id !== id));
}

export function clearAllNotifications() {
  set('notifications', []);
}

export function markNotificationRead(id) {
  const updated = _state.notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  set('notifications', updated);
}

// ── Chat ────────────────────────────────────────────────────────────

export function addChatMessage(msg) {
  set('chatMessages', [..._state.chatMessages, msg]);
}

export function clearChatMessages() {
  set('chatMessages', []);
}

// ── Friends ─────────────────────────────────────────────────────────

export function setFriends(friends) {
  set('friends', friends);
}

export function setFriendRequests(requests) {
  set('friendRequests', requests);
}

// ── Vent Messages ───────────────────────────────────────────────────

export function addVentMessage(msg) {
  set('ventMessages', [..._state.ventMessages, msg]);
}

export function setVentMessages(msgs) {
  set('ventMessages', msgs);
}

// ── Quiz ────────────────────────────────────────────────────────────

export function setQuizResult(score, total) {
  setState({ quizScore: score, quizTotal: total });
}

// ── Pub/Sub ─────────────────────────────────────────────────────────

/**
 * Subscribe to changes on a specific key.
 * @param {string} key
 * @param {(newValue: any, key: string) => void} callback
 */
export function subscribe(key, callback) {
  if (!_subscribers[key]) {
    _subscribers[key] = [];
  }
  _subscribers[key].push(callback);
}

/**
 * Subscribe to ALL state changes.
 * @param {(state: object, changedKeys: string[]) => void} callback
 */
export function subscribeAll(callback) {
  _subscribersAll.push(callback);
}

/**
 * Unsubscribe a callback from a specific key.
 */
export function unsubscribe(key, callback) {
  if (!_subscribers[key]) return;
  _subscribers[key] = _subscribers[key].filter(cb => cb !== callback);
}
