/* Study navigation: weekly essentials first, lecture notes and sources separately. */
(() => {
  function create({data:D,progress,esc,rich,list,code,source,heading,empty}) {
    const weeks=()=>D.weeks||[];
    const concept=id=>D.concepts.find(c=>c.id===id);
    const question=id=>D.questions.find(q=>q.id===id);
    const material=id=>D.sources.find(s=>s.id===id);
    const lectureOf=c=>c.lectureSourceId||D.sources.find(s=>s.file===c.source.file&&s.kind==='lecture')?.id;
    const itemCount=()=>weeks().reduce((sum,w)=>sum+w.items.length,0);
    const originalIds=w=>w.items.map(i=>i.primaryQuestionId).filter(question);
    const weekLink=w=>`#concepts/${w.id}`;
    function weekCards(){return weeks().map(w=>`<a class="week-overview" href="${weekLink(w)}"><div class="week-card-head"><span class="week-number">${w.week}<small>주차</small></span><span class="tag gray">진단 ${w.items.length}항목</span></div><h3>${esc(w.title.replace(/^\d+주차\s*[·:]\s*/,''))}</h3><p>${esc(w.summary)}</p><div class="week-topics">${w.items.map(i=>`<span>${esc(i.title)}</span>`).join('')}</div><span class="week-go">핵심 개념 보기 <b>↗</b></span></a>`).join('');}
    function home(){const s=progress(),done=Object.keys(s.records).filter(question).length;return `${heading('EXAM STUDY MAP','먼저, 주별 학습진단부터.','꼭 볼 개념을 먼저 모았습니다. 강의자료 전체 정리는 별도 메뉴에서 확인하세요.',`<span class="tag orange">우선 학습</span>`)}
      <section class="study-intro"><div><strong>① 주별 핵심 개념</strong><span>→</span><strong>② 진단 원문 풀기</strong><span>→</span><strong>③ 변형·오답 복습</strong></div><a class="btn small" href="#concepts">핵심 ${itemCount()}항목 한 번에 보기 →</a></section>
      <section class="primary-study"><div class="section-heading"><h2>이론 · 주별 학습진단 핵심</h2><a href="#concepts">전체 요약 ↗</a></div><div class="week-overview-grid">${weekCards()}</div></section>
      <section class="focus-strip"><div><span class="tag orange">실습 우선</span><h2>4장 지정 연습문제</h2><p>개념 설명 → 코드 → 출력·주의점까지</p></div><div class="priority-list">${[1,2,5,6,9,10,13,16].map(n=>`<a class="number-link" href="#exercises/${n}" aria-label="4장 ${n}번 연습문제">${n}</a>`).join('')}</div><a class="btn small" href="#exercises">집중 학습 →</a><a class="btn secondary small" href="#practice/ch04-original">원본 코드 문제 →</a></section>
      <div class="study-separate"><a class="compact-destination" href="#materials"><span>▤</span><div><h3>강의자료 전체 정리</h3><p>PPT 4개를 자료별로 분리했습니다. 더 자세한 원리와 추가 범위는 여기에서 보세요.</p></div><b>↗</b></a><a class="compact-destination" href="#sources"><span>ⓘ</span><div><h3>원본 자료와 검토 내역</h3><p>자료 목차, 연결된 정리, 원본 대조 결과와 바로잡은 내용을 확인하세요.</p></div><b>↗</b></a></div>
      <div class="study-status"><span>나의 기록</span><strong>${done}</strong>문제 풀이<span class="status-divider">·</span><strong>${Object.values(s.records).filter(r=>!r.correct).length}</strong>오답<span class="status-divider">·</span><strong>${s.exerciseRead.length}/8</strong>지정 문제 학습<a href="#review">오답 복습 →</a><a href="#exam">모의고사 →</a></div>`;}
    function weekly(selected=''){
      const active=weeks().find(w=>w.id===selected),visible=active?[active]:weeks();
      return `${heading('PRIORITY 01 / WEEKLY ESSENTIALS','주별 핵심 개념','학습진단 원문에 필요한 개념만 먼저 정리했습니다. 각 항목의 요약은 바로 보이고, 자세한 내용은 펼칠 수 있습니다.')}
      <div class="study-tabs" aria-label="학습 주차"><a class="${active?'':'active'}" href="#concepts">전체 ${itemCount()}항목</a>${weeks().map(w=>`<a class="${active?.id===w.id?'active':''}" href="${weekLink(w)}">${w.week}주차 <small>${w.items.length}</small></a>`).join('')}<a class="secondary-tab" href="#materials">강의자료 전체 ↗</a></div>
      <div class="weekly-toolbar"><p>요약부터 읽고 → 설명을 펼쳐 확인 → 원문을 풀어 보세요.</p><div><button class="btn ghost small" data-week-expand="yes">설명 모두 펼치기</button><button class="btn ghost small" data-week-expand="no">요약만 보기</button></div></div>
      ${visible.map(w=>`<section class="weekly-section" id="${w.id}"><div class="weekly-section-head"><div><span class="eyebrow">WEEK ${String(w.week).padStart(2,'0')}</span><h2>${esc(w.title.replace(/^\d+주차\s*[·:]\s*/,''))}</h2><p>${esc(w.summary)}</p></div><a class="btn secondary small" href="#practice/week-${w.id}">${w.week}주차 원문 ${originalIds(w).length}문항 풀기 →</a></div>${w.referenceConceptIds?.length?`<div class="weekly-code-references"><div><strong>문제에 나온 교재 코드</strong><span>전체 코드와 옆 주석으로 실행 과정을 확인하세요.</span></div><div>${w.referenceConceptIds.filter(concept).map(id=>`<a class="btn secondary small" href="#concept/${id}">${esc(concept(id).referenceLabel||concept(id).title)} →</a>`).join('')}</div></div>`:''}<div class="weekly-items">${w.items.map(i=>`<details class="weekly-item" id="${i.id}"><summary><span class="item-number">${String(i.number).padStart(2,'0')}</span><div class="weekly-item-summary"><h3>${esc(i.title)}</h3><div>${rich(i.definition)}</div></div><span class="item-toggle" aria-hidden="true"></span></summary><div class="weekly-item-content"><h4>쉽게 이해하기</h4>${list(i.keyPoints)}${renderGuide(i.learningGuide,i.guideConfig)}${i.example&&!i.learningGuide?`<div class="worked-example"><h4>예시로 따라가기</h4><div class="prose">${rich(i.example)}</div></div>`:''}${i.pitfalls?.length?`<div class="weekly-pitfalls"><h4>헷갈리지 않기</h4>${list(i.pitfalls)}</div>`:''}${extraDetails(i.details)}<div class="weekly-connections">${i.learningGuide?'<a class="btn secondary small" href="#lab/quantization">숫자를 바꿔 계산 연습 →</a>':''}${[i.primaryQuestionId].filter(question).map(id=>`<a class="btn small" href="#practice/${id}">원문 ${i.number}번 풀기 →</a>`).join('')}${i.questionIds.some(id=>question(id)&&!question(id).tags.includes('원문'))?`<a class="btn secondary small" href="#practice/item-${i.id}">연결 변형 문제 →</a>`:''}${i.conceptIds.filter(concept).map(id=>`<a class="text-link" href="#concept/${id}">${esc(concept(id).title)} 자세히 ↗</a>`).join('')}</div>${source(i.source)}</div></details>`).join('')}</div><details class="weekly-checklist"><summary>${w.week}주차 공부 후 스스로 점검하기</summary>${list(w.checklist)}</details></section>`).join('')}`;
    }
    function noteRow(c){const s=progress();return `<a class="material-note" href="#concept/${c.id}"><span class="note-read ${s.read.includes(c.id)?'done':''}" aria-label="${s.read.includes(c.id)?'읽음':'미학습'}">${s.read.includes(c.id)?'✓':'○'}</span><div><h4>${esc(c.title)} ${s.bookmarks.includes(c.id)?'<span class="bookmark-star">★</span>':''}</h4><p>${esc(c.summary)}</p></div><b>→</b></a>`;}
    function materials(selected=''){
      const saved=selected==='saved',lectures=D.sources.filter(s=>s.kind==='lecture'),active=lectures.find(s=>s.id===selected);
      const notes=saved?D.concepts.filter(c=>progress().bookmarks.includes(c.id)):D.concepts;
      return `${heading('REFERENCE / LECTURE NOTES','강의자료 전체 정리','PPT별로 내용을 묶었습니다. 시험 우선 개념은 ‘주별 핵심 개념’에서 먼저 공부하세요.')}
      <div class="study-tabs"><a class="${!active&&!saved?'active':''}" href="#materials">자료 4개</a>${lectures.map(s=>`<a class="${active?.id===s.id?'active':''}" href="#materials/${s.id}">${esc(s.id==='ch04'?'실습 4장':s.id==='theory2a'?'이론 2장 ①':s.id==='theory2b'?'이론 2장 ②':'이론 3장')}</a>`).join('')}<a class="${saved?'active':''}" href="#materials/saved">★ 북마크</a></div>
      ${saved?`<div class="panel">${notes.length?notes.map(noteRow).join(''):empty('북마크한 개념이 없어요.','개념 상세 설명의 ☆ 버튼으로 저장할 수 있습니다.')}</div>`:(active?[active]:lectures).map(s=>{const group=notes.filter(c=>lectureOf(c)===s.id),audit=D.audit?.sources.find(a=>a.sourceId===s.id);return `<details class="material-folder" ${active?'open':''}><summary><span class="document-icon">${s.id==='ch04'?'PY':'PPT'}</span><div><h2>${esc(s.title)}</h2><p>${s.pages}슬라이드 · ${group.length}개 개념 정리</p></div><span class="folder-arrow" aria-hidden="true">＋</span></summary><div class="material-folder-body"><div class="material-scope"><h3>자료의 구성</h3>${list(s.coverage)}</div><div class="material-notes">${group.map(noteRow).join('')}</div><div class="material-folder-footer"><a class="text-link" href="#practice/source-${s.id}">이 자료의 문제 풀기 →</a><a class="text-link" href="#sources/${s.id}">자료 정보${audit?'·대조 내역':''} ↗</a></div></div></details>`;}).join('')}
      ${!saved&&!active&&notes.some(c=>!lectureOf(c))?`<details class="material-folder"><summary><span class="document-icon">NOTE</span><div><h2>학습진단 추가 설명</h2><p>원문 풀이를 더 자세히 설명한 노트</p></div><span class="folder-arrow">＋</span></summary><div class="material-folder-body">${notes.filter(c=>!lectureOf(c)).map(noteRow).join('')}</div></details>`:''}
      <div class="quiet-callout"><a href="#concepts">주별 핵심 개념으로 돌아가기 →</a><span>강의자료는 보충 학습용으로 자료별 구분했습니다.</span></div>`;
    }
    function sources(selected=''){
      const active=D.sources.find(s=>s.id===selected),auditMode=selected==='audit';
      let body='';
      if(auditMode)body=auditView();
      else if(active)body=sourceDetail(active);
      else body=[['diagnostic','주별 학습진단문제','문제의 핵심 개념과 원문 풀이를 먼저 확인하세요.'],['lecture','강의자료 PPT','자료별 목차와 전체 정리를 따로 모았습니다.'],['exercise','4장 지정 연습문제','지정 8문항의 상세 풀이를 확인하세요.'],['textbook','7주차 추가 교재 코드','제공한 교재 이미지의 코드와 줄별 해설을 확인하세요.']].map(([kind,title,desc])=>`<section class="resource-section"><h2>${title}</h2><p>${desc}</p><div class="resource-list">${D.sources.filter(s=>s.kind===kind).map(s=>`<a class="resource-row" href="#sources/${s.id}"><span class="document-icon">${kind==='textbook'?'PY':kind==='lecture'?'PPT':s.id==='week4'?'DOCX':'PDF'}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.coverage.slice(0,2).join(' · '))}</p></div><span>${s.id==='week4'?'5문항':s.pages+(kind==='lecture'?'장':kind==='textbook'?'개 이미지':'쪽')}</span><b>→</b></a>`).join('')}</div></section>`).join('');
      return `${heading('RESOURCES & VERIFICATION','원본 자료 · 검토 내역','원본의 목차와 연결된 학습 내용을 정리하고, 대조 과정에서 보완한 내용을 기록했습니다.')}
      <div class="study-tabs"><a class="${!auditMode?'active':''}" href="#sources">원본 자료 ${D.sources.length}개</a><a class="${auditMode?'active':''}" href="#sources/audit">원본 대조·정정 내역</a></div>${active?'<a class="back-link" href="#sources">← 자료 목록</a>':''}${body}
      <details class="settings-details"><summary>학습 기록 관리·사이트 이용 안내</summary><div><p class="small-note">출처의 파일명은 자료 식별용입니다. 원본 PPT·PDF·DOCX는 사이트에 공개하지 않았으며, 내용은 학습용으로 다시 정리했습니다. 학번과 이름은 제외했습니다. 교수님의 구두 강조 내용은 별도 기록이 없어 확정할 수 없습니다.</p><p class="small-note">학습 기록은 현재 기기·브라우저에 저장됩니다. 다른 기기로 옮기려면 JSON을 내보낸 후 가져오세요. 진행 중인 모의고사는 내보내기에 포함하지 않습니다.</p><div class="data-tools"><button class="btn secondary small" data-export>기록 내보내기 ↓</button><label class="btn ghost small" for="import-file" style="cursor:pointer">기록 가져오기 ↑</label><input type="file" id="import-file" accept="application/json,.json" hidden><button class="btn ghost small" data-reset>기록 초기화</button></div></div></details>`;
    }
    function sourceDetail(s){const w=weeks().find(w=>w.sourceId===s.id),audit=D.audit?.sources.find(a=>a.sourceId===s.id);return `<article class="article"><span class="tag">${s.kind==='textbook'?'추가 교재 코드':s.kind==='lecture'?'강의자료':s.kind==='diagnostic'?'학습진단문제':'연습문제'}</span><h1>${esc(s.title)}</h1><div class="source">${esc(s.file)} · ${s.pages}${s.kind==='textbook'?'개 이미지':s.kind==='lecture'?'슬라이드':s.id==='week4'?'개 추출 단위':'쪽'}</div><section><h2>원본 구성과 학습 내용</h2>${list(s.coverage)}</section><div class="flex">${s.kind==='textbook'?`${D.concepts.filter(c=>c.source.file===s.file).map(c=>`<a class="btn small" href="#concept/${c.id}">${esc(c.title)} →</a>`).join('')}<a class="btn secondary small" href="#practice/source-${s.id}">교재 코드 문제 풀기 →</a>`:w?`<a class="btn small" href="${weekLink(w)}">${w.week}주차 핵심 정리 →</a><a class="btn secondary small" href="#practice/week-${w.id}">진단 원문 풀기 →</a>`:s.kind==='lecture'?`<a class="btn small" href="#materials/${s.id}">이 PPT 정리 보기 →</a><a class="btn secondary small" href="#practice/source-${s.id}">연결 문제 풀기 →</a>`:'<a class="btn small" href="#exercises">지정 8문항 상세 풀이 →</a>'}</div>${audit?`<section class="callout"><h3>이번 대조에서 확인한 내용</h3><p class="prose">${rich(audit.coverage)}</p>${list(audit.checks)}${audit.corrections.length?`<h3 class="mt">보완·정정</h3>${list(audit.corrections)}`:''}${audit.limitations.length?`<p class="small-note mt">${audit.limitations.map(esc).join('<br>')}</p>`:''}</section>`:''}<details class="source-notes"><summary>자료를 읽을 때 주의할 점</summary>${list(s.notes)}</details></article>`;}
    function auditView(){const a=D.audit;if(!a)return empty('검토 기록을 준비 중입니다.','원본 자료 목록에서 학습 내용을 볼 수 있습니다.');return `<div class="audit-summary"><span class="tag">${esc(a.reviewedAt)} 검토</span><h2>원본과 개념·문항·해설을 대조했습니다.</h2><p>${rich(a.summary)}</p><div class="audit-numbers"><span><strong>${a.sources.length}</strong>개 원본</span><span><strong>${a.questionChecks.reviewed}</strong>문항 대조</span><span><strong>${a.findings.length}</strong>건 정정·설명 보완</span></div></div><div class="audit-findings">${a.findings.map(f=>`<details class="audit-finding"><summary><span class="tag ${f.status==='source-error'?'orange':'gray'}">${f.status==='corrected'?'수정':f.status==='source-error'?'원본 오류':'설명 보완'}</span><strong>${esc(f.title)}</strong><span class="audit-location">${esc(f.location)}</span></summary><div><p class="prose">${rich(f.detail)}</p><div class="worked-example"><h4>확인·보완 내용</h4><div class="prose">${rich(f.correction)}</div></div><div class="flex mt">${(f.questionIds||[]).filter(question).map(id=>`<a class="text-link" href="#practice/${id}">${esc(question(id).title)} →</a>`).join('')}</div></div></details>`).join('')}</div><details class="audit-method"><summary>자료별 검토 범위와 검증 방법</summary>${a.sources.map(s=>`<div class="audit-source"><h3>${esc(material(s.sourceId)?.title||s.sourceId)}</h3><p class="prose">${rich(s.coverage)}</p>${list(s.checks)}${s.limitations.length?`<p class="small-note">${s.limitations.map(esc).join('<br>')}</p>`:''}</div>`).join('')}${list(a.questionChecks.notes)}</details>`;}
    function relatedConcepts(qid){const weeklyIds=weeks().flatMap(w=>w.items.filter(i=>i.questionIds.includes(qid)).flatMap(i=>i.conceptIds));const concepts=[...new Set([...weeklyIds,...D.concepts.filter(c=>c.relatedQuestionIds?.includes(qid)).map(c=>c.id)])].map(concept).filter(Boolean).slice(0,4);return concepts.length?`<div class="feedback-concepts"><h3>이 개념으로 다시 확인하기</h3><div>${concepts.map(c=>`<a href="#concept/${c.id}">${esc(c.title)} ↗</a>`).join('')}</div></div>`:'';}
    function extraDetails(details){return (details||[]).map(d=>`<details class="extra-explanation"><summary>${esc(d.title)}</summary><div class="prose">${rich(d.body)}</div></details>`).join('');}
    const fmt=n=>Number(n.toPrecision(11)).toString();
    function decimalParts(value){
      const match=String(value).trim().match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
      if(!match||!(match[2]||match[3])||(match[2]+(match[3]||'')).length>80)return null;
      const exponent=Number(match[4]||0)-(match[3]||'').length;
      if(Math.abs(exponent)>350)return null;
      return {integer:BigInt((match[1]==='-'?'-':'')+(match[2]||'0')+(match[3]||'')),exponent};
    }
    function quotientText(numerator,denominator){
      let remainder=numerator%denominator,out=String(numerator/denominator);
      if(!remainder)return out;
      out+='.';
      for(let i=0;i<10&&remainder;i++){remainder*=10n;out+=String(remainder/denominator);remainder%=denominator;}
      return out+(remainder?'…':'');
    }
    function quantize(value,{min=0,max=2,bits=3}={}){
      if([value,min,max,bits].some(v=>v===null||String(v).trim()===''))return null;
      const n=Number(value),lo=Number(min),hi=Number(max),b=Number(bits);
      if(![n,lo,hi,b].every(Number.isFinite)||hi<=lo||n<lo||n>hi||!Number.isInteger(b)||b<1||b>6)return null;
      const parts=[value,min,max].map(decimalParts);if(parts.some(p=>!p))return null;
      const exponent=Math.min(...parts.map(p=>p.exponent));
      const [x,a,z]=parts.map(p=>p.integer*10n**BigInt(p.exponent-exponent));
      if(z<=a||x<a||x>z)return null;
      const levels=2**b,width=(hi-lo)/levels;
      if(!Number.isFinite(width)||width<=0)return null;
      const numerator=(x-a)*BigInt(levels),denominator=z-a;
      const index=Math.min(levels-1,Number(numerator/denominator)),atBoundary=numerator%denominator===0n;
      const positionText=quotientText(numerator,denominator);
      let remaining=index;
      const binary=Array.from({length:b},(_,i)=>{
        const weight=2**(b-i-1),before=remaining,bit=before>=weight?1:0;
        if(bit)remaining-=weight;
        return {weight,before,bit,remaining};
      });
      return {value:n,valueText:String(value).trim(),atMax:x===z,min:lo,max:hi,bitCount:b,levels,width,index,atBoundary,positionText,bits:binary.map(s=>s.bit).join(''),from:lo+index*width,to:lo+(index+1)*width,binary};
    }
    const threeBit=value=>quantize(value);
    const rangeText=r=>`${fmt(r.from)} 이상 ~ ${fmt(r.to)} ${r.index===r.levels-1?'이하':'미만'}`;
    function calculation(r){
      const f=fmt,edgeCount=r.levels+1;
      const edges=edgeCount<=17?Array.from({length:edgeCount},(_,i)=>f(r.min+i*r.width)).join(' → '):`${f(r.min)} → ${f(r.min+r.width)} → … → ${f(r.from)} → ${f(r.to)} → … → ${f(r.max)}`;
      return `<div class="encoding-reasoning">
        <section class="encoding-step"><h4>1. 왜 한 칸의 폭이 ${f(r.width)}일까요?</h4><p>문제의 시작은 <b>${f(r.min)}</b>, 끝은 <b>${f(r.max)}</b>예요. 전체 길이는 <b>${f(r.max)} − (${f(r.min)}) = ${f(r.max-r.min)}</b>이에요.</p><p>${r.bitCount}비트는 0 또는 1을 적는 자리가 ${r.bitCount}개라는 뜻이에요. ${Array(r.bitCount).fill('2').join(' × ')} = <b>${r.levels}가지</b>를 구분할 수 있어요.</p><div class="encoding-equation">전체 길이 ${f(r.max-r.min)} ÷ 칸 수 ${r.levels} = <strong>한 칸 ${f(r.width)}</strong></div></section>
        <section class="encoding-step"><h4>2. 경계는 ${f(r.min)}에서 ${f(r.width)}씩 더해서 만들어요</h4><p>첫 칸의 시작은 ${f(r.min)}이에요. 한 칸의 폭만큼 한 번 더하면 다음 경계, 또 더하면 그다음 경계가 돼요.</p><div class="encoding-boundaries">${edges}</div><p>왼쪽부터 <b>0번, 1번, 2번…</b>으로 세요. ${r.atMax?`지금은 전체 범위의 맨 끝값 ${esc(r.valueText)}이에요. 문제의 약속에 따라 <b>마지막 ${r.index}번 칸</b>에 넣어요.`:`숫자 <b>${esc(r.valueText)}</b>에 도달하기 전에 칸 ${r.index}개를 지났으므로 <b>${r.index}번 칸</b>이에요.`}</p><div class="encoding-equation"><strong>${f(r.from)} ≤ ${esc(r.valueText)} ${r.atMax?'≤':'<'} ${f(r.to)}</strong><small>${rangeText(r)}인 칸. 표본값: ${esc(r.valueText)}</small></div></section>
        <section class="encoding-step"><h4>3. 경계를 다 쓰기 번거로우면 나눗셈으로 찾아요</h4><p>시작점에서 얼마나 떨어졌는지 구하고, 한 칸의 폭으로 나눠요.</p><div class="encoding-equation">(${esc(r.valueText)} − (${f(r.min)})) ÷ ${f(r.width)} = <strong>${r.positionText}</strong></div>${r.atMax?`<p>지금은 <b>맨 끝값 ${f(r.max)}</b>이에요. 계산은 ${r.levels}이지만 칸 번호는 0~${r.levels-1}까지만 있어요. 이 문제의 약속대로 <b>마지막 ${r.levels-1}번 칸</b>에 넣어요.</p>`:`<p>폭 ${f(r.width)}인 칸 ${r.index}개를 완전히 지났어요.${!r.atBoundary?' 남은 소수 부분은 그 칸 안에서 더 간 거리이므로 버려요.':' 경계에 딱 도착했으므로 그 경계에서 시작하는 오른쪽 칸에 넣어요.'} 따라서 칸 번호는 <b>${r.index}</b>예요. 반올림하지 않아요.</p>`}<p>검산: 칸의 시작 = ${f(r.min)} + ${r.index}×${f(r.width)} = <b>${f(r.from)}</b>. 다음 경계 = ${f(r.from)} + ${f(r.width)} = <b>${f(r.to)}</b>.</p></section>
        <section class="encoding-step"><h4>4. ${r.index}번을 왜 ${r.bits}으로 쓸까요?</h4><p>평소 십진수의 자릿값은 오른쪽부터 1, 10, 100처럼 10배씩 커져요. <b>이진수는 오른쪽부터 1, 2, 4, 8처럼 2배씩</b> 커져요. ${r.bitCount}자리라면 왼쪽부터 <b>${r.binary.map(s=>s.weight).join(' · ')}</b>이에요.</p><p>왼쪽의 큰 자리부터 확인해요. <b>뺄 수 있으면 1을 쓰고 빼기, 뺄 수 없으면 0을 쓰고 그대로</b> 다음 자리로 가요.</p><div class="encoding-table-wrap"><table class="encoding-table binary-calculation"><caption>칸 번호 ${r.index}의 이진수 계산</caption><thead><tr><th scope="col">자리의 값</th><th scope="col">남은 수로 뺄 수 있나요?</th><th scope="col">쓸 숫자</th></tr></thead><tbody>${r.binary.map(s=>`<tr><td>${s.weight}의 자리</td><td>${s.bit?`${s.before} ≥ ${s.weight} → ${s.before}−${s.weight}=${s.remaining}, 뺄 수 있어요`:`${s.before} < ${s.weight} → 못 빼요. ${s.remaining} 그대로`}</td><td><code>${s.bit}</code></td></tr>`).join('')}</tbody></table></div><div class="encoding-equation">왼쪽부터 쓰면 <strong>${r.bits}</strong><small>검산: ${r.binary.map(s=>`${s.bit}×${s.weight}`).join(' + ')} = ${r.index}</small></div><p>이 코드는 <b>${r.index}번 칸의 번호</b>를 나타내요. 앞에 있는 0도 ${r.bitCount}자리를 맞추기 위해 그대로 써요.</p></section>
        <details class="encoding-full-answer"><summary>직접 계산한 전체 칸 표 보기</summary><div class="encoding-table-wrap"><table class="encoding-table"><caption>${f(r.min)}~${f(r.max)}, ${r.bitCount}비트의 ${r.levels}칸</caption><thead><tr><th scope="col">숫자가 이 범위면</th><th scope="col">칸 번호</th><th scope="col">코드</th></tr></thead><tbody>${Array.from({length:r.levels},(_,index)=>`<tr data-range-index="${index}" class="${index===r.index?'selected-range':''}"><td>${rangeText({...r,index,from:r.min+index*r.width,to:r.min+(index+1)*r.width})}</td><td>${index}번</td><td><code>${index.toString(2).padStart(r.bitCount,'0')}</code></td></tr>`).join('')}</tbody></table></div></details>
      </div>`;
    }
    function renderGuide(kind,config={}){
      if(kind!=='three-bit')return '';
      const r=quantize(config.value??1.6,config)||threeBit(1.6);
      return `<section class="encoding-guide"><div class="encoding-guide-head"><span class="tag">숫자가 바뀌어도 푸는 법</span><h3>경계와 이진수를 직접 계산해 봐요</h3><p>칸의 범위와 코드를 계산으로 만들어 볼게요. 표본값을 바꾸면 같은 순서로 풀이가 나와요.</p></div><div class="encoding-controls"><label>바꿀 표본값<input type="number" step="any" data-encoding-sample aria-label="부호화할 숫자" value="${r.value}"></label><button class="btn small" data-encoding-calculate>계산 과정 보기</button><button class="btn secondary small" data-encoding-random>새 숫자로 혼자 풀기</button></div><details class="encoding-conditions"><summary>문제의 범위나 비트 수도 바꾸기</summary><div><label>범위의 시작<input type="number" step="any" data-encoding-min value="${r.min}"></label><label>범위의 끝<input type="number" step="any" data-encoding-max value="${r.max}"></label><label>비트 수<select data-encoding-bits aria-label="비트 수">${Array.from({length:6},(_,i)=>`<option value="${i+1}" ${i+1===r.bitCount?'selected':''}>${i+1}비트</option>`).join('')}</select></label></div><p>강의와 같은 조건: 같은 크기의 구간, 경계값은 오른쪽 칸, 맨 끝값은 마지막 칸에 포함해요.</p></details><div data-encoding-result aria-live="polite">${calculation(r)}</div></section>`;
    }
    function updateEncoding(root){
      if(!root)return;
      const r=quantize(root.querySelector('[data-encoding-sample]').value,{min:root.querySelector('[data-encoding-min]').value,max:root.querySelector('[data-encoding-max]').value,bits:root.querySelector('[data-encoding-bits]').value});
      root.querySelector('[data-encoding-result]').innerHTML=r?calculation(r):'<p class="encoding-message" role="alert">범위의 끝은 시작보다 커야 해요. 그 범위 안의 표본값과 1~6비트를 입력하세요.</p>';
    }
    function randomEncoding(root){
      const lo=Number(root.querySelector('[data-encoding-min]').value),hi=Number(root.querySelector('[data-encoding-max]').value);
      if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo){updateEncoding(root);return;}
      const input=root.querySelector('[data-encoding-sample]'),previous=Number(input.value);
      let value=Number((lo+(hi-lo)*(1+Math.floor(Math.random()*199))/200).toPrecision(10));
      if(value===previous)value=value<hi?Math.min(hi,value+(hi-lo)/200):lo;
      input.value=fmt(value);
      root.querySelector('[data-encoding-result]').innerHTML=`<div class="encoding-message"><strong>이번 표본값은 ${esc(input.value)}이에요.</strong><p>종이에 ① 한 칸의 폭 ② 칸 번호 ③ 이진수 코드를 적어 보세요. 준비되면 ‘계산 과정 보기’를 눌러 비교하세요.</p></div>`;
    }
    function weeklyQuestions(id){const w=weeks().find(w=>w.id===id);return w?w.items.map(i=>question(i.primaryQuestionId)).filter(Boolean):[];}
    function filterQuestions(selection={}){
      const filters={track:'all',type:'all',tag:'all',topic:'all',source:'all',...selection};
      return D.questions.filter(q=>(filters.track==='all'||q.track===filters.track)
        &&(filters.type==='all'||q.type===filters.type)
        &&(filters.tag==='all'||filters.tag==='필수'&&(q.exerciseNumbers?.length||q.tags?.some(t=>/^연습문제/.test(t)))||filters.tag==='원문'&&q.tags?.some(t=>/^원문/.test(t))||q.tags?.includes(filters.tag))
        &&(filters.topic==='all'||q.topic===filters.topic)
        &&(filters.source==='all'||q.source?.file===material(filters.source)?.file));
    }
    function exerciseQuestions(number){return filterQuestions({track:'practice'}).filter(q=>q.exerciseNumbers?.includes(Number(number)));}
    return {home,weekly,materials,sources,relatedConcepts,weeklyQuestions,filterQuestions,exerciseQuestions,renderGuide,extraDetails,threeBit,quantize,updateEncoding,randomEncoding};
  }
  globalThis.CV_STUDY={create};
})();
