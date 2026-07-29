import { store } from '../store.js';
import { $, $$, scoreClass, calcWeightedTotal, debounce } from '../utils/helpers.js';
import { renderRadarChart, renderLineChart } from '../utils/charts.js';
import { navigateTo } from '../router.js';
import { SCENARIOS } from '../../data/scenarios.js';
import { CONFIG } from '../config.js';

export function renderDashboard(container) {
  const sessions = store.getSessions();
  const profile = store.getProfile();
  const clients = store.getClients();
  const stats = store.getStats();
  const totalSessions = stats.totalSessions;
  const recent = sessions.length ? sessions[sessions.length - 1] : null;

  const weaknesses = profile.weaknesses.length ? profile.weaknesses : ['질문', '반영'];
  const worstScore = recent && weaknesses.length
    ? Math.min(...weaknesses.map(w => {
        const keyMap = { '공감': 'empathy', '반영': 'reflection', '질문': 'questioning', '요약': 'summarizing', '라포': 'rapport', '구조화': 'structuring', '진정성': 'authenticity' };
        return recent.scores[keyMap[w]] || 0;
      }))
    : 0;

  container.innerHTML = `
    <div class="flex-between" style="margin:20px 0 10px">
      <div>
        <div class="page-title" style="font-size:36px;font-weight:800">🫂 대시보드</div>
        <p class="page-subtitle" style="font-size:16px;margin-top:6px">${profile.name ? profile.name + ' 상담사 · ' : ''}Lv.${profile.level} ${profile.experience || '수련생'} · 자신감 ${'🟩'.repeat(Math.min(profile.confidence||5,5))}${'⬜'.repeat(Math.max(0,5-(profile.confidence||5)))} ${profile.confidence||5}/10</p>
      </div>
    </div>

    ${totalSessions === 0 ? `
      <div class="card" style="text-align:center;padding:48px 20px">
        <div style="font-size:52px;margin-bottom:16px">🫂</div>
        <h3 style="margin-bottom:6px">환영합니다, ${profile.name || '상담사'}님!</h3>
        <p style="color:var(--text-light);margin-bottom:6px">아직 완료한 세션이 없습니다.<br>첫 세션을 시작하고 상담 기술을 발전시켜보세요.</p>
        <p class="form-help" style="margin-bottom:24px">설정에서 프로필을 먼저 등록하면 더 정확한 분석을 받을 수 있습니다.</p>
        <div class="btn-center">
          <button class="btn-primary btn-lg" id="start-first-session">💬 첫 세션 시작하기</button>
          <button class="btn-secondary btn-lg" id="go-settings-dash">⚙️ 설정</button>
        </div>
      </div>
    ` : `
      <div class="focus-box card">
        <div style="font-size:15px;opacity:0.9;font-weight:600">🎯 오늘의 학습 포커스</div>
        <div class="focus-text">
          ${weaknesses.join(', ')} 점수가 ${worstScore}점으로 가장 낮습니다.<br>
          <strong>이번 세션에서는 ${weaknesses[0]} 기술에 집중해보세요.</strong>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="num">${stats.totalSessions}</div><div class="label">전체 세션</div></div>
        <div class="stat-card"><div class="num">${stats.avgScore}</div><div class="label">평균 점수</div></div>
        <div class="stat-card"><div class="num">${stats.bestScore}</div><div class="label">최고 점수</div></div>
      </div>

      <div class="btn-group" style="margin:0 0 12px">
        <button class="btn-primary btn-lg btn-block" id="start-session-btn">💬 새 세션 시작</button>
        ${sessions.length > 1 ? `<button class="btn-secondary" id="compare-btn">📊 세션 비교</button>` : ''}
      </div>
    `}

    ${totalSessions > 0 ? `
      <div class="card">
        <div class="card-title">📈 항목별 점수 추이</div>
        <canvas id="line-chart-canvas" height="180"></canvas>
      </div>

      <div class="card">
        <div class="card-title">💪 강점 / 약점</div>
        <div class="flex" style="gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px">
            <p style="font-size:14px;font-weight:600;color:var(--success);margin-bottom:6px">강점 TOP3</p>
            ${getStrengthsWeaknesses(sessions, 'top').map(s => `<span class="strength-tag good">${s.skill} ${s.score}</span>`).join('')}
          </div>
          <div style="flex:1;min-width:120px">
            <p style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:6px">약점 TOP3</p>
            ${getStrengthsWeaknesses(sessions, 'bottom').map(s => `<span class="strength-tag bad">${s.skill} ${s.score}</span>`).join('')}
          </div>
        </div>
      </div>

      ${recent ? `
      <div class="card card-accent">
        <div class="card-title">🕐 최근 세션</div>
        <div class="flex-between">
          <div>
            <strong style="font-size:17px">${findClientName(recent.client_id) || '알 수 없음'}</strong>
            <div class="form-help">${recent.date} · ${DIFFICULTY_LABELS[recent.difficulty] || recent.difficulty} · ${recent.turns_completed}/${recent.total_turns}턴</div>
          </div>
          <div class="session-score ${scoreClass(recent.weighted_total || calcWeightedTotal(recent.scores))}">${recent.weighted_total || calcWeightedTotal(recent.scores)}</div>
        </div>
        <button class="btn-secondary btn-sm mt-2" id="view-recent-btn">📋 분석 보기</button>
      </div>` : ''}
    ` : ''}

    <div class="card">
      <div class="card-title">
        📋 세션 기록 ${clients.length > 0 ? `<span class="badge">${clients.length}명 진행중</span>` : ''}
        ${sessions.length > 3 ? `<span style="float:right"><input type="text" id="search-sessions" placeholder="🔍 검색..." style="width:140px;padding:4px 10px;font-size:13px;min-height:30px"></span>` : ''}
      </div>
      <div id="session-list-container">
        ${sessions.length === 0 ? '<div class="empty-state"><div class="icon">📋</div><p>아직 세션 기록이 없습니다.</p></div>' :
          renderSessionList(sessions)
        }
      </div>
    </div>
  `;

  if (totalSessions > 0) {
    requestAnimationFrame(() => {
      const lineCanvas = $('#line-chart-canvas');
      if (lineCanvas) renderLineChart(lineCanvas, sessions);
    });
  }

  $('#start-session-btn')?.addEventListener('click', () => navigateTo('session'));
  $('#start-first-session')?.addEventListener('click', () => navigateTo('session'));
  $('#go-settings-dash')?.addEventListener('click', () => navigateTo('settings'));
  $('#view-recent-btn')?.addEventListener('click', () => {
    if (recent) navigateTo('analysis', { id: recent.id });
  });

  bindSessionItems();
  $('#compare-btn')?.addEventListener('click', () => {
    const ids = sessions.slice(-3).map(s => s.id).join(',');
    navigateTo('analysis', { id: 'compare:' + ids });
  });

  /* Search */
  const searchInput = $('#search-sessions');
  if (searchInput) {
    searchInput.oninput = debounce(function() {
      const q = this.value.trim().toLowerCase();
      const filtered = q ? sessions.filter(s => {
        const name = findClientName(s.client_id) || '';
        return name.toLowerCase().includes(q) || s.date?.includes(q) || s.difficulty?.includes(q);
      }) : sessions;
      const listContainer = $('#session-list-container');
      if (listContainer) listContainer.innerHTML = renderSessionList(filtered);
      bindSessionItems();
    }, 200);
  }
}

