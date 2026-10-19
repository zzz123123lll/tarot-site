// Node 测试：判分引擎必须能区分 错误 / 边界 / 满分 / 无法判断。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, gradeObjective, normalize, ENGINE_VERSION } from '../shared/grading-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const level = JSON.parse(fs.readFileSync(path.join(root, 'content/levels/prompt-01.json'), 'utf8'));
const ex = level.exercise;

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
    answer: '【System 设定】你是科技公关。\n【User 指令】时间：下周五；地点：深圳南山；核心亮点：心率监测。字数 150-200 字。',
    check(r) {
      assert.equal(r.status, 'partial');
      assert.ok(r.score > 0 && r.score < r.max, `score ${r.score} 应在 0..${r.max}`);
      assert.ok(r.missing.includes('媒体权益'));
      assert.ok(r.missing.includes('RSVP / 截止'));
    }
  },
  {
    name: 'good: 覆盖全部得分点',
    answer: '【System 设定】你是资深科技公关。\n【User 指令】为智能戒指发布会写邀请邮件。时间：下周五下午两点；地点：深圳南山科技园；核心亮点：睡眠与心率监测；媒体专属权益：专访机位和评测样机。字数 150-200 字。请在截止时间前 RSVP 回复确认。',
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
assert.equal(ENGINE_VERSION, '1.0.0');
console.log('PASS normalize/version');
console.log('ALL GRADING TESTS PASSED');

const objective = { question: 'q', options: ['a', 'b', 'c', 'd'], answer: 2, explanation: 'c is right' };
assert.equal(gradeObjective(objective, 2).status, 'correct');
assert.equal(gradeObjective(objective, 1).status, 'incorrect');
assert.equal(gradeObjective(objective, null).status, 'unanswered');
console.log('PASS objective');
