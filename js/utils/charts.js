import { CONFIG } from '../config.js';

let radarChartInstance = null;
let lineChartInstance = null;
let chartInitialized = false;

function initChartJs() {
  if (chartInitialized) return;
  chartInitialized = true;
}

function getColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function renderRadarChart(canvas, scores) {
  if (!canvas || typeof Chart === 'undefined') return;
  if (radarChartInstance) radarChartInstance.destroy();
  initChartJs();
  const primary = getColor('--accent') || '#D4956A';
  const ctx = canvas.getContext('2d');
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['공감', '반영', '질문', '요약', '라포', '구조화', '진정성'],
      datasets: [{
        label: '이번 세션',
        data: CONFIG.SKILL_KEYS.map(k => scores[k] || 0),
        backgroundColor: primary + '25',
        borderColor: primary,
        borderWidth: 2,
        pointBackgroundColor: primary,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 11 } } } },
      plugins: { legend: { display: false } }
    }
  });
}

export function renderLineChart(canvas, sessions) {
  if (!canvas || typeof Chart === 'undefined') return;
  if (lineChartInstance) lineChartInstance.destroy();
  initChartJs();
  if (sessions.length < 2) {
    canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px">2회 이상 세션을 완료하면 추이 그래프가 표시됩니다.</p>';
    return;
  }
  const ctx = canvas.getContext('2d');
  const labels = sessions.map((s, i) => `${i + 1}회`);
  const colors = [
    getColor('--accent') || '#D4956A',
    getColor('--success') || '#5B9F6B',
    getColor('--primary') || '#5B9FC0',
    getColor('--warning') || '#D4A050',
    '#A07AB8',
    getColor('--danger') || '#C9716A',
    '#4DA8A0'
  ];

  const datasets = CONFIG.SKILL_KEYS.map((sk, i) => ({
    label: CONFIG.SKILL_NAMES[sk],
    data: sessions.map(s => s.scores[sk]),
    borderColor: colors[i],
    backgroundColor: 'transparent',
    borderWidth: 2,
    tension: 0.3,
    pointRadius: 3
  }));

  lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } }
    }
  });
}
