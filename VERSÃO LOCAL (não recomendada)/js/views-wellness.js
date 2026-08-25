/* eslint-disable no-unused-vars */
/**
 * views-wellness.js — Wellness views for MentalCraft (vanilla JS migration).
 * Each export is an object with { render(t), init(t), cleanup() }.
 *
 * render(t)  → returns an HTML string (t is the translation function).
 * init(t)    → called once after the HTML is inserted into the DOM; binds events.
 * cleanup()  → called when navigating away; clears timers / listeners.
 */

import { get, setState, setView, toggleSelfcareTask, resetDailySelfcare } from './state.js';
import { t, tCurrent } from './i18n.js';
import { playClick, playSuccess, playError, playAchievement } from './sound.js';
import { renderMarkdown } from './markdown.js';
import { showToast } from './ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. MOOD TRACKER VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _mood = {
  _timers: [],
  _selectedMood: null,
  _note: '',
  _saving: false,
  _history: [],

  render(t) {
    const user = get('user');
    if (!user) return '';

    const moodOptions = [
      { key: 'happy', emoji: '😊', label: t('mood.happy'), className: 'mc-mood-happy' },
      { key: 'sad', emoji: '😢', label: t('mood.sad'), className: 'mc-mood-sad' },
      { key: 'anxious', emoji: '😰', label: t('mood.anxious'), className: 'mc-mood-anxious' },
      { key: 'angry', emoji: '😠', label: t('mood.angry'), className: 'mc-mood-angry' },
      { key: 'calm', emoji: '😌', label: t('mood.calm'), className: 'mc-mood-calm' },
      { key: 'tired', emoji: '😴', label: t('mood.tired'), className: '' },
    ];

    const emojiMap = { happy: '😊', sad: '😢', anxious: '😰', angry: '😠', calm: '😌', tired: '😴' };

    const moodGrid = moodOptions.map(m => `
      <button data-mood-select="${m.key}" class="mc-mood-emoji ${m.className} ${this._selectedMood === m.key ? 'mc-mood-selected' : ''}">
        <span class="text-3xl">${m.emoji}</span>
        <span class="block" style="font-size:0.6rem;margin-top:4px;font-family:var(--mc-font)">${m.label}</span>
      </button>
    `).join('');

    let noteHtml = '';
    if (this._selectedMood) {
      noteHtml = `
        <div class="space-y-3 animate-pixel-fade-in">
          <textarea id="mood-note" class="mc-textarea" placeholder="${t('mood.encouragement')}" rows="3" aria-label="Note">${this._note}</textarea>
          <button id="mood-save" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._saving ? 'disabled' : ''}>
            ${this._saving ? '⏳ ...' : '💾 ' + t('mood.save')}
          </button>
        </div>`;
    }

    let historyHtml = '';
    if (this._history.length === 0) {
      historyHtml = `<p class="text-center py-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t('mood.noData')}</p>`;
    } else {
      const items = this._history.map(entry => {
        const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const noteLine = entry.note ? `<p style="margin-top:4px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${entry.note}</p>` : '';
        return `
          <div class="mc-timeline-item">
            <div class="mc-timeline-time">${dateStr}</div>
            <div class="mc-timeline-card">
              <span class="text-2xl">${emojiMap[entry.mood] || '❓'}</span>
              ${noteLine}
            </div>
          </div>`;
      }).join('');
      historyHtml = `<div class="mc-timeline">${items}</div>`;
    }

    // Mood chart
    let chartHtml = '';
    if (this._history.length > 0) {
      const moodCounts = {};
      this._history.forEach(h => { moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1; });
      const maxCount = Math.max(...Object.values(moodCounts), 1);
      const chartMoods = [
        { key: 'happy', emoji: '😊', label: t('mood.happy') },
        { key: 'sad', emoji: '😢', label: t('mood.sad') },
        { key: 'anxious', emoji: '😰', label: t('mood.anxious') },
        { key: 'angry', emoji: '😠', label: t('mood.angry') },
        { key: 'calm', emoji: '😌', label: t('mood.calm') },
        { key: 'tired', emoji: '😴', label: t('mood.tired') },
      ];
      const bars = chartMoods.map(m => {
        const count = moodCounts[m.key] || 0;
        const height = maxCount > 0 ? Math.max((count / maxCount) * 120, count > 0 ? 16 : 4) : 4;
        return `
          <div class="flex flex-col items-center gap-1 flex-1" style="max-width:60px">
            <span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-gold)">${count}</span>
            <div class="mc-mood-bar w-full" data-mood="${m.key}" style="height:${height}px;min-height:4px"></div>
            <span class="text-xl">${m.emoji}</span>
            <span style="font-family:var(--mc-font);font-size:0.5rem;color:var(--mc-stone-gray)">${m.label}</span>
          </div>`;
      }).join('');

      chartHtml = `
        <div class="mt-8">
          <div class="mc-divider-icon mb-6"><span>📊</span></div>
          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000">
            📈 ${t('mood.chartTitle')}
          </h3>
          <div class="mc-mood-chart">
            <div class="flex items-end gap-3 justify-center" style="height:160px">
              ${bars}
            </div>
          </div>
          <p class="mt-3 text-center" style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray)">
            📅 ${t('mood.last7Days')}
          </p>
        </div>`;
    }

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">📊 ${t('mood.title')}</div>
          <p class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${t('mood.select')}
          </p>
          <div class="flex flex-wrap justify-center gap-4 mb-6">
            ${moodGrid}
          </div>
          ${noteHtml}
          <div class="mt-8">
            <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold);text-shadow:2px 2px 0 #000">
              📅 ${t('mood.history')}
            </h3>
            ${historyHtml}
          </div>
          ${chartHtml}
        </div>
      </div>`;
  },

  init(t) {
    const token = get('token');

    // Load history
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/mood?days=7', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          this._history = await res.json();
          this._rerender(t);
        }
      } catch { /* ignore */ }
    };
    loadHistory();

    // Mood selection
    document.querySelectorAll('[data-mood-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        this._selectedMood = btn.dataset.moodSelect;
        this._rerender(t);
      });
    });

    // Save mood
    const saveBtn = document.getElementById('mood-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        if (!this._selectedMood) return;
        this._saving = true;
        this._rerender(t);
        try {
          const noteEl = document.getElementById('mood-note');
          const note = noteEl ? noteEl.value : '';
          this._note = note;
          const res = await fetch('/api/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ mood: this._selectedMood, note: note || undefined }),
          });
          if (res.ok) {
            showToast(t('common.success'), 'success');
            playSuccess();
            this._selectedMood = null;
            this._note = '';
            loadHistory();
          }
        } catch {
          showToast(t('common.error'), 'error');
          playError();
        }
        this._saving = false;
        this._rerender(t);
      });
    }

    // Note sync
    const noteEl = document.getElementById('mood-note');
    if (noteEl) {
      noteEl.addEventListener('input', (e) => {
        this._note = e.target.value;
      });
    }
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._rebind = null;
  },
};

export const moodView = _mood;

// ═══════════════════════════════════════════════════════════════════════════
// 2. MOOD INSIGHTS VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _moodInsights = {
  _timers: [],
  _insights: null,
  _loading: true,

  render(t) {
    const user = get('user');
    if (!user) return '';

    if (this._loading) {
      return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mc-skeleton-block lg mx-auto" style="height:500px"></div>
        </div>`;
    }

    if (!this._insights) {
      return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mc-panel animate-pixel-slide-up">
            <div class="mc-panel-header">📊 ${t('insights.title')}</div>
            <div class="mc-empty-state py-8">
              <span class="text-4xl">📋</span>
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);margin-top:12px">
                ${t('insights.noData')}
              </p>
              <button id="insights-go-mood" class="mc-btn mc-btn-primary mt-4" style="font-size:var(--mc-font-size-sm)">
                😊 ${t('mood.title')} →
              </button>
            </div>
          </div>
        </div>`;
    }

    const ins = this._insights;
    const trendIcon = ins.recentTrend === 'improving' ? '📈' : ins.recentTrend === 'declining' ? '📉' : '➡️';
    const trendColor = ins.recentTrend === 'improving' ? 'mc-insight-green' : ins.recentTrend === 'declining' ? 'mc-insight-red' : 'mc-insight-gold';
    const moodEmoji = { happy: '😊', sad: '😢', anxious: '😰', angry: '😠', calm: '😌', tired: '😴' };
    const moodColor = { happy: 'var(--mc-emerald-green)', sad: 'var(--mc-water-blue)', anxious: 'var(--mc-gold)', angry: 'var(--mc-redstone-red)', calm: '#00E5FF', tired: '#9E9E9E' };
    const maxMoodCount = Math.max(...Object.values(ins.moodCounts), 1);

    // Mood distribution bars
    const sortedMoods = Object.entries(ins.moodCounts).sort((a, b) => b[1] - a[1]);
    const distBars = sortedMoods.map(([mood, count]) => `
      <div class="mc-insight-trend-bar">
        <div class="flex items-center gap-2 mb-1">
          <span>${moodEmoji[mood] || '❓'}</span>
          <span style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-light-gray)">${mood}</span>
          <span class="ml-auto" style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-white);text-shadow:1px 1px 0 #000">${count}</span>
        </div>
        <div class="w-full h-4 overflow-hidden" style="background:var(--mc-obsidian)">
          <div class="h-full transition-all duration-500" style="width:${(count / maxMoodCount) * 100}%;background-color:${moodColor[mood] || 'var(--mc-stone-gray)'}"></div>
        </div>
      </div>`
    ).join('');

    // Weekly averages chart
    let weeklyChartHtml = '';
    if (ins.weeklyAverages && ins.weeklyAverages.length > 0) {
      const weekBars = ins.weeklyAverages.map((w) => {
        const pct = (w.avgMood / 5) * 100;
        const color = w.avgMood >= 4 ? 'var(--mc-emerald-green)' : w.avgMood >= 2.5 ? 'var(--mc-gold)' : 'var(--mc-redstone-red)';
        return `
          <div class="flex flex-col items-center gap-1 flex-1">
            <span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-white);text-shadow:1px 1px 0 #000">${w.avgMood.toFixed(1)}</span>
            <div class="w-full transition-all duration-500" style="height:${pct}%;background-color:${color};min-height:4px;max-width:40px"></div>
            <span style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-stone-gray)">${w.week}</span>
          </div>`;
      }).join('');

      weeklyChartHtml = `
        <div>
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000;margin-bottom:12px">
            📈 ${t('insights.weeklyAverage')}
          </h4>
          <div class="mc-mood-chart p-4">
            <div class="flex items-end gap-4 justify-center" style="height:120px">
              ${weekBars}
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel mc-glow-purple animate-pixel-slide-up">
          <div class="mc-panel-header">📊 ${t('insights.title')}</div>
          <p class="mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${t('insights.subtitle')}
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="mc-insight-card mc-insight-green">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000">${ins.totalEntries}</div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t('insights.totalEntries')}</div>
            </div>
            <div class="mc-insight-card mc-insight-gold">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${ins.averagePerDay.toFixed(1)}</div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t('insights.avgPerDay')}</div>
            </div>
            <div class="mc-insight-card mc-insight-green">
              <div class="mc-streak-fire" style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:${ins.currentStreak >= 7 ? 'var(--mc-gold)' : 'var(--mc-emerald-green)'};text-shadow:2px 2px 0 #000">
                ${ins.currentStreak} 🔥
              </div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t('insights.currentStreak')}</div>
            </div>
            <div class="mc-insight-card ${trendColor}">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);text-shadow:2px 2px 0 #000">
                ${trendIcon} ${t('insights.' + ins.recentTrend)}
              </div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t('insights.trend')}</div>
            </div>
          </div>

          <div class="mc-panel p-4 mb-6">
            <div class="flex items-center justify-between">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);text-shadow:1px 1px 0 #000">
                🏆 ${t('insights.longestStreak')}
              </span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">
                ${ins.longestStreak} ${t('insights.days')}
              </span>
            </div>
          </div>

          <div class="mb-6">
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:12px">
              📊 ${t('mood.chartTitle')}
            </h4>
            <div class="space-y-2">
              ${distBars}
            </div>
          </div>

          ${weeklyChartHtml}
        </div>
      </div>`;
  },

  init(t) {
    const token = get('token');

    // Go to mood tracker button
    const goMood = document.getElementById('insights-go-mood');
    if (goMood) {
      goMood.addEventListener('click', () => {
        playClick();
        setView('mood');
      });
    }

    // Fetch insights
    fetch('/api/mood/insights?days=30', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        this._insights = d;
        this._loading = false;
        this._rerender(t);
      })
      .catch(() => {
        this._loading = false;
        this._rerender(t);
      });
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._rebind = null;
  },
};

export const moodInsightsView = _moodInsights;

// ═══════════════════════════════════════════════════════════════════════════
// 3. BREATHING VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _breathing = {
  _timers: [],
  _phase: 'idle',
  _cycleCount: 0,
  _selectedPattern: '478',

  render(t) {
    const patterns = {
      '478': { name: t('breathing.pattern478'), inhale: 4000, hold: 7000, exhale: 8000, icon: '🌟' },
      box: { name: t('breathing.patternBox'), inhale: 4000, hold: 4000, exhale: 4000, icon: '📦' },
      calm: { name: t('breathing.patternCalm'), inhale: 4000, hold: 0, exhale: 6000, icon: '🌿' },
    };

    const patternBtns = Object.entries(patterns).map(([key, p]) => `
      <button data-breath-pattern="${key}" class="mc-btn px-4 py-2 ${this._selectedPattern === key ? 'mc-btn-primary' : 'mc-btn-stone'}">
        ${p.icon} ${p.name}
      </button>
    `).join('');

    const phase = this._phase;
    const phaseText = phase === 'inhale' ? t('breathing.inhale') : phase === 'hold' ? t('breathing.hold') : phase === 'exhale' ? t('breathing.exhale') : '';
    const phaseColor = phase === 'inhale' ? '#4CAF50' : phase === 'hold' ? '#FFB300' : phase === 'exhale' ? '#00E5FF' : '#3F3F3F';
    const circleClass = phase === 'inhale' ? 'inhale' : phase === 'hold' ? 'hold' : phase === 'exhale' ? 'exhale' : '';

    let phaseDesc = '';
    if (phase !== 'idle') {
      const desc = phase === 'inhale' ? t('breathing.inhaleDesc') : phase === 'hold' ? t('breathing.holdDesc') : t('breathing.exhaleDesc');
      phaseDesc = `<p class="mt-4" style="color:var(--mc-stone-gray);font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${desc}</p>`;
    }

    let controlBtn = '';
    if (phase === 'idle') {
      controlBtn = `<button id="breath-start" class="mc-btn mc-btn-primary px-8 py-3" style="font-size:var(--mc-font-size-md)">🌟 ${t('breathing.start')}</button>`;
    } else {
      controlBtn = `<button id="breath-stop" class="mc-btn mc-btn-danger px-8 py-3" style="font-size:var(--mc-font-size-md)">⏹️ ${t('breathing.stop')}</button>`;
    }

    let cycleHtml = '';
    if (this._cycleCount > 0) {
      cycleHtml = `
        <div class="text-center mb-6">
          <span class="mc-stat-number" style="color:var(--mc-diamond-blue)">${this._cycleCount}</span>
          <span class="mc-stat-label">${t('breathing.cycles')}</span>
        </div>`;
    }

    const tips = [
      { icon: '🧘', text: t('breathing.tip1') },
      { icon: '🌿', text: t('breathing.tip2') },
      { icon: '💎', text: t('breathing.tip3') },
      { icon: '🛡️', text: t('breathing.tip4') },
    ];

    const tipsHtml = tips.map(tip => `
      <div class="mc-gratitude-card p-4 flex items-start gap-3">
        <span class="text-2xl">${tip.icon}</span>
        <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.6">
          ${tip.text}
        </p>
      </div>
    `).join('');

    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-green">
          <div class="mc-panel-header">🫁 ${t('breathing.title')}</div>
          <div class="p-6">
            <div class="flex flex-wrap gap-3 mb-8 justify-center">
              ${patternBtns}
            </div>

            <div class="flex flex-col items-center mb-8">
              <div class="relative flex items-center justify-center" style="width:220px;height:220px">
                <div class="mc-breathe-ring" style="border-color:${phaseColor}"></div>
                <div class="mc-breathe-circle ${circleClass}" style="border-color:${phaseColor};background-color:${phase !== 'idle' ? phaseColor + '20' : 'transparent'}">
                  <span class="mc-breathe-text" style="color:${phaseColor}">
                    ${phaseText || '🫁'}
                  </span>
                </div>
              </div>
              ${phaseDesc}
            </div>

            <div class="flex gap-3 justify-center mb-8">
              ${controlBtn}
            </div>

            ${cycleHtml}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${tipsHtml}
            </div>
          </div>
        </div>
      </div>`;
  },

  init(t) {
    // Pattern selector
    document.querySelectorAll('[data-breath-pattern]').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        this._selectedPattern = btn.dataset.breathPattern;
        this.stopExercise();
        this._rerender(t);
      });
    });

    // Start button
    const startBtn = document.getElementById('breath-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startExercise(t);
      });
    }

    // Stop button
    const stopBtn = document.getElementById('breath-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stopExercise();
        this._rerender(t);
      });
    }
  },

  startExercise(t) {
    this._timers.forEach(clearTimeout);
    this._timers = [];

    const patterns = {
      '478': { inhale: 4000, hold: 7000, exhale: 8000 },
      box: { inhale: 4000, hold: 4000, exhale: 4000 },
      calm: { inhale: 4000, hold: 0, exhale: 6000 },
    };

    const p = patterns[this._selectedPattern];
    this._phase = 'inhale';
    this._rerender(t);

    const t1 = setTimeout(() => {
      if (p.hold > 0) {
        this._phase = 'hold';
        this._rerender(t);
        const t2 = setTimeout(() => {
          this._phase = 'exhale';
          this._rerender(t);
          const t3 = setTimeout(() => {
            this._phase = 'idle';
            this._cycleCount++;
            playSuccess();
            this._rerender(t);
          }, p.exhale);
          this._timers.push(t3);
        }, p.hold);
        this._timers.push(t2);
      } else {
        this._phase = 'exhale';
        this._rerender(t);
        const t2 = setTimeout(() => {
          this._phase = 'idle';
          this._cycleCount++;
          playSuccess();
          this._rerender(t);
        }, p.exhale);
        this._timers.push(t2);
      }
    }, p.inhale);
    this._timers.push(t1);
  },

  stopExercise() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._phase = 'idle';
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this.stopExercise();
    this._rebind = null;
  },
};

export const breathingView = _breathing;

// ═══════════════════════════════════════════════════════════════════════════
// 4. POMODORO TIMER VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _pomodoro = {
  _timers: [],
  _mode: 'focus',
  _timeLeft: 25 * 60,
  _isRunning: false,
  _sessions: 0,
  _interval: null,

  render(t) {
    const user = get('user');
    if (!user) return '';

    const minutes = Math.floor(this._timeLeft / 60);
    const seconds = this._timeLeft % 60;
    const progress = this._mode === 'focus'
      ? ((25 * 60 - this._timeLeft) / (25 * 60)) * 100
      : ((5 * 60 - this._timeLeft) / (5 * 60)) * 100;
    const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    const timerColor = this._mode === 'focus' ? 'var(--mc-emerald-green)' : 'var(--mc-gold)';

    let sessionDots = '';
    if (this._sessions > 0) {
      const dots = Array.from({ length: Math.min(this._sessions, 12) }, () =>
        `<div class="w-4 h-4 mc-border" style="background:var(--mc-redstone-red)"></div>`
      ).join('');
      const extra = this._sessions > 12 ? `<span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray)">+${this._sessions - 12}</span>` : '';
      sessionDots = `<div class="flex justify-center gap-2 mt-6">${dots}${extra}</div>`;
    }

    return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-green">
          <div class="mc-panel-header flex items-center justify-between">
            <span>🍅 ${t('pomodoro.title')}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">
              ${t('pomodoro.sessions')}: ${this._sessions}
            </span>
          </div>

          <div class="flex gap-2 mb-8">
            <button id="pomodoro-focus" class="mc-btn mc-btn-press flex-1 ${this._mode === 'focus' ? 'mc-btn-primary' : 'mc-btn-stone'}" style="font-size:var(--mc-font-size-sm)">
              ⛏️ ${t('pomodoro.focus')}
            </button>
            <button id="pomodoro-break" class="mc-btn mc-btn-press flex-1 ${this._mode === 'break' ? 'mc-btn-gold' : 'mc-btn-stone'}" style="font-size:var(--mc-font-size-sm)">
              ☕ ${t('pomodoro.break')}
            </button>
          </div>

          <div class="flex justify-center mb-8">
            <div class="mc-countdown-ring" style="--progress:${progress};width:200px;height:200px">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-3xl);color:${timerColor};text-shadow:2px 2px 0 #000">
                ${timeStr}
              </span>
            </div>
          </div>

          <p class="text-center mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${this._mode === 'focus' ? '⛏️ ' + t('pomodoro.focusTip') : '☕ ' + t('pomodoro.breakTip')}
          </p>

          <div class="flex gap-3 justify-center">
            <button id="pomodoro-toggle" class="mc-btn mc-btn-press px-8 ${this._isRunning ? 'mc-btn-danger' : 'mc-btn-primary'}" style="font-size:var(--mc-font-size-md)">
              ${this._isRunning ? '⏸ ' + t('pomodoro.pause') : '▶ ' + t('pomodoro.start')}
            </button>
            <button id="pomodoro-reset" class="mc-btn mc-btn-stone px-6" style="font-size:var(--mc-font-size-md)">
              🔄 ${t('pomodoro.reset')}
            </button>
          </div>

          ${sessionDots}
        </div>
      </div>`;
  },

  init(t) {
    // Mode buttons
    const focusBtn = document.getElementById('pomodoro-focus');
    const breakBtn = document.getElementById('pomodoro-break');

    const switchMode = (mode) => {
      playClick();
      this._mode = mode;
      this._isRunning = false;
      this._timeLeft = mode === 'focus' ? 25 * 60 : 5 * 60;
      if (this._interval) { clearInterval(this._interval); this._interval = null; }
      this._rerender(t);
      this._rebindInit(t);
    };

    if (focusBtn) focusBtn.addEventListener('click', () => switchMode('focus'));
    if (breakBtn) breakBtn.addEventListener('click', () => switchMode('break'));

    // Toggle start/pause
    const toggleBtn = document.getElementById('pomodoro-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        playClick();
        this._isRunning = !this._isRunning;
        if (this._isRunning) {
          this._startInterval(t);
        } else {
          if (this._interval) { clearInterval(this._interval); this._interval = null; }
        }
        this._rerender(t);
        this._rebindInit(t);
      });
    }

    // Reset
    const resetBtn = document.getElementById('pomodoro-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playClick();
        this._isRunning = false;
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
        this._timeLeft = this._mode === 'focus' ? 25 * 60 : 5 * 60;
        this._rerender(t);
        this._rebindInit(t);
      });
    }
  },

  _startInterval(t) {
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => {
      this._timeLeft--;
      if (this._timeLeft <= 0) {
        clearInterval(this._interval);
        this._interval = null;
        this._isRunning = false;
        if (this._mode === 'focus') {
          this._sessions++;
          playSuccess();
          showToast(t('pomodoro.completed'), 'success');
        } else {
          playClick();
        }
        this._rerender(t);
        this._rebindInit(t);
        return;
      }
      // Just update the timer display
      const timerSpan = document.querySelector('.mc-countdown-ring span');
      if (timerSpan) {
        const minutes = Math.floor(this._timeLeft / 60);
        const seconds = this._timeLeft % 60;
        timerSpan.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      }
      // Update progress
      const ring = document.querySelector('.mc-countdown-ring');
      if (ring) {
        const progress = this._mode === 'focus'
          ? ((25 * 60 - this._timeLeft) / (25 * 60)) * 100
          : ((5 * 60 - this._timeLeft) / (5 * 60)) * 100;
        ring.style.setProperty('--progress', progress);
      }
    }, 1000);
  },

  _rebindInit(t) {
    // Re-bind events after rerender without calling init() again
    const toggleBtn = document.getElementById('pomodoro-toggle');
    const resetBtn = document.getElementById('pomodoro-reset');
    const focusBtn = document.getElementById('pomodoro-focus');
    const breakBtn = document.getElementById('pomodoro-break');

    if (focusBtn) focusBtn.addEventListener('click', () => {
      playClick();
      this._mode = 'focus';
      this._isRunning = false;
      this._timeLeft = 25 * 60;
      if (this._interval) { clearInterval(this._interval); this._interval = null; }
      this._rerender(t);
      this._rebindInit(t);
    });
    if (breakBtn) breakBtn.addEventListener('click', () => {
      playClick();
      this._mode = 'break';
      this._isRunning = false;
      this._timeLeft = 5 * 60;
      if (this._interval) { clearInterval(this._interval); this._interval = null; }
      this._rerender(t);
      this._rebindInit(t);
    });
    if (toggleBtn) toggleBtn.addEventListener('click', () => {
      playClick();
      this._isRunning = !this._isRunning;
      if (this._isRunning) {
        this._startInterval(t);
      } else {
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
      }
      this._rerender(t);
      this._rebindInit(t);
    });
    if (resetBtn) resetBtn.addEventListener('click', () => {
      playClick();
      this._isRunning = false;
      if (this._interval) { clearInterval(this._interval); this._interval = null; }
      this._timeLeft = this._mode === 'focus' ? 25 * 60 : 5 * 60;
      this._rerender(t);
      this._rebindInit(t);
    });
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._rebind = null;
  },
};

export const pomodoroView = _pomodoro;

// ═══════════════════════════════════════════════════════════════════════════
// 5. SELF-CARE CHECKLIST VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _selfcare = {
  _timers: [],
  _notifiedDone: false,

  render(t) {
    const user = get('user');
    if (!user) return '';

    const selfcareTasks = get('selfcareTasks');
    const selfcareDate = get('selfcareDate');
    const today = new Date().toISOString().slice(0, 10);
    const isToday = selfcareDate === today;
    const tasks = isToday ? selfcareTasks : {};

    const taskKeys = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
    const completedCount = taskKeys.filter(k => tasks[k]).length;
    const progress = Math.round((completedCount / taskKeys.length) * 100);
    const allDone = completedCount === taskKeys.length;

    const taskItems = taskKeys.map((key) => {
      const done = tasks[key];
      return `
        <button data-selfcare-task="${key}" class="w-full text-left p-4 mc-border-2 transition-all cursor-pointer group ${done ? 'bg-[rgba(93,140,62,0.15)] border-[var(--mc-emerald-green)]' : 'bg-[var(--mc-bg)] hover:border-[var(--mc-light-gray)]'}">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 mc-border-2 flex items-center justify-center text-sm transition-all" style="background:${done ? 'var(--mc-emerald-green)' : 'var(--mc-bg-dark)'}">
              ${done ? '✓' : ''}
            </div>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${done ? 'var(--mc-emerald-green)' : 'var(--mc-light-gray)'};text-decoration:${done ? 'line-through' : 'none'};line-height:1.8;transition:all 0.3s">
              ${t('selfcare.' + key)}
            </span>
            ${done ? '<span class="ml-auto text-sm">💚</span>' : ''}
          </div>
        </button>`;
    }).join('');

    let allDoneHtml = '';
    if (allDone) {
      allDoneHtml = `
        <div class="mt-6 text-center">
          <div class="text-4xl mb-2 animate-pixel-bounce">🌟</div>
          <p class="mc-text-glow-gold" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold)">
            ${t('selfcare.allDone')}
          </p>
        </div>`;
    }

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-green">
          <div class="mc-panel-header">💚 ${t('selfcare.title')}</div>
          <p class="mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">
            ${t('selfcare.subtitle')}
          </p>

          <div class="flex items-center gap-6 mb-8">
            <div class="mc-countdown-ring" style="--progress:${progress};width:100px;height:100px">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:${allDone ? 'var(--mc-gold)' : 'var(--mc-emerald-green)'};text-shadow:2px 2px 0 #000">
                ${progress}%
              </span>
            </div>
            <div>
              <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000">
                ${t('selfcare.progress')}
              </h4>
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
                ${completedCount}/${taskKeys.length} ${t('selfcare.completed')}
              </p>
              ${allDone ? `<span class="mc-streak-fire" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">🌟 ${t('selfcare.allDone').split('!')[0]}!</span>` : ''}
            </div>
          </div>

          <div class="mc-xp-bar mb-8">
            <div class="mc-xp-bar-fill" style="width:${progress}%"></div>
          </div>

          <div class="space-y-3">
            ${taskItems}
          </div>

          ${allDoneHtml}
        </div>
      </div>`;
  },

  init(t) {
    const selfcareTasks = get('selfcareTasks');
    const selfcareDate = get('selfcareDate');
    const today = new Date().toISOString().slice(0, 10);
    const isToday = selfcareDate === today;
    const tasks = isToday ? selfcareTasks : {};
    const taskKeys = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
    const completedCount = taskKeys.filter(k => tasks[k]).length;
    const allDone = completedCount === taskKeys.length;

    if (allDone && isToday && !this._notifiedDone) {
      const notified = sessionStorage.getItem('selfcare-all-done-today');
      if (!notified) {
        showToast(t('selfcare.allDone'), 'success');
        playSuccess();
        sessionStorage.setItem('selfcare-all-done-today', '1');
        this._notifiedDone = true;
      }
    }

    // Task toggle buttons
    document.querySelectorAll('[data-selfcare-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.selfcareTask;
        playClick();
        toggleSelfcareTask(key);
        this._rerender(t);
      });
    });
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._notifiedDone = false;
    this._rebind = null;
  },
};

export const selfcareView = _selfcare;

// ═══════════════════════════════════════════════════════════════════════════
// 6. GRATITUDE WALL VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _gratitude = {
  _timers: [],
  _entries: [],
  _newEntry: '',
  _selectedEmoji: '💚',
  _loading: false,

  render(t) {
    const user = get('user');
    const emojis = ['💚', '🙏', '🌟', '❤️', '🧠', '🌈', '💎', '🌻', '🫂', '⚡'];

    const emojiPicker = emojis.map(e => `
      <button data-gratitude-emoji="${e}" class="text-2xl p-1 cursor-pointer transition-transform ${this._selectedEmoji === e ? 'scale-125' : 'opacity-60 hover:opacity-100'}">
        ${e}
      </button>
    `).join('');

    let composeHtml = '';
    if (user) {
      composeHtml = `
        <div class="mb-8 p-4" style="background:var(--mc-bg-dark);border:3px solid #000;border-radius:4px">
          <p class="mb-3" style="color:var(--mc-gold);font-family:var(--mc-font);font-size:var(--mc-font-size-md);text-shadow:1px 1px 0 #000">
            ${t('gratitude.prompt')}
          </p>
          <div class="flex flex-wrap gap-2 mb-3">
            ${emojiPicker}
          </div>
          <div class="flex gap-2">
            <input id="gratitude-input" type="text" class="mc-input flex-1" placeholder="${t('gratitude.placeholder')}" value="${this._newEntry.replace(/"/g, '&quot;')}" maxlength="200" aria-label="Gratitude entry" />
            <button id="gratitude-submit" class="mc-btn mc-btn-gold px-4" ${this._loading || !this._newEntry.trim() ? 'disabled' : ''}>
              ${this._loading ? '⛏️' : t('gratitude.post')}
            </button>
          </div>
        </div>`;
    }

    let wallHtml = '';
    if (this._entries.length === 0) {
      wallHtml = `
        <div class="col-span-2 text-center py-12">
          <span class="text-4xl block mb-4">🌻</span>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-stone-gray)">
            ${t('gratitude.empty')}
          </p>
        </div>`;
    } else {
      wallHtml = this._entries.map(entry => `
        <div class="mc-gratitude-card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">${entry.emoji}</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000">
                ${entry.username}
              </span>
            </div>
            <button data-gratitude-like="${entry.id}" class="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
              <span class="mc-gratitude-heart">❤️</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-redstone-red)">${entry.likes}</span>
            </button>
          </div>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-text);line-height:1.8">
            ${entry.content}
          </p>
          <p class="mt-2 mc-chat-timestamp">
            ${new Date(entry.createdAt).toLocaleDateString()}
          </p>
        </div>
      `).join('');
    }

    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header">🙏 ${t('gratitude.title')}</div>
          <div class="p-6">
            ${composeHtml}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto" style="scrollbar-width:thin">
              ${wallHtml}
            </div>
          </div>
        </div>
      </div>`;
  },

  init(t) {
    const token = get('token');
    const user = get('user');

    // Load entries
    const loadEntries = async () => {
      try {
        const res = await fetch('/api/gratitude');
        if (res.ok) {
          const data = await res.json();
          this._entries = data.entries || [];
          this._rerender(t);
        }
      } catch { /* use local */ }
    };
    loadEntries();

    // Emoji picker
    document.querySelectorAll('[data-gratitude-emoji]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selectedEmoji = btn.dataset.gratitudeEmoji;
        this._rerender(t);
      });
    });

    // Input sync
    const input = document.getElementById('gratitude-input');
    if (input) {
      input.addEventListener('input', (e) => {
        this._newEntry = e.target.value;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._submitEntry(t);
      });
    }

    // Submit button
    const submitBtn = document.getElementById('gratitude-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._submitEntry(t));
    }

    // Like buttons
    document.querySelectorAll('[data-gratitude-like]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!token) {
          showToast(t('errors.loginRequired'), 'error');
          return;
        }
        const id = btn.dataset.gratitudeLike;
        // Optimistic update
        this._entries = this._entries.map(e => e.id === id ? { ...e, likes: e.likes + 1 } : e);
        this._rerender(t);
        fetch(`/api/gratitude/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { /* optimistic */ });
      });
    });
  },

  async _submitEntry(t) {
    if (!this._newEntry.trim()) return;
    const token = get('token');
    const user = get('user');
    this._loading = true;
    this._rerender(t);

    try {
      const res = await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: this._newEntry.trim(), emoji: this._selectedEmoji }),
      });
      if (res.ok) {
        const data = await res.json();
        this._entries = [data.entry, ...this._entries].slice(0, 50);
        this._newEntry = '';
        showToast(t('common.success'), 'success');
      }
    } catch {
      // Offline: add locally
      this._entries = [{
        id: Date.now().toString(),
        username: user?.username || 'Steve',
        content: this._newEntry.trim(),
        emoji: this._selectedEmoji,
        createdAt: new Date().toISOString(),
        likes: 0,
      }, ...this._entries].slice(0, 50);
      this._newEntry = '';
    }
    this._loading = false;
    this._rerender(t);
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._rebind = null;
  },
};

export const gratitudeView = _gratitude;

// ═══════════════════════════════════════════════════════════════════════════
// 7. DAILY AFFIRMATIONS VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _affirmations = {
  _timers: [],
  _currentIdx: -1,
  _showAll: false,
  _favorites: [],

  _getAffirmations(t) {
    return [
      { text: t('affirm.a1'), category: t('affirm.catSelf') },
      { text: t('affirm.a2'), category: t('affirm.catSelf') },
      { text: t('affirm.a3'), category: t('affirm.catStrength') },
      { text: t('affirm.a4'), category: t('affirm.catGrowth') },
      { text: t('affirm.a5'), category: t('affirm.catSelf') },
      { text: t('affirm.a6'), category: t('affirm.catStrength') },
      { text: t('affirm.a7'), category: t('affirm.catGrowth') },
      { text: t('affirm.a8'), category: t('affirm.catSelf') },
      { text: t('affirm.a9'), category: t('affirm.catStrength') },
      { text: t('affirm.a10'), category: t('affirm.catGrowth') },
      { text: t('affirm.a11'), category: t('affirm.catSelf') },
      { text: t('affirm.a12'), category: t('affirm.catStrength') },
    ];
  },

  _getDayIndex() {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % 12;
  },

  render(t) {
    const affirmations = this._getAffirmations(t);
    const dayIndex = this._getDayIndex();
    const safeIdx = this._currentIdx === -1 ? dayIndex : this._currentIdx;
    const current = affirmations[safeIdx];
    if (!current) return '';

    const catColors = {
      [t('affirm.catSelf')]: '#4CAF50',
      [t('affirm.catStrength')]: '#FFB300',
      [t('affirm.catGrowth')]: '#00E5FF',
    };
    const currentColor = catColors[current.category] || '#4CAF50';
    const isFav = this._favorites.includes(safeIdx.toString());

    // Favorites section
    let favoritesHtml = '';
    if (this._favorites.length > 0) {
      const favCards = this._favorites.map(fIdx => {
        const a = affirmations[parseInt(fIdx)];
        if (!a) return '';
        return `
          <div class="mc-gratitude-card p-3">
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
              &ldquo;${a.text}&rdquo;
            </p>
          </div>`;
      }).join('');

      favoritesHtml = `
        <div class="mb-8">
          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-redstone-red);text-shadow:1px 1px 0 #000">
            💖 ${t('affirm.favorites')} (${this._favorites.length})
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${favCards}
          </div>
        </div>`;
    }

    // Show all section
    let allHtml = '';
    if (this._showAll) {
      const categories = [...new Set(affirmations.map(a => a.category))];
      const catSections = categories.map(cat => {
        const catAffirmations = affirmations.filter(a => a.category === cat);
        const catColor = catColors[cat] || '#4CAF50';
        const cards = catAffirmations.map(a => {
          const idx = affirmations.indexOf(a);
          return `
            <div data-affirm-goto="${idx}" class="mc-gratitude-card p-3 cursor-pointer hover:border-[var(--mc-diamond-blue)] transition-colors">
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
                &ldquo;${a.text}&rdquo;
              </p>
            </div>`;
        }).join('');
        return `
          <div class="mb-4">
            <h4 class="mb-2" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${catColor};text-shadow:1px 1px 0 #000">
              ${cat}
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${cards}
            </div>
          </div>`;
      }).join('');

      allHtml = `<div>${catSections}</div>`;
    }

    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-purple">
          <div class="mc-panel-header">✨ ${t('affirm.title')}</div>
          <div class="p-6">
            <div class="mc-affirmation-card mb-8 p-8 text-center">
              <div class="mb-4">
                <span class="inline-block px-3 py-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);background:${currentColor}30;color:${currentColor};border:2px solid ${currentColor};text-shadow:1px 1px 0 #000">
                  ${current.category}
                </span>
              </div>
              <p class="mc-affirmation-text mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-white);text-shadow:2px 2px 0 #000;line-height:1.8">
                &ldquo;${current.text}&rdquo;
              </p>
              <div class="flex items-center justify-center gap-4">
                <button id="affirm-prev" class="mc-btn mc-btn-stone px-4 py-2">◀</button>
                <button id="affirm-fav" class="text-2xl cursor-pointer hover:scale-125 transition-transform">
                  ${isFav ? '💖' : '🤍'}
                </button>
                <button id="affirm-next" class="mc-btn mc-btn-stone px-4 py-2">▶</button>
              </div>
              <p class="mt-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">
                ${safeIdx + 1} / ${affirmations.length}
              </p>
            </div>

            ${favoritesHtml}

            <button id="affirm-toggle-all" class="mc-btn mc-btn-diamond mb-4 px-4 py-2">
              ${this._showAll ? '🔼 ' + t('affirm.hideAll') : '📋 ' + t('affirm.showAll')}
            </button>

            ${allHtml}
          </div>
        </div>
      </div>`;
  },

  init(t) {
    const affirmations = this._getAffirmations(t);
    const dayIndex = this._getDayIndex();

    // Previous
    const prevBtn = document.getElementById('affirm-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        playSuccess();
        const curr = this._currentIdx === -1 ? dayIndex : this._currentIdx;
        this._currentIdx = (curr - 1 + affirmations.length) % affirmations.length;
        this._rerender(t);
      });
    }

    // Next
    const nextBtn = document.getElementById('affirm-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        playSuccess();
        const curr = this._currentIdx === -1 ? dayIndex : this._currentIdx;
        this._currentIdx = (curr + 1) % affirmations.length;
        this._rerender(t);
      });
    }

    // Favorite toggle
    const favBtn = document.getElementById('affirm-fav');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        const safeIdx = this._currentIdx === -1 ? dayIndex : this._currentIdx;
        const idxStr = safeIdx.toString();
        if (this._favorites.includes(idxStr)) {
          this._favorites = this._favorites.filter(f => f !== idxStr);
        } else {
          this._favorites = [...this._favorites, idxStr];
        }
        this._rerender(t);
      });
    }

    // Toggle show all
    const toggleAllBtn = document.getElementById('affirm-toggle-all');
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        playClick();
        this._showAll = !this._showAll;
        this._rerender(t);
      });
    }

    // Go-to affirmation (click in show-all list)
    document.querySelectorAll('[data-affirm-goto]').forEach(el => {
      el.addEventListener('click', () => {
        playSuccess();
        this._currentIdx = parseInt(el.dataset.affirmGoto);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this._rerender(t);
      });
    });
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._rebind = null;
  },
};

export const affirmationsView = _affirmations;
