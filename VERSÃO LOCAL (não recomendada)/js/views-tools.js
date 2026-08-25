/* eslint-disable no-unused-vars */
/**
 * views-tools.js — Tool views for MentalCraft (vanilla JS migration).
 * Each export is an object with { render(t), init(t), cleanup() }.
 *
 * render(t)  → returns an HTML string (t is the translation function).
 * init(t)    → called once after the HTML is inserted into the DOM; binds events.
 * cleanup()  → called when navigating away; clears timers / listeners.
 */

import {
  get, setState, setView, setAuth,
  addChatMessage, clearChatMessages,
  setFriends, setFriendRequests,
  addVentMessage, setVentMessages,
  setQuizResult, addNotification,
} from './state.js';
import { t, tCurrent } from './i18n.js';
import { playClick, playSuccess, playError, playAchievement } from './sound.js';
import { renderMarkdown } from './markdown.js';
import { showToast } from './ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. CHATBOT VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _chatbot = {
  _timers: [],
  _loading: false,

  render(t) {
    const msgs = get('chatMessages');
    const hasUserMsgs = msgs.filter(m => m.role === 'user').length > 0;

    let suggestionsHtml = '';
    if (!hasUserMsgs) {
      const sugs = [t('chatbot.sug1'), t('chatbot.sug2'), t('chatbot.sug3'), t('chatbot.sug4'), t('chatbot.sug5'), t('chatbot.sug6')];
      suggestionsHtml = `
        <div class="px-4 pt-3">
          <p style="margin-bottom:8px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t('chatbot.suggestions')}</p>
          <div class="flex gap-2 overflow-x-auto pb-2" style="scrollbar-width:thin">
            ${sugs.map((s, i) => `<button data-chatbot-sug="${i}" class="mc-btn mc-btn-stone whitespace-nowrap" style="font-size:var(--mc-font-size-sm)">${s}</button>`).join('')}
          </div>
        </div>`;
    }

    const messagesHtml = msgs.map(msg => {
      const isUser = msg.role === 'user';
      const bubbleClass = isUser ? 'mc-chat-bubble-sent' : 'mc-chat-bubble-received';
      const label = isUser
        ? `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">🧑‍🌾 ${t('chatbot.you')}</span>`
        : `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">🤖 MineBot</span>`;
      const content = isUser
        ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>`
        : renderMarkdown(msg.content);
      return `<div class="mc-chat-bubble ${bubbleClass}"><div class="flex items-center gap-2 mb-1">${label}</div><div>${content}</div></div>`;
    }).join('');

    const typingHtml = this._loading
      ? `<div class="mc-chat-bubble mc-chat-bubble-received"><div class="flex items-center gap-2"><span class="animate-pixel-bounce">⛏️</span><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t('chatbot.typing')}</span></div></div>`
      : '';

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-blue mc-nether-bg" style="height:calc(100vh - 200px);display:flex;flex-direction:column">
          <div class="mc-nether-particles">
            ${Array.from({ length: 12 }, (_, i) => `<div class="mc-nether-particle" style="left:${(i * 37 + 13) % 100}%;animation-delay:${(i * 1.3) % 5}s;animation-duration:${3 + (i * 0.7) % 4}s"></div>`).join('')}
          </div>
          <div class="mc-panel-header flex items-center justify-between">
            <span>🤖 ${t('chatbot.title')}</span>
            <button data-chatbot-speak class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">🔊</button>
          </div>
          ${suggestionsHtml}
          <div id="chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3" style="background:#0A0A0A">
            ${messagesHtml}
            ${typingHtml}
          </div>
          <div class="p-3" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
            <div class="flex gap-2">
              <input id="chatbot-input" type="text" class="mc-input flex-1" placeholder="${t('chatbot.placeholder')}" ${this._loading ? 'disabled' : ''} aria-label="${t('chatbot.placeholder')}" />
              <button id="chatbot-send" class="mc-btn mc-btn-primary" ${this._loading ? 'disabled' : ''}>${this._loading ? '⛏️' : '➡️'}</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  init(t) {
    // Seed welcome message if first visit
    const msgs = get('chatMessages');
    if (msgs.length === 0) {
      addChatMessage({ id: '1', role: 'assistant', content: '🤖 ' + t('chatbot.welcome') });
    }

    const scrollContainer = () => {
      const el = document.getElementById('chatbot-messages');
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    // Scroll on init
    setTimeout(scrollContainer, 50);

    const sendMessage = async (overrideText) => {
      if (this._loading) return;
      const input = document.getElementById('chatbot-input');
      const textToSend = overrideText || (input ? input.value : '');
      if (!textToSend.trim()) return;

      const userMsg = { id: Date.now().toString(), role: 'user', content: textToSend.trim() };
      addChatMessage(userMsg);
      if (input) input.value = '';
      this._loading = true;
      playClick();
      // Re-render the dynamic parts
      this._refreshMessages(t);

      try {
        const history = get('chatMessages').filter(m => m.id !== '1').map(m => ({ role: m.role, content: m.content }));
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg.content, history }),
        });
        const data = await res.json();
        addChatMessage({
          id: Date.now().toString() + 'r',
          role: 'assistant',
          content: data.reply || t('chatbot.processError'),
        });
      } catch {
        addChatMessage({
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: t('chatbot.connectionError'),
        });
      } finally {
        this._loading = false;
        this._refreshMessages(t);
        setTimeout(scrollContainer, 50);
      }
    };

    // Send button
    const sendBtn = document.getElementById('chatbot-send');
    if (sendBtn) sendBtn.addEventListener('click', () => sendMessage());

    // Enter key
    const inputEl = document.getElementById('chatbot-input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
      inputEl.focus();
    }

    // Suggestion buttons
    document.querySelectorAll('[data-chatbot-sug]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sugs = [t('chatbot.sug1'), t('chatbot.sug2'), t('chatbot.sug3'), t('chatbot.sug4'), t('chatbot.sug5'), t('chatbot.sug6')];
        const idx = parseInt(btn.getAttribute('data-chatbot-sug'), 10);
        if (!isNaN(idx) && sugs[idx]) sendMessage(sugs[idx]);
      });
    });

    // Speak button
    const speakBtn = document.querySelector('[data-chatbot-speak]');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const msgs = get('chatMessages');
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant') {
          const u = new SpeechSynthesisUtterance(last.content);
          u.lang = 'pt-BR';
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        }
      });
    }
  },

  _refreshMessages(t) {
    const container = document.getElementById('chatbot-messages');
    const sendBtn = document.getElementById('chatbot-send');
    if (!container) return;

    const msgs = get('chatMessages');
    const messagesHtml = msgs.map(msg => {
      const isUser = msg.role === 'user';
      const bubbleClass = isUser ? 'mc-chat-bubble-sent' : 'mc-chat-bubble-received';
      const label = isUser
        ? `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">🧑‍🌾 ${t('chatbot.you')}</span>`
        : `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">🤖 MineBot</span>`;
      const content = isUser
        ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>`
        : renderMarkdown(msg.content);
      return `<div class="mc-chat-bubble ${bubbleClass}"><div class="flex items-center gap-2 mb-1">${label}</div><div>${content}</div></div>`;
    }).join('');

    const typingHtml = this._loading
      ? `<div class="mc-chat-bubble mc-chat-bubble-received"><div class="flex items-center gap-2"><span class="animate-pixel-bounce">⛏️</span><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t('chatbot.typing')}</span></div></div>`
      : '';

    container.innerHTML = messagesHtml + typingHtml;
    if (sendBtn) sendBtn.innerHTML = this._loading ? '⛏️' : '➡️';
    const inputEl = document.getElementById('chatbot-input');
    if (inputEl) inputEl.disabled = this._loading;

    setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 50);
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._loading = false;
  },
};

export const chatbotView = _chatbot;

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUIZ VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _quiz = {
  _timers: [],
  _currentQ: 0,
  _answers: null,
  _finished: false,
  _result: null,
  _loading: false,

  render(t) {
    if (this._finished && this._result) {
      return this._renderResult(t);
    }
    return this._renderQuiz(t);
  },

  _renderQuiz(t) {
    const questions = this._getQuestions(t);
    const q = questions[this._currentQ];
    const progress = ((this._currentQ + 1) / 20) * 100;
    const allAnswered = !this._answers.includes(null);

    const optionsHtml = q.opts.map((opt, i) => {
      const selected = this._answers[this._currentQ] === i;
      const bg = selected ? 'background:#2E5E1E;border-color:var(--mc-emerald-green)' : 'background:#1E1E1E;border-color:#3F3F3F';
      const letterBg = selected ? 'background:var(--mc-emerald-green);color:#000' : 'background:#3F3F3F;color:#fff';
      const letter = String.fromCharCode(65 + i);
      return `
        <button data-quiz-opt="${i}" class="w-full text-left p-3 mc-border-2 transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid">
          <span class="mr-2 inline-block text-center leading-6" style="width:24px;height:24px;border:2px solid #000;font-size:12px;${letterBg}">${letter}</span>
          ${opt}
        </button>`;
    }).join('');

    const nextBtn = this._currentQ === 19
      ? `<button id="quiz-submit" class="mc-btn mc-btn-gold" style="font-size:var(--mc-font-size-sm)" ${this._loading || !allAnswered ? 'disabled' : ''}>${this._loading ? '⏳ ...' : '🏁 ' + t('quiz.finish')}</button>`
      : `<button id="quiz-next" class="mc-btn mc-btn-primary" style="font-size:var(--mc-font-size-sm)" ${this._answers[this._currentQ] === null ? 'disabled' : ''}>${t('quiz.next')} →</button>`;

    return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header flex items-center justify-between">
            <span>📝 ${t('quiz.title')}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">${this._currentQ + 1}/20</span>
          </div>
          <div class="mc-xp-bar mb-6"><div class="mc-xp-bar-fill" style="width:${progress}%"></div></div>
          <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);line-height:1.8;margin-bottom:16px">${q.q}</h3>
          <div class="space-y-3">${optionsHtml}</div>
          <div class="flex justify-between mt-6">
            <button id="quiz-prev" class="mc-btn mc-btn-stone" style="font-size:var(--mc-font-size-sm)" ${this._currentQ === 0 ? 'disabled' : ''}>← ${t('quiz.previous')}</button>
            ${nextBtn}
          </div>
        </div>
      </div>`;
  },

  _renderResult(t) {
    const r = this._result;
    const emoji = r.percentage >= 80 ? '🏆' : r.percentage >= 60 ? '⭐' : r.percentage >= 40 ? '📚' : '💪';
    const color = r.percentage >= 80 ? 'var(--mc-gold)' : r.percentage >= 60 ? 'var(--mc-emerald-green)' : r.percentage >= 40 ? 'var(--mc-diamond-blue)' : 'var(--mc-redstone-red)';
    return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-fade-in text-center">
          <div class="mc-panel-header">📝 ${t('quiz.result')}</div>
          <div class="text-6xl my-6 animate-pixel-bounce">${emoji}</div>
          <div class="mc-xp-bar mb-4" style="max-width:300px;margin:0 auto 16px"><div class="mc-xp-bar-fill" style="width:${r.percentage}%"></div></div>
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:${color};text-shadow:2px 2px 0 #000">${r.score}/${r.total}</h2>
          <p class="mt-2" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-light-gray)">${r.percentage}% ${t('quiz.score')}</p>
          <button id="quiz-reset" class="mc-btn mc-btn-primary mt-6">🔄 ${t('quiz.restart')}</button>
        </div>
      </div>`;
  },

  _getQuestions(t) {
    return Array.from({ length: 20 }, (_, i) => ({
      q: t(`quiz.q${i + 1}`),
      opts: [t(`quiz.q${i + 1}o1`), t(`quiz.q${i + 1}o2`), t(`quiz.q${i + 1}o3`), t(`quiz.q${i + 1}o4`)],
    }));
  },

  init(t) {
    if (!this._answers) {
      this._answers = Array(20).fill(null);
    }

    const rebind = () => {
      // Option clicks
      document.querySelectorAll('[data-quiz-opt]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-quiz-opt'), 10);
          this._answers[this._currentQ] = idx;
          playClick();
          this._rerender(t);
        });
      });

      // Previous
      const prevBtn = document.getElementById('quiz-prev');
      if (prevBtn) prevBtn.addEventListener('click', () => {
        this._currentQ = Math.max(0, this._currentQ - 1);
        playClick();
        this._rerender(t);
      });

      // Next
      const nextBtn = document.getElementById('quiz-next');
      if (nextBtn) nextBtn.addEventListener('click', () => {
        this._currentQ++;
        playClick();
        this._rerender(t);
      });

      // Submit
      const submitBtn = document.getElementById('quiz-submit');
      if (submitBtn) submitBtn.addEventListener('click', () => this._submitQuiz(t));

      // Reset
      const resetBtn = document.getElementById('quiz-reset');
      if (resetBtn) resetBtn.addEventListener('click', () => {
        this._currentQ = 0;
        this._answers = Array(20).fill(null);
        this._finished = false;
        this._result = null;
        playClick();
        this._rerender(t);
      });
    };

    rebind();
    this._rebind = rebind;
  },

  async _submitQuiz(t) {
    this._loading = true;
    this._rerender(t);
    try {
      const token = get('token');
      const answers = this._answers.filter(a => a !== null);
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      this._result = data;
      this._finished = true;
      setQuizResult(data.score, data.total);
      playSuccess();
    } catch {
      showToast(t('quiz.submitError'), 'error');
      playError();
    } finally {
      this._loading = false;
      this._rerender(t);
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

export const quizView = _quiz;

// ═══════════════════════════════════════════════════════════════════════════
// 3. FRIENDS VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _friends = {
  _timers: [],
  _friends: [],
  _requests: [],
  _activeChat: null,  // { id, username }
  _chatMessages: [],
  _loading: false,
  _rebind: null,

  render(t) {
    const user = get('user');
    if (!user) return '';

    // Friends list
    const friendsHtml = this._friends.length === 0
      ? `<p class="text-center py-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t('friends.noFriends')}</p>`
      : this._friends.map(f => {
        const isActive = this._activeChat && this._activeChat.id === f.id;
        const bg = isActive ? 'background:#2E5E1E;border-color:var(--mc-emerald-green)' : 'background:var(--mc-bg)';
        const nameColor = f.isOnline ? 'var(--mc-emerald-green)' : 'var(--mc-light-gray)';
        const dotClass = f.isOnline ? 'bg-[#4CAF50] animate-pixel-pulse' : 'bg-[var(--mc-stone-gray)]';
        const mcName = f.minecraftName ? `<div style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-gold)">⛏️ ${f.minecraftName}</div>` : '';
        return `
          <button data-friend-id="${f.id}" class="w-full flex items-center gap-3 p-3 mc-border-2 transition-all cursor-pointer text-left" style="${bg};border-width:2px;border-style:solid">
            <div class="w-3 h-3 rounded-full ${dotClass}" style="flex-shrink:0"></div>
            <div>
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${nameColor}">${f.username}</div>
              ${mcName}
            </div>
          </button>`;
        }).join('');

    // Pending requests
    let requestsHtml = '';
    if (this._requests.length > 0) {
      const reqItems = this._requests.map(req => `
        <div class="flex items-center justify-between p-2 mc-border-2" style="background:var(--mc-bg);border-width:2px;border-style:solid">
          <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${req.fromUser.username}</span>
          <div class="flex gap-2">
            <button data-req-accept="${req.id}" class="mc-btn mc-btn-primary py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">✓</button>
            <button data-req-reject="${req.id}" class="mc-btn mc-btn-danger py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">✕</button>
          </div>
        </div>`
      ).join('');
      requestsHtml = `
        <div class="mc-panel animate-pixel-fade-in">
          <div class="mc-panel-header">📨 ${t('friends.pending')}</div>
          <div class="space-y-2 max-h-48 overflow-y-auto">${reqItems}</div>
        </div>`;
    }

    // Chat area
    let chatHtml;
    if (this._activeChat) {
      const chatMsgsHtml = this._chatMessages.map(msg => {
        const isMine = msg.senderId === user.id;
        const cls = isMine ? 'mc-chat-bubble-sent' : 'mc-chat-bubble-received';
        return `<div class="mc-chat-bubble ${cls}"><p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.6">${msg.content}</p></div>`;
      }).join('');

      chatHtml = `
        <div class="mc-panel-header flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#4CAF50]" style="flex-shrink:0"></span>
          <span>${this._activeChat.username}</span>
        </div>
        <div id="friends-chat-messages" class="flex-1 overflow-y-auto p-3 space-y-2" style="background:#0A0A0A">${chatMsgsHtml}</div>
        <div class="p-3 flex gap-2" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
          <input id="friends-chat-input" class="mc-input flex-1" placeholder="${t('friends.message')}" />
          <button id="friends-chat-send" class="mc-btn mc-btn-primary">➡️</button>
        </div>`;
    } else {
      chatHtml = `
        <div class="flex-1 flex items-center justify-center" style="background:#0A0A0A">
          <p class="text-center" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-stone-gray)">
            👥 ${t('friends.search')}<br />💬
          </p>
        </div>`;
    }

    return `
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-6">
            <div class="mc-panel animate-pixel-slide-up">
              <div class="mc-panel-header">🔍 ${t('friends.title')}</div>
              <div class="space-y-3">
                <input id="friends-search" class="mc-input" placeholder="${t('friends.search')}" />
                <input id="friends-msg" class="mc-input" placeholder="${t('friends.requestMsg')}" />
                <button id="friends-send-req" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._loading ? 'disabled' : ''}>
                  ${this._loading ? '⏳ ...' : '📨 ' + t('friends.sendRequest')}
                </button>
              </div>
            </div>
            ${requestsHtml}
            <div class="mc-panel animate-pixel-fade-in">
              <div class="mc-panel-header">👥 ${t('friends.title')}</div>
              <div class="space-y-2 max-h-96 overflow-y-auto">${friendsHtml}</div>
            </div>
          </div>
          <div class="mc-panel animate-pixel-slide-up" style="height:600px;display:flex;flex-direction:column">
            ${chatHtml}
          </div>
        </div>
      </div>`;
  },

  init(t) {
    this._loadData(t);

    const rebind = () => {
      // Send friend request
      const sendReqBtn = document.getElementById('friends-send-req');
      if (sendReqBtn) sendReqBtn.addEventListener('click', () => this._sendRequest(t));

      // Accept / reject
      document.querySelectorAll('[data-req-accept]').forEach(btn => {
        btn.addEventListener('click', () => this._handleRequest(btn.getAttribute('data-req-accept'), 'accept', t));
      });
      document.querySelectorAll('[data-req-reject]').forEach(btn => {
        btn.addEventListener('click', () => this._handleRequest(btn.getAttribute('data-req-reject'), 'reject', t));
      });

      // Open friend chat
      document.querySelectorAll('[data-friend-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-friend-id');
          const friend = this._friends.find(f => f.id === id);
          if (friend) this._openChat(friend, t);
        });
      });

      // Send chat message
      const chatSendBtn = document.getElementById('friends-chat-send');
      if (chatSendBtn) chatSendBtn.addEventListener('click', () => this._sendChat(t));
      const chatInput = document.getElementById('friends-chat-input');
      if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._sendChat(t); });
    };

    rebind();
    this._rebind = rebind;
  },

  async _loadData(t) {
    try {
      const token = get('token');
      const res = await fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      this._friends = data.friends || [];
      this._requests = data.requests || [];
      setFriends(this._friends);
      setFriendRequests(this._requests);
      // Notification for pending requests
      const pending = this._requests.filter(r => r.status === 'pending');
      const existingNotifs = (get('notifications') || []).filter(n => n.type === 'friend_request' && !n.read);
      if (pending.length > 0 && existingNotifs.length === 0) {
        addNotification({
          type: 'friend_request',
          title: t('nav.friends'),
          message: `${pending[0].fromUser.username} ${t('notifications.friendRequest')}`,
        });
      }
      this._rerender(t);
    } catch { /* silent */ }
  },

  async _sendRequest(t) {
    const searchEl = document.getElementById('friends-search');
    const msgEl = document.getElementById('friends-msg');
    const username = searchEl ? searchEl.value.trim() : '';
    if (!username) return;
    this._loading = true;
    this._rerender(t);
    try {
      const token = get('token');
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUsername: username, message: msgEl ? msgEl.value.trim() || undefined : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t('friends.requestSent'), 'success');
        playSuccess();
        if (searchEl) searchEl.value = '';
        if (msgEl) msgEl.value = '';
      } else {
        showToast(data.error, 'error');
        playError();
      }
    } catch { showToast(t('errors.connectionError'), 'error'); }
    finally { this._loading = false; this._rerender(t); }
  },

  async _handleRequest(requestId, action, t) {
    try {
      const token = get('token');
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        showToast(action === 'accept' ? t('friends.requestAccepted') : t('friends.requestRejected'), 'success');
        playSuccess();
        this._loadData(t);
      }
    } catch { /* silent */ }
  },

  _openChat(friend, t) {
    this._activeChat = { id: friend.id, username: friend.username };
    playClick();
    this._loadChat(friend.id, t);
    this._rerender(t);
  },

  async _loadChat(friendId, t) {
    try {
      const token = get('token');
      const res = await fetch(`/api/chat?friendId=${friendId}`, { headers: { Authorization: `Bearer ${token}` } });
      this._chatMessages = await res.json();
      this._rerender(t);
      setTimeout(() => {
        const el = document.getElementById('friends-chat-messages');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch { /* silent */ }
  },

  async _sendChat(t) {
    const input = document.getElementById('friends-chat-input');
    if (!input || !input.value.trim() || !this._activeChat) return;
    try {
      const token = get('token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: this._activeChat.id, content: input.value.trim() }),
      });
      if (res.ok) {
        input.value = '';
        playClick();
        this._loadChat(this._activeChat.id, t);
      }
    } catch { /* silent */ }
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
    this._timers.forEach(clearInterval);
    this._timers = [];
    this._rebind = null;
  },
};

export const friendsView = _friends;

// ═══════════════════════════════════════════════════════════════════════════
// 4. VENT VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _vent = {
  _timers: [],
  _messages: [],
  _content: '',
  _anonymous: false,
  _loading: false,
  _reportModal: null,
  _reportReason: '',
  _rebind: null,

  render(t) {
    const user = get('user');
    if (!user) return '';

    const messagesHtml = this._messages.map(msg => {
      const isModerated = msg.isModerated;
      const moderatedOverlay = isModerated
        ? `<div class="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-redstone-red)">${t('vent.moderated')}</span></div>`
        : '';
      const reportedClass = msg.isReported ? 'opacity-100 text-[var(--mc-redstone-red)]' : 'text-[var(--mc-light-gray)]';
      const reportBtn = `
        <button data-vent-report="${msg.id}" class="transition-opacity cursor-pointer ${reportedClass}" style="font-size:var(--mc-font-size-sm);opacity:${msg.isReported ? 1 : 0}" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=${msg.isReported ? 1 : 0}">
          ${msg.isReported ? '🚩' : '⚠️'}
        </button>`;
      return `
        <div class="mc-chat-bubble mc-chat-bubble-received relative group ${isModerated ? 'opacity-50' : ''}">
          ${moderatedOverlay}
          <div class="flex items-center justify-between mb-1">
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">
              ${msg.isAnonymous ? '🎭 ' + t('vent.anonymous') : msg.username}
            </span>
            ${reportBtn}
          </div>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>
        </div>`;
    }).join('');

    const reportModalHtml = this._reportModal ? `
      <div id="vent-report-overlay" class="mc-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center">
        <div class="mc-modal" style="background:var(--mc-bg-dark);border:4px solid #000;max-width:400px;width:90%" onclick="event.stopPropagation()">
          <div class="mc-modal-header">🚩 ${t('vent.reportTitle')}</div>
          <div class="mc-modal-body p-4">
            <textarea id="vent-report-reason" class="mc-textarea mb-3" placeholder="${t('vent.reportPlaceholder')}">${this._reportReason}</textarea>
            <div class="flex gap-2">
              <button id="vent-report-submit" class="mc-btn mc-btn-danger flex-1" style="font-size:var(--mc-font-size-sm)">${t('vent.report')}</button>
              <button id="vent-report-cancel" class="mc-btn mc-btn-stone flex-1" style="font-size:var(--mc-font-size-sm)">${t('common.cancel')}</button>
            </div>
          </div>
        </div>
      </div>` : '';

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up" style="min-height:600px;display:flex;flex-direction:column">
          <div class="mc-nether-particles">
            ${Array.from({ length: 8 }, (_, i) => `<div class="mc-nether-particle" style="left:${(i * 37 + 13) % 100}%;animation-delay:${(i * 1.3) % 5}s;animation-duration:${3 + (i * 0.7) % 4}s"></div>`).join('')}
          </div>
          <div class="mc-panel-header flex items-center justify-between">
            <span>💬 ${t('vent.title')}</span>
            <label class="flex items-center gap-2 cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">
              <input type="checkbox" id="vent-anonymous" ${this._anonymous ? 'checked' : ''} style="width:16px;height:16px" />
              🎭 ${t('vent.anonymous')}
            </label>
          </div>
          <div id="vent-messages" class="flex-1 overflow-y-auto p-4 space-y-3" style="background:#0A0A0A">
            ${messagesHtml}
          </div>
          <div class="p-3" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
            <textarea id="vent-input" class="mc-textarea mb-2" style="min-height:60px" placeholder="${t('vent.placeholder')}" maxlength="1000">${this._content}</textarea>
            <button id="vent-send" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._loading ? 'disabled' : ''}>
              ${this._loading ? '⏳ ...' : '💬 ' + t('vent.send')}
            </button>
          </div>
        </div>
        ${reportModalHtml}
      </div>`;
  },

  init(t) {
    this._loadMessages(t);

    const rebind = () => {
      // Anonymous toggle
      const anonCheck = document.getElementById('vent-anonymous');
      if (anonCheck) anonCheck.addEventListener('change', (e) => { this._anonymous = e.target.checked; });

      // Send
      const sendBtn = document.getElementById('vent-send');
      if (sendBtn) sendBtn.addEventListener('click', () => this._sendMessage(t));

      // Report buttons
      document.querySelectorAll('[data-vent-report]').forEach(btn => {
        btn.addEventListener('click', () => {
          const msgId = btn.getAttribute('data-vent-report');
          const msg = this._messages.find(m => m.id === msgId);
          if (msg && !msg.isReported) {
            this._reportModal = msgId;
            this._reportReason = '';
            this._rerender(t);
          }
        });
      });

      // Report modal
      const overlay = document.getElementById('vent-report-overlay');
      if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeReport(t); });

      const reportSubmitBtn = document.getElementById('vent-report-submit');
      if (reportSubmitBtn) reportSubmitBtn.addEventListener('click', () => this._submitReport(t));

      const reportCancelBtn = document.getElementById('vent-report-cancel');
      if (reportCancelBtn) reportCancelBtn.addEventListener('click', () => this._closeReport(t));
    };

    rebind();
    this._rebind = rebind;
  },

  async _loadMessages(t) {
    try {
      const token = get('token');
      const res = await fetch('/api/vent', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      this._messages = Array.isArray(data.messages) ? data.messages : [];
      setVentMessages(this._messages);
      this._rerender(t);
    } catch { /* silent */ }
  },

  async _sendMessage(t) {
    const input = document.getElementById('vent-input');
    const content = input ? input.value.trim() : '';
    if (!content) return;
    this._loading = true;
    this._rerender(t);
    try {
      const token = get('token');
      const res = await fetch('/api/vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, isAnonymous: this._anonymous }),
      });
      if (res.ok) {
        this._content = '';
        showToast(t('common.success'), 'success');
        playSuccess();
        this._loadMessages(t);
      }
    } catch { showToast(t('common.error'), 'error'); }
    finally { this._loading = false; this._rerender(t); }
  },

  _closeReport(t) {
    this._reportModal = null;
    this._reportReason = '';
    this._rerender(t);
  },

  async _submitReport(t) {
    const reasonEl = document.getElementById('vent-report-reason');
    const reason = reasonEl ? reasonEl.value.trim() : '';
    if (!reason || !this._reportModal) return;
    try {
      const token = get('token');
      const res = await fetch('/api/vent/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messageId: this._reportModal, reason }),
      });
      if (res.ok) {
        showToast(t('vent.reportSent'), 'success');
        this._closeReport(t);
        this._loadMessages(t);
      }
    } catch { showToast(t('common.error'), 'error'); }
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      if (this._rebind) this._rebind();
      // Scroll to top for new messages
      const el = document.getElementById('vent-messages');
      if (el) el.scrollTop = 0;
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers.forEach(clearInterval);
    this._timers = [];
    this._rebind = null;
  },
};

export const ventView = _vent;

// ═══════════════════════════════════════════════════════════════════════════
// 5. JOURNAL VIEW
// ═══════════════════════════════════════════════════════════════════════════

const _journal = {
  _timers: [],
  _content: '',
  _title: '',
  _selectedMood: null,
  _saving: false,
  _entries: [],
  _dailyPrompt: '',
  _rebind: null,

  render(t) {
    const user = get('user');
    if (!user) return '';

    const moodOptions = [
      { key: 'happy', emoji: '😊' },
      { key: 'sad', emoji: '😢' },
      { key: 'anxious', emoji: '😰' },
      { key: 'angry', emoji: '😠' },
      { key: 'calm', emoji: '😌' },
      { key: 'tired', emoji: '😴' },
    ];
    const emojiMap = { happy: '😊', sad: '😢', anxious: '😰', angry: '😠', calm: '😌', tired: '😴' };

    const moodTagsHtml = moodOptions.map(m => {
      const selected = this._selectedMood === m.key;
      return `<button data-journal-mood="${m.key}" class="mc-mood-emoji ${selected ? 'mc-mood-selected' : ''}" title="${m.key}"><span class="text-lg">${m.emoji}</span></button>`;
    }).join('');

    const entriesHtml = this._entries.length === 0
      ? `<div class="mc-empty-state"><div class="mc-empty-icon">📓</div><p class="mc-empty-text" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${t('journal.noEntries')}</p></div>`
      : this._entries.map(entry => {
        const date = new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const moodEmoji = entry.mood ? emojiMap[entry.mood] || '❓' : '';
        const titleHtml = entry.title ? `<h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000;margin-bottom:4px">${entry.title}</h4>` : '';
        const preview = entry.content.length > 100 ? entry.content.slice(0, 100) + '...' : entry.content;
        return `
          <div class="mc-journal-entry">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="mc-journal-date-badge">${date}</span>
                  ${moodEmoji ? `<span class="text-lg">${moodEmoji}</span>` : ''}
                </div>
                ${titleHtml}
                <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray);line-height:1.7">${preview}</p>
              </div>
              <button data-journal-delete="${entry.id}" class="mc-btn mc-btn-danger py-0.5 px-2 flex-shrink-0" style="font-size:0.6rem">${t('journal.delete')}</button>
            </div>
          </div>`;
      }).join('');

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">📓 ${t('journal.title')}</div>
          <p class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t('journal.subtitle')}</p>

          <div class="mc-journal-prompt-card mb-6">
            <div class="flex items-start gap-3">
              <span class="text-2xl mc-float-gentle">💡</span>
              <div>
                <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-gold);margin-bottom:4px;text-transform:uppercase">${t('journal.prompt').split('?')[0]}?</p>
                <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">${this._dailyPrompt}</p>
              </div>
            </div>
          </div>

          <input id="journal-title" class="mc-input mb-3" placeholder="${t('journal.title')}" value="${this._title.replace(/"/g, '&quot;')}" maxlength="100" />
          <textarea id="journal-content" class="mc-journal-textarea mb-4" placeholder="${t('journal.subtitle')}" rows="6" maxlength="2000">${this._content}</textarea>

          <div class="flex flex-wrap gap-2 mb-4">${moodTagsHtml}</div>

          <button id="journal-save" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._saving || !this._content.trim() ? 'disabled style="opacity:0.6"' : ''}>
            ${this._saving ? '⏳ ...' : '💾 ' + t('journal.save')}
          </button>

          <div class="mc-divider-icon my-8"><span>📅</span></div>

          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${t('journal.entries')}</h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">${entriesHtml}</div>
        </div>
      </div>`;
  },

  init(t) {
    this._loadEntries(t);

    const rebind = () => {
      // Mood tags
      document.querySelectorAll('[data-journal-mood]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-journal-mood');
          this._selectedMood = this._selectedMood === key ? null : key;
          this._rerender(t);
        });
      });

      // Save
      const saveBtn = document.getElementById('journal-save');
      if (saveBtn) saveBtn.addEventListener('click', () => this._saveEntry(t));

      // Delete
      document.querySelectorAll('[data-journal-delete]').forEach(btn => {
        btn.addEventListener('click', () => this._deleteEntry(btn.getAttribute('data-journal-delete'), t));
      });
    };

    rebind();
    this._rebind = rebind;
  },

  async _loadEntries(t) {
    try {
      const token = get('token');
      const res = await fetch(`/api/journal?days=30&locale=pt`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        this._entries = data.entries || [];
        this._dailyPrompt = data.dailyPrompt || t('journal.prompt');
        this._rerender(t);
      }
    } catch { /* silent */ }
  },

  async _saveEntry(t) {
    const titleEl = document.getElementById('journal-title');
    const contentEl = document.getElementById('journal-content');
    const content = contentEl ? contentEl.value.trim() : '';
    if (!content) return;
    this._saving = true;
    this._rerender(t);
    try {
      const token = get('token');
      const title = titleEl ? titleEl.value.trim() : '';
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title || undefined, content, mood: this._selectedMood || undefined }),
      });
      if (res.ok) {
        showToast(t('journal.saved'), 'success');
        playSuccess();
        this._content = '';
        this._title = '';
        this._selectedMood = null;
        this._loadEntries(t);
      } else {
        showToast(t('common.error'), 'error');
        playError();
      }
    } catch {
      showToast(t('common.error'), 'error');
      playError();
    } finally { this._saving = false; this._rerender(t); }
  },

  async _deleteEntry(entryId, t) {
    try {
      const token = get('token');
      const res = await fetch(`/api/journal?id=${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(t('common.success'), 'success');
        this._loadEntries(t);
      }
    } catch { showToast(t('common.error'), 'error'); }
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