function renderSessionList(sessions) {
  return [...sessions].reverse().slice(0, 20).map(s => {
    const total = s.weighted_total || calcWeightedTotal(s.scores);
    const sc = scoreClass(total);
    const clientInfo = findClientName(s.client_id);
    return `<div class="session-item" data-id="${s.id}">
      <div>
        <div style="font-weight:600;font-size:16px">${clientInfo || '알 수 없음'}</div>
        <div class="session-date">${s.date} · ${DIFFICULTY_LABELS[s.difficulty] || s.difficulty} · ${s.turns_completed}/${s.total_turns}턴</div>
      </div>
      <div class="session-score ${sc}">${total}</div>
    </div>`;
  }).join('');
}

function bindSessionItems() {
  $$('.session-item').forEach(item => {
    item.onclick = () => navigateTo('analysis', { id: item.dataset.id });
  });
}

function findClientName(clientId) {
  const sc = SCENARIOS.find(s => s.id === clientId);
  return sc ? sc.client.name : clientId;
}

function getStrengthsWeaknesses(sessions, type) {
  if (!sessions.length) return [];
  const skillMap = { empathy: '공감', reflection: '반영', questioning: '질문', summarizing: '요약', rapport: '라포', structuring: '구조화', authenticity: '진정성' };
  const latest = sessions[sessions.length - 1];
  const entries = Object.entries(skillMap).map(([k, v]) => ({ skill: v, score: latest.scores[k] || 0 }));
  entries.sort((a, b) => type === 'top' ? b.score - a.score : a.score - b.score);
  return entries.slice(0, 3);
}

const DIFFICULTY_LABELS = { easy: '초급', medium: '중급', hard: '고급' };
