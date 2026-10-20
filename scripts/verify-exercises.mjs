import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const practice = JSON.parse(await readFile(new URL('data/practice.json', root), 'utf8'));
const sources = JSON.parse(await readFile(new URL('data/sources.json', root), 'utf8'));
const order = [1, 2, 5, 6, 9, 10, 13, 16];
const pdf = sources.find(s => s.id === 'exercise4');
const focused = practice.questions.filter(q => q.tags?.includes('4장집중연습'));
const lessonByNumber = new Map(practice.exercises.map(e => [e.number, e]));
const qById = new Map(practice.questions.map(q => [q.id, q]));
const pad = number => String(number).padStart(2, '0');
const primaryId = number => `p-exercise-${pad(number)}`;
const drillIds = number => Array.from({length: 6}, (_, i) => `p-e${pad(number)}-${pad(i + 1)}`);
const expectedIds = order.flatMap(n => [primaryId(n), ...drillIds(n)]);
const text = (value, label) => assert.ok(typeof value === 'string' && value.trim(), label);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const rich = value => esc(value).replaceAll('\n', '<br>');
const count = (html, pattern) => [...html.matchAll(pattern)].length;
let passed = 0;
function test(label, fn) {
  try { fn(); passed++; }
  catch (error) { error.message = `${label}: ${error.message}`; throw error; }
}

test('fixed eight-lesson order and unique identifiers', () => {
  assert.deepEqual(practice.exercises.map(e => e.number), order);
  assert.equal(lessonByNumber.size, order.length);
  assert.equal(qById.size, practice.questions.length, 'question IDs must be unique');
  assert.ok(pdf && pdf.kind === 'exercise', 'exercise4 must identify the PDF exercise source');
});

test('exactly eight complete originals and forty-eight focused drills', () => {
  assert.equal(focused.length, 56);
  assert.deepEqual(focused.map(q => q.id).sort(), [...expectedIds].sort());
  assert.deepEqual(practice.questions.filter(q => q.exercisePrimary).map(q => q.id).sort(), order.map(primaryId).sort());
  for (const n of order) {
    const set = focused.filter(q => q.exerciseNumbers?.includes(n));
    assert.equal(set.length, 7, `${n}: seven focused questions`);
    assert.equal(set.filter(q => q.exercisePrimary).length, 1, `${n}: one complete original`);
    for (const id of [primaryId(n), ...drillIds(n)]) {
      const q = qById.get(id);
      assert.ok(q, `missing ${id}`);
      assert.deepEqual(q.exerciseNumbers, [n], `${id}: one unambiguous lesson`);
      assert.equal(q.track, 'practice', `${id}: practice track`);
      assert.equal(q.source?.file, pdf.file, `${id}: PDF source filter must retain this question`);
      assert.ok(q.tags.includes('4장집중연습'), `${id}: focused tag`);
      text(q.prompt, `${id}: prompt`);
      text(q.answer, `${id}: answer`);
      text(q.explanation, `${id}: explanation`);
      if (id === primaryId(n)) {
        assert.equal(q.exercisePrimary, true, `${id}: explicit full-original marker`);
        assert.equal(q.type, 'short', `${id}: whole-task response`);
        assert.ok(q.rubric?.length >= 3, `${id}: whole-task self-assessment rubric`);
      } else assert.notEqual(q.exercisePrimary, true, `${id}: a partial drill is not whole-task coverage`);
    }
  }
});

// These represent the PDF's complete requirements, independently of the many
// partial questions whose exerciseNumbers happen to point at the same lesson.
const originalRequirements = new Map([
  [1, [/콜백/, /무엇|설명/]],
  [2, [/namedWindow/, /flags|두\s*번째/, /WINDOW_NORMAL/, /WINDOW_AUTOSIZE/, /차이/]],
  [5, [/두\s*(?:예시\s*)?코드|두\s*개/, /실행\s*결과|결과/]],
  [6, [/300/, /400/, /100/, /500/, /600/, /표시/, /작성|생성/]],
  [9, [/600/, /400/, /100/, /200/, /300/, /빨간|빨강/, /사각형/]],
  [10, [/오른쪽/, /왼쪽/, /20/, /30/, /원/, /사각형/]],
  [13, [/컬러/, /test\.jpg/, /test\.png/, /저장/, /화질|품질/]],
  [16, [/카메라/, /200/, /100/, /50/, /녹색|초록/, /3/, /빨간|빨강/, /표시/]]
]);
for (const n of order) test(`${n}: full PDF requirements are preserved`, () => {
  const primary = qById.get(primaryId(n));
  const lesson = lessonByNumber.get(n);
  for (const requirement of originalRequirements.get(n)) {
    assert.match(primary.prompt, requirement, `primary prompt must preserve ${requirement}`);
    assert.match(lesson.prompt, requirement, `lesson prompt must preserve ${requirement}`);
  }
});

