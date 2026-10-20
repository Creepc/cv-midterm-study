import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parts=await Promise.all(['theory','practice'].map(async name=>JSON.parse(await readFile(path.join(root,'data',name+'.json'),'utf8'))));
const data={concepts:parts.flatMap(p=>p.concepts||[]),questions:parts.flatMap(p=>p.questions||[]),exercises:parts.flatMap(p=>p.exercises||[]),sources:JSON.parse(await readFile(path.join(root,'data/sources.json'),'utf8')),weeks:JSON.parse(await readFile(path.join(root,'data/weekly.json'),'utf8')).weeks,audit:JSON.parse(await readFile(path.join(root,'data/audit.json'),'utf8'))};
// Original lecture files and the student's submitted PDF are never copied to the public site.
const serialized=JSON.stringify(data).replace(/\d{7}[^/]*?_과제\(4장연습문제\)\.pdf/g,'4장 연습문제.pdf');
await mkdir(path.join(root,'dist'),{recursive:true});
for(const file of ['index.html','style.css','study.css','annotated-code.css','app.js','study-views.js','code-notes.js','grading.js','progress.js','favicon.svg']) await copyFile(path.join(root,file),path.join(root,'dist',file));
await writeFile(path.join(root,'dist/data.js'),'window.CV_DATA='+serialized+';\n','utf8');
// A new content hash prevents old cached scripts from mixing with revised answers.
let html=await readFile(path.join(root,'index.html'),'utf8');
for(const name of ['style.css','study.css','annotated-code.css','app.js','study-views.js','code-notes.js','grading.js','progress.js','favicon.svg','data.js']){
  const bytes=await readFile(path.join(root,'dist',name));
  const revision=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  html=html.replaceAll(`./${name}"`,`./${name}?v=${revision}"`);
}
await writeFile(path.join(root,'dist/index.html'),html,'utf8');
await writeFile(path.join(root,'dist/.nojekyll'),'');
console.log(`Built ${data.concepts.length} concepts, ${data.questions.length} questions, ${data.exercises.length} exercises, ${data.sources.length} sources.`);
