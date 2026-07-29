import { CONFIG } from '../config.js';

const ALT_EXAMPLES = {
  questioning: "'어떤 점이 가장 힘드셨나요?'처럼 개방형 질문을 활용해보세요.",
  reflection: "'지금 ~라고 느끼시는군요'와 같이 감정을 반영해보세요.",
  empathy: "'정말 힘드셨겠어요. 조금만 더 이야기해주실래요?'처럼 공감 + 개방을 함께.",
  summarizing: "'제가 이해한 바로는... 이게 맞을까요?' 식으로 요약하고 확인하세요.",
  structuring: "'오늘은 ~에 대해 이야기해보는 게 좋을 것 같습니다' 방향 제시를 해보세요.",
  rapport: "따뜻한 목소리 톤과 편안한 자세가 라포 형성에 도움됩니다.",
  authenticity: "진정성은 완벽함보다 솔직함에서 옵니다. '잘 모르겠어요'라고 말할 용기도 필요합니다."
};

export function generateScores(difficulty, turnsCompleted) {
  const base = difficulty === 'easy' ? 70 : difficulty === 'medium' ? 60 : 50;
  const v = () => Math.max(10, Math.min(95, base + Math.floor(Math.random() * 30) - 15 + Math.floor(turnsCompleted * 0.5)));
  return {
    empathy: v(), reflection: v(), questioning: v(),
    summarizing: v(), rapport: v(), structuring: v(), authenticity: v()
  };
}

export function generateFeedback(scores, clientName, responses = []) {
  const entries = Object.entries(CONFIG.SKILL_NAMES).map(([k, name]) => ({ key: k, name, score: scores[k] }));
  entries.sort((a, b) => b.score - a.score);
  const strengths = entries.slice(0, 2);
  const improvements = entries.slice(-2).reverse();

  const total = Math.round(entries.reduce((s, e) => {
    const w = CONFIG.SCORE_WEIGHTS;
    return s + e.score * w[e.key] / 100;
  }, 0));

  return {
    total,
    strengths: strengths.map(s => ({
      skill: s.name, score: s.score,
      comment: `${s.name} 점수가 높습니다. 지속적으로 유지하세요.`
    })),
    improvements: improvements.map(w => ({
      skill: w.name, score: w.score,
      suggestion: `${w.name}을(를) 더 발전시켜 보세요.`,
      example: ALT_EXAMPLES[w.key] || '다양한 방식으로 접근해보세요.'
    })),
    highlights: []
  };
}
