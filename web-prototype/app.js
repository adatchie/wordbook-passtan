'use strict';

/* ============================================================
   Wordbook Web 試作
   - 目的: UX・タイマー・難易度・筆跡PNG収集の検証
   - 備考: ブラウザでは Transformers.js + TrOCR を試験利用。iPad版では Apple Vision を使用予定
   ============================================================ */

const STORAGE_KEYS = {
  settings: 'wordbook_settings_v1',
  activeSession: 'wordbook_active_session_v1',
  history: 'wordbook_history_v1',
  audit: 'wordbook_audit_v1',
  attempts: 'wordbook_attempts_v1',
  missed: 'wordbook_missed_words_v1',
  cleared: 'wordbook_cleared_v1'
};

const DEFAULT_SETTINGS = {
  timeLimitMs: 15000,
  ttsRate: 0.9,
  wordCount: 100,
  manualPassLimit: 5,
  manualPassCooldown: 2,
  pinHash: null,
  pinSalt: null
};

const FALLBACK_WORDS = [
  {id:'w-001', word:'apple', meaningJa:'りんご', enabled:true, tags:['junior-high']},
  {id:'w-002', word:'book', meaningJa:'本', enabled:true, tags:['junior-high']},
  {id:'w-003', word:'cat', meaningJa:'猫', enabled:true, tags:['junior-high']},
  {id:'w-004', word:'dog', meaningJa:'犬', enabled:true, tags:['junior-high']},
  {id:'w-005', word:'elephant', meaningJa:'象', enabled:true, tags:['junior-high']},
  {id:'w-006', word:'flower', meaningJa:'花', enabled:true, tags:['junior-high']},
  {id:'w-007', word:'garden', meaningJa:'庭', enabled:true, tags:['junior-high']},
  {id:'w-008', word:'house', meaningJa:'家', enabled:true, tags:['junior-high']},
  {id:'w-009', word:'island', meaningJa:'島', enabled:true, tags:['junior-high']},
  {id:'w-010', word:'jacket', meaningJa:'上着', enabled:true, tags:['junior-high']},
  {id:'w-011', word:'king', meaningJa:'王', enabled:true, tags:['junior-high']},
  {id:'w-012', word:'lion', meaningJa:'ライオン', enabled:true, tags:['junior-high']},
  {id:'w-013', word:'mountain', meaningJa:'山', enabled:true, tags:['junior-high']},
  {id:'w-014', word:'night', meaningJa:'夜', enabled:true, tags:['junior-high']},
  {id:'w-015', word:'orange', meaningJa:'オレンジ', enabled:true, tags:['junior-high']},
  {id:'w-016', word:'pencil', meaningJa:'鉛筆', enabled:true, tags:['junior-high']},
  {id:'w-017', word:'queen', meaningJa:'女王', enabled:true, tags:['junior-high']},
  {id:'w-018', word:'river', meaningJa:'川', enabled:true, tags:['junior-high']},
  {id:'w-019', word:'school', meaningJa:'学校', enabled:true, tags:['junior-high']},
  {id:'w-020', word:'table', meaningJa:'テーブル', enabled:true, tags:['junior-high']},
  {id:'w-021', word:'umbrella', meaningJa:'傘', enabled:true, tags:['junior-high']},
  {id:'w-022', word:'violin', meaningJa:'バイオリン', enabled:true, tags:['junior-high']},
  {id:'w-023', word:'window', meaningJa:'窓', enabled:true, tags:['junior-high']},
  {id:'w-024', word:'yellow', meaningJa:'黄色', enabled:true, tags:['junior-high']},
  {id:'w-025', word:'zoo', meaningJa:'動物園', enabled:true, tags:['junior-high']}
];

/* ============================================================
   Utilities
   ============================================================ */

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return Array.from(document.querySelectorAll(selector)); }

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function hashPin(pin, salt) {
  const text = pin + salt;
  if (window.crypto && crypto.subtle) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return arrayBufferToBase64(buf);
  }
  // ローカル file:// などで SubtleCrypto が使えない場合の簡易フォールバック
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i);
    h |= 0;
  }
  const mixed = String(h ^ salt.length);
  return btoa(unescape(encodeURIComponent(mixed))).replace(/=+$/, '');
}

function makeSalt() {
  if (crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return arrayBufferToBase64(arr);
  }
  return Math.random().toString(36).slice(2);
}

function loadJSON(key) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; }
  catch (e) { return null; }
}

function saveJSON(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
  catch (e) { console.error('save failed', key, e); return false; }
}

function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m ? `${m}分${s}秒` : `${s}秒`;
}

/* ============================================================
   Seeded RNG / Masking / Shuffle
   ============================================================ */

function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };
}

