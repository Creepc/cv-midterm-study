/* Chapter 4 result diagrams. API: render(exercise) -> HTML; bind(container,exercise).
 * Only this demo owns its listeners. Replacing its subtree and binding again is safe.
 */
(() => {
  'use strict';
  const controllers = new WeakMap();
  const supported = new Set([1, 2, 5, 6, 9, 10, 13, 16]);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const numberOf = e => Number(e?.number);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
  const button = (name, label, extra = '') => `<button type="button" class="ed-button" data-action="exercise-demo-${name}" ${extra}>${label}</button>`;
  const svg = (width, height, contents, label, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" ${extra}>${contents}</svg>`;
  const card = (heading, content, caption = '') => `<div class="ed-card"><h4>${heading}</h4>${content}${caption ? `<p class="ed-caption">${caption}</p>` : ''}</div>`;
  const chip = value => `<span class="ed-chip">${value}</span>`;
  const coordinate = (x, y, label, dx = 8, dy = -9, fill = '#203f32') => `<circle cx="${x}" cy="${y}" r="3" fill="${fill}"/><text x="${x + dx}" y="${y + dy}" fill="${fill}" font-size="15">${esc(label)}</text>`;

  function windowGraphic(width, height, shade, title, frameWidth = 640, frameHeight = 390) {
    const x = (frameWidth - width) / 2, y = (frameHeight - height) / 2 + 9;
    return svg(frameWidth, frameHeight, `<rect width="${frameWidth}" height="${frameHeight}" fill="#edf1e8"/><rect x="${x - 2}" y="${y - 29}" width="${width + 4}" height="${height + 31}" rx="4" fill="#bdd1b5"/><text x="${x + 11}" y="${y - 10}" font-size="13" fill="#34593e">${esc(title)}</text><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="rgb(${shade},${shade},${shade})"/><text x="${frameWidth / 2}" y="${frameHeight - 6}" text-anchor="middle" font-size="14" fill="#46633f">너비 ${width} × 높이 ${height}</text>`, `${title} 창: 너비 ${width}, 높이 ${height}인 표시 영역의 도식`);
  }

  function callbackDemo() {
    return `<p class="ed-intro">함수를 등록해 두면, 클릭이 일어났을 때 시스템이 그 함수를 부릅니다. 버튼으로 세 단계를 따라가 보세요.</p><ol class="ed-flow"><li>콜백 등록</li><li>클릭 이벤트 발생</li><li>시스템이 콜백 호출</li></ol><div class="ed-controls">${button('callback', '등록하고 클릭 발생시키기')}${button('callback-reset', '다시 시작')}</div><pre class="ed-console" data-ed-log aria-live="polite">아직 클릭하지 않았습니다.\n등록할 함수: onMouse(event, x, y, flags, param)</pre><p class="ed-footnote">학습용 호출 로그입니다. <code>onMouse</code>는 함수를 전달하고, <code>onMouse()</code>는 지금 실행합니다.</p>`;
  }

  function windowDemo() {
    return `<p class="ed-intro">같은 흰 영상 한 장을 두 창에 표시합니다. 아래 슬라이더는 NORMAL 창의 너비만 바꿉니다.</p><div class="ed-fact">영상 데이터는 그대로 <code>image.shape = (200, 300)</code><span>높이 200 · 너비 300 · 모든 화소 255</span></div><label class="ed-slider">NORMAL 창 너비 <output data-ed-normal-width>400</output><input type="range" min="300" max="600" step="10" value="400" data-action="exercise-demo-normal-width" aria-label="NORMAL 창의 요청 너비"></label><div class="ed-grid">${card('WINDOW_AUTOSIZE', windowGraphic(300, 200, 255, 'AUTOSIZE'), '원래 영상 크기 300 × 200에 맞춥니다.')}${card('WINDOW_NORMAL', `<div data-ed-normal-view>${windowGraphic(400, 300, 255, 'NORMAL')}</div>`, '창 크기를 바꿔도 image 배열은 바뀌지 않습니다.')}</div><p class="ed-footnote">창 크기 요청을 비교하는 도식입니다. 실제 제목 표시줄과 여백은 실행 환경에 따라 달라집니다.</p>`;
  }

  function lineRectangleDemo() {
    const drawing = svg(600, 400, `<rect width="600" height="400" fill="white"/><line x1="50" y1="100" x2="200" y2="300" stroke="#00ff00" stroke-width="5"/><rect x="99.5" y="149.5" width="51" height="51" fill="#ff0000"/>${coordinate(50, 100, '(50,100)')}${coordinate(200, 300, '(200,300)')}${coordinate(100, 150, '(100,150)', 61, -3)}${coordinate(150, 200, '(150,200)', 13, 20)}`, '흰 600×400 영상에 녹색 선과 shift=1인 빨간 채움 사각형');
    const gray = svg(400, 300, '<rect width="400" height="300" fill="rgb(100,100,100)"/>', '모든 밝기가 100인 너비400 높이300 회색 영상');
    return `<div class="ed-grid">${card('첫 코드: 회색 Window', gray, '너비 400 × 높이 300 · 밝기 100<br>창을 화면의 (100,200)으로 이동합니다.')}${card('둘째 코드: Line &amp; Rectangle', drawing, '너비 600 × 높이 400의 흰 바탕 · 좌표와 색을 보여주는 도식')}</div><div class="ed-facts">${chip('선: 초록 · 두께 5')}${chip('사각형: 빨강 · 내부 채움')}</div><div class="ed-calculation"><b>사각형에만 shift=1이 적용됩니다.</b><span>(200,300) ÷ 2 → (100,150)</span><span>(300,400) ÷ 2 → (150,200)</span><small>앞의 line 호출에는 shift를 주지 않았으므로 선의 두 끝점은 그대로입니다.</small></div>`;
  }

  function resizedDemo() {
    const original = svg(640, 550, '<rect width="640" height="550" fill="#edf1e8"/><rect x="120" y="125" width="400" height="300" fill="rgb(100,100,100)"/><text x="320" y="465" text-anchor="middle" font-size="19" fill="#46633f">너비 400 × 높이 300</text>', '원본 회색 영상: 300행400열');
    const resized = svg(640, 550, '<rect width="640" height="550" fill="#edf1e8"/><rect x="20" y="25" width="600" height="500" fill="rgb(100,100,100)"/><text x="320" y="295" text-anchor="middle" font-size="21" fill="white">창 요청: 너비 600 × 높이 500</text>', 'NORMAL 창의 너비600 높이500 크기 요청 도식');
    return `<p class="ed-intro">배열을 크게 만드는 문제와 창을 크게 여는 문제를 구별하세요. 이 코드는 창 크기를 바꿉니다.</p><div class="ed-grid">${card('1. 영상 만들기', original, '<code>np.zeros((300,400), np.uint8)</code><br>모든 화소에 100을 넣습니다.')}${card('2. 표시 창 크기 요청', resized, '<code>resizeWindow("Window",600,500)</code><br>인수 순서는 너비, 높이입니다.')}</div><div class="ed-fact"><code>image.shape = (300, 400)</code><span>표시 전후의 배열 크기가 같습니다.</span></div><p class="ed-footnote">표시 영역 크기를 나타내는 도식이며 실제 영상의 배치·여백은 창 설정에 따라 달라질 수 있습니다.</p>`;
  }

  function filledRectangleDemo() {
    const result = svg(400, 600, `<rect width="400" height="600" fill="#000"/><rect x="99.5" y="99.5" width="201" height="301" fill="#ff0000"/>${coordinate(100, 100, '(100,100)', 8, -15, '#fff')}${coordinate(300, 400, '(300,400)', -110, 27, '#fff')}`, '검정 너비400 높이600 영상에 (100,100)부터(300,400)까지 빨간 채움 사각형');
    return `<div class="ed-portrait">${result}</div><div class="ed-facts">${chip('image.shape = (600,400,3)')}${chip('BGR (0,0,255) = 빨강')}${chip('thickness=-1 = 내부 채움')}</div><p class="ed-caption">가로 좌표 차이는 300−100=200, 세로 좌표 차이는 400−100=300입니다. 이 코드처럼 양 끝 화소를 포함해 채우면 실제 빨간 화소 영역은 <b>201 × 301</b>입니다.</p>`;
  }

  function mouseDrawingDemo() {
    const pad = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" tabindex="0" role="group" aria-roledescription="그리기 영역" aria-label="500×500 검정 영상. 클릭하면 선택한 도형을 그립니다. 방향키로 위치를 옮기고 Enter 또는 스페이스로 그릴 수 있습니다." data-action="exercise-demo-draw"><rect width="500" height="500" fill="#000"/><g data-ed-shapes></g><g data-ed-cursor pointer-events="none"><path d="M240 250h20M250 240v20" stroke="#fff" stroke-opacity=".65" stroke-width="1"/><circle cx="250" cy="250" r="4" fill="none" stroke="#fff" stroke-opacity=".65"/></g></svg>`;
    return `<p class="ed-intro">모드를 고른 뒤 검정 영상을 눌러 보세요. 실제 마우스 오른쪽 클릭도 초록 원을 그립니다.</p><div class="ed-controls ed-mode-controls" role="group" aria-label="그릴 도형 선택">${button('mode-rect', '왼쪽 클릭 · 빨간 사각형', 'aria-pressed="true"')}${button('mode-circle', '오른쪽 클릭 · 초록 원', 'aria-pressed="false"')}${button('drawing-reset', '지우기')}</div><div class="ed-draw-pad">${pad}</div><p class="ed-status" data-ed-drawing-status aria-live="polite">도형 0개 · 선택: 사각형 · 키보드 위치 (250,250)</p><p class="ed-caption">사각형은 클릭점을 왼쪽 위로 잡고 (x+30,y+30)까지 그립니다. 원은 클릭점을 중심으로 반지름 20입니다. 둘 다 선 두께는 2입니다.</p><p class="ed-footnote">키보드: 영상에 초점을 둔 뒤 방향키로 10씩 이동 → Enter 또는 스페이스로 그리기. 흰 십자 표시는 학습용 커서입니다. 도형은 지우기 전까지 쌓이며 영상 밖 부분은 잘립니다.</p>`;
  }

  function colorSwatch(label) {
    return svg(200, 200, '<rect width="100" height="100" fill="#f00"/><rect x="100" width="100" height="100" fill="#0f0"/><rect y="100" width="100" height="100" fill="#00f"/><rect x="100" y="100" width="100" height="100" fill="#fff"/>', label);
  }

  function savingDemo() {
    return `<p class="ed-intro">사진 대신 2 × 2 색 견본으로 저장 설정의 뜻을 비교합니다. 아래 색은 입력과 PNG 복원의 개념 예시입니다.</p><div class="ed-swatch-grid">${card('합성 입력 · 2 × 2 화소', colorSwatch('빨강 초록 파랑 흰색 네 화소의 합성 입력'), 'BGR 순서로 저장되는 컬러 배열')}${card('PNG 0 또는 9로 저장 후 읽기', colorSwatch('PNG는 압축0과9 모두 원래 네 화소로 복원'), '0과 9 모두 같은 화소로 복원됩니다.')}</div><div class="ed-table-wrap"><table class="ed-table"><thead><tr><th scope="col">저장 설정</th><th scope="col">설정의 뜻</th><th scope="col">읽은 뒤 화소</th></tr></thead><tbody><tr><th scope="row">JPEG_QUALITY = 100</th><td>JPEG 최대 품질 설정</td><td>원본과 완전히 같다는 보장은 없습니다.</td></tr><tr><th scope="row">PNG_COMPRESSION = 0</th><td>압축을 최소로 하는 설정</td><td>원본 화소와 같습니다.</td></tr><tr><th scope="row">PNG_COMPRESSION = 9</th><td>압축을 많이 하는 설정</td><td>0과 같은 화소 품질입니다.</td></tr></tbody></table></div><p class="ed-footnote">원문 저장값은 JPEG 100, PNG 0입니다. PNG 9는 비교용입니다. 실제 파일 인코딩 결과나 파일 크기를 대신 보여주는 그림은 아닙니다.</p>`;
  }

  function roiGraphic(green) {
    const next = Math.min(255, green + 50);
    return svg(640, 400, `<rect width="640" height="400" fill="rgb(80,${green},60)"/><rect x="200" y="100" width="100" height="200" fill="rgb(80,${next},60)"/><rect x="200" y="100" width="100" height="200" fill="none" stroke="#ff0000" stroke-width="3"/><path d="M200 0V88M0 100H188" stroke="#fff" stroke-opacity=".7" stroke-dasharray="5 5"/><text x="210" y="83" font-size="17" fill="#fff" stroke="#173a24" stroke-width=".4">(200,100)</text><text x="320" y="205" font-size="19" fill="#fff" stroke="#173a24" stroke-width=".4">ROI: G=${next}</text><text x="25" y="370" font-size="17" fill="#fff" stroke="#173a24" stroke-width=".4">ROI 밖: G=${green} 그대로</text>`, `합성 프레임. (200,100)에서 너비100 높이200인 ROI의 G만 ${green}에서 ${next}로 바꾸고 빨간 테두리 두께3을 그림`);
  }

  function roiDemo() {
    return `<p class="ed-intro">카메라 대신 한 가지 색의 합성 프레임을 사용합니다. 선택한 부분(ROI)의 초록 성분 G에만 50을 더합니다.</p><label class="ed-slider">처리 전 G 값 <output data-ed-g-value>230</output><input type="range" min="0" max="255" value="230" data-action="exercise-demo-green" aria-label="합성 영상의 처리 전 G 값"></label><div class="ed-roi-view" data-ed-roi-view>${roiGraphic(230)}</div><div class="ed-calculation"><b data-ed-g-equation>cv2.add: G 230 + 50 → 255</b><span data-ed-g-description>280은 255보다 크므로 255에서 멈춥니다.</span><small>BGR에서 G는 채널 1입니다. B=60과 R=80은 그대로 두고, 마지막에 빨간 테두리를 그립니다.</small></div><div class="ed-facts">${chip('x=200 · y=100 · w=100 · h=200')}${chip('frame[100:300,200:300]')}${chip('ROI shape: (200,100,3)')}${chip('빨간 테두리 두께 3')}</div><p class="ed-footnote">좌표 안내선과 글자는 학습용입니다. 실제 영상에서는 ROI의 색을 바꾼 다음 테두리를 그리므로 테두리 화소는 빨강으로 덮입니다.</p>`;
  }

  function render(e) {
    const number = numberOf(e);
    if (!supported.has(number)) return '';
    const bodies = { 1: callbackDemo, 2: windowDemo, 5: lineRectangleDemo, 6: resizedDemo, 9: filledRectangleDemo, 10: mouseDrawingDemo, 13: savingDemo, 16: roiDemo };
    const label = [10, 13, 16].includes(number) ? '합성 예시' : '동작·좌표 도식';
    return `<section class="exercise-demo" data-exercise="${number}" aria-label="연습문제 ${number} 실행 결과 미리보기"><div class="ed-heading"><h3>실행 결과 미리보기</h3><span>${label}</span></div>${bodies[number]()}</section>`;
  }

  function bind(root, e) {
    if (!root?.querySelectorAll) return;
    const number = numberOf(e);
    if (!supported.has(number)) return;
    const hosts = [...root.querySelectorAll(`.exercise-demo[data-exercise="${number}"]`)];
    if (root.matches?.(`.exercise-demo[data-exercise="${number}"]`)) hosts.unshift(root);
    for (const host of hosts) {
      controllers.get(host)?.abort();
      const controller = new AbortController();
      controllers.set(host, controller);
      const listen = (name, fn) => host.addEventListener(name, fn, { signal: controller.signal });
      let callbackCount = 0;
      let mode = 'rect', point = { x: 250, y: 250 };
      const shapes = [];
      const updateDrawing = message => {
        const layer = host.querySelector('[data-ed-shapes]');
        if (!layer) return;
        layer.innerHTML = shapes.map(shape => shape.type === 'circle'
          ? `<circle cx="${shape.x}" cy="${shape.y}" r="20" fill="none" stroke="#00ff00" stroke-width="2"/>`
          : `<rect x="${shape.x}" y="${shape.y}" width="30" height="30" fill="none" stroke="#ff0000" stroke-width="2"/>`).join('');
        host.querySelector('[data-ed-cursor]').setAttribute('transform', `translate(${point.x - 250},${point.y - 250})`);
        host.querySelector('[data-ed-drawing-status]').textContent = `${message ? message + ' · ' : ''}도형 ${shapes.length}개 · 선택: ${mode === 'rect' ? '사각형' : '원'} · 키보드 위치 (${point.x},${point.y})`;
      };
      const drawAt = (x, y, type = mode) => {
        point = { x: Math.round(clamp(x, 0, 499)), y: Math.round(clamp(y, 0, 499)) };
        shapes.push({ ...point, type });
        updateDrawing(type === 'circle' ? `초록 원 중심 (${point.x},${point.y}), r=20` : `빨간 사각형 (${point.x},${point.y}) → (${point.x + 30},${point.y + 30})`);
      };
      const eventPoint = (event, element) => {
        const rect = element.getBoundingClientRect();
        return { x: (event.clientX - rect.left) / rect.width * 500, y: (event.clientY - rect.top) / rect.height * 500 };
      };
      listen('input', event => {
        const input = event.target.closest?.('[data-action]');
        if (!input || !host.contains(input)) return;
        if (input.dataset.action === 'exercise-demo-normal-width') {
          const width = Math.round(clamp(input.value, 300, 600));
          host.querySelector('[data-ed-normal-width]').textContent = String(width);
          host.querySelector('[data-ed-normal-view]').innerHTML = windowGraphic(width, 300, 255, 'NORMAL');
        } else if (input.dataset.action === 'exercise-demo-green') {
          const green = Math.round(clamp(input.value, 0, 255)), sum = green + 50;
          host.querySelector('[data-ed-g-value]').textContent = String(green);
          host.querySelector('[data-ed-roi-view]').innerHTML = roiGraphic(green);
          host.querySelector('[data-ed-g-equation]').textContent = `cv2.add: G ${green} + 50 → ${Math.min(255, sum)}`;
          host.querySelector('[data-ed-g-description]').textContent = sum > 255 ? `${sum}은 255보다 크므로 255에서 멈춥니다.` : `${sum}은 255 이하이므로 계산한 값을 그대로 씁니다.`;
        }
      });
      listen('click', event => {
        const element = event.target.closest?.('[data-action]');
        if (!element || !host.contains(element)) return;
        const name = element.dataset.action;
        if (name === 'exercise-demo-callback') {
          callbackCount++;
          host.querySelector('[data-ed-log]').textContent = `1. 등록: setMouseCallback(window, onMouse)\n2. 이벤트: ${callbackCount}번째 왼쪽 클릭 발생\n3. 호출: 시스템 → onMouse(EVENT_LBUTTONDOWN, 120, 80, flags, param)\n4. 실행: 콜백 안의 print 또는 그리기 코드`;
        } else if (name === 'exercise-demo-callback-reset') {
          callbackCount = 0;
          host.querySelector('[data-ed-log]').textContent = '아직 클릭하지 않았습니다.\n등록할 함수: onMouse(event, x, y, flags, param)';
        } else if (name === 'exercise-demo-mode-rect' || name === 'exercise-demo-mode-circle') {
          mode = name.endsWith('circle') ? 'circle' : 'rect';
          host.querySelector('[data-action="exercise-demo-mode-rect"]').setAttribute('aria-pressed', String(mode === 'rect'));
          host.querySelector('[data-action="exercise-demo-mode-circle"]').setAttribute('aria-pressed', String(mode === 'circle'));
          updateDrawing();
        } else if (name === 'exercise-demo-drawing-reset') {
          shapes.length = 0;
          updateDrawing('모두 지웠습니다');
        } else if (name === 'exercise-demo-draw' && event.detail !== 0) {
          const next = eventPoint(event, element);
          drawAt(next.x, next.y);
        }
      });
      listen('contextmenu', event => {
        const element = event.target.closest?.('[data-action="exercise-demo-draw"]');
        if (!element || !host.contains(element)) return;
        event.preventDefault();
        const next = eventPoint(event, element);
        drawAt(next.x, next.y, 'circle');
      });
      listen('keydown', event => {
        if (event.target.dataset?.action !== 'exercise-demo-draw') return;
        const moves = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
        if (moves[event.key]) {
          event.preventDefault();
          point.x = clamp(point.x + moves[event.key][0], 0, 499);
          point.y = clamp(point.y + moves[event.key][1], 0, 499);
          updateDrawing();
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          drawAt(point.x, point.y);
        }
      });
    }
  }

  globalThis.CV_EXERCISE_VISUALS = Object.freeze({ render, bind });
})();
