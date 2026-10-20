import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const [theory,practice,weekly,audit,sources]=await Promise.all(['theory','practice','weekly','audit','sources'].map(read));
const data={concepts:[...theory.concepts,...practice.concepts],questions:[...theory.questions,...practice.questions],exercises:practice.exercises,weeks:weekly.weeks,audit,sources};
const conceptMap=new Map(data.concepts.map(c=>[c.id,c])),questionMap=new Map(data.questions.map(q=>[q.id,q])),sourceMap=new Map(sources.map(s=>[s.id,s]));
let checks=0;function test(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
const text=s=>assert.ok(typeof s==='string'&&s.trim());
test('four weeks preserve all eighteen original diagnostic items',()=>{
  assert.deepEqual(weekly.weeks.map(w=>w.week),[2,3,4,7]);
  assert.deepEqual(weekly.weeks.map(w=>w.items.length),[7,3,5,3]);
  const original=[];
  for(const w of weekly.weeks){
    text(w.title);text(w.summary);assert.equal(w.sourceId,w.id);assert.equal(sourceMap.get(w.sourceId).kind,'diagnostic');
    assert.deepEqual(w.items.map(i=>i.number),Array.from({length:w.items.length},(_,i)=>i+1));
    assert.ok(w.checklist.length>=3);w.checklist.forEach(text);
    for(const item of w.items){
      for(const k of ['id','title','definition','example'])text(item[k]);
      assert.ok(item.keyPoints.length>=3);item.keyPoints.forEach(text);assert.ok(item.pitfalls.length);item.pitfalls.forEach(text);
      (item.details||[]).forEach(d=>{text(d.title);text(d.body);});
      assert.ok(item.questionIds.length&&item.conceptIds.length);
      item.questionIds.forEach(id=>assert.ok(questionMap.has(id),'unknown question '+id));
      item.conceptIds.forEach(id=>assert.ok(conceptMap.has(id),'unknown concept '+id));
      assert.ok(item.questionIds.includes(item.primaryQuestionId));
      const core=[questionMap.get(item.primaryQuestionId)];
      assert.ok(core[0]?.tags.includes('원문'),'one identified original question per item');
      assert.equal(core[0].source.file,sourceMap.get(w.sourceId).file);
      assert.equal(item.source.file,core[0].source.file);original.push(core[0].id);
    }
  }
  assert.equal(new Set(original).size,18);
  assert.deepEqual([...new Set(original)].sort(),data.questions.filter(q=>q.tags.includes('원문')).map(q=>q.id).sort());
});
test('all lecture concepts have explicit relevant question links',()=>{
  for(const c of data.concepts){
    assert.ok(c.relatedQuestionIds?.length,'missing links: '+c.id);
    c.relatedQuestionIds.forEach(id=>assert.ok(questionMap.has(id),'unknown related question: '+id));
    const lecture=c.lectureSourceId?sourceMap.get(c.lectureSourceId):sources.find(s=>s.file===c.source.file);
    assert.equal(lecture?.kind,'lecture','every note has a lecture folder: '+c.id);
  }
});
test('audit covers the final questions and all nine sources',()=>{
  assert.equal(audit.reviewedAt,'2026-10-20');text(audit.summary);
  assert.deepEqual(audit.sources.map(s=>s.sourceId).sort(),sources.map(s=>s.id).sort());
  assert.equal(audit.questionChecks.reviewed,data.questions.length);
  assert.ok(audit.questionChecks.executed>=39&&audit.questionChecks.executed<=data.questions.length);
  audit.questionChecks.notes.forEach(text);
  for(const s of audit.sources){assert.ok(Number.isSafeInteger(s.units)&&s.units>0);text(s.unitLabel);text(s.coverage);assert.ok(s.checks.length);s.checks.forEach(text);s.corrections.forEach(text);s.limitations.forEach(text);}
  assert.equal(new Set(audit.findings.map(f=>f.id)).size,audit.findings.length);
  for(const f of audit.findings){for(const k of ['id','title','location','detail','correction'])text(f[k]);assert.ok(sourceMap.has(f.sourceId));assert.ok(['corrected','clarified','source-error'].includes(f.status));f.questionIds.forEach(id=>assert.ok(questionMap.has(id)));}
});
const context=vm.createContext({});vm.runInContext(await readFile(new URL('../study-views.js',import.meta.url),'utf8'),context);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const view=context.CV_STUDY.create({data,progress:()=>({records:{},read:[],bookmarks:[],exerciseRead:[]}),esc:escape,rich:escape,list:a=>a.map(escape).join('\n'),code:escape,source:s=>escape(s.file),heading:(_,title)=>`<h1>${title}</h1>`,empty:escape});
test('weekly overview renders all items without mixing original and variant labels',()=>{
  const html=view.weekly();assert.equal((html.match(/class="weekly-item"/g)||[]).length,18);
  for(const w of data.weeks){assert.ok(html.includes(`#practice/week-${w.id}`));const one=view.weekly(w.id);assert.equal((one.match(/class="weekly-item"/g)||[]).length,w.items.length);}
  assert.ok(html.includes('연결 변형 문제'));
});
test('weekly practice contains only the identified original questions',()=>{
  for(const w of data.weeks){const selected=view.weeklyQuestions(w.id);assert.equal(selected.length,w.items.length);assert.deepEqual(Array.from(selected,q=>q.id),w.items.map(i=>i.primaryQuestionId));assert.ok(selected.every(q=>q.tags.includes('원문')));}
});
test('three-bit guide handles every boundary and the original sample sequence',()=>{
  for(const [input,index,bits] of [[0,0,'000'],[.249999,0,'000'],[.25,1,'001'],[1.1,4,'100'],[1.25,5,'101'],[1.6,6,'110'],[2,7,'111']]){
    const r=view.threeBit(input);assert.equal(r.index,index);assert.equal(r.bits,bits);
  }
  for(const invalid of ['', '  ', -1, 2.1, NaN, 'hello'])assert.equal(view.threeBit(invalid),null);
  assert.equal([1.1,1.6,2,1.6,1.1,.3,0,.3].map(n=>view.threeBit(n).bits).join(''),'100110111110100001000001');
  const guide=view.renderGuide('three-bit');
  assert.equal((guide.match(/data-range-index=/g)||[]).length,8);
  assert.ok(guide.includes('4의 자리')&&guide.includes('2의 자리')&&guide.includes('1의 자리'));
  assert.equal(view.renderGuide(undefined),'');
});
test('changed samples, ranges and bit counts follow the same calculation',()=>{
  for(const [value,min,max,bits,index,code,from,to] of [[1.4,0,2,3,5,'101',1.25,1.5],[.9,0,2,3,3,'011',.75,1],[-.3,-1,1,3,2,'010',-.5,-.25],[15,10,18,2,2,'10',14,16],[.375,0,1,3,3,'011',.375,.5]]){
    const r=view.quantize(value,{min,max,bits});
    assert.equal(r.index,index);assert.equal(r.bits,code);assert.equal(r.from,from);assert.equal(r.to,to);
    assert.equal(r.binary.reduce((sum,s)=>sum+s.bit*s.weight,0),index);
  }
  for(let bits=1;bits<=6;bits++){
    const r=view.quantize(2,{bits});assert.equal(r.bits,'1'.repeat(bits));assert.equal(r.index,2**bits-1);
  }
  const html=view.renderGuide('three-bit',{bits:2,value:1.4});
  assert.equal((html.match(/data-range-index=/g)||[]).length,4);assert.ok(html.includes('2비트'));
  for(const config of [{min:2,max:2},{min:3,max:2},{bits:0},{bits:7},{bits:2.5}])assert.equal(view.quantize(1,config),null);
});
test('decimal boundaries are classified exactly without rounding up nearby samples',()=>{
  assert.equal(view.quantize('0.3',{min:'0',max:'0.8',bits:3}).index,3);
  assert.equal(view.quantize('0.29999999999999999',{min:'0',max:'0.8',bits:3}).index,2);
  assert.equal(view.quantize('0.30000000000000001',{min:'0',max:'0.8',bits:3}).index,3);
  assert.equal(view.quantize('3e-1',{min:'0',max:'8e-1',bits:3}).index,3);
  assert.equal(view.quantize('0.25').atBoundary,true);
  assert.equal(view.quantize('0.24999999999999999').index,0);
  assert.equal(view.quantize('1.4').positionText,'5.6');
  const almostMax=view.quantize('0.79999999999999999',{min:'0',max:'0.8',bits:3});
  assert.equal(almostMax.atMax,false);assert.equal(almostMax.index,7);
  assert.equal(view.quantize('0.8',{min:'0',max:'0.8',bits:3}).atMax,true);
  assert.equal(view.quantize(null),null);
});
test('home, separate lecture folders and audit render',()=>{
  assert.equal((view.home().match(/class="week-overview"/g)||[]).length,4);
  assert.equal((view.materials().match(/class="material-folder"/g)||[]).length,4);
  for(const s of sources.filter(s=>s.kind==='lecture'))assert.ok(view.materials(s.id).includes(s.title));
  assert.ok(view.sources('audit').includes(`${data.questions.length}`));
  for(const s of sources)assert.ok(view.sources(s.id).includes(s.title));
});
console.log(`Passed ${checks} study structure checks: 18 weekly originals, 4 lecture folders, ${data.questions.length} audited questions.`);