function seededShuffle(array, seed) {
  const rng = mulberry32(seed);
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeForDisplay(word) {
  // () [] で囲まれた部分（中身ごと）を削除
  let s = word.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  // 先頭の (~) や末尾の ~ を削除
  s = s.replace(/^~\s*/, '').replace(/\s*~$/, '');
  // 残った記号を削除
  s = s.replace(/[～~()[\]【】「」{}]/g, '');
  // 連続スペースを整理
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function getMaskedPrompt(word, level, seed) {
  // 記号を除去してからマスク処理
  word = normalizeForDisplay(word);
  const chars = [...word];
  const alphaIndices = chars.map((c, i) => (/[a-zA-Z]/.test(c) ? i : -1)).filter(i => i >= 0);

  if (level === 1) return word;

  if (level === 3) {
    return chars.map((c, i) => (alphaIndices.includes(i) ? '_' : c)).join('');
  }

  // level 2
  const n = chars.length;
  let maskCount = Math.max(1, Math.round(n * 0.5));
  maskCount = Math.min(maskCount, alphaIndices.length);
  if (maskCount >= alphaIndices.length) {
    return chars.map((c, i) => (alphaIndices.includes(i) ? '_' : c)).join('');
  }

  const rng = mulberry32(seed);
  const pool = alphaIndices.slice();
  const selected = new Set();
  for (let k = 0; k < maskCount; k++) {
    const idx = Math.floor(rng() * pool.length);
    selected.add(pool[idx]);
    pool.splice(idx, 1);
  }
  return chars.map((c, i) => (selected.has(i) ? '_' : c)).join('');
}

/* ============================================================
   Settings
   ============================================================ */

async function loadSettings() {
  const stored = loadJSON(STORAGE_KEYS.settings);
  if (stored && stored.pinHash) return { ...DEFAULT_SETTINGS, ...stored };
  const salt = makeSalt();
  const hash = await hashPin('0000', salt);
  return { ...DEFAULT_SETTINGS, pinHash: hash, pinSalt: salt };
}

async function verifyPin(settings, pin) {
  const h = await hashPin(pin, settings.pinSalt);
  return h === settings.pinHash;
}

async function changePin(settings, currentPin, newPin) {
  if (!(await verifyPin(settings, currentPin))) return false;
  settings.pinSalt = makeSalt();
  settings.pinHash = await hashPin(newPin, settings.pinSalt);
  return true;
}

/* ============================================================
   Data export
   ============================================================ */

function downloadAllData() {
  const data = {
    exportedAt: new Date().toISOString(),
    settings: loadJSON(STORAGE_KEYS.settings) || DEFAULT_SETTINGS,
    activeSession: loadJSON(STORAGE_KEYS.activeSession),
    history: loadJSON(STORAGE_KEYS.history) || [],
    audit: loadJSON(STORAGE_KEYS.audit) || [],
    attempts: loadJSON(STORAGE_KEYS.attempts) || [],
    missed: loadJSON(STORAGE_KEYS.missed) || []
  };
  // PINハッシュは不要ならマスクしてもよいが、テスト用にそのまま
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wordbook_export_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Word loader
   ============================================================ */

async function loadWords() {
  try {
    const res = await fetch('words.json');
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    return data.words || [];
  } catch (e) {
    console.warn('words.json の読み込みに失敗しました。fallback 単語を使用します。', e);
    return FALLBACK_WORDS;
  }
}

/* ============================================================
   Canvas handwriting controller
   ============================================================ */

class CanvasController {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.strokes = [];
    this.isDrawing = false;
    this.currentStroke = null;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#000000';
    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', e => this.onPointerUp(e));
    window.addEventListener('pointercancel', e => this.onPointerUp(e));
  }

  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const pressure = (e.pressure && e.pressure > 0) ? e.pressure : 0.5;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure
    };
  }

  onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.isDrawing = true;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const p = this.getCoords(e);
    this.currentStroke = [p];
    this.ctx.lineWidth = Math.max(2, p.pressure * 6);
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
  }

  onPointerMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const p = this.getCoords(e);
    this.currentStroke.push(p);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineWidth = Math.max(2, p.pressure * 6);
  }

  onPointerUp(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    if (this.currentStroke && this.currentStroke.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
    this.isDrawing = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes = [];
  }

  hasDrawing() {
    return this.strokes.some(s => s.length > 0);
  }

  renderToDataURL(options = {}) {
    if (!this.hasDrawing()) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.strokes.forEach(s => s.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }));
    const pad = options.padding || 20;
    const scale = options.scale || 2;
    const width = Math.max(1, Math.ceil((maxX - minX + pad * 2) * scale));
    const height = Math.max(1, Math.ceil((maxY - minY + pad * 2) * scale));

    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = options.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = options.stroke || '#000000';
    ctx.lineWidth = Math.max(2, (options.strokeWidth || 3) * scale);
    ctx.scale(scale, scale);
    ctx.translate(pad - minX, pad - minY);

    this.strokes.forEach(s => {
      if (!s.length) return;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    });
    return c.toDataURL('image/png');
  }

  downloadPNG(filename) {
    const url = this.renderToDataURL({ padding: 20, scale: 2 });
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/* ============================================================
   OCR
   ============================================================ */

function normalizeOCRText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    // 手書きの l を 1 ! 等と誤認識することが多いので一律で l に変換
    // (1や!は他の文字に化けることがほぼないため安全)
    .replace(/[1!]/g, 'l')
    // 記号類は削除（l/fの両方に誤認しうるため一律変換は危険）
    // 欠損はレーベンシュタイン距離のファジーマッチで吸収
    .replace(/\s+/g, '')
    .replace(/[():/\\|]/g, '')
    .replace(/[^a-z]/g, '');
}

// レーベンシュタイン距離（編集距離）で文字列の近さを計算
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// 類似度（0〜1）。1.0は完全一致
function similarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

class OCRController {
  constructor() {
    this.captionerPromise = null;
    this.captioner = null;
  }

  _getTransformersURL() {
    return 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm';
  }

  getOCR() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('OCR はブラウザ環境でのみ動作します'));
    }
    if (!this.captionerPromise) {
      this.captionerPromise = (async () => {
        try {
          const mod = await import(this._getTransformersURL());
          if (!mod || !mod.pipeline) {
            throw new Error('Transformers.js の読み込みに失敗しました');
          }
          const { pipeline, env } = mod;
          env.allowLocalModels = false;
          env.useBrowserCache = true;
          if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
            env.backends.onnx.wasm.numThreads = 1;
          }
          this.captioner = await pipeline('image-to-text', 'Xenova/trocr-small-handwritten');
          return this.captioner;
        } catch (e) {
          console.error('[OCR] TrOCR 初期化失敗', e);
          this.captionerPromise = null;
          throw e;
        }
      })();
    }
    return this.captionerPromise;
  }

  async recognize(imageDataUrl) {
    const captioner = await this.getOCR();
    if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
      throw new Error('OCRに渡す手書き画像を作成できませんでした');
    }

    // Transformers.js v2 は Canvas 要素ではなく、画像URL文字列を受け取る。
    // Canvas から作った data URL をそのまま渡すと、ライブラリ側で画像として読み込める。
    const [output] = await captioner(imageDataUrl, { max_new_tokens: 64 });
    const text = ((output && output.generated_text) || '').trim();
    const confidence = text ? 100 : 0;
    return { text, confidence, metrics: {} };
  }
}

/* ============================================================
   Game Engine
   ============================================================ */

class GameEngine {
  constructor(wordsMap, wordsArray, settings, onChange) {
    this.wordsMap = wordsMap;
    this.wordsArray = wordsArray;
    this.settings = settings;
    this.onChange = onChange;
    this.session = null;
    this.timerInterval = null;
  }

  startSession(level, wordCount, setFilter, gradeFilter) {
    let enabled = this.wordsArray.map(w => w.id);
    // ブロック指定がある場合はフィルタ
    if (setFilter) {
      enabled = this.wordsArray.filter(w => w.tags && w.tags.includes(setFilter)).map(w => w.id);
    }
    // 級指定がある場合はさらにフィルタ
    if (gradeFilter) {
      enabled = enabled.filter(id => {
        const w = this.wordsMap.get(id);
        return w && w.tags && w.tags.includes(gradeFilter);
      });
    }
    this._pendingGrade = gradeFilter || null;
    this._pendingSet = setFilter || null;
    const count = Math.min(wordCount || this.settings.wordCount, enabled.length);
    const seed = Math.floor(Math.random() * 0x7fffffff);
    const order = seededShuffle(enabled, seed).slice(0, count);
    this._createSession(level, order, false);
  }

  startSessionWithMissed(level) {
    const storedIds = loadJSON(STORAGE_KEYS.missed) || [];
    const validIds = storedIds.filter(id => this.wordsMap.has(id));
    if (validIds.length === 0) return false;
    const seed = Math.floor(Math.random() * 0x7fffffff);
    const order = seededShuffle(validIds, seed);
    this._createSession(level, order, true);
    return true;
  }

  _createSession(level, wordOrder, isMissedPractice) {
    const seed = Math.floor(Math.random() * 0x7fffffff);
    this.session = {
      id: uuid(),
      level,
      grade: this._pendingGrade || null,
      set: this._pendingSet || null,
      startedAt: new Date().toISOString(),
      state: 'presentingQuestion',
      seed,
      targetCorrectCount: wordOrder.length,
      netCorrectCount: 0,
      currentIndex: 0,
      wordOrder: wordOrder.slice(),
      deadline: null,
      questionStartTime: null,
      timeoutsCount: 0,
      incorrectCount: 0,
      manualPassCount: 0,
      manualPassCooldown: 0,
      manualPassAvailable: true,
      timeoutAppliedWhileHidden: false,
      completedAt: null,
      missedWordIds: [],
      reviewIndex: 0,
      isMissedPractice: !!isMissedPractice
    };
    this._pendingGrade = null;
    this._pendingSet = null;
    this.saveSession();
    this.presentQuestion();
  }

