// 全量回归：26 关的内容契约、判分结果、页面产物。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, gradeObjective } from '../shared/grading-engine.mjs';


function goodAnswerFor(level) {
  const parts = [];
  for (const c of level.exercise.criteria) {
    for (const g of c.groups) parts.push(g.terms[0]);
    const v = c.validator || {};
    if (v.type === 'json') {
      const obj = {};
      for (const path of v.required || []) {
        let cur = obj;
        const bits = path.split('.');
        for (const b of bits.slice(0, -1)) cur = cur[b] = cur[b] || {};
        cur[bits[bits.length - 1]] = 'ok';
      }
      parts.push(JSON.stringify(obj));
    } else if (v.type === 'numeric') {
      parts.push(String(v.expected));
    } else if (v.type === 'code_static') {
      parts.push(...(v.required || []));
    } else if (v.type === 'regex') {
      parts.push('<context></context> [1]');
    }
  }
  return parts.join('；') + '。这是一段刻意写长的完整答案，用于通过最低长度检查，并覆盖所有评分项。';
}

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
    assert(level.explain && level.explain.summary && level.explain.example, level.id + ' explain');
    assert(Array.isArray(level.explain.bullets) && level.explain.bullets.length >= 3, level.id + ' explain bullets');
    assert(Array.isArray(level.explain.terms) && level.explain.terms.length >= 2, level.id + ' explain terms');
    assert(level.reading && level.reading.quote && level.reading.guide, level.id + ' reading');
    assert(Array.isArray(level.reading.points) && level.reading.points.length >= 3, level.id + ' reading points');
    assert(Array.isArray(level.reading.refs) && level.reading.refs.length >= 1, level.id + ' reading refs');
    assert(Array.isArray(level.knowledgeChecks) && level.knowledgeChecks.length === 3, level.id + ' knowledgeChecks');
    level.knowledgeChecks.forEach((q) => {
      assert(q.id && q.question && q.explanation, level.id + ' knowledgeCheck fields');
      assert(Array.isArray(q.options) && q.options.length === 4, level.id + ' knowledgeCheck options');
      assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, level.id + ' knowledgeCheck answer');
      assert.equal(gradeObjective(q, q.answer).status, 'correct', level.id + ' objective correct');
      assert.equal(gradeObjective(q, (q.answer + 1) % 4).status, 'incorrect', level.id + ' objective incorrect');
    });
    assert(level.exercise && level.exercise.minLength > 0, level.id + ' exercise');
    assert(level.exercise.criteria.length === 3, level.id + ' criteria count');

    const expected = Number(track.scoreTotal) || (track.id === 'prompt' ? 10 : 12.5);
    const total = level.exercise.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    assert(Math.abs(total - expected) < 0.01, level.id + ' weight ' + total);

    const good = goodAnswerFor(level);
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
    assert(html.includes('class="source-reading"'), level.id + ' page source reading');
    assert(html.includes('SOURCE READING'), level.id + ' page source reading label');
    assert(html.includes('30 SECONDS'), level.id + ' 30s layer');
    assert(html.includes('3 MINUTES'), level.id + ' 3min layer');
    assert(html.includes('explain-summary'), level.id + ' explain summary');
  }
}

const catalog = fs.readFileSync(path.join(ROOT, 'ai/notes/index.html'), 'utf8');
assert.equal((catalog.match(/data-series="/g) || []).length, 2, 'index series cards');
assert(catalog.includes('data-overall'), 'index overall progress');
assert(catalog.includes('notes.js?v=7'), 'index script version');
for (const tf of trackFiles) {
  const track = JSON.parse(fs.readFileSync(path.join(tracksDir, tf), 'utf8'));
  const trackPage = fs.readFileSync(path.join(ROOT, 'ai/notes', track.id, 'index.html'), 'utf8');
  assert(trackPage.includes('data-track="' + track.id + '"'), track.id + ' track progress');
  if (track.id === 'neigong') {
    assert.equal((trackPage.match(/class="series-card"/g) || []).length, 7, 'neigong book cards');
  } else {
    assert.equal((trackPage.match(/class="level-row"/g) || []).length, track.levels.length, track.id + ' level rows');
    for (const entry of track.levels) assert(trackPage.includes('data-url="' + entry.href + '"'), track.id + ' row ' + entry.id);
  }
}
const guide = fs.readFileSync(path.join(ROOT, 'ai/notes/guide/index.html'), 'utf8');
assert(guide.includes('AI 现代必修课'), 'guide page');
const searchPage = fs.readFileSync(path.join(ROOT, 'ai/notes/search/index.html'), 'utf8');
assert(searchPage.includes('data-search-results'), 'search page');
const searchIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'ai/notes/search-index.json'), 'utf8'));
assert(searchIndex.length >= 36, 'search index entries');
const review = fs.readFileSync(path.join(ROOT, 'ai/notes/review/index.html'), 'utf8');
assert(review.includes('data-mistakes'), 'review mistakes container');
assert(review.includes('review.mjs'), 'review module');
assert(review.includes('/ai/notes/review/'), 'review canonical path');
console.log('PASS review page');

console.log('PASS catalog pages');

assert.equal(levelCount, 36, 'expected 36 levels');
console.log('PASS all levels', levelCount, 'content + grading + pages');
console.log('ALL-LEVEL TESTS PASSED');
