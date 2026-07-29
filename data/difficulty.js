export const DIFFICULTY_CONFIG = {
  easy: {
    label: '초급',
    turns: 10,
    cooperation: '높음',
    desc: '쉽게 마음을 염',
    baseScore: 70,
    scoreVariance: 30,
    scoreTurnBonus: 0.3
  },
  medium: {
    label: '중급',
    turns: 15,
    cooperation: '중간',
    desc: '보통 수준',
    baseScore: 60,
    scoreVariance: 25,
    scoreTurnBonus: 0.5
  },
  hard: {
    label: '고급',
    turns: 20,
    cooperation: '낮음',
    desc: '깊은 문제',
    baseScore: 50,
    scoreVariance: 20,
    scoreTurnBonus: 0.7
  }
};

export const DIFFICULTY_LABELS = {
  easy: '초급', medium: '중급', hard: '고급'
};