  resume() {
    const stored = loadJSON(STORAGE_KEYS.activeSession);
    if (!stored || stored.state === 'completed') {
      localStorage.removeItem(STORAGE_KEYS.activeSession);
      return false;
    }
    this.session = stored;

    if (this.session.state === 'acceptingInk' && this.session.deadline) {
      this.session.manualPassCooldown = this.session.manualPassCooldown || 0;
      this.session.manualPassAvailable = (this.session.manualPassCooldown === 0);
      if (Date.now() > this.session.deadline && !this.session.timeoutAppliedWhileHidden) {
        this.session.timeoutAppliedWhileHidden = true;
        this.saveSession();
        this.markTimeout({ silent: true });
        return true;
      }
      this.startTimer();
      const info = this.getCurrentInfo();
      this.onChange('acceptingInk', {
        session: this.session, ...info,
        remainingMs: Math.max(0, this.session.deadline - Date.now()),
        manualPassAllowed: this.session.manualPassAvailable
      });
      return true;
    }
    if (this.session.state === 'review') {
      this.presentReviewQuestion();
      return true;
    }
    if (this.session.state === 'incorrectFeedback') {
      const info = this.getCurrentInfo();
      this.onChange('incorrectFeedback', { session: this.session, ...info });
      return true;
    }
    // その他の状態はリセットして出題し直す
    this.presentQuestion();
    return true;
  }

  _appendExtraWord() {
    if (!this.session) return;
    const enabled = this.wordsArray.map(w => w.id);
    const lastId = this.session.wordOrder[this.session.wordOrder.length - 1];
    const candidates = enabled.filter(id => id !== lastId);
    const nextId = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : enabled[0];
    this.session.wordOrder.push(nextId);
  }

  _ensureWordOrder() {
    if (!this.session) return;
    while (this.session.currentIndex >= this.session.wordOrder.length) {
      this._appendExtraWord();
    }
  }

  getCurrentInfo() {
    if (!this.session) return { word: null, prompt: '', hint: '', charCount: 0 };
    this._ensureWordOrder();
    const idx = this.session.currentIndex;
    const id = this.session.wordOrder[idx];
    const word = this.wordsMap.get(id) || null;
    if (!word) return { word: null, prompt: '', hint: '', charCount: 0 };
    const seed = this.session.seed + this.session.currentIndex * 1009 + 12345;
    const cleanWord = normalizeForDisplay(word.word);
    const prompt = getMaskedPrompt(word.word, this.session.level, seed);
    const alphaCount = [...cleanWord].filter(c => /[a-zA-Z]/.test(c)).length;
    const totalCount = [...cleanWord].length;
    const hint = this.session.level === 1 ? '' : `${totalCount}文字（英字${alphaCount}）`;
    return { word, prompt, hint, charCount: alphaCount };
  }

