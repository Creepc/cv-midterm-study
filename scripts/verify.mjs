import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>readFile(path.join(root,file),'utf8');
const parts=await Promise.all(['theory','practice'].map(async name=>JSON.parse(await read(`data/${name}.json`))));
const sources=JSON.parse(await read('data/sources.json'));
const data={concepts:parts.flatMap(p=>p.concepts||[]),questions:parts.flatMap(p=>p.questions||[]),exercises:parts.flatMap(p=>p.exercises||[]),sources};
let checks=0;
function test(name,fn){try{fn();checks++;}catch(error){error.message=`${name}: ${error.message}`;throw error;}}
const text=(value,label)=>assert.ok(typeof value==='string'&&value.trim(),`${label} must be nonempty text`);
const plain=x=>JSON.parse(JSON.stringify(x));
const copy=x=>JSON.parse(JSON.stringify(x));
const sourceKey=file=>String(file).replaceAll('\\','/').replace(/[^/]*과제\(4장연습문제\)\.pdf$/,'4장 연습문제.pdf');
const sourceMap=new Map();
const sourceUse=new Set();
function checkSource(source,label){
  assert.ok(source&&typeof source==='object',`${label}: missing source`);
  text(source.file,`${label}.source.file`);text(source.label,`${label}.source.label`);
  const key=sourceKey(source.file),known=sourceMap.get(key);
  assert.ok(known,`${label}: unregistered source ${source.file}`);
  const pages=Array.isArray(source.page)?source.page:[source.page];
  assert.ok(pages.length&&pages.every(p=>Number.isSafeInteger(p)&&p>=1&&p<=known.pages),`${label}: page outside ${known.pages}-page source`);
  sourceUse.add(key);
}
test('nine complete source records',()=>{
  assert.equal(sources.length,9);assert.equal(new Set(sources.map(s=>s.id)).size,9);
  for(const s of sources){text(s.id,'source ID');text(s.file,'source filename');text(s.title,'source title');assert.ok(['lecture','diagnostic','exercise'].includes(s.kind));assert.ok(Number.isSafeInteger(s.pages)&&s.pages>0);assert.ok(Array.isArray(s.coverage)&&s.coverage.length>0);s.coverage.forEach(x=>text(x,'source coverage'));assert.ok(Array.isArray(s.notes));sourceMap.set(sourceKey(s.file),s);}
  assert.equal(sourceMap.size,9);
});
test('all IDs are unique',()=>{
  const ids=[...data.concepts,...data.questions].map(x=>x.id);ids.forEach(id=>text(id,'ID'));assert.equal(new Set(ids).size,ids.length);
});
for(const c of data.concepts)test(`concept ${c.id}`,()=>{
  for(const field of ['id','chapter','title','summary'])text(c[field],`${c.id}.${field}`);
  assert.ok(['theory','practice'].includes(c.track));
  assert.ok(Array.isArray(c.sections)&&c.sections.length>0);for(const section of c.sections){text(section.title,'section title');text(section.body,'section body');}
  assert.ok(Array.isArray(c.keyPoints)&&c.keyPoints.length>0);c.keyPoints.forEach(x=>text(x,'key point'));
  assert.ok(Array.isArray(c.pitfalls));c.pitfalls.forEach(x=>text(x,'pitfall'));checkSource(c.source,c.id);
});
for(const q of data.questions)test(`question ${q.id}`,()=>{
  for(const field of ['id','topic','title','prompt','answer','explanation'])text(q[field],`${q.id}.${field}`);
  assert.ok(['theory','practice'].includes(q.track));assert.ok(['choice','blank','output','short'].includes(q.type));assert.ok(Number.isSafeInteger(q.difficulty)&&q.difficulty>=1&&q.difficulty<=3);
  assert.ok(Array.isArray(q.tags)&&q.tags.length>0);q.tags.forEach(x=>text(x,'question tag'));
  if(q.accepted!==undefined){assert.ok(Array.isArray(q.accepted));q.accepted.forEach(x=>text(x,'accepted answer'));}
  if(q.steps!==undefined){assert.ok(Array.isArray(q.steps));q.steps.forEach(x=>text(x,'solution step'));}
  if(q.type==='choice'){assert.ok(Array.isArray(q.choices)&&q.choices.length>=2);q.choices.forEach(x=>text(x,'choice'));assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer),'choice answer must be a displayed choice');}
  checkSource(q.source,q.id);
});
test('eight designated exercises',()=>{
  assert.deepEqual(data.exercises.map(e=>e.number).sort((a,b)=>a-b),[1,2,5,6,9,10,13,16]);
  for(const e of data.exercises){text(e.title,'exercise title');text(e.prompt,'exercise prompt');assert.ok(Array.isArray(e.walkthrough)&&e.walkthrough.length>0);e.walkthrough.forEach(x=>text(x,'walkthrough'));assert.ok(Array.isArray(e.pitfalls));checkSource(e.source,`exercise ${e.number}`);}
});
test('every source contributes study content',()=>assert.deepEqual([...sourceUse].sort(),[...sourceMap.keys()].sort()));
test('both tracks and all question modes are present',()=>{
  assert.deepEqual([...new Set(data.questions.map(q=>q.track))].sort(),['practice','theory']);
  assert.deepEqual([...new Set(data.questions.map(q=>q.type))].sort(),['blank','choice','output','short']);
});

