import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const context = vm.createContext({});
vm.runInContext(await readFile(new URL('code-notes.js', root), 'utf8'), context);
const { group, questionCode, create } = context.CV_CODE_NOTES;
const parts = await Promise.all(['theory', 'practice'].map(async name => JSON.parse(await readFile(new URL(`data/${name}.json`, root), 'utf8'))));
let checked = 0;
function verify(code, notes, label) {
  if (!notes?.length) return;
  const rows = group(code, notes);
  assert.equal(rows.flatMap(row => row.lines).join('\n'), code.replaceAll('\r\n', '\n'), `${label}: code and indentation must be preserved`);
  assert.equal(rows.reduce((count, row) => count + row.notes.length, 0), notes.length, `${label}: every explanation must remain visible`);
  let next = 1;
  for (const row of rows) {
    assert.equal(row.start, next, `${label}: no missing or repeated lines`);
    assert.equal(row.lines.length, row.end - row.start + 1);
    next = row.end + 1;
  }
  checked++;
}
for (const part of parts) for (const entries of Object.values(part)) for (const item of entries) {
  verify(item.originalCode || questionCode(item), item.codeExplanation, item.id || item.number);
  verify(item.correctedCode, item.correctedCodeExplanation, `${item.id || item.number} corrected`);
  for (const block of item.additionalCodeBlocks || []) verify(block.code, block.codeExplanation, block.title);
}
const overlap = group('a\nb\nc\nd', [{ lines: '1~3행', explanation: 'outer' }, { lines: '2행', explanation: 'inner' }, { lines: '4행', explanation: 'last' }]);
assert.equal(overlap.length, 2);
assert.equal(overlap[0].notes.length, 2);
assert.equal(questionCode({ type: 'blank', code: '    value = ____', answer: '100' }), '    value = 100');
assert.equal(group('a\nb', [{ lines: '함수 전체', explanation: 'fallback' }])[0].lines.join('\n'), 'a\nb');
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const render = create({ esc, rich: esc, highlight: esc });
const html = render('    x = "<tag>"', [{ lines: '1행', explanation: 'array < value' }]);
assert.ok(html.includes('data-code-line="1"') && html.includes('    x = "&lt;tag&gt;"'));
assert.ok(html.includes('array &lt; value'));
assert.ok(html.includes('data-copy-annotation'));
console.log(`Code notes passed: ${checked} explanation lists preserve all code lines and notes; blank answers, overlaps and escaping verified.`);
