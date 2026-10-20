/* Validate both imported and previously stored progress before rendering it. */
(() => {
function validate(p,data){
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const integer=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
  if(!object(p)||!object(p.records))throw Error('Invalid progress');
  for(const k of ['read','bookmarks','qBookmarks','exerciseRead','exams','days'])if(!Array.isArray(p[k])||p[k].length>100000)throw Error('Invalid list');
  const qids=new Set(data.questions.map(q=>q.id)),cids=new Set(data.concepts.map(c=>c.id));
  const out={records:{},read:[],bookmarks:[],qBookmarks:[],exerciseRead:[],exams:[],days:[]};
  for(const [id,r] of Object.entries(p.records)){
    if(!object(r)||typeof r.correct!=='boolean'||!Number.isFinite(r.date)||r.date<0||typeof r.answer!=='string'||r.answer.length>20000||!integer(r.attempts,1,1e9)||!integer(r.wrongAttempts,0,r.attempts))throw Error('Invalid answer record');
    if(qids.has(id))out.records[id]={correct:r.correct,answer:r.answer,date:r.date,attempts:r.attempts,wrongAttempts:r.wrongAttempts,assisted:!!r.assisted};
  }
  for(const k of ['read','bookmarks','qBookmarks']){
    if(!p[k].every(x=>typeof x==='string'))throw Error('Invalid IDs');
    out[k]=[...new Set(p[k])].filter(x=>(k==='qBookmarks'?qids:cids).has(x));
  }
  if(!p.exerciseRead.every(n=>integer(n,1,100)))throw Error('Invalid exercise IDs');
  out.exerciseRead=[...new Set(p.exerciseRead)].filter(n=>[1,2,5,6,9,10,13,16].includes(n));
  for(const e of p.exams){if(!object(e)||!Number.isFinite(e.date)||e.date<0||!integer(e.total,1,10000)||!integer(e.autoTotal,0,e.total)||!integer(e.correct,0,e.autoTotal))throw Error('Invalid exam');out.exams.push({date:e.date,total:e.total,autoTotal:e.autoTotal,correct:e.correct});}
  out.exams=out.exams.slice(-30);
  if(!p.days.every(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)))throw Error('Invalid dates');
  out.days=[...new Set(p.days)];return out;
}
globalThis.CV_PROGRESS={validate};
})();
