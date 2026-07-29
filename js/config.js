export const CONFIG = {
  PROXY_URL: 'http://localhost:8421',
  SESSION_TIMEOUT: 10000,
  AI_TIMEOUT: 10000,
  MAX_SESSION_TURNS: 50,
  MAX_INPUT_LENGTH: 500,
  SCORE_WEIGHTS: {
    empathy: 20, rapport: 20, authenticity: 20,
    reflection: 10, questioning: 10, summarizing: 10, structuring: 10
  },
  SKILL_NAMES: {
    empathy: '공감적 반응', reflection: '반영 기술', questioning: '질문 전략',
    summarizing: '요약 기술', rapport: '라포 형성', structuring: '세션 구조화', authenticity: '진정성'
  },
  SKILL_KEYS: ['empathy', 'reflection', 'questioning', 'summarizing', 'rapport', 'structuring', 'authenticity'],
  CATEGORY_ICONS: { anxiety: '😰', relationship: '😔', identity: '🤔', self_esteem: '💪', loss: '🥀' },
  CATEGORY_MAP: {
    anxiety: '불안/스트레스', relationship: '대인관계', identity: '진로/정체성',
    self_esteem: '자존감', loss: '상실/트라우마'
  }
};
