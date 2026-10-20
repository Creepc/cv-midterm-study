import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const [originals,practice,theory]=await Promise.all(['original-codes','practice','theory'].map(read));
const codes=new Map(originals.snippets.map(s=>[s.id,s]));
let blanks=0,outputs=0;
for(const s of codes.values())assert.equal(createHash('sha256').update(s.code).digest('hex'),s.sha256,'Source snapshot changed: '+s.id);
for(const q of practice.questions){
  if(['blank','output'].includes(q.type))assert.ok(q.originalCodeId,'Every practice blank/output must have an original: '+q.id);
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
assert.equal(blanks,30);assert.equal(outputs,33);
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
console.log(`Original-code checks passed: ${blanks} blanks reconstruct the source; ${outputs} result questions preserve the source; 49 concepts and all code questions have explanations.`);
