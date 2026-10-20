import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(`data/${name}.json`, root), 'utf8'));
const [practice, originals, cram] = await Promise.all(['practice', 'original-codes', 'cram'].map(read));
const questionMap = new Map(practice.questions.map(q => [q.id, q]));
const sourceMap = new Map(originals.snippets.map(s => [s.id, s]));
const dataSnapshot = JSON.stringify({practice, originals, cram});
const text = value => assert.ok(typeof value === 'string' && value.trim(), 'nonempty text');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const rich = value => esc(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const ids = pool => Array.from(pool, q => q.id);
let passed = 0;
function test(name, run) {
  try { run(); passed++; }
  catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}

test('recommendations are unique source-based practice questions', () => {
  assert.ok(cram.cards.length >= 8, 'nonempty curated collection');
  assert.equal(new Set(cram.cards.map(c => c.questionId)).size, cram.cards.length);
  for (const card of cram.cards) {
    const q = questionMap.get(card.questionId);
    assert.ok(q, `unknown recommendation ${card.questionId}`);
    assert.equal(q.track, 'practice');
    assert.ok(['blank', 'output'].includes(q.type));
    assert.ok(q.tags.includes('원본코드'));
    assert.ok(sourceMap.has(q.originalCodeId));
    assert.ok([1, 2, 3].includes(card.priority));
    for (const key of ['likelyBlankOrOutput', 'recognize', 'reason', 'trap']) text(card[key]);
  }
});

for (const card of cram.cards) test(`${card.questionId}: complete source and valid line explanations`, () => {
  const q = questionMap.get(card.questionId), original = sourceMap.get(q.originalCodeId);
  assert.equal(createHash('sha256').update(original.code).digest('hex'), original.sha256);
  if (q.type === 'blank') {
    assert.equal(q.code.split('____').length, 2, 'exactly one masked span');
    assert.equal(q.code.replace('____', q.answer), original.code, 'answer reconstructs every original byte');
    assert.equal(q.blankLine, q.code.slice(0, q.code.indexOf('____')).split('\n').length);
  } else assert.equal(q.code, original.code);
  assert.equal(q.source.file, original.source.file);
  assert.deepEqual(q.source.page, original.source.page);
  assert.ok(q.codeExplanation?.length);
  for (const note of q.codeExplanation) {
    const range = /^(\d+)(?:[~–-](\d+))?행/.exec(note.lines);
    assert.ok(range, note.lines);
    const start = Number(range[1]), end = Number(range[2] || range[1]);
    assert.ok(start >= 1 && start <= end && end <= original.code.split('\n').length, note.lines);
    text(note.explanation);
  }
});

test('eight supplementary questions preserve requested scope and source', () => {
  const expected = [
    ['pdf-ex05','output'], ['pdf-ex05','blank'], ['pdf-ex13','blank'], ['pdf-ex10','output'],
    ['pdf-ex10','blank'], ['pdf-ex09','blank'], ['pdf-ex16','blank'], ['pdf-ex06','blank']
  ];
  for (let i = 0; i < expected.length; i++) {
    const id = `p-cram-${String(i + 1).padStart(2, '0')}`, q = questionMap.get(id);
    assert.ok(q, id);
    assert.equal(q.originalCodeId, expected[i][0]);
    assert.equal(q.type, expected[i][1]);
    assert.deepEqual(q.source, sourceMap.get(q.originalCodeId).source);
    for (const tag of ['원본코드', '찍기신공', '필수', '4장']) assert.ok(q.tags.includes(tag));
    assert.ok(cram.cards.some(c => c.questionId === id && c.priority === 1), id + ' priority');
  }
});

test('strategy references are valid original practice questions', () => {
  assert.ok(cram.strategies.length);
  assert.equal(new Set(cram.strategies.map(s => s.id)).size, cram.strategies.length);
  for (const strategy of cram.strategies) {
    for (const key of ['id', 'title', 'cue', 'rule', 'example', 'trap']) text(strategy[key]);
    assert.ok(strategy.questionIds.length);
    assert.equal(new Set(strategy.questionIds).size, strategy.questionIds.length);
    for (const id of strategy.questionIds) {
      const q = questionMap.get(id);
      assert.ok(q && q.track === 'practice' && ['blank','output'].includes(q.type), `strategy question ${id}`);
      assert.ok(sourceMap.has(q.originalCodeId), `strategy source ${id}`);
    }
  }
});

// Loading and pure rendering do not require document, window, or DOM libraries.
const context = vm.createContext({});
for (const name of ['grading.js', 'progress.js', 'code-notes.js', 'cram-page.js']) {
  vm.runInContext(await readFile(new URL(name, root), 'utf8'), context, {filename: name});
}
let progressState = {records:{}, read:[], bookmarks:[], qBookmarks:[], exerciseRead:[], exams:[], days:[]};
const recordCalls = [], annotationCalls = [];
const annotate = context.CV_CODE_NOTES.create({esc, rich, highlight: esc});
const page = context.CV_CRAM.create({
  data: {...practice, cram}, esc, rich,
  code: value => `<pre class="test-source-code">${esc(value)}</pre>`,
  codeWithNotes(value, notes) {
    annotationCalls.push({value, notes});
    return annotate(value, notes);
  },
  source: value => `<span class="test-source">${esc(value.file)} / ${esc(value.label)}</span>`,
  grade: context.CV_GRADE.check,
  progress: () => progressState,
  record(q, correct, answer, assisted) {
    recordCalls.push({id:q.id, correct, answer, assisted});
    const previous = progressState.records[q.id];
    progressState.records[q.id] = {correct, answer, assisted, date:Date.now(), attempts:(previous?.attempts || 0)+1, wrongAttempts:(previous?.wrongAttempts || 0)+(correct?0:1)};
  }
});

test('DOM-free overview and listing expose valid navigation and counts', () => {
  assert.equal('document' in context, false);
  assert.equal('window' in context, false);
  const overview = page.overview(), listing = page.listing();
  for (const part of ['blanks','outputs','mixed','wrong','list']) assert.ok(overview.includes(`href="#cram/${part}"`));
  for (const number of [1,2,5,6,9,10,13,16]) assert.ok(overview.includes(`href="#exercises/${number}"`));
  for (const card of cram.cards) assert.ok(listing.includes(`href="#cram/${card.questionId}"`));
  assert.equal((listing.match(/<article class="cram-card">/g) || []).length, cram.cards.length);
  assert.ok(overview.includes(`전체 ${cram.cards.length}문제`));
});

test('strategy links retain both curated and supplementary source examples', () => {
  const overview = page.overview(), selected = new Set(cram.cards.map(c => c.questionId));
  for (const strategy of cram.strategies) {
    for (const id of strategy.questionIds.slice(0, 3)) {
      assert.ok(overview.includes(`href="#${selected.has(id) ? 'cram' : 'practice'}/${id}"`), `${strategy.id}: ${id}`);
    }
  }
});

test('supplementary traps are rejected while exact insertion syntax is retained', () => {
  const traps = ['(200,300),(300,400)', '2', '9', '(115,215)', '40', '(255,0,0)', 'add', '255'];
  for (let i = 0; i < traps.length; i++) {
    const q = questionMap.get(`p-cram-${String(i + 1).padStart(2, '0')}`);
    assert.equal(page.evaluate(q, traps[i]), false);
    assert.equal(page.evaluate(q, q.answer), true);
  }
  assert.equal(page.evaluate(questionMap.get('p-cram-06'), '(0,0,255)'), true);
  assert.equal(page.evaluate(questionMap.get('p-cram-07'), 'CV2.ADD'), false);
  assert.equal(page.evaluate(questionMap.get('p-cram-07'), 'cv2.add(roi[:, :, 1],50)'), false);
});

test('pools retain curated order and exact type/record filters', () => {
  const all = cram.cards.map(c => questionMap.get(c.questionId));
  assert.deepEqual(ids(page.buildPool('mixed')), ids(all));
  assert.deepEqual(ids(page.buildPool('blanks')), ids(all.filter(q => q.type === 'blank')));
  assert.deepEqual(ids(page.buildPool('outputs')), ids(all.filter(q => q.type === 'output')));
  for (const q of all) assert.deepEqual(ids(page.buildPool(q.id)), [q.id]);
  const unselected = practice.questions.find(q => !all.includes(q));
  progressState.records = {[all[0].id]:{correct:false}, [all[1].id]:{correct:true}, '__unknown__':{correct:false}};
  if (unselected) progressState.records[unselected.id] = {correct:false};
  assert.deepEqual(ids(page.buildPool('wrong')), [all[0].id]);
  progressState.records = {};
  assert.equal(page.buildPool('wrong').length, 0);
});

for (const q of page.selected) test(`${q.id}: grader and reveal boundaries`, () => {
  assert.equal(page.evaluate(q, undefined), null);
  assert.equal(page.evaluate(q, null), null);
  assert.equal(page.evaluate(q, ' \n\t '), null);
  assert.equal(page.evaluate(q, q.answer), true);
  assert.equal(page.evaluate(q, '__WRONG_INPUT_953__'), false);
  annotationCalls.length = 0;
  const view = state => page.questionView({pool:[q], index:0, answer:'', feedback:null, assisted:false, ...state});
  const pending = view({});
  assert.ok(pending.includes(`<pre class="test-source-code">${esc(q.code)}</pre>`));
  assert.ok(pending.includes(rich(q.prompt)), 'full problem conditions');
  assert.equal(annotationCalls.length, 0, 'no completed-code explanation before answering');
  assert.ok(!pending.includes('class="cram-answer-value"'));
  assert.ok(!pending.includes('class="cram-feedback'));
  if (q.type === 'blank') assert.ok(pending.includes('____'), 'blank remains masked');
  const sentinel = {...q, answer:'DO_NOT_LEAK_ANSWER_953', explanation:'DO_NOT_LEAK_EXPLANATION_953', steps:['DO_NOT_LEAK_STEPS_953'], accepted:['DO_NOT_LEAK_ACCEPTED_953']};
  const guarded = page.questionView({pool:[sentinel], index:0, answer:'', feedback:null, assisted:false});
  for (const marker of ['ANSWER','EXPLANATION','STEPS','ACCEPTED']) assert.ok(!guarded.includes(`DO_NOT_LEAK_${marker}_953`));
  const checked = view({answer:'my input', feedback:{correct:false, revealed:false}});
  assert.ok(checked.includes(esc(q.answer)));
  assert.ok(checked.includes(rich(q.explanation)));
  assert.equal(annotationCalls.length, 1);
  const expectedCode = q.type === 'blank' ? q.code.replace('____', q.answer) : q.code;
  assert.equal(annotationCalls[0].value, expectedCode);
  assert.equal(annotationCalls[0].value, sourceMap.get(q.originalCodeId).code);
  assert.deepEqual(annotationCalls[0].notes, q.codeExplanation);
  const grouped = context.CV_CODE_NOTES.group(expectedCode, q.codeExplanation);
  assert.equal(Array.from(grouped).flatMap(group => Array.from(group.lines)).join('\n'), expectedCode);
});

// The event harness records listeners and rendered HTML rather than emulating a
// browser layout. Native AbortSignal behavior is respected on repeated mounts.
context.AbortController = AbortController;
context.window = {scrollTo(){}};
context.location = {hash:'#cram'};
class RootHarness {
  listeners = [];
  innerHTML = '';
  focusCount = 0;
  addEventListener(type, listener, options) { this.listeners.push({type, listener, signal:options.signal}); }
  querySelector(selector) {
    if (selector === '#cram-answer' && this.innerHTML.includes('id="cram-answer"')) return {focus:()=>{this.focusCount++;}};
    if (selector === '.cram-feedback' && this.innerHTML.includes('class="cram-feedback')) return {scrollIntoView(){}};
    return null;
  }
  dispatch(type, target) {
    const event = {target, preventDefault(){}};
    // Browsers do not run listeners added during this target's current dispatch.
    for (const entry of [...this.listeners]) if (entry.type === type && !entry.signal.aborted) entry.listener(event);
  }
  input(value) { this.dispatch('input', {id:'cram-answer', value}); }
  submit() { this.dispatch('submit', {matches:selector=>selector === '.cram-answer-form'}); }
  click(action, value) {
    const button = {dataset:{cramAction:action, value}};
    this.dispatch('click', {closest:()=>button});
  }
  priority(value) { this.dispatch('change', {value, matches:selector=>selector === '[data-cram-priority]'}); }
}

test('mount: blank input and revealing the answer never create records', () => {
  progressState.records = {}; recordCalls.length = 0;
  const q = page.selected.find(q => q.type === 'blank'), target = new RootHarness();
  page.mount(target, q.id);
  target.submit();
  assert.equal(recordCalls.length, 0);
  assert.ok(target.innerHTML.includes('먼저 답을 적어 보세요.'));
  target.click('hint');
  assert.equal(recordCalls.length, 0);
  target.click('reveal');
  assert.equal(recordCalls.length, 0);
  assert.ok(target.innerHTML.includes('먼저 공개한 답은 정답 기록에 넣지 않습니다.'));
  assert.ok(target.innerHTML.includes('class="cram-answer-value"'));
  target.submit(); target.click('reveal');
  assert.equal(recordCalls.length, 0, 'repeated reveal/submit after disclosure stays unrecorded');
  assert.equal(progressState.records[q.id], undefined);
  target.click('retry');
  assert.ok(!target.innerHTML.includes('class="cram-answer-value"'));
  assert.ok(target.innerHTML.includes('____'));
});

test('mount: attempts save exact input/assistance once and remain stable after progress reload', () => {
  progressState.records = {}; recordCalls.length = 0;
  const q = page.selected.find(q => q.type === 'blank'), target = new RootHarness();
  page.mount(target, q.id);
  target.click('hint'); target.input('__WRONG_INPUT_953__'); target.submit();
  assert.equal(recordCalls.length, 1);
  assert.deepEqual(recordCalls[0], {id:q.id, correct:false, answer:'__WRONG_INPUT_953__', assisted:true});
  target.submit();
  assert.equal(recordCalls.length, 1, 'same answer is not counted twice');
  assert.ok(ids(page.buildPool('wrong')).includes(q.id));
  target.click('retry'); target.input(q.answer); target.submit();
  assert.equal(recordCalls.length, 2);
  assert.deepEqual(recordCalls[1], {id:q.id, correct:true, answer:q.answer, assisted:false});
  assert.equal(progressState.records[q.id].attempts, 2);
  assert.equal(progressState.records[q.id].wrongAttempts, 1);
  assert.ok(!ids(page.buildPool('wrong')).includes(q.id));
  const restored = context.CV_PROGRESS.refreshAnswers(context.CV_PROGRESS.validate(progressState, practice), practice, context.CV_GRADE.check);
  assert.equal(restored.records[q.id].correct, true);
  assert.equal(restored.records[q.id].answer, q.answer);
  assert.equal(restored.records[q.id].wrongAttempts, 1);
});

test('mount: rebinding, skipping and finishing do not add phantom attempts', () => {
  progressState.records = {}; recordCalls.length = 0;
  const q = page.selected[0], target = new RootHarness();
  page.mount(target, q.id); page.mount(target, q.id);
  target.input(q.answer); target.submit();
  assert.equal(recordCalls.length, 1, 'old event handlers aborted');
  recordCalls.length = 0;
  page.mount(target, q.id); target.click('next');
  assert.ok(target.innerHTML.includes('이번 회독을 마쳤습니다'));
  assert.equal(recordCalls.length, 0, 'skip is not an incorrect attempt');
});

test('mount: restarting wrong questions on the same route refreshes the pool', () => {
  progressState.records = {}; recordCalls.length = 0;
  const [first, second] = page.selected;
  progressState.records[first.id] = {correct:false};
  progressState.records[second.id] = {correct:false};
  context.location.hash = '#cram/wrong';
  const target = new RootHarness();
  page.mount(target, 'wrong');
  target.input(first.answer); target.submit(); target.click('next'); target.click('next');
  assert.ok(target.innerHTML.includes('이번 회독을 마쳤습니다'));
  target.click('restart-wrong');
  assert.ok(target.innerHTML.includes(`<h1>${esc(second.title)}</h1>`));
  assert.ok(target.innerHTML.includes('1 / 1'));
  assert.equal(recordCalls.length, 1);
  target.input(second.answer); target.submit(); target.click('next'); target.click('restart-wrong');
  assert.ok(target.innerHTML.includes('복습할 오답이 없습니다'));
  assert.equal(recordCalls.length, 2);
  context.location.hash = '#cram/mixed';
  target.click('restart-wrong');
  assert.equal(context.location.hash, '#cram/wrong', 'different route delegates to the app hash router');
});

test('listing filters work through mounted controls', () => {
  const target = new RootHarness();
  page.mount(target, 'list'); target.click('list-type', 'blank');
  const blankCards = cram.cards.filter(c => questionMap.get(c.questionId).type === 'blank');
  assert.equal((target.innerHTML.match(/<article class="cram-card">/g) || []).length, blankCards.length);
  target.priority('1');
  const priorityOne = blankCards.filter(c => c.priority === 1);
  assert.equal((target.innerHTML.match(/<article class="cram-card">/g) || []).length, priorityOne.length);
  for (const card of priorityOne) assert.ok(target.innerHTML.includes(`href="#cram/${card.questionId}"`));
});

test('all operations leave question code, answers and source snapshots unchanged', () => {
  assert.equal(JSON.stringify({practice, originals, cram}), dataSnapshot);
});

console.log(`Cram verification passed: ${passed} checks; ${cram.cards.length} source-based recommendations; pre-answer masking, complete feedback code, strict grading, wrong-pool filtering and unassisted/assisted record lifecycle.`);
