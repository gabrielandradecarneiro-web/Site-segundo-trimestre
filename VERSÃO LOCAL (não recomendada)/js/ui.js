/**
 * ui.js — Shared UI components and core views for MentalCraft.
 * Pure JavaScript ES Module. Each view exports { render(t), init(t), cleanup() }.
 */

import { get, setState, setView, setAuth, logout, subscribe, toggleSound, cycleBiomeTheme, clearAllNotifications, markNotificationRead, clearNotification } from './state.js';
import { t, tCurrent, getCurrentLocale, setLocale, LOCALE_LABELS } from './i18n.js';
import { playClick, playSuccess, playError, playAchievement } from './sound.js';
import { renderMarkdown } from './markdown.js';

// ─────────────────────────────────────────────────────────────────────────
// Toast Notification System
// ─────────────────────────────────────────────────────────────────────────

const TOAST_COLORS = {
  success: { bg: '#1B5E20', border: '#4CAF50', icon: '✅' },
  error:   { bg: '#7F1D1D', border: '#FF1A1A', icon: '❌' },
  info:    { bg: '#1A237E', border: '#42A5F5', icon: 'ℹ️' },
};

export function showToast(message, type = 'info') {
  const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
  const toast = document.createElement('div');
  toast.className = 'mc-toast';
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    background: ${colors.bg}; border: 3px solid ${colors.border};
    color: #fff; padding: 12px 20px; min-width: 250px; max-width: 400px;
    font-family: var(--mc-font); font-size: var(--mc-font-size-sm);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer;
    transform: translateX(120%); transition: transform 0.3s ease;
    display: flex; align-items: center; gap: 8px;
    text-shadow: 1px 1px 0 #000;
  `;
  toast.innerHTML = `<span>${colors.icon}</span><span style="flex:1">${message}</span>`;
  toast.addEventListener('click', () => removeToast(toast));
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
  });
  setTimeout(() => removeToast(toast), 3000);
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.transform = 'translateX(120%)';
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// ─────────────────────────────────────────────────────────────────────────
// Notification Panel
// ─────────────────────────────────────────────────────────────────────────

export function renderNotificationPanel(t) {
  const notifications = get('notifications') || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const notifItems = notifications.length === 0
    ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);text-align:center;padding:16px 0">${t('notifications.noNotifications')}</p>`
    : notifications.slice(0, 10).map(n => {
      const icon = n.type === 'friend_request' ? '👥' : n.type === 'achievement' ? '🏆' : 'ℹ️';
      const titleColor = n.read ? 'var(--mc-stone-gray)' : 'var(--mc-diamond-blue)';
      const dateStr = new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <button data-notif-id="${n.id}" class="mc-notif-item" style="width:100%;text-align:left;padding:12px;border-bottom:1px solid #2A2A2A;background:${n.read ? 'transparent' : 'rgba(93,140,62,0.1)'};cursor:pointer;opacity:${n.read ? '0.6' : '1'};transition:all 0.15s">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="font-size:0.875rem;margin-top:2px">${icon}</span>
            <div style="flex:1;min-width:0">
              <p style="font-family:var(--mc-font);font-size:0.65rem;color:${titleColor}">${n.title}</p>
              <p style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-light-gray);margin-top:2px">${n.message}</p>
              <p style="font-family:var(--mc-font);font-size:0.5rem;color:var(--mc-stone-gray);margin-top:4px">${dateStr}</p>
            </div>
            ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--mc-emerald-green);margin-top:4px;flex-shrink:0"></div>' : ''}
          </div>
        </button>
      `;
    }).join('');

  return `
    <div class="mc-notification-panel-wrapper" style="position:absolute;right:0;top:100%;margin-top:8px;z-index:50;width:280px">
      <div class="mc-panel" style="min-width:280px">
        <div class="mc-panel-header" style="display:flex;align-items:center;justify-content:space-between">
          <span>🔔 ${t('notifications.title')} (${unreadCount})</span>
          ${notifications.length > 0 ? `<button id="mc-clear-all-notifs" style="font-size:0.55rem;color:var(--mc-redstone-red);text-decoration:none;cursor:pointer;font-family:var(--mc-font);background:none;border:none">${t('notifications.clearAll')}</button>` : ''}
        </div>
        <div style="max-height:256px;overflow-y:auto">
          ${notifItems}
        </div>
      </div>
    </div>
  `;
}

export function initNotificationPanel(t) {
  // Mark individual notification as read
  document.querySelectorAll('[data-notif-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      markNotificationRead(btn.dataset.notifId);
    });
  });
  // Clear all
  const clearBtn = document.getElementById('mc-clear-all-notifs');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      clearAllNotifications();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────

let _headerClickOutsideHandler = null;

export function renderHeader(t) {
  const user = get('user');
  const currentView = get('currentView');
  const soundEnabled = get('soundEnabled');
  const biomeTheme = get('biomeTheme') || 'forest';
  const notifications = get('notifications') || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Tool nav items (visible in desktop nav bar)
  const toolNavItems = user ? [
    { view: 'chatbot', label: t('nav.chatbot'), icon: '🤖' },
    { view: 'vent', label: t('nav.vent'), icon: '💬' },
  ] : [];

  // More nav items (dropdown)
  const moreNavItems = user ? [
    { view: 'minigame', label: t('nav.minigame'), icon: '🎮' },
    { view: 'quiz', label: t('nav.quiz'), icon: '📝' },
    { view: 'studyHelp', label: t('nav.studyHelp') || 'Estudos', icon: '📖', isNew: true },
    { view: 'friends', label: t('nav.friends'), icon: '👥' },
    { view: 'journal', label: t('nav.journal'), icon: '📓' },
    { view: 'mood', label: t('mood.title'), icon: '😊' },
    { view: 'moodInsights', label: t('nav.moodInsights'), icon: '📊', isNew: true },
    { view: 'pomodoro', label: t('nav.pomodoro'), icon: '🍅' },
    { view: 'challenges', label: t('nav.challenges'), icon: '⚔️' },
    { view: 'selfcare', label: t('nav.selfcare'), icon: '💚' },
    { view: 'breathing', label: t('nav.breathing'), icon: '🫁' },
    { view: 'gratitude', label: t('nav.gratitude'), icon: '🙏' },
    { view: 'affirmations', label: t('nav.affirmations'), icon: '✨' },
    { view: 'coping', label: t('nav.coping'), icon: '🧰', isNew: true },
    { view: 'safetyPlan', label: t('nav.safetyPlan'), icon: '🛡️', isNew: true },
    { view: 'achievements', label: t('nav.achievements'), icon: '🏆' },
    { view: 'resources', label: t('nav.resources'), icon: '📚' },
    { view: 'leaderboard', label: t('nav.leaderboard'), icon: '🏅', isNew: true },
    { view: 'profile', label: t('nav.profile'), icon: '👤' },
    ...(user.role === 'admin' ? [{ view: 'admin', label: t('nav.admin'), icon: '🔧' }] : []),
    { view: 'accessibility', label: t('nav.accessibility'), icon: '♿' },
  ] : [];

  const allNavItems = [...toolNavItems, ...moreNavItems];

  // Build tool nav HTML
  const toolNavHTML = toolNavItems.map(item => {
    const isActive = currentView === item.view;
    return `
      <button data-view="${item.view}" class="mc-header-nav-btn" style="
        padding: 8px 8px; font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border: 2px solid transparent; white-space: nowrap; background: ${isActive ? '#4CAF50' : 'transparent'};
        color: ${isActive ? '#fff' : 'var(--mc-sand)'}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
        ${!isActive ? 'border-color: transparent;' : 'border-color: #000;'}
      ">
        ${item.icon}<span class="hidden xl:inline" style="margin-left:4px">${item.label}</span>
      </button>
    `;
  }).join('');

  // Build more dropdown HTML
  const moreDropdownHTML = moreNavItems.length > 0 ? `
    <div class="mc-more-dropdown-wrapper" style="position:relative">
      <button id="mc-more-btn" style="
        padding: 8px 8px; font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border: 2px solid transparent; white-space: nowrap; background: transparent;
        color: var(--mc-sand); font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
      ">
        📋<span class="hidden xl:inline" style="margin-left:4px">${t('nav.more') || 'Mais'} ▾</span>
      </button>
      <div id="mc-more-dropdown" style="display:none">
        <div id="mc-more-backdrop" style="position:fixed;inset:0;z-index:40"></div>
        <div id="mc-more-menu" style="position:absolute;right:0;top:100%;margin-top:4px;z-index:50;background:var(--mc-wood-bg,#6B4226);border:4px solid #000;box-shadow:0 25px 50px rgba(0,0,0,0.5);padding:8px 0;min-width:220px;max-height:80vh;overflow-y:auto">
          ${moreNavItems.map(item => {
            const isActive = currentView === item.view;
            return `
              <button data-view="${item.view}" class="mc-more-item" style="
                display: block; width: 100%; text-align: left; padding: 10px 16px;
                font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
                border-bottom: 1px solid rgba(0,0,0,0.2); background: ${isActive ? '#4CAF50' : 'transparent'};
                color: ${isActive ? '#fff' : 'var(--mc-sand)'}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
              ">
                ${item.icon} ${item.label}
                ${item.isNew ? '<span class="mc-badge-new" style="margin-left:8px">NEW</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  ` : '';

  // Mobile menu items
  const mobileMenuItems = allNavItems.map(item => {
    const isActive = currentView === item.view;
    return `
      <button data-view="${item.view}" style="
        display: block; width: 100%; text-align: left; padding: 12px 16px;
        font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border-bottom: 1px solid rgba(0,0,0,0.2); background: ${isActive ? '#4CAF50' : 'transparent'};
        color: ${isActive ? '#fff' : 'var(--mc-sand)'}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
      ">
        ${item.icon} ${item.label}
        ${item.isNew ? '<span class="mc-badge-new" style="margin-left:8px">NEW</span>' : ''}
      </button>
    `;
  }).join('');

  // Biome icon
  const biomeIcon = biomeTheme === 'forest' ? '🌿' : biomeTheme === 'nether' ? '🔥' : '✨';

  // Notification bell (only when logged in)
  const notifBell = user ? `
    <div style="position:relative" class="hidden sm:block" id="mc-notif-bell-wrapper">
      <button id="mc-notif-bell" style="position:relative;cursor:pointer;font-size:1.25rem;padding:4px" aria-label="${t('notifications.title')}">
        🔔
        ${unreadCount > 0 ? `<span class="mc-notification-badge">${unreadCount}</span>` : ''}
      </button>
      <div id="mc-notif-panel-container" style="display:none"></div>
    </div>
  ` : '';

  // Sound toggle (only when logged in)
  const soundToggle = user ? `
    <button id="mc-sound-toggle" class="hidden sm:block" style="font-size:1.25rem;cursor:pointer;padding:4px;background:none;border:none" aria-label="Toggle sound">
      ${soundEnabled ? '🔊' : '🔇'}
    </button>
  ` : '';

  // User area
  const userArea = user ? `
    <div style="display:flex;align-items:center;gap:6px">
      <span class="hidden 2xl:inline" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);white-space:nowrap">
        ⛏️${user.username}
      </span>
      <button id="mc-logout-btn" class="mc-btn mc-btn-danger" style="font-size:var(--mc-font-size-sm);padding:4px 10px;white-space:nowrap">
        ${t('auth.logout')}
      </button>
    </div>
  ` : `
    <button data-view="login" class="mc-btn mc-btn-gold" style="font-size:var(--mc-font-size-sm);padding:4px 10px;white-space:nowrap">
      ${t('nav.login')}
    </button>
  `;

  return `
    <header class="mc-bg-wood" style="position:sticky;top:0;z-index:50;border-bottom:4px solid #000;box-shadow:0 4px 12px rgba(0,0,0,0.3)">
      <div style="width:100%;padding:0 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;height:64px">
          <!-- Logo -->
          <button id="mc-logo-btn" style="display:flex;align-items:center;gap:12px;cursor:pointer;background:none;border:none;padding:0">
            <div class="mc-bg-grass mc-border-2" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.25rem">
              ⛏️
            </div>
            <div class="hidden sm:block">
              <h1 style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:#fff;text-shadow:2px 2px 0 #000;margin:0">
                MentalCraft
              </h1>
              <p style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-sand);text-shadow:1px 1px 0 #000;margin:0">
                ${t('landing.subtitle')}
              </p>
            </div>
          </button>

          <!-- Desktop Nav -->
          <nav class="hidden lg:flex" style="align-items:center;gap:4px;flex:1;min-width:0">
            ${toolNavHTML}
            ${moreDropdownHTML}
            <div style="margin-left:auto"></div>
          </nav>

          <!-- Right side -->
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            ${soundToggle}

            <!-- Biome toggle -->
            <button id="mc-biome-toggle" class="mc-btn-press hidden 2xl:block" style="padding:4px 8px;font-size:0.875rem;cursor:pointer;border:2px solid #000" aria-label="${t('biome.title')}">
              ${biomeIcon}
            </button>

            ${notifBell}

            <!-- Language Selector -->
            <select id="mc-lang-select" class="mc-input" style="padding:4px 6px;font-size:var(--mc-font-size-sm);width:auto" aria-label="Language">
              <option value="pt" ${getCurrentLocale() === 'pt' ? 'selected' : ''}>🇧🇷 Português</option>
              <option value="en" ${getCurrentLocale() === 'en' ? 'selected' : ''}>🇺🇸 English</option>
              <option value="es" ${getCurrentLocale() === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
              <option value="kaingang" ${getCurrentLocale() === 'kaingang' ? 'selected' : ''}>🌲 Kaingang</option>
              <option value="tupi" ${getCurrentLocale() === 'tupi' ? 'selected' : ''}>🌿 Tupi</option>
            </select>

            ${userArea}

            <!-- Mobile menu button -->
            <button id="mc-mobile-menu-btn" class="lg:hidden mc-btn-stone" style="padding:4px 8px;font-size:0.875rem;cursor:pointer" aria-label="Menu">
              ☰
            </button>
          </div>
        </div>

        <!-- Mobile Nav Overlay -->
        <div id="mc-mobile-overlay" style="display:none">
          <div style="position:fixed;inset:0;z-index:40;top:64px">
            <div id="mc-mobile-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.6)"></div>
            <nav id="mc-mobile-nav" class="mc-bg-wood" style="position:relative;border-bottom:4px solid #000;border-right:4px solid #000;box-shadow:0 25px 50px rgba(0,0,0,0.5);overflow-y:auto;max-height:calc(100vh - 64px);max-width:320px;font-family:var(--mc-font)">
              <div style="display:flex;justify-content:flex-end;padding:8px">
                <button id="mc-mobile-close" class="mc-btn mc-btn-danger" style="padding:4px 12px;font-size:var(--mc-font-size-sm);cursor:pointer">
                  ✕ ${t('common.close')}
                </button>
              </div>
              ${mobileMenuItems}
            </nav>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function initHeader(t) {
  // Logo → landing
  const logoBtn = document.getElementById('mc-logo-btn');
  if (logoBtn) {
    logoBtn.addEventListener('click', () => { playClick(); setView('landing'); });
  }

  // All [data-view] buttons in header (nav, more, mobile)
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      setView(btn.dataset.view);
      closeMobileMenu();
      closeMoreDropdown();
      closeNotifPanel();
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('mc-sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => { toggleSound(); playClick(); });
  }

  // Biome toggle
  const biomeBtn = document.getElementById('mc-biome-toggle');
  if (biomeBtn) {
    biomeBtn.addEventListener('click', () => { cycleBiomeTheme(); playClick(); });
  }

  // Language selector
  const langSelect = document.getElementById('mc-lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLocale(e.target.value);
    });
  }

  // Logout
  const logoutBtn = document.getElementById('mc-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const token = get('token');
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      logout();
      showToast(t('common.goodbye'), 'info');
    });
  }

  // More dropdown
  const moreBtn = document.getElementById('mc-more-btn');
  const moreDropdown = document.getElementById('mc-more-dropdown');
  const moreBackdrop = document.getElementById('mc-more-backdrop');
  if (moreBtn && moreDropdown) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      const isOpen = moreDropdown.style.display !== 'none';
      moreDropdown.style.display = isOpen ? 'none' : 'block';
      moreBtn.style.background = isOpen ? 'transparent' : '#FFB300';
      moreBtn.style.borderColor = isOpen ? 'transparent' : '#000';
      moreBtn.style.color = isOpen ? 'var(--mc-sand)' : '#000';
      moreBtn.style.textShadow = isOpen ? '1px 1px 0 #000' : 'none';
    });
    if (moreBackdrop) {
      moreBackdrop.addEventListener('click', closeMoreDropdown);
    }
    // Bind data-view items inside more menu
    moreDropdown.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        setView(btn.dataset.view);
        closeMobileMenu();
        closeMoreDropdown();
      });
    });
  }

  // Notification bell
  const notifBell = document.getElementById('mc-notif-bell');
  const notifContainer = document.getElementById('mc-notif-panel-container');
  if (notifBell && notifContainer) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      const isOpen = notifContainer.style.display !== 'none';
      if (isOpen) {
        closeNotifPanel();
      } else {
        notifContainer.style.display = 'block';
        notifContainer.innerHTML = renderNotificationPanel(t);
        initNotificationPanel(t);
      }
    });
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mc-mobile-menu-btn');
  const mobileOverlay = document.getElementById('mc-mobile-overlay');
  const mobileBackdrop = document.getElementById('mc-mobile-backdrop');
  const mobileClose = document.getElementById('mc-mobile-close');
  if (mobileMenuBtn && mobileOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
      playClick();
      mobileOverlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  }
  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', closeMobileMenu);
  }
  if (mobileClose) {
    mobileClose.addEventListener('click', closeMobileMenu);
  }

  // Click outside to close more dropdown and notif panel
  if (_headerClickOutsideHandler) {
    document.removeEventListener('mousedown', _headerClickOutsideHandler);
  }
  _headerClickOutsideHandler = (e) => {
    if (moreDropdown && moreDropdown.style.display !== 'none') {
      if (!e.target.closest('.mc-more-dropdown-wrapper')) {
        closeMoreDropdown();
      }
    }
    if (notifContainer && notifContainer.style.display !== 'none') {
      if (!e.target.closest('#mc-notif-bell-wrapper')) {
        closeNotifPanel();
      }
    }
  };
  document.addEventListener('mousedown', _headerClickOutsideHandler);
}

function closeMoreDropdown() {
  const moreDropdown = document.getElementById('mc-more-dropdown');
  const moreBtn = document.getElementById('mc-more-btn');
  if (moreDropdown) moreDropdown.style.display = 'none';
  if (moreBtn) {
    moreBtn.style.background = 'transparent';
    moreBtn.style.borderColor = 'transparent';
    moreBtn.style.color = 'var(--mc-sand)';
    moreBtn.style.textShadow = '1px 1px 0 #000';
  }
}

function closeNotifPanel() {
  const container = document.getElementById('mc-notif-panel-container');
  if (container) container.style.display = 'none';
}

function closeMobileMenu() {
  const overlay = document.getElementById('mc-mobile-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────

export function renderFooter(t) {
  const blockColors = ['#4CAF50', '#A0722A', '#9E9E9E', '#00E5FF', '#FFB300', '#FF1A1A', '#3AA93B', '#42A5F5'];
  const blocks = Array.from({ length: 20 }, (_, i) => {
    const bg = blockColors[i % blockColors.length];
    const opacity = (0.6 + Math.sin(i * 0.5) * 0.3).toFixed(2);
    return `<div style="width:24px;height:24px;border:1px solid #000;background:${bg};opacity:${opacity}"></div>`;
  }).join('');

  return `
    <footer class="mc-bg-wood" style="margin-top:auto;border-top:4px solid #000;position:relative;z-index:10">
      <div class="mc-footer-border"></div>
      <div style="max-width:72rem;margin:0 auto;padding:32px 16px">
        <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-3">
          <!-- Brand -->
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <span style="font-size:1.5rem">⛏️</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:#fff;text-shadow:2px 2px 0 #000">
                MentalCraft
              </span>
            </div>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-sand);line-height:1.8">
              ${t('landing.subtitle')}
            </p>
          </div>

          <!-- Emergency numbers -->
          <div>
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-redstone-red);text-shadow:1px 1px 0 #000;margin-bottom:8px">
              🆘 ${t('emergency.title')}
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              <a href="tel:180" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">📞 180 - ${t('emergency.description180')}</a>
              <a href="tel:192" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">📞 192 - ${t('emergency.description192')}</a>
              <a href="tel:190" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">📞 190 - ${t('emergency.description190')}</a>
              <a href="tel:188" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">📞 188 - ${t('emergency.description188')}</a>
            </div>
          </div>

          <!-- Quick links -->
          <div>
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:8px">
              ⛏️ ${t('footer.links')}
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button data-view="landing" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t('nav.landing')}</button>
              <button data-view="accessibility" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t('nav.accessibility')}</button>
              <button data-view="quiz" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t('nav.quiz')}</button>
            </div>
          </div>
        </div>

        <!-- Decorative bottom blocks -->
        <div style="margin-top:24px;display:flex;justify-content:center;gap:4px;flex-wrap:wrap">
          ${blocks}
        </div>

        <p style="margin-top:16px;text-align:center;font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray);text-shadow:1px 1px 0 #000">
          MentalCraft © 2025 - ${t('footer.copyright')}
        </p>
      </div>
    </footer>
  `;
}

// ─────────────────────────────────────────────────────────────────────────
// Pixel Particles
// ─────────────────────────────────────────────────────────────────────────

const PARTICLES_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 37 + 13) % 100,
  delay: (i * 1.3) % 5,
  duration: 3 + (i * 0.7) % 4,
  size: 2 + (i * 0.5) % 4,
  color: ['#4CAF50', '#00E5FF', '#FFB300', '#FF1A1A', '#9E9E9E'][i % 5],
}));

export function renderParticles() {
  const particles = PARTICLES_DATA.map(p => `
    <div class="mc-particle" style="
      left: ${p.left}%; bottom: -10px;
      width: ${p.size}px; height: ${p.size}px;
      background-color: ${p.color};
      animation-delay: ${p.delay}s;
      animation-duration: ${p.duration}s;
    "></div>
  `).join('');

  return `<div class="mc-particle-container">${particles}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────────────────────────────────

