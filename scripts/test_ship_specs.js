#!/usr/bin/env node
// 詳細モーダル用データ検証: 全艦のSPECS解決・艦名・タイトル形式
const fs = require('fs');
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k,v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.STORAGE_KEYS = { cleared: 'wordbook_cleared_v1' };
global.loadJSON = k => { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; };
global.saveJSON = (k, o) => { localStorage.setItem(k, JSON.stringify(o)); return true; };
const src = fs.readFileSync('docs/ships.js','utf8').replace("const Ships = (", "global.Ships = (").replace(/'use strict';/, '');
eval(src);

let fails = 0;
function assert(cond, msg) { if (!cond) { console.error('FAIL:', msg); fails++; } }

assert(Ships.SPECS, 'SPECS export');
// 全艦: cls または code でSPECSが解決できるか
const noSpec = Ships.FLEET.filter(s => !(Ships.SPECS[s.cls] || Ships.SPECS[s.id.split('-')[0].toUpperCase()]));
assert(noSpec.length === 0, `SPECS欠け: ${noSpec.map(s=>s.id).join(',')}`);
// 艦名があるか
const noName = Ships.FLEET.filter(s => !s.name);
assert(noName.length === 0, `name欠け: ${noName.map(s=>s.id).join(',')}`);
// 同型でも艦名が異なるか（むらさめ型9隻）
const mura = Ships.FLEET.filter(s => s.cls === 'むらさめ').map(s => s.name);
assert(new Set(mura).size === 9, `むらさめ型9艦名 (実際${mura.join(',')})`);
// LCAC/LCUはcodeで解決
const lcac = Ships.FLEET.find(s => s.id === 'lcac-1');
assert(Ships.SPECS[lcac.id.split('-')[0].toUpperCase()], 'LCAC spec via code');
// サンプル: こんごう
const kg = Ships.SPECS['こんごう'];
assert(kg.ton === '7,250t' && kg.weapons.includes('イージス'), 'こんごう要目');

console.log(fails ? `FAIL x${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
