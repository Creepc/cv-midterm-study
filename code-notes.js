/* Keep lesson code intact while placing its explanation beside the relevant lines. */
(() => {
  'use strict';
  function group(text, items) {
    const lines = String(text ?? '').replaceAll('\r\n', '\n').split('\n');
    const notes = (items || []).map(item => {
      const range = /^\s*(\d+)(?:\s*[~–-]\s*(\d+))?\s*행/.exec(item.lines || '');
      return { ...item, start: Number(range?.[1]), end: Number(range?.[2] || range?.[1]) };
    });
    if (!notes.length) return [{ start: 1, end: lines.length, lines, notes: [] }];
    // Unrecognized labels still retain all code and all explanations together.
    if (notes.some(n => !n.start || n.start > n.end || n.end > lines.length)) {
      return [{ start: 1, end: lines.length, lines, notes }];
    }
    const ranges = [];
    for (const note of [...notes].sort((a, b) => a.start - b.start || a.end - b.end)) {
      const previous = ranges.at(-1);
      if (previous && note.start <= previous.end) {
        previous.end = Math.max(previous.end, note.end);
        previous.notes.push(note);
      } else ranges.push({ start: note.start, end: note.end, notes: [note] });
    }
    const groups = [];
    let cursor = 1;
    for (const range of ranges) {
      if (cursor < range.start) {
        const gap = lines.slice(cursor - 1, range.start - 1);
        if (gap.every(line => !line.trim())) range.start = cursor;
        else groups.push({ start: cursor, end: range.start - 1, lines: gap, notes: [] });
      }
      groups.push({ ...range, lines: lines.slice(range.start - 1, range.end) });
      cursor = range.end + 1;
    }
    if (cursor <= lines.length) {
      const trailing = lines.slice(cursor - 1);
      if (trailing.every(line => !line.trim())) {
        groups.at(-1).lines.push(...trailing);
        groups.at(-1).end = lines.length;
      } else groups.push({ start: cursor, end: lines.length, lines: trailing, notes: [] });
    }
    return groups;
  }
  function questionCode(question) {
    return question.type === 'blank'
      ? String(question.code || '').replace('____', () => String(question.answer))
      : question.code;
  }
  function create({ esc, rich, highlight }) {
    return function render(text, items) {
      if (!text || !items?.length) return '';
      return `<section class="annotated-code" aria-label="코드와 주석으로 읽는 해설"><div class="annotation-heading"><h3>코드와 주석으로 읽기</h3><button class="copy-btn" data-copy-annotation-all>전체 코드 복사 ⧉</button></div><p class="annotation-intro">코드와 설명을 한 묶음으로 읽어 보세요.</p><div class="annotated-code-list">${group(text, items).map(row => `<div class="annotated-code-row${row.notes.length ? '' : ' annotation-unexplained'}"><div class="annotation-code"><div class="annotation-code-head"><span>${row.start === row.end ? row.start : row.start + '~' + row.end}행</span><button class="copy-btn" data-copy-annotation aria-label="${row.start}행부터 ${row.end}행까지 코드 복사">코드 복사 ⧉</button></div><pre><code class="language-python">${row.lines.map((line, index) => `<span class="annotation-source-line" data-code-line="${row.start + index}"><span class="code-ln" aria-hidden="true">${row.start + index}</span>${highlight(line)}</span>`).join('\n')}</code></pre></div>${row.notes.length ? `<div class="annotation-note"><span class="annotation-marker" aria-hidden="true">#</span><div class="annotation-note-body">${row.notes.map(note => `<div class="annotation-text"><strong>${esc(note.lines)}</strong><div class="prose">${rich(note.explanation)}</div></div>`).join('')}</div></div>` : ''}</div>`).join('')}</div></section>`;
    };
  }
  globalThis.CV_CODE_NOTES = Object.freeze({ group, questionCode, create });
})();
