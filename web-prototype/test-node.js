// Node.js smoke test for app.js
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');

// LocalStorage mock
const store = {};
global.localStorage = {
  getItem(k) { return store[k] ?? null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; }
};

// Crypto / encoding
if (!global.TextEncoder) global.TextEncoder = require('util').TextEncoder;
global.crypto = webcrypto;
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');

// Minimal Blob / URL
if (!global.Blob) global.Blob = class Blob { constructor(parts) { this.parts = parts; } };
if (!global.URL) global.URL = class URL { static createObjectURL() { return 'blob:mock'; } static revokeObjectURL() {} };
else { URL.createObjectURL = () => 'blob:mock'; URL.revokeObjectURL = () => {}; }

// TTS mock
global.speechSynthesis = { cancel() {}, speak(u) { if (u.onend) setTimeout(() => u.onend(), 0); } };
global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };

// DOM mock
function makeEl(id = '', cls = '') {
  const set = new Set(cls.split(' ').filter(Boolean));
  const classList = {
    add(c) { set.add(c); },
    remove(c) { set.delete(c); },
    toggle(c, v) {
      if (v === undefined) { if (set.has(c)) { set.delete(c); return false; } set.add(c); return true; }
      if (v) set.add(c); else set.delete(c); return v;
    }
  };
  const style = {};
  const ctxProxy = new Proxy({}, { get(_, p) { return () => {}; }, set() { return true; } });
  const el = {
    id, className: cls, classList, style,
    textContent: '', innerHTML: '', value: '', href: '', download: '', disabled: false,
    addEventListener() {}, removeEventListener() {},
    click() {}, focus() {},
    showModal() {}, close() {},
    remove() {},
    appendChild() {}, removeChild() {},
    setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 350 }; },
    getContext() { return ctxProxy; },
    toDataURL() { return 'data:image/png;base64,MOCK'; }
  };
  return el;
}

const elementsById = {};
function getById(id, cls = '') {
  if (!elementsById[id]) elementsById[id] = makeEl(id, cls);
  return elementsById[id];
}

const classMap = {};
function ensureClass(cls, count = 1) {
  if (!classMap[cls]) classMap[cls] = [];
  while (classMap[cls].length < count) {
    const el = makeEl('', cls);
    classMap[cls].push(el);
  }
  return classMap[cls];
}

// Pre-create screen elements
ensureClass('screen', 7);

global.document = {
  readyState: 'complete',
  body: { appendChild() {}, removeChild() {} },
  addEventListener() {},
  removeEventListener() {},
  getElementById(id) { return getById(id); },
  querySelector(sel) {
    if (sel.startsWith('#')) return getById(sel.slice(1));
    if (sel.startsWith('.')) return (classMap[sel.slice(1)] || [makeEl('', sel.slice(1))])[0];
    return makeEl('', sel);
  },
  querySelectorAll(sel) {
    if (sel === '.screen') return classMap['screen'] || [];
    if (sel.startsWith('.')) return classMap[sel.slice(1)] || [];
    return [];
  },
  createElement(tag) {
    return makeEl('', tag);
  },
  visibilityState: 'visible'
};

global.window = { addEventListener() {}, removeEventListener() {} };

