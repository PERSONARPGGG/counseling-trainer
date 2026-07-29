import { store } from '../store.js';
import { $, $$, showToast, confirmDialog, formatTimestamp, debounce, visualViewportHeight } from '../utils/helpers.js';
import { SCENARIOS, DIFFICULTY_MAP } from '../../data/scenarios.js';
import { DIFFICULTY_CONFIG } from '../../data/difficulty.js';
import { getMockResponse, getHiddenEmotion, initMockState } from '../engine/mock-client.js';
import { checkAIProxy, getAIResponse } from '../engine/ai-client.js';
import { navigateTo } from '../router.js';
import { CONFIG } from '../config.js';

const OFF_TOPIC_WORDS = ['더워', '날씨', '밥', '점심', '커피', '드라마', '영화', '운동', '취미', '주말'];
const CONTEXT_WINDOW = 8;

const STATE = {
  scenario: null, difficulty: 'medium', turn: 0,
  phase: 'intro', paused: false, responses: [], notes: '',
  mockState: null, aiMode: false, lastActivity: Date.now(),
  sessionStart: null, lastSentText: '', timerInterval: null, mcqMode: false,
  totalTurns: 15, aiModel: 'qwen/qwen2-7b-instruct:free'
};

function getMcqOptions(turn, phase) {
  const banks = {
    intro: [
      '요즘 어떤 일로 힘드신가요?',
      '좀 더 자세히 이야기해주실 수 있나요?',
      '처음 그 느낌이 들었을 때, 어떤 상황이었나요?',
      '그래서 지금 가장 힘든 점이 무엇인가요?',
      '언제부터 그렇게 느끼기 시작했나요?'
    ],
    middle: [
      '그 점에 대해 어떻게 생각하시나요?',
      '그럴 때 주로 어떻게 대처하셨나요?',
      '그 경험이 다른 관계에도 영향을 주었나요?',
      '지금 가장 바꾸고 싶은 것은 무엇인가요?',
      '그 상황에서 가장 필요했던 것은 무엇인가요?'
    ],
    late: [
      '오늘 이야기하면서 새롭게 깨달은 점이 있나요?',
      '앞으로 어떻게 달라지고 싶으신가요?',
      '이번 세션을 통해 어떤 도움을 받으셨나요?',
      '다음 세션 전까지 무엇을 시도해보고 싶으신가요?',
      '오늘 나눈 이야기 중 가장 의미 있었던 부분은?'
    ]
  };
  return banks[phase] || banks.intro;
}

export function renderSession(container) {
  if (!store.getProfile().onboarding_done) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 20px">
        <h3 style="margin-bottom:12px">먼저 설정을 완료해주세요</h3>
        <p style="color:var(--text-light);margin-bottom:20px">세션을 시작하기 전에 프로필을 설정해야 합니다.</p>
        <button class="btn-primary" id="go-settings">설정하러 가기</button>
      </div>`;
    $('#go-settings').onclick = () => navigateTo('settings');
    return;
  }

  const pending = store.getPendingSession();
  if (pending) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 20px">
        <h3 style="margin-bottom:12px">이전에 진행중인 세션이 있습니다</h3>
        <p style="color:var(--text-light);margin-bottom:20px">이전에 중단된 세션을 이어서 진행하시겠습니까?</p>
        <div class="btn-center" style="gap:10px">
          <button class="btn-primary btn-lg" id="resume-yes">이어서 진행</button>
          <button class="btn-secondary btn-lg" id="resume-no">새로 시작</button>
        </div>
      </div>`;
    $('#resume-yes').onclick = () => { Object.assign(STATE, pending); startSession(container); };
    $('#resume-no').onclick = () => { store.clearPendingSession(); showScenarioSelect(container); };
    return;
  }
  showScenarioSelect(container);
}