const context=vm.createContext({});
vm.runInContext(await read('grading.js'),context,{filename:'grading.js'});
vm.runInContext(await read('progress.js'),context,{filename:'progress.js'});
const grade=context.CV_GRADE,validate=context.CV_PROGRESS.validate;
test('unanswered questions never earn credit',()=>{
  const q={type:'choice',choices:['correct','wrong'],answer:'correct'};
  for(const value of ['', '   ', undefined, null])assert.equal(grade.check(q,value),false);
  assert.equal(grade.check(q,'0'),true);assert.equal(grade.check(q,'1'),false);assert.equal(grade.check(q,'99'),false);
});
test('numeric formatting preserves element boundaries',()=>{
  const q={type:'output',answer:'[[1, 23], [4, 5]]'};
  assert.equal(grade.check(q,'1 23\n4 5'),true);assert.equal(grade.check(q,'[[12, 3], [4, 5]]'),false);
  assert.equal(grade.check({type:'output',answer:'(300, 400, 3)'},'[300 400 3]'),true);
  assert.equal(grade.check({type:'output',answer:'[24, 44]'},'[244, 4]'),false);
});
test('long integer and binary answers preserve exact digits',()=>{
  assert.equal(grade.check({type:'output',answer:'100110111110100001000001'},'100110111110100001000002'),false);
  const q={type:'output',answerFormat:'bits',answer:'100 110 111 110 100 001 000 001'};
  assert.equal(grade.check(q,'100110111110100001000001'),true);
  assert.equal(grade.check(q,'100 110 111 110 100 1 0 1'),false);
  assert.equal(grade.check(q,'100110111110100001000000'),false);
});
test('code formatting and declared alternatives work',()=>{
  assert.equal(grade.check({type:'blank',answer:'cv2.EVENT_RBUTTONDOWN'},'EVENT_RBUTTONDOWN'),true);
  assert.equal(grade.check({type:'blank',answer:'frame[y:y+h, x:x+w]'},'frame[ y : y + h , x : x + w ]'),true);
  assert.equal(grade.check({type:'blank',answer:'cv2.COLOR_BGR2RGB'},'cv2.COLOR_RGB2BGR'),false);
  assert.equal(grade.check({type:'blank',answer:'cv2.FILLED',accepted:['-1']},'-1'),true);
});
for(const q of data.questions)test(`grading declared answers for ${q.id}`,()=>{
  const actual=q.type==='choice'?String(q.choices.indexOf(q.answer)):q.answer;
  assert.equal(grade.check(q,actual),true);
  for(const answer of q.type==='choice'?[]:(q.accepted||[]))assert.equal(grade.check(q,answer),true);
  assert.equal(grade.check(q,''),false);assert.equal(grade.check(q,'__not_a_valid_answer__'),false);
});