  presentQuestion() {
    if (!this.session || this.session.state === 'completed') return;
    const info = this.getCurrentInfo();
    this.stopTimer();

    const cooldown = this.session.manualPassCooldown || 0;
    this.session.manualPassAvailable = (cooldown === 0);
    if (cooldown > 0) this.session.manualPassCooldown = cooldown - 1;

    this.session.state = 'acceptingInk';
    this.session.questionStartTime = Date.now();
    this.session.deadline = Date.now() + this.settings.timeLimitMs;
    this.session.timeoutAppliedWhileHidden = false;
    this.saveSession();
    this.startTimer();
    this.onChange('acceptingInk', {
      session: this.session, ...info,
      remainingMs: this.settings.timeLimitMs,
      manualPassAllowed: this.session.manualPassAvailable
    });
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => this.tick(), 100);
  }

  stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  tick() {
    if (!this.session || !this.session.deadline || this.session.state !== 'acceptingInk') return;
    const now = Date.now();
    const remaining = Math.max(0, this.session.deadline - now);
    const ratio = remaining / this.settings.timeLimitMs;
    this.onChange('tick', { remainingMs: remaining, ratio });
    if (remaining <= 0) {
      this.stopTimer();
      this.markTimeout({ silent: false });
    }
  }

  markTimeout({ silent = false } = {}) {
    if (!this.session || this.session.state !== 'acceptingInk') return;
    this.stopTimer();
    this.session.netCorrectCount = Math.max(0, this.session.netCorrectCount - 1);
    this.session.targetCorrectCount += 1;
    this.session.timeoutsCount += 1;
    this._appendExtraWord();
    this.recordAttempt('timeout');
    this.session.state = 'timedOut';
    this.saveSession();
    this.onChange('timedOut', { session: this.session });
    setTimeout(() => this.presentQuestion(), silent ? 0 : 1200);
  }

  markIncorrect() {
    if (!this.session || this.session.state !== 'acceptingInk') return;
    this.stopTimer();
    this.session.state = 'incorrectFeedback';
    this.saveSession();
    this.onChange('incorrectFeedback', { session: this.session });
  }

  markWrongAndNext() {
    if (!this.session || this.session.state !== 'incorrectFeedback') return;
    const info = this.getCurrentInfo();
    if (info.word) {
      if (!this.session.missedWordIds.includes(info.word.id)) {
        this.session.missedWordIds.push(info.word.id);
      }
    }
    this.session.incorrectCount += 1;
    this.recordAttempt('incorrect');
    this.session.currentIndex += 1;
    this.saveSession();
    this.presentQuestion();
  }

  retry() {
    if (!this.session || this.session.state !== 'incorrectFeedback') return;
    this.presentQuestion();
  }

  async manualPass(imageDataUrl) {
    if (!this.session || (this.session.state !== 'acceptingInk' && this.session.state !== 'incorrectFeedback')) {
      return { ok: false, reason: 'state' };
    }
    if (!this.isManualPassAllowed()) {
      return { ok: false, reason: 'notAllowed' };
    }
    try {
      this.recordAudit(imageDataUrl);
    } catch (e) {
      console.error('監査保存失敗', e);
      return { ok: false, reason: 'auditSaveFailed' };
    }
    this.session.manualPassCount += 1;
    this.session.manualPassCooldown = this.settings.manualPassCooldown;
    this.markCorrect(true);
    return { ok: true };
  }

  checkOCR(text) {
    const info = this.getCurrentInfo();
    if (!info.word) return { matched: false, expected: '', normalized: normalizeOCRText(text), raw: text || '' };
    // 期待値も正規化して記号を無視 — アルファベットのみで比較
    const expected = normalizeOCRText(info.word.word);
    const normalized = normalizeOCRText(text);
    const sim = similarity(normalized, expected);
    // 完全一致、または許容誤差以内の近さ：
    // - 短い単語（3-6文字）は1文字違いまで許可
    // - 長い熟語（7文字以上）は類似度85%以上で許可
    const editDist = levenshtein(normalized, expected);
    const matched = expected !== '' && (
      normalized === expected ||
      (expected.length >= 3 && expected.length <= 6 && editDist <= 1 && normalized.length >= expected.length - 1) ||
      (expected.length >= 7 && sim >= 0.85)
    );
    return { matched, expected, normalized, raw: text || '', similarity: Math.round(sim * 100) };
  }

  markCorrect(isManual = false) {
    if (!this.session || (this.session.state !== 'acceptingInk' && !(this.session.state === 'incorrectFeedback' && isManual))) return;
    this.stopTimer();
    this.session.netCorrectCount += 1;
    this.recordAttempt(isManual ? 'manualPass' : 'correct');
    this.session.state = 'correctSpeakingAndTransitioning';
    this.saveSession();

    const info = this.getCurrentInfo();
    this.onChange('correctSpeakingAndTransitioning', { session: this.session, word: info.word, isManual });

    // 音声は非ブロッキングで再生（失敗しても次へ進む）
    this.speak(info.word.word);

    // 次の問題へ即座に遷移（音声の終了を待たない）
    this.session.currentIndex += 1;
    this.saveSession();
    if (this.session.netCorrectCount >= this.session.targetCorrectCount) {
      if (this.session.missedWordIds && this.session.missedWordIds.length > 0) {
        this.startReview();
      } else {
        this.completeSession();
      }
    } else {
      this.presentQuestion();
    }
  }

  isManualPassAllowed() {
    if (!this.session || (this.session.state !== 'acceptingInk' && this.session.state !== 'incorrectFeedback')) return false;
    if (this.session.manualPassAvailable === false) return false;
    return this.session.manualPassCount < this.settings.manualPassLimit;
  }

  completeSession() {
    if (!this.session) return;
    this.stopTimer();
    this.session.state = 'completed';
    this.session.completedAt = new Date().toISOString();
    this.saveSession();

    const start = new Date(this.session.startedAt).getTime();
    const duration = (Date.now() - start) / 1000;
    const missedIds = (this.session.missedWordIds || []).slice();
    const entry = {
      id: uuid(),
      sessionId: this.session.id,
      level: this.session.level,
      completedAt: this.session.completedAt,
      durationSeconds: Math.round(duration),
      targetCount: this.session.targetCorrectCount,
      correctCount: this.session.netCorrectCount,
      timeoutCount: this.session.timeoutsCount,
      incorrectCount: this.session.incorrectCount,
      manualPassCount: this.session.manualPassCount,
      missedWordIds: missedIds
    };
    const history = loadJSON(STORAGE_KEYS.history) || [];
    history.push(entry);
    saveJSON(STORAGE_KEYS.history, history);

    // クリア状態を記録（正答率80%以上でクリア扱い）
    if (this.session.grade && this.session.set && this.session.level) {
      const accuracy = this.session.netCorrectCount / this.session.targetCorrectCount;
      if (accuracy >= 0.8) {
        const cleared = loadJSON(STORAGE_KEYS.cleared) || {};
        const key = `${this.session.grade}:${this.session.set}:Lv${this.session.level}`;
        cleared[key] = {
          completedAt: this.session.completedAt,
          accuracy: Math.round(accuracy * 100),
          durationSeconds: Math.round(duration)
        };
        saveJSON(STORAGE_KEYS.cleared, cleared);
      }
    }

    const missedWords = missedIds
      .map(id => {
        const w = this.wordsMap.get(id);
        return w ? { id, word: w.word, meaningJa: w.meaningJa } : null;
      })
      .filter(Boolean);

    this._updateMissedStorage(missedIds);

    this.onChange('completed', { session: this.session, history: entry, missedWords });
    this.session = null;
    localStorage.removeItem(STORAGE_KEYS.activeSession);
  }

  _updateMissedStorage(currentMissedIds) {
    if (this.session && this.session.isMissedPractice) {
      // 間違い直しモードでは結果をそのまま反映
      saveJSON(STORAGE_KEYS.missed, [...new Set(currentMissedIds)]);
    } else {
      const stored = loadJSON(STORAGE_KEYS.missed) || [];
      const merged = [...new Set([...stored, ...currentMissedIds])];
      saveJSON(STORAGE_KEYS.missed, merged);
    }
  }

  startReview() {
    if (!this.session) return;
    this.session.state = 'review';
    this.session.reviewIndex = 0;
    this.saveSession();
    this.presentReviewQuestion();
  }

  presentReviewQuestion() {
    if (!this.session) return;
    const missed = this.session.missedWordIds || [];
    while (this.session.reviewIndex < missed.length) {
      const id = missed[this.session.reviewIndex];
      const word = this.wordsMap.get(id) || null;
      if (word) break;
      this.session.reviewIndex += 1;
    }
    if (this.session.reviewIndex >= missed.length) {
      this.completeSession();
      return;
    }
    const word = this.wordsMap.get(missed[this.session.reviewIndex]);
    const reviewLevel = Math.max(1, this.session.level - 1);
    const seed = this.session.seed + this.session.reviewIndex * 1009 + 999999;
    const prompt = getMaskedPrompt(word.word, reviewLevel, seed);
    const alphaCount = [...word.word].filter(c => /[a-zA-Z]/.test(c)).length;
    const totalCount = [...word.word].length;
    const hint = `${word.meaningJa}（${totalCount}文字・英字${alphaCount}）`;
    this.stopTimer();
    this.session.state = 'review';
    this.session.deadline = null;
    this.saveSession();
    this.onChange('review', {
      session: this.session,
      word,
      prompt,
      hint,
      reviewIndex: this.session.reviewIndex,
      remainingMs: this.settings.timeLimitMs
    });
  }

  reviewNext() {
    if (!this.session || this.session.state !== 'review') return;
    this.session.reviewIndex += 1;
    this.saveSession();
    this.presentReviewQuestion();
  }

  suspend() {
    this.stopTimer();
    if (this.session) this.saveSession();
  }

  checkBackgroundTimeout() {
    if (!this.session || this.session.state !== 'acceptingInk' || !this.session.deadline) return;
    if (this.session.timeoutAppliedWhileHidden) return;
    if (Date.now() < this.session.deadline) return;
    this.session.timeoutAppliedWhileHidden = true;
    this.saveSession();
    this.markTimeout({ silent: true });
  }

  speak(text) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = this.settings.ttsRate;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // 失敗は無視（音声なしくてもゲームは続行）
    }
  }

  recordAttempt(resultType) {
    if (!this.session) return;
    const info = this.getCurrentInfo();
    const attempt = {
      id: uuid(),
      sessionId: this.session.id,
      wordId: info.word ? info.word.id : null,
      word: info.word ? info.word.word : null,
      resultType,
      timestamp: new Date().toISOString(),
      level: this.session.level,
      currentIndex: this.session.currentIndex,
      netCorrectAfter: this.session.netCorrectCount,
      targetAfter: this.session.targetCorrectCount
    };
    const attempts = loadJSON(STORAGE_KEYS.attempts) || [];
    attempts.push(attempt);
    saveJSON(STORAGE_KEYS.attempts, attempts);
  }

  recordAudit(imageDataUrl) {
    if (!this.session) return;
    const info = this.getCurrentInfo();
    const attemptNumber = (this.session.netCorrectCount + this.session.incorrectCount + this.session.timeoutsCount + 1);
    const audit = {
      id: uuid(),
      sessionId: this.session.id,
      attemptId: uuid(),
      wordId: info.word ? info.word.id : null,
      word: info.word ? info.word.word : null,
      meaningJa: info.word ? info.word.meaningJa : null,
      promptText: info.prompt,
      level: this.session.level,
      imageDataUrl,
      ocrInfo: 'Web試作：OCR未実行',
      remainingTimeMs: this.session.deadline ? Math.max(0, this.session.deadline - Date.now()) : 0,
      attemptNumber,
      createdAt: new Date().toISOString(),
      status: 'unconfirmed'
    };
    const audits = loadJSON(STORAGE_KEYS.audit) || [];
    audits.push(audit);
    if (!saveJSON(STORAGE_KEYS.audit, audits)) {
      throw new Error('監査記録の保存に失敗しました');
    }
  }

  saveSession() {
    if (this.session) saveJSON(STORAGE_KEYS.activeSession, this.session);
    else localStorage.removeItem(STORAGE_KEYS.activeSession);
  }
}