function showMcqOptions(container, options) {
  let existing = $('#mcq-bar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.id = 'mcq-bar';
  bar.style.cssText = 'padding:6px 10px;display:flex;gap:5px;flex-wrap:wrap;border-top:1px solid var(--border-light);background:rgba(255,252,248,0.85);flex-shrink:0';
  options.forEach(o => {
    const btn = document.createElement('button');
    btn.className = 'btn-ghost btn-sm';
    btn.textContent = o;
    btn.style.cssText = 'font-size:13px;padding:5px 10px;background:var(--bg-warm);border:1px solid var(--border-light);border-radius:16px;flex:1;min-width:80px;max-width:48%';
    btn.onclick = () => {
      const input = $('#chat-input');
      if (input) input.value = o;
      const sb = $('#send-btn');
      if (sb) sb.click();
    };
    bar.appendChild(btn);
  });
  const ref = container.querySelector('.chat-input-area');
  if (!ref || !container.contains(ref)) return;
  container.insertBefore(bar, ref);
}

function showScenarioSelect(container) {
  const CATEGORY_ICONS = CONFIG.CATEGORY_ICONS;

  container.innerHTML = `
    <div class="page-title">💬 새 세션</div>
    <p class="page-subtitle">상담할 내담자를 선택하고 난이도를 골라주세요</p>
    <div id="scenario-list" class="scenario-list"></div>
    <div class="card" style="margin-top:16px">
      <div class="card-title">난이도</div>
      <p class="form-help" style="margin-bottom:10px">내담자의 문제 깊이와 개방성을 결정합니다</p>
      <div class="diff-btns">
        ${Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => `
          <div class="diff-btn ${key === 'medium' ? 'active' : ''}" data-diff="${key}">
            ${cfg.label}
            <span class="diff-turns">${cfg.desc} · ${cfg.turns}턴</span>
          </div>
        `).join('')}
      </div>
    </div>
    <button class="btn-primary btn-lg btn-block" id="confirm-scenario" disabled>내담자 선택 후 시작</button>
  `;

  const list = $('#scenario-list');
  let selectedId = null;
  const clients = store.getClients();

  SCENARIOS.forEach(sc => {
    const clientState = clients.find(c => c.client_id === sc.id);
    const card = document.createElement('div');
    card.className = 'card scenario-card';
    const icon = CATEGORY_ICONS[sc.category] || '💬';
    const bgShort = sc.background.slice(0, 70);
    card.innerHTML = `
      <div class="flex" style="gap:14px;align-items:flex-start">
        <div class="msg-avatar" style="width:44px;min-width:44px;height:44px;font-size:18px;background:linear-gradient(135deg,#8AB4C8,var(--primary));color:#fff">${sc.client.name[0]}</div>
        <div style="flex:1;min-width:0">
          <div class="flex" style="gap:6px;align-items:center;flex-wrap:wrap">
            <span class="scenario-name">${sc.client.name}</span>
            <span style="font-size:13px;color:var(--text-light)">${sc.client.age}세 · ${sc.client.gender === '여' ? '여성' : '남성'}</span>
            ${clientState ? `<span class="badge">${clientState.session_count}회</span>` : '<span class="badge" style="background:var(--accent-light);color:var(--accent-dark)">신규</span>'}
            ${sc.crisis ? '<span class="crisis-badge">위기</span>' : ''}
          </div>
          <div class="scenario-detail">${icon} ${sc.problem}</div>
          <details style="margin-top:4px;font-size:13px;color:var(--text-muted)">
            <summary style="cursor:pointer">상세 정보 보기</summary>
            <p style="margin-top:4px;line-height:1.5">${sc.background}</p>
            <p style="margin-top:4px">성격: 개방성 ${sc.personality.openness}/10 · 신경증 ${sc.personality.neuroticism}/10</p>
          </details>
        </div>
      </div>`;
    card.onclick = () => {
      $$('.scenario-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedId = sc.id;
      const btn = $('#confirm-scenario');
      btn.disabled = false;
      btn.textContent = `${sc.client.name}님과 시작`;
    };
    list.appendChild(card);
  });

  $$('.diff-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  $('#confirm-scenario').onclick = () => {
    const sc = SCENARIOS.find(s => s.id === selectedId);
    const diff = $('.diff-btn.active')?.dataset.diff || 'medium';
    const settings = store.getSettings();
    STATE.scenario = sc;
    STATE.difficulty = diff;
    STATE.turn = 0;
    STATE.responses = [];
    STATE.notes = '';
    STATE.mockState = initMockState(sc.id);
    STATE.lastActivity = Date.now();
    STATE.aiModel = settings.model || 'qwen/qwen2-7b-instruct:free';
    STATE.mcqMode = false;
    STATE.totalTurns = DIFFICULTY_CONFIG[diff].turns || 15;
    STATE.aiMode = false;
    startSession(container);
  };
}

function startSession(container) {
  STATE.phase = 'intro';
  if (!STATE.sessionStart) STATE.sessionStart = Date.now();
  if (STATE.timerInterval) clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(updateTimer, 1000);

  container.innerHTML = `
    <div class="chat-header">
      <div>
        <strong>${STATE.scenario.client.name}</strong>
        <span style="font-size:14px;color:var(--text-light);font-weight:400">(${STATE.scenario.client.gender}, ${STATE.scenario.client.age}세)</span>
        ${STATE.scenario.crisis ? '<span class="crisis-badge">⚠️ 위기</span>' : ''}
        <div class="chat-sub">
          ${STATE.scenario.difficulty ? STATE.scenario.difficulty[STATE.difficulty]?.desc || '' : ''}
          <span id="ai-indicator" style="margin-left:6px;padding:1px 8px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg);color:var(--text-muted)">○ Mock</span>
          <span id="session-timer" style="margin-left:4px;font-size:11px;color:var(--text-muted)">⏱ 0:00</span>
        </div>
        <div class="progress-bar-track" style="margin-top:6px;height:4px;background:var(--border-light)">
          <div class="progress-bar-fill" id="turn-progress" style="width:${STATE.turn/STATE.totalTurns*100}%;height:4px;background:linear-gradient(90deg,var(--accent),var(--success))"></div>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn-secondary btn-sm" id="mcq-toggle-btn" title="객관식 지원">📋</button>
        <button class="btn-secondary btn-sm" id="ai-toggle-btn">🤖 AI 켜기</button>
        <button class="btn-icon btn-sm" id="pause-btn" title="일시정지">⏸</button>
        <button class="btn-icon btn-sm btn-danger" id="end-btn" title="세션 종료">✕</button>
      </div>
    </div>
    <div class="hint-bar" id="hint-bar">
      <span id="hint-icon">💡</span>
      <span id="hint-text"></span>
    </div>
    <div class="chat-container" style="position:relative" id="chat-container-main">
      <div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="상담 대화"></div>
      <button id="scroll-bottom-btn" style="display:none">↓</button>
      <div class="chat-input-area" id="chat-input-area">
        <button class="btn-icon btn-sm" id="memo-btn" title="메모">📝</button>
        <button class="btn-icon btn-sm" id="undo-btn" title="실행취소" style="display:none">↩</button>
        <input type="text" id="chat-input" placeholder="내담자에게 할 말을 입력하세요... (Enter)" maxlength="${CONFIG.MAX_INPUT_LENGTH}" autofocus>
        <button class="btn-primary btn-icon btn-sm" id="send-btn" title="전송 (Enter)">➤</button>
      </div>
    </div>
  `;

  const msgArea = $('#chat-messages');
  const input = $('#chat-input');
  const sendBtn = $('#send-btn');
  const pauseBtn = $('#pause-btn');
  const endBtn = $('#end-btn');
  const memoBtn = $('#memo-btn');
  const containerMain = $('#chat-container-main');

  /* Font size */
  const settings = store.getSettings();
  if (settings.font_size === 'small') msgArea.classList.add('font-small');
  else if (settings.font_size === 'large') msgArea.classList.add('font-large');

  /* Mobile keyboard fix */
  visualViewportHeight(containerMain);

  /* Topic drift */
  function detectTopicDrift(text) {
    const currentTopic = STATE.mockState?.topics?.[STATE.mockState.topicIndex]?.label || '';
    if (!currentTopic) return null;
    if (OFF_TOPIC_WORDS.some(w => text.includes(w))) {
      return { drift: true, msg: `💡 현재 주제는 "${currentTopic}"입니다.` };
    }
    return null;
  }

  function showHint(data) {
    const bar = document.getElementById('hint-bar');
    const text = document.getElementById('hint-text');
    const icon = document.getElementById('hint-icon');
    if (!bar || !text) return;
    if (!data) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    text.textContent = data.msg;
    if (icon) icon.textContent = data.drift ? '💡' : '✅';
    clearTimeout(bar._hintTimer);
    bar._hintTimer = setTimeout(() => { bar.style.display = 'none'; }, 6000);
  }

  /* Message rendering */
  function addMessage(type, text, timestamp) {
    const ts = timestamp || Date.now();
    if (type === 'system') {
      const el = document.createElement('div');
      el.className = 'msg-system';
      el.textContent = text;
      msgArea.appendChild(el);
      autoScroll();
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${type}`;
    wrapper.setAttribute('role', 'listitem');
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = type === 'client' ? STATE.scenario.client.name[0] : '나';
    wrapper.appendChild(avatar);
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    const label = document.createElement('div');
    label.className = 'msg-label';
    label.textContent = type === 'client' ? STATE.scenario.client.name : '나(상담사)';
    if (type === 'counselor') {
      const tsSpan = document.createElement('span');
      tsSpan.style.cssText = 'font-weight:400;opacity:0.6;margin-left:6px';
      tsSpan.textContent = formatTimestamp(ts);
      label.appendChild(tsSpan);
    }
    bubble.appendChild(label);
    const content = document.createElement('div');
    content.textContent = text;
    bubble.appendChild(content);
    wrapper.appendChild(bubble);
    msgArea.appendChild(wrapper);
    autoScroll();
  }

  let scrollCb;

  function autoScroll(force) {
    const sb = $('#scroll-bottom-btn');
    const atBottom = msgArea.scrollHeight - msgArea.scrollTop - msgArea.clientHeight < 120;
    if (atBottom || force) {
      msgArea.scrollTop = msgArea.scrollHeight;
      if (sb) sb.style.display = 'none';
    } else if (sb) {
      sb.style.display = 'flex';
    }
  }

  function checkScroll() {
    const sb = $('#scroll-bottom-btn');
    if (!sb) return;
    const atBottom = msgArea.scrollHeight - msgArea.scrollTop - msgArea.clientHeight < 80;
    sb.style.display = atBottom ? 'none' : 'flex';
  }
  if (scrollCb) msgArea.removeEventListener('scroll', scrollCb);
  scrollCb = checkScroll;
  msgArea.addEventListener('scroll', scrollCb);
  const sbBtn = $('#scroll-bottom-btn');
  if (sbBtn) sbBtn.onclick = () => { msgArea.scrollTop = msgArea.scrollHeight; sbBtn.style.display = 'none'; };

  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper client';
    wrapper.id = 'typing-wrapper';
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = STATE.scenario.client.name[0];
    wrapper.appendChild(avatar);
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    wrapper.appendChild(typing);
    msgArea.appendChild(wrapper);
    autoScroll(true);
  }

  function hideTyping() {
    const t = document.getElementById('typing-wrapper');
    if (t) t.remove();
  }

  function showThinking(text) {
    const indicator = document.createElement('div');
    indicator.id = 'ai-thinking';
    indicator.innerHTML = '<div style="display:flex;align-items:center;gap:8px;justify-content:center"><span style="width:8px;height:8px;background:var(--primary);border-radius:50%;animation:pulse-dot 1.2s infinite"></span><span style="font-weight:600;color:var(--primary);font-size:13px">' + STATE.scenario.client.name + '</span><span style="color:var(--text-muted);font-size:12px">' + text + '</span></div>';
    msgArea.appendChild(indicator);
    autoScroll(true);
    const aiStatus = $('#ai-indicator');
    if (aiStatus) { aiStatus.style.background = '#FBF3EA'; aiStatus.textContent = '● ' + STATE.scenario.client.name + ' 생각중'; }
  }

  function hideThinking() {
    try {
      const el = document.getElementById('ai-thinking');
      if (el) el.remove();
      const aiStatus = $('#ai-indicator');
      if (aiStatus) { aiStatus.style.background = '#EAF0F5'; aiStatus.textContent = '● AI ' + STATE.aiModel.split('/')[1] || STATE.aiModel; }
    } catch (e) {}
  }

  /* MCQ toggle */
  const mcqToggleBtn = $('#mcq-toggle-btn');
  if (mcqToggleBtn) {
    mcqToggleBtn.onclick = () => {
      STATE.mcqMode = !STATE.mcqMode;
      mcqToggleBtn.style.background = STATE.mcqMode ? 'var(--accent-light)' : '';
      if (STATE.mcqMode) showMcqOptions(container, getMcqOptions(STATE.turn, STATE.phase));
      else { const bar = $('#mcq-bar'); if (bar) bar.remove(); }
    };
  }

  /* Send message */
  function sendMessage() {
    if (STATE.paused) { showToast('일시정지된 상태입니다'); return; }
    const text = input.value.trim();
    if (!text || text.length < 1) return;
    if (text.length > CONFIG.MAX_INPUT_LENGTH) { showToast(`${CONFIG.MAX_INPUT_LENGTH}자 이내로 입력해주세요.`); return; }

    const drift = detectTopicDrift(text);
    showHint(drift);

    const now = Date.now();
    addMessage('counselor', text, now);
    STATE.responses.push({ role: 'counselor', text, turn: STATE.turn, timestamp: now });
    STATE.lastSentText = text;
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    const undoBtn = $('#undo-btn');
    if (undoBtn) { undoBtn.style.display = 'inline-flex'; undoBtn.onclick = undoLast; }

    const mcqBar = $('#mcq-bar');
    if (mcqBar) mcqBar.style.display = 'none';

    showTyping();
    STATE.lastActivity = Date.now();

    setTimeout(async () => {
      hideTyping();
      STATE.turn++;

      const phase = STATE.turn <= 5 ? 'intro' : STATE.turn <= 12 ? 'middle' : 'late';
      STATE.phase = phase;
      updateTurnProgress();

      let clientMsg;
      if (STATE.aiMode) {
        showThinking('답변을 생각하는 중...');
        try {
          const ctx = STATE.responses.slice(-CONTEXT_WINDOW * 2);
          clientMsg = await Promise.race([
            getAIResponse(ctx, STATE.scenario, STATE.difficulty, STATE.phase),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), CONFIG.AI_TIMEOUT))
          ]);
        } catch (e) {}
        hideThinking();
        if (!clientMsg) clientMsg = getMockResponse(STATE.mockState, text, STATE.difficulty);
      } else {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 1200));
        clientMsg = getMockResponse(STATE.mockState, text, STATE.difficulty);
      }

      const ts = Date.now();
      addMessage('client', clientMsg, ts);
      STATE.responses.push({ role: 'client', text: clientMsg, turn: STATE.turn, timestamp: ts });

      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
      savePending();

      if (STATE.mcqMode && mcqBar) { mcqBar.style.display = 'flex'; mcqBar.innerHTML = ''; }
      if (STATE.mcqMode) showMcqOptions(container, getMcqOptions(STATE.turn, STATE.phase));
    }, 800 + Math.random() * 1200);
  }

  function updateTurnProgress() {
    const bar = $('#turn-progress');
    if (bar) bar.style.width = `${Math.min(STATE.turn / STATE.totalTurns * 100, 100)}%`;
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const warnBeforeLeave = (e) => { if (STATE.responses.length > 1) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', warnBeforeLeave);

  /* AI toggle */
  const aiToggleBtn = $('#ai-toggle-btn');
  function updateAIIndicator() {
    const indicator = $('#ai-indicator');
    if (!indicator) return;
    if (STATE.aiMode) {
      indicator.style.background = 'var(--success-bg)';
      indicator.style.color = 'var(--success)';
      indicator.textContent = '● AI: ' + (STATE.aiModel?.split('/')[1] || STATE.aiModel);
    } else {
      indicator.style.background = 'var(--bg)';
      indicator.style.color = 'var(--text-muted)';
      indicator.textContent = '○ Mock';
    }
    if (aiToggleBtn) aiToggleBtn.textContent = STATE.aiMode ? '🔴 AI 끄기' : '🟢 AI 켜기';
  }
  updateAIIndicator();
  if (aiToggleBtn) {
    aiToggleBtn.onclick = async () => {
      if (STATE.aiMode) { STATE.aiMode = false; updateAIIndicator(); showToast('Mock 모드'); return; }
      aiToggleBtn.textContent = '⏳ 확인중...';
      aiToggleBtn.disabled = true;
      const s = store.getSettings();
      if (!s.api_key) { showToast('⚠️ 설정에서 API 키 입력 필요'); aiToggleBtn.textContent = '🟢 AI 켜기'; aiToggleBtn.disabled = false; return; }
      const ok = await checkAIProxy().catch(() => false);
      if (!ok) { showToast('⚠️ 프록시 미실행 — Mock 모드로 대체됩니다'); aiToggleBtn.textContent = '🟢 AI 켜기'; aiToggleBtn.disabled = false; return; }
      STATE.aiMode = true;
      updateAIIndicator();
      showToast('✅ AI 모드');
      aiToggleBtn.disabled = false;
    };
  }

  pauseBtn.onclick = () => {
    STATE.paused = !STATE.paused;
    pauseBtn.textContent = STATE.paused ? '▶️' : '⏸';
    pauseBtn.title = STATE.paused ? '재개' : '일시정지';
    if (STATE.paused) { input.disabled = true; sendBtn.disabled = true; }
    else { input.disabled = false; sendBtn.disabled = false; input.focus(); }
  };

  endBtn.onclick = async () => {
    if (STATE.turn < 2) { showToast('최소 2턴 이상 진행해주세요.'); return; }
    const ok = await confirmDialog('세션을 종료하시겠습니까?');
    if (ok) finishSession();
  };

  memoBtn.onclick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="overlay-box">
        <h3 style="margin-bottom:12px">📝 상담 메모</h3>
        <textarea id="memo-textarea" rows="5" placeholder="세션 중 중요한 내용을 기록해주세요...">${STATE.notes}</textarea>
        <div class="btn-center mt-3">
          <button class="btn-primary btn-sm" id="memo-save">저장</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const saveMemo = () => {
      STATE.notes = overlay.querySelector('#memo-textarea').value;
      savePending();
      overlay.remove();
    };
    overlay.querySelector('#memo-save').onclick = saveMemo;
    overlay.querySelector('#memo-textarea').focus();
  };

  /* Opening message */
  if (STATE.responses.length === 0) {
    setTimeout(async () => {
      let opening;
      if (STATE.aiMode) {
        showThinking('AI가 첫마디를 준비중...');
        try {
          opening = await getAIResponse(STATE.responses, STATE.scenario, STATE.difficulty, 'intro', STATE.aiModel);
          hideThinking();
        } catch (e) {
          hideThinking();
          opening = getMockResponse(STATE.mockState, '', STATE.difficulty);
        }
      } else {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 1000));
        opening = getMockResponse(STATE.mockState, '', STATE.difficulty);
      }
      if (!opening) opening = "안녕하세요... 말을 어떻게 시작해야 할지 모르겠네요.";
      addMessage('client', opening);
      STATE.responses.push({ role: 'client', text: opening, turn: 0 });
      updateTurnProgress();
      savePending();
      if (STATE.mcqMode) showMcqOptions(container, getMcqOptions(0, 'intro'));
    }, 400);
  } else {
    STATE.responses.forEach(r => addMessage(r.role, r.text));
    input.disabled = false;
    sendBtn.disabled = false;
    updateTurnProgress();
  }

  function updateTimer() {
    if (!STATE.sessionStart) return;
    const elapsed = Math.floor((Date.now() - STATE.sessionStart) / 1000);
    const el = $('#session-timer');
    if (el) el.textContent = `⏱ ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  }

  function savePending() {
    store.savePendingSession({
      scenario: STATE.scenario, difficulty: STATE.difficulty,
      turn: STATE.turn, phase: STATE.phase, responses: STATE.responses,
      notes: STATE.notes, mockState: STATE.mockState, lastActivity: Date.now()
    });
  }

  function undoLast() {
    if (STATE.responses.length < 2) return;
    const removed = STATE.responses.splice(-2);
    STATE.turn = Math.max(0, STATE.turn - 1);
    while (msgArea.lastChild && msgArea.children.length > STATE.turn * 2 + 1) {
      msgArea.removeChild(msgArea.lastChild);
    }
    const undoBtn = $('#undo-btn');
    if (undoBtn) undoBtn.style.display = 'none';
    input.disabled = false;
    sendBtn.disabled = false;
    input.value = STATE.lastSentText || '';
    input.focus();
    updateTurnProgress();
    savePending();
    showToast(`"${(removed[0]?.text || '').slice(0, 20)}..." 취소됨`);
  }

  function finishSession() {
    if (STATE.timerInterval) { clearInterval(STATE.timerInterval); STATE.timerInterval = null; }
    (async () => {
      let scores, feedback, weighted_total, ai_analysis = null;

      if (STATE.aiMode && STATE.responses.length >= 4) {
        try {
          const { getAIAnalysis } = await import('../engine/ai-analysis.js');
          addMessage('system', '⏳ AI 분석 중...');
          ai_analysis = await getAIAnalysis(STATE.responses, STATE.scenario, STATE.difficulty);
          scores = ai_analysis.scores;
          weighted_total = ai_analysis.weighted_total || Math.round(
            (scores.empathy * 20 + scores.rapport * 20 + scores.authenticity * 20 +
             scores.reflection * 10 + scores.questioning * 10 + scores.summarizing * 10 + scores.structuring * 10) / 100
          );
          feedback = {
            summary: ai_analysis.summary || '',
            strengths: ai_analysis.strengths || [],
            improvements: (ai_analysis.improvements || []).map(i => ({
              skill: i.skill, score: 0,
              suggestion: i.suggestion + (i.alternative ? `\n💡 다른 접근법: ${i.alternative}` : ''),
              example: i.alternative || ''
            }))
          };
        } catch (e) {}
      }

      if (!scores) {
        const { generateScores, generateFeedback } = await import('../utils/feedback.js');
        scores = generateScores(STATE.difficulty, STATE.turn);
        feedback = generateFeedback(scores, STATE.scenario.client.name, STATE.responses);
        weighted_total = Math.round(
          (scores.empathy * 20 + scores.rapport * 20 + scores.authenticity * 20 +
           scores.reflection * 10 + scores.questioning * 10 + scores.summarizing * 10 + scores.structuring * 10) / 100
        );
      }

      const hiddenEmotions = ai_analysis?.hidden_emotions?.length >= 3 ? ai_analysis.hidden_emotions : [
        { phase: '초기', emotion: getHiddenEmotion(STATE.mockState) },
        { phase: '중기', emotion: getHiddenEmotion(STATE.mockState) },
        { phase: '후기', emotion: getHiddenEmotion(STATE.mockState) }
      ];

      const sessionData = {
        id: store.genId(),
        client_id: STATE.scenario.id,
        difficulty: STATE.difficulty,
        session_number: (store.getClient(STATE.scenario.id)?.session_count || 0) + 1,
        date: store.formatDate(Date.now()),
        duration_minutes: Math.round((Date.now() - STATE.lastActivity) / 60000) || 15,
        turns_completed: STATE.turn,
        total_turns: STATE.totalTurns,
        scores, weighted_total,
        ai_confidence: STATE.aiMode ? 85 : 0,
        highlights: feedback.strengths?.map(s => `${s.skill}: ${s.example || s.suggestion}`) || feedback.highlights || [],
        hidden_emotions: hiddenEmotions,
        improvements: feedback.improvements || [],
        counselor_notes: STATE.notes ? [STATE.notes] : [],
        references: [], keywords: [STATE.scenario.category],
        milestones_achieved: [], ai_analysis_raw: ai_analysis
      };

      store.addSession(sessionData);
      const clientData = store.getClient(STATE.scenario.id) || { client_id: STATE.scenario.id, session_count: 0, trust_level: 50, emotional_state: 'neutral', last_session_date: '', last_summary: '', next_focus: '' };
      clientData.session_count = (clientData.session_count || 0) + 1;
      clientData.trust_level = Math.min(100, (clientData.trust_level || 50) + 5);
      clientData.last_session_date = store.formatDate(Date.now());
      clientData.last_summary = `${clientData.session_count}회 상담 완료.`;
      store.updateClient(STATE.scenario.id, clientData);

      const profile = store.getProfile();
      profile.total_sessions = (profile.total_sessions || 0) + 1;
      store.saveProfile(profile);

      store.clearPendingSession();
      input.disabled = true;
      sendBtn.disabled = true;

      addMessage('system', '✅ 세션 완료! 분석 리포트가 생성되었습니다.');
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-primary';
      viewBtn.textContent = '📊 분석 리포트 보기';
      viewBtn.style.cssText = 'margin:14px auto 8px;display:block';
      viewBtn.onclick = () => navigateTo('analysis', { id: sessionData.id });
      $('#chat-messages').appendChild(viewBtn);
    })();
  }
}
