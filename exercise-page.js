/* A fixed eight-problem syllabus, with complete tasks before their focused drills. */
(() => {
  'use strict';
  const order = [1, 2, 5, 6, 9, 10, 13, 16];
  function create({ data: D, progress, esc, rich, source, code, codeWithNotes }) {
    const lesson = number => D.exercises.find(e => e.number === number);
    const questions = number => D.questions.filter(q => q.tags?.includes('4장집중연습') && q.exerciseNumbers?.includes(number));
    const kind = { short: '직접 설명·작성', blank: '코드 빈칸', output: '결과 예측', choice: '개념 확인' };
    function navigation(selected) {
      return `<nav class="exercise-syllabus" aria-label="4장 지정 8문제">${order.map(n => `<a class="${selected === n ? 'active' : ''}" href="#exercises/${n}" ${selected === n ? 'aria-current="page"' : ''}>${n}번 <span>${n === 1 ? '콜백' : n === 2 ? '창 옵션' : n === 5 ? '실행 결과' : n === 6 ? '영상·창 크기' : n === 9 ? '사각형' : n === 10 ? '마우스' : n === 13 ? '저장' : '카메라·ROI'}</span></a>`).join('')}</nav>`;
    }
    function overview() {
      const completed = progress().exerciseRead || [];
      return `<div class="exercise-hub-heading"><div><div class="eyebrow">CHAPTER 04 / EXERCISES</div><h1>4장 연습문제</h1><p>PDF의 지정 8문제를 빠짐없이 공부합니다. 정상 코드와 실행 결과를 연결하고, 빈칸과 결과 문제로 다시 떠올려 보세요.</p></div><span class="tag orange">1 · 2 · 5 · 6 · 9 · 10 · 13 · 16</span></div>
        <div class="exercise-study-flow"><span><b>1</b> 전체 문제 읽기</span><i>→</i><span><b>2</b> 결과를 보고 이해하기</span><i>→</i><span><b>3</b> 코드 옆 주석 읽기</span><i>→</i><span><b>4</b> 직접 풀고 복습하기</span></div>
        <div class="exercise-hub-actions"><a class="btn" href="#practice/exercise-originals">원문 8문제 풀기 →</a><a class="btn secondary" href="#practice/exercise-all">추가 연습까지 ${order.reduce((sum,n)=>sum+questions(n).length,0)}문제 풀기 →</a><span>${completed.filter(n=>order.includes(n)).length}/8 학습 완료</span></div>
        <div class="exercise-lesson-grid">${order.map(n => { const e=lesson(n); if(!e)return ''; const set=questions(n); return `<article class="exercise-lesson-card"><div class="exercise-card-top"><span class="exercise-card-number">${n}</span><span class="tag ${completed.includes(n)?'':'gray'}">${completed.includes(n)?'✓ 학습 완료':'원문 + 연습 '+set.filter(q=>!q.exercisePrimary).length+'개'}</span></div><h2>${esc(e.title)}</h2><p>${esc(e.overview||e.prompt)}</p><div class="exercise-card-actions"><a class="btn small" href="#exercises/${n}">${completed.includes(n)?'다시 공부하기':'공부 시작'} →</a><a class="text-link" href="#practice/exercise-${n}">문제 풀기 ↗</a></div></article>`; }).join('')}</div>
        <p class="exercise-resource-note">출처 · 4장 연습문제 PDF · 지정 8문항. 도형·창 화면은 코드의 수치로 그린 미리보기이며, 사진·카메라 예시는 학습용 합성 화면으로 구분합니다.</p>`;
    }
    function detail(e) {
      const set=questions(e.number), primary=set.find(q=>q.exercisePrimary), extras=set.filter(q=>!q.exercisePrimary);
      const index=order.indexOf(e.number), next=order[index+1];
      const steps=e.memorySteps||e.walkthrough||[];
      const checks=e.mentalCheck||[];
      const fullCode=e.solutionCode||e.originalCode;
      return `<a class="back-link" href="#exercises">← 4장 연습문제 8개 전체 보기</a>${navigation(e.number)}
      <article class="article exercise-article exercise-lesson"><header class="exercise-lesson-heading"><span class="tag orange">연습문제 ${e.number}번</span><h1>${esc(e.title)}</h1>${source(e.source)}</header>
      <section class="exercise-task"><h2>문제</h2><div class="question-prompt">${rich(e.prompt)}</div>${e.number===5&&fullCode?`<details class="exercise-prediction"><summary>코드만 보고 먼저 결과 예상하기</summary>${code(fullCode,'정상 코드 · 연습문제 5번')}</details>`:''}<a class="text-link" href="#practice/${primary?.id||'exercise-'+e.number}">${e.number===5?'코드의 결과를 직접 적어 보기':'풀이를 보기 전에 직접 답해 보기'} →</a></section>
      ${globalThis.CV_EXERCISE_VISUALS.render(e)}
      ${e.resultFacts?.length?`<dl class="exercise-result-facts">${e.resultFacts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${rich(f.value)}</dd></div>`).join('')}</dl>`:''}
      <section class="exercise-answer"><h2>왜 이렇게 될까요?</h2><div class="prose">${rich(e.modelAnswer)}</div>${e.walkthrough?.length?`<ol class="exercise-walkthrough">${e.walkthrough.map(s=>`<li>${rich(s)}</li>`).join('')}</ol>`:''}</section>
      ${fullCode?`<section class="exercise-normal-code"><h2>정상 코드와 줄별 풀이</h2><p class="small-note">코드를 읽으며 옆 주석에서 함수·인수·값의 뜻을 함께 확인하세요.</p>${e.inputResources?.length?`<details class="exercise-preparation"><summary>실행할 때 준비할 것</summary><ul class="bullet-list">${e.inputResources.map(s=>`<li>${rich(s)}</li>`).join('')}</ul></details>`:''}${codeWithNotes(fullCode,e.codeExplanation,'정상 코드 · 연습문제 '+e.number)}</section>`:''}
      <section class="exercise-memory"><h2>이 순서로 떠올려 보세요</h2><ol>${steps.map((s,i)=>`<li><span>${i+1}</span><div>${rich(s)}</div></li>`).join('')}</ol></section>
      ${checks.length?`<section class="exercise-mental-check"><h2>잠깐 가리고 답해 보기</h2>${checks.map(c=>`<details><summary>${esc(c.question||c.prompt)}</summary><div class="prose">${rich(c.answer)}</div></details>`).join('')}</section>`:''}
      ${e.pitfalls?.length?`<section class="callout warning"><h3>시험에서 헷갈리는 부분</h3><ul class="bullet-list">${e.pitfalls.map(s=>`<li>${rich(s)}</li>`).join('')}</ul></section>`:''}
      <section class="exercise-drills"><div class="section-heading"><h2>이 문제로 연습하기</h2><a class="text-link" href="#practice/exercise-${e.number}">원문부터 ${set.length}문제 차례로 풀기 →</a></div><div class="exercise-drill-list">${set.map(q=>`<a href="#practice/${q.id}"><span class="tag ${q.exercisePrimary?'orange':'gray'}">${q.exercisePrimary?'원문 전체 문제':kind[q.type]}</span><strong>${esc(q.title)}</strong><span aria-hidden="true">→</span></a>`).join('')}</div></section>
      <div class="exercise-bottom-actions"><button class="btn secondary" data-exread="${e.number}">${progress().exerciseRead.includes(e.number)?'✓ 학습 완료':'이 문제 학습 완료'}</button><a class="btn" href="#practice/exercise-${e.number}">직접 풀어 보기 →</a>${next?`<a class="text-link" href="#exercises/${next}">다음 ${next}번 공부하기 →</a>`:'<a class="text-link" href="#exercises">8문제 전체로 돌아가기 →</a>'}</div></article>`;
    }
    return { overview, detail, order };
  }
  globalThis.CV_EXERCISE_PAGE = { create };
})();