const _landingTimers = [];

export function renderLanding(t) {
  const user = get('user');

  const features = [
    { view: 'chatbot', icon: '🤖', title: t('landing.feature1Title'), desc: t('landing.feature1Desc'), color: 'mc-btn-primary' },
    { view: 'quiz', icon: '📝', title: t('landing.feature2Title'), desc: t('landing.feature2Desc'), color: 'mc-btn-diamond' },
    { view: 'friends', icon: '👥', title: t('landing.feature3Title'), desc: t('landing.feature3Desc'), color: 'mc-btn-gold' },
    { view: 'minigame', icon: '🎮', title: t('landing.feature4Title'), desc: t('landing.feature4Desc'), color: 'mc-btn-secondary' },
    { view: 'vent', icon: '💬', title: t('landing.feature5Title'), desc: t('landing.feature5Desc'), color: 'mc-btn-stone' },
    { view: 'accessibility', icon: '♿', title: t('landing.feature6Title'), desc: t('landing.feature6Desc'), color: 'mc-btn-danger' },
    { view: 'journal', icon: '📓', title: t('landing.feature7Title'), desc: t('landing.feature7Desc'), color: 'mc-btn-primary' },
    { view: 'accessibility', icon: '🔊', title: t('landing.feature8Title'), desc: t('landing.feature8Desc'), color: 'mc-btn-secondary' },
  ];

  const featuresHTML = features.map(f => `
    <button data-view="${f.view}" data-require-auth="${f.view !== 'accessibility' ? 'true' : ''}" class="mc-panel mc-mob-card" style="text-align:left;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="mc-border-2" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--mc-bg-light)">
          ${f.icon}
        </div>
        <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin:0">
          ${f.title}
        </h3>
      </div>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin:0">
        ${f.desc}
      </p>
      <div class="mc-btn ${f.color}" style="margin-top:16px;font-size:var(--mc-font-size-sm);width:fit-content;opacity:0.8">
        ${t('landing.cta3')} →
      </div>
    </button>
  `).join('');

  const stats = [
    { icon: '❤️', value: '24/7', label: t('landing.stat1') },
    { icon: '🛡️', value: '100%', label: t('landing.stat2') },
    { icon: '🌍', value: '5', label: t('landing.stat3') },
    { icon: '🎮', value: '∞', label: t('landing.stat4') },
  ];

  const statsHTML = stats.map(s => `
    <div class="mc-stat-card mc-stat-green" style="display:flex;flex-direction:column;align-items:center;gap:8px">
      <span style="font-size:1.875rem">${s.icon}</span>
      <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000">${s.value}</span>
      <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${s.label}</span>
    </div>
  `).join('');

  const characters = [
    { name: 'Steve', desc: t('landing.char1'), emoji: '🧑‍🌾', color: '#00E5FF' },
    { name: 'Alex', desc: t('landing.char2'), emoji: '👩‍🦰', color: '#FF6B9D' },
    { name: 'Villager', desc: t('landing.char3'), emoji: '🧝', color: '#8B6914' },
    { name: 'Iron Golem', desc: t('landing.char4'), emoji: '🤖', color: '#C0C0C0' },
  ];

  const charactersHTML = characters.map(c => `
    <div class="mc-panel mc-mob-card" style="text-align:center">
      <div style="width:96px;height:96px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:3rem;border:3px solid ${c.color};background:${c.color}22">
        ${c.emoji}
      </div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:${c.color};text-shadow:2px 2px 0 #000;margin:0 0 8px 0">
        ${c.name}
      </h3>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);margin-top:8px;line-height:1.6">
        ${c.desc}
      </p>
    </div>
  `).join('');

  const tips = [
    { icon: '💭', title: t('tips.tip1Title'), desc: t('tips.tip1Desc'), delay: '0s' },
    { icon: '🫁', title: t('tips.tip2Title'), desc: t('tips.tip2Desc'), delay: '0.5s' },
    { icon: '🤝', title: t('tips.tip3Title'), desc: t('tips.tip3Desc'), delay: '1s' },
    { icon: '🧘', title: t('tips.tip4Title'), desc: t('tips.tip4Desc'), delay: '1.5s' },
  ];

  const tipsHTML = tips.map(tip => `
    <div class="mc-panel" style="padding:24px">
      <div style="font-size:2.5rem;margin-bottom:12px" class="mc-float-item" data-float-delay="${tip.delay}">${tip.icon}</div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin-bottom:8px">
        ${tip.title}
      </h3>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin:0">
        ${tip.desc}
      </p>
    </div>
  `).join('');

  const heroBlocks = [
    { top: '10%', left: '5%', type: 'block-diamond', delay: '0s' },
    { top: '20%', right: '8%', type: 'block-gold', delay: '1s' },
    { top: '60%', left: '10%', type: 'block-stone', delay: '2s' },
    { top: '70%', right: '12%', type: 'block-grass', delay: '0.5s' },
    { top: '40%', left: '3%', type: 'block-redstone', delay: '1.5s' },
    { top: '50%', right: '5%', type: 'block-diamond', delay: '3s' },
    { top: '80%', left: '20%', type: 'block-gold', delay: '2.5s' },
  ];

  const floatingBlocksHTML = heroBlocks.map(b => {
    const posStyle = b.top ? `top:${b.top}` : `right:${b.right}`;
    const posStyle2 = b.left ? `left:${b.left}` : '';
    return `<div class="mc-hero-float-block ${b.type}" style="${posStyle};${posStyle2};animation-delay:${b.delay}"></div>`;
  }).join('');

  const hotbarItems = ['🧠', '💚', '🛡️', '⛏️', '💎', '📚', '🎮', '🤝', '⭐'];
  const hotbarHTML = hotbarItems.map(item => `
    <div class="mc-hotbar-slot"><span style="font-size:1.25rem;sm:font-size:1.5rem">${item}</span></div>
  `).join('');

  const ctaBtnText = user ? t('landing.cta2') : t('landing.cta1');
  const ctaView = user ? 'dashboard' : 'register';

  return `
    <div style="min-height:100vh">
      <!-- Hero Section -->
      <section class="mc-bg-grass" style="position:relative;overflow:hidden;min-height:70vh;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;inset:0;opacity:0.1;background-image:url('data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'16\' height=\'16\' fill=\'%23000\' fill-opacity=\'0.2\'/%3E%3Crect x=\'1\' y=\'1\' width=\'14\' height=\'14\' fill=\'none\' stroke=\'%23000\' stroke-width=\'1\' fill-opacity=\'0.1\'/%3E%3C/svg%3E');background-size:16px 16px"></div>

        <div class="animate-pixel-slide-up" style="position:relative;z-index:10;text-align:center;padding:64px 16px">
          ${floatingBlocksHTML}

          <div style="margin-bottom:24px">
            <div class="mc-bg-wood mc-border" style="display:inline-block;padding:12px 24px;margin-bottom:16px">
              <span style="color:var(--mc-gold);font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-shadow:1px 1px 0 #000">
                ⛏️ MINECRAFT ⛏️
              </span>
            </div>
          </div>

          <h1 class="animate-title-glow" style="
            font-family:var(--mc-font);
            font-size:clamp(1.5rem, 5vw, var(--mc-font-size-4xl));
            color:var(--mc-white);
            text-shadow:4px 4px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;
            line-height:1.3; margin-bottom:24px;
          ">${t('landing.hero')}</h1>

          <p style="
            font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-sand);text-shadow:2px 2px 0 #000;line-height:1.8;
            max-width:42rem;margin:0 auto 32px;
          ">${t('landing.description')}</p>

          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center">
            <button id="mc-cta-main" class="mc-btn mc-btn-gold animate-pixel-bounce" style="font-size:var(--mc-font-size-lg);padding:16px 32px">
              ⛏️ ${ctaBtnText}
            </button>
            <button data-view="chatbot" data-require-auth="true" class="mc-btn mc-btn-diamond" style="font-size:var(--mc-font-size-lg);padding:16px 32px">
              🤖 ${t('nav.chatbot')}
            </button>
          </div>
        </div>

        <div class="mc-bg-dirt" style="position:absolute;bottom:0;left:0;right:0;height:64px;clip-path:polygon(0 30%,5% 0%,10% 40%,15% 10%,20% 35%,25% 5%,30% 45%,35% 15%,40% 30%,45% 8%,50% 40%,55% 12%,60% 35%,65% 5%,70% 45%,75% 10%,80% 30%,85% 15%,90% 40%,95% 8%,100% 30%,100% 100%,0 100%)"></div>

        <div class="mc-inventory-hotbar">
          ${hotbarHTML}
        </div>
      </section>

      <div class="mc-pixel-divider"></div>

      <!-- Stats bar -->
      <section style="background:var(--mc-bg-dark);padding:24px 0">
        <div style="max-width:64rem;margin:0 auto;padding:0 16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;text-align:center" class="md:grid-cols-4">
          ${statsHTML}
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Emergency Banner -->
      <section class="mc-bg-lava mc-emergency-pulse" style="padding:16px 0;position:relative;overflow:hidden">
        <div style="max-width:56rem;margin:0 auto;padding:0 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;position:relative;z-index:10">
          <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:#fff;text-shadow:2px 2px 0 #000">
            🆘 ${t('emergency.title')}:
          </span>
          <a href="tel:180" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 180</a>
          <a href="tel:188" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 188</a>
          <a href="tel:192" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 192</a>
          <a href="tel:190" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 190</a>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Features Section -->
      <section style="padding:64px 16px;background:var(--mc-bg)">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:3px 3px 0 #000">
            ⭐ ${t('landing.features')} ⭐
          </h2>
          <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-2 lg:grid-cols-3">
            ${featuresHTML}
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Characters Section -->
      <section class="mc-bg-obsidian" style="padding:64px 16px">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:3px 3px 0 #000">
            🧑‍🌾 ${t('landing.characters')} 🧑‍🌾
          </h2>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px" class="md:grid-cols-4">
            ${charactersHTML}
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Mobs Section -->
      <section style="padding:64px 16px;background:var(--mc-bg-dark)">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-ender-purple);text-shadow:3px 3px 0 #000">
            🌑 ${t('landing.subtitle')} 🌑
          </h2>
          <div class="mc-mob-gallery">
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0s"><div class="mc-mob mc-mob-creeper"></div><span>Creeper</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.5s"><div class="mc-mob mc-mob-enderman"></div><span>Enderman</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1s"><div class="mc-mob mc-mob-zombie"></div><span>Zumbi</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1.5s"><div class="mc-mob mc-mob-skeleton"></div><span>Esqueleto</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.3s"><div class="mc-mob mc-mob-pig"></div><span>Porco</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.8s"><div class="mc-mob mc-mob-wolf"></div><span>Lobo</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1.2s"><div class="mc-mob mc-mob-spider"></div><span>Aranha</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.6s"><div class="mc-mob mc-mob-ender-dragon"></div><span>Ender Dragon</span></div>
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Tips Section -->
      <section class="mc-bg-obsidian" style="padding:64px 16px">
        <div style="max-width:72rem;margin:0 auto">
          <h2 class="mc-enchanted" style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:3px 3px 0 #000">
            💚 ${t('tips.title')} 💚
          </h2>
          <div style="display:grid;grid-template-columns:1fr;gap:24px;margin-bottom:48px" class="sm:grid-cols-2">
            ${tipsHTML}
          </div>

          <!-- Breathing Exercise -->
          <div style="text-align:center" id="mc-landing-breathing">
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000;margin-bottom:24px">
              🌬️ 4-7-8
            </h3>
            <div style="display:flex;align-items:center;justify-content:center;margin-bottom:24px">
              <div id="mc-breath-circle" style="width:128px;height:128px;border-radius:50%;background:#3F3F3F;display:flex;align-items:center;justify-content:center;transition:transform 2s ease-in-out,background-color 1s ease">
                <span id="mc-breath-text" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:#fff;text-shadow:2px 2px 0 #000">🫁</span>
              </div>
            </div>
            <button id="mc-breath-start" class="mc-btn mc-btn-primary" style="font-size:var(--mc-font-size-sm)">
              🌟 ${t('tips.breathStart')}
            </button>
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- CTA Section -->
      <section class="mc-bg-grass" style="padding:64px 16px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;opacity:0.05;background-image:url('data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'32\' height=\'32\' fill=\'none\' stroke=\'%23000\' stroke-width=\'1\'/%3E%3C/svg%3E');background-size:32px 32px"></div>
        <div class="animate-pixel-fade-in" style="max-width:48rem;margin:0 auto;text-align:center;position:relative;z-index:10">
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-3xl);color:var(--mc-white);text-shadow:4px 4px 0 #000">
            ${t('landing.cta4')}
          </h2>
          <p style="margin-top:16px;margin-bottom:32px;font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-sand);text-shadow:2px 2px 0 #000;line-height:1.8">
            ${t('landing.cta5')}
          </p>
          <button id="mc-cta-bottom" class="mc-btn mc-btn-diamond mc-badge-epic animate-pixel-pulse" style="font-size:var(--mc-font-size-lg);padding:16px 40px">
            ⛏️ ${t('landing.cta1')}
          </button>
        </div>
      </section>
    </div>
  `;
}