// Fetch mock
global.fetch = (url) => Promise.resolve({
  ok: true,
  status: 200,
  async json() {
    return { words: JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8')).words };
  }
});

// Load app
require('./app.js');

const wait = (ms = 10) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  // Wait for boot
  await new Promise(r => setTimeout(r, 50));
  const wb = (global.window || {}).__wordbook;
  if (!wb) throw new Error('__wordbook not exposed');

  const { engine } = wb;

  // Test 1: Start Lv1 session with 5 words
  console.log('Test 1: startSession Lv1 x5');
  engine.settings.wordCount = 5;
  engine.settings.manualPassLimit = 10;
  engine.settings.manualPassCooldown = 0;
  engine.startSession(1, 5);
  if (engine.session.state !== 'acceptingInk') throw new Error('state not acceptingInk');
  if (engine.session.targetCorrectCount !== 5) throw new Error('target not 5');
  console.log('  OK');

  // Test 2: markCorrect progression
  console.log('Test 2: markCorrect progression');
  for (let i = 0; i < 5; i++) {
    if (engine.session.state !== 'acceptingInk') throw new Error('state not acceptingInk before correct');
    engine.markCorrect(false);
    await wait();
  }
  if (engine.session) throw new Error('session should be cleared after completion, got ' + engine.session.state);
  const history2 = JSON.parse(localStorage.getItem('wordbook_history_v1') || '[]');
  const last2 = history2[history2.length - 1];
  if (!last2 || last2.correctCount !== 5 || last2.level !== 1) throw new Error('history wrong: ' + JSON.stringify(last2));
  console.log('  OK');

  // Test 3: manualPass with audit and cooldown
  console.log('Test 3: manualPass');
  engine.settings.manualPassLimit = 3;
  engine.settings.manualPassCooldown = 2;
  engine.startSession(2, 3);
  const firstWord = engine.getCurrentInfo().word.word;
  const r1 = await engine.manualPass('data:image/png;base64,AAA');
  if (!r1.ok) throw new Error('manualPass failed: ' + r1.reason);
  await wait();
  if (engine.session.manualPassCount !== 1) throw new Error('manualPassCount not 1');
  if (engine.session.manualPassCooldown !== 1) throw new Error('cooldown not 1');
  // manualPass should be blocked because cooldown is still > 0
  if (engine.isManualPassAllowed()) throw new Error('manualPass should be blocked due to cooldown');
  // consume cooldown questions by normal correct answers
  engine.markCorrect(false); // q2
  await wait();
  if (engine.session.manualPassCooldown !== 0) throw new Error('cooldown should be 0');
  engine.markCorrect(false); // q3 -> completes
  await wait();
  if (engine.session) throw new Error('expected completion after manual+corrects');
  const audits = JSON.parse(localStorage.getItem('wordbook_audit_v1') || '[]');
  if (audits.length < 1) throw new Error('audit not saved');
  if (audits[audits.length - 1].word !== firstWord) throw new Error('audit word mismatch');
  console.log('  OK, audits saved:', audits.length);

  // Test 4: timeout penalty and incorrect retry
  console.log('Test 4: timeout penalty + incorrect retry');
  engine.settings.wordCount = 5;
  engine.settings.manualPassLimit = 0; // disable manual pass
  engine.startSession(1, 5);
  const before = engine.session.netCorrectCount;
  const targetBefore = engine.session.targetCorrectCount;
  engine.markTimeout({ silent: true });
  if (engine.session.netCorrectCount !== Math.max(0, before - 1)) throw new Error('netCorrect penalty wrong');
  if (engine.session.targetCorrectCount !== targetBefore + 1) throw new Error('target not increased');
  if (engine.session.timeoutsCount !== 1) throw new Error('timeoutsCount not 1');
  await wait(); // let presentQuestion run
  if (engine.session.state !== 'acceptingInk') throw new Error('state not acceptingInk after timeout: ' + engine.session.state);

  const idxBefore = engine.session.currentIndex;
  engine.markIncorrect();
  if (engine.session.currentIndex !== idxBefore) throw new Error('currentIndex changed after incorrect');
  console.log('  OK');

  // Test 5: history saved after completion
  console.log('Test 5: history saved');
  engine.settings.wordCount = 2;
  engine.settings.manualPassLimit = 0;
  engine.startSession(3, 2);
  engine.markCorrect(false);
  await wait();
  engine.markCorrect(false);
  await wait();
  if (engine.session) throw new Error('expected completion');
  const history = JSON.parse(localStorage.getItem('wordbook_history_v1') || '[]');
  if (history.length < 1) throw new Error('history not saved');
  const last = history[history.length - 1];
  if (last.level !== 3) throw new Error('history level not 3');
  console.log('  OK, history entries:', history.length);

  console.log('\nAll smoke tests passed.');
}

runTests().catch(e => {
  console.error('TEST FAILED:', e.message);
  console.error(e.stack);
  process.exit(1);
});
