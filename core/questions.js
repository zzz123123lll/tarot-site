// core/questions.js — Question-intent taxonomy (question-conditioned reading).
// 溯源: The anti-Barnum principle "change the question and the reading must change materially"
// is realized here. Each intent supplies a lens (focusAreas) and an emphasis (suit/arcana affinity),
// so the SAME cards are read through the querent's actual concern rather than as a fixed blurb.
// Keyword detection is deliberately broad; a general intent is the safe fallback.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarotQuestions = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const INTENTS = {
    relationship: {
      id: 'relationship', label: '情感·关系',
      focusAreas: ['双向是否对等', '沟通与信任', '情感需求', '关系走向'],
      emphasis: { water: 2, air: 1 },
      lens: '从「人与人的联结、情感流动与承诺」的角度解读。'
    },
    career: {
      id: 'career', label: '事业·工作',
      focusAreas: ['方向与选择', '能力与资源', '团队与竞争', '进展与回报'],
      emphasis: { fire: 2, earth: 1 },
      lens: '从「目标、行动、职业成就与现实产出」的角度解读。'
    },
    money: {
      id: 'money', label: '财富·金钱',
      focusAreas: ['收支与稳定', '价值与回报', '风险与务实', '长期积累'],
      emphasis: { earth: 2 },
      lens: '从「物质现实、价值交换与长期稳健」的角度解读。'
    },
    decision: {
      id: 'decision', label: '抉择·决策',
      focusAreas: ['利弊权衡', '隐藏动机', '代价与收益', '该坚持或放手'],
      emphasis: { air: 2, fire: 1 },
      lens: '从「选择的关键差异、需要看清的两面」的角度解读。'
    },
    self: {
      id: 'self', label: '自我·成长',
      focusAreas: ['内在状态', '成长课题', '自我认知', '下一步'],
      emphasis: { water: 2, earth: 1 },
      lens: '从「内在状态、自我觉察与成长周期」的角度解读。'
    },
    health: {
      id: 'health', label: '健康·状态',
      focusAreas: ['身心状态', '节奏与耗损', '恢复方式', '需要留意处'],
      emphasis: { earth: 2, water: 1 },
      lens: '从「身心节奏、能量耗损与恢复」的角度解读（非医疗建议）。'
    },
    study: {
      id: 'study', label: '学习·成长',
      focusAreas: ['理解与吸收', '方法与环境', '专注与突破', '产出'],
      emphasis: { air: 2 },
      lens: '从「认知、专注与理解推进」的角度解读。'
    },
    general: {
      id: 'general', label: '一般指引',
      focusAreas: ['当前能量', '核心课题', '方向提示', '需要注意'],
      emphasis: {},
      lens: '以整体视角解读当前能量与方向。'
    }
  };

  // Pattern -> intent id. Order matters: first match wins (most specific first).
  const RULES = [
    ['relationship', /爱情|感情|关系|喜欢|好感|浪漫|恋爱|分手|复合|暧昧|约会|婚姻|对象|伴侣|男朋友|女朋友|丈夫|妻子/],
    ['money',        /钱|财富|财务|收入|薪水|投资|理财|赚钱|花销|存钱|欠债|债务|买房|买车/],
    ['career',       /工作|事业|职业|升职|跳槽|创业|同事|老板|项目|职场|面试|offer|业务|行业|赚钱|收入/],
    ['study',        /学习|考试|考研|升学|论文|写(作|文章)|读书|学业|复习|课程/],
    ['health',       /健康|身体|生病|康复|睡眠|压力|疲惫|状态|体检/],
    ['decision',     /选择|决定|要不要|该不该|选|决策|权衡|利弊|权衡|考虑|纠结/],
    ['self',         /成长|方向|人生|自我|迷茫|意义|改变|认识自己|内耗|卡住/]
  ];

  function detectIntent(questionText) {
    const t = String(questionText || '').replace(/\s+/g, ' ').trim();
    if (!t) return INTENTS.general;
    for (const [id, re] of RULES) {
      if (re.test(t)) return INTENTS[id];
    }
    return INTENTS.general;
  }

  function getIntent(id) { return INTENTS[id] || INTENTS.general; }

  return { INTENTS, detectIntent, getIntent };
});
