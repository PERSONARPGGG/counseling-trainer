import { CONFIG } from '../config.js';

export function $(sel, ctx = document) { return ctx.querySelector(sel); }
export function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

export function html(tag, attrs = {}, children = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  if (typeof children === 'string') el.innerHTML = children;
  else if (Array.isArray(children)) children.forEach(c => el.appendChild(c));
  else if (children instanceof HTMLElement) el.appendChild(children);
  return el;
}

export function scoreClass(score) {
  if (score >= 75) return 'high';
  if (score >= 55) return 'med';
  return 'low';
}

export function calcWeightedTotal(scores) {
  const { SCORE_WEIGHTS } = CONFIG;
  const total = Object.keys(SCORE_WEIGHTS).reduce((sum, k) => sum + (scores[k] || 0) * SCORE_WEIGHTS[k] / 100, 0);
  return Math.round(total);
}

export function showToast(msg, duration = 3000, type = 'info') {
  const container = document.getElementById('toast-container');
  while (container.children.length >= 3) container.firstChild.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  const timer = setTimeout(() => { if (t.parentNode) t.remove(); }, duration);
  t.onclick = () => { clearTimeout(timer); t.remove(); };
}

export function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `<div class="overlay-box">
      <p style="margin-bottom:16px">${msg}</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn-secondary btn-sm" id="confirm-no">취소</button>
        <button class="btn-primary btn-sm" id="confirm-yes">확인</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const cleanup = (val) => { overlay.remove(); resolve(val); };
    const yesBtn = overlay.querySelector('#confirm-yes');
    const noBtn = overlay.querySelector('#confirm-no');
    yesBtn.onclick = () => cleanup(true);
    noBtn.onclick = () => cleanup(false);
    yesBtn.focus();
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
  });
}

export function debounce(fn, ms = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    const ctx = this;
    timer = setTimeout(() => fn.apply(ctx, args), ms);
  };
}

export function throttle(fn, ms = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export function formatTimestamp(date) {
  const d = new Date(date);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  return `${ampm} ${h % 12 || 12}:${m}`;
}

export function formatDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function sanitize(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

export function visualViewportHeight(el) {
  if (!window.visualViewport) return;
  const update = () => {
    const vh = window.visualViewport.height;
    el.style.setProperty('--vh-fix', `${vh - el.getBoundingClientRect().top - 60}px`);
    el.classList.toggle('visual-viewport-active', vh < window.innerHeight * 0.9);
  };
  window.visualViewport.addEventListener('resize', update);
  window.visualViewport.addEventListener('scroll', update);
  update();
}