/* ============================================================
   UI Controller
   ============================================================ */

class UIController {
  constructor() {
    this.engine = null;
    this.canvasCtrl = null;
    this.settings = null;
    this.els = {};
  }

  init(engine, canvasCtrl, settings) {
    this.engine = engine;
    this.canvasCtrl = canvasCtrl;
    this.settings = settings;
    this.ocr = new OCRController();
    this.cacheElements();
    this.bindEvents();
    this.updateMainScreen();
  }

  cacheElements() {
    this.els.screens = $$('.screen');
    this.els.dialog = $('#confirm-dialog');
    this.els.confirmMessage = $('#confirm-message');
    this.els.confirmYes = $('#confirm-yes');
    this.els.confirmNo = $('#confirm-no');

    this.els.sessionLevel = $('#session-level');
    this.els.sessionProgress = $('#session-progress');
    this.els.timerFill = $('#timer-fill');
    this.els.timerText = $('#timer-text');
    this.els.correctBtn = $('#btn-correct');
    this.els.prompt = $('#question-prompt');
    this.els.meaning = $('#question-meaning');
    this.els.hint = $('#question-hint');
    this.els.feedback = $('#feedback');
    this.els.manualPassBtn = $('#btn-manual-pass');
    this.els.retryBtn = $('#btn-retry');
    this.els.rewriteBtn = $('#btn-rewrite');
    this.els.ocrDebug = $('#ocr-debug');
    this.els.savePngBtn = $('#btn-save-png');
    this.els.manualPassStatus = $('#manual-pass-status');
    this.els.previousList = $('#previous-list');
    this.els.activeSessionInfo = $('#active-session-info');
    this.els.resumeBtn = $('#btn-resume');
    this.els.clearSessionBtn = $('#btn-clear-session');
    this.els.missedL1 = $('#btn-missed-l1');
    this.els.missedL2 = $('#btn-missed-l2');
    this.els.missedL3 = $('#btn-missed-l3');
    this.els.historyList = $('#history-list');
    this.els.auditList = $('#audit-list');
    this.els.completionSummary = $('#completion-summary');
  }

  showScreen(id) {
    this.els.screens.forEach(s => s.classList.remove('active'));
    const target = $(`#${id}`);
    if (target) target.classList.add('active');
  }

  openConfirm(message, onYes) {
    this.els.confirmMessage.textContent = message;
    this.els.dialog.showModal();
    const yesHandler = () => {
      this.els.dialog.close();
      this.els.confirmYes.removeEventListener('click', yesHandler);
      this.els.confirmNo.removeEventListener('click', noHandler);
      onYes();
    };
    const noHandler = () => {
      this.els.dialog.close();
      this.els.confirmYes.removeEventListener('click', yesHandler);
      this.els.confirmNo.removeEventListener('click', noHandler);
    };
    this.els.confirmYes.addEventListener('click', yesHandler);
    this.els.confirmNo.addEventListener('click', noHandler);
  }

  updateMainScreen() {
    const active = loadJSON(STORAGE_KEYS.activeSession);
    if (active && active.state !== 'completed') {
      this.els.resumeBtn.classList.remove('hidden');
      this.els.clearSessionBtn.classList.remove('hidden');
      this.els.activeSessionInfo.classList.remove('hidden');
      const lv = active.level;
      const prog = `${active.netCorrectCount} / ${active.targetCorrectCount}`;
      this.els.activeSessionInfo.textContent = `再開可能: Lv${lv} (${prog})`;
    } else {
      this.els.resumeBtn.classList.add('hidden');
      this.els.clearSessionBtn.classList.add('hidden');
      this.els.activeSessionInfo.classList.add('hidden');
    }

    const missedIds = loadJSON(STORAGE_KEYS.missed) || [];
    const hasMissed = missedIds.length > 0;
    [this.els.missedL1, this.els.missedL2, this.els.missedL3].forEach(btn => {
      btn.classList.toggle('hidden', !hasMissed);
    });
  }

