// 全量构建：校验 3 条线、26 关，并生成所有页面。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLevel } from './render-level.mjs';
import { renderCatalog } from './render-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const tracksDir = path.join(ROOT, 'content/tracks');
const files = fs.readdirSync(tracksDir).filter((f) => f.endsWith('.json')).sort();
const results = [];
for (const file of files) {
  const track = JSON.parse(fs.readFileSync(path.join(tracksDir, file), 'utf8'));
  for (const level of track.levels) {
    results.push(renderLevel(track.id, level.id));
  }
}
const catalogs = renderCatalog();
console.log('BUILT', results.length, 'levels +', catalogs.length, 'catalog pages');
for (const r of results) console.log(' ', r.level, '->', r.out, 'rubric=', r.total);
