import { store } from '../store.js';
import { $, scoreClass } from '../utils/helpers.js';
import { renderRadarChart } from '../utils/charts.js';
import { navigateTo } from '../router.js';
import { SCENARIOS } from '../../data/scenarios.js';

export function renderAnalysis(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const id = params.get('id');

  if (!id) {
    container.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p>분석할 세션을 선택해주세요.</p><button class="btn-primary" onclick="window.location.hash=\'#dashboard\'">대시보드로</button></div>';
    return;
  }

  if (id.startsWith('compare:')) {
    renderComparison(container, id.replace('compare:', '').split(','));
    return;
  }

  const sessions = store.getSessions();
  const session = sessions.find(s => s.id === id);

  if (!session) {
    container.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p>세션을 찾을 수 없습니다.</p><button class="btn-primary" onclick="window.location.hash=\'#dashboard\'">대시보드로</button></div>';
    return;
  }

  const sc = SCENARIOS.find(s => s.id === session.client_id);
  const total = session.weighted_total;
  const scClass = scoreClass(total);

  const skillNames = {
    empathy: '공감적 반응', reflection: '반영 기술', questioning: '질문 전략',
    summarizing: '요약 기술', rapport: '라포 형성', structuring: '세션 구조화', authenticity: '진정성'
  };

  container.innerHTML = `
    <div class="analysis-header">
      <h2>세션 분석 리포트</h2>
      <p style="color:var(--text-light);margin-top:4px">
        ${session.date} · ${sc ? sc.client.name : '알 수 없음'} ${session.session_number}?차 · ${session.difficulty === 'easy' ? '간단' : session.difficulty === 'medium' ? '중간' : '심화'}
      </p>
      <div class="score-circle" style="margin:16px auto">
        <div class="big">${total}</div>
        <div class="sub">/100</div>
      </div>
      <div style="font-size:13px;color:var(--text-light)">AI 신뢰도 ${session.ai_confidence || 0}%</div>
      ${session.turns_completed >= session.total_turns ? '<div style="color:var(--success);font-weight:600;margin-top:4px">전체 세션 완료</div>' : '<div style="color:var(--warning);font-weight:600">?⚠️ 중도 종료</div>'}
    </div>

    <div class="card">
      <div class="card-title">?7개 항목별 점수</div>
      <canvas id="radar-canvas" height="250"></canvas>
      <div style="margin-top:12px">
        ${Object.entries(skillNames).map(([key, name]) => {
          const score = session.scores[key] || 0;
          const sc = scoreClass(score);
          return `<div class="feedback-item">
            <span>${name}</span>
            <span class="session-score ${sc}">${score}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${session.highlights?.length ? `
    <div class="card">
      <div class="card-title">?AI 주요 분석</div>
      ${session.highlights.filter(h => h?.type === 'strength').map(h =>
        `<div class="highlight-good">✅ ${h.text || '좋은 예'}</div>`
      ).join('')}
      ${session.highlights.filter(h => h?.type === 'improvement').map(h =>
        `<div class="highlight-bad">⚠️ ${h.text || '개선 필요'}</div>`
      ).join('')}
    </div>` : ''}

    <div class="card">
      <div class="card-title">💡 개선 제안</div>
      ${(session.improvements || []).length ? session.improvements.map(imp => `
        <div class="highlight-bad" style="margin-bottom:8px">
          <strong>${imp.skill || imp.suggestion}</strong><br>
          <span style="font-size:13px">${imp.example || ''}</span>
        </div>
      `).join('') : '<p style="color:var(--text-light);font-size:13px">Mock 모드에서는 기본 제안만 제공합니다.</p>'}
    </div>

    <div class="card">
      <div class="card-title">🧩 내담자의 진짜 감정</div>
      ${(session.hidden_emotions || []).map(he => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-light);font-weight:600">[${he.phase}]</div>
          <div style="margin-top:2px">"${he.emotion}"</div>
        </div>
      `).join('')}
    </div>

    ${session.counselor_notes?.length ? `
    <div class="card">
      <div class="card-title">📝 상담 메모</div>
      ${session.counselor_notes.map(n => `<p style="font-style:italic;color:var(--text-light)">"${n}"</p>`).join('')}
    </div>` : ''}

    <div class="btn-group" style="margin-top:16px">
      <button class="btn-secondary btn-block" id="back-dash">대시보드로</button>
      <button class="btn-primary btn-block" id="export-report">📄 보고서 내보내기</button>
    </div>
  `;

  requestAnimationFrame(() => {
    const canvas = $('#radar-canvas');
    if (canvas) renderRadarChart(canvas, session.scores);
  });

  $('#back-dash').onclick = () => navigateTo('dashboard');
  $('#export-report').onclick = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `session-${session.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };
}

function renderComparison(container, ids) {
  const sessions = store.getSessions().filter(s => ids.includes(s.id));
  if (sessions.length < 2) {
    container.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p>비교할 세션이 부족합니다.</p><button class="btn-primary" onclick="window.location.hash=\'#dashboard\'">대시보드로</button></div>';
    return;
  }

  const skillNames = ['empathy', 'reflection', 'questioning', 'summarizing', 'rapport', 'structuring', 'authenticity'];
  const skillLabels = ['공감', '반영', '질문', '요약', '라포', '구조화', '진정성'];

  container.innerHTML = `
    <h2 style="margin:16px 0">📊 세션 비교</h2>
    <div class="card">
      <div class="card-title">?회차별 점수 비교</div>
      <canvas id="compare-radar" height="250"></canvas>
    </div>
    <div class="card">
      <div class="card-title">📊 상세 점수</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><th style="text-align:left;padding:8px;border-bottom:1px solid var(--border)">세션</th>
        ${sessions.map(s => `<th style="text-align:center;padding:8px;border-bottom:1px solid var(--border)">${store.formatDate(s.date)}</th>`).join('')}</tr>
        ${skillLabels.map((label, i) => `
          <tr><td style="padding:6px 8px;border-bottom:1px solid var(--border)">${label}</td>
          ${sessions.map(s => `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border)">${s.scores[skillNames[i]]}</td>`).join('')}</tr>
        `).join('')}
        <tr style="font-weight:700"><td style="padding:8px">총점</td>
        ${sessions.map(s => `<td style="text-align:center;padding:8px">${s.weighted_total}</td>`).join('')}</tr>
      </table>
    </div>
    <button class="btn-secondary" style="width:100%" onclick="window.location.hash='#dashboard'">대시보드로</button>
  `;

  requestAnimationFrame(() => {
    const canvas = $('#compare-radar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#D4956A', '#5B9F6B', '#5B9FC0'];
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: skillLabels,
        datasets: sessions.map((s, i) => ({
          label: store.formatDate(s.date),
          data: skillNames.map(k => s.scores[k]),
          borderColor: colors[i % 3],
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  });
}