  renderSetGrid() {
    const grid = $('#set-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const circled = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
    const grade = this.selectedGrade || 'eiken-grade3';
    const cleared = loadJSON(STORAGE_KEYS.cleared) || {};
    // 選択中の級の単語だけからブロック番号を計算
    const gradeWords = this.engine.wordsArray.filter(w => w.tags && w.tags.includes(grade));
    const maxSet = Math.max(...gradeWords.map(w => {
      const t = w.tags.find(x => x.startsWith('set'));
      return t ? parseInt(t.slice(3)) : 0;
    }).filter(n => n > 0));

    for (let i = 1; i <= maxSet; i++) {
      const setTag = `set${i}`;
      const count = gradeWords.filter(w => w.tags && w.tags.includes(setTag)).length;
      if (count === 0) continue;
      // クリア済みのLv数をカウント
      let clearedLvs = [];
      for (let lv = 1; lv <= 3; lv++) {
        if (cleared[`${grade}:${setTag}:Lv${lv}`]) clearedLvs.push(lv);
      }
      const clearBadge = clearedLvs.length > 0
        ? `<span class="set-clear">✓Lv${clearedLvs.join('')}</span>`
        : '';
      const btn = document.createElement('button');
      btn.className = 'set-card-btn';
      if (clearedLvs.length === 3) btn.classList.add('all-cleared');
      btn.innerHTML = `<span class="set-num">${circled[i-1] || i}</span><span class="set-count">${count}語</span>${clearBadge}`;
      btn.addEventListener('click', () => {
        this.selectedSet = setTag;
        const title = $('#level-select-title');
        const gradeLabel = grade === 'eiken-pre2' ? '準2級' : '3級';
        if (title) title.textContent = `${gradeLabel} ${circled[i-1] || i}（${count}語）`;
        // Lvボタンのクリア状態を更新
        for (let lv = 1; lv <= 3; lv++) {
          const lvBtn = $(`#btn-start-l${lv}`);
          if (!lvBtn) continue;
          const isCleared = cleared[`${grade}:${setTag}:Lv${lv}`];
          if (isCleared) {
            lvBtn.classList.add('lv-cleared');
            lvBtn.textContent = `Lv${lv} ✓（正答率${isCleared.accuracy}%）`;
          } else {
            lvBtn.classList.remove('lv-cleared');
            lvBtn.textContent = lv === 1 ? 'Lv1 書き写し' : (lv === 2 ? 'Lv2 部分隠し' : 'Lv3 完全記憶');
          }
        }
        const overlay = $('#level-select-overlay');
        if (overlay) overlay.classList.remove('hidden');
      });
      grid.appendChild(btn);
    }
  }

  bindEvents() {
    this.selectedSet = null;
    this.selectedGrade = 'eiken-grade3';

    // 級タブ切り替え
    document.querySelectorAll('.grade-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.grade-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedGrade = tab.dataset.grade;
        this.renderSetGrid();
      });
    });

    // ブロック選択グリッドを構築
    this.renderSetGrid();

    // ブロックボタン → レベル選択オーバーレイ表示
    const levelOverlay = $('#level-select-overlay');

    // レベル選択の開始
    const start = (lv) => {
      this.engine.startSession(lv, this.settings.wordCount, this.selectedSet, this.selectedGrade);
      levelOverlay.classList.add('hidden');
      this.showScreen('screen-session');
    };
    $('#btn-start-l1').addEventListener('click', () => start(1));
    $('#btn-start-l2').addEventListener('click', () => start(2));
    $('#btn-start-l3').addEventListener('click', () => start(3));
    $('#btn-level-cancel').addEventListener('click', () => {
      levelOverlay.classList.add('hidden');
      this.selectedSet = null;
    });

    const startMissed = (lv) => {
      if (!this.engine.startSessionWithMissed(lv)) {
        alert('間違った問題リストが空です');
      } else {
        this.showScreen('screen-session');
      }
    };
    this.els.missedL1.addEventListener('click', () => startMissed(1));
    this.els.missedL2.addEventListener('click', () => startMissed(2));
    this.els.missedL3.addEventListener('click', () => startMissed(3));

    this.els.resumeBtn.addEventListener('click', () => {
      if (this.engine.resume()) this.showScreen('screen-session');
    });
    this.els.clearSessionBtn.addEventListener('click', () => {
      this.openConfirm('中断中のセッションを消去しますか？', () => {
        localStorage.removeItem(STORAGE_KEYS.activeSession);
        this.engine.session = null;
        this.updateMainScreen();
      });
    });

    $('#btn-settings').addEventListener('click', () => this.openSettings());
    $('#btn-settings-back').addEventListener('click', () => this.showScreen('screen-main'));
    $('#btn-save-settings').addEventListener('click', () => this.saveSettings());
    $('#btn-reset-data').addEventListener('click', () => this.resetAllData());

    $('#btn-history').addEventListener('click', () => this.openHistory());
    $('#btn-history-back').addEventListener('click', () => this.showScreen('screen-main'));

    $('#btn-parent').addEventListener('click', () => this.showScreen('screen-parent-login'));
    $('#btn-parent-login-back').addEventListener('click', () => this.showScreen('screen-main'));
    $('#btn-parent-login').addEventListener('click', () => this.loginParent());
    $('#btn-parent-back').addEventListener('click', () => this.showScreen('screen-main'));

    $('#btn-correct').addEventListener('click', () => this.onCorrect().catch(e => console.error(e)));
    this.els.manualPassBtn.addEventListener('click', () => this.onManualPass());
    this.els.retryBtn.addEventListener('click', () => this.onRetry());
    this.els.rewriteBtn.addEventListener('click', () => this.onRewrite());
    this.els.savePngBtn.addEventListener('click', () => this.onSavePng());
    $('#btn-pause').addEventListener('click', () => {
      this.engine.suspend();
      this.updateMainScreen();
      this.showScreen('screen-main');
    });

    $('#btn-download-session').addEventListener('click', () => downloadAllData());
    $('#btn-back-menu').addEventListener('click', () => {
      this.updateMainScreen();
      this.renderSetGrid();
      this.showScreen('screen-main');
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.engine.suspend();
      } else {
        this.engine.checkBackgroundTimeout();
      }
    });
    window.addEventListener('beforeunload', () => this.engine.suspend());
  }

  onEngineChange(state, payload) {
    switch (state) {
      case 'acceptingInk':
        this.showScreen('screen-session');
        if (payload.session && payload.session.currentIndex === 0) {
          this.els.previousList.innerHTML = '';
        }
        this.canvasCtrl.clear();
        this.els.correctBtn.textContent = 'できた！';
        this.els.retryBtn.innerHTML = '× 間違いとして次へ';
        if (this.els.rewriteBtn) {
          this.els.rewriteBtn.style.display = 'inline-block';
          this.els.rewriteBtn.textContent = 'もう一度書く';
        }
        if (this.els.ocrDebug) this.els.ocrDebug.style.display = 'none';
        this.updateQuestion(payload);
        this.updateTimer({ remainingMs: payload.remainingMs, ratio: 1 });
        this.setFeedback('', '');
        this.updateManualPassStatus();
        this.setControlsEnabled(true);
        break;
      case 'tick':
        this.updateTimer(payload);
        break;
      case 'correctSpeakingAndTransitioning':
        this.setControlsEnabled(false);
        this.setFeedback('せいかい！', 'correct');
        if (payload.word) {
          const item = document.createElement('div');
          item.className = 'item' + (payload.isManual ? ' manual' : '');
          item.textContent = `${payload.word.word} — ${payload.word.meaningJa}${payload.isManual ? ' （手動）' : ''}`;
          this.els.previousList.appendChild(item);
          this.els.previousList.scrollTop = this.els.previousList.scrollHeight;
        }
        break;
      case 'incorrectFeedback':
        this.setControlsEnabled(false);
        this.els.correctBtn.textContent = 'できた！';
        this.els.retryBtn.innerHTML = '間違いのまま次へ';
        this.els.retryBtn.disabled = false;
        if (this.els.rewriteBtn) {
          this.els.rewriteBtn.style.display = 'inline-block';
          this.els.rewriteBtn.textContent = 'もう一度書く';
          this.els.rewriteBtn.disabled = false;
        }
        this.els.manualPassBtn.disabled = !this.engine.isManualPassAllowed();
        this.els.manualPassStatus.textContent = this.engine.isManualPassAllowed() ? '手動正解を使う' : '';
        this.setFeedback('OCRは「間違い」と判定しました。手動正解するか、もう一度書くか、間違いとして次へ進んでください。', 'incorrect');
        break;
      case 'review':
        this.showScreen('screen-session');
        this.canvasCtrl.clear();
        this.els.correctBtn.textContent = '次へ';
        this.els.retryBtn.innerHTML = '× 間違いとして次へ';
        if (this.els.rewriteBtn) this.els.rewriteBtn.style.display = 'none';
        this.els.manualPassBtn.disabled = true;
        this.els.savePngBtn.disabled = true;
        this.updateQuestion(payload);
        this.updateTimer({ remainingMs: payload.remainingMs, ratio: 1 });
        this.setFeedback('復習（Lvを下げて再提示）', 'review');
        this.setControlsEnabled(true);
        this.els.manualPassBtn.disabled = true;
        this.els.retryBtn.disabled = true;
        this.els.savePngBtn.disabled = true;
        break;
      case 'timedOut':
        this.setControlsEnabled(false);
        if (this.els.rewriteBtn) this.els.rewriteBtn.style.display = 'none';
        this.setFeedback('時間切れ（1点減点・目標+1）', 'timeout');
        break;
      case 'completed':
        this.showCompletion(payload.history, payload.missedWords);
        break;
    }
  }

  updateQuestion({ word, prompt, hint }) {
    if (!word) return;
    this.els.prompt.textContent = prompt;
    this.els.meaning.textContent = word.meaningJa;
    this.els.hint.textContent = hint;
    this.els.sessionLevel.textContent = `Lv${this.engine.session.level}`;
    this.els.sessionProgress.textContent = `${this.engine.session.netCorrectCount} / ${this.engine.session.targetCorrectCount}`;
  }

  updateTimer({ remainingMs, ratio }) {
    const percent = Math.max(0, Math.min(100, ratio * 100));
    this.els.timerFill.style.width = `${percent}%`;
    this.els.timerText.textContent = (remainingMs / 1000).toFixed(1);

    const fill = this.els.timerFill;
    fill.classList.remove('urgent', 'danger');
    if (remainingMs <= 3000) fill.classList.add('danger');
    else if (remainingMs <= 7000) fill.classList.add('urgent');
  }

  setFeedback(text, type) {
    const f = this.els.feedback;
    f.textContent = text;
    f.className = 'feedback' + (type ? ` ${type}` : '');
    f.classList.toggle('hidden', !text);
  }

  setControlsEnabled(enabled) {
    $('#btn-correct').disabled = !enabled;
    this.els.manualPassBtn.disabled = !enabled;
    this.els.retryBtn.disabled = !enabled;
    if (this.els.rewriteBtn) this.els.rewriteBtn.disabled = !enabled;
    this.els.savePngBtn.disabled = !enabled;
    $('#btn-pause').disabled = !enabled;
    $('#draw-canvas').style.pointerEvents = enabled ? 'auto' : 'none';
  }

  async onCorrect() {
    if (this.engine.session && this.engine.session.state === 'review') {
      this.engine.reviewNext();
      return;
    }
    if (!this.canvasCtrl.hasDrawing()) {
      alert('まだ何も書かれていません');
      return;
    }
    await this.runOCR();
  }

  onRetry() {
    if (this.engine.session && this.engine.session.state === 'incorrectFeedback') {
      this.engine.markWrongAndNext();
    } else if (this.engine.session && this.engine.session.state === 'acceptingInk') {
      this.engine.markIncorrect();
    }
  }

  onRewrite() {
    if (!this.engine.session) return;
    if (this.engine.session.state === 'acceptingInk') {
      this.canvasCtrl.clear();
    } else if (this.engine.session.state === 'incorrectFeedback') {
      this.engine.retry();
    }
  }

  async runOCR() {
    if (!this.engine.session || this.engine.session.state !== 'acceptingInk') return;

    this.engine.stopTimer();
    this.setControlsEnabled(false);
    this.setFeedback('OCR認識中…', '');

    try {
      const image = this.canvasCtrl.renderToDataURL({ padding: 30, scale: 4, background: '#ffffff', stroke: '#000000' });
      const result = await this.ocr.recognize(image);
      console.log('[OCR]', result);
      const check = this.engine.checkOCR(result.text);
      const confidence = result.confidence || 0;
      const metrics = result.metrics || {};
      const rawText = (result.text || '(読み取れず)').trim();
      const normText = check.normalized || '(なし)';
      const simText = check.similarity !== undefined ? ` / 類似度: ${check.similarity}%` : '';
      const debugText = `期待: ${check.expected || '(なし)'} / 正規化: ${normText} / raw: ${rawText}${simText}`;
      if (this.els.ocrDebug) {
        this.els.ocrDebug.textContent = debugText;
        this.els.ocrDebug.style.display = 'block';
      }

      if (check.matched && confidence >= 60) {
        const matchLabel = check.normalized === check.expected ? '完全一致' : `類似度${check.similarity}%`;
        this.setFeedback(`OCR正解「${check.normalized}」（${matchLabel}）`, 'correct');
        this.engine.markCorrect(false);
      } else {
        this.setFeedback(`OCR結果「${check.normalized || result.text || '（読み取れませんでした）'}」（信頼度 ${Math.round(confidence)}%${simText}）`, 'incorrect');
        this.engine.markIncorrect();
      }
    } catch (e) {
      console.error(e);
      if (this.els.ocrDebug) {
        this.els.ocrDebug.textContent = 'OCRエラー: ' + (e.message || '不明');
        this.els.ocrDebug.style.display = 'block';
      }
      this.setFeedback('OCRエラー: ' + (e.message || '不明'), 'incorrect');
      this.setControlsEnabled(true);
    }
  }

  updateManualPassStatus() {
    const session = this.engine.session;
    const limit = this.settings.manualPassLimit;
    const count = session ? session.manualPassCount : 0;
    const remaining = limit - count;

    if (this.engine.isManualPassAllowed()) {
      this.els.manualPassBtn.disabled = false;
      this.els.manualPassStatus.textContent = `手動正解残り ${remaining} 回`;
    } else if (!session || count >= limit) {
      this.els.manualPassBtn.disabled = true;
      this.els.manualPassStatus.textContent = '手動正解の上限に達しました';
    } else if (session.manualPassAvailable === false) {
      const wait = (session.manualPassCooldown || 0) + 1;
      this.els.manualPassBtn.disabled = true;
      this.els.manualPassStatus.textContent = `手動正解まであと ${wait} 問`;
    } else {
      this.els.manualPassBtn.disabled = true;
      this.els.manualPassStatus.textContent = '手動正解は使えません';
    }
  }

  onManualPass() {
    if (!this.engine.isManualPassAllowed()) {
      alert('今は手動正解が使えません');
      return;
    }
    if (!this.canvasCtrl.hasDrawing()) {
      alert('まだ何も書かれていません');
      return;
    }
    this.openConfirm('手動正解を使いますか？\n（筆跡画像と問題情報を保護者確認記録に保存します）', async () => {
      const image = this.canvasCtrl.renderToDataURL({ padding: 20, scale: 2 });
      if (!image) { alert('画像の作成に失敗しました'); return; }
      const result = await this.engine.manualPass(image);
      if (!result.ok) {
        if (result.reason === 'auditSaveFailed') alert('監査記録の保存に失敗しました。手動正解を取り消します。');
        else alert('手動正解が使えませんでした');
      }
    });
  }

  onSavePng() {
    const info = this.engine.getCurrentInfo();
    const word = info.word ? info.word.word : 'wordbook';
    this.canvasCtrl.downloadPNG(`${word}_${Date.now()}.png`);
  }

  /* ---- Settings ---- */
  openSettings() {
    $('#setting-time-limit').value = (this.settings.timeLimitMs / 1000).toString();
    $('#setting-tts-rate').value = this.settings.ttsRate.toString();
    $('#setting-word-count').value = this.settings.wordCount.toString();
    $('#setting-manual-limit').value = this.settings.manualPassLimit.toString();
    $('#setting-manual-cooldown').value = this.settings.manualPassCooldown.toString();
    $('#setting-current-pin').value = '';
    $('#setting-new-pin').value = '';
    this.showScreen('screen-settings');
  }

  async saveSettings() {
    const currentPin = $('#setting-current-pin').value.trim();
    if (!currentPin) { alert('設定を変更するには現在のPINを入力してください'); return; }
    if (!(await verifyPin(this.settings, currentPin))) { alert('PINが違います'); return; }

    const timeSec = parseInt($('#setting-time-limit').value, 10);
    const ttsRate = parseFloat($('#setting-tts-rate').value);
    const wordCount = parseInt($('#setting-word-count').value, 10);
    const manualLimit = parseInt($('#setting-manual-limit').value, 10);
    const manualCooldown = parseInt($('#setting-manual-cooldown').value, 10);
    const newPin = $('#setting-new-pin').value.trim();

    if (isNaN(timeSec) || timeSec < 3 || timeSec > 60) { alert('制限時間は3〜60秒で入力してください'); return; }
    if (isNaN(ttsRate) || ttsRate < 0.3 || ttsRate > 2.0) { alert('TTS速度は0.3〜2.0で入力してください'); return; }
    if (isNaN(wordCount) || wordCount < 5 || wordCount > 1000) { alert('問題数を5〜1000で入力してください'); return; }
    if (isNaN(manualLimit) || manualLimit < 0) { alert('手動正解上限を0以上にしてください'); return; }
    if (isNaN(manualCooldown) || manualCooldown < 0) { alert('クールダウンを0以上にしてください'); return; }

    if (newPin) {
      if (!/^\d{4,6}$/.test(newPin)) { alert('新しいPINは4〜6桁の数字にしてください'); return; }
      this.settings.pinSalt = makeSalt();
      this.settings.pinHash = await hashPin(newPin, this.settings.pinSalt);
    }

    this.settings.timeLimitMs = timeSec * 1000;
    this.settings.ttsRate = ttsRate;
    this.settings.wordCount = wordCount;
    this.settings.manualPassLimit = manualLimit;
    this.settings.manualPassCooldown = manualCooldown;
    this.engine.settings = this.settings;

    if (saveJSON(STORAGE_KEYS.settings, this.settings)) {
      alert('設定を保存しました');
      this.showScreen('screen-main');
    } else {
      alert('設定の保存に失敗しました');
    }
  }

  async resetAllData() {
    const currentPin = $('#setting-current-pin').value.trim();
    if (!currentPin) { alert('PINを入力してください'); return; }
    if (!(await verifyPin(this.settings, currentPin))) { alert('PINが違います'); return; }
    this.openConfirm('すべてのデータを消去しますか？\n（履歴・監査記録・中断セッションが失われます）', () => {
      clearAllStorage();
      // PINだけは初期化し直す
      (async () => {
        const salt = makeSalt();
        const hash = await hashPin('0000', salt);
        this.settings = { ...DEFAULT_SETTINGS, pinHash: hash, pinSalt: salt };
        saveJSON(STORAGE_KEYS.settings, this.settings);
        this.engine.settings = this.settings;
        this.engine.session = null;
        this.updateMainScreen();
        this.showScreen('screen-main');
        alert('データを消去し、PINを 0000 に戻しました');
      })();
    });
  }

  /* ---- History ---- */
  openHistory() {
    const history = loadJSON(STORAGE_KEYS.history) || [];
    const list = this.els.historyList;
    list.innerHTML = '';
    if (history.length === 0) {
      list.innerHTML = '<div class="card">履歴がありません</div>';
    } else {
      history.slice().reverse().forEach(h => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <div class="title">Lv${h.level} — ${formatDate(h.completedAt)}</div>
          <div>正答: ${h.correctCount} / ${h.targetCount}</div>
          <div>タイムアウト: ${h.timeoutCount}, 誤答: ${h.incorrectCount}, 手動正解: ${h.manualPassCount}</div>
          <div>所要時間: ${formatDuration(h.durationSeconds)}</div>
        `;
        list.appendChild(div);
      });
    }
    this.showScreen('screen-history');
  }

  /* ---- Parent / Audit ---- */
  async loginParent() {
    const pin = $('#parent-pin').value.trim();
    if (!pin) { alert('PINを入力してください'); return; }
    if (await verifyPin(this.settings, pin)) {
      $('#parent-pin').value = '';
      this.renderAudit();
      this.showScreen('screen-parent');
    } else {
      alert('PINが違います');
    }
  }

  renderAudit() {
    const audits = loadJSON(STORAGE_KEYS.audit) || [];
    const list = this.els.auditList;
    list.innerHTML = '';
    if (audits.length === 0) {
      list.innerHTML = '<div class="card">監査記録がありません</div>';
      return;
    }
    // 未確認を上に
    const sorted = audits.slice().sort((a, b) => {
      const sa = a.status === 'unconfirmed' ? 0 : 1;
      const sb = b.status === 'unconfirmed' ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sorted.forEach((a, index) => {
      const originalIndex = audits.indexOf(a);
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="title">${a.word} — ${a.meaningJa}</div>
        <div>Lv${a.level} / ${formatDate(a.createdAt)} / 残り${(a.remainingTimeMs/1000).toFixed(1)}秒</div>
        <div>表示問題: ${a.promptText}</div>
        <div>状態: ${this.statusLabel(a.status)}</div>
        ${a.imageDataUrl ? `<img src="${a.imageDataUrl}" alt="筆跡">` : '<div>画像は確認済みにより削除されました</div>'}
        <div class="actions">
          <button class="secondary" data-action="checked" data-idx="${originalIndex}">確認済み</button>
          <button class="danger" data-action="suspicious" data-idx="${originalIndex}">要注意</button>
        </div>
      `;
      list.appendChild(div);
    });

    list.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const action = e.target.dataset.action;
        this.updateAuditStatus(idx, action);
      });
    });
  }

  statusLabel(status) {
    if (status === 'unconfirmed') return '未確認';
    if (status === 'checked') return '確認済み';
    if (status === 'suspicious') return '要注意';
    return status;
  }

  updateAuditStatus(index, status) {
    const audits = loadJSON(STORAGE_KEYS.audit) || [];
    if (audits[index]) {
      audits[index].status = status;
      // 確認済みであれば画像を削除して容量を節約（保持期間の終了）
      if (status === 'checked') audits[index].imageDataUrl = null;
      saveJSON(STORAGE_KEYS.audit, audits);
      this.renderAudit();
    }
  }

  /* ---- Completion ---- */
  showCompletion(history, missedWords) {
    const s = history;
    let missedHtml = '';
    if (missedWords && missedWords.length > 0) {
      const items = missedWords.map(m => `<li><strong>${m.word}</strong> — ${m.meaningJa}</li>`).join('');
      missedHtml = `
        <div class="missed-review">
          <h3>間違った問題の振り返り</h3>
          <ul>${items}</ul>
        </div>
      `;
    }
    this.els.completionSummary.innerHTML = `
      <p><strong>Lv${s.level}</strong> 完了</p>
      <p>正答数: ${s.correctCount} / ${s.targetCount}</p>
      <p>タイムアウト: ${s.timeoutCount}, 誤答: ${s.incorrectCount}, 手動正解: ${s.manualPassCount}</p>
      <p>所要時間: ${formatDuration(s.durationSeconds)}</p>
      ${missedHtml}
    `;
    this.showScreen('screen-completion');
    this.updateMainScreen();
  }
}

