export const SCENARIOS = [
  {
    id: 'sc_001', name: '직장 스트레스 / 번아웃', category: 'anxiety',
    client: { name: '김지은', age: 28, gender: '여' },
    problem: '직장 내 과도한 업무 부담으로 인한 불안과 번아웃 증상. 수면장애, 집중력 저하 동반.',
    background: '대기업 마케팅팀 3년차. 최근 6개월간 야근이 잦아짐. 상사의 과도한 요구와 부족한 인정에 지쳐있음.',
    personality: { openness: 3, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 4 },
    change_stage: 'contemplation',
    speech: { verbosity: 3, directness: 2, formality: 3 },
    crisis: false,
    difficulty: {
      easy: { turns: 10, cooperation: '높음', desc: '비교적 솔직하게 이야기함. 도움을 구하려는 의지 있음.' },
      medium: { turns: 15, cooperation: '중간', desc: '처음에는 망설이나 점차 마음을 엶. 중간 저항 있음.' },
      hard: { turns: 20, cooperation: '낮음', desc: '매우 방어적. "괜찮다"고 반복. 깊은 저항과 냉소.' }
    }
  },
  {
    id: 'sc_002', name: '사회적 고립 / 관계 단절', category: 'relationship',
    client: { name: '박민수', age: 35, gender: '남' },
    problem: '오랜 사회적 고립과 대인관계 단절. 친구도 연인도 없음. 외로움과 무력감.',
    background: 'IT 회사 재택근무 5년째. 퇴사 후 프리랜서. 인간관계가 점점 줄어들어 현재는 가족 외에는 대화 상대가 거의 없음.',
    personality: { openness: 2, conscientiousness: 4, extraversion: 1, agreeableness: 2, neuroticism: 5 },
    change_stage: 'precontemplation',
    speech: { verbosity: 1, directness: 3, formality: 4 },
    crisis: false,
    difficulty: {
      easy: { turns: 10, cooperation: '중간', desc: '문제 인식은 하지만 변화에 대한 두려움 있음.' },
      medium: { turns: 15, cooperation: '낮음', desc: '"괜찮다"고 말하지만 속은 많이 아픔. 천천히 접근 필요.' },
      hard: { turns: 20, cooperation: '매우 낮음', desc: '극도로 폐쇄적. 짧게 대답하고 회피. 높은 저항.' }
    }
  },
  {
    id: 'sc_003', name: '진로 정체성 / 의미 상실', category: 'identity',
    client: { name: '이수진', age: 22, gender: '여' },
    problem: '대학 졸업을 앞두고 진로에 대한 심한 불확실성. "내가 뭘 원하는지 모르겠다"는 혼란.',
    background: '서울 소재 대학 4학년. 취업을 앞두고 극심한 불안. 주변은 다 취업 준비하는데 자신만 뒤쳐지는 느낌. 부모님 기대도 부담.',
    personality: { openness: 5, conscientiousness: 3, extraversion: 3, agreeableness: 4, neuroticism: 4 },
    change_stage: 'contemplation',
    speech: { verbosity: 4, directness: 3, formality: 2 },
    crisis: false,
    difficulty: {
      easy: { turns: 10, cooperation: '높음', desc: '자신의 혼란을 잘 표현함. 피드백에 개방적.' },
      medium: { turns: 15, cooperation: '중간', desc: '불안이 커서 이리저리 흔들림. 공감 필요.' },
      hard: { turns: 20, cooperation: '낮음', desc: '극심한 불안과 절망감. "아무것도 하고 싶지 않아" 무기력.' }
    }
  },
  {
    id: 'sc_004', name: '자존감 저하 / 완벽주의', category: 'self_esteem',
    client: { name: '최재호', age: 45, gender: '남' },
    problem: '만성적인 자존감 저하와 극단적인 완벽주의. 작은 실수에도 심한 자책. 중년의 위기감.',
    background: "중견기업 부장. 겉으로는 성공해 보이지만 내면은 심한 부족감. 어린 시절 엄격한 부모 아래서 자라며 '완벽해야 사랑받는다'는 신념 형성.",
    personality: { openness: 2, conscientiousness: 5, extraversion: 2, agreeableness: 3, neuroticism: 5 },
    change_stage: 'contemplation',
    speech: { verbosity: 3, directness: 4, formality: 4 },
    crisis: false,
    difficulty: {
      easy: { turns: 10, cooperation: '중간', desc: '문제 인식은 하지만 완벽주의를 포기하기 어려워함.' },
      medium: { turns: 15, cooperation: '낮음', desc: '자신을 드러내는 것을 어려워함. 이성적 방어 강함.' },
      hard: { turns: 20, cooperation: '매우 낮음', desc: '냉소와 경직된 방어. "상담 따위가 무슨 소용이냐"는 태도.' }
    }
  },
  {
    id: 'sc_005', name: '사별 / 상실감', category: 'loss',
    client: { name: '정유나', age: 19, gender: '여' },
    problem: '1년 전 어머니 사별 이후 지속되는 상실감과 우울. 일상 기능 저하. 무기력.',
    background: '지방대 1학년. 1년 전 어머니가 암으로 갑작스럽게 사망. 아버지는 일로 바쁘고, 혼자 슬픔을 처리해야 했음. 친구들에게 부담주기 싫어 아무 말도 못함.',
    personality: { openness: 4, conscientiousness: 3, extraversion: 2, agreeableness: 5, neuroticism: 5 },
    change_stage: 'action',
    speech: { verbosity: 3, directness: 2, formality: 2 },
    crisis: false,
    difficulty: {
      easy: { turns: 10, cooperation: '높음', desc: '도움을 간절히 원함. 울면서 이야기할 수 있음.' },
      medium: { turns: 15, cooperation: '중간', desc: '감정이 북받쳐 말을 잇지 못함. 인내심 필요.' },
      hard: { turns: 20, cooperation: '낮음', desc: '깊은 우울로 무기력. "아무것도 의미 없어" 자살사고는 없으나 절망감 큼.' }
    }
  }
];

export const DIFFICULTY_MAP = { easy: '간단', medium: '중간', hard: '심화' };
export const CATEGORY_MAP = {
  anxiety: '불안/스트레스', relationship: '대인관계', identity: '진로/정체성',
  self_esteem: '자존감', loss: '상실/트라우마'
};
