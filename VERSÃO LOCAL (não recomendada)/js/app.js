// ===== MENTALCRAFT - MAIN APPLICATION =====
// Pure Vanilla JavaScript - No React, No Next.js, No Frameworks

import { get, setState, setView, subscribe } from './state.js';
import { t, tCurrent, getCurrentLocale, setLocale } from './i18n.js';

// UI Components
import {
  showToast,
  renderHeader, initHeader,
  renderFooter,
  renderParticles,
  renderLanding, initLanding, cleanupLanding,
  renderAuth, initAuth,
  renderDashboard, initDashboard, cleanupDashboard,
} from './ui.js';

// Tool Views
import {
  chatbotView,
  quizView,
  friendsView,
  ventView,
  journalView,
  minigameView,
  studyHelpView,
} from './views-tools.js';

// Wellness Views
import {
  moodView,
  moodInsightsView,
  breathingView,
  pomodoroView,
  selfcareView,
  gratitudeView,
  affirmationsView,
} from './views-wellness.js';

// Feature Views
import {
  achievementsView,
  challengesView,
  copingView,
  safetyPlanView,
  resourcesView,
  adminView,
  profileView,
  accessibilityView,
  leaderboardView,
} from './views-features.js';

// ===== VIEW REGISTRY =====
const PUBLIC_VIEWS = ['landing', 'login', 'register', 'accessibility'];
const ADMIN_VIEWS = ['admin', 'admin-reports', 'admin-users', 'admin-messages'];

const viewRegistry = {
  landing: { render: renderLanding, init: initLanding, cleanup: cleanupLanding },
  login: { render: (t) => renderAuth(t, 'login'), init: (t) => initAuth(t, 'login'), cleanup: () => {} },
  register: { render: (t) => renderAuth(t, 'register'), init: (t) => initAuth(t, 'register'), cleanup: () => {} },
  dashboard: { render: renderDashboard, init: initDashboard, cleanup: cleanupDashboard },
  chatbot: chatbotView,
  quiz: quizView,
  friends: friendsView,
  vent: ventView,
  journal: journalView,
  minigame: minigameView,
  mood: moodView,
  moodInsights: moodInsightsView,
  breathing: breathingView,
  pomodoro: pomodoroView,
  selfcare: selfcareView,
  gratitude: gratitudeView,
  affirmations: affirmationsView,
  challenges: challengesView,
  coping: copingView,
  safetyPlan: safetyPlanView,
  resources: resourcesView,
  admin: adminView,
  profile: profileView,
  accessibility: accessibilityView,
  leaderboard: leaderboardView,
  studyHelp: studyHelpView,
  // Admin sub-views redirect to admin
  'admin-reports': adminView,
  'admin-users': adminView,
  'admin-messages': adminView,
};

// ===== STATE =====
let currentCleanup = null;
let currentView = null;

// ===== DOM ELEMENTS =====
const $app = () => document.getElementById('mc-app');
const $main = () => document.getElementById('mc-main');
const $header = () => document.getElementById('mc-header');
const $footer = () => document.getElementById('mc-footer');
const $body = () => document.getElementById('mc-body');

// ===== ROUTER =====
function navigate(view) {
  // Auth guard
  const user = get('user');
  if (!PUBLIC_VIEWS.includes(view) && !user) {
    view = 'login';
  }
  if (ADMIN_VIEWS.includes(view) && (!user || user.role !== 'admin')) {
    view = 'landing';
  }

  // Cleanup previous view
  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.warn('Cleanup error:', e); }
    currentCleanup = null;
  }

  // Update state
  setState({ currentView: view });
  currentView = view;

  // Re-render header (to update active states)
  renderHeaderAndUpdate(view);

  // Render view
  const main = $main();
  if (!main) return;

  const viewDef = viewRegistry[view];
  if (viewDef) {
    main.innerHTML = `<div class="animate-pixel-fade-in">${viewDef.render(t)}</div>`;
    try {
      viewDef.init(t);
      if (viewDef.cleanup) currentCleanup = viewDef.cleanup;
    } catch (e) {
      console.error('View init error:', view, e);
      main.innerHTML = `<div class="mc-panel p-8 text-center"><p style="font-family:var(--mc-font);color:var(--mc-redstone-red)">Error loading view: ${e.message}</p></div>`;
    }
  } else {
    main.innerHTML = `<div class="mc-panel p-8 text-center"><p style="font-family:var(--mc-font);color:var(--mc-gold)">View not found: ${view}</p></div>`;
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

function renderHeaderAndUpdate(view) {
  const header = $header();
  const footer = $footer();
  if (header) {
    header.innerHTML = renderHeader(t);
    initHeader(t);
  }
  if (footer) {
    footer.innerHTML = renderFooter(t);
  }
}

// ===== BODY CLASSES =====
function updateBodyClasses() {
  const body = $body();
  if (!body) return;
  const highContrast = get('highContrast');
  const largeText = get('largeText');
  const biome = get('biomeTheme') || 'forest';
  body.className = 'min-h-screen flex flex-col'
    + (highContrast ? ' high-contrast' : '')
    + (largeText ? ' large-text' : '')
    + ` mc-biome-${biome}`;
}

// ===== INITIALIZATION =====
function init() {
  console.log('⛏️ MentalCraft initializing...');

  // Set initial body classes
  updateBodyClasses();

  // Render header and footer
  const header = $header();
  const footer = $footer();
  if (header) {
    header.innerHTML = renderHeader(t);
    initHeader(t);
  }
  if (footer) {
    footer.innerHTML = renderFooter(t);
  }

  // Subscribe to state changes that affect layout
  subscribe('highContrast', updateBodyClasses);
  subscribe('largeText', updateBodyClasses);
  subscribe('biomeTheme', updateBodyClasses);
  subscribe('currentLocale', () => {
    navigate(get('currentView') || 'landing');
  });

  // Subscribe to view changes from other components
  subscribe('currentView', (view) => {
    if (view !== currentView) navigate(view);
  });

  // Navigate to initial view
  const initialView = get('currentView') || 'landing';
  navigate(initialView);

  // Global click handler for navigation via data-view
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-view]');
    if (navEl) {
      e.preventDefault();
      const view = navEl.getAttribute('data-view');
      if (view) navigate(view);
    }
    const backEl = e.target.closest('[data-back]');
    if (backEl) {
      e.preventDefault();
      navigate('landing');
    }
  });

  console.log('✅ MentalCraft ready!');
}

// ===== BOOT =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
export { navigate, init };