/* ============================================================
   Boot
   ============================================================ */

async function boot() {
  const settings = await loadSettings();
  const words = await loadWords();
  const wordsMap = new Map(words.filter(w => w.enabled !== false).map(w => [w.id, w]));
  const wordsArray = Array.from(wordsMap.values());

  const canvas = $('#draw-canvas');
  const canvasCtrl = new CanvasController(canvas);

  const ui = new UIController();
  const engine = new GameEngine(wordsMap, wordsArray, settings, (state, payload) => {
    ui.onEngineChange(state, payload);
  });

  ui.init(engine, canvasCtrl, settings);
  // 開発・テスト用に公開（本番 iOS 版には不要）
  if (typeof window !== 'undefined') {
    window.__wordbook = { engine, ui, canvasCtrl, settings };
  }

  // iOS Safari/Chrome は speechSynthesis を初回タップ時にアンロックする必要がある
  // 実際の短い単語を発話させてエンジンを有効化（cancelしないことが重要）
  // さらに、ページがアクティブになるたびにエンジンを再活性化する
  let ttsUnlocked = false;
  function unlockTTS() {
    if (!window.speechSynthesis) return;
    try {
      // pause→resumeサイクルでエンジンを強制起動
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      if (!ttsUnlocked) {
        ttsUnlocked = true;
        const u = new SpeechSynthesisUtterance('hi');
        u.volume = 0;
        u.rate = 10;
        window.speechSynthesis.speak(u);
      }
    } catch(e) {}
  }
  document.addEventListener('click', unlockTTS);
  document.addEventListener('touchend', unlockTTS);

  // ページが再びアクティブになった時もエンジンを再起動
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.speechSynthesis) {
      try { window.speechSynthesis.resume(); } catch(e) {}
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
