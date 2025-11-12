/* -------- ProCalc JS: Shunting-yard + UI -------- */

const exprEl = document.getElementById('expression');
const outEl = document.getElementById('output');
const historyList = document.getElementById('historyList');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('themeToggle');
const copyBtn = document.getElementById('copyBtn');

let currentExpr = '';
let lastAnswer = null;
let memory = 0;
let history = [];

/* -------- Utilities: Tokenize, shunting-yard, evaluate RPN -------- */

const isNumber = s => /^-?\d+(\.\d+)?$/.test(s);
const isOperator = t => ['+','-','*','/','^','%'].includes(t);
const precedence = op => {
  if (op === '+' || op === '-') return 1;
  if (op === '*' || op === '/' || op === '%') return 2;
  if (op === '^') return 3;
  return 0;
};
const isLeftAssoc = op => op !== '^';

// Supported functions map
const functions = new Set(['sin','cos','tan','ln','log10','sqrt']);

// tokenize string into numbers, operators, parentheses and identifiers
function tokenize(input){
  const tokens = [];
  let i = 0;
  while(i < input.length){
    const ch = input[i];
    if (/\s/.test(ch)){ i++; continue; }
    if (/[0-9.]/.test(ch)){
      let num = ch; i++;
      while(i < input.length && /[0-9.]/.test(input[i])){ num += input[i++]; }
      tokens.push(num);
      continue;
    }
    if (/[A-Za-z]/.test(ch)){
      let id = ch; i++;
      while(i < input.length && /[A-Za-z0-9_]/.test(input[i])){ id += input[i++]; }
      tokens.push(id);
      continue;
    }
    if (['+','-','*','/','^','%','(',')',','].includes(ch)){
      tokens.push(ch); i++; continue;
    }
    // unknown char
    throw new Error('Invalid character: ' + ch);
  }
  return tokens;
}

// Convert tokens to RPN using shunting-yard
function toRPN(tokens){
  const out = [];
  const ops = [];
  for (let i = 0; i < tokens.length; i++){
    const t = tokens[i];
    if (isNumber(t) || /^[0-9.]+$/.test(t)) {
      out.push(t);
    } else if (/^PI$/.test(t) || /^E$/.test(t) || t === 'Ans') {
      out.push(t);
    } else if (functions.has(t)) {
      ops.push(t);
    } else if (isOperator(t)) {
      while(ops.length){
        const top = ops[ops.length-1];
        if ((isOperator(top) && ((isLeftAssoc(t) && precedence(t) <= precedence(top)) || (!isLeftAssoc(t) && precedence(t) < precedence(top)))) || functions.has(top)){
          out.push(ops.pop());
        } else break;
      }
      ops.push(t);
    } else if (t === ',') {
      while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
      if (!ops.length) throw new Error('Mismatched parentheses or separators');
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
      if (!ops.length) throw new Error('Mismatched parentheses');
      ops.pop(); // pop '('
      if (ops.length && functions.has(ops[ops.length-1])) out.push(ops.pop());
    } else {
      throw new Error('Unknown token: '+t);
    }
  }
  while(ops.length){
    const op = ops.pop();
    if (op === '(' || op === ')') throw new Error('Mismatched parentheses');
    out.push(op);
  }
  return out;
}

// Evaluate RPN
function evalRPN(rpn){
  const stack = [];
  for (const token of rpn){
    if (isNumber(token)) stack.push(parseFloat(token));
    else if (token === 'PI') stack.push(Math.PI);
    else if (token === 'E') stack.push(Math.E);
    else if (token === 'Ans') stack.push(lastAnswer !== null ? lastAnswer : 0);
    else if (functions.has(token)){
      if (!stack.length) throw new Error('Missing argument for function '+token);
      const a = stack.pop();
      switch(token){
        case 'sin': stack.push(Math.sin(a)); break;
        case 'cos': stack.push(Math.cos(a)); break;
        case 'tan': stack.push(Math.tan(a)); break;
        case 'ln': stack.push(Math.log(a)); break;
        case 'log10': stack.push(Math.log10 ? Math.log10(a) : Math.log(a)/Math.LN10); break;
        case 'sqrt': stack.push(Math.sqrt(a)); break;
        default: throw new Error('Unknown function '+token);
      }
    } else if (isOperator(token)) {
      const b = stack.pop(); const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Missing operand for '+token);
      switch(token){
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': if (b === 0) throw new Error('Division by zero'); stack.push(a / b); break;
        case '^': stack.push(Math.pow(a, b)); break;
        case '%': stack.push(a % b); break;
      }
    } else {
      throw new Error('Unhandled token in RPN: ' + token);
    }
  }
  if (stack.length !== 1) throw new Error('Invalid expression');
  return stack[0];
}

/* -------- UI and event handling -------- */

