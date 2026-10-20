/* Rapid recall using complete source programs and the normal answer checker. */
(() => {
  'use strict';
  const syllabus = [
    [1, '콜백 함수', '`setMouseCallback(창, onMouse)`', '함수 이름을 등록 → 클릭 발생 → 시스템이 호출. `onMouse()`처럼 괄호를 붙이지 않습니다.'],
    [2, '창 옵션', '`WINDOW_NORMAL` / `WINDOW_AUTOSIZE`', 'NORMAL은 창 크기 조절 가능. AUTOSIZE는 영상 크기에 맞춤. 두 창의 원본 `image.shape`는 같습니다.'],
    [5, '회색 창·도형', '`image[:] = 100` / `-1, LINE_4, 1`', '회색: 가로 400·세로 300. 도형: 흰 바탕 600×400. 사각형의 shift=1은 (100,150)~(150,200)으로 좌표를 반으로 만듭니다.'],
    [6, '영상과 창 크기', '`(300, 400)` / `resizeWindow(..., 600, 500)`', '배열은 높이·너비, 창 함수는 너비·높이. 창을 키워도 배열은 `(300, 400)`입니다.'],
    [9, '빨간 사각형', '`(600, 400, 3)` / `(0, 0, 255)` / `-1`', '세로 600·가로 400의 검정 영상. (100,100)~(300,400)에 빨간 채움 사각형을 그립니다.'],
    [10, '마우스 그리기', '`RBUTTONDOWN` → `20` / `LBUTTONDOWN` → `(x+30, y+30)`', '오른쪽: 초록 원, 반지름 20. 왼쪽: 빨간 사각형, 좌표 차이 30×30. 두께는 둘 다 2입니다.'],
    [13, '최고 화질 저장', '`IMWRITE_JPEG_QUALITY, 100` / `IMWRITE_PNG_COMPRESSION, 0`', '`test.jpg`와 `test.png`를 저장합니다. JPEG 100도 손실 가능. PNG는 압축 수준과 관계없이 무손실입니다.'],
    [16, '카메라·ROI', '`VideoCapture(0)` / `[y:y+h, x:x+w]` / `cv2.add`', 'ROI는 `(200, 100, 3)`. G는 채널 1. 230+50은 255에서 멈춤. 빨간 테두리는 두께 3입니다.']
  ];
  function create({ data: D, esc, rich, code, codeWithNotes, source, grade, progress, record }) {
    const content = D.cram;
    const questionMap = new Map(D.questions.map(q => [q.id, q]));
    const cardMap = new Map(content.cards.map(c => [c.questionId, c]));
    const controllers = new WeakMap();
    let mode = '', pool = [], index = 0, answer = '', feedback = null, assisted = false, listType = 'all', listPriority = 'all';
    const selected = content.cards.map(c => questionMap.get(c.questionId)).filter(Boolean);
    const priorityName = p => ({ 1: '1순위 · 지정 연습', 2: '2순위 · 수업 핵심', 3: '3순위 · 추가 확인' }[p]);
    const typeName = q => q.type === 'blank' ? '빈칸' : '출력·결과';
    const wrong = () => selected.filter(q => progress().records[q.id]?.correct === false);
    function buildPool(selection) {
      if (selection === 'blanks') return selected.filter(q => q.type === 'blank');
      if (selection === 'outputs') return selected.filter(q => q.type === 'output');
      if (selection === 'wrong') return wrong();
      if (questionMap.has(selection) && cardMap.has(selection)) return [questionMap.get(selection)];
      return [...selected];
    }
    function header(section = '') {
      const done = selected.filter(q => progress().records[q.id]?.correct).length;
      return `<div class="cram-heading"><div><div class="eyebrow">CODE RECALL / CHAPTER 04</div><h1>빈칸·출력 찍기 신공</h1><p>지정 8문제와 수업 원본 코드에서 나올 만한 빈칸·결과를 골랐습니다.<br>어디를 보고 답을 고르는지 익힌 뒤, 같은 코드로 바로 확인하세요.</p></div><span class="cram-progress">최근 정답 <b>${done} / ${selected.length}</b></span></div>
      <div class="cram-start"><a href="#cram/blanks"><span>함수·인수·상수</span><strong>빈칸 ${selected.filter(q=>q.type==='blank').length}문제 →</strong></a><a href="#cram/outputs"><span>배열·색·좌표·계산</span><strong>출력·결과 ${selected.filter(q=>q.type==='output').length}문제 →</strong></a><a href="#cram/mixed"><span>시험처럼 섞어서</span><strong>전체 ${selected.length}문제 →</strong></a><a href="#cram/wrong"><span>마지막 풀이에서 틀린 것</span><strong>오답 ${wrong().length}문제 →</strong></a></div>
      <nav class="cram-tabs" aria-label="찍기 신공 메뉴"><a href="#cram" ${section==='guide'?'aria-current="page"':''}>핵심 공략표</a><a href="#cram/list" ${section==='list'?'aria-current="page"':''}>예상 문제 ${selected.length}개</a></nav>`;
    }
    function overview() {
      return `${header('guide')}<section class="cram-syllabus"><div class="section-heading"><h2>지정 8문제, 이것부터 떠올리세요</h2><a class="text-link" href="#exercises">자세한 풀이·결과 그림 ↗</a></div><div class="cram-table-wrap"><table><thead><tr><th>문제</th><th>빈칸으로 나오면</th><th>결과를 물으면</th></tr></thead><tbody>${syllabus.map(([n,title,blank,result])=>`<tr><th scope="row"><a href="#exercises/${n}">${n}번<small>${esc(title)}</small></a></th><td data-label="빈칸으로 나오면">${rich(blank)}</td><td data-label="결과를 물으면">${rich(result)}</td></tr>`).join('')}</tbody></table></div><p class="small-note">위 수치는 지정 연습문제 기준입니다. PPT 예제는 같은 함수라도 크기·밝기·좌표가 다를 수 있으니 제시된 코드의 숫자를 먼저 보세요.</p></section>
      <section class="cram-strategies"><div class="section-heading"><h2>모르면 이 순서로 추리하세요</h2><span class="small-note">필요한 항목만 펼치기</span></div><div class="cram-strategy-grid">${content.strategies.map((s,i)=>`<details><summary><span>${String(i+1).padStart(2,'0')}</span>${esc(s.title)}</summary><div class="cram-strategy-body"><p class="cram-cue">${rich(s.cue)}</p><p>${rich(s.rule)}</p><div class="cram-example">${rich(s.example)}</div><p class="cram-trap"><b>헷갈리기 쉬움</b> ${rich(s.trap)}</p><div class="flex">${s.questionIds.map(id=>questionMap.get(id)).filter(Boolean).slice(0,3).map(q=>`<a class="text-link" href="#${cardMap.has(q.id)?'cram':'practice'}/${q.id}">${typeName(q)}로 확인 ↗</a>`).join('')}</div></div></details>`).join('')}</div></section><div class="cram-guide-end"><a class="btn" href="#cram/list">예상 빈칸·결과 문제 고르기 →</a><span>선정 기준: 지정 연습문제 우선 → 수업 원본의 함수·인수·배열·실행 순서</span></div>`;
    }
    function listing() {
      const cards = content.cards.filter(c => (listType==='all'||questionMap.get(c.questionId).type===listType)&&(listPriority==='all'||c.priority===Number(listPriority)));
      return `${header('list')}<div class="cram-list-controls"><div role="group" aria-label="예상 문제 유형">${[['all','전체'],['blank','빈칸'],['output','출력·결과']].map(([v,t])=>`<button class="filter-chip ${v===listType?'active':''}" data-cram-action="list-type" data-value="${v}" aria-pressed="${v===listType}">${t}</button>`).join('')}</div><label>학습 순서 <select data-cram-priority aria-label="예상 문제 학습 순서"><option value="all">모든 순서</option>${[1,2,3].map(p=>`<option value="${p}" ${String(p)===listPriority?'selected':''}>${priorityName(p)}</option>`).join('')}</select></label><span>${cards.length}개 포인트</span></div><div class="cram-card-grid">${cards.map(c=>{const q=questionMap.get(c.questionId);const previous=progress().records[q.id];return `<article class="cram-card"><div class="cram-card-meta"><span class="tag ${c.priority===1?'orange':'gray'}">${priorityName(c.priority)}</span><span>${typeName(q)}${previous?previous.correct?' · ✓':' · 다시 확인':''}</span></div><h2>${esc(q.title)}</h2><p>${rich(c.likelyBlankOrOutput)}</p><div class="cram-card-source">${source(q.source)}</div><a class="btn secondary small" href="#cram/${q.id}">이 원본 코드로 풀기 →</a></article>`;}).join('')}</div>${!cards.length?'<p class="empty">선택한 조건의 문제가 없습니다. 유형이나 학습 순서를 바꿔 주세요.</p>':''}`;
    }
    function evaluate(question, input) {
      return String(input??'').trim() ? grade(question, String(input)) : null;
    }
    function questionView(state) {
      const q=state.pool[state.index];
      if(!q)return `<a class="back-link" href="#cram">← 공략표로</a><div class="panel cram-empty"><h1>복습할 오답이 없습니다</h1><p>빈칸이나 출력 문제를 풀면 틀린 문제를 여기에 모아 둡니다.</p><a class="btn" href="#cram/mixed">전체 원본 문제 풀기 →</a></div>`;
      const c=cardMap.get(q.id), result=state.feedback;
      return `<div class="cram-drill-top"><a class="back-link" href="#cram/list">← 예상 문제 목록</a><span>${state.index+1} / ${state.pool.length} · ${typeName(q)}</span></div><div class="cram-drill-progress" role="progressbar" aria-label="문제 위치" aria-valuemin="1" aria-valuemax="${state.pool.length}" aria-valuenow="${state.index+1}"><span style="width:${(state.index+1)/state.pool.length*100}%"></span></div>
      <article class="cram-question"><div class="cram-card-meta"><span class="tag orange">${priorityName(c.priority)}</span><span class="tag gray">원본 코드 · ${typeName(q)}</span></div><h1>${esc(q.title)}</h1><div class="question-prompt">${rich(q.prompt)}</div>${source(q.source)}
      ${code(q.code,q.codeLabel||'수업 원본 코드'+(q.type==='blank'?' · 빈칸 1곳만 가림':''))}
      <form class="cram-answer-form"><label for="cram-answer">${q.type==='blank'?'빈칸에 들어갈 코드':'예상 출력·결과'}</label><textarea id="cram-answer" name="answer" class="answer-input" spellcheck="false" ${result?'readonly':''} placeholder="${q.type==='blank'?'괄호·대소문자·인수 순서를 확인해서 적어 보세요.':'문제에서 지정한 조건으로 계산해 보세요.'}">${esc(state.answer)}</textarea><div class="cram-answer-actions"><button type="submit" class="btn" ${result?'disabled':''}>정답 확인 →</button><button type="button" class="btn ghost small" data-cram-action="hint" ${result?'disabled':''}>판단 힌트</button><button type="button" class="btn ghost small" data-cram-action="reveal" ${result?'disabled':''}>정답 먼저 보기</button></div><p class="cram-input-message" aria-live="polite">${esc(state.message||'')}</p></form>
      ${state.assisted&&!result?`<div class="hint-box">${rich(q.hint||c.recognize)}</div>`:''}
      ${result?`<section class="cram-feedback ${result.correct===false?'cram-incorrect':''}" aria-live="polite"><h2>${result.revealed?'정답을 보고 원리를 확인하세요':result.correct?'✓ 맞았어요. 답을 고르는 근거도 확인하세요.':'이 부분을 다시 확인하세요'}</h2>${result.revealed?'<p class="small-note">먼저 공개한 답은 정답 기록에 넣지 않습니다. 다시 풀기에서 직접 입력해 보세요.</p>':''}<div class="cram-answer-value"><span>정답</span><pre>${esc(q.answer)}</pre></div><div class="cram-reason"><b>어디를 봐야 하나요?</b><p>${rich(c.recognize)}</p><p>${rich(c.reason)}</p></div><div class="prose">${rich(q.explanation)}</div><p class="cram-trap"><b>이렇게 헷갈립니다</b> ${rich(c.trap)}</p>${codeWithNotes(globalThis.CV_CODE_NOTES.questionCode(q),q.codeExplanation)}${q.steps?.length?`<ol class="bullet-list">${q.steps.map(s=>`<li>${rich(s)}</li>`).join('')}</ol>`:''}<div class="cram-feedback-links">${(q.exerciseNumbers||[]).map(n=>`<a class="text-link" href="#exercises/${n}">${n}번 결과 그림·전체 풀이 ↗</a>`).join('')}<a class="text-link" href="#practice/${q.id}">기존 문제 풀이에서 열기 ↗</a></div></section>`:''}
      <div class="cram-drill-actions"><button class="btn secondary" data-cram-action="previous" ${state.index===0?'disabled':''}>← 이전</button>${result?'<button class="btn ghost" data-cram-action="retry">다시 풀기</button>':''}<button class="btn" data-cram-action="next">${state.index===state.pool.length-1?'회독 마치기 →':'다음 문제 →'}</button></div></article>`;
    }
    function mount(root, selection='') {
      controllers.get(root)?.abort();
      const controller = new AbortController();controllers.set(root,controller);
      mode=selection;pool=buildPool(selection);index=0;answer='';feedback=null;assisted=false;
      let message='';
      function draw(focus=false) {
        root.innerHTML=mode===''?overview():mode==='list'?listing():questionView({pool,index,answer,feedback,assisted,message});
        if(focus)root.querySelector('#cram-answer')?.focus();
      }
      function check(reveal=false) {
        if(feedback||!pool[index])return;
        const q=pool[index];
        if(reveal){feedback={correct:null,revealed:true};message='';}
        else {
          const correct=evaluate(q,answer);
          if(correct===null){message='먼저 답을 적어 보세요. 바로 보고 싶으면 ‘정답 먼저 보기’를 누르세요.';draw(true);return;}
          feedback={correct,revealed:false};message='';record(q,correct,answer,assisted);
        }
        draw();root.querySelector('.cram-feedback')?.scrollIntoView({behavior:'smooth',block:'start'});
      }
      root.addEventListener('input',event=>{if(event.target.id==='cram-answer')answer=event.target.value;},{signal:controller.signal});
      root.addEventListener('submit',event=>{if(!event.target.matches('.cram-answer-form'))return;event.preventDefault();check();},{signal:controller.signal});
      root.addEventListener('change',event=>{if(event.target.matches('[data-cram-priority]')){listPriority=event.target.value;draw();}},{signal:controller.signal});
      root.addEventListener('click',event=>{
        const button=event.target.closest('[data-cram-action]');if(!button)return;
        const action=button.dataset.cramAction;
        if(action==='restart-wrong'){event.preventDefault();if(location.hash==='#cram/wrong')mount(root,'wrong');else location.hash='#cram/wrong';return;}
        if(action==='list-type'){listType=button.dataset.value;draw();return;}
        if(action==='hint'){assisted=true;draw();return;}
        if(action==='reveal'){check(true);return;}
        if(action==='retry'){answer='';feedback=null;assisted=false;message='';draw(true);return;}
        if(action==='previous'&&index>0)index--;
        else if(action==='next'){
          if(index===pool.length-1){root.innerHTML=`<div class="panel cram-finish"><div class="eyebrow">RECALL COMPLETE</div><h1>이번 회독을 마쳤습니다</h1><p>직접 입력한 답은 기존 학습 기록과 오답 노트에 저장했습니다. 정답을 먼저 본 문제는 다시 입력하며 확인해 보세요.</p><div class="flex"><a class="btn" href="#cram/wrong" data-cram-action="restart-wrong">오답 ${wrong().length}개 다시 풀기 →</a><a class="btn secondary" href="#cram">공략표로 돌아가기</a></div></div>`;window.scrollTo(0,0);return;}
          index++;
        } else return;
        answer='';feedback=null;assisted=false;message='';draw();window.scrollTo(0,0);
      },{signal:controller.signal});
      draw();
    }
    return {overview,listing,questionView,buildPool,evaluate,mount,selected};
  }
  globalThis.CV_CRAM={create};
})();