export function initLanding(t) {
  const user = get('user');

  // Feature card clicks (require auth check)
  document.querySelectorAll('[data-require-auth="true"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = btn.closest('[data-view]') || btn;
      const view = target.dataset.view;
      if (!view) return;
      if (!user) {
        showToast(t('errors.loginRequired'), 'error');
        setView('login');
        return;
      }
      playClick();
      setView(view);
    });
  });

  // CTA main button
  const ctaMain = document.getElementById('mc-cta-main');
  if (ctaMain) {
    ctaMain.addEventListener('click', () => {
      playClick();
      setView(user ? 'dashboard' : 'register');
    });
  }

  // CTA bottom button
  const ctaBottom = document.getElementById('mc-cta-bottom');
  if (ctaBottom) {
    ctaBottom.addEventListener('click', () => {
      playClick();
      setView(user ? 'dashboard' : 'register');
    });
  }

  // Breathing exercise
  const breathBtn = document.getElementById('mc-breath-start');
  const breathCircle = document.getElementById('mc-breath-circle');
  const breathText = document.getElementById('mc-breath-text');
  if (breathBtn && breathCircle && breathText) {
    breathBtn.addEventListener('click', () => {
      playClick();
      breathBtn.disabled = true;
      breathBtn.style.opacity = '0.6';
      breathBtn.textContent = '⏳ ...';

      // Inhale phase
      breathCircle.style.backgroundColor = '#4CAF50';
      breathCircle.style.transform = 'scale(1.4)';
      breathText.textContent = t('tips.inhale');

      const t1 = setTimeout(() => {
        // Hold phase
        breathCircle.style.backgroundColor = '#FFB300';
        breathCircle.style.transform = 'scale(1.4)';
        breathText.textContent = t('tips.hold');
      }, 4000);

      const t2 = setTimeout(() => {
        // Exhale phase
        breathCircle.style.backgroundColor = '#00E5FF';
        breathCircle.style.transform = 'scale(0.8)';
        breathText.textContent = t('tips.exhale');
      }, 11000);

      const t3 = setTimeout(() => {
        // Reset
        breathCircle.style.backgroundColor = '#3F3F3F';
        breathCircle.style.transform = 'scale(1)';
        breathText.textContent = '🫁';
        breathBtn.disabled = false;
        breathBtn.style.opacity = '1';
        breathBtn.textContent = '🌟 ' + t('tips.breathStart');
      }, 19000);

      _landingTimers.push(t1, t2, t3);
    });
  }

  // Audio description
  const audioDescription = get('audioDescription');
  if (audioDescription) {
    const msg = new SpeechSynthesisUtterance(t('landing.hero'));
    msg.lang = 'pt-BR';
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    _landingTimers.push({ cancel: () => speechSynthesis.cancel() });
  }
}