for (const n of order) test(`${n}: complete beginner lesson and consistent normal code`, () => {
  const e = lessonByNumber.get(n);
  for (const key of ['title', 'prompt', 'modelAnswer', 'resultDescription', 'recallPrompt']) text(e[key], `${n}: ${key}`);
  assert.equal(e.source?.file, pdf.file);
  assert.ok(Number.isInteger(e.source.page) && e.source.page >= 1 && e.source.page <= 12);
  for (const key of ['walkthrough', 'pitfalls', 'rubric', 'inputResources']) {
    assert.ok(Array.isArray(e[key]) && e[key].length, `${n}: ${key}`);
    e[key].forEach(value => text(value, `${n}: ${key} entry`));
  }
  assert.ok(Array.isArray(e.memorySteps) && e.memorySteps.length >= 3 && e.memorySteps.length <= 4);
  e.memorySteps.forEach(value => text(value, `${n}: memory step`));
  assert.ok(Array.isArray(e.resultFacts) && e.resultFacts.length >= 4);
  e.resultFacts.forEach(f => { text(f.label, `${n}: fact label`); text(f.value, `${n}: fact value`); });
  assert.equal(e.mentalCheck?.length, 3);
  e.mentalCheck.forEach(c => { text(c.question, `${n}: mental question`); text(c.answer, `${n}: mental answer`); });
  for (const key of ['correctedCode', 'correctedCodeExplanation', 'correctionExplanation']) {
    assert.ok(!(key in e), `${n}: show one normal version, without ${key}`);
  }
  if (n === 1 && !e.solutionCode) return;
  text(e.solutionCode, `${n}: solution code`);
  assert.equal(e.originalCode, e.solutionCode, `${n}: originalCode must also be the normal version`);
  if ('normalCode' in e) assert.equal(e.normalCode, e.solutionCode);
  assert.ok(!e.solutionCode.includes('____'), `${n}: lesson code cannot contain quiz blanks`);
  assert.ok(Array.isArray(e.codeExplanation) && e.codeExplanation.length, `${n}: code explanations`);
  const lines = e.solutionCode.replaceAll('\r\n', '\n').split('\n');
  const covered = new Set();
  for (const note of e.codeExplanation) {
    text(note.explanation, `${n}: explanation body`);
    const match = /^(\d+)(?:\s*[~–-]\s*(\d+))?\s*행/.exec(note.lines || '');
    assert.ok(match, `${n}: numeric source-line range ${note.lines}`);
    const start = Number(match[1]), end = Number(match[2] || match[1]);
    assert.ok(start >= 1 && start <= end && end <= lines.length, `${n}: valid line range ${note.lines}`);
    for (let line = start; line <= end; line++) {
      assert.ok(!covered.has(line), `${n}: overlapping explanation at line ${line}`);
      covered.add(line);
    }
  }
  lines.forEach((line, i) => { if (line.trim()) assert.ok(covered.has(i + 1), `${n}: unexplained code line ${i + 1}`); });
});

