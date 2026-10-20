import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const [originals,practice,theory]=await Promise.all(['original-codes','practice','theory'].map(read));
const codes=new Map(originals.snippets.map(s=>[s.id,s]));
let blanks=0,outputs=0;
for(const s of codes.values())assert.equal(createHash('sha256').update(s.code).digest('hex'),s.sha256,'Source snapshot changed: '+s.id);
for(const q of practice.questions){
  if(['blank','output'].includes(q.type)&&q.tags.includes('원본코드'))assert.ok(q.originalCodeId,'Original-code practice must have a source snapshot: '+q.id);
  if(['blank','output'].includes(q.type)&&!q.originalCodeId){
    assert.equal(q.codeOrigin,'exercise-variation','Extra exercise code is explicitly marked as a variation: '+q.id);
    assert.ok(q.tags.includes('4장집중연습'));
    assert.ok(q.codeExplanation?.length,'Variation code has a line explanation: '+q.id);
  }
  if(!q.originalCodeId)continue;
  const s=codes.get(q.originalCodeId);assert.ok(s,'Unknown original: '+q.id);
  if(q.type==='blank'){
    assert.equal(q.code.split('____').length,2,'Exactly one masked span: '+q.id);
    assert.equal(q.code.replace('____',q.answer),s.code,'Filled code must equal the complete original: '+q.id);
    assert.equal(q.blankLine,q.code.slice(0,q.code.indexOf('____')).split('\n').length);
    blanks++;
  }else{
    assert.equal(q.code,s.code,'Code must equal the complete original: '+q.id);
    if(q.type==='output')outputs++;
  }
  assert.ok(q.codeExplanation?.length,'Missing code explanation: '+q.id);
  assert.equal(q.source.file,s.source.file);assert.deepEqual(q.source.page,s.source.page);
}
assert.equal(blanks,36);assert.equal(outputs,35);
for(const c of practice.concepts){
  assert.ok(c.modelAnswer?.trim()&&c.resultDescription?.trim(),c.id+': direct answer and result');
  assert.ok(c.originalCode?.trim()&&c.codeExplanation?.length,c.id+': code and explanation');
}
for(const e of practice.exercises){
  assert.ok(e.modelAnswer?.trim()&&e.resultDescription?.trim(),'Exercise '+e.number+': direct answer and result');
  if(e.originalCode)assert.ok(e.codeExplanation?.length,'Exercise '+e.number+': code explanation');
  assert.ok(!JSON.stringify(e).includes('원문 요구 확인'),'No author audit memo in study text');
}
assert.equal(practice.exercises.find(e=>e.number===2).originalCode,codes.get('ch4-ex02').code,'Flags explanation uses the complete original code');
for(const q of theory.questions.filter(q=>q.code))assert.ok(q.codeExplanation?.length,'Theory code explanation: '+q.id);
assert.equal(theory.questions.find(q=>q.id==='th-q-w3-2').code,codes.get('ch4-ex12').code);
assert.equal(theory.questions.find(q=>q.id==='th-q-w4-1').code,codes.get('ch4-ex15').code);
for(const q of theory.questions.filter(q=>q.originalCodeId)){
  const original=codes.get(q.originalCodeId);assert.ok(original,'Unknown textbook original: '+q.id);
  assert.equal(q.type==='blank'?q.code.replace('____',q.answer):q.code,original.code,'Textbook code must preserve the complete source: '+q.id);
  if(q.type==='blank')assert.equal(q.code.split('____').length,2,'One masked span: '+q.id);
  const reference=q.codeSource||q.source;
  assert.equal(reference.file,original.source.file);assert.deepEqual(reference.page,original.source.page);
}
for(const [id,lines] of [['book-6-3-4',38],['book-6-3-5',40],['book-6-3-6',35]])assert.equal(codes.get(id).code.split('\n').length,lines,'Complete textbook example: '+id);
assert.equal(theory.questions.find(q=>q.id==='th-q-w7-2').code,codes.get('book-6-3-5').code);
for(const [qid,book] of [['th-q-w7-1','book-6-3-4'],['th-q-w7-3','book-6-3-6']])assert.equal(theory.questions.find(q=>q.id===qid).additionalCodeBlocks[0].code,codes.get(book).code);
assert.equal(theory.questions.find(q=>q.id==='th-q-w7-1').answer,'1,2,4,0,3,1,5');
assert.equal(theory.questions.find(q=>q.id==='th-q-w7-3').answer,'0 5 5 3 / 3 5 7 5 / 3 5 7 5 / 3 7 3 7');
console.log(`Original-code checks passed: ${blanks} practice blanks reconstruct the source; ${outputs} practice result questions preserve the source; all three textbook examples and unchanged diagnostic matrix answers verified.`);
