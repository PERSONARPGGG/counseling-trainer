import { initRouter, navigateTo, registerRoute } from './router.js';
import { store } from './store.js';
import { $, showToast } from './utils/helpers.js';
import { SCENARIOS } from '../data/scenarios.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderSession } from './pages/session.js';
import { renderAnalysis } from './pages/analysis.js';
import { renderSettings } from './pages/settings.js';

function init() {
  registerRoute('dashboard', renderDashboard);
  registerRoute('session', renderSession);
  registerRoute('analysis', renderAnalysis);
  registerRoute('settings', renderSettings);

  if (!store.getScenarios().length) {
    store.saveScenarios(SCENARIOS);
  }

  const profile = store.getProfile();
  const settings = store.getSettings();

  if (settings.dark_mode) document.body.classList.add('dark-mode');
  if (settings.warm_mode) document.body.classList.add('warm-mode');

  /* ── Splash screen ── */
  const splash = $('#splash-overlay');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('splash-hide');
      setTimeout(() => {
        splash.style.display = 'none';
        document.dispatchEvent(new Event('splash-done'));
      }, 500);
    }, 1500);
  }

  /* ── Add to homescreen banner (mobile, not standalone) ── */
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const a2hsDismissed = sessionStorage.getItem('a2hs_dismissed');

  if (isMobile && !isStandalone && !a2hsDismissed) {
    const banner = $('#a2hs-banner');
    if (banner) {
      setTimeout(() => { banner.style.display = 'flex'; }, 2200);
      $('#a2hs-close').onclick = () => {
        banner.style.display = 'none';
        sessionStorage.setItem('a2hs_dismissed', '1');
      };
    }
  }

  if (!profile.onboarding_done && !settings.onboarding_done) {
    initOnboarding();
  }

  const container = document.getElementById('page-container');
  initRouter(container, (route) => {
    const profile = store.getProfile();
    if (!profile.onboarding_done && route !== 'settings') {
      showToast('설정을 먼저 완료해주세요.');
    }
  });
}

function initOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  const text = document.getElementById('onboarding-text');
  const btn = document.getElementById('onboarding-btn');
  const dots = document.getElementById('onboarding-dots');

  if (!overlay || !btn) { console.warn('[Onboarding] 요소를 찾을 수 없음'); return; }

  const steps = [
    { t: '이 앱은 AI 가상 내담자와 상담 연습을 하고,<br>7개 항목의 피드백을 받을 수 있는 도구입니다.', b: '다음' },
    { t: '먼저 <strong>설정</strong>에서 상담사 프로필을 등록해주세요.<br>이론적 지향, 경력, 강점/약점을 설정합니다.', b: '설정하러 가기' },
    { t: '그런 다음 <strong>세션</strong>에서 내담자를 선택하고<br>실제 상담처럼 대화를 나눠보세요.', b: '시작하기' }
  ];

  let step = 0;
  if (dots) dots.innerHTML = steps.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');
  overlay.classList.remove('hidden');

  function showStep(i) {
    if (!text || !btn || !dots) return;
    text.innerHTML = steps[i].t;
    btn.textContent = steps[i].b;
    dots.querySelectorAll('span').forEach((s, j) => s.classList.toggle('active', j === i));
  }

  showStep(0);

  btn.onclick = () => {
    step++;
    if (step === 1) {
      showStep(1);
    } else if (step === 2) {
      showStep(2);
    } else {
      overlay.classList.add('hidden');
      navigateTo('settings');
    }
  };
}

init();
