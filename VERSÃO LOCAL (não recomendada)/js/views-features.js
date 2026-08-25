/**
 * views-features.js — Feature views for MentalCraft (pure vanilla JS ES Module).
 * Each view exports { render(t), init(t), cleanup() }.
 *
 * Views: achievements, challenges, coping, safetyPlan, resources,
 *         admin, profile, accessibility, leaderboard.
 */

import { get, setState, setView, setAuth } from './state.js';
import { t, tCurrent, getCurrentLocale } from './i18n.js';
import { playClick, playSuccess, playError, playAchievement } from './sound.js';
import { showToast } from './ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function authHeaders() {
  const token = get('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function jsonHeaders() {
  return { ...authHeaders(), 'Content-Type': 'application/json' };
}

function mcFont() {
  return "font-family: var(--mc-font);";
}

function sm() {
  return `font-size: var(--mc-font-size-sm);`;
}

function md() {
  return `font-size: var(--mc-font-size-md);`;
}

function mcStyle(extra = '') {
  return `${mcFont()} ${extra}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ACHIEVEMENTS VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _achData = { achievements: [], allDefs: {} };
let _achLoading = true;
let _achFilter = 'all';
let _achLoadPromise = null;

export const achievementsView = {
  render(t) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-8" id="view-achievements">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>🏆 ${t('achievements.title')}</span>
            <span class="ach-counter" style="${mcFont()} ${sm()} color: var(--mc-gold);">0/0 ${t('achievements.unlocked')}</span>
          </div>
          <p style="${mcStyle(sm())} color: var(--mc-light-gray); margin-bottom: 16px;">
            ${t('achievements.subtitle')}
          </p>
          <div class="mc-xp-bar mb-6">
            <div class="mc-xp-bar-fill" id="ach-progress" style="width: 0%;"></div>
          </div>
          <div class="flex flex-wrap gap-2 mb-6" id="ach-filters"></div>
          <div id="ach-grid">
            <div class="text-center py-8"><span class="animate-pixel-bounce text-2xl">⛏️</span></div>
          </div>
        </div>
      </div>
    `;
  },

  init(t) {
    _achLoading = true;
    _achLoadPromise = fetch('/api/achievements', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        _achData = { achievements: data.achievements || [], allDefs: data.allDefs || {} };
        _achLoading = false;
        _renderAchievements(t);
      })
      .catch(() => {
        _achLoading = false;
        _renderAchievements(t);
      });

    // Pre-render filter buttons (they can show immediately with defaults)
    _renderAchFilters(t);
  },

  cleanup() {
    _achData = { achievements: [], allDefs: {} };
    _achLoading = true;
    _achFilter = 'all';
    _achLoadPromise = null;
  },
};

function _renderAchFilters(t) {
  const container = document.getElementById('ach-filters');
  if (!container) return;
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const filters = [
    { key: 'all', label: t('achievements.total') },
    ...rarityOrder.map(r => ({ key: r, label: t(`achievements.rarity.${r}`) })),
  ];
  container.innerHTML = filters.map(f =>
    `<button class="mc-resource-category-btn ${sm()} ${_achFilter === f.key ? 'active' : ''}" data-ach-filter="${f.key}">
      ${f.label}
    </button>`
  ).join('');
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-ach-filter]');
    if (!btn) return;
    _achFilter = btn.dataset.achFilter;
    playClick();
    _renderAchFilters(t);
    _renderAchievements(t);
  });
}

