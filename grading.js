/* Shared deterministic answer matching, also verified in Node. */
(() => {
  function tokens(text){
    const lexical=/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\p{L}_][\p{L}\p{N}_]*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?|\*\*|\/\/|==|!=|<=|>=|<<|>>|:=|\+=|-=|\*=|\/=|\s+|./gu;
    return JSON.stringify((text.match(lexical)||[]).filter(part=>!/^\s+$/.test(part)));
  }
  function normalize(value) {
    const text=String(value??'').normalize('NFKC').trim().toLowerCase();
    // Preserve element boundaries: [1, 23] must differ from [12, 3].
    if(text&&/^[\s\[\](),.\d+\-e]+$/.test(text)&&!/,\s*,/.test(text)) {
      const tokens=text.replace(/[\[\]()]/g,' ').trim().split(/[\s,]+/).filter(Boolean);
      const literal=/^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/;
      if(tokens.length&&tokens.every(token=>literal.test(token))) return 'numbers:'+tokens.map(token=>{
        if(/^[+\-]?\d+$/.test(token))return BigInt(token).toString();
        const n=Number(token);return Number.isFinite(n)&&Math.abs(n)<=Number.MAX_SAFE_INTEGER?String(n):token;
      }).join('|');
    }
    return tokens(text.replace(/[。．.]$/,''));
  }
  function normalizeBlank(value){
    // Code inserted into a blank must retain punctuation, quotes and identifier case.
    return tokens(String(value??'').normalize('NFKC').trim());
  }
  function check(question,value) {
    if(value===undefined||value===null||!String(value).trim())return false;
    const actual=question.type==='choice'?question.choices?.[Number(value)]:value;
    if(actual===undefined)return false;
    if(question.type==='choice')return actual===question.answer;
    if(question.answerFormat==='literal')return [question.answer,...(question.accepted||[])].some(answer=>normalizeBlank(actual)===normalizeBlank(answer));
    if(question.answerFormat==='bits'){
      const bits=x=>String(x).replace(/[\s,\[\]()"']/g,'');
      const actualBits=bits(actual);
      return /^[01]+$/.test(actualBits)&&[question.answer,...(question.accepted||[])].some(a=>actualBits===bits(a));
    }
    const compare=question.type==='blank'?normalizeBlank:normalize;
    return [question.answer,...(question.accepted||[])].some(answer=>compare(actual)===compare(answer));
  }
  globalThis.CV_GRADE={normalize,check};
})();