test('5: both complete programs retain normal names, colors and shift=1', () => {
  const e = lessonByNumber.get(5);
  assert.equal(e.originalCodeBlocks?.length, 2);
  const combined = e.originalCodeBlocks.map(b => b.code).join('\n\n');
  assert.equal(combined, e.solutionCode);
  assert.equal((combined.match(/cv2\.imshow\(/g) || []).length, 2);
  assert.match(combined, /image\[:\]\s*=\s*\(255,\s*255,\s*255\)/);
  assert.match(combined, /cv2\.rectangle\([^\n]*-1,\s*cv2\.LINE_4,\s*1\)/);
  assert.doesNotMatch(combined, /2555|iamge|iㅡㅁ/);
  for (const block of e.originalCodeBlocks) {
    assert.ok(block.codeExplanation?.length, 'each separate program has its own explanation');
    const total = block.code.split('\n').length;
    for (const note of block.codeExplanation) {
      const match = /^(\d+)(?:~(\d+))?행/.exec(note.lines);
      assert.ok(match && Number(match[1]) >= 1 && Number(match[2] || match[1]) <= total);
    }
  }
});

test('16: camera, ROI guard, saturation and cleanup remain in the normal program', () => {
  const code = lessonByNumber.get(16).solutionCode;
  for (const pattern of [/VideoCapture\(0\)/, /isOpened\(/, /if not ret:\s*break/, /frame_h\s*</, /frame_w\s*</, /roi\[:,\s*:,\s*1\]/, /cv2\.add\(/, /cv2\.rectangle\([^\n]*\(0,\s*0,\s*255\),\s*3\)/, /finally:\s*cap\.release\(\)\s*cv2\.destroyAllWindows\(\)/]) {
    assert.match(code, pattern);
  }
  assert.doesNotMatch(code, /video_file\.avi|CAP_PROP_POS_FRAMES|continue/);
});

// Rendering deliberately has no document/window or browser mocks. Loading and
// rendering these modules must not require DOM binding or camera permissions.
const context = vm.createContext({});
for (const name of ['code-notes.js', 'exercise-visuals.js', 'exercise-page.js']) {
  vm.runInContext(await readFile(new URL(name, root), 'utf8'), context, {filename: name});
}
const annotate = context.CV_CODE_NOTES.create({esc, rich, highlight: esc});
let completed = [];
const page = context.CV_EXERCISE_PAGE.create({
  data: practice,
  progress: () => ({exerciseRead: completed}),
  esc, rich,
  source: value => `<span class="test-source">${esc(value.label)}</span>`,
  code: value => `<pre class="test-code">${esc(value)}</pre>`,
  codeWithNotes: (value, notes) => annotate(value, notes)
});

test('overview: eight cards in syllabus order, both practice pools and progress', () => {
  assert.deepEqual(Array.from(page.order), order);
  const html = page.overview();
  assert.equal(count(html, /<article class="exercise-lesson-card">/g), 8);
  assert.ok(html.includes('#practice/exercise-originals') && html.includes('#practice/exercise-all'));
  assert.ok(html.includes('56문제 풀기') && html.includes('0/8 학습 완료'));
  assert.equal(count(html, /원문 \+ 연습 6개/g), 8);
  let previous = -1;
  for (const n of order) {
    const position = html.indexOf(`href="#exercises/${n}"`);
    assert.ok(position > previous, `${n}: card is present in fixed order`);
    previous = position;
    assert.ok(html.includes(`href="#practice/exercise-${n}"`));
  }
  completed = [1, 5, 16];
  const reviewed = page.overview();
  assert.ok(reviewed.includes('3/8 학습 완료'));
  assert.equal(count(reviewed, /✓ 학습 완료/g), 3);
  completed = [];
});

for (const n of order) test(`${n}: detail renders full task, visual, syllabus, explanations and seven links`, () => {
  const e = lessonByNumber.get(n);
  const html = page.detail(e);
  const navigation = html.match(/<nav class="exercise-syllabus"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation, 'syllabus navigation');
  assert.equal(count(navigation, /<a /g), 8);
  assert.equal(count(navigation, /aria-current="page"/g), 1);
  assert.ok(navigation.includes(`href="#exercises/${n}" aria-current="page"`));
  for (const number of order) assert.ok(navigation.includes(`href="#exercises/${number}"`));
  assert.ok(html.includes(`<div class="question-prompt">${rich(e.prompt)}</div>`), 'entire PDF task, not a partial-drill prompt');
  assert.ok(html.includes(rich(e.modelAnswer)), 'model answer');
  assert.ok(html.includes(`data-exercise="${n}"`), 'result preview');
  const visual = context.CV_EXERCISE_VISUALS.render(e);
  assert.ok(visual && html.includes(visual), 'actual result renderer output');
  for (const fact of e.resultFacts) assert.ok(html.includes(esc(fact.label)) && html.includes(rich(fact.value)));
  for (const step of e.memorySteps) assert.ok(html.includes(rich(step)));
  for (const check of e.mentalCheck) assert.ok(html.includes(esc(check.question)) && html.includes(rich(check.answer)));
  const checksHtml = html.match(/<section class="exercise-mental-check">([\s\S]*?)<\/section>/)?.[1];
  assert.equal(count(checksHtml || '', /<details>/g), 3);
  const drills = html.match(/<div class="exercise-drill-list">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(drills, 'focused drill list');
  assert.equal(count(drills, /<a href=/g), 7);
  for (const id of [primaryId(n), ...drillIds(n)]) assert.ok(drills.includes(`href="#practice/${id}"`), id);
  assert.equal(count(drills, /원문 전체 문제/g), 1);
  assert.ok(html.includes('원문부터 7문제 차례로 풀기'));
  assert.ok(html.includes(`data-exread="${n}"`));
  if (e.solutionCode) {
    assert.ok(html.includes('class="annotated-code"'), 'normal program rendered with adjacent explanations');
    const grouped = context.CV_CODE_NOTES.group(e.solutionCode, e.codeExplanation);
    assert.equal(Array.from(grouped).flatMap(row => Array.from(row.lines)).join('\n'), e.solutionCode.replaceAll('\r\n', '\n'));
    for (const note of e.codeExplanation) assert.ok(html.includes(rich(note.explanation)), note.lines);
  }
  assert.doesNotMatch(html, /수정본 코드|오류 코드와|원본 오류/);
});

console.log(`Exercise verification passed: ${passed} checks; 8 complete lessons, 8 originals and 48 focused drills; DOM-free overview/detail rendering.`);