export const journalView = _journal;

// ═══════════════════════════════════════════════════════════════════════════
// 6. MINIGAME VIEW — Canvas Runner Game
// ═══════════════════════════════════════════════════════════════════════════

const _minigame = {
  _timers: [],
  _gameState: 'menu',  // 'menu' | 'playing' | 'gameover'
  _score: 0,
  _lives: 3,
  _level: 1,
  _activePowerup: null,
  _gameLoopId: null,
  _isRunning: false,
  _player: null,
  _blocks: [],
  _enemies: [],
  _keys: new Set(),
  _frame: 0,
  _powerupTimer: 0,
  _shield: false,
  _speed: 1,
  _touchDir: null,
  _touchJump: false,

  render(t) {
    if (this._gameState === 'menu') return this._renderMenu(t);
    if (this._gameState === 'playing') return this._renderPlaying(t);
    return this._renderGameOver(t);
  },

  _renderMenu(t) {
    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>🎮 ${t('minigame.title')}</span>
            <button id="minigame-fullscreen" class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)" title="Tela cheia">⛶</button>
          </div>
          <div class="text-center py-8">
            <div class="flex justify-center gap-6 mb-6">
              <div class="mc-mob mc-mob-creeper mc-mob-float" style="animation-delay:0s"></div>
              <div class="mc-mob mc-mob-enderman mc-mob-float" style="animation-delay:0.5s"></div>
              <div class="mc-mob mc-mob-zombie mc-mob-float" style="animation-delay:1s"></div>
              <div class="mc-mob mc-mob-spider mc-mob-float" style="animation-delay:1.5s"></div>
            </div>
            <div class="text-6xl mb-4 animate-pixel-bounce">⛏️</div>
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin-bottom:16px">${t('minigame.title')}</h3>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin-bottom:8px">${t('minigame.instructions')}</p>
            <div class="mc-game-instructions-keys mc-panel inline-block text-left mb-6" style="background:#0A0A0A">
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);line-height:2">
                <kbd>⬅️ ➡️</kbd> / <kbd>A</kbd> <kbd>D</kbd> - Mover<br />
                <kbd>⬆️</kbd> / <kbd>W</kbd> / <kbd>Espaço</kbd> - Pular<br />
                💎 +10pts | 🟡 +5pts | 🟩 +15pts | 👾 +20pts (pise!)<br />
                🛡️ Escudo | ⚡ Velocidade
              </p>
            </div>
            <br />
            <button id="minigame-start" class="mc-btn mc-btn-gold px-8 py-3" style="font-size:var(--mc-font-size-lg)">🎮 ${t('minigame.start')}</button>
          </div>
        </div>
      </div>`;
  },

  _renderPlaying(t) {
    const livesHtml = [1, 2, 3].map(i => `<div class="mc-game-life ${this._lives < i ? 'lost' : ''}">❤️</div>`).join('');
    const powerupHtml = this._activePowerup
      ? `<div class="mc-game-powerup-indicator">${this._activePowerup === 'shield' ? '🛡️' : '⚡'} ${t('game.' + this._activePowerup)}</div>`
      : '';

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>🎮 ${t('minigame.title')} ${this._level > 1 ? '- Nv.' + this._level : ''}</span>
            <button id="minigame-fullscreen" class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)" title="Tela cheia">⛶</button>
          </div>
          <div class="flex flex-col items-center">
            <div class="mc-game-hud w-full" style="max-width:600px">
              <div class="flex items-center gap-4">
                <div class="mc-game-lives">${livesHtml}</div>
                <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">⛏️ ${t('game.score')}: ${this._score}</span>
                <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">🏰 Nv.${this._level}</span>
                ${powerupHtml}
              </div>
            </div>
            <div class="mc-game-canvas-container w-full" style="max-width:600px">
              <canvas id="minigame-canvas" width="600" height="450" class="mc-game-canvas w-full" style="max-width:600px"></canvas>
            </div>
            <div class="flex justify-between w-full mt-3 px-4 lg:hidden" style="max-width:600px">
              <div class="flex gap-2">
                <button id="mg-touch-left" class="mc-btn mc-btn-stone py-3 px-5 text-xl select-none">⬅️</button>
                <button id="mg-touch-right" class="mc-btn mc-btn-stone py-3 px-5 text-xl select-none">➡️</button>
              </div>
              <button id="mg-touch-jump" class="mc-btn mc-btn-primary py-3 px-6 text-xl select-none">⬆️</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  _renderGameOver(t) {
    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>🎮 ${t('minigame.title')}</span>
          </div>
          <div class="text-center py-8 animate-pixel-fade-in">
            <div class="text-6xl mb-4">🏆</div>
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${t('minigame.gameOver')}</h3>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin:16px 0">⭐ ${this._score} ${t('minigame.score')} | 🏰 Nível ${this._level}</p>
            <button id="minigame-restart" class="mc-btn mc-btn-primary px-6 py-3" style="font-size:var(--mc-font-size-md)">🔄 ${t('minigame.playAgain')}</button>
          </div>
        </div>
      </div>`;
  },

  init(t) {
    const startBtn = document.getElementById('minigame-start');
    if (startBtn) startBtn.addEventListener('click', () => this._initGame(t));

    const restartBtn = document.getElementById('minigame-restart');
    if (restartBtn) restartBtn.addEventListener('click', () => this._initGame(t));

    const fsBtn = document.getElementById('minigame-fullscreen');
    if (fsBtn) fsBtn.addEventListener('click', () => this._toggleFullscreen());

    // Touch controls
    const leftBtn = document.getElementById('mg-touch-left');
    const rightBtn = document.getElementById('mg-touch-right');
    const jumpBtn = document.getElementById('mg-touch-jump');
    if (leftBtn) leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._touchDir = 'left'; });
    if (leftBtn) leftBtn.addEventListener('touchend', () => { this._touchDir = null; this._touchJump = false; });
    if (rightBtn) rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._touchDir = 'right'; });
    if (rightBtn) rightBtn.addEventListener('touchend', () => { this._touchDir = null; this._touchJump = false; });
    if (jumpBtn) jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._touchJump = true; });
    if (jumpBtn) jumpBtn.addEventListener('touchend', () => { this._touchDir = null; this._touchJump = false; });

    // Keyboard
    this._keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
      if (e.type === 'keydown') this._keys.add(e.key);
      else this._keys.delete(e.key);
    };
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('keyup', this._keyHandler);
  },

  _initGame(t) {
    if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
    this._isRunning = false;
    this._player = { x: 50, y: 300, vy: 0, w: 24, h: 24, onGround: false, dir: 1 };
    this._score = 0;
    this._lives = 3;
    this._level = 1;
    this._activePowerup = null;
    this._shield = false;
    this._speed = 1;
    this._powerupTimer = 0;
    this._frame = 0;
    this._keys.clear();
    this._touchDir = null;
    this._touchJump = false;
    this._generateLevel(1);
    this._gameState = 'playing';
    playClick();
    this._rerender(t);

    requestAnimationFrame(() => {
      const canvas = document.getElementById('minigame-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) this._startGameLoop(ctx);
      }
    });
  },

  _generateLevel(lvl) {
    const blocks = [];
    const enemies = [];
    const W = 600, H = 450;
    // Ground
    for (let x = 0; x < W; x += 32) {
      blocks.push({ x, y: H - 70, w: 32, h: 32, color: '#4CAF50', type: 'grass' });
      blocks.push({ x, y: H - 38, w: 32, h: 32, color: '#A0722A', type: 'dirt' });
    }
    // Platforms
    const platCount = 4 + lvl * 2;
    for (let i = 0; i < platCount; i++) {
      const pw = 48 + Math.random() * 60;
      blocks.push({
        x: 20 + (i / platCount) * (W - 80) + Math.random() * 30,
        y: 140 + Math.random() * 180,
        w: pw, h: 12, color: '#9E9E9E', type: 'stone',
      });
    }
    // Collectibles
    const collectCount = 8 + lvl * 3;
    for (let i = 0; i < collectCount; i++) {
      const bt = [{ color: '#00E5FF', type: 'diamond' }, { color: '#FFB300', type: 'gold' }, { color: '#66BB6A', type: 'emerald' }][Math.floor(Math.random() * 3)];
      blocks.push({ x: 20 + Math.random() * (W - 60), y: 80 + Math.random() * 260, w: 14, h: 14, color: bt.color, type: bt.type });
    }
    // Powerups
    if (lvl >= 1) blocks.push({ x: 80 + Math.random() * 200, y: 100 + Math.random() * 80, w: 14, h: 14, color: '#9B59B6', type: 'shield' });
    if (lvl >= 2) blocks.push({ x: 300 + Math.random() * 200, y: 100 + Math.random() * 80, w: 14, h: 14, color: '#FFD700', type: 'speed' });
    // Enemies
    const enemyCount = Math.min(lvl + 1, 6);
    const enemyColors = ['#E53935', '#8E24AA', '#F4511E'];
    for (let i = 0; i < enemyCount; i++) {
      const ex = 100 + (i / enemyCount) * (W - 200);
      enemies.push({ x: ex, y: H - 70 - 20, w: 20, h: 20, vx: (1 + lvl * 0.3) * (i % 2 === 0 ? 1 : -1), color: enemyColors[i % 3], alive: true });
    }
    this._blocks = blocks;
    this._enemies = enemies;
  },

  _nextLevel() {
    this._level++;
    this._player.x = 50;
    this._player.y = 300;
    this._player.vy = 0;
    this._generateLevel(this._level);
  },

  _startGameLoop(ctx) {
    if (this._isRunning) return;
    this._isRunning = true;
    const loop = () => {
      if (this._gameState !== 'playing') { this._isRunning = false; return; }
      this._update();
      this._draw(ctx);
      this._gameLoopId = requestAnimationFrame(loop);
    };
    this._gameLoopId = requestAnimationFrame(loop);
  },

  _update() {
    const p = this._player;
    const gravity = 0.5;
    const jumpForce = -10;
    const speed = 4 * this._speed;
    const W = 600, H = 450;

    if (this._keys.has('ArrowLeft') || this._keys.has('a') || this._touchDir === 'left') { p.x -= speed; p.dir = -1; }
    if (this._keys.has('ArrowRight') || this._keys.has('d') || this._touchDir === 'right') { p.x += speed; p.dir = 1; }
    if ((this._keys.has('ArrowUp') || this._keys.has('w') || this._keys.has(' ') || this._touchJump) && p.onGround) {
      p.vy = jumpForce; p.onGround = false; this._touchJump = false;
    }

    p.vy += gravity;
    p.y += p.vy;
    p.onGround = false;

    if (p.x < 0) p.x = 0;
    if (p.x > W - p.w) p.x = W - p.w;

    for (let i = this._blocks.length - 1; i >= 0; i--) {
      const b = this._blocks[i];
      if (p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y) {
        if (b.type === 'grass' || b.type === 'dirt' || b.type === 'stone') {
          if (p.vy > 0 && p.y + p.h - p.vy <= b.y + 4) { p.y = b.y - p.h; p.vy = 0; p.onGround = true; }
          else if (p.vy < 0 && p.y - p.vy >= b.y + b.h - 4) { p.y = b.y + b.h; p.vy = 1; }
          else if (p.vy <= 0) {
            if (p.x + p.w / 2 < b.x + b.w / 2) p.x = b.x - p.w;
            else p.x = b.x + b.w;
          }
        } else if (b.type === 'shield') {
          this._blocks.splice(i, 1); this._shield = true;
          this._powerupTimer = 300; this._activePowerup = 'shield';
          this._score += 5;
        } else if (b.type === 'speed') {
          this._blocks.splice(i, 1); this._speed = 1.8;
          this._powerupTimer = 300; this._activePowerup = 'speed';
          this._score += 5;
        } else {
          this._blocks.splice(i, 1);
          const points = b.type === 'diamond' ? 10 : b.type === 'emerald' ? 15 : 5;
          this._score += points;
        }
      }
    }

    // Enemies
    for (const e of this._enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x <= 0 || e.x >= W - e.w) e.vx *= -1;
      if (p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
        if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 4) {
          e.alive = false; p.vy = -8; this._score += 20;
        } else if (!this._shield) {
          this._lives--;
          p.x = 50; p.y = 300; p.vy = 0;
          if (this._lives <= 0) this._handleGameOver();
        } else {
          e.alive = false; this._score += 10;
        }
      }
    }

    // Powerup timer
    if (this._powerupTimer > 0) {
      this._powerupTimer--;
      if (this._powerupTimer <= 0) {
        this._shield = false; this._speed = 1; this._activePowerup = null;
      }
    }

    // Fall off
    if (p.y > H + 50) {
      this._lives--;
      if (this._lives <= 0) this._handleGameOver();
      else { p.x = 50; p.y = 300; p.vy = 0; p.onGround = false; }
    }

    // Level complete
    const remaining = this._blocks.filter(b => b.type !== 'grass' && b.type !== 'dirt' && b.type !== 'stone').length;
    const aliveEnemies = this._enemies.filter(e => e.alive).length;
    if (remaining === 0 && aliveEnemies === 0) this._nextLevel();

    this._frame++;
  },

  _draw(ctx) {
    const p = this._player;
    const W = 600, H = 450;
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#42A5F5');
    skyGrad.addColorStop(1, '#90CAF9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // Clouds
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const cx = ((this._frame * 0.3 + i * 130) % (W + 100)) - 50;
      ctx.fillRect(cx, 40 + i * 25, 48, 12);
      ctx.fillRect(cx + 12, 28 + i * 25, 24, 12);
    }
    // Sun
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath(); ctx.arc(540, 50, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFECB3';
    ctx.beginPath(); ctx.arc(540, 50, 18, 0, Math.PI * 2); ctx.fill();
    // Blocks
    this._blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w / 2 - 2, b.h / 2 - 2);
      if (b.type === 'shield' || b.type === 'speed') {
        const glow = Math.sin(this._frame * 0.1) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${glow})`;
        ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      }
    });
    // Enemies
    this._enemies.forEach(e => {
      if (!e.alive) return;
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 4, e.y + 5, 4, 4);
      ctx.fillRect(e.x + 12, e.y + 5, 4, 4);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(e.x + 5, e.y + 6, 2, 2);
      ctx.fillRect(e.x + 13, e.y + 6, 2, 2);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 6, e.y + 14, 8, 2);
    });
    // Player
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(p.x + 4, p.y + 8, 16, 12);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(p.x + 4, p.y + 20, 7, 4);
    ctx.fillRect(p.x + 13, p.y + 20, 7, 4);
    ctx.fillStyle = '#DBA87A';
    ctx.fillRect(p.x + 6, p.y, 12, 8);
    ctx.fillStyle = '#4A2800';
    ctx.fillRect(p.x + 6, p.y, 12, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(p.x + 8, p.y + 4, 3, 2);
    ctx.fillRect(p.x + 13, p.y + 4, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(p.x + 9, p.y + 4, 2, 2);
    ctx.fillRect(p.x + 14, p.y + 4, 2, 2);
    // Shield
    if (this._shield) {
      ctx.strokeStyle = 'rgba(155,89,182,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 18, 0, Math.PI * 2); ctx.stroke();
    }
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(8, 8, 220, 28);
    ctx.fillStyle = '#FFB300';
    ctx.font = '13px Silkscreen, monospace';
    ctx.fillText(`⭐ ${this._score}  ❤️ ${this._lives}  🏰 Nv.${this._level}`, 18, 27);
    // Powerup indicator
    if (this._activePowerup && this._powerupTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W - 140, 8, 132, 22);
      ctx.fillStyle = this._activePowerup === 'shield' ? '#9B59B6' : '#FFD700';
      ctx.fillText(`${this._activePowerup === 'shield' ? '🛡️' : '⚡'} ${Math.ceil(this._powerupTimer / 60)}s`, W - 130, 23);
    }
  },

  _handleGameOver() {
    this._gameState = 'gameover';
    if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
    this._isRunning = false;
    playError();
    // Submit to leaderboard
    const token = get('token');
    if (token && this._score > 0) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: this._score, level: this._level, gameMode: 'platformer' }),
      }).catch(() => {});
    }
    this._rerender(tCurrent());
  },

  _toggleFullscreen() {
    const container = document.getElementById('mc-minigame-container');
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen?.();
  },

  _rerender(t) {
    const main = document.querySelector('main');
    if (!main) return;
    const viewContainer = main.querySelector(':scope > div');
    if (viewContainer) {
      viewContainer.innerHTML = this.render(t);
      // Re-bind minimal controls for gameover screen
      const restartBtn = document.getElementById('minigame-restart');
      if (restartBtn) restartBtn.addEventListener('click', () => this._initGame(t));
      const fsBtn = document.getElementById('minigame-fullscreen');
      if (fsBtn) fsBtn.addEventListener('click', () => this._toggleFullscreen());
    }
  },

  cleanup() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
    this._isRunning = false;
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      window.removeEventListener('keyup', this._keyHandler);
      this._keyHandler = null;
    }
    this._keys.clear();
    this._touchDir = null;
    this._touchJump = false;
  },
};

export const minigameView = _minigame;

// ═══════════════════════════════════════════════════════════════════════════
// 7. STUDY HELP VIEW
// ═══════════════════════════════════════════════════════════════════════════

const STUDY_QUESTIONS = {
  year1: {
    math: [
      { q: 'Qual é o resultado de (-3)² + 4?', opts: ['5', '13', '-5', '7'], answer: 1, explanation: '(-3)² = 9, então 9 + 4 = 13.' },
      { q: 'Um produto custa R$ 80 e teve 25% de desconto. Qual o preço final?', opts: ['R$ 55', 'R$ 60', 'R$ 65', 'R$ 70'], answer: 1, explanation: '25% de 80 = 20. 80 - 20 = 60.' },
      { q: 'Qual é o MMC de 12 e 18?', opts: ['24', '36', '54', '72'], answer: 1, explanation: 'MMC(12,18) = 36.' },
      { q: 'Resolva: 2x + 5 = 17', opts: ['x = 5', 'x = 6', 'x = 7', 'x = 8'], answer: 1, explanation: '2x = 12, x = 6.' },
      { q: 'Qual a área de um triângulo com base 10 e altura 6?', opts: ['60', '30', '16', '20'], answer: 1, explanation: 'A = (b × h) / 2 = (10 × 6) / 2 = 30.' },
    ],
    portuguese: [
      { q: 'Qual é a classe gramatical da palavra "belo" em "o belo jardim"?', opts: ['Substantivo', 'Adjetivo', 'Advérbio', 'Artigo'], answer: 1, explanation: '"Belo" caracteriza o substantivo "jardim", logo é adjetivo.' },
      { q: 'Qual figura de linguagem há em "O tempo voa"?', opts: ['Metonímia', 'Hipérbole', 'Metáfora', 'Personificação'], answer: 2, explanation: 'Comparação implícita entre tempo e um ser que voa.' },
      { q: 'Qual alternativa tem erro de concordância?', opts: ['Eles fizeram', 'Faz anos', 'Houveram problemas', 'Existem coisas'], answer: 2, explanation: '"Haver" no sentido de existir é impessoal → "Houve problemas".' },
      { q: 'Qual é o sujeito da oração "Chegaram os alunos"?', opts: ['Chegaram', 'os alunos', 'inexistente', 'indeterminado'], answer: 1, explanation: 'Sujeito simples: "os alunos".' },
      { q: 'Qual tipo textual narra eventos em sequência?', opts: ['Dissertativo', 'Descritivo', 'Narrativo', 'Injuntivo'], answer: 2, explanation: 'O texto narrativo conta uma história com eventos em sequência.' },
    ],
    science: [
      { q: 'Qual é a principal função da mitocôndria?', opts: ['Armazenar DNA', 'Produzir energia (ATP)', 'Sintetizar proteínas', 'Controlar divisão celular'], answer: 1, explanation: 'A mitocôndria é a "usina" da célula, responsável pela respiração celular e produção de ATP.' },
      { q: 'Qual é a fórmula da água?', opts: ['CO₂', 'H₂O', 'O₂', 'NaCl'], answer: 1, explanation: 'Água = H₂O (2 hidrogênio + 1 oxigênio).' },
      { q: 'Qual organela é responsável pela fotossíntese?', opts: ['Mitocôndria', 'Ribossomo', 'Cloroplasto', 'Lisossomo'], answer: 2, explanation: 'Cloroplastos contêm clorofila e realizam fotossíntese.' },
      { q: 'O que é uma reação exotérmica?', opts: ['Absorve calor', 'Libera calor', 'Não troca calor', 'Absorve luz'], answer: 1, explanation: 'Exotérmica libera calor para o ambiente.' },
      { q: 'Qual camada da atmosfera contém o ozônio?', opts: ['Troposfera', 'Estratosfera', 'Mesosfera', 'Termosfera'], answer: 1, explanation: 'A camada de ozônio fica na estratosfera.' },
    ],
    history: [
      { q: 'Em que ano o Brasil foi descoberto por Portugal?', opts: ['1492', '1500', '1510', '1498'], answer: 1, explanation: 'Pedro Álvares Cabral chegou ao Brasil em 22 de abril de 1500.' },
      { q: 'Qual foi a primeira capital do Brasil?', opts: ['Rio de Janeiro', 'Salvador', 'São Paulo', 'Brasília'], answer: 1, explanation: 'A primeira capital foi Salvador (1549-1763).' },
      { q: 'O que foi a Revolução Industrial?', opts: ['Guerra na Europa', 'Transformação tecnológica e econômica', 'Movimento artístico', 'Revolta colonial'], answer: 1, explanation: 'Processo de mecanização e industrialização que começou na Inglaterra no século XVIII.' },
      { q: 'Quem foram os tupiniquins?', opts: ['Europeus', 'Indígenas do litoral brasileiro', 'Africanos escravizados', 'Imigrantes asiáticos'], answer: 1, explanation: 'Os tupiniquins eram indígenas que habitavam o litoral quando os portugueses chegaram.' },
      { q: 'O que foi a Lei Áurea?', opts: ['Lei do Ventre Livre', 'Abolição da escravidão', 'Independência do Brasil', 'Proclamação da República'], answer: 1, explanation: 'A Lei Áurea (1888) aboliu a escravidão no Brasil.' },
    ],
    geography: [
      { q: 'Qual é o maior bioma do Brasil?', opts: ['Cerrado', 'Caatinga', 'Amazônia', 'Mata Atlântica'], answer: 2, explanation: 'A Amazônia é o maior bioma, com cerca de 4,2 milhões de km².' },
      { q: 'Qual é o rio mais longo do Brasil?', opts: ['São Francisco', 'Paraná', 'Tocantins', 'Amazonas'], answer: 3, explanation: 'O Rio Amazonas é o mais longo, com cerca de 6.992 km.' },
      { q: 'Quantas regiões geoeconômicas tem o Brasil?', opts: ['3', '4', '5', '6'], answer: 2, explanation: '5 regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.' },
      { q: 'O que é densidade demográfica?', opts: ['Número total de habitantes', 'Habitantes por km²', 'Taxa de natalidade', 'Taxa de mortalidade'], answer: 1, explanation: 'Densidade demográfica = habitantes / área (hab/km²).' },
      { q: 'Qual estado tem a maior população?', opts: ['Minas Gerais', 'Rio de Janeiro', 'São Paulo', 'Bahia'], answer: 2, explanation: 'São Paulo é o estado mais populoso do Brasil.' },
    ],
  },
  year2: {
    math: [
      { q: 'Qual o valor de log₂(32)?', opts: ['4', '5', '6', '8'], answer: 1, explanation: '2⁵ = 32, então log₂(32) = 5.' },
      { q: 'Qual é a derivada de f(x) = 3x² + 2x?', opts: ['6x + 2', '3x + 2', '6x² + 2', '6x'], answer: 0, explanation: "f'(x) = 6x + 2." },
      { q: 'Resolva: |2x - 4| = 6', opts: ['x = 5 ou x = -1', 'x = 1 ou x = 5', 'x = -1 ou x = 1', 'x = 5 apenas'], answer: 0, explanation: '2x - 4 = 6 → x = 5; ou 2x - 4 = -6 → x = -1.' },
      { q: 'Qual a probabilidade de sair cara em uma moeda?', opts: ['1/4', '1/2', '3/4', '1'], answer: 1, explanation: '2 resultados possíveis (cara/coroa), 1 favorável = 1/2.' },
      { q: 'Qual é o determinante da matriz [[2,1],[3,4]]?', opts: ['5', '8', '11', '7'], answer: 0, explanation: 'det = 2×4 - 1×3 = 8 - 3 = 5.' },
    ],
    portuguese: [
      { q: 'Qual é o sujeito de "Conviu os amigos para a festa"?', opts: ['Sujeito oculto "eu"', 'Os amigos', 'Conviu', 'Indeterminado'], answer: 0, explanation: 'Sujeito oculto (elíptico) = "eu".' },
      { q: 'O que é uma crase?', opts: ['Fusão de "a" + "a"', 'Acento grave', 'Sinal de pontuação', 'Regra gramatical'], answer: 0, explanation: 'Crase é a fusão da preposição "a" com o artigo "a" ou pronome demonstrativo "aquele(s)".' },
      { q: 'Qual é o plural de "cidadão"?', opts: ['Cidadãos', 'Cidadões', 'Cidadães', 'Cidadãs'], answer: 0, explanation: 'O plural de cidadão é cidadãos.' },
      { q: '"Se eu estudasse, passaria" é uma oração no modo:', opts: ['Indicativo', 'Subjuntivo', 'Imperativo', 'Infinitivo'], answer: 1, explanation: 'O verbo "estudasse" está no pretérito imperfeito do subjuntivo.' },
      { q: 'Qual recurso argumentativo usa dados estatísticos?', opts: ['Metáfora', 'Citação de autoridade', 'Argumento de autoridade/dados', 'Ironia'], answer: 2, explanation: 'Apresentar dados estatísticos fortalece o argumento por meio de provas concretas.' },
    ],
    science: [
      { q: 'Qual é a equação da fotossíntese?', opts: ['CO₂ + H₂O → C₆H₁₂O₆ + O₂', 'O₂ + C₆H₁₂O₆ → CO₂ + H₂O', 'H₂O → H₂ + O₂', 'CO₂ → C + O₂'], answer: 0, explanation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (com luz e clorofila).' },
      { q: 'O que é a primeira lei de Newton?', opts: ['F = ma', 'Inércia', 'Ação e reação', 'Conservação de energia'], answer: 1, explanation: 'A lei da inércia: um corpo em repouso permanece em repouso.' },
      { q: 'Qual é o pH neutro?', opts: ['0', '5', '7', '14'], answer: 2, explanation: 'pH 7 é neutro. Abaixo é ácido, acima é básico.' },
      { q: 'Qual tipo de onda é o som?', opts: ['Transversal', 'Longitudinal', 'Eletromagnética', 'Estacionária'], answer: 1, explanation: 'O som é uma onda mecânica longitudinal.' },
      { q: 'O que é o DNA?', opts: ['Ácido ribonucleico', 'Molécula que armazena info genética', 'Tipo de proteína', 'Célula-tronco'], answer: 1, explanation: 'DNA (ácido desoxirribonucleico) contém a informação genética.' },
    ],
    history: [
      { q: 'Qual foi a principal causa da Primeira Guerra Mundial?', opts: ['Religiosos', 'Imperialismo e nacionalismo', 'Econômicos apenas', 'Tecnológicos'], answer: 1, explanation: 'O imperialismo europeu, nacionalismo e o sistema de alianças foram as causas principais.' },
      { q: 'O que foi a Semana de Arte Moderna (1922)?', opts: ['Evento esportivo', 'Movimento cultural que modernizou a arte brasileira', 'Revolução política', 'Festival de música'], answer: 1, explanation: 'A Semana de 22 foi um marco da modernização da arte e cultura no Brasil.' },
      { q: 'Quem foi Getúlio Vargas?', opts: ['Imperador do Brasil', 'Presidente durante a Era Vargas (1930-1945)', 'Líder independista', 'Governador de SP'], answer: 1, explanation: 'Getúlio Vargas liderou a Revolução de 1930 e governou o Brasil.' },
      { q: 'O que foi o Estado Novo?', opts: ['Monarquia', 'Período ditatorial de Vargas (1937-1945)', 'República democrática', 'Período colonial'], answer: 1, explanation: 'O Estado Novo foi o período ditatorial de Vargas, com censura e centralização.' },
      { q: 'Qual foi a consequência da Revolução Russa (1917)?', opts: ['Capitalismo forte', 'Criação da URSS (socialismo)', 'Guerra Mundial', 'Independência de colônias'], answer: 1, explanation: 'A Revolução Russa levou à criação da União Soviética.' },
    ],
    geography: [
      { q: 'O que é urbanização?', opts: ['Crescimento das áreas rurais', 'Aumento da população urbana', 'Construção de prédios', 'Migração para o campo'], answer: 1, explanation: 'Urbanização é o processo de crescimento das cidades e migração rural-urbana.' },
      { q: 'Qual é o principal problema ambiental da Amazônia?', opts: ['Poluição industrial', 'Desmatamento', 'Seca', 'Enchentes'], answer: 1, explanation: 'O desmatamento é a principal ameaça à Amazônia.' },
      { q: 'O que são megacidades?', opts: ['Cidades pequenas', 'Cidades com mais de 10 milhões de habitantes', 'Capitais', 'Cidades turísticas'], answer: 1, explanation: 'Megacidades são áreas metropolitanas com 10+ milhões de habitantes.' },
      { q: 'Qual é o principal setor econômico do Brasil?', opts: ['Agrário', 'Industrial', 'Serviços', 'Extrativismo'], answer: 2, explanation: 'O setor de serviços é o maior PIB do Brasil.' },
      { q: 'O que é fuso horário?', opts: ['Temperatura local', 'Diferença de horário entre regiões', 'Estação do ano', 'Clima regional'], answer: 1, explanation: 'Fuso horário é a diferença de horário baseada na longitude.' },
    ],
  },
  year3: {
    math: [
      { q: 'Qual é o limite de (x² - 4)/(x - 2) quando x → 2?', opts: ['0', '2', '4', 'Indeterminado'], answer: 2, explanation: 'Simplificando: (x-2)(x+2)/(x-2) = x+2 → 2+2 = 4.' },
      { q: 'Qual a integral de 2x dx?', opts: ['x² + C', '2x² + C', 'x + C', '2 + C'], answer: 0, explanation: '∫2x dx = x² + C.' },
      { q: 'Resolva: sen(30°)?', opts: ['1/2', '√2/2', '√3/2', '1'], answer: 0, explanation: 'sen(30°) = 1/2.' },
      { q: 'Qual é a matriz inversa de [[2,0],[0,3]]?', opts: ['[[1/2,0],[0,1/3]]', '[[2,0],[0,3]]', '[[3,0],[0,2]]', '[[0,1/2],[1/3,0]]'], answer: 0, explanation: 'A inversa de uma diagonal é o inverso de cada elemento diagonal.' },
      { q: 'Em uma PA, a₁=3 e r=5. Qual o 10º termo?', opts: ['45', '48', '50', '53'], answer: 1, explanation: 'a₁₀ = 3 + 9×5 = 48.' },
    ],
    portuguese: [
      { q: 'O que é intertextualidade?', opts: ['Texto sobre texto', 'Diálogo entre textos', 'Tradução', 'Resumo de texto'], answer: 1, explanation: 'Intertextualidade é a relação/dialogo entre dois ou mais textos.' },
      { q: 'Qual é a diferença entre denotação e conotação?', opts: ['São iguais', 'Denotação = sentido literal; Conotação = sentido figurado', 'Denotação = figurado; Conotação = literal', 'Não há diferença'], answer: 1, explanation: 'Denotação é o sentido próprio/dicionário; conotação é o sentido figurado.' },
      { q: 'O que é coesão textual?', opts: ['Beleza do texto', 'Ligação entre ideias do texto', 'Tamanho do texto', 'Autor do texto'], answer: 1, explanation: 'Coesão são os mecanismos linguísticos que ligam as partes do texto.' },
      { q: 'Qual é a estrutura de uma dissertação-argumentativa?', opts: ['Introdução, desenvolvimento, conclusão', 'Título, parágrafos, autor', 'Personagens, enredo, desfecho', 'Tese, antítese, síntese'], answer: 0, explanation: 'A estrutura padrão é: introdução (tese), desenvolvimento (argumentos), conclusão.' },
      { q: 'O que é uma variação linguística?', opts: ['Erro de português', 'Diferenças na língua por região, grupo social ou contexto', 'Gíria incorreta', 'Falta de vocabulário'], answer: 1, explanation: 'Variação linguística são as diferenças naturais de uma língua.' },
    ],
    science: [
      { q: 'O que é a relatividade de Einstein?', opts: ['Teoria sobre gravidade clássica', 'Tempo e espaço são relativos ao observador', 'Teoria atômica', 'Lei da termodinâmica'], answer: 1, explanation: 'Einstein demonstrou que tempo e espaço dependem do referencial do observador.' },
      { q: 'Qual é a função dos anticorpos?', opts: ['Produzir energia', 'Defender contra patógenos', 'Transportar oxigênio', 'Digirir alimentos'], answer: 1, explanation: 'Anticorpos são proteínas do sistema imunológico que neutralizam patógenos.' },
      { q: 'O que é radiatividade?', opts: ['Luz visível', 'Emissão de partículas/radiação por núcleos instáveis', 'Calor', 'Eletricidade'], answer: 1, explanation: 'Radiatividade é a emissão espontânea de partículas por átomos instáveis.' },
      { q: 'Qual lei diz que "a energia não é criada nem destruída"?', opts: ['Lei de Newton', '1ª Lei da Termodinâmica', 'Lei de Coulomb', 'Lei de Ohm'], answer: 1, explanation: 'A 1ª Lei da Termodinâmica: princípio da conservação de energia.' },
      { q: 'O que é a tabela periódica?', opts: ['Lista de receitas', 'Organização dos elementos químicos', 'Mapa geográfico', 'Calendário científico'], answer: 1, explanation: 'A tabela periódica organiza os elementos químicos por número atômico e propriedades.' },
    ],
    history: [
      { q: 'O que foi a Guerra Fria?', opts: ['Guerra física', 'Conflito ideológico EUA x URSS sem combate direto', 'Guerra na Europa', 'Conflito religioso'], answer: 1, explanation: 'Guerra Fria foi a disputa ideológica e geopolítica entre EUA e URSS (1947-1991).' },
      { q: 'O que foi a ditadura militar no Brasil (1964-1985)?', opts: ['Democracia fortalecida', 'Regime autoritário sem eleições diretas', 'Monarquia', 'Governo constitucional'], answer: 1, explanation: 'Período de regime militar com censura, perseguição e ausência de eleições diretas.' },
      { q: 'O que foi a globalização?', opts: ['Isolamento de países', 'Processo de integração econômica, cultural e tecnológica mundial', 'Guerra comercial', 'Fim do comércio'], answer: 1, explanation: 'Globalização é a interconexão crescente entre países e culturas.' },
      { q: 'Qual foi o papel do Brasil na Segunda Guerra Mundial?', opts: ['Não participou', 'Lutou ao lado dos Aliados (FEB)', 'Lutou com o Eixo', 'Foi neutro'], answer: 1, explanation: 'O Brasil enviou a FEB (Força Expedicionária Brasileira) para lutar com os Aliados.' },
      { q: 'O que foi a Constituição de 1988?', opts: ['Constituição imperial', 'Constituição Cidadã que restaurou a democracia', 'Constituição militar', 'Código Penal'], answer: 1, explanation: 'A CF/88 restabeleceu direitos democráticos após a ditadura militar.' },
    ],
    geography: [
      { q: 'O que é a cadeia produtiva?', opts: ['Cadeia de lojas', 'Conjunto de etapas de produção, distribuição e consumo', 'Cadeia alimentar', 'Corrente elétrica'], answer: 1, explanation: 'Cadeia produtiva engloba todas as etapas desde a matéria-prima até o consumo.' },
      { q: 'O que são BRICS?', opts: ['Organização religiosa', 'Bloco econômico (Brasil, Rússia, Índia, China, África do Sul)', 'Time de futebol', 'Tratado ambiental'], answer: 1, explanation: 'BRICS é um bloco de cooperação econômica entre países emergentes.' },
      { q: 'O que é sustentabilidade?', opts: ['Crescimento infinito', 'Uso responsável dos recursos sem comprometer o futuro', 'Consumo excessivo', 'Exploração total'], answer: 1, explanation: 'Sustentabilidade = atender necessidades atuais sem comprometer as gerações futuras.' },
      { q: 'Qual é a maior economia da América Latina?', opts: ['Argentina', 'México', 'Brasil', 'Colômbia'], answer: 2, explanation: 'O Brasil tem a maior economia da América Latina.' },
      { q: 'O que é geopolítica?', opts: ['Geografia física', 'Relação entre política e espaço geográfico', 'Política cultural', 'Economia internacional'], answer: 1, explanation: 'Geopolítica estuda como a geografia influencia as relações de poder.' },
    ],
  },
};

const _studyHelp = {
  _timers: [],
  _selectedYear: null,
  _selectedSubject: null,
  _questions: [],
  _currentQ: 0,
  _selectedAnswer: null,
  _score: 0,
  _showResult: false,
  _isFinished: false,
  _rebind: null,

  render(t) {
    if (this._isFinished) return this._renderResults(t);
    if (this._questions.length > 0) return this._renderQuiz(t);
    return this._renderSelection(t);
  },

  _renderSelection(t) {
    const years = [
      { key: 'year1', label: t('studyHelp.year1'), icon: '📗' },
      { key: 'year2', label: t('studyHelp.year2'), icon: '📘' },
      { key: 'year3', label: t('studyHelp.year3'), icon: '📙' },
    ];
    const subjects = [
      { key: 'math', label: t('studyHelp.math'), icon: '🔢' },
      { key: 'portuguese', label: t('studyHelp.portuguese'), icon: '📝' },
      { key: 'science', label: t('studyHelp.science'), icon: '🔬' },
      { key: 'history', label: t('studyHelp.history'), icon: '📜' },
      { key: 'geography', label: t('studyHelp.geography'), icon: '🌍' },
    ];

    const yearsHtml = years.map(y => {
      const selected = this._selectedYear === y.key;
      const bg = selected ? 'background:#4CAF50;border-color:var(--mc-emerald-green);color:#fff' : 'color:var(--mc-light-gray)';
      return `<button data-study-year="${y.key}" class="mc-border-2 p-3 text-center transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid"><div class="text-2xl mb-1">${y.icon}</div>${y.label}</button>`;
    }).join('');

    let subjectsHtml = '';
    if (this._selectedYear) {
      const items = subjects.map(s => {
        const count = STUDY_QUESTIONS[this._selectedYear][s.key].length;
        const selected = this._selectedSubject === s.key;
        const bg = selected ? 'background:#4CAF50;border-color:var(--mc-emerald-green);color:#fff' : 'color:var(--mc-light-gray)';
        return `<button data-study-subject="${s.key}" class="mc-border-2 p-3 text-center transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid"><div class="text-2xl mb-1">${s.icon}</div>${s.label}<div class="text-[0.6rem] mt-1 opacity-70">${count} ${t('studyHelp.question').toLowerCase()}s</div></button>`;
      }).join('');
      subjectsHtml = `
        <div class="animate-pixel-fade-in">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);margin-bottom:12px;text-shadow:1px 1px 0 #000">📚 ${t('studyHelp.selectSubject')}</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${items}</div>
        </div>`;
    }

    let startBtnHtml = '';
    if (this._selectedYear && this._selectedSubject) {
      startBtnHtml = `<div class="text-center animate-pixel-fade-in"><button id="study-start" class="mc-btn mc-btn-gold px-8 py-3" style="font-size:var(--mc-font-size-md)">🚀 ${t('studyHelp.start')}</button></div>`;
    }

    return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">📖 ${t('studyHelp.title')}</div>
          <p class="p-4 text-center" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">${t('studyHelp.subtitle')}</p>
          <div class="p-4 space-y-6">
            <div>
              <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);margin-bottom:12px;text-shadow:1px 1px 0 #000">🎓 ${t('studyHelp.selectYear')}</h4>
              <div class="grid grid-cols-3 gap-3">${yearsHtml}</div>
            </div>
            ${subjectsHtml}
            ${startBtnHtml}
          </div>
        </div>
      </div>`;
  },

  _renderQuiz(t) {
    const q = this._questions[this._currentQ];
    const progress = ((this._currentQ + 1) / this._questions.length) * 100;

    const optionsHtml = q.opts.map((opt, i) => {
      let cls = 'mc-border-2 p-3 text-left w-full transition-all cursor-pointer';
      let style = 'font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);border-width:2px;border-style:solid;';
      if (this._showResult) {
        if (i === q.answer) { style += 'background:#4CAF50;border-color:var(--mc-emerald-green);'; }
        else if (i === this._selectedAnswer) { style += 'background:#E53935;border-color:var(--mc-redstone-red);opacity:0.7;'; }
        else { style += 'opacity:0.5;'; }
      } else {
        style += 'background:transparent;';
      }
      return `<button data-study-answer="${i}" class="${cls}" style="${style}" ${this._showResult ? 'disabled' : ''}><span class="mr-2 font-bold">${String.fromCharCode(65 + i)}.</span> ${opt}</button>`;
    }).join('');

    let resultHtml = '';
    if (this._showResult) {
      const isCorrect = this._selectedAnswer === q.answer;
      const color = isCorrect ? 'var(--mc-emerald-green)' : 'var(--mc-redstone-red)';
      const msg = isCorrect ? t('studyHelp.correct') : t('studyHelp.wrong');
      const btnLabel = this._currentQ + 1 >= this._questions.length ? t('studyHelp.finish') : t('studyHelp.next');
      resultHtml = `
        <div class="mt-4 p-3 mc-border-2 animate-pixel-fade-in" style="background:var(--mc-bg-dark);border-width:2px;border-style:solid">
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${color}">${msg}</p>
          <p class="mt-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">💡 ${q.explanation}</p>
          <button id="study-next-q" class="mc-btn mc-btn-gold mt-3 w-full">${btnLabel} →</button>
        </div>`;
    }

    return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header flex items-center justify-between">
            <span>📖 ${t('studyHelp.title')}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">${t('studyHelp.question')} ${this._currentQ + 1} ${t('studyHelp.of')} ${this._questions.length} | ${t('studyHelp.score')}: ${this._score}</span>
          </div>
          <div class="mc-xp-bar mb-6"><div class="mc-xp-bar-fill" style="width:${progress}%"></div></div>
          <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);line-height:1.8;margin-bottom:16px">${q.q}</h3>
          <div class="space-y-3">${optionsHtml}</div>
          ${resultHtml}
        </div>
      </div>`;
  },

  _renderResults(t) {
    const pct = Math.round((this._score / this._questions.length) * 100);
    const msg = pct === 100 ? t('studyHelp.perfect') : pct >= 75 ? t('studyHelp.great') : pct >= 50 ? t('studyHelp.good') : t('studyHelp.needsWork');
    const emoji = pct === 100 ? '🏆' : pct >= 75 ? '⭐' : pct >= 50 ? '📚' : '💪';
    return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-fade-in text-center">
          <div class="mc-panel-header">📖 ${t('studyHelp.results')}</div>
          <div class="text-6xl my-6 animate-pixel-bounce">${emoji}</div>
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${this._score}/${this._questions.length}</h2>
          <p class="mt-2 mb-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-light-gray)">${pct}%</p>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">${msg}</p>
          <div class="flex gap-3 justify-center mt-6">
            <button id="study-back" class="mc-btn mc-btn-primary">📖 ${t('studyHelp.back')}</button>
            <button id="study-restart" class="mc-btn mc-btn-gold">🔄 ${t('studyHelp.restart')}</button>
          </div>
        </div>
      </div>`;
  },

  init(t) {
    const rebind = () => {
      // Year selection
      document.querySelectorAll('[data-study-year]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._selectedYear = btn.getAttribute('data-study-year');
          this._selectedSubject = null;
          playClick();
          this._rerender(t);
        });
      });

      // Subject selection
      document.querySelectorAll('[data-study-subject]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._selectedSubject = btn.getAttribute('data-study-subject');
          playClick();
          this._rerender(t);
        });
      });

      // Start quiz
      const startBtn = document.getElementById('study-start');
      if (startBtn) startBtn.addEventListener('click', () => this._startQuiz(t));

      // Answer selection
      document.querySelectorAll('[data-study-answer]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-study-answer'), 10);
          this._handleAnswer(idx, t);
        });
      });

      // Next question
      const nextBtn = document.getElementById('study-next-q');
      if (nextBtn) nextBtn.addEventListener('click', () => this._nextQuestion(t));

      // Back / Restart
      const backBtn = document.getElementById('study-back');
      if (backBtn) backBtn.addEventListener('click', () => this._resetQuiz(t));

      const restartBtn = document.getElementById('study-restart');
      if (restartBtn) restartBtn.addEventListener('click', () => this._startQuiz(t));
    };

    rebind();
    this._rebind = rebind;
  },

  _startQuiz(t) {
    if (!this._selectedYear || !this._selectedSubject) return;
    const qs = [...STUDY_QUESTIONS[this._selectedYear][this._selectedSubject]].sort(() => Math.random() - 0.5);
    this._questions = qs;
    this._currentQ = 0;
    this._selectedAnswer = null;
    this._score = 0;
    this._showResult = false;
    this._isFinished = false;
    playClick();
    this._rerender(t);
  },

  _handleAnswer(idx, t) {
    if (this._showResult) return;
    this._selectedAnswer = idx;
    this._showResult = true;
    if (idx === this._questions[this._currentQ].answer) {
      this._score++;
      playSuccess();
    } else {
      playError();
    }
    this._rerender(t);
  },

  _nextQuestion(t) {
    if (this._currentQ + 1 >= this._questions.length) {
      this._isFinished = true;
    } else {
      this._currentQ++;
      this._selectedAnswer = null;
      this._showResult = false;
    }
    playClick();
    this._rerender(t);
  },

  _resetQuiz(t) {
    this._selectedYear = null;
    this._selectedSubject = null;
    this._questions = [];
    this._isFinished = false;
    playClick();
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

export const studyHelpView = _studyHelp;