const qid=data.questions[0]?.id,cid=data.concepts[0]?.id;
assert.ok(qid&&cid,'Study data must contain questions and concepts');
const empty=()=>({records:{},read:[],bookmarks:[],qBookmarks:[],exerciseRead:[],exams:[],days:[]});
const validRecord=()=>({correct:false,answer:'my answer',attempts:2,wrongAttempts:1,date:123456,assisted:false});
test('progress roundtrip retains learning and removes unknown fields',()=>{
  const p=empty();p.records[qid]=validRecord();p.read=[cid,cid,'removed-concept'];p.bookmarks=[cid];p.qBookmarks=[qid,qid,'removed-question'];p.exerciseRead=[1,1,3,16];p.days=['2026-10-20','2026-10-20'];p.exams=[{date:123,total:10,autoTotal:8,correct:5,untrusted:'ignored'}];p.extra='<script>ignored</script>';
  const before=JSON.stringify(p),out=validate(p,data);
  assert.equal(JSON.stringify(p),before,'validation must not mutate input');assert.deepEqual(plain(out.records[qid]),validRecord());assert.deepEqual(plain(out.read),[cid]);assert.deepEqual(plain(out.qBookmarks),[qid]);assert.deepEqual(plain(out.exerciseRead),[1,16]);assert.deepEqual(plain(out.days),['2026-10-20']);assert.equal(out.extra,undefined);assert.equal(out.exams[0].untrusted,undefined);
});
test('stale question records are dropped',()=>{const p=empty();p.records['removed-question']=validRecord();assert.deepEqual(plain(validate(p,data).records),{});});
test('only the latest thirty exams are retained',()=>{const p=empty();p.exams=Array.from({length:35},(_,i)=>({date:i,total:10,autoTotal:8,correct:5}));const out=validate(p,data);assert.equal(out.exams.length,30);assert.equal(out.exams[0].date,5);assert.equal(out.exams.at(-1).date,34);});
const badCases=[
  ['null progress',()=>null],
  ['null record map',()=>({...empty(),records:null})],
  ['non-array IDs',()=>({...empty(),read:null})],
  ['object in ID list',()=>({...empty(),bookmarks:[{}]})],
  ['string exercise number',()=>({...empty(),exerciseRead:['1']})],
  ['invalid date string',()=>({...empty(),days:['not-a-date']})],
  ['null exam row',()=>({...empty(),exams:[null]})],
  ['HTML exam score',()=>({...empty(),exams:[{date:1,total:'<img src=x>',autoTotal:1,correct:1}]})],
  ['impossible exam score',()=>({...empty(),exams:[{date:1,total:2,autoTotal:1,correct:2}]})],
  ['negative exam date',()=>({...empty(),exams:[{date:-1,total:2,autoTotal:1,correct:1}]})],
  ['non-boolean correctness',()=>({...empty(),records:{[qid]:{...validRecord(),correct:'false'}}})],
  ['zero attempts',()=>({...empty(),records:{[qid]:{...validRecord(),attempts:0}}})],
  ['too many wrong attempts',()=>({...empty(),records:{[qid]:{...validRecord(),wrongAttempts:3}}})],
  ['nonfinite record date',()=>({...empty(),records:{[qid]:{...validRecord(),date:Infinity}}})],
  ['non-string answer',()=>({...empty(),records:{[qid]:{...validRecord(),answer:{}}}})]
];
for(const [name,make] of badCases)test(`reject progress: ${name}`,()=>assert.throws(()=>validate(make(),data)));

try{
  const publicFiles=await readdir(path.join(root,'dist'),{recursive:true});
  test('deployment excludes original documents',()=>assert.ok(!publicFiles.some(file=>/\.(?:pdf|pptx|docx)$/i.test(file))));
  const bundle=await read('dist/data.js');
  test('deployment has no submitted-student identity',()=>assert.ok(!/\d{7}[가-힣]{2,5}_과제/.test(bundle)));
}catch(error){if(error.code!=='ENOENT')throw error;}

console.log(`Passed ${checks} checks: ${data.concepts.length} concepts, ${data.questions.length} questions, ${data.exercises.length} exercises, ${sources.length} sources.`);
