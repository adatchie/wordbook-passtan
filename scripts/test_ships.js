#!/usr/bin/env node
// ships.js + app.js 統合テスト: 配属→レア解放→図鑑描画データの検証
const fs = require('fs');
const path = '/tmp/wb_passtan/docs';

const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
global.STORAGE_KEYS = { cleared: 'wordbook_cleared_v1' };
global.loadJSON = k => { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; };
global.saveJSON = (k, o) => { localStorage.setItem(k, JSON.stringify(o)); return true; };

const shipsSrc = fs.readFileSync(path + '/ships.js', 'utf8')
  .replace("const Ships = (", "var ShipsT = (")
  .replace(/'use strict';/, '');
eval(shipsSrc);
const Ships = ShipsT;

let fails = 0;
function assert(cond, msg) { if (!cond) { console.error('FAIL:', msg); fails++; } }

// 1. FLEET 79隻 & manifest一致
assert(Ships.FLEET.length === 79, `FLEET=79 (実際${Ships.FLEET.length})`);
const manifest = JSON.parse(fs.readFileSync(path + '/img/ships/manifest.json', 'utf8'));
const missingImg = Ships.FLEET.filter(s => !manifest[s.id]);
assert(missingImg.length === 0, `manifest欠け: ${missingImg.map(s => s.id).join(',')}`);

// 2. 通常艦配属: 1日1隻
let p = Ships.load();
const t1 = '2026-08-28';
const s1 = Ships.onSessionDone(p, t1);
assert(s1 && s1.id === 'dd-101', `初回配属=dd-101 (実際${s1 && s1.id})`);
const s2 = Ships.onSessionDone(p, t1);
assert(s2 === null, '同日2回目は配属なし');
const s3 = Ships.onSessionDone(p, '2026-08-29');
assert(s3 && s3.id === 'dd-102', `翌日配属=dd-102 (実際${s3 && s3.id})`);

// 3. レア解放: 25ブロックで1隻目
p = Ships.load();
p.owned = [];
const cleared = {};
for (let i = 1; i <= 25; i++) cleared[`eiken-grade3:set${i}:Lv1`] = {};
localStorage.setItem('wordbook_cleared_v1', JSON.stringify(cleared));
let r1 = Ships.awardEarnedRares(p);
assert(r1.length === 1 && r1[0].id === 'ddg-173', `25クリア→こんごう解放 (実際${r1.map(r=>r.id).join(',')})`);
for (let i = 26; i <= 30; i++) cleared[`eiken-grade3:set${i}:Lv1`] = {};
localStorage.setItem('wordbook_cleared_v1', JSON.stringify(cleared));
r1 = Ships.awardEarnedRares(p);
// 30クリア: entitled=2 (25→1隻 + 30→2隻目) → 差分として ddg-174 と ddg-175 が同時解放される
assert(r1.length === 2 && r1[1].id === 'ddg-175', `30クリア→2隻目まで解放 (実際${r1.map(r=>r.id).join(',')})`);

// 4. ログインボーナス 7日目に艦
p = Ships.load();
p.owned = []; p.lastLoginClaim = null; p.calendarStart = null; p.calendarDay = 0;
let ev;
for (let d = 1; d <= 7; d++) {
  ev = Ships.touchLogin(p, `2026-08-${String(20 + d).padStart(2, '0')}`);
}
assert(ev.bonus && ev.bonus.day === 7 && ev.ship, `7日目=艦配属 (実際day=${ev.bonus && ev.bonus.day})`);
assert(ev.ship.id === 'dd-101', `ボーナス艦=dd-101 (実際${ev.ship && ev.ship.id})`);

// 5. タイトル形式
const s = Ships.FLEET.find(x => x.id === 'ddg-173');
const parts = s.id.split('-');
const title = `[${s.kind}]艦「${s.cls}」型 ${parts[0].toUpperCase()}-${parts[1]}`;
assert(title === '[護衛艦]艦「こんごう」型 DDG-173', `title形式 (${title})`);

console.log(fails ? `FAIL x${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
