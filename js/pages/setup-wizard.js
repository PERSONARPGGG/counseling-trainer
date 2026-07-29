import { $, $$, showToast } from '../utils/helpers.js';
import { store } from '../store.js';

const ORIENTATIONS = [
  { value: 'human-centered', label: '인간중심' },
  { value: 'cbt', label: 'CBT (인지행동)' },
  { value: 'psychodynamic', label: '정신역동' },
  { value: 'solution-focused', label: '해결중심' },
  { value: 'existential', label: '실존주의' },
  { value: 'integrative', label: '통합적' }
];
const EXPERIENCES = ['초급', '중급', '고급', '전문가'];
const ALL_SKILLS = ['공감', '반영', '질문', '요약', '라포', '구조화', '진정성'];

function chip(val, label, group, selected) {
  return `<div class="option-chip ${selected ? 'selected' : ''}" data-value="${val}" data-group="${group}">${label}</div>`;
}

function getStepHTML(step, profile) {
  switch(step) {
    case 1: return `
      <h3>① 상담 이론적 지향</h3>
      <p class="form-help" style="margin-bottom:12px">당신의 상담 접근법과 가장 가까운 이론을 선택하세요.</p>
      <div class="option-grid">
        ${ORIENTATIONS.map(o => chip(o.value, o.label, 'orientation', profile.orientation === o.value)).join('')}
      </div>`;
    case 2: return `
      <h3>② 상담 경력 수준</h3>
      <p class="form-help" style="margin-bottom:12px">현재 당신의 경력 단계를 선택하세요.</p>
      <div class="option-grid">
        ${EXPERIENCES.map(e => chip(e, e, 'experience', profile.experience === e)).join('')}
      </div>`;
    case 3: return `
      <h3>③ 주요 강점 (2개 선택)</h3>
      <p class="form-help" style="margin-bottom:12px">상담사로서 가장 자신 있는 기술을 2개 선택하세요.</p>
      <div class="option-grid">
        ${ALL_SKILLS.map(s => chip(s, s, 'strengths', profile.strengths.includes(s))).join('')}
      </div>`;
    case 4: return `
      <h3>④ 개발 필요 영역 (2개 선택)</h3>
      <p class="form-help" style="margin-bottom:12px">앞으로 발전시키고 싶은 기술을 2개 선택하세요.</p>
      <div class="option-grid">
        ${ALL_SKILLS.map(s => chip(s, s, 'weaknesses', profile.weaknesses.includes(s))).join('')}
      </div>`;
    case 5: return `
      <h3>⑤ 상담 자신감</h3>
      <p class="form-help" style="margin-bottom:12px">현재 자신의 상담 능력에 대한 자신감을 평가하세요.</p>
      <div class="form-group">
        <label>자신감 점수 <strong id="confidence-val" style="color:var(--accent-dark)">${profile.confidence||5}</strong>/10</label>
        <input type="range" min="1" max="10" value="${profile.confidence||5}" id="confidence-slider" style="width:100%">
        <div class="flex-between form-help"><span>낮음</span><span>높음</span></div>
      </div>`;
    default: return '';
  }
}

function saveCurrentStep(s) {
  const p = store.getProfile();
  if (s === 1) { const sel = $('.option-chip.selected[data-group="orientation"]'); if (sel) p.orientation = sel.dataset.value; }
  else if (s === 2) { const sel = $('.option-chip.selected[data-group="experience"]'); if (sel) p.experience = sel.dataset.value; }
  else if (s === 3) { p.strengths = $$('.option-chip.selected[data-group="strengths"]').map(c => c.dataset.value); }
  else if (s === 4) { p.weaknesses = $$('.option-chip.selected[data-group="weaknesses"]').map(c => c.dataset.value); }
  else if (s === 5) { p.confidence = parseInt($('#confidence-slider')?.value) || 5; }
  store.saveProfile(p);
}

export function initWizard(container, onComplete) {
  const profile = store.getProfile();
  let step = 1;

  container.innerHTML = `
    <div id="setup-steps"></div>
    <div class="flex-between" style="margin-top:8px">
      <span style="font-size:13px;color:var(--text-muted)">단계 ${step}/5</span>
      <button class="btn-ghost btn-sm" id="skip-wizard">건너뛰기 →</button>
    </div>
    <div class="progress-bar-track"><div class="progress-bar-fill" id="setup-progress-fill" style="width:${step/5*100}%"></div></div>
    <div class="btn-group flex-between" style="margin-top:14px">
      <button class="btn-secondary btn-sm" id="setup-prev" ${step <= 1 ? 'disabled' : ''}>← 이전</button>
      <button class="btn-primary btn-sm" id="setup-next">${step >= 5 ? '완료' : '다음 →'}</button>
    </div>
  `;

  function bindChips() {
    $$('.option-chip').forEach(chip => {
      chip.onclick = () => {
        const group = chip.dataset.group;
        if (group === 'strengths' || group === 'weaknesses') {
          chip.classList.toggle('selected');
        } else {
          $$(`.option-chip[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
        }
      };
    });
  }

  function render(s) {
    const stepsEl = $('#setup-steps');
    if (!stepsEl) return;
    stepsEl.innerHTML = getStepHTML(s, store.getProfile());
    bindChips();
    const fill = $('#setup-progress-fill');
    if (fill) fill.style.width = `${s/5*100}%`;
    $('#setup-prev').disabled = s <= 1;
    $('#setup-next').textContent = s >= 5 ? '✅ 완료' : '다음 →';
  }

  render(step);

  $('#setup-next').onclick = () => {
    if (step >= 5) {
      saveCurrentStep(step);
      const p = store.getProfile();
      p.onboarding_done = true;
      store.saveProfile(p);
      const s = store.getSettings();
      s.onboarding_done = true;
      store.saveSettings(s);
      showToast('✅ 설정 저장 완료!');
      if (onComplete) onComplete();
      return;
    }
    saveCurrentStep(step);
    step++;
    render(step);
  };

  $('#setup-prev').onclick = () => {
    if (step <= 1) return;
    step--;
    render(step);
  };

  $('#skip-wizard').onclick = () => {
    const p = store.getProfile();
    p.onboarding_done = true;
    store.saveProfile(p);
    const s = store.getSettings();
    s.onboarding_done = true;
    store.saveSettings(s);
    if (onComplete) onComplete();
  };
}