export function cleanupLanding() {
  _landingTimers.forEach(timer => {
    if (timer && typeof timer === 'object' && timer.cancel) {
      timer.cancel();
    } else if (timer) {
      clearTimeout(timer);
    }
  });
  _landingTimers.length = 0;
  speechSynthesis.cancel();
}

// ─────────────────────────────────────────────────────────────────────────
// Auth Form (Login / Register)
// ─────────────────────────────────────────────────────────────────────────

export function renderAuth(t, mode) {
  const isRegister = mode === 'register';

  const usernameField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t('auth.username')}</label>
      <input type="text" id="mc-auth-username" class="mc-input" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" />
    </div>
  ` : '';

  const confirmField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t('auth.confirmPassword')}</label>
      <input type="password" id="mc-auth-confirm" class="mc-input" required minlength="6" />
    </div>
  ` : '';

  const mcNameField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t('auth.minecraftName')} <span style="color:var(--mc-stone-gray)">(${t('common.optional') || 'opcional'})</span></label>
      <input type="text" id="mc-auth-mcname" class="mc-input" placeholder="Steve_Builder" />
    </div>
  ` : '';

  return `
    <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:48px 16px">
      <div class="mc-auth-decoration">
        <div class="mc-panel mc-auth-glow animate-pixel-slide-up" style="width:100%;max-width:28rem">
          <div class="mc-panel-header" style="text-align:center">
            ${isRegister ? '⛏️ ' + t('auth.register') : '🔐 ' + t('auth.login')}
          </div>

          <form id="mc-auth-form" style="display:flex;flex-direction:column;gap:16px">
            ${usernameField}

            <div style="margin-bottom:16px">
              <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t('auth.email')}</label>
              <input type="email" id="mc-auth-email" class="mc-input" required />
            </div>

            <div style="margin-bottom:16px">
              <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t('auth.password')}</label>
              <input type="password" id="mc-auth-password" class="mc-input" required minlength="6" />
            </div>

            ${confirmField}
            ${mcNameField}

            <button type="submit" id="mc-auth-submit" class="mc-btn mc-btn-primary" style="width:100%;font-size:var(--mc-font-size-md);padding:12px">
              ${isRegister ? '⛏️ ' + t('auth.register') : '⚔️ ' + t('auth.login')}
            </button>
          </form>

          <div class="mc-form-divider" style="margin:16px 0">
            <span style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">⛏️</span>
          </div>

          <div style="margin-top:8px;text-align:center">
            <button id="mc-auth-switch" style="font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);cursor:pointer;background:none;border:none;text-decoration:underline;font-family:var(--mc-font);padding:0">
              ${isRegister ? t('auth.hasAccount') : t('auth.noAccount')}
            </button>
            <br />
            <button id="mc-auth-back" style="font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);cursor:pointer;background:none;border:none;text-decoration:underline;font-family:var(--mc-font);padding:0;margin-top:4px">
              ← ${t('common.back')}
            </button>
          </div>

          <!-- Decorative Minecraft blocks -->
          <div style="display:flex;justify-content:center;gap:8px;margin-top:24px">
            ${['🟫', '🟩', '⬜', '🟨', '💎'].map((b, i) => `<span class="animate-xp-orb" style="animation-delay:${i * 0.3}s;font-size:1.5rem">${b}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initAuth(t, mode) {
  const form = document.getElementById('mc-auth-form');
  const switchBtn = document.getElementById('mc-auth-switch');
  const backBtn = document.getElementById('mc-auth-back');
  const submitBtn = document.getElementById('mc-auth-submit');

  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      playClick();
      setView(mode === 'login' ? 'register' : 'login');
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      playClick();
      setView('landing');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.textContent = '⏳ ...';
      }

      try {
        if (mode === 'register') {
          const password = document.getElementById('mc-auth-password').value;
          const confirm = document.getElementById('mc-auth-confirm').value;
          if (password !== confirm) {
            showToast(t('errors.passwordMismatch'), 'error');
            playError();
            resetAuthBtn();
            return;
          }
        }

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login'
          ? { email: document.getElementById('mc-auth-email').value, password: document.getElementById('mc-auth-password').value }
          : {
              username: document.getElementById('mc-auth-username').value,
              email: document.getElementById('mc-auth-email').value,
              password: document.getElementById('mc-auth-password').value,
              minecraftName: document.getElementById('mc-auth-mcname').value || undefined,
            };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || t('errors.requestError'), 'error');
          playError();
          resetAuthBtn();
          return;
        }

        setAuth(data.user, data.token);
        showToast(t('common.success'), 'success');
        playSuccess();
        setView('dashboard');
      } catch (err) {
        showToast(t('errors.connectionError'), 'error');
        playError();
        resetAuthBtn();
      }
    });
  }

  function resetAuthBtn() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.textContent = mode === 'login' ? '⚔️ ' + t('auth.login') : '⛏️ ' + t('auth.register');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────

const _dashboardTimers = [];

export function renderDashboard(t) {
  const user = get('user');
  const locale = getCurrentLocale();

  // Daily tip based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyTips = [
    { pt: 'Respire fundo 3 vezes antes de reagir a uma situação difícil.', en: 'Take 3 deep breaths before reacting to a difficult situation.', es: 'Respira profundo 3 veces antes de reaccionar a una situación difícil.', kaingang: 'Hukã teko sã.', tupi: 'Hukã teko sã.' },
    { pt: 'Converse com alguém de confiança sobre como você se sente.', en: 'Talk to someone you trust about how you feel.', es: 'Habla con alguien de confianza sobre cómo te sientes.', kaingang: 'Irũ jykre.', tupi: 'Irũ ñe\'ẽ.' },
    { pt: 'Faça uma pausa de 10 minutos para fazer algo que você gosta.', en: 'Take a 10-minute break to do something you enjoy.', es: 'Toma un descanso de 10 minutos para hacer algo que disfrutes.', kaingang: 'Teko sã kanjuk.', tupi: 'Teko sã kanjuk.' },
    { pt: 'Escreva 3 coisas pelas quais você é grato hoje.', en: 'Write 3 things you are grateful for today.', es: 'Escribe 3 cosas por las que estás agradecido hoy.', kaingang: 'Kanjuk 3.', tupi: 'Kanjuk 3.' },
    { pt: 'Limitar o tempo nas redes sociais pode melhorar seu bem-estar.', en: 'Limiting social media time can improve your well-being.', es: 'Limitar el tiempo en redes sociales puede mejorar tu bienestar.', kaingang: 'Hukã kyry.', tupi: 'Hukã kyry.' },
    { pt: 'Dormir bem é essencial para a saúde mental. Tente dormir 8 horas.', en: 'Good sleep is essential for mental health. Try to sleep 8 hours.', es: 'Dormir bien es esencial para la salud mental. Intenta dormir 8 horas.', kaingang: 'Kũí teko sã.', tupi: 'Ker teko sã.' },
    { pt: 'Exercitar-se por 30 minutos libera endorfinas que melhoram o humor.', en: 'Exercising for 30 minutes releases endorphins that improve mood.', es: 'Ejercitarse 30 minutos libera endorfinas que mejoran el humor.', kaingang: 'Teko sã hukã.', tupi: 'Teko sã hukã.' },
  ];
  const dailyTip = dailyTips[dayOfYear % dailyTips.length];

  const dashboardItems = [
    { view: 'chatbot', icon: '🤖', title: t('nav.chatbot'), desc: t('landing.feature1Desc'), bg: 'mc-bg-obsidian', accent: 'var(--mc-ender-purple)' },
    { view: 'quiz', icon: '📝', title: t('nav.quiz'), desc: t('landing.feature2Desc'), bg: 'mc-bg-stone', accent: 'var(--mc-diamond-blue)' },
    { view: 'friends', icon: '👥', title: t('nav.friends'), desc: t('landing.feature3Desc'), bg: 'mc-bg-wood', accent: 'var(--mc-gold)' },
    { view: 'vent', icon: '💬', title: t('nav.vent'), desc: t('landing.feature5Desc'), bg: 'mc-bg-netherrack', accent: 'var(--mc-redstone-red)' },
    { view: 'journal', icon: '📓', title: t('nav.journal'), desc: t('dashboard.journalDesc'), bg: 'mc-bg-wood', accent: '#C0C0C0' },
    { view: 'mood', icon: '😊', title: t('mood.title'), desc: t('mood.dashboardDesc'), bg: 'mc-bg-water', accent: 'var(--mc-emerald-green)' },
    { view: 'pomodoro', icon: '🍅', title: t('nav.pomodoro'), desc: t('pomodoro.focusTip'), bg: 'mc-bg-netherrack', accent: '#FF6B35' },
    { view: 'challenges', icon: '⚔️', title: t('nav.challenges'), desc: t('challenges.subtitle'), bg: 'mc-bg-stone', accent: '#C084FC' },
    { view: 'selfcare', icon: '💚', title: t('nav.selfcare'), desc: t('selfcare.subtitle'), bg: 'mc-bg-grass', accent: '#3AA93B' },
    { view: 'breathing', icon: '🫁', title: t('nav.breathing'), desc: t('breathing.tip1'), bg: 'mc-bg-water', accent: '#00E5FF', isNew: true },
    { view: 'gratitude', icon: '🙏', title: t('nav.gratitude'), desc: t('gratitude.prompt'), bg: 'mc-bg-sand', accent: 'var(--mc-gold)', isNew: true },
    { view: 'affirmations', icon: '✨', title: t('nav.affirmations'), desc: (t('affirm.a1') || '').slice(0, 60) + '...', bg: 'mc-bg-ender', accent: '#8B32A8', isNew: true },
    { view: 'achievements', icon: '🏆', title: t('nav.achievements'), desc: t('achievements.subtitle'), bg: 'mc-bg-sand', accent: '#FF8C00' },
    { view: 'resources', icon: '📚', title: t('nav.resources'), desc: t('resources.subtitle'), bg: 'mc-bg-stone', accent: '#00E5FF' },
    { view: 'minigame', icon: '🎮', title: t('nav.minigame'), desc: t('landing.feature4Desc'), bg: 'mc-bg-water', accent: 'var(--mc-water-blue)' },
    { view: 'accessibility', icon: '♿', title: t('nav.accessibility'), desc: t('landing.feature6Desc'), bg: 'mc-bg-sand', accent: '#A0722A' },
    { view: 'coping', icon: '🧰', title: t('nav.coping'), desc: t('dashboard.copingDesc'), bg: 'mc-bg-obsidian', accent: '#00E5FF', isNew: true },
    { view: 'safetyPlan', icon: '🛡️', title: t('nav.safetyPlan'), desc: t('dashboard.safetyPlanDesc'), bg: 'mc-bg-stone', accent: '#FF8C00', isNew: true },
    { view: 'leaderboard', icon: '🏅', title: t('nav.leaderboard'), desc: t('dashboard.leaderboardDesc'), bg: 'mc-bg-netherrack', accent: 'var(--mc-gold)', isNew: true },
    { view: 'moodInsights', icon: '📊', title: t('nav.moodInsights'), desc: t('dashboard.moodInsightsDesc'), bg: 'mc-bg-ender', accent: '#C084FC', isNew: true },
  ];

  const dashboardGrid = dashboardItems.map(item => `
    <button data-view="${item.view}" class="${item.bg} mc-border" style="text-align:left;cursor:pointer;padding:24px;transition:all 0.15s">
      <div style="font-size:2.5rem;margin-bottom:12px;position:relative">${item.icon}${item.isNew ? '<span class="mc-badge-new" style="position:absolute;top:-8px;right:-8px">NEW</span>' : ''}</div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:${item.accent};text-shadow:2px 2px 0 #000;margin:0">
        ${item.title}
      </h3>
      <p style="margin-top:8px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.6">
        ${item.desc}
      </p>
      <div style="margin-top:12px;font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);font-family:var(--mc-font)">
        ${t('landing.cta3')} →
      </div>
    </button>
  `).join('');

  const tipText = dailyTip[locale] || dailyTip.pt;

  return `
    <div style="max-width:72rem;margin:0 auto;padding:32px 16px">
      <!-- Welcome banner -->
      <div class="mc-panel mc-panel-welcome animate-pixel-slide-up" style="margin-bottom:24px">
        <div class="mc-panel-header" style="display:flex;align-items:center;gap:12px">
          <span style="font-size:1.5rem" class="animate-heart-beat">❤️</span>
          <span>${t('common.welcome')}, ${user ? user.username : ''}!</span>
          ${user && user.minecraftName ? `<span style="color:var(--mc-gold)">(${user.minecraftName})</span>` : ''}
        </div>
        <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">
          ${t('landing.description')}
        </p>
        <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:12px">
          <a href="tel:180" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 180 - ${t('emergency.call180')}</a>
          <a href="tel:192" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 192 - ${t('emergency.call192')}</a>
          <a href="tel:188" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 188 - CVV</a>
          <a href="tel:190" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">📞 190 - ${t('emergency.call190')}</a>
        </div>
      </div>

      <!-- Daily Tip + Mood Streak + Achievements Row -->
      <div style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:24px" class="md:grid-cols-3">
        <!-- Daily Tip -->
        <div class="mc-daily-tip animate-pixel-fade-in">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:8px">
            💡 ${t('dashboard.dailyTip')}
          </h4>
          <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray);line-height:1.7;padding-right:32px">
            ${tipText}
          </p>
        </div>

        <!-- Mood Streak -->
        <div class="mc-panel animate-pixel-fade-in" style="padding:16px;animation-delay:0.1s">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);text-shadow:1px 1px 0 #000;margin-bottom:8px">
            📊 ${t('dashboard.moodStreak')}
          </h4>
          <div style="display:flex;align-items:center;gap:12px">
            <span id="mc-mood-streak-val" style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-light-gray);text-shadow:2px 2px 0 #000">0</span>
            <div>
              <div id="mc-mood-streak-label" style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray)">
                ${t('mood.noData')}
              </div>
              <div class="mc-xp-bar" style="margin-top:8px;width:120px">
                <div id="mc-mood-streak-bar" class="mc-xp-bar-fill" style="width:0%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievement Showcase -->
        <div class="mc-panel animate-pixel-fade-in" style="padding:16px;animation-delay:0.2s">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:#FF8C00;text-shadow:1px 1px 0 #000">
              🏆 ${t('dashboard.achievementShowcase')}
            </h4>
            <button id="mc-view-all-achievements" style="font-size:0.6rem;color:var(--mc-diamond-blue);text-decoration:underline;cursor:pointer;font-family:var(--mc-font);background:none;border:none;padding:0">
              ${t('dashboard.viewAll')} →
            </button>
          </div>
          <div id="mc-achievement-icons" style="display:flex;gap:8px">
            <p style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray);margin:0">
              ${t('dashboard.noAchievements')}
            </p>
          </div>
        </div>
      </div>

      <!-- Section transition -->
      <div class="mc-section-transition" style="margin-bottom:24px"></div>

      <!-- Dashboard grid -->
      <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-2 lg:grid-cols-3">
        ${dashboardGrid}
      </div>
    </div>
  `;
}

export function initDashboard(t) {
  const token = get('token');

  // Dashboard grid navigation
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      setView(btn.dataset.view);
    });
  });

  // View all achievements link
  const viewAllBtn = document.getElementById('mc-view-all-achievements');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => { playClick(); setView('achievements'); });
  }

  if (!token) return;

  // Load recent achievements
  fetch('/api/achievements', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
      const achievements = (data.achievements || []).slice(0, 3);
 const container = document.getElementById('mc-achievement-icons');
      if (!container) return;
      if (achievements.length > 0) {
        container.innerHTML = achievements.map(a => `
          <div class="mc-achievement-icon" style="width:36px;height:36px;font-size:1.1rem" title="${a.title}">
            ${a.icon}
          </div>
        `).join('');
      }
    })
    .catch(() => {});

  // Load mood streak
  fetch('/api/mood?days=30', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
      const entries = data || [];
      const streakVal = document.getElementById('mc-mood-streak-val');
      const streakLabel = document.getElementById('mc-mood-streak-label');
      const streakBar = document.getElementById('mc-mood-streak-bar');

      if (!streakVal || !streakLabel || !streakBar) return;
      if (entries.length === 0) {
        streakVal.textContent = '0';
        streakLabel.textContent = t('mood.noData');
        streakBar.style.width = '0%';
        return;
      }

      let streak = 1;
      const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = new Date(sorted[i].createdAt);
        const prev = new Date(sorted[i + 1].createdAt);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
        if (diffDays <= 1) streak++;
        else break;
      }

      const streakColor = streak >= 7 ? 'var(--mc-gold)' : streak >= 3 ? 'var(--mc-emerald-green)' : 'var(--mc-light-gray)';
      streakVal.style.color = streakColor;
      streakVal.textContent = streak;
      streakLabel.textContent = `${streak} ${t('dashboard.days') || 'dias'} 🔥`;
      streakBar.style.width = `${Math.min((streak / 7) * 100, 100)}%`;
    })
    .catch(() => {});
}

export function cleanupDashboard() {
  _dashboardTimers.forEach(timer => {
    if (timer) clearTimeout(timer);
  });
  _dashboardTimers.length = 0;
}
