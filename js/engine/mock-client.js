const CATEGORY_WORDS = {
  feel: ['힘들', '어렵', '괴롭', '지치', '슬프', '화나', '불안', '두렵', '외롭', '우울', '속상', '답답'],
  open_q: ['어떻게', '어떠', '왜', '무엇', '말씀', '이야기', '설명', '언제', '어디'],
  empathy: ['이해', '공감', '그렇겠', '힘들었', '속상하', '안타깝', '힘드셨', '그렇군'],
  close_q: ['네?', '아니오?', '그런가요', '맞나요', '그래요?'],
  resistance: ['괜찮', '상관없', '몰라', '글쎄', '별로', '귀찮'],
  support: ['조금', '도움', '함께', '천천히', '괜찮', '좋겠', '안녕']
};

function detectCategory(text) {
  for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some(w => text.includes(w))) return cat;
  }
  return 'default';
}

function isQuestion(text) {
  return text.includes('?') || /(어떤|무슨|언제|어디|누가|왜|어떻게|까요|나요|세요|ㄴ가요|어떠|뭘|뭐|몇)\s*$/.test(text) || /(어떠|어떤|뭔)\s/.test(text);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const SCENARIO_PROFILES = {
  sc_001: {
    name: '김지은',
    problem: '직장 스트레스와 번아웃',
    hiddenEmotions: [
      "상사에게 인정받고 싶지만 인정하지 않아 섭섭하고 분하다",
      "번아웃을 인정하면 약해 보일까 봐 두렵다",
      "회사를 그만두고 싶지만 경제적 불안정이 더 무섭다"
    ],
    topics: [
      { id: 't1', label: '일과 부담', said: false },
      { id: 't2', label: '신체 증상', said: false },
      { id: 't3', label: '상사 관계', said: false },
      { id: 't4', label: '자신감 하락', said: false },
      { id: 't5', label: '대인관계 축소', said: false },
      { id: 't6', label: '변화 욕구', said: false },
      { id: 't7', label: '희망/마무리', said: false }
    ],
    responses: {
      on_topic: [
        "요즘 회사에서 일이 너무 많아요. 밤낮없이 일하는데도 끝이 없고... 수면제 없인 잠도 못 자요.",
        "두통이 자주 오고 속도 안 좋아요. 병원 가보니 다 신경성이라는데... 스트레스가 몸으로 나오는 것 같아요.",
        "사실 상사랑 관계도 문제예요. 아무리 해도 인정을 안 해줘요. 제가 부족해서 그런 걸까요?",
        "예전엔 일에 자신감이 있었는데 요즘은 내가 뭘 해도 안 될 것 같은 생각이 들어요.",
        "친구들 연락도 다 끊겼어요. 만나서 불평만 하는 것 같고... 그냥 혼자 있는 게 편해요.",
        "이대로 살 순 없는 것 같은데... 어떻게 바꿔야 할지 모르겠어요.",
        "오늘 말씀드리면서 조금은 가벼워진 것 같아요. 제 이야기를 들어주는 사람이 있다는 게 위로가 됩니다."
      ],
      greeting: ["안녕하세요... 사실 오늘 오기가 너무 힘들었어요. 상담 받는 게 처음이라서 어떻게 말씀드려야 할지 모르겠어요."],
      empathy_answered: ["(목소리가 떨리며) 네... 정말 그랬어요. 아무도 몰라줘서 더 외로웠어요. 말씀해주셔서 감사합니다."],
      empathy_unanswered: ["(눈시울이 붉어지며) 감사합니다... 사실 아직도 마음 정리가 잘 안 돼요."],
      question_answered: ["음... 생각해보니까 [{topic}] 때문인 것 같아요. 말하면서 조금씩 정리되는 느낌이에요."],
      question_unanswered: ["아... 그건 생각해본 적 없어요. 솔직히 [{topic}]에 대해서는 어떻게 말해야 할지 모르겠어요."],
      off_topic: ["그런가요... (잠시 멍하니) 사실 요즘 제일 힘든 건 [{topic}] 문제예요. 그 이야기를 좀 하고 싶었어요."],
      support: ["네, 그 말씀에 힘이 나네요. 조금만 더 이야기해도 될까요?"],
      closing: ["오늘 말씀드리니까 좀 정리되는 것 같아요. 다음에 또 오겠습니다. 감사합니다."],
      exhausted: ["음... 할 말을 다 한 것 같아요. 듣고 싶은 게 있으시면 물어봐주세요."]
    }
  },
  sc_002: {
    name: '박민호',
    problem: '사회적 고립과 대인관계 어려움',
    hiddenEmotions: [
      "사람을 믿고 싶지만 또 상처받을까 봐 무섭다",
      "외롭다는 사실조차 인정하기 싫다",
      "누군가 다가와주길 바라면서도 밀어내는 자신이 답답하다"
    ],
    topics: [
      { id: 't1', label: '재택 고립', said: false },
      { id: 't2', label: '관계 단절', said: false },
      { id: 't3', label: '외로움', said: false },
      { id: 't4', label: '과거 상처', said: false },
      { id: 't5', label: '자기보호', said: false },
      { id: 't6', label: '변화 시도', said: false },
      { id: 't7', label: '마무리', said: false }
    ],
    responses: {
      greeting: ["네... (침묵) 뭐라고 시작해야 할지... 사실 올 필요가 있을까 싶었어요."],
      on_topic: [
        "일은 그냥 그래요. 재택이라 사람 만날 일이 거의 없어요.",
        "친구요? 몇 년째 연락하는 사람 없어요. 연락하는 게 귀찮기도 하고...",
        "가끔은... 새벽에 혼자 깨면 너무 외로워요. 그런데 또 사람 만나는 건 더 힘들고...",
        "대학 때 절친이라고 믿었던 사람한테 등 뒤에서 엄청 험담을 들었어요. 그때 이후로 사람을 못 믿겠어요.",
        "차라리 혼자가 편해요. 사람은 결국 상처만 주니까요.",
        "사람을 만나보는 게 좋을까요? 소모임 같은 거... 근데 자신이 없어요.",
        "오늘 여기 온 것도 큰 용기였어요. 아직 할 말이 더 있는 것 같아요."
      ],
      empathy_answered: ["(고개를 끄덕이며) 네... 맞아요. 말씀해주셔서 고마워요."],
      empathy_unanswered: ["(조용히) 그렇게 말해주니까 조금 괜찮아지네요... 감사합니다."],
      question_answered: ["음... 음... [{topic}]에 대해서는 생각할 시간이 필요할 것 같아요."],
      question_unanswered: ["아... 잘 모르겠어요. [{topic}]은 말하기가 어렵네요."],
      off_topic: ["(멍하니) 아... 네. 근데 사실 [{topic}] 때문에 요즘 많이 힘들어요."],
      support: ["감사합니다. 그런 말씀 해주시니까 조금 용기가 나네요."],
      closing: ["다음 주에 또 올게요. 아직 할 말이 더 있는 것 같아요."],
      exhausted: ["음... 오늘은 여기까지 하는 게 좋을 것 같아요."]
    }
  },
  sc_003: {
    name: '이수진',
    problem: '진로 정체성과 의미 상실',
    hiddenEmotions: [
      "부모님 기대에 부응하지 못할까 봐 불안하다",
      "뭘 원하는지 몰라서 답답하고 스스로가 한심하다",
      "친구들은 다 준비하는데 나만 뒤쳐진다는 조바심이 든다"
    ],
    topics: [
      { id: 't1', label: '취업 불안', said: false },
      { id: 't2', label: '정체성 혼란', said: false },
      { id: 't3', label: '부모님 기대', said: false },
      { id: 't4', label: '자존감 하락', said: false },
      { id: 't5', label: '비교와 조바심', said: false },
      { id: 't6', label: '진로 모색', said: false },
      { id: 't7', label: '희망 찾기', said: false }
    ],
    responses: {
      greeting: ["안녕하세요... 요즘 너무 불안해서 잠도 잘 못 자고 있어요. 제가 뭘 하고 싶은지조차 모르겠어요."],
      on_topic: [
        "취업을 해야 하는데 뭘 하고 싶은지 모르겠어요. 하고 싶은 일이 없으니 준비할 의욕도 안 나요.",
        "제가 뭘 좋아하는지도 모르겠어요. 그냥 다 의미 없게 느껴져요.",
        "부모님은 공무원 준비하라고 하시는데... 그게 제 길인지 모르겠고, 거절하면 실망시킬까 봐 무서워요.",
        "친구들은 다 취업 준비하면서 스펙 쌓는데 저는 아무것도 안 하고 있어요. 뒤처지는 기분이에요.",
        "주변 사람들과 나를 비교하게 돼요. 다들 앞서가는데 나만 제자리인 느낌?",
        "사실 어떤 분야에 관심이 생기긴 했는데... 내가 잘할 수 있을지, 늦은 건 아닌지 두려워요.",
        "오늘 이야기하면서 조금 방향이 잡히는 것 같아요. 감사합니다."
      ],
      empathy_answered: ["네... 맞아요. 말씀들으니까 제 마음을 알아주시는 것 같아서 눈물이 나네요."],
      empathy_unanswered: ["(눈물을 참으며) 감사합니다... 누군가 제 이야기를 들어준다는 게 이렇게 위로가 될 줄 몰랐어요."],
      question_answered: ["아... 그건 생각해보지 못했어요. [{topic}]에 대해 좀 더 고민해볼게요."],
      question_unanswered: ["글쎄요... [{topic}]은 너무 막연해서 어떻게 답해야 할지 모르겠어요."],
      off_topic: ["(한숨) 그런 것 같기도 하고요. 솔직히 요즘 [{topic}] 때문에 제일 힘들어요."],
      support: ["위로가 되는 말씀이에요. 제가 생각보다 제 자신을 몰랐던 것 같아요."],
      closing: ["다음에 또 오면 좋겠어요. 오늘 이야기하면서 조금은 희망이 생겼어요."],
      exhausted: ["오늘은 여기까지 할게요. 생각할 게 많아졌어요."]
    }
  },
  sc_004: {
    name: '최재호',
    problem: '자존감 저하와 완벽주의',
    hiddenEmotions: [
      "완벽하지 않으면 사랑받을 자격이 없다고 느낀다",
      "실수를 인정하는 것을 패배로 받아들인다",
      "속으로는 인정받고 싶다는 갈망이 크지만 티를 내지 않는다"
    ],
    topics: [
      { id: 't1', label: '완벽주의 압박', said: false },
      { id: 't2', label: '자책과 후회', said: false },
      { id: 't3', label: '타인 평가', said: false },
      { id: 't4', label: '가족 관계', said: false },
      { id: 't5', label: '중년 위기', said: false },
      { id: 't6', label: '변화 시도', said: false },
      { id: 't7', label: '수용과 전환', said: false }
    ],
    responses: {
      greeting: ["...십 수년 만에 처음 상담 받아보네요. 사실 큰 기대는 안 합니다만."],
      on_topic: [
        "모든 일에 100%를 요구해요. 99점이면 1점이 부족했다는 생각에 자책해요.",
        "어릴 적부터 부모님이 항상 '더 잘해라'고 하셨어요. 지금은 제가 저를 채찍질하고 있어요.",
        "직장에서 평가는 좋은 편인데... 그걸 인정하지 못하겠어요. 항상 부족해요.",
        "아내가 충분히 잘하고 있다고 말하지만, 그 말이 믿기지 않아요.",
        "요즘 들어 '이렇게 사는 게 맞나' 싶은 생각이 자주 들어요. 무슨 낙으로 사는 건지.",
        "사실 좀 더 여유를 가지고 살고 싶어요. 그런데 어떻게 해야 할지 모르겠습니다.",
        "오늘 말씀 듣고 보니 제가 너무 엄격했던 것 같네요. 천천히 바꿔보고 싶습니다."
      ],
      empathy_answered: ["(조용히) 그렇게 말씀해주시니까... 좀 괜찮아지는 것 같습니다."],
      empathy_unanswered: ["(목소리가 약간 떨리며) 예... 그렇습니다. 말씀하신 대로예요."],
      question_answered: ["생각해보니 [{topic}]이(가) 영향이 컸던 것 같습니다. 분석해주셔서 감사합니다."],
      question_unanswered: ["음... [{topic}]에 대해서는 아직 제대로 생각해본 적이 없네요."],
      off_topic: ["(잠시 침묵) 다른 이야기지만... [{topic}] 문제는 예전부터 있었습니다."],
      support: ["조언 감사합니다. 제가 너무 경직되어 있었나 봅니다."],
      closing: ["다음에도 와도 될까요? 좀 더 이야기하고 싶은 것 같습니다."],
      exhausted: ["오늘은 여기까지 하겠습니다. 생각할 거리를 주셨네요."]
    }
  },
  sc_005: {
    name: '정유나',
    problem: '사별과 상실감, 우울',
    hiddenEmotions: [
      "엄마가 떠난 것을 아직도 믿기지 않아한다",
      "슬픔을 표현하면 주변에 부담될까 봐 참고 있다",
      "엄마한테 잘해드리지 못했다는 죄책감에 시달린다"
    ],
    topics: [
      { id: 't1', label: '사별 충격', said: false },
      { id: 't2', label: '일상 기능 저하', said: false },
      { id: 't3', label: '죄책감과 후회', said: false },
      { id: 't4', label: '고립과 소통단절', said: false },
      { id: 't5', label: '우울감', said: false },
      { id: 't6', label: '치유의 시작', said: false },
      { id: 't7', label: '희망과 다짐', said: false }
    ],
    responses: {
      greeting: ["(눈가가 붉어지며) 안녕하세요... 말을 어떻게 시작해야 할지 모르겠어요. 사실 오늘 아침에도 엄마 생각에 울었어요."],
      on_topic: [
        "엄마가 돌아가신 지 1년이 넘었는데 아직도 실감이 안 나요. 엄마가 없는 세상이 아직도 낯설어요.",
        "학교 가기도 힘들어요. 아무것도 의욕이 안 생기고... 그냥 누워있는 날이 많아요.",
        "엄마한테 '사랑해'라는 말 한 번 제대로 못 해드린 게 너무 후회돼요. 왜 그랬을까요...",
        "친구들이 만나자고 해도 만나기 싫어요. 제 이야기를 하면 부담스러워할까 봐... 그래서 혼자 있어요.",
        "아침에 일어나면 '왜 살아야 되지'라는 생각이 들어요. 자살 생각은 없는데... 모든 게 의미 없어요.",
        "얼마 전에 엄마 꿈을 꿨어요. 엄마가 웃고 있었는데... 깨고 나서 너무 울었어요. 그런데 그 후로 조금 나아진 것 같아요.",
        "오늘 이야기하면서 많이 울었는데... 그래도 조금은 후련해요. 말을 들어주셔서 감사합니다."
      ],
      empathy_answered: ["(눈물을 흘리며) 네... 정말 그래요. 이렇게 말할 수 있는 사람이 있다는 게 위로가 돼요."],
      empathy_unanswered: ["(목이 멘 채로) 감사합니다... 말을 하다 보니 감정이 복받쳐서... 죄송합니다."],
      question_answered: ["음... [{topic}]에 대해서는 생각해본 적 있어요. 엄마가 살아계셨다면... 이라고요."],
      question_unanswered: ["(눈물을 닦으며) 죄송해요... [{topic}] 이야기는 아직 준비가 안 된 것 같아요."],
      off_topic: ["(조용히) 아... 네. 솔직히 요즘 [{topic}] 때문에 가장 힘들어요. 혼자서 감당하기 너무 벅차요."],
      support: ["그렇게 말해주시니까 정말 힘이 나요. 저도 괜찮아질 수 있을까요?"],
      closing: ["다음에도 올게요. 오늘 말하고 나니까 조금 가벼워졌어요. 정말 감사합니다."],
      exhausted: ["미안하지만 오늘은 여기까지 할게요. 너무 지쳐서..."] 
    }
  }
};

function findProfile(scenarioId) {
  return SCENARIO_PROFILES[scenarioId] || SCENARIO_PROFILES.sc_001;
}

export function initMockState(scenarioId) {
  const profile = findProfile(scenarioId);
  return {
    scenarioId,
    topicIndex: 0,
    topics: profile.topics.map(t => ({ ...t })),
    greetingDone: false,
    closingSaid: false,
    lastResponse: ''
  };
}

function getCurrentTopicLabel(state) {
  const p = findProfile(state.scenarioId);
  const t = state.topics[state.topicIndex];
  return t ? t.label : '고민';
}

function markTopicSaid(state) {
  if (state.topics[state.topicIndex]) {
    state.topics[state.topicIndex].said = true;
  }
  if (state.topicIndex < state.topics.length - 1) {
    state.topicIndex++;
  }
}

function hasUnsaidTopics(state) {
  return state.topics.some(t => !t.said);
}

export function getMockResponse(state, text, difficulty) {
  const profile = findProfile(state.scenarioId);
  const cat = detectCategory(text);
  const hasQ = isQuestion(text);
  const topic = getCurrentTopicLabel(state);

  function fill(text) {
    if (typeof text !== 'string') {
      if (Array.isArray(text)) text = text[0];
      else text = String(text);
    }
    return text.replace('[{topic}]', topic);
  }

  if (!state.greetingDone) {
    state.greetingDone = true;
    return profile.responses.greeting[0];
  }

  if (!hasUnsaidTopics(state)) {
    if (state.closingSaid) return pick(profile.responses.exhausted);
    state.closingSaid = true;
    return pick(profile.responses.closing);
  }

  if (cat === 'empathy') {
    const said = state.topics.filter(t => t.said).length;
    if (said <= 1) return profile.responses.empathy_unanswered[0];
    return profile.responses.empathy_answered[0];
  }

  if (cat === 'support') {
    return pick(profile.responses.support);
  }

  if (hasQ && cat !== 'default') {
    markTopicSaid(state);
    return fill(pick(profile.responses.question_answered));
  }

  if (cat === 'open_q' || cat === 'feel') {
    const resp = pick(profile.responses.on_topic.filter((_, i) => i >= state.topicIndex));
    if (resp) {
      markTopicSaid(state);
      return resp;
    }
    markTopicSaid(state);
    return pick(profile.responses.on_topic);
  }

  if (cat === 'resistance' || cat === 'close_q') {
    if (hasQ) {
      return fill(pick(profile.responses.question_unanswered));
    }
    return fill(pick(profile.responses.off_topic));
  }

  return fill(pick(profile.responses.off_topic));
}

export function getHiddenEmotion(state) {
  const profile = findProfile(state.scenarioId);
  if (profile.hiddenEmotions && profile.hiddenEmotions.length) {
    return pick(profile.hiddenEmotions);
  }
  const pool = [
    "속으로는 긴장하고 있지만 티를 내지 않으려고 한다",
    "상담사의 반응을 조심스럽게 살피고 있다",
    "말하면서 자신의 감정을 처음으로 인식하고 있다",
    "조금씩 마음을 열고 있지만 여전히 경계하고 있다",
    "진심을 말하고 나니 후회와 안도가 동시에 든다",
    "상담사를 점점 신뢰하기 시작하고 있다",
    "처음으로 누군가에게 진실을 말하는 게 두렵지만 후련하다"
  ];
  return pick(pool);
}

export function generateMockScores(difficulty, turnsCompleted) {
  const base = difficulty === 'easy' ? 70 : difficulty === 'medium' ? 60 : 50;
  const v = () => Math.max(10, Math.min(95, base + Math.floor(Math.random() * 25) - 10 + Math.floor(turnsCompleted * 0.3)));
  return {
    empathy: v(), reflection: v(), questioning: v(),
    summarizing: v(), rapport: v(), structuring: v(), authenticity: v()
  };
}

export function generateMockFeedback(scores, clientName) {
  const skills = [
    { key: 'empathy', name: '공감적 반응' },
    { key: 'reflection', name: '반영 기술' },
    { key: 'questioning', name: '질문 전략' },
    { key: 'summarizing', name: '요약 기술' },
    { key: 'rapport', name: '라포 형성' },
    { key: 'structuring', name: '세션 구조화' },
    { key: 'authenticity', name: '진정성' }
  ];
  const sorted = [...skills].sort((a, b) => scores[b.key] - scores[a.key]);
  return {
    summary: `총점 ${Math.round(skills.reduce((s, sk) => s + scores[sk.key], 0) / 7)}/100`,
    strengths: sorted.slice(0, 2).map(s => ({ skill: s.name, score: scores[s.key] })),
    improvements: sorted.slice(-2).reverse().map(w => ({
      skill: w.name, score: scores[w.key],
      suggestion: `${w.name}을(를) 더 발전시켜 보세요.`,
      example: "'이렇게 이해해도 될까요?' 식으로 요약/확인해보세요."
    })),
    notice: '이 세션은 Mock 모드로 진행되었습니다.'
  };
}
