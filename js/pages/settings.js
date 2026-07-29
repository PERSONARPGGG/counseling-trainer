import { store } from '../store.js';
import { $, $$, showToast, debounce } from '../utils/helpers.js';
import { checkAIProxy } from '../engine/ai-client.js';
import { CONFIG } from '../config.js';
import { initWizard } from './setup-wizard.js';

const APP_VERSION = '1.1.0';

const MODEL_MIGRATE = {
  'mistral-7b': 'mistralai/mistral-7b-instruct:free',
  'llama-3': 'meta-llama/llama-3.1-8b-instruct:free',
  'gemma-2': 'google/gemma-4-26b-a4b-it:free'
};

export function renderSettings(container) {
  const profile = store.getProfile();
  const settings = store.getSettings();

  if (settings.model && MODEL_MIGRATE[settings.model]) {
    settings.model = MODEL_MIGRATE[settings.model];
    store.saveSettings(settings);
  }

  if (!profile.onboarding_done || !settings.onboarding_done) {
    container.innerHTML = `
      <div class="page-title">⚙️ 시작하기</div>
      <p class="page-subtitle">상담사 프로필을 먼저 설정해주세요.</p>
      <div class="card" id="wizard-container"></div>`;
    initWizard($('#wizard-container'), () => renderSettings(container));
    return;
  }

  container.innerHTML = `
    <div class="page-title">⚙️ 설정</div>
    <p class="page-subtitle">상담사 프로필과 환경을 설정합니다.</p>

    <div class="card" id="advanced-settings">
      <div class="card-title">🔧 고급 설정</div>

      <div class="form-group">
        <label>OpenRouter API 키</label>
        <div class="input-group">
          <input type="password" id="api-key-input" value="${settings.api_key || ''}" placeholder="sk-or-v1-...">
          <button class="btn-icon btn-sm" id="toggle-key-visibility" title="표시/숨김">👁️</button>
        </div>
        <div class="form-help">https://openrouter.ai/keys · 로컬에만 저장 <span id="api-key-status" style="color:var(--success);display:${settings.api_key ? 'inline' : 'none'}">✓ 저장됨</span></div>
      </div>

      <div class="settings-toggle">
        <span>🤖 AI 모드 사용</span>
        <label class="switch">
          <input type="checkbox" id="ai-mode-toggle" ${settings.ai_mode ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="form-group" id="model-select-group" style="${!settings.ai_mode ? 'display:none' : ''}">
        <label>AI 모델</label>
        <select id="model-select">
          <option value="qwen/qwen2-7b-instruct:free" ${(!settings.model || settings.model === 'qwen/qwen2-7b-instruct:free') ? 'selected' : ''}>Qwen 2 7B (추천)</option>
          <option value="google/gemma-4-26b-a4b-it:free" ${settings.model === 'google/gemma-4-26b-a4b-it:free' ? 'selected' : ''}>Gemma 4 26B</option>
          <option value="mistralai/mistral-7b-instruct:free" ${settings.model === 'mistralai/mistral-7b-instruct:free' ? 'selected' : ''}>Mistral 7B</option>
          <option value="meta-llama/llama-3.1-8b-instruct:free" ${settings.model === 'meta-llama/llama-3.1-8b-instruct:free' ? 'selected' : ''}>Llama 3.1 8B</option>
          <option value="microsoft/phi-3-mini-4k-instruct:free" ${settings.model === 'microsoft/phi-3-mini-4k-instruct:free' ? 'selected' : ''}>Phi-3 Mini</option>
        </select>
        <div class="form-help">모델 변경 후 새로고침 필요</div>
      </div>

      <hr>

      <div class="card-title">🎨 테마</div>
      <div class="settings-toggle">
        <span>🌙 다크모드</span>
        <label class="switch"><input type="checkbox" id="dark-mode-toggle" ${document.body.classList.contains('dark-mode') ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="settings-toggle">
        <span>🔥 따뜻한 테마 (세피아)</span>
        <label class="switch"><input type="checkbox" id="warm-mode-toggle" ${settings.warm_mode ? 'checked' : ''}><span class="slider"></span></label>
      </div>

      <hr>

      <div class="card-title">🧩 편의 기능</div>
      <div class="settings-toggle">
        <span>💾 세션 자동 저장</span>
        <label class="switch"><input type="checkbox" id="auto-save-toggle" ${settings.auto_save !== false ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="settings-toggle">
        <span>🔊 효과음</span>
        <label class="switch"><input type="checkbox" id="sound-toggle" ${settings.sound_enabled ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="form-group">
        <label>🔤 채팅 글자 크기</label>
        <div class="option-grid" id="font-size-options">
          <div class="option-chip ${(settings.font_size||'medium')==='small'?'selected':''}" data-value="small">작게</div>
          <div class="option-chip ${(settings.font_size||'medium')==='medium'?'selected':''}" data-value="medium">보통</div>
          <div class="option-chip ${(settings.font_size||'medium')==='large'?'selected':''}" data-value="large">크게</div>
        </div>
      </div>

      <hr>

      <div class="card-title">🔌 AI 연결 (선택사항)</div>
      <div class="form-help" style="margin-top:-6px;margin-bottom:10px">Mock 모드는 서버 없이 즉시 사용 가능합니다. AI 모드는 프록시 서버와 API 키가 필요합니다.</div>
      <div class="ai-check-row">
        <button class="btn-primary btn-sm" id="check-ai-btn">🔑 API 키 확인</button>
        <span id="ai-status-text" style="font-size:14px;color:var(--text-light)">확인되지 않음</span>
      </div>

      <hr>

      <div class="card-title">📱 바탕화면 추가</div>
      <div class="ai-check-row">
        <button class="btn-secondary btn-sm" id="a2hs-btn">📲 바탕화면에 추가</button>
        <span style="font-size:13px;color:var(--text-light)" id="a2hs-status">브라우저 공유 메뉴에서 "홈 화면에 추가"를 선택하세요</span>
      </div>

      <hr>

      <div class="card-title">📦 데이터</div>
      <div class="btn-group" style="flex-wrap:wrap">
        <button class="btn-secondary btn-sm" id="export-btn">📥 내보내기</button>
        <button class="btn-secondary btn-sm" id="import-btn">📂 가져오기</button>
        <button class="btn-danger btn-sm" id="clear-settings-btn">⚙️ 설정만 초기화</button>
        <button class="btn-danger btn-sm" id="clear-btn">🗑️ 전체 초기화</button>
      </div>
      <div id="data-stats" class="data-stats-box">데이터 통계를 불러오는 중...</div>

      <hr>

      <div class="flex-between" style="padding:4px 0">
        <span style="font-size:13px;color:var(--text-muted)">앱 버전 ${APP_VERSION}</span>
        <span style="font-size:13px;color:var(--text-muted)">상담 자신감: <strong style="color:var(--accent-dark);font-size:15px">${'🟩'.repeat(Math.min(profile.confidence||5,5))}${'⬜'.repeat(Math.max(0,5-(profile.confidence||5)))} ${profile.confidence||5}/10</strong></span>
      </div>
    </div>
  `;

  /* --- Toggle bindings (single init) --- */
  function bindToggle(id, key) {
    const el = $(id);
    if (!el) return;
    el.onchange = function() {
      const s = store.getSettings();
      s[key] = this.checked;
      store.saveSettings(s);
      if (key === 'dark_mode') document.body.classList.toggle('dark-mode', this.checked);
      if (key === 'warm_mode') document.body.classList.toggle('warm-mode', this.checked);
    };
  }
  bindToggle('#ai-mode-toggle', 'ai_mode');
  bindToggle('#dark-mode-toggle', 'dark_mode');
  bindToggle('#warm-mode-toggle', 'warm_mode');
  bindToggle('#auto-save-toggle', 'auto_save');
  bindToggle('#sound-toggle', 'sound_enabled');

  $('#model-select').onchange = function() {
    const s = store.getSettings();
    s.model = this.value;
    store.saveSettings(s);
  };

  $$('#font-size-options .option-chip').forEach(chip => {
    chip.onclick = function() {
      $$('#font-size-options .option-chip').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      const s = store.getSettings();
      s.font_size = this.dataset.value;
      store.saveSettings(s);
    };
  });

  /* --- API key with debounce --- */
  const saveApiKey = debounce(function() {
    const s = store.getSettings();
    s.api_key = this.value.trim();
    store.saveSettings(s);
    const status = $('#api-key-status');
    if (status) status.style.display = this.value.trim() ? 'inline' : 'none';
  }, 400);

  $('#api-key-input').oninput = function() { saveApiKey.call(this); };

  $('#toggle-key-visibility').onclick = function() {
    const input = $('#api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
  };

  $('#check-ai-btn').onclick = async () => {
    const btn = $('#check-ai-btn');
    const status = $('#ai-status-text');
    btn.disabled = true; btn.textContent = '⏳ 확인 중...';
    status.textContent = '확인중...'; status.style.color = 'var(--text-light)';
    const key = store.getSettings().api_key;
    if (!key) {
      status.textContent = '⚠️ API 키를 입력해주세요'; status.style.color = '#ea580c';
      btn.disabled = false; btn.textContent = '🔑 API 키 확인';
      return;
    }
    status.textContent = '✅ API 키 저장됨'; status.style.color = 'var(--success)';
    const proxyOk = await checkAIProxy().catch(() => false);
    if (proxyOk) {
      status.textContent = '✅ AI 연결 완료'; status.style.color = 'var(--success)';
      showToast('AI 서버 정상 응답');
    } else {
      status.textContent = '✅ API 키 저장됨 · 프록시 미연결'; status.style.color = 'var(--success)';
      showToast('프록시 미실행 — Mock 모드로 사용 가능');
    }
    btn.disabled = false; btn.textContent = '🔑 API 키 확인';
  };

  $('#export-btn').onclick = () => {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'counseling-data-v2.json'; a.click();
    URL.revokeObjectURL(url); showToast('내보내기 완료');
  };

  $('#import-btn').onclick = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { store.importData(JSON.parse(ev.target.result)); showToast('가져오기 완료. 새로고침 필요.'); }
        catch { showToast('파일 형식 오류'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  $('#a2hs-btn').onclick = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) { showToast('✅ 이미 앱으로 실행 중입니다!'); return; }
    if (isIOS) showToast('① Safari 하단 공유 버튼(□↑) ② "홈 화면에 추가"를 선택하세요.');
    else if (isAndroid) showToast('① Chrome 우측 메뉴(⋮) ② "홈 화면에 추가"를 선택하세요.');
    else showToast('브라우저 메뉴에서 "홈 화면에 추가"를 찾아보세요.');
    const status = $('#a2hs-status');
    if (status) status.textContent = isIOS ? 'Safari 공유 → 홈 화면에 추가' : 'Chrome 메뉴 → 홈 화면에 추가';
  };

  $('#clear-btn').onclick = () => {
    if (confirm('모든 데이터를 초기화하시겠습니까?')) { store.clearAll(); showToast('초기화 완료. 새로고침 필요.'); }
  };
  $('#clear-settings-btn').onclick = () => {
    if (confirm('설정/프로필만 초기화하고 세션 유지?')) {
      store.clearSettings();
      showToast('설정 초기화. 새로고침 필요.');
    }
  };

  updateDataStats();
}

function updateDataStats() {
  const el = $('#data-stats');
  if (!el) return;
  const stats = store.getStats();
  const p = store.getProfile();
  el.innerHTML = `
    <div class="stats-mini">
      <div><strong>${stats.totalSessions}</strong><span>세션</span></div>
      <div><strong>${stats.totalClients}</strong><span>내담자</span></div>
      <div><strong>${p.total_sessions||0}</strong><span>완료</span></div>
      <div><strong>Lv.${stats.level||1}</strong><span>레벨</span></div>
    </div>
    ${stats.totalSessions ? '<div class="form-help">평균: ' + stats.avgScore + '점 · 최고: ' + stats.bestScore + '점</div>' : '<div class="form-help">아직 세션 없음</div>'}
  `;
}
