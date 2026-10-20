// Node 测试：判分引擎必须能区分 错误 / 边界 / 满分 / 无法判断。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, gradeObjective, normalize, ENGINE_VERSION } from '../shared/grading-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ex = {
  minLength: 40,
  criteria: [
    { id: 'c1', label: '通道拆分', weight: 3, type: 'term_groups', groups: [
      { label: 'System', terms: ['system', '系统'] },
      { label: 'User', terms: ['user', '用户'] }
    ]},
    { id: 'c2', label: '事实要素', weight: 7, type: 'term_groups', groups: [
      { label: '时间', terms: ['时间'] },
      { label: '地点', terms: ['地点'] }
    ]}
  ]
};

const cases = [
  {
    name: 'bad: 太短',
    answer: '帮我写一封邀请邮件。',
    check(r) {
      assert.equal(r.status, 'too_short');
      assert.equal(r.score, 0);
    }
  },
  {
    name: 'edge: 只覆盖部分得分点',
    answer: '【System 设定】你是科技公关。\n【User 指令】时间：下周五；核心亮点：心率监测。这是一段足够长的边界答案。',
    check(r) {
      assert.equal(r.status, 'partial');
      assert.ok(r.score > 0 && r.score < r.max, `score ${r.score} 应在 0..${r.max}`);
      assert.ok(r.missing.includes('地点'));
    }
  },
  {
    name: 'good: 覆盖全部得分点',
    answer: '【System 设定】你是资深科技公关。\n【User 指令】时间：下周五下午两点；地点：深圳南山科技园；核心亮点：睡眠与心率监测。这是一段覆盖全部评分项的完整答案。',
    check(r) {
      assert.equal(r.status, 'pass');
      assert.equal(r.score, r.max);
      assert.equal(r.missing.length, 0);
    }
  }
];

for (const c of cases) {
  const result = grade(ex, c.answer);
  c.check(result);
  console.log('PASS', c.name, 'score=', result.score, '/', result.max, 'status=', result.status);
}

// 无法判断的评分项必须显式标记，而不是假装给分。
const manual = {
  minLength: 0,
  criteria: [{ id: 'm1', label: '人工判断项', weight: 5, type: 'manual' }]
};
const manualResult = grade(manual, '这是一段足够长的答案');
assert.equal(manualResult.status, 'needs_review');
assert.equal(manualResult.gradable, false);
assert.equal(manualResult.score, 0);
console.log('PASS needs_review/manual');

// 归一化：大小写、空白不影响术语检查。
assert.equal(normalize('  System   Prompt '), 'system prompt');
assert.equal(ENGINE_VERSION, '1.1.0');
console.log('PASS normalize/version');

// 结构校验：JSON 字段、数值、正则和代码静态结构。
const jsonExercise = {
  minLength: 10,
  criteria: [{
    id: 'j1', label: 'JSON 结构', weight: 10, type: 'term_groups',
    groups: [{ label: 'messages', terms: ['messages'] }],
    validator: { type: 'json', required: ['messages', 'messages.0.role'] }
  }]
};
const jsonPass = grade(jsonExercise, '{"messages":[{"role":"user","content":"hi"}]}');
assert.equal(jsonPass.status, 'pass');
assert.equal(jsonPass.score, 10);
const jsonFail = grade(jsonExercise, 'hello there');
assert.equal(jsonFail.status, 'fail');
assert.ok(jsonFail.missing.some((m) => m.includes('JSON')));
console.log('PASS json validator');

const numExercise = {
  minLength: 1,
  criteria: [{
    id: 'n1', label: '数值', weight: 10, type: 'term_groups',
    groups: [{ label: '结果', terms: ['结果'] }],
    validator: { type: 'numeric', expected: 4.9, tolerance: 0.1 }
  }]
};
assert.equal(grade(numExercise, '结果约为 4.9GB').status, 'pass');
assert.equal(grade(numExercise, '结果约为 16GB').status, 'partial');
console.log('PASS numeric validator');

const codeExercise = {
  minLength: 1,
  criteria: [{
    id: 'c1', label: '代码结构', weight: 10, type: 'term_groups',
    groups: [{ label: '函数', terms: ['def'] }],
    validator: { type: 'code_static', required: ['def', 'return'], forbidden: ['import os'] }
  }]
};
assert.equal(grade(codeExercise, 'def f():\n    return 0').status, 'pass');
assert.equal(grade(codeExercise, 'def f():\n    import os\n    return 0').status, 'partial');
console.log('PASS code_static validator');

const regexExercise = {
  minLength: 1,
  criteria: [{
    id: 'r1', label: '引用格式', weight: 10, type: 'term_groups',
    groups: [{ label: '引用', terms: ['引用'] }],
    validator: { type: 'regex', patterns: [{ label: '方括号引用', pattern: '\\[\\d+\\]' }] }
  }]
};
assert.equal(grade(regexExercise, '这里引用 [1]').status, 'pass');
assert.equal(grade(regexExercise, '这里引用资料').status, 'partial');
console.log('PASS regex validator');

console.log('ALL GRADING TESTS PASSED');

const objective = { question: 'q', options: ['a', 'b', 'c', 'd'], answer: 2, explanation: 'c is right' };
assert.equal(gradeObjective(objective, 2).status, 'correct');
assert.equal(gradeObjective(objective, 1).status, 'incorrect');
assert.equal(gradeObjective(objective, null).status, 'unanswered');
console.log('PASS objective');
