// ships.js — JMSDF現役艦艇コレクション (passtan用)
// データ出典: 海上自衛隊オフィシャル https://www.mod.go.jp/msdf/equipment/ships/
// 画像: img/ships/manifest.json {shipId: {title, img}}
// ロジック: eiken-pre2-dojo rewards.js の艦艇部分を移植
'use strict';

const Ships = (() => {
  const KEY = 'wordbook_ships_v1';

  // 79隻 — 配属順: 護衛艦(DD/FFM/DE)→掃海→その他。id=code-num
  const FLEET = [
    // ===== 護衛艦 (50) =====
    { id: "dd-101", kind: "護衛艦", cls: "むらさめ" }, { id: "dd-102", kind: "護衛艦", cls: "むらさめ" },
    { id: "dd-103", kind: "護衛艦", cls: "むらさめ" }, { id: "dd-104", kind: "護衛艦", cls: "むらさめ" },
    { id: "dd-105", kind: "護衛艦", cls: "むらさめ" }, { id: "dd-106", kind: "護衛艦", cls: "むらさめ" },
    { id: "dd-107", kind: "護衛艦", cls: "むらさめ" }, { id: "dd-108", kind: "護衛艦", cls: "むらさめ" },
    { id: "dd-109", kind: "護衛艦", cls: "むらさめ" },
    { id: "dd-110", kind: "護衛艦", cls: "たかなみ" }, { id: "dd-111", kind: "護衛艦", cls: "たかなみ" },
    { id: "dd-112", kind: "護衛艦", cls: "たかなみ" }, { id: "dd-113", kind: "護衛艦", cls: "たかなみ" },
    { id: "dd-114", kind: "護衛艦", cls: "たかなみ" },
    { id: "dd-115", kind: "護衛艦", cls: "あきづき" }, { id: "dd-116", kind: "護衛艦", cls: "あきづき" },
    { id: "dd-117", kind: "護衛艦", cls: "あきづき" }, { id: "dd-118", kind: "護衛艦", cls: "あきづき" },
    { id: "dd-119", kind: "護衛艦", cls: "あさひ" }, { id: "dd-120", kind: "護衛艦", cls: "あさひ" },
    { id: "dd-153", kind: "護衛艦", cls: "あさぎり" }, { id: "dd-154", kind: "護衛艦", cls: "あさぎり" },
    { id: "dd-155", kind: "護衛艦", cls: "あさぎり" }, { id: "dd-156", kind: "護衛艦", cls: "あさぎり" },
    { id: "dd-157", kind: "護衛艦", cls: "あさぎり" }, { id: "dd-158", kind: "護衛艦", cls: "あさぎり" },
    { id: "ddg-173", kind: "護衛艦", cls: "こんごう" }, { id: "ddg-174", kind: "護衛艦", cls: "こんごう" },
    { id: "ddg-175", kind: "護衛艦", cls: "こんごう" }, { id: "ddg-176", kind: "護衛艦", cls: "こんごう" },
    { id: "ddg-177", kind: "護衛艦", cls: "あたご" }, { id: "ddg-178", kind: "護衛艦", cls: "あたご" },
    { id: "ddg-179", kind: "護衛艦", cls: "まや" }, { id: "ddg-180", kind: "護衛艦", cls: "まや" },
    { id: "de-229", kind: "護衛艦", cls: "あぶくま" }, { id: "de-230", kind: "護衛艦", cls: "あぶくま" },
    { id: "de-231", kind: "護衛艦", cls: "あぶくま" }, { id: "de-232", kind: "護衛艦", cls: "あぶくま" },
    { id: "de-233", kind: "護衛艦", cls: "あぶくま" }, { id: "de-234", kind: "護衛艦", cls: "あぶくま" },
    { id: "ffm-1", kind: "護衛艦", cls: "もがみ" }, { id: "ffm-2", kind: "護衛艦", cls: "もがみ" },
    { id: "ffm-3", kind: "護衛艦", cls: "もがみ" }, { id: "ffm-4", kind: "護衛艦", cls: "もがみ" },
    { id: "ffm-5", kind: "護衛艦", cls: "もがみ" }, { id: "ffm-6", kind: "護衛艦", cls: "もがみ" },
    { id: "ffm-7", kind: "護衛艦", cls: "もがみ" }, { id: "ffm-8", kind: "護衛艦", cls: "もがみ" },
    { id: "ffm-9", kind: "護衛艦", cls: "もがみ" }, { id: "ffm-10", kind: "護衛艦", cls: "もがみ" },
    // ===== 掃海艦/艇/母艦 (18) =====
    { id: "mso-304", kind: "掃海艦", cls: "あわじ" }, { id: "mso-305", kind: "掃海艦", cls: "あわじ" },
    { id: "mso-306", kind: "掃海艦", cls: "あわじ" }, { id: "mso-307", kind: "掃海艦", cls: "あわじ" },
    { id: "msc-601", kind: "掃海艇", cls: "ひらしま" }, { id: "msc-602", kind: "掃海艇", cls: "ひらしま" },
    { id: "msc-603", kind: "掃海艇", cls: "ひらしま" },
    { id: "msc-604", kind: "掃海艇", cls: "えのしま" }, { id: "msc-605", kind: "掃海艇", cls: "えのしま" },
    { id: "msc-606", kind: "掃海艇", cls: "えのしま" },
    { id: "msc-687", kind: "掃海艇", cls: "すがしま" }, { id: "msc-688", kind: "掃海艇", cls: "すがしま" },
    { id: "msc-689", kind: "掃海艇", cls: "すがしま" }, { id: "msc-690", kind: "掃海艇", cls: "すがしま" },
    { id: "msc-691", kind: "掃海艇", cls: "すがしま" }, { id: "msc-692", kind: "掃海艇", cls: "すがしま" },
    { id: "mst-463", kind: "掃海母艦", cls: "うらが" }, { id: "mst-464", kind: "掃海母艦", cls: "うらが" },
    // ===== ミサイル艇 (6) =====
    { id: "pg-824", kind: "ミサイル艇", cls: "はやぶさ" }, { id: "pg-825", kind: "ミサイル艇", cls: "はやぶさ" },
    { id: "pg-826", kind: "ミサイル艇", cls: "はやぶさ" }, { id: "pg-827", kind: "ミサイル艇", cls: "はやぶさ" },
    { id: "pg-828", kind: "ミサイル艇", cls: "はやぶさ" }, { id: "pg-829", kind: "ミサイル艇", cls: "はやぶさ" },
    // ===== 輸送艦/艇 (4) =====
    { id: "lst-4001", kind: "輸送艦", cls: "おおすみ" }, { id: "lst-4002", kind: "輸送艦", cls: "おおすみ" },
    { id: "lst-4003", kind: "輸送艦", cls: "おおすみ" },
    { id: "lcu-2002", kind: "輸送艇", cls: "1号" },
    { id: "lcac-1", kind: "エアクッション艇", cls: "1号" },
  ];

  const RARE_FIRST = 25;   // 初のレア艦(イージス艦)解放に必要なブロッククリア数
  const RARE_STEP = 5;     // 以降5ブロックごとに1隻
  // レア枠: イージス艦12隻 (ddg-173..180)
  const RARE_IDS = new Set(FLEET.filter(s => s.id.startsWith('ddg')).map(s => s.id));
  const REGULAR_COUNT = FLEET.length - RARE_IDS.size;

  function defaults() {
    return {
      owned: [],            // 配属済み艦ID
      shipLastAward: null,  // 最終配属日 (1日1隻)
      lastLoginClaim: null, // 7日ボーナス最終受取日
      calendarStart: null, calendarDay: 0,
      streak: 0, lastStudyDate: null, maxStreak: 0,
    };
  }

  function load() {
    const d = defaults();
    const p = loadJSON(KEY) || d;
    for (const k of Object.keys(d)) if (!(k in p)) p[k] = d[k];
    return p;
  }
  function save(p) { saveJSON(KEY, p); }

  function nextRegular(p) {
    for (let i = 0; i < FLEET.length; i++) {
      if (!RARE_IDS.has(FLEET[i].id) && !p.owned.includes(FLEET[i].id)) return FLEET[i];
    }
    return null;
  }
  function nextRare(p) {
    for (const s of FLEET) {
      if (RARE_IDS.has(s.id) && !p.owned.includes(s.id)) return s;
    }
    return null;
  }

  // セッション完走で1日1隻 (通常艦)
  function onSessionDone(p, today) {
    if (p.shipLastAward === today) return null;
    const s = nextRegular(p);
    if (!s) return null;
    p.owned.push(s.id);
    p.shipLastAward = today;
    save(p);
    return s;
  }

  // ブロック×Lvクリア (正答率80%以上) 累計でイージス艦解放
  function blockClears(p) {
    const cleared = loadJSON(STORAGE_KEYS.cleared) || {};
    return Object.keys(cleared).length;
  }
  function entitledRares(nClears) {
    if (nClears < RARE_FIRST) return 0;
    return Math.min(RARE_IDS.size, Math.floor((nClears - RARE_FIRST) / RARE_STEP) + 1);
  }
  function awardEarnedRares(p) {
    const entitled = entitledRares(blockClears(p));
    const unlocked = [];
    for (let r = 0; r < entitled; r++) {
      const s = nextRare(p);
      if (!s) break;
      p.owned.push(s.id);
      unlocked.push(s);
    }
    if (unlocked.length) save(p);
    return unlocked;
  }

  // 7日ログインボーナス (dojo互換): 7日目=ボーナス+通常艦追加配属
  function touchLogin(p, today) {
    const ev = { bonus: null, ship: null };
    if (p.lastLoginClaim === today) return ev;
    if (p.lastLoginClaim && p.lastLoginClaim !== addDays(today, -1)) {
      // 連続受取が途切れたらリセット
      p.calendarStart = today; p.calendarDay = 0;
    } else if (p.calendarDay < 7) {
      p.calendarDay += 1;
    } else {
      // 7日到達済み→次週の1日目へ
      p.calendarDay = 1;
    }
    p.calendarStart = p.calendarStart || today;
    p.lastLoginClaim = today;
    if (p.calendarDay === 7) {
      ev.bonus = { day: 7, rare: true };
      const s = nextRegular(p);
      if (s) { p.owned.push(s.id); ev.ship = s; }
    } else {
      ev.bonus = { day: p.calendarDay, rare: false };
    }
    save(p);
    return ev;
  }

  function addDays(iso, n) {
    // ISO日付文字列同士の演算（タイムゾーン中立・Date不使用）
    const [y, m, d] = iso.split('-').map(Number);
    const dt = Date.UTC(y, m - 1, d) + n * 86400000;
    return new Date(dt).toISOString().slice(0, 10);
  }
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  return { KEY, FLEET, RARE_IDS, REGULAR_COUNT, RARE_FIRST, RARE_STEP,
           load, save, defaults, nextRegular, nextRare,
           onSessionDone, blockClears, entitledRares, awardEarnedRares, touchLogin, todayStr };
})();
