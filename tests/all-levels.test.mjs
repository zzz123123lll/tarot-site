// 全量回归：26 关的内容契约、判分结果、页面产物。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, gradeObjective } from '../shared/grading-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const tracksDir = path.join(ROOT, 'content/tracks');
const levelsDir = path.join(ROOT, 'content/levels');

const trackFiles = fs.readdirSync(tracksDir).filter((f) => f.endsWith('.json')).sort();
let levelCount = 0;
const seen = new Set();

for (const tf of trackFiles) {
  const track = JSON.parse(fs.readFileSync(path.join(tracksDir, tf), 'utf8'));
  assert(Array.isArray(track.levels) && track.levels.length > 0, track.id + ' levels');
  for (const entry of track.levels) {
    const file = path.join(levelsDir, entry.id + '.json');
    assert(fs.existsSync(file), 'missing content ' + entry.id);
    const level = JSON.parse(fs.readFileSync(file, 'utf8'));
    levelCount++;
    assert(!seen.has(level.id), 'duplicate id ' + level.id);
    seen.add(level.id);
    assert(level.trackId === track.id, level.id + ' track');
    assert(level.title && level.summary && level.lessonHtml && level.referenceAnswerHtml, level.id + ' content');
    assert(level.knowledgeCheck && level.knowledgeCheck.options.length === 4, level.id + ' knowledgeCheck options');
    assert(Number.isInteger(level.knowledgeCheck.answer) && level.knowledgeCheck.answer >= 0 && level.knowledgeCheck.answer < 4, level.id + ' knowledgeCheck answer');
    assert(level.knowledgeCheck.explanation, level.id + ' knowledgeCheck explanation');
    assert.equal(gradeObjective(level.knowledgeCheck, level.knowledgeCheck.answer).status, 'correct', level.id + ' objective correct');
    const wrong = (level.knowledgeCheck.answer + 1) % 4;
    assert.equal(gradeObjective(level.knowledgeCheck, wrong).status, 'incorrect', level.id + ' objective incorrect');
    assert(level.exercise && level.exercise.minLength > 0, level.id + ' exercise');
    assert(level.exercise.criteria.length === 3, level.id + ' criteria count');

    const expected = track.id === 'prompt' ? 10 : 12.5;
    const total = level.exercise.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    assert(Math.abs(total - expected) < 0.01, level.id + ' weight ' + total);

    const good = level.exercise.criteria
      .flatMap((c) => c.groups.map((g) => g.terms[0]))
      .join('；') + '。这是一段刻意写长的完整答案，用于通过最低长度检查，并覆盖所有评分项。';
    const goodResult = grade(level.exercise, good);
    assert.equal(goodResult.status, 'pass', level.id + ' good status=' + goodResult.status);
    assert.equal(goodResult.score, goodResult.max, level.id + ' good score');

    const edge = level.exercise.criteria[0].groups[0].terms[0] +
      '。这是一段覆盖了部分评分项、但故意不写完整内容的边界答案，用来验证部分分和缺项列表。';
    const edgeResult = grade(level.exercise, edge);
    assert.ok(edgeResult.score > 0, level.id + ' edge should have partial credit');
    assert.ok(edgeResult.score < edgeResult.max, level.id + ' edge should not be full score');
    assert.equal(edgeResult.status, 'partial', level.id + ' edge status=' + edgeResult.status);
    assert.ok(edgeResult.missing.length > 0, level.id + ' edge missing');

    const bad = grade(level.exercise, '不知道。');
    assert.equal(bad.status, 'too_short', level.id + ' bad status=' + bad.status);
    assert.equal(bad.score, 0, level.id + ' bad score');

    const page = path.join(ROOT, 'ai/notes', track.id, String(level.level).padStart(2, '0') + '.html');
    assert(fs.existsSync(page), 'missing page ' + page);
    const html = fs.readFileSync(page, 'utf8');
    assert(html.includes('data-engine="v2"'), level.id + ' page engine');
    assert(html.includes('practice.mjs'), level.id + ' page module');
    assert(!html.includes('data-rules='), level.id + ' page legacy rules');
    assert(html.includes('/content/levels/' + level.id + '.json'), level.id + ' page exercise data');
    assert(html.includes('data-objective'), level.id + ' page objective container');
  }
}

const catalog = fs.readFileSync(path.join(ROOT, 'ai/notes/index.html'), 'utf8');
assert.equal((catalog.match(/data-series="/g) || []).length, 3, 'index series cards');
assert(catalog.includes('data-overall'), 'index overall progress');
assert(catalog.includes('notes.js?v=5'), 'index script version');
for (const tf of trackFiles) {
  const track = JSON.parse(fs.readFileSync(path.join(tracksDir, tf), 'utf8'));
  const trackPage = fs.readFileSync(path.join(ROOT, 'ai/notes', track.id, 'index.html'), 'utf8');
  assert(trackPage.includes('data-track="' + track.id + '"'), track.id + ' track progress');
  assert.equal((trackPage.match(/class="level-row"/g) || []).length, track.levels.length, track.id + ' level rows');
  for (const entry of track.levels) assert(trackPage.includes('data-url="' + entry.href + '"'), track.id + ' row ' + entry.id);
}
console.log('PASS catalog pages');

assert.equal(levelCount, 26, 'expected 26 levels');
console.log('PASS all levels', levelCount, 'content + grading + pages');
console.log('ALL-LEVEL TESTS PASSED');
