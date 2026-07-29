import { CONFIG } from '../config.js';
import { store } from '../store.js';

const PROXY_URL = CONFIG.PROXY_URL;

export async function getAIAnalysis(responses, scenario, difficulty) {
  const settings = store.getSettings();
  const c = scenario.client;
  const p = scenario.personality || c.personality || {};
  const conversation = responses.map(r =>
    `${r.role === 'counselor' ? '상담사' : '내담자'}: ${r.text}`
  ).join('\n');

  const prompt = `당신은 상담 교육 전문가입니다. 아래 상담 대화를 분석해주세요.

## 내담자 정보
- 이름: ${c.name}, ${c.age}세, 문제: ${scenario.problem || ''}
- 성격: 개방성 ${p.o || '?'}/10, 성실성 ${p.c || '?'}/10, 외향성 ${p.e || '?'}/10, 우호성 ${p.a || '?'}/10, 신경증 ${p.n || '?'}/10
- 난이도: ${difficulty}

## 대화 내용
${conversation}

## 분석 요청
다음 7개 항목을 각각 0~100점으로 평가하고, 2가지 강점과 2가지 개선점을 구체적으로 제시해주세요.

### 평가 항목 (가중치 포함)
1. 공감적 반응 (20%) - 상담사가 내담자의 감정에 공감했는가
2. 라포 형성 (20%) - 신뢰 관계를 잘 형성했는가
3. 진정성 (20%) - 진실된 태도로 임했는가
4. 반영 기술 (10%) - 내담자의 말을 잘 반영했는가
5. 질문 전략 (10%) - 적절한 질문을 활용했는가
6. 요약 기술 (10%) - 대화를 잘 요약했는가
7. 세션 구조화 (10%) - 세션을 체계적으로 이끌었는가

### 강점 분석
- 대화에서 가장 잘한 점 2가지를 선택
- 각 강점에 대해 **대화 중 구체적인 예시 문장을 인용**해서 설명
- 왜 이 응답이 효과적이었는지 분석

### 개선 제안
- 가장 개선이 필요한 2가지를 선택
- 각 개선점에 대해 **구체적인 조언**과 **더 나은 대체 응답 예시**를 제시
- 왜 원래 응답이 덜 효과적이었는지 설명

### 숨은 감정 분석
- 내담자의 성격 정보(개방성 ${p.o || '?'}/10, 신경증 ${p.n || '?'}/10)를 고려하여 분석
- 내담자가 말로 표현하지 않았을 것으로 추정되는 진짜 감정/생각을 2~3가지 추측
- 각 감정에 대해 "표면적으로는 ~라고 말했지만, 속으로는 ~했을 것 같다" 형식으로 구체적으로 서술

### 종합 평가
- 7개 항목 점수를 가중치대로 계산한 총점 (0~100)
- 전체 세션에 대한 포괄적인 평가 (3~5문장)

## 출력 형식 (반드시 아래 JSON 형식으로만 응답)
{
  "scores": {"empathy": 0, "rapport": 0, "authenticity": 0, "reflection": 0, "questioning": 0, "summarizing": 0, "structuring": 0},
  "weighted_total": 0,
  "strengths": [{"skill": "항목명", "example": "대화에서 인용한 구체적 예시", "reason": "이 응답이 효과적이었던 이유"}],
  "improvements": [{"skill": "항목명", "suggestion": "구체적 개선 조언", "alternative": "더 나은 응답 예시", "reason": "원래 응답이 덜 효과적이었던 이유"}],
  "hidden_emotions": [{"surface": "내담자가 말로 표현한 것", "real": "실제로 느꼈을 것으로 추정되는 감정/생각"}],
  "summary": "전체적인 포괄적 평가 (3~5문장)"
}`;

  const models = [settings.model || 'google/gemma-4-26b-a4b-it:free', 'qwen/qwen2-7b-instruct:free'];
  let lastError;

  for (const model of models) {
    try {
      const res = await fetch(`${PROXY_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          api_key: settings.api_key || undefined,
          system_prompt: 'You are a counseling supervision expert. Analyze conversations in Korean. Always respond with valid JSON only, no other text.',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 2000
        })
      });

      const data = await res.json();
      if (data.error) { lastError = data.error; continue; }

      try {
        const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.scores && parsed.weighted_total !== undefined) return parsed;
        lastError = 'Incomplete response';
      } catch (e) {
        lastError = 'Parse failed';
        continue;
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(lastError || 'Analysis failed');
}