function _renderAchievements(t) {
  const { achievements, allDefs } = _achData;
  const grid = document.getElementById('ach-grid');
  const counter = document.querySelector('.ach-counter');
  const progressBar = document.getElementById('ach-progress');
  if (!grid) return;

  const unlockedKeys = new Set(achievements.map(a => a.key));
  const allKeys = Object.keys(allDefs);
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  const filteredDefs = _achFilter === 'all'
    ? allDefs
    : Object.fromEntries(Object.entries(allDefs).filter(([, v]) => v.rarity === _achFilter));
  const filteredKeys = Object.keys(filteredDefs);

  // Update counter & progress
  if (counter) counter.textContent = `${achievements.length}/${allKeys.length} ${t('achievements.unlocked')}`;
  if (progressBar) progressBar.style.width = `${allKeys.length > 0 ? (achievements.length / allKeys.length) * 100 : 0}%`;

  if (_achLoading) {
    grid.innerHTML = '<div class="text-center py-8"><span class="animate-pixel-bounce text-2xl">⛏️</span></div>';
    return;
  }

  const sorted = filteredKeys.sort((a, b) => {
    const rDiff = rarityOrder.indexOf(allDefs[a].rarity) - rarityOrder.indexOf(allDefs[b].rarity);
    if (rDiff !== 0) return rDiff;
    const aUnlocked = unlockedKeys.has(a) ? 0 : 1;
    const bUnlocked = unlockedKeys.has(b) ? 0 : 1;
    return aUnlocked - bUnlocked;
  });

  if (sorted.length === 0) {
    grid.innerHTML = `<p style="${mcStyle(sm())} color: var(--mc-stone-gray);" class="text-center py-8">${t('achievements.locked')}</p>`;
    return;
  }

  grid.innerHTML = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">' +
    sorted.map(key => {
      const def = allDefs[key];
      const unlocked = unlockedKeys.has(key);
      const achieved = achievements.find(a => a.key === key);
      const dateStr = achieved ? new Date(achieved.unlockedAt).toLocaleDateString() : '';
      return `
        <div class="mc-achievement-card rarity-${def.rarity} ${unlocked ? '' : 'locked'}">
          <div class="flex items-start gap-3">
            <div class="mc-achievement-icon">${unlocked ? def.icon : '🔒'}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 style="${mcStyle(sm())} color: ${unlocked ? '#fff' : 'var(--mc-stone-gray)'}; text-shadow: 1px 1px 0 #000;">
                  ${def.title}
                </h4>
                <span class="mc-achievement-rarity-badge rarity-${def.rarity}">
                  ${t(`achievements.rarity.${def.rarity}`)}
                </span>
              </div>
              <p style="${mcStyle('font-size: 0.7rem;')} color: var(--mc-light-gray); line-height: 1.5;">
                ${unlocked ? def.desc : t('achievements.locked')}
              </p>
              ${dateStr ? `<p style="${mcStyle('font-size: 0.55rem;')} color: var(--mc-stone-gray); margin-top: 4px;">${dateStr}</p>` : ''}
            </div>
            ${unlocked ? '<span class="text-lg">✓</span>' : ''}
          </div>
        </div>
      `;
    }).join('') + '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CHALLENGES VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _chCompleted = [];
let _chStreak = 0;

export const challengesView = {
  render(t) {
    return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-challenges">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-purple">
          <div class="mc-panel-header flex items-center justify-between">
            <span>⚔️ ${t('challenges.title')}</span>
            <span class="ch-streak-badge mc-streak-fire" style="${mcStyle(sm())} color: var(--mc-gold); display: none;"></span>
          </div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">
            ${t('challenges.subtitle')}
          </p>
          <div id="ch-today-card"></div>
          <div class="mc-pixel-divider-sword my-6"></div>
          <div class="text-center">
            <h4 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">${t('challenges.streak')}</h4>
            <div class="flex justify-center gap-1 my-4" id="ch-streak-dots"></div>
          </div>
          <div class="mc-pixel-divider-heart my-6"></div>
          <h4 class="mb-4" style="${mcStyle(sm())} color: var(--mc-stone-gray);">${t('challenges.history')}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="ch-history"></div>
        </div>
      </div>
    `;
  },

  init(t) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

    // Load saved data
    try {
      const saved = JSON.parse(localStorage.getItem('mc-challenges') || '{}');
      _chCompleted = saved.completed || [];
      let s = 0;
      for (let d = 0; d < 365; d++) {
        const key = `challenge_${dayOfYear - d}`;
        if (_chCompleted.includes(key)) s++;
        else break;
      }
      _chStreak = s;
    } catch { _chCompleted = []; _chStreak = 0; }

    _renderChallenges(t);

    // Event delegation for the challenge complete button
    document.getElementById('view-challenges')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-ch-complete]');
      if (!btn) return;
      const todayKey = `challenge_${dayOfYear}`;
      if (_chCompleted.includes(todayKey)) return;
      _chCompleted = [..._chCompleted, todayKey];
      _chStreak++;
      localStorage.setItem('mc-challenges', JSON.stringify({ completed: _chCompleted }));
      playSuccess();
      showToast(t('challenges.completed'), 'success');
      _renderChallenges(t);
    });
  },

  cleanup() {
    _chCompleted = [];
    _chStreak = 0;
  },
};

function _renderChallenges(t) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const allChallenges = [
    t('challenges.ch1'), t('challenges.ch2'), t('challenges.ch3'),
    t('challenges.ch4'), t('challenges.ch5'), t('challenges.ch6'), t('challenges.ch7'),
  ];
  const todayKey = `challenge_${dayOfYear}`;
  const isCompleted = _chCompleted.includes(todayKey);
  const todayChallenge = allChallenges[dayOfYear % allChallenges.length];

  // Streak badge
  const streakBadge = document.querySelector('.ch-streak-badge');
  if (streakBadge) {
    if (_chStreak > 0) {
      streakBadge.style.display = '';
      streakBadge.textContent = `${_chStreak} ${t('challenges.days')} 🔥`;
    } else {
      streakBadge.style.display = 'none';
    }
  }

  // Today's challenge card
  const todayCard = document.getElementById('ch-today-card');
  if (todayCard) {
    todayCard.innerHTML = `
      <div class="mc-corner-brackets p-6 mb-6 transition-all ${isCompleted ? 'opacity-60' : ''}" style="background: ${isCompleted ? 'var(--mc-bg)' : 'rgba(93,140,62,0.1)'}; border: 2px solid var(--mc-emerald-green);">
        <div class="flex items-start gap-3">
          <div class="text-4xl mc-float-gentle">⚔️</div>
          <div class="flex-1">
            <h3 class="mb-2" style="${mcStyle(md())} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">
              ${isCompleted ? '✅ ' : '🎯 '}${t('challenges.title')}
            </h3>
            <p style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">${todayChallenge}</p>
            ${isCompleted ? `<div class="mt-2 mc-badge-new" style="${mcStyle('font-size: 0.7rem;')}">${t('challenges.xpReward')}</div>` : ''}
          </div>
        </div>
        ${!isCompleted ? `<button data-ch-complete class="mc-btn mc-btn-primary mc-btn-press ${sm()} mt-4 w-full">✅ ${t('challenges.markDone')}</button>` : ''}
      </div>
    `;
  }

  // Streak dots
  const dotsContainer = document.getElementById('ch-streak-dots');
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: 7 }, (_, i) => {
      const active = i < _chStreak;
      return `<div class="w-10 h-10 mc-border flex items-center justify-center text-sm" style="background: ${active ? 'var(--mc-emerald-green)' : 'var(--mc-bg-dark)'}; opacity: ${active ? 1 : 0.3};">${active ? '✓' : '○'}</div>`;
    }).join('');
  }

  // History
  const historyContainer = document.getElementById('ch-history');
  if (historyContainer) {
    historyContainer.innerHTML = allChallenges.map((ch, i) => {
      const chKey = `challenge_${dayOfYear - ((dayOfYear % allChallenges.length) - i + allChallenges.length) % allChallenges.length}`;
      const done = _chCompleted.includes(chKey);
      return `
        <div class="p-3 mc-border-2 text-left ${done ? 'bg-[rgba(93,140,62,0.1)]' : ''}" style="opacity: ${done ? 1 : 0.5};">
          <span class="text-sm mr-2">${done ? '✅' : '⬜'}</span>
          <span style="${mcStyle('font-size: 0.7rem;')} color: var(--mc-light-gray); line-height: 1.6;">${ch}</span>
        </div>
      `;
    }).join('');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. COPING TOOLKIT VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _copingCat = 'all';
let _copingExpanded = null;
let _copingFavs = [];

export const copingView = {
  render(t) {
    return `
      <div class="max-w-4xl mx-auto px-4 py-8" id="view-coping">
        <div class="mc-panel mc-glow-green animate-pixel-slide-up">
          <div class="mc-panel-header">🧰 ${t('coping.title')}</div>
          <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t('coping.subtitle')}
          </p>
          <div class="flex flex-wrap gap-2 mb-6" id="coping-categories"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="coping-cards"></div>
        </div>
      </div>
    `;
  },

  init(t) {
    try {
      _copingFavs = JSON.parse(localStorage.getItem('mc-coping-favorites') || '[]');
    } catch { _copingFavs = []; }
    _copingCat = 'all';
    _copingExpanded = null;

    _renderCoping(t);

    const root = document.getElementById('view-coping');
    root?.addEventListener('click', e => {
      // Category filter button
      const catBtn = e.target.closest('[data-coping-cat]');
      if (catBtn) {
        _copingCat = catBtn.dataset.copingCat;
        _copingExpanded = null;
        playClick();
        _renderCoping(t);
        return;
      }

      // Favorite toggle button
      const favBtn = e.target.closest('[data-coping-fav]');
      if (favBtn) {
        e.stopPropagation();
        const id = favBtn.dataset.copingFav;
        playClick();
        if (_copingFavs.includes(id)) {
          _copingFavs = _copingFavs.filter(f => f !== id);
        } else {
          _copingFavs = [..._copingFavs, id];
        }
        try { localStorage.setItem('mc-coping-favorites', JSON.stringify(_copingFavs)); } catch {}
        _renderCoping(t);
        return;
      }

      // Try breathing button (navigates to breathing view)
      const breathBtn = e.target.closest('[data-coping-breathe]');
      if (breathBtn) {
        e.stopPropagation();
        setView('breathing');
        return;
      }

      // Strategy card click (expand/collapse)
      const card = e.target.closest('[data-coping-card]');
      if (card) {
        const id = card.dataset.copingCard;
        _copingExpanded = _copingExpanded === id ? null : id;
        playClick();
        _renderCoping(t);
        return;
      }
    });
  },

  cleanup() {
    _copingCat = 'all';
    _copingExpanded = null;
    _copingFavs = [];
  },
};

function _getCopingStrategies(t) {
  return [
    { id: 's1', cat: 'breathing', emoji: '🌊', title: t('coping.s1Title'), desc: t('coping.s1Desc'), steps: t('coping.s1Steps') },
    { id: 's2', cat: 'breathing', emoji: '⬜', title: t('coping.s2Title'), desc: t('coping.s2Desc'), steps: t('coping.s2Steps') },
    { id: 's3', cat: 'breathing', emoji: '🕯️', title: t('coping.s3Title'), desc: t('coping.s3Desc'), steps: '' },
    { id: 's4', cat: 'grounding', emoji: '🖐️', title: t('coping.s4Title'), desc: t('coping.s4Desc'), steps: '' },
    { id: 's5', cat: 'grounding', emoji: '👀', title: t('coping.s5Title'), desc: t('coping.s5Desc'), steps: '' },
    { id: 's6', cat: 'positiveThinking', emoji: '🌟', title: t('coping.s6Title'), desc: t('coping.s6Desc'), steps: '' },
    { id: 's7', cat: 'positiveThinking', emoji: '📝', title: t('coping.s7Title'), desc: t('coping.s7Desc'), steps: '' },
    { id: 's8', cat: 'physical', emoji: '🚶', title: t('coping.s8Title'), desc: t('coping.s8Desc'), steps: '' },
    { id: 's9', cat: 'physical', emoji: '🤸', title: t('coping.s9Title'), desc: t('coping.s9Desc'), steps: '' },
    { id: 's10', cat: 'social', emoji: '💬', title: t('coping.s10Title'), desc: t('coping.s10Desc'), steps: '' },
    { id: 's11', cat: 'social', emoji: '🤝', title: t('coping.s11Title'), desc: t('coping.s11Desc'), steps: '' },
    { id: 's12', cat: 'creative', emoji: '🎨', title: t('coping.s12Title'), desc: t('coping.s12Desc'), steps: '' },
  ];
}

function _renderCoping(t) {
  const categories = ['all', 'breathing', 'grounding', 'positiveThinking', 'physical', 'social', 'creative'];
  const catIcons = { all: '🌐', breathing: '🫁', grounding: '🌱', positiveThinking: '💡', physical: '🏃', social: '👥', creative: '🎨' };
  const strategies = _getCopingStrategies(t);
  const showFavorites = _copingCat === 'favorites';
  const displayed = showFavorites
    ? strategies.filter(s => _copingFavs.includes(s.id))
    : (_copingCat === 'all' ? strategies : strategies.filter(s => s.cat === _copingCat));

  // Categories
  const catContainer = document.getElementById('coping-categories');
  if (catContainer) {
    const allCats = [...categories, 'favorites'];
    catContainer.innerHTML = allCats.map(c => {
      const label = c === 'favorites'
        ? `⭐ ${t('coping.favorites')} (${_copingFavs.length})`
        : `${catIcons[c]} ${t(`coping.${c}`)}`;
      return `<button class="mc-coping-category-btn ${_copingCat === c ? 'mc-coping-category-active' : ''}" data-coping-cat="${c}">${label}</button>`;
    }).join('');
  }

  // Cards
  const cardsContainer = document.getElementById('coping-cards');
  if (!cardsContainer) return;

  if (displayed.length === 0) {
    cardsContainer.innerHTML = `
      <div class="mc-empty-state py-8" style="grid-column: 1 / -1;">
        <span class="text-4xl">📖</span>
        <p style="${mcStyle(sm())} color: var(--mc-stone-gray); margin-top: 12px;">${t('coping.noFavorites')}</p>
      </div>
    `;
    return;
  }

  cardsContainer.innerHTML = displayed.map(s => {
    const isFav = _copingFavs.includes(s.id);
    const isExpanded = _copingExpanded === s.id;
    let stepsHtml = '';
    if (isExpanded && s.steps) {
      const stepsArr = s.steps.split('|').map(st => st.trim()).filter(Boolean);
      stepsHtml = `
        <div class="mc-coping-technique animate-pixel-fade-in mt-3">
          <div class="mc-tag-pill mc-tag-pill-green mb-2">${t('coping.steps')}</div>
          ${stepsArr.map(step => `<div class="mc-coping-step">${step}</div>`).join('')}
          ${s.cat === 'breathing' ? `<button data-coping-breathe class="mc-btn mc-btn-primary mt-3 ${sm()}">🫁 ${t('coping.tryNow')}</button>` : ''}
        </div>
      `;
    }
    return `
      <div class="mc-coping-card mc-card-3d" data-coping-card="${s.id}">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl mc-float-item">${s.emoji}</span>
            <div>
              <h4 style="${mcStyle(sm())} color: var(--mc-emerald-green); text-shadow: 1px 1px 0 #000;">${s.title}</h4>
              <p style="${mcStyle('font-size: 0.65rem;')} color: var(--mc-light-gray); margin-top: 4px;">${s.desc}</p>
            </div>
          </div>
          <button data-coping-fav="${s.id}" class="text-lg hover:scale-125 transition-transform" title="${isFav ? t('coping.unfavorite') : t('coping.favorite')}">
            ${isFav ? '⭐' : '☆'}
          </button>
        </div>
        ${stepsHtml}
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SAFETY PLAN VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _spStep = 0;
let _spLoading = true;
let _spSaving = false;
let _spCompleted = false;
let _spWarningSigns = [''];
let _spCopingStrategies = [''];
let _spSupportContacts = [''];
let _spSafePlaces = [''];

export const safetyPlanView = {
  render(t) {
    return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-safety-plan">
        <div id="sp-content">
          <div class="mc-skeleton-block lg mx-auto" style="height: 400px;"></div>
        </div>
      </div>
    `;
  },

  init(t) {
    _spStep = 0;
    _spLoading = true;
    _spSaving = false;
    _spCompleted = false;
    _spWarningSigns = [''];
    _spCopingStrategies = [''];
    _spSupportContacts = [''];
    _spSafePlaces = [''];

    // Load existing plan
    fetch('/api/safety-plan', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data) {
          try {
            const ws = JSON.parse(data.warningSigns || '[]');
            const cs = JSON.parse(data.copingStrategies || '[]');
            const sc = JSON.parse(data.supportContacts || '[]');
            const sp = JSON.parse(data.safePlaces || '[]');
            if (ws.length) _spWarningSigns = ws;
            if (cs.length) _spCopingStrategies = cs;
            if (sc.length) _spSupportContacts = sc;
            if (sp.length) _spSafePlaces = sp;
            _spCompleted = true;
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        _spLoading = false;
        _renderSafetyPlan(t);
      });

    // Event delegation
    const root = document.getElementById('view-safety-plan');
    root?.addEventListener('click', e => {
      // Step navigation
      const stepBtn = e.target.closest('[data-sp-step]');
      if (stepBtn) {
        const dir = stepBtn.dataset.spStep;
        if (dir === 'prev') _spStep = Math.max(0, _spStep - 1);
        else if (dir === 'next') _spStep = _spStep + 1;
        else if (dir === 'edit') _spStep = 1;
        else if (dir.startsWith('goto:')) _spStep = parseInt(dir.split(':')[1]);
        playClick();
        _renderSafetyPlan(t);
        return;
      }

      // Save button
      if (e.target.closest('[data-sp-save]')) {
        _saveSafetyPlan(t);
        return;
      }

      // Add item buttons
      const addBtn = e.target.closest('[data-sp-add]');
      if (addBtn) {
        const fieldIdx = parseInt(addBtn.dataset.spAdd);
        _spAddItem(fieldIdx);
        _renderSafetyPlan(t);
        return;
      }

      // Remove item buttons
      const rmBtn = e.target.closest('[data-sp-remove]');
      if (rmBtn) {
        const [fieldIdx, itemIdx] = rmBtn.dataset.spRemove.split(':').map(Number);
        _spRemoveItem(fieldIdx, itemIdx);
        _renderSafetyPlan(t);
        return;
      }
    });

    // Input change delegation
    root?.addEventListener('input', e => {
      const input = e.target.closest('[data-sp-input]');
      if (!input) return;
      const [fieldIdx, itemIdx] = input.dataset.spInput.split(':').map(Number);
      _spUpdateItem(fieldIdx, itemIdx, input.value);
    });
  },

  cleanup() {
    _spStep = 0;
    _spLoading = true;
    _spSaving = false;
    _spCompleted = false;
    _spWarningSigns = [''];
    _spCopingStrategies = [''];
    _spSupportContacts = [''];
    _spSafePlaces = [''];
  },
};

function _spGetFields() { return [_spWarningSigns, _spCopingStrategies, _spSupportContacts, _spSafePlaces]; }
function _spAddItem(fieldIdx) {
  const fields = _spGetFields();
  fields[fieldIdx].push('');
}
function _spRemoveItem(fieldIdx, itemIdx) {
  const fields = _spGetFields();
  fields[fieldIdx].splice(itemIdx, 1);
  if (fields[fieldIdx].length === 0) fields[fieldIdx].push('');
}
function _spUpdateItem(fieldIdx, itemIdx, val) {
  const fields = _spGetFields();
  fields[fieldIdx][itemIdx] = val;
}

function _spFieldSetters() {
  return [
    v => { _spWarningSigns = v; },
    v => { _spCopingStrategies = v; },
    v => { _spSupportContacts = v; },
    v => { _spSafePlaces = v; },
  ];
}

function _saveSafetyPlan(t) {
  if (_spSaving) return;
  _spSaving = true;
  _renderSafetyPlan(t);

  fetch('/api/safety-plan', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      warningSigns: _spWarningSigns.filter(Boolean),
      copingStrategies: _spCopingStrategies.filter(Boolean),
      supportContacts: _spSupportContacts.filter(Boolean),
      safePlaces: _spSafePlaces.filter(Boolean),
    }),
  })
    .then(r => {
      if (r.ok) {
        showToast(t('safety.saved'), 'success');
        playSuccess();
        _spCompleted = true;
        _spStep = 0;
      } else {
        showToast(t('common.error'), 'error');
        playError();
      }
    })
    .catch(() => {
      showToast(t('common.error'), 'error');
      playError();
    })
    .finally(() => {
      _spSaving = false;
      _renderSafetyPlan(t);
    });
}

function _renderSafetyPlan(t) {
  const container = document.getElementById('sp-content');
  if (!container) return;

  if (_spLoading) {
    container.innerHTML = '<div class="mc-skeleton-block lg mx-auto" style="height: 400px;"></div>';
    return;
  }

  const steps = [
    { title: t('safety.step1Title'), desc: t('safety.step1Desc'), placeholder: t('safety.step1Placeholder'), icon: '⚠️' },
    { title: t('safety.step2Title'), desc: t('safety.step2Desc'), placeholder: t('safety.step2Placeholder'), icon: '🛠️' },
    { title: t('safety.step3Title'), desc: t('safety.step3Desc'), placeholder: t('safety.step3Placeholder'), icon: '👥' },
    { title: t('safety.step4Title'), desc: t('safety.step4Desc'), placeholder: t('safety.step4Placeholder'), icon: '🏠' },
  ];
  const fieldSets = _spGetFields();
  const addLabels = [t('safety.addSign'), t('safety.addContact'), t('safety.addContact'), t('safety.addPlace')];

  // Completed view (read-only)
  if (_spCompleted && _spStep === 0) {
    container.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <div class="mc-safety-plan-complete mc-panel mc-glow-green animate-pixel-fade-in">
          <div class="text-center py-4">
            <div class="text-5xl mb-4">🛡️</div>
            <h3 style="${mcStyle('font-size: var(--mc-font-size-xl);')} color: var(--mc-emerald-green); text-shadow: 2px 2px 0 #000;">
              ${t('safety.completed')}
            </h3>
            <div class="mt-6 mc-section-transition"></div>
            ${steps.map((s, i) => `
              <div class="mc-safety-fieldset mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <span>${s.icon}</span>
                  <h4 style="${mcStyle(sm())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">${s.title}</h4>
                </div>
                <div class="space-y-1">
                  ${fieldSets[i].filter(Boolean).map(item => `
                    <div class="mc-safety-warning-sign">
                      <span style="${mcStyle(sm())} color: var(--mc-light-gray);">${item}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
            <button data-sp-step="edit" class="mc-btn mc-btn-primary mt-4 ${sm()}">✏️ ${t('safety.edit')}</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Wizard / edit view
  const currentStep = steps[_spStep];
  const currentFields = fieldSets[_spStep];

  container.innerHTML = `
    <div class="mc-safety-wizard mc-panel mc-glow-green animate-pixel-slide-up">
      <div class="mc-panel-header">🛡️ ${t('safety.title')}</div>
      <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
        ${t('safety.subtitle')}
      </p>

      <!-- Step indicators -->
      <div class="mc-safety-step-indicator mb-6">
        ${steps.map((s, i) => `
          <div class="flex items-center gap-2">
            <button data-sp-step="goto:${i}" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i === _spStep ? 'mc-border-glow' : ''}" style="background: ${i === _spStep ? 'var(--mc-gold)' : i < _spStep ? 'var(--mc-emerald-green)' : 'var(--mc-stone-gray)'}; color: #fff; text-shadow: 1px 1px 0 #000; ${mcFont()}">
              ${i < _spStep ? '✓' : s.icon}
            </button>
            ${i < steps.length - 1 ? `<div class="h-0.5 w-8" style="background: ${i < _spStep ? 'var(--mc-emerald-green)' : 'var(--mc-stone-gray)'};"></div>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Current step content -->
      <div class="animate-pixel-fade-in" key="${_spStep}">
        <div class="mc-safety-fieldset">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">${currentStep.icon}</span>
            <div>
              <h4 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">${currentStep.title}</h4>
              <p style="${mcStyle('font-size: 0.65rem;')} color: var(--mc-light-gray);">${currentStep.desc}</p>
            </div>
          </div>
          <div class="space-y-2">
            ${currentFields.map((val, idx) => `
              <div class="flex gap-2">
                <input type="text" value="${val.replace(/"/g, '&quot;')}" data-sp-input="${_spStep}:${idx}" placeholder="${currentStep.placeholder} ${idx + 1}" class="mc-input flex-1" style="${mcStyle(sm())}" />
                ${currentFields.length > 1 ? `<button data-sp-remove="${_spStep}:${idx}" class="mc-btn mc-btn-danger py-1 px-2 ${sm()}">✕</button>` : ''}
              </div>
            `).join('')}
            <button data-sp-add="${_spStep}" class="mc-btn mc-btn-stone ${sm()}">+ ${addLabels[_spStep]}</button>
          </div>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex justify-between mt-6">
        <button data-sp-step="prev" class="mc-btn mc-btn-stone ${sm()} ${_spStep === 0 ? 'opacity-50' : ''}" ${_spStep === 0 ? 'disabled' : ''}>
          ← Back
        </button>
        ${_spStep < 3
          ? `<button data-sp-step="next" class="mc-btn mc-btn-primary ${sm()}">${t('common.next')} →</button>`
          : `<button data-sp-save class="mc-btn mc-btn-primary ${sm()}" ${_spSaving ? 'disabled' : ''}>${_spSaving ? '⏳ ...' : '✅ ' + t('safety.save')}</button>`
        }
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. RESOURCES VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _resCat = 'all';

export const resourcesView = {
  render(t) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-8" id="view-resources">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">📚 ${t('resources.title')}</div>
          <p style="${mcStyle(sm())} color: var(--mc-light-gray); margin-bottom: 16px;">
            ${t('resources.subtitle')}
          </p>
          <div class="flex flex-wrap gap-2 mb-6" id="res-categories"></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto" id="res-grid"></div>
        </div>
      </div>
    `;
  },

  init(t) {
    _resCat = 'all';
    _renderResources(t);

    document.getElementById('view-resources')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-res-cat]');
      if (!btn) return;
      _resCat = btn.dataset.resCat;
      playClick();
      _renderResources(t);
    });
  },

  cleanup() {
    _resCat = 'all';
  },
};

function _getResources(t, locale) {
  return [
    { category: 'anxiety', icon: '😰', title: { pt: 'O que é Ansiedade?', en: 'What is Anxiety?', es: '¿Qué es la Ansiedad?', kaingang: 'Hukã?', tupi: 'Hukã?' }, desc: { pt: 'A ansiedade é uma reação natural do corpo ao estresse, mas quando se torna excessiva pode interferir nas atividades diárias.', en: 'Anxiety is a natural body response to stress, but when excessive it can interfere with daily activities.', es: 'La ansiedad es una reacción natural del cuerpo al estrés, pero cuando es excesiva puede interferir con las actividades diarias.', kaingang: 'Hukã teko sã.', tupi: 'Hukã teko sã.' } },
    { category: 'anxiety', icon: '🧘', title: { pt: 'Técnicas de Relaxamento', en: 'Relaxation Techniques', es: 'Técnicas de Relajación', kaingang: 'Teko Sã', tupi: 'Teko Sã' }, desc: { pt: 'Aprenda exercícios de respiração, meditação e relaxamento muscular progressivo para controlar a ansiedade.', en: 'Learn breathing exercises, meditation, and progressive muscle relaxation to control anxiety.', es: 'Aprenda ejercicios de respiración, meditación y relajación muscular progresiva.', kaingang: 'Teko sã hukã.', tupi: 'Teko sã hukã.' } },
    { category: 'depression', icon: '💙', title: { pt: 'Entendendo a Depressão', en: 'Understanding Depression', es: 'Entendiendo la Depresión', kaingang: 'Jykre', tupi: "Ñe'ẽ" }, desc: { pt: 'A depressão é mais do que tristeza — é uma condição médica que afeta como você se sente, pensa e age.', en: 'Depression is more than sadness — it is a medical condition that affects how you feel, think, and act.', es: 'La depresión es más que tristeza — es una condición médica que afecta cómo te sientes, piensas y actúas.', kaingang: 'Jykre teko.', tupi: "Ñe'ẽ teko." } },
    { category: 'depression', icon: '🤝', title: { pt: 'Quando Procurar Ajuda', en: 'When to Seek Help', es: 'Cuándo Buscar Ayuda', kaingang: 'Irũ', tupi: 'Irũ' }, desc: { pt: 'Sinais de que você precisa de ajuda profissional e como dar o primeiro passo.', en: 'Signs that you need professional help and how to take the first step.', es: 'Señales de que necesitas ayuda profesional y cómo dar el primer paso.', kaingang: 'Irũ jykre.', tupi: 'Irũ ñe\'ẽ.' } },
    { category: 'bullying', icon: '🛡️', title: { pt: 'Tipos de Bullying', en: 'Types of Bullying', es: 'Tipos de Acoso', kaingang: 'Kyry', tupi: 'Kyry' }, desc: { pt: 'Conheça os diferentes tipos de bullying: verbal, físico, social e cibernético. Saiba identificar e reagir.', en: 'Learn the different types of bullying: verbal, physical, social, and cyber. Know how to identify and react.', es: 'Conozca los diferentes tipos de acoso: verbal, físico, social y cibernético.', kaingang: 'Kyry hukã.', tupi: 'Kyry hukã.' } },
    { category: 'bullying', icon: '📋', title: { pt: 'Como Denunciar', en: 'How to Report', es: 'Cómo Denunciar', kaingang: 'Kanjuk', tupi: 'Kanjuk' }, desc: { pt: 'Guia passo a passo de como denunciar situações de bullying na escola e online.', en: 'Step-by-step guide on how to report bullying situations at school and online.', es: 'Guía paso a paso de cómo denunciar situaciones de acoso escolar y en línea.', kaingang: 'Kanjuk kyry.', tupi: 'Kanjuk kyry.' } },
    { category: 'selfesteem', icon: '🌟', title: { pt: 'Construindo Autoestima', en: 'Building Self-Esteem', es: 'Construyendo Autoestima', kaingang: 'Teko', tupi: 'Teko' }, desc: { pt: 'A autoestima é como você se vê e se valoriza. Aqui estão dicas para fortalecê-la.', en: 'Self-esteem is how you see and value yourself. Here are tips to strengthen it.', es: 'La autoestima es cómo te ves y te valoras. Aquí hay consejos para fortalecerla.', kaingang: 'Teko sã.', tupi: 'Teko sã.' } },
    { category: 'sleep', icon: '😴', title: { pt: 'Higiene do Sono', en: 'Sleep Hygiene', es: 'Higiene del Sueño', kaingang: 'Kũí', tupi: 'Ker' }, desc: { pt: 'Dicas para melhorar a qualidade do sono: rotina, ambiente, e hábitos que fazem diferença.', en: 'Tips to improve sleep quality: routine, environment, and habits that make a difference.', es: 'Consejos para mejorar la calidad del sueño: rutina, ambiente y hábitos.', kaingang: 'Kũí teko sã.', tupi: 'Ker teko sã.' } },
    { category: 'stress', icon: '🔥', title: { pt: 'Gerenciamento de Estresse', en: 'Stress Management', es: 'Manejo del Estrés', kaingang: 'Hukã', tupi: 'Hukã' }, desc: { pt: 'O estresse faz parte da vida, mas o estresse crônico pode prejudicar sua saúde. Aprenda a gerenciar.', en: 'Stress is part of life, but chronic stress can harm your health. Learn to manage it.', es: 'El estrés es parte de la vida, pero el estrés crónico puede dañar tu salud.', kaingang: 'Hukã teko.', tupi: 'Hukã teko.' } },
  ];
}

function _renderResources(t) {
  const locale = getCurrentLocale();
  const categories = ['all', 'anxiety', 'depression', 'bullying', 'selfesteem', 'sleep', 'stress'];
  const resources = _getResources(t, locale);
  const filtered = _resCat === 'all' ? resources : resources.filter(r => r.category === _resCat);

  // Categories
  const catContainer = document.getElementById('res-categories');
  if (catContainer) {
    catContainer.innerHTML = categories.map(cat => {
      const label = cat === 'all'
        ? `📖 ${t('resources.title').split(' ').slice(-1)[0]}`
        : t(`resources.category.${cat}`);
      return `<button class="mc-resource-category-btn ${sm()} ${_resCat === cat ? 'active' : ''}" data-res-cat="${cat}">${label}</button>`;
    }).join('');
  }

  // Grid
  const grid = document.getElementById('res-grid');
  if (!grid) return;

  grid.innerHTML = filtered.map(res => {
    const titleObj = res.title;
    const descObj = res.desc;
    const titleText = (titleObj[locale] || titleObj.pt);
    const descText = (descObj[locale] || descObj.pt);
    return `
      <div class="mc-resource-card stagger-children">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 flex items-center justify-center text-xl mc-border-2" style="background: var(--mc-bg-light);">
            ${res.icon}
          </div>
          <h3 style="${mcStyle(sm())} color: var(--mc-diamond-blue); text-shadow: 1px 1px 0 #000; line-height: 1.3;">
            ${titleText}
          </h3>
        </div>
        <p style="${mcStyle('font-size: 0.7rem;')} color: var(--mc-light-gray); line-height: 1.7;">${descText}</p>
        <div class="mt-3 flex items-center justify-between">
          <span class="mc-achievement-rarity-badge rarity-uncommon">${t(`resources.category.${res.category}`)}</span>
          <span style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-emerald-green);">${t('resources.readMore')} →</span>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. ADMIN VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _adminTab = 'main'; // 'main' | 'reports' | 'users' | 'messages'
let _adminReports = [];
let _adminUsers = [];
let _adminMessages = [];
let _adminLoading = true;
let _adminNotes = {};

export const adminView = {
  render(t) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-8" id="view-admin">
        <div id="admin-content"></div>
      </div>
    `;
  },

  init(t) {
    _adminTab = 'main';
    _adminReports = [];
    _adminUsers = [];
    _adminMessages = [];
    _adminLoading = true;
    _adminNotes = {};

    _renderAdmin(t);

    const root = document.getElementById('view-admin');
    root?.addEventListener('click', e => {
      // Tab navigation
      const tabBtn = e.target.closest('[data-admin-tab]');
      if (tabBtn) {
        _adminTab = tabBtn.dataset.adminTab;
        playClick();
        _loadAdminData(t);
        return;
      }

      // Back button
      if (e.target.closest('[data-admin-back]')) {
        _adminTab = 'main';
        playClick();
        _renderAdmin(t);
        return;
      }

      // Ban/unban user
      const userBtn = e.target.closest('[data-admin-user]');
      if (userBtn) {
        const [userId, action] = userBtn.dataset.adminUser.split(':');
        _handleAdminUser(userId, action, t);
        return;
      }

      // Resolve/review report
      const reportBtn = e.target.closest('[data-admin-report]');
      if (reportBtn) {
        const [reportId, action] = reportBtn.dataset.adminReport.split(':');
        _handleAdminReport(reportId, action, t);
        return;
      }
    });

    // Admin notes input
    root?.addEventListener('input', e => {
      if (e.target.matches('[data-admin-note]')) {
        _adminNotes[e.target.dataset.adminNote] = e.target.value;
      }
    });
  },

  cleanup() {
    _adminTab = 'main';
    _adminReports = [];
    _adminUsers = [];
    _adminMessages = [];
    _adminLoading = true;
    _adminNotes = {};
  },
};

function _loadAdminData(t) {
  _adminLoading = true;
  _renderAdmin(t);

  if (_adminTab === 'reports') {
    fetch('/api/admin/reports', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { _adminReports = data || []; })
      .catch(() => {})
      .finally(() => { _adminLoading = false; _renderAdmin(t); });
  } else if (_adminTab === 'users') {
    fetch('/api/admin/users', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { _adminUsers = data || []; })
      .catch(() => {})
      .finally(() => { _adminLoading = false; _renderAdmin(t); });
  } else if (_adminTab === 'messages') {
    fetch('/api/vent', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { _adminMessages = Array.isArray(data.messages) ? data.messages : []; })
      .catch(() => {})
      .finally(() => { _adminLoading = false; _renderAdmin(t); });
  } else {
    _adminLoading = false;
    _renderAdmin(t);
  }
}

function _handleAdminUser(userId, action, t) {
  fetch('/api/admin/users', {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ userId, action }),
  })
    .then(r => {
      if (r.ok) {
        showToast(action === 'ban' ? t('admin.userBanned') : t('admin.userUnbanned'), 'success');
        _adminUsers = _adminUsers.map(u => u.id === userId ? { ...u, role: action === 'ban' ? 'banned' : 'user' } : u);
        _renderAdmin(t);
      }
    })
    .catch(() => {});
}

function _handleAdminReport(reportId, action, t) {
  fetch('/api/admin/reports', {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ reportId, action, adminNotes: _adminNotes[reportId] || undefined }),
  })
    .then(r => {
      if (r.ok) {
        showToast(t('admin.actionDone'), 'success');
        _adminReports = _adminReports.map(r => r.id === reportId ? { ...r, status: action === 'resolve' ? 'resolved' : 'reviewed' } : r);
        _renderAdmin(t);
      }
    })
    .catch(() => {});
}

function _renderAdmin(t) {
  const container = document.getElementById('admin-content');
  if (!container) return;

  if (_adminTab === 'main') {
    container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header">🛡️ ${t('admin.panelTitle')}</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 stagger-children">
          <button data-admin-tab="reports" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-netherrack">
            <div class="text-4xl mb-2">🚩</div>
            <h3 style="${mcStyle(md())} color: var(--mc-redstone-red); text-shadow: 2px 2px 0 #000;">${t('admin.reportsTitle')}</h3>
          </button>
          <button data-admin-tab="users" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-stone">
            <div class="text-4xl mb-2">👥</div>
            <h3 style="${mcStyle(md())} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">${t('admin.usersTitle')}</h3>
          </button>
          <button data-admin-tab="messages" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-water">
            <div class="text-4xl mb-2">💬</div>
            <h3 style="${mcStyle(md())} color: var(--mc-sand); text-shadow: 2px 2px 0 #000;">${t('admin.messagesTitle')}</h3>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Loading skeleton
  if (_adminLoading) {
    container.innerHTML = `<div class="mc-panel animate-pixel-slide-up"><div class="mc-skeleton h-20"></div></div>`;
    return;
  }

  // Reports tab
  if (_adminTab === 'reports') {
    container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>🚩 ${t('admin.reportsTitle')}</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t('admin.back')}</button>
        </div>
        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          ${_adminReports.length === 0
            ? `<p style="${mcStyle(sm())} color: var(--mc-stone-gray);" class="text-center py-8">${t('admin.noReports')}</p>`
            : _adminReports.map(r => {
              const statusColor = r.status === 'resolved' ? 'var(--mc-emerald-green)' : r.status === 'reviewed' ? 'var(--mc-gold)' : 'var(--mc-redstone-red)';
              return `
                <div class="mc-border-2 p-4 ${r.status === 'resolved' ? 'opacity-50' : ''}" style="background: var(--mc-bg);">
                  <div class="flex items-center justify-between mb-2">
                    <span style="${mcStyle(sm())} color: var(--mc-gold);">${t('admin.by')} ${r.reporter?.username || t('admin.unknown')}</span>
                    <span class="px-2 py-0.5 ${sm()}" style="background: ${statusColor}; color: #000;">${r.status}</span>
                  </div>
                  <p style="${mcStyle(sm())} color: var(--mc-light-gray);">${r.reason}</p>
                  ${r.adminNotes ? `<p class="mt-1 ${sm()}" style="color: var(--mc-ender-purple);">📝 ${r.adminNotes}</p>` : ''}
                  <div class="flex gap-2 mt-3">
                    <input class="mc-input flex-1" placeholder="${t('admin.adminNotes')}" value="${_adminNotes[r.id] || ''}" data-admin-note="${r.id}" />
                    ${r.status === 'pending' ? `
                      <button data-admin-report="${r.id}:resolve" class="mc-btn mc-btn-primary py-1 px-3 ${sm()}">${t('admin.resolve')}</button>
                      <button data-admin-report="${r.id}:review" class="mc-btn mc-btn-gold py-1 px-3 ${sm()}">${t('admin.review')}</button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;
    return;
  }

  // Users tab
  if (_adminTab === 'users') {
    container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>👥 ${t('admin.usersTitle')} (${_adminUsers.length})</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t('admin.back')}</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full" style="${mcFont()} ${sm()}">
            <thead>
              <tr class="border-b-2 border-black" style="color: var(--mc-gold);">
                <th class="p-2 text-left">${t('admin.usersTitle')}</th>
                <th class="p-2 text-left hidden sm:table-cell">Email</th>
                <th class="p-2 text-left hidden md:table-cell">MC Name</th>
                <th class="p-2 text-center">${t('admin.status')}</th>
                <th class="p-2 text-center">${t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${_adminUsers.map(u => `
                <tr class="border-b border-[#3F3F3F] hover:bg-[rgba(255,255,255,0.05)]">
                  <td class="p-2" style="color: ${u.role === 'banned' ? 'var(--mc-redstone-red)' : 'var(--mc-text)'};">${u.username}</td>
                  <td class="p-2 hidden sm:table-cell" style="color: var(--mc-light-gray);">${u.email}</td>
                  <td class="p-2 hidden md:table-cell" style="color: var(--mc-gold);">${u.minecraftName || '-'}</td>
                  <td class="p-2 text-center">
                    <span class="w-3 h-3 inline-block rounded-full" style="background: ${u.isOnline ? 'var(--mc-emerald-green)' : 'var(--mc-stone-gray)'};"></span>
                  </td>
                  <td class="p-2 text-center">
                    ${u.role === 'banned'
                      ? `<button data-admin-user="${u.id}:unban" class="mc-btn mc-btn-primary py-0.5 px-2 ${sm()}">${t('admin.unban')}</button>`
                      : `<button data-admin-user="${u.id}:ban" class="mc-btn mc-btn-danger py-0.5 px-2 ${sm()}">${t('admin.ban')}</button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // Messages tab
  if (_adminTab === 'messages') {
    container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>💬 ${t('admin.ventMessages')}</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t('admin.back')}</button>
        </div>
        <div class="space-y-2 max-h-[600px] overflow-y-auto">
          ${_adminMessages.map(m => `
            <div class="mc-border-2 p-3 ${m.isModerated ? 'opacity-50' : ''} ${m.isReported ? 'border-[var(--mc-redstone-red)]' : ''}" style="background: var(--mc-bg);">
              <div class="flex items-center justify-between mb-1">
                <span style="${mcStyle(sm())} color: var(--mc-gold);">${m.username}</span>
                <div class="flex items-center gap-2">
                  ${m.isReported ? '<span class="' + sm() + '">🚩</span>' : ''}
                  ${m.isModerated ? `<span class="${sm()}" style="color: var(--mc-redstone-red);">🚫 ${t('admin.moderated')}</span>` : ''}
                  ${m.isAnonymous ? `<span class="${sm()}">🎭</span>` : ''}
                </div>
              </div>
              <p style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.6;">${m.content}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _profEditing = false;
let _profMcName = '';
let _profSaving = false;
let _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };

export const profileView = {
  render(t) {
    const user = get('user');
    if (!user) return '<div></div>';
    const roleColor = user.role === 'admin' ? 'var(--mc-redstone-red)' : 'var(--mc-emerald-green)';
    const roleBadge = user.role === 'admin' ? '🛡️' : '⛏️';

    return `
      <div class="max-w-4xl mx-auto px-4 py-8" id="view-profile">
        <div class="mc-panel animate-pixel-slide-up mc-creeper-bg">
          <div class="mc-panel-header flex items-center justify-between">
            <span>👤 ${t('profile.title')}</span>
            <button data-prof-toggle-edit class="mc-btn mc-btn-stone py-0.5 px-3 ${sm()}">
              ✏️ ${t('profile.editProfile')}
            </button>
          </div>

          <!-- Avatar + Info -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div class="mc-profile-avatar ${user.role === 'admin' ? 'admin-avatar' : ''}">
              ${user.role === 'admin' ? '🛡️' : '🧑‍🌾'}
            </div>
            <div class="flex-1 text-center sm:text-left">
              <h2 style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: #fff; text-shadow: 2px 2px 0 #000;">
                ${user.username}
              </h2>
              <p style="${mcStyle('font-size: 0.8rem;')} color: var(--mc-stone-gray);">${user.email}</p>
              <div class="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                <span style="${mcStyle(sm())} color: ${roleColor}; text-shadow: 1px 1px 0 #000;">
                  ${roleBadge} ${user.role === 'admin' ? t('profile.admin') : t('profile.player')}
                </span>
                ${user.minecraftName ? `<span style="${mcStyle(sm())} color: var(--mc-gold);">⛏️ ${user.minecraftName}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Edit MC Name (hidden by default) -->
          <div id="prof-edit-section" style="display: none;" class="mb-6 p-4 mc-border-2" >
            <label class="block mb-2" style="${mcStyle(sm())} color: var(--mc-light-gray);">
              ${t('profile.changeMcName')}
            </label>
            <div class="flex gap-2">
              <input id="prof-mc-name" class="mc-input flex-1" value="${_profMcName.replace(/"/g, '&quot;')}" placeholder="Steve_Builder" />
              <button data-prof-save-mc class="mc-btn mc-btn-primary ${sm()}">
                <span class="prof-save-text">✅ ${t('profile.save')}</span>
              </button>
            </div>
          </div>

          <div class="mc-section-transition mb-6"></div>

          <!-- Stats Grid -->
          <h3 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000; margin-bottom: 12px;">
            📊 ${t('profile.stats')}
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div class="mc-profile-stat">
              <div class="prof-stat-quiz-count" style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-stone-gray);">📝 Quiz</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-quiz-best" style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">0%</div>
              <div style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-stone-gray);">${t('profile.quizBest')}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-mood-count" style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: var(--mc-emerald-green); text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-stone-gray);">${t('profile.moodEntries')}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-friend-count" style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: #00E5FF; text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-stone-gray);">${t('profile.friends')}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-ach-count" style="${mcStyle('font-size: var(--mc-font-size-2xl);')} color: #FF8C00; text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle('font-size: 0.6rem;')} color: var(--mc-stone-gray);">${t('profile.achievements')}</div>
            </div>
          </div>

          <!-- Mood emoji legend -->
          <div class="flex flex-wrap gap-2 justify-center mb-6">
            ${[
              { emoji: '😊', label: t('mood.happy'), color: '#4CAF50' },
              { emoji: '😢', label: t('mood.sad'), color: '#00E5FF' },
              { emoji: '😰', label: t('mood.anxious'), color: '#FFB300' },
              { emoji: '😠', label: t('mood.angry'), color: '#FF1A1A' },
              { emoji: '😌', label: t('mood.calm'), color: '#3AA93B' },
              { emoji: '😴', label: t('mood.tired'), color: '#9E9E9E' },
            ].map(item => `
              <div class="mc-profile-stat mc-mood-emoji" style="min-width: 70px;">
                <div class="text-2xl mb-1">${item.emoji}</div>
                <div style="${mcStyle('font-size: 0.55rem;')} color: ${item.color}; text-shadow: 1px 1px 0 #000;">${item.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  init(t) {
    const user = get('user');
    _profEditing = false;
    _profMcName = user?.minecraftName || '';
    _profSaving = false;
    _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };

    // Load stats
    const token = get('token');
    if (token) {
      Promise.all([
        fetch('/api/quiz', { headers: authHeaders() }).then(r => r.json()).catch(() => []),
        fetch('/api/mood?days=365', { headers: authHeaders() }).then(r => r.json()).catch(() => []),
        fetch('/api/friends', { headers: authHeaders() }).then(r => r.json()).catch(() => ({ friends: [] })),
        fetch('/api/achievements', { headers: authHeaders() }).then(r => r.json()).catch(() => ({ achievements: [] })),
      ]).then(([quizRes, moodRes, friendRes, achRes]) => {
        const quizzes = Array.isArray(quizRes) ? quizRes : [];
        const moods = Array.isArray(moodRes) ? moodRes : [];
        let best = 0;
        quizzes.forEach(q => {
          const pct = Math.round((q.score / q.total) * 100);
          if (pct > best) best = pct;
        });
        _profStats = {
          quizCount: quizzes.length,
          quizBest: best,
          moodCount: moods.length,
          friendCount: (friendRes.friends || []).length,
          achievementCount: (achRes.achievements || []).length,
        };
        _updateProfileStats();
      }).catch(() => {});
    }

    // Event delegation
    const root = document.getElementById('view-profile');
    root?.addEventListener('click', e => {
      // Toggle edit
      if (e.target.closest('[data-prof-toggle-edit]')) {
        _profEditing = !_profEditing;
        playClick();
        const section = document.getElementById('prof-edit-section');
        const btn = document.querySelector('[data-prof-toggle-edit]');
        if (section) section.style.display = _profEditing ? '' : 'none';
        if (btn) btn.innerHTML = _profEditing ? t('profile.cancel') : '✏️ ' + t('profile.editProfile');
        return;
      }

      // Save MC name
      if (e.target.closest('[data-prof-save-mc]')) {
        _saveMcName(t);
        return;
      }
    });

    // MC name input live update
    root?.addEventListener('input', e => {
      if (e.target.id === 'prof-mc-name') {
        _profMcName = e.target.value;
      }
    });
  },

  cleanup() {
    _profEditing = false;
    _profMcName = '';
    _profSaving = false;
    _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };
  },
};

function _updateProfileStats() {
  const els = {
    'prof-stat-quiz-count': _profStats.quizCount,
    'prof-stat-quiz-best': _profStats.quizBest + '%',
    'prof-stat-mood-count': _profStats.moodCount,
    'prof-stat-friend-count': _profStats.friendCount,
    'prof-stat-ach-count': _profStats.achievementCount,
  };
  for (const [cls, val] of Object.entries(els)) {
    const el = document.querySelector(`.${cls}`);
    if (el) el.textContent = val;
  }
}

function _saveMcName(t) {
  if (_profSaving) return;
  _profSaving = true;
  const saveText = document.querySelector('.prof-save-text');
  if (saveText) saveText.textContent = '⏳';

  fetch('/api/auth/me', {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ minecraftName: _profMcName || null }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.user) {
        const token = get('token');
        setAuth(data.user, token);
        showToast(t('common.success'), 'success');
        _profEditing = false;
        const section = document.getElementById('prof-edit-section');
        const btn = document.querySelector('[data-prof-toggle-edit]');
        if (section) section.style.display = 'none';
        if (btn) btn.innerHTML = '✏️ ' + t('profile.editProfile');
      }
    })
    .catch(() => {
      showToast(t('common.error'), 'error');
    })
    .finally(() => {
      _profSaving = false;
      if (saveText) saveText.textContent = '✅ ' + t('profile.save');
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. ACCESSIBILITY VIEW
// ═══════════════════════════════════════════════════════════════════════════

export const accessibilityView = {
  render(t) {
    const soundEnabled = get('soundEnabled');
    const highContrast = get('highContrast');
    const largeText = get('largeText');
    const audioDescription = get('audioDescription');
    const biomeTheme = get('biomeTheme');

    const options = [
      { key: 'sound', label: t('accessibility.soundEffects'), desc: t('accessibility.soundEffectsDesc'), icon: soundEnabled ? '🔊' : '🔇', active: soundEnabled, color: 'var(--mc-emerald-green)' },
      { key: 'highContrast', label: t('accessibility.highContrast'), desc: t('accessibility.highContrastDesc'), icon: '◐', active: highContrast, color: '#FFFFFF' },
      { key: 'largeText', label: t('accessibility.largeText'), desc: t('accessibility.largeTextDesc'), icon: '🔤', active: largeText, color: 'var(--mc-diamond-blue)' },
      { key: 'audioDescription', label: t('accessibility.audioDescription'), desc: t('accessibility.audioDescDesc'), icon: '🔊', active: audioDescription, color: 'var(--mc-gold)' },
    ];

    const biomeOptions = [
      { key: 'forest', label: t('biome.forest'), icon: '🌿' },
      { key: 'nether', label: t('biome.nether'), icon: '🔥' },
      { key: 'end', label: t('biome.end'), icon: '✨' },
    ];

    return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-accessibility">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">♿ ${t('accessibility.title')}</div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">
            ${t('accessibility.desc')}
          </p>
          <div class="space-y-4" id="acc-options">
            ${options.map(opt => `
              <div class="mc-border-2 p-4 transition-all acc-option" data-acc-key="${opt.key}" style="${opt.active ? 'background: rgba(93,140,62,0.2); border-color: var(--mc-emerald-green);' : 'background: var(--mc-bg);'}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">${opt.icon}</span>
                    <div>
                      <h3 style="${mcStyle(sm())} color: ${opt.active ? 'var(--mc-emerald-green)' : 'var(--mc-text)'};">
                        ${opt.label}
                      </h3>
                      <p style="${mcStyle(sm())} color: var(--mc-stone-gray);">
                        ${opt.desc}
                      </p>
                    </div>
                  </div>
                  <button class="acc-toggle w-16 h-8 relative cursor-pointer" data-acc-toggle="${opt.key}" style="border: 3px solid #000; background: ${opt.active ? 'var(--mc-emerald-green)' : 'var(--mc-stone-gray)'}; transition: all 0.2s;">
                    <div class="w-6 h-6 absolute top-0.5 transition-all" style="left: ${opt.active ? 'calc(100% - 28px)' : '2px'}; background: ${opt.active ? '#fff' : 'var(--mc-light-gray)'}; border: 2px solid #000;"></div>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="mc-divider-icon my-6"><span>🌍</span></div>

          <h3 class="mb-4" style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">
            🌍 ${t('biome.title')}
          </h3>
          <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t('biome.desc')}
          </p>
          <div class="flex flex-wrap gap-3 mb-6" id="acc-biome-btns">
            ${biomeOptions.map(b => `
              <button class="mc-btn mc-btn-press ${sm()} px-4 py-2 ${biomeTheme === b.key ? 'mc-btn-primary' : 'mc-btn-stone'}" data-acc-biome="${b.key}">
                ${b.icon} ${b.label}
              </button>
            `).join('')}
          </div>

          <div class="mt-6">
            <button data-acc-reset class="mc-btn mc-btn-danger ${sm()}">
              🔄 ${t('accessibility.reset')}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  init(t) {
    const root = document.getElementById('view-accessibility');
    if (!root) return;

    root.addEventListener('click', e => {
      // Toggle switches
      const toggleBtn = e.target.closest('[data-acc-toggle]');
      if (toggleBtn) {
        const key = toggleBtn.dataset.accToggle;
        playClick();
        if (key === 'sound') setState({ soundEnabled: !get('soundEnabled') });
        else if (key === 'highContrast') setState({ highContrast: !get('highContrast') });
        else if (key === 'largeText') setState({ largeText: !get('largeText') });
        else if (key === 'audioDescription') setState({ audioDescription: !get('audioDescription') });
        // Re-render accessibility view
        const container = document.getElementById('view-accessibility');
        if (container) {
          container.innerHTML = accessibilityView.render(t);
          _bindAccessibilityEvents(root, t);
        }
        return;
      }

      // Biome buttons
      const biomeBtn = e.target.closest('[data-acc-biome]');
      if (biomeBtn) {
        const theme = biomeBtn.dataset.accBiome;
        setState({ biomeTheme: theme });
        playClick();
        const container = document.getElementById('view-accessibility');
        if (container) {
          container.innerHTML = accessibilityView.render(t);
          _bindAccessibilityEvents(root, t);
        }
        return;
      }

      // Reset button
      if (e.target.closest('[data-acc-reset]')) {
        setState({
          soundEnabled: true,
          highContrast: false,
          largeText: false,
          audioDescription: false,
          biomeTheme: 'forest',
        });
        playClick();
        showToast(t('accessibility.reset'), 'info');
        const container = document.getElementById('view-accessibility');
        if (container) {
          container.innerHTML = accessibilityView.render(t);
          _bindAccessibilityEvents(root, t);
        }
        return;
      }
    });
  },

  cleanup() {},
};

function _bindAccessibilityEvents(root, t) {
  // Re-bind events after re-render (the root element stays the same, but inner HTML changes)
  // Events are already delegated on root which persists
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. LEADERBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════

let _lbEntries = [];
let _lbLoading = true;

export const leaderboardView = {
  render(t) {
    return `
      <div class="max-w-2xl mx-auto px-4 py-8" id="view-leaderboard">
        <div class="mc-panel mc-glow-gold animate-pixel-slide-up">
          <div class="mc-panel-header">🏅 ${t('leaderboard.title')}</div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t('leaderboard.subtitle')}
          </p>
          <div id="lb-content">
            <div class="mc-skeleton-block lg mx-auto" style="height: 500px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  init(t) {
    _lbLoading = true;
    _lbEntries = [];

    fetch('/api/leaderboard?mode=platformer')
      .then(r => r.json())
      .then(data => {
        const user = get('user');
        _lbEntries = (data || []).map(e => ({
          playerName: e.playerName,
          score: e.score,
          level: e.level,
          isMe: user ? e.userId === user.id : false,
        }));
      })
      .catch(() => {})
      .finally(() => {
        _lbLoading = false;
        _renderLeaderboard(t);
      });
  },

  cleanup() {
    _lbEntries = [];
    _lbLoading = true;
  },
};

function _renderLeaderboard(t) {
  const container = document.getElementById('lb-content');
  if (!container) return;

  if (_lbEntries.length === 0) {
    container.innerHTML = `
      <div class="mc-empty-state py-8">
        <span class="text-4xl">🎮</span>
        <p style="${mcStyle(sm())} color: var(--mc-stone-gray); margin-top: 12px;">${t('leaderboard.noEntries')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="mc-leaderboard">
      <div class="flex items-center py-2 px-3 border-b-2 border-[var(--mc-obsidian)]" style="${mcStyle(sm())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">
        <span class="w-16">${t('leaderboard.rank')}</span>
        <span class="flex-1">${t('leaderboard.player')}</span>
        <span class="w-20 text-right">${t('leaderboard.level')}</span>
        <span class="w-24 text-right">${t('leaderboard.score')}</span>
      </div>
      ${_lbEntries.map((entry, i) => {
        const rank = i + 1;
        const topClass = rank === 1 ? 'mc-leaderboard-top1' : rank === 2 ? 'mc-leaderboard-top2' : rank === 3 ? 'mc-leaderboard-top3' : '';
        const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        return `
          <div class="mc-leaderboard-row ${topClass} ${entry.isMe ? 'mc-leaderboard-me' : ''}">
            <span class="w-16" style="${mcStyle(sm())} text-shadow: 1px 1px 0 #000;">${medal}</span>
            <span class="flex-1" style="${mcStyle(sm())} color: var(--mc-white); text-shadow: 1px 1px 0 #000;">
              ${entry.playerName}${entry.isMe ? ` (${t('leaderboard.you')})` : ''}
            </span>
            <span class="w-20 text-right" style="${mcStyle(sm())} color: var(--mc-diamond-blue);">Lv.${entry.level}</span>
            <span class="w-24 text-right" style="${mcStyle(md())} color: ${rank <= 3 ? 'var(--mc-gold)' : 'var(--mc-light-gray)'}; text-shadow: 2px 2px 0 #000;">
              ⭐ ${entry.score}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
