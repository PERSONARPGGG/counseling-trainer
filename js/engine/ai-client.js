import { CONFIG } from '../config.js';
import { store } from '../store.js';

const PROXY_URL = CONFIG.PROXY_URL;

const FALLBACK_MODELS = [
  'qwen/qwen2-7b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'microsoft/phi-3-mini-4k-instruct:free'
];

const MODEL_DISPLAY = {
  'qwen/qwen2-7b-instruct:free': 'Qwen 2 7B',
  'google/gemma-4-26b-a4b-it:free': 'Gemma 4',
  'mistralai/mistral-7b-instruct:free': 'Mistral 7B',
  'meta-llama/llama-3.1-8b-instruct:free': 'Llama 3.1',
  'microsoft/phi-3-mini-4k-instruct:free': 'Phi-3'
};

const BANNED = [
  '계속 말씀해주세요', '좀 더 이야기해볼까요', '말씀하신 대로',
  '오늘은 여기까지 할게요', '더 할 말이 없는', '그런 것 같기도 하고요',
  '그렇게 말씀해주시니까'
];

function cleanResponse(text) {
  let cleaned = text.trim();
  for (const phrase of BANNED) {
    const idx = cleaned.indexOf(phrase);
    if (idx !== -1) cleaned = cleaned.slice(0, idx).trim();
  }
  return cleaned || '...';
}

export async function checkAIProxy() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isLocal) return false;
  try {
    const settings = store.getSettings();
    const res = await fetch(`${PROXY_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.status !== 'ok') return false;
    if (!settings.api_key) return false;
    return true;
  } catch {
    return false;
  }
}

function msgType(text) {
  if (!text) return 'START';
  if (text.includes('?') || /(어떤|무슨|언제|어디|누가|왜|어떻게|까요|나요|세요|ㄴ가요)\s*$/.test(text)) return 'QUESTION';
  if (/^(안녕|반갑|처음|어서)/.test(text)) return 'GREETING';
  return 'STATEMENT';
}

function extractTopic(text) {
  const patterns = [
    /(.{0,20}?)(?:이야기|문제|일|점|생각|기분|관계|부분).{0,10}?(?:해주|말씀|알려|이야기)/,
    /(?:어떤|무슨|무슨)\s*(.{0,20}?)(?:이|가|을|를)\s*(?:문제|일|이유)/
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1] || m[0];
  }
  return '';
}

function buildPrompt(responses, scenario, difficulty, phase) {
  const c = scenario.client;
  const p = scenario.personality || c.personality;
  const last = [...responses].reverse().find(r => r.role === 'counselor');
  const lastText = last ? last.text : '';
  const type = msgType(lastText);
  const topic = extractTopic(lastText);

  const traits = [];
  if (p.extraversion <= 2) traits.push('reserved');
  if (p.neuroticism >= 4) traits.push('anxious');
  if (p.openness <= 2) traits.push('guarded');
  if (traits.length === 0) traits.push('ordinary');

  const topicRule = topic
    ? `\n[강제] 상담사가 "${topic}"에 대해 물었습니다. 반드시 "${topic}"에 대해서만 답변하세요. 다른 이야기로 절대 바꾸지 마세요.`
    : '';

  return `${c.name}님 (${c.age}세/${c.gender}, ${traits.join(', ')}).
문제: ${scenario.problem}
배경: ${c.background}

상담사: "${lastText}" (${type})${topicRule}

${c.name}:`;
}

export async function getAIResponse(responses, scenario, difficulty, phase, model) {
  const settings = store.getSettings();
  const prompt = buildPrompt(responses, scenario, difficulty, phase);

  const systemMsg = `당신은 한국어 상담을 받는 내담자입니다. 절대 지켜야 할 규칙:
1. 상담사가 질문하면 즉시 직접 답변하세요. '음...', '글쎄요', '그러니까요' 같은 머뭇거림 금지.
2. 상담사가 특정 주제(상사, 친구, 가족 등)를 질문하면 그 주제만 이야기하세요. 다른 주제로 바꾸지 마세요.
3. 절대 말하지 마세요: ${BANNED.slice(0, 4).join(', ')}
4. 세션을 먼저 종료하지 마세요. 상담사만 종료할 수 있습니다.
5. 1-2문장으로 자연스럽게 한국어로 답변하세요.`;

  const models = model ? [model, ...FALLBACK_MODELS.filter(m => m !== model)] : FALLBACK_MODELS;
  let lastError;

  for (const m of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.AI_TIMEOUT || 15000);
      const res = await fetch(`${PROXY_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m,
          api_key: settings.api_key || undefined,
          system_prompt: systemMsg,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 150
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (data.error) { lastError = data.error; continue; }
      return cleanResponse(data.text);
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }
  throw new Error(lastError || 'All models failed');
}
