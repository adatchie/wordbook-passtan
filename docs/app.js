const WORD_LIST_URL = 'words.json';
let targetWord = '';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let strokes = [];
let currentStroke = [];
let canvas, ctx;
let ocrController;

window.addEventListener('DOMContentLoaded', async () => {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    ocrController = new OCRController();
    await ocrController.init();
    loadNewWord();

    document.getElementById('checkBtn').addEventListener('click', checkSpelling);
    document.getElementById('nextBtn').addEventListener('click', loadNewWord);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    currentStroke = [];
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX || e.touches[0].clientX) - rect.left,
        y: (e.clientY || e.touches[0].clientY) - rect.top
    };
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    currentStroke = [{x: lastX, y: lastY}];
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    currentStroke.push({x: lastX, y: lastY});
    ctx.lineTo(lastX, lastY);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
    if (currentStroke.length > 0) strokes.push([...currentStroke]);
    currentStroke = [];
}

function handleTouchStart(e) {
    if (e.touches.length === 1) startDrawing(e.touches[0]);
}
function handleTouchMove(e) {
    if (e.touches.length === 1) draw(e.touches[0]);
}

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    currentStroke = [];
    document.getElementById('result').textContent = '';
    document.getElementById('result').className = 'result';
    document.getElementById('debugInfo').textContent = '';
}

async function loadNewWord() {
    clearCanvas();
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('result').textContent = '';
    document.getElementById('debugInfo').textContent = '';
    try {
        const response = await fetch(WORD_LIST_URL);
        const words = await response.json();
        targetWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
    } catch (error) {
        targetWord = 'error';
    }
}

async function checkSpelling() {
    const resultEl = document.getElementById('result');
    const debugEl = document.getElementById('debugInfo');
    resultEl.textContent = '認識中...';
    resultEl.className = 'result';
    debugEl.textContent = '';

    try {
        const imageData = canvas.toDataURL('image/png');
        const ocrResult = await ocrController.recognize(imageData);
        
        if (ocrResult.error) throw new Error(ocrResult.error);

        const recognizedText = ocrResult.text.toLowerCase().trim();
        const confidence = ocrResult.confidence;
        let message = '';
        let className = 'result';

        if (recognizedText === targetWord) {
            message = '正解！';
            className += ' success';
            document.getElementById('checkBtn').disabled = true;
        } else {
            message = `間違い：${recognizedText || '(文字なし)'}`;
            className += ' error';
        }

        resultEl.textContent = message;
        resultEl.className = className;
        debugEl.innerHTML = `<strong>デバッグ情報:</strong><br>期待値: ${targetWord}<br>認識結果: ${recognizedText}<br>信頼度: ${confidence.toFixed(1)}%<br>生テキスト: "${ocrResult.rawText}"`;

    } catch (error) {
        resultEl.textContent = 'エラー: ' + error.message;
        resultEl.className = 'result error';
    }
}

class OCRController {
    constructor() {
        this.worker = null;
        this.isReady = false;
    }

    async init() {
        if (this.worker) return;
        if (!window.Tesseract) throw new Error('Tesseract.js が読み込まれていません。');

        this.worker = window.Tesseract.createWorker({
            logger: m => { if (m.status === 'recognizing text') console.log(`OCR 進捗: ${(m.progress * 100).toFixed(0)}%`); }
        });

        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        await this.worker.setParameters({
            tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyz',
            preserve_interword_spaces: '1',
        });
        this.isReady = true;
    }

    async recognize(imageData) {
        if (!this.isReady) await this.init();
        try {
            const img = await this._loadImage(imageData);
            const { data } = await this.worker.recognize(img);
            return {
                text: data.text.trim(),
                rawText: data.text,
                confidence: data.confidence,
                lines: data.lines
            };
        } catch (error) {
            return { error: error.message, text: '', confidence: 0 };
        }
    }

    _loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }
}
