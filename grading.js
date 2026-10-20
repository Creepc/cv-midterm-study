/* Shared deterministic answer matching, also verified in Node. */
(() => {
  function normalize(value) {
    const text=String(value??'').normalize('NFKC').trim().toLowerCase();
    // Preserve element boundaries: [1, 23] must differ from [12, 3].
    if(text&&/^[\s\[\](),.\d+\-e]+$/.test(text)) {
      const tokens=text.match(/[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?/g);
      if(tokens?.length) return 'numbers:'+tokens.map(token=>{
        if(/^[+\-]?\d+$/.test(token))return BigInt(token).toString();
        const n=Number(token);return Number.isFinite(n)&&Math.abs(n)<=Number.MAX_SAFE_INTEGER?String(n):token;
      }).join('|');
    }
    return text.replace(/cv2\./g,'').replace(/\s+/g,'').replace(/["'`]/g,'').replace(/[。．.]$/,'');
  }
  function check(question,value) {
    if(value===undefined||value===null||!String(value).trim())return false;
    const actual=question.type==='choice'?question.choices?.[Number(value)]:value;
    if(actual===undefined)return false;
    if(question.answerFormat==='bits'){
      const bits=x=>String(x).replace(/[\s,\[\]()"']/g,'');
      const actualBits=bits(actual);
      return /^[01]+$/.test(actualBits)&&[question.answer,...(question.accepted||[])].some(a=>actualBits===bits(a));
    }
    return [question.answer,...(question.accepted||[])].some(answer=>normalize(actual)===normalize(answer));
  }
  globalThis.CV_GRADE={normalize,check};
})();