function refreshDisplay(){
  exprEl.textContent = currentExpr || '';
  outEl.textContent = (lastAnswer !== null && currentExpr === '') ? lastAnswer : (outEl.textContent || '0');
}

function appendToExpr(text){
  currentExpr += text;
  exprEl.textContent = currentExpr;
}

function clearEntry(){
  currentExpr = '';
  exprEl.textContent = '';
  outEl.textContent = '0';
}

function backspace(){
  if (currentExpr.length) currentExpr = currentExpr.slice(0, -1);
  exprEl.textContent = currentExpr;
}

function pushHistory(expr, result){
  history.unshift({expr, result});
  if (history.length > 50) history.pop();
  renderHistory();
}

function renderHistory(){
  historyList.innerHTML = '';
  history.forEach((h, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${h.result}</strong> <small>${h.expr}</small>`;
    li.addEventListener('click', ()=> {
      currentExpr = h.expr;
      exprEl.textContent = currentExpr;
      outEl.textContent = h.result;
      lastAnswer = parseFloat(h.result);
    });
    historyList.appendChild(li);
  });
}

/* Evaluate expression string */
function evaluateExpression(exprStr){
  try {
    const tokens = tokenize(exprStr);
    const rpn = toRPN(tokens);
    const value = evalRPN(rpn);
    if (!isFinite(value)) throw new Error('Result is not finite');
    return value;
  } catch (err) {
    throw err;
  }
}

/* Button handling */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  if (action) {
    handleAction(action.trim());
  } else if (val !== undefined) {
    // Make sure functions and constants are appended properly
    if (/^[A-Za-z]+\(.*$/.test(val) || /^[A-Za-z]+$/.test(val) && functions.has(val)) {
      appendToExpr(val);
    } else {
      appendToExpr(val);
    }
  }
});

/* Action commands: MC MR M+ M- AC C equals history Ans */
function handleAction(action){
  switch(action){
    case 'MC': memory = 0; flashStatus('Memory cleared'); break;
    case 'MR': appendToExpr(String(memory)); break;
    case 'M+':
      try { const res = lastAnswer !== null ? lastAnswer : evaluateExpression(currentExpr || String(0)); memory += res; flashStatus('Added to memory'); }
      catch(e){ flashStatus('Could not add to memory', true); }
      break;
    case 'M-':
      try { const res = lastAnswer !== null ? lastAnswer : evaluateExpression(currentExpr || String(0)); memory -= res; flashStatus('Subtracted from memory'); }
      catch(e){ flashStatus('Could not subtract', true); }
      break;
    case 'AC': currentExpr = ''; lastAnswer = null; outEl.textContent = '0'; exprEl.textContent = ''; break;
    case 'C': backspace(); break;
    case 'equals':
    case '=':
      try {
        const toEval = currentExpr || String(lastAnswer ?? 0);
        const value = evaluateExpression(toEval);
        lastAnswer = Number(value.toFixed(12)); // avoid float noise
        outEl.textContent = lastAnswer;
        pushHistory(toEval, lastAnswer);
        currentExpr = '';
        exprEl.textContent = '';
      } catch (err) {
        outEl.textContent = 'Error: ' + err.message;
        outEl.style.color = 'var(--danger)';
        setTimeout(()=>{ outEl.style.color = ''; }, 1800);
      }
      break;
    case 'Ans':
      appendToExpr('Ans');
      break;
    case 'history':
      // toggle sidebar (for small screens)
      sidebar.scrollIntoView({behavior:'smooth'}); break;
    default:
      console.log('Unknown action', action);
  }
}

/* Keyboard support */
document.addEventListener('keydown', (e) => {
  const allowed = '0123456789.+-*/^%()';
  if (e.key === 'Enter') { handleAction('equals'); e.preventDefault(); return; }
  if (e.key === 'Backspace') { handleAction('C'); return; }
  if (e.key === 'Escape') { handleAction('AC'); return; }
  if (e.key === 'p' && (e.ctrlKey || e.metaKey)) { /* ctrl/cmd+p reserved */ }
  if (allowed.includes(e.key)) {
    appendToExpr(e.key);
  }
});

/* Theme toggle */
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeToggle.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
});

/* Copy result */
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outEl.textContent);
    flashStatus('Result copied');
  } catch(e) {
    flashStatus('Copy failed', true);
  }
});

/* small helper to show quick messages in output */
let flashTimer = null;
function flashStatus(msg, isError){
  const prev = outEl.textContent;
  outEl.textContent = msg;
  outEl.style.color = isError ? 'var(--danger)' : 'var(--success)';
  clearTimeout(flashTimer);
  flashTimer = setTimeout(()=> {
    outEl.textContent = prev || (lastAnswer !== null ? lastAnswer : '0');
    outEl.style.color = '';
  }, 1400);
}

/* initialize */
(function init(){
  outEl.textContent = '0';
  exprEl.textContent = '';
  renderHistory();
})();
