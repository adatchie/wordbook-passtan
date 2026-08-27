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
    { id: "dd-101", kind: "護衛艦", cls: "むらさめ", name: "むらさめ" }, { id: "dd-102", kind: "護衛艦", cls: "むらさめ", name: "はるさめ" },
    { id: "dd-103", kind: "護衛艦", cls: "むらさめ", name: "ゆうだち" }, { id: "dd-104", kind: "護衛艦", cls: "むらさめ", name: "きりさめ" },
    { id: "dd-105", kind: "護衛艦", cls: "むらさめ", name: "いなづま" }, { id: "dd-106", kind: "護衛艦", cls: "むらさめ", name: "さみだれ" },
    { id: "dd-107", kind: "護衛艦", cls: "むらさめ", name: "いかづち" }, { id: "dd-108", kind: "護衛艦", cls: "むらさめ", name: "あけぼの" },
    { id: "dd-109", kind: "護衛艦", cls: "むらさめ", name: "ありあけ" },
    { id: "dd-110", kind: "護衛艦", cls: "たかなみ", name: "たかなみ" }, { id: "dd-111", kind: "護衛艦", cls: "たかなみ", name: "おおなみ" },
    { id: "dd-112", kind: "護衛艦", cls: "たかなみ", name: "まきなみ" }, { id: "dd-113", kind: "護衛艦", cls: "たかなみ", name: "さざなみ" },
    { id: "dd-114", kind: "護衛艦", cls: "たかなみ", name: "すずなみ" },
    { id: "dd-115", kind: "護衛艦", cls: "あきづき", name: "あきづき" }, { id: "dd-116", kind: "護衛艦", cls: "あきづき", name: "てるづき" },
    { id: "dd-117", kind: "護衛艦", cls: "あきづき", name: "すずつき" }, { id: "dd-118", kind: "護衛艦", cls: "あきづき", name: "ふゆづき" },
    { id: "dd-119", kind: "護衛艦", cls: "あさひ", name: "あさひ" }, { id: "dd-120", kind: "護衛艦", cls: "あさひ", name: "しらぬい" },
    { id: "dd-153", kind: "護衛艦", cls: "あさぎり", name: "ゆうぎり" }, { id: "dd-154", kind: "護衛艦", cls: "あさぎり", name: "あまぎり" },
    { id: "dd-155", kind: "護衛艦", cls: "あさぎり", name: "はまぎり" }, { id: "dd-156", kind: "護衛艦", cls: "あさぎり", name: "せとぎり" },
    { id: "dd-157", kind: "護衛艦", cls: "あさぎり", name: "さわぎり" }, { id: "dd-158", kind: "護衛艦", cls: "あさぎり", name: "うみぎり" },
    { id: "ddg-173", kind: "護衛艦", cls: "こんごう", name: "こんごう" }, { id: "ddg-174", kind: "護衛艦", cls: "こんごう", name: "きりしま" },
    { id: "ddg-175", kind: "護衛艦", cls: "こんごう", name: "みょうこう" }, { id: "ddg-176", kind: "護衛艦", cls: "こんごう", name: "ちょうかい" },
    { id: "ddg-177", kind: "護衛艦", cls: "あたご", name: "あたご" }, { id: "ddg-178", kind: "護衛艦", cls: "あたご", name: "あしがら" },
    { id: "ddg-179", kind: "護衛艦", cls: "まや", name: "まや" }, { id: "ddg-180", kind: "護衛艦", cls: "まや", name: "はぐろ" },
    { id: "de-229", kind: "護衛艦", cls: "あぶくま", name: "あぶくま" }, { id: "de-230", kind: "護衛艦", cls: "あぶくま", name: "じんつう" },
    { id: "de-231", kind: "護衛艦", cls: "あぶくま", name: "おおよど" }, { id: "de-232", kind: "護衛艦", cls: "あぶくま", name: "せんだい" },
    { id: "de-233", kind: "護衛艦", cls: "あぶくま", name: "ちくま" }, { id: "de-234", kind: "護衛艦", cls: "あぶくま", name: "とね" },
    { id: "ffm-1", kind: "護衛艦", cls: "もがみ", name: "もがみ" }, { id: "ffm-2", kind: "護衛艦", cls: "もがみ", name: "くまの" },
    { id: "ffm-3", kind: "護衛艦", cls: "もがみ", name: "のしろ" }, { id: "ffm-4", kind: "護衛艦", cls: "もがみ", name: "みくま" },
    { id: "ffm-5", kind: "護衛艦", cls: "もがみ", name: "やはぎ" }, { id: "ffm-6", kind: "護衛艦", cls: "もがみ", name: "あがの" },
    { id: "ffm-7", kind: "護衛艦", cls: "もがみ", name: "によど" }, { id: "ffm-8", kind: "護衛艦", cls: "もがみ", name: "ゆうべつ" },
    { id: "ffm-9", kind: "護衛艦", cls: "もがみ", name: "なとり" }, { id: "ffm-10", kind: "護衛艦", cls: "もがみ", name: "ながら" },
    // ===== 掃海艦/艇/母艦 (18) =====
    { id: "mso-304", kind: "掃海艦", cls: "あわじ", name: "あわじ" }, { id: "mso-305", kind: "掃海艦", cls: "あわじ", name: "ひらど" },
    { id: "mso-306", kind: "掃海艦", cls: "あわじ", name: "えたじま" }, { id: "mso-307", kind: "掃海艦", cls: "あわじ", name: "のうみ" },
    { id: "msc-601", kind: "掃海艇", cls: "ひらしま", name: "ひらしま" }, { id: "msc-602", kind: "掃海艇", cls: "ひらしま", name: "やくしま" },
    { id: "msc-603", kind: "掃海艇", cls: "ひらしま", name: "たかしま" },
    { id: "msc-604", kind: "掃海艇", cls: "えのしま", name: "えのしま" }, { id: "msc-605", kind: "掃海艇", cls: "えのしま", name: "ちちじま" },
    { id: "msc-606", kind: "掃海艇", cls: "えのしま", name: "はつしま" },
    { id: "msc-687", kind: "掃海艇", cls: "すがしま", name: "いずしま" }, { id: "msc-688", kind: "掃海艇", cls: "すがしま", name: "あいしま" },
    { id: "msc-689", kind: "掃海艇", cls: "すがしま", name: "あおしま" }, { id: "msc-690", kind: "掃海艇", cls: "すがしま", name: "みやじま" },
    { id: "msc-691", kind: "掃海艇", cls: "すがしま", name: "ししじま" }, { id: "msc-692", kind: "掃海艇", cls: "すがしま", name: "くろしま" },
    { id: "mst-463", kind: "掃海母艦", cls: "うらが", name: "うらが" }, { id: "mst-464", kind: "掃海母艦", cls: "うらが", name: "ぶんご" },
    // ===== ミサイル艇 (6) =====
    { id: "pg-824", kind: "ミサイル艇", cls: "はやぶさ", name: "はやぶさ" }, { id: "pg-825", kind: "ミサイル艇", cls: "はやぶさ", name: "わかたか" },
    { id: "pg-826", kind: "ミサイル艇", cls: "はやぶさ", name: "おおたか" }, { id: "pg-827", kind: "ミサイル艇", cls: "はやぶさ", name: "くまたか" },
    { id: "pg-828", kind: "ミサイル艇", cls: "はやぶさ", name: "うみたか" }, { id: "pg-829", kind: "ミサイル艇", cls: "はやぶさ", name: "しらたか" },
    // ===== 輸送艦/艇 (4) =====
    { id: "lst-4001", kind: "輸送艦", cls: "おおすみ", name: "おおすみ" }, { id: "lst-4002", kind: "輸送艦", cls: "おおすみ", name: "しもきた" },
    { id: "lst-4003", kind: "輸送艦", cls: "おおすみ", name: "くにさき" },
    { id: "lcu-2002", kind: "輸送艇", cls: "1号", name: "輸送艇2号" },
    { id: "lcac-1", kind: "エアクッション艇", cls: "1号", name: "エアクッション艇1号" },
  ];

  // 型別要目 (出典: mod.go.jp各型ページ 2026-08-28取得)
  const SPECS = {
    "むらさめ": { en: "DD \"MURASAME\" Class", ton: "4,550t", dim: "全長151m・幅17.4m", engine: "ガスタービン4基2軸", hp: "60,000PS", speed: "30kt", weapons: "76mm速射砲、VLS、高性能20mm機関砲×2、SSM、3連装短魚雷発射管×2、哨戒ヘリ×1", crew: "約170名" },
    "たかなみ": { en: "DD \"TAKANAMI\" Class", ton: "4,650t", dim: "全長151m・幅17.4m", engine: "ガスタービン4基2軸", hp: "60,000PS", speed: "30kt", weapons: "127mm速射砲、VLS、高性能20mm機関砲×2、SSM、3連装短魚雷発射管×2、哨戒ヘリ×1", crew: "約175名" },
    "あさぎり": { en: "DD \"ASAGIRI\" Class", ton: "3,500t", dim: "全長137m・幅14.6m", engine: "ガスタービン4基2軸", hp: "54,000PS", speed: "30kt", weapons: "76mm速射砲、短SAM、SSM、アスロック、高性能20mm機関砲×2、哨戒ヘリ×1", crew: "約220名" },
    "あきづき": { en: "DD \"AKIZUKI\" Class", ton: "5,050t", dim: "全長151m・幅18.3m", engine: "ガスタービン4基2軸", hp: "64,000PS", speed: "30kt", weapons: "高性能20mm機関砲×2、VLS、魚雷発射管×2、哨戒ヘリ", crew: "約200名" },
    "あさひ": { en: "DD \"ASAHI\" Class", ton: "5,100t", dim: "全長150.5m・幅18.3m", engine: "ガスタービン2基＋推進電動機2基（2軸）", hp: "62,500PS", speed: "30kt", weapons: "5インチ砲、VLS、高性能20mm機関砲×2、水上発射管×2、多機能レーダー、えい航ソナー", crew: "—" },
    "こんごう": { en: "DDG \"KONGOU\" Class", ton: "7,250t", dim: "全長161m・幅21m", engine: "ガスタービン4基2軸", hp: "100,000PS", speed: "30kt", weapons: "イージス装置、VLS、127mm砲、高性能20mm機関砲×2、SSM、3連装短魚雷発射管×2", crew: "約300名" },
    "あたご": { en: "DDG \"ATAGO\" Class", ton: "7,750t", dim: "全長165m・幅21m", engine: "ガスタービン4基2軸", hp: "100,000PS", speed: "30kt", weapons: "イージス装置、VLS、5インチ砲、高性能20mm機関砲×2、SSM、3連装短魚雷発射管×2", crew: "約310名" },
    "まや": { en: "DDG \"MAYA\" Class", ton: "8,200t", dim: "全長170m・幅21m", engine: "COGLAG（2軸）", hp: "69,000PS", speed: "約30kt", weapons: "イージス装置、VLS、5インチ砲、高性能20mm機関砲×2、SSM、アスロック、水上発射管×2、CEC", crew: "約300名" },
    "あぶくま": { en: "DE \"ABUKUMA\" Class", ton: "2,000t", dim: "全長109m・幅13.4m", engine: "ガスタービン2基＋ディーゼル2基（2軸）", hp: "27,000PS", speed: "27kt", weapons: "76mm速射砲、SSM、アスロック、高性能20mm機関砲、3連装短魚雷発射管×2", crew: "約120名" },
    "もがみ": { en: "FFM \"MOGAMI\" Class", ton: "3,900t", dim: "全長133m・幅16.3m", engine: "CODAG（2軸）", hp: "70,000PS", speed: "約30kt", weapons: "5インチ砲、SeaRAM、遠隔管制機関銃×2、SSM、VDS・TASS、UUV・USV、哨戒ヘリ×1", crew: "約90名" },
    "あわじ": { en: "MSO \"AWAJI\" Class", ton: "690t", dim: "全長67m・幅11m", engine: "ディーゼル2基2軸", hp: "2,200PS", speed: "14kt", weapons: "20mm遠隔管制機関砲、掃海装置", crew: "約50名" },
    "えのしま": { en: "MSC \"ENOSHIMA\" Class", ton: "570t", dim: "全長60m・幅10.1m", engine: "ディーゼル2基2軸", hp: "2,200PS", speed: "14kt", weapons: "20mm機関砲、掃海装置", crew: "約45名" },
    "ひらしま": { en: "MSC \"HIRASHIMA\" Class", ton: "570t", dim: "全長57m・幅9.8m", engine: "ディーゼル2基2軸", hp: "2,200PS", speed: "14kt", weapons: "20mm機関砲、掃海装置", crew: "約45名" },
    "すがしま": { en: "MSC \"SUGASHIMA\" Class", ton: "510t", dim: "全長54m・幅9.4m", engine: "ディーゼル2基2軸", hp: "1,800PS", speed: "14kt", weapons: "20mm機関砲、掃海装置", crew: "約45名" },
    "うらが": { en: "MST \"URAGA\" Class", ton: "5,650t", dim: "全長141m・幅22m", engine: "ディーゼル2基2軸", hp: "19,500PS", speed: "22kt", weapons: "機雷敷設装置", crew: "約160名" },
    "はやぶさ": { en: "PG \"HAYABUSA\" Class", ton: "200t", dim: "全長50m・幅8.4m", engine: "ガスタービン3基3軸・ウォータージェット", hp: "16,200PS", speed: "44kt", weapons: "76mm速射砲、艦対艦ミサイルシステム", crew: "約21名" },
    "おおすみ": { en: "LST \"OSUMI\" Class", ton: "8,900t", dim: "全長178m・幅25.8m", engine: "ディーゼル2基2軸", hp: "26,000PS", speed: "22kt", weapons: "高性能20mm機関砲×2、輸送用エアクッション艇×2", crew: "約135名" },
    "LCU": { en: "LCU \"1-GO\" Class", ton: "420t", dim: "全長52m・幅8.7m", engine: "ディーゼル2基2軸", hp: "3,000PS", speed: "12kt", weapons: "20mm機関砲", crew: "約28名" },
    "LCAC": { en: "LCAC \"1-GO\" Class", ton: "85t", dim: "全長28m・幅14.7m", engine: "ガスタービン4基", hp: "16,600PS", speed: "50kt", weapons: "—", crew: "約5名" },
  };

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

  return { KEY, FLEET, SPECS, RARE_IDS, REGULAR_COUNT, RARE_FIRST, RARE_STEP,
           load, save, defaults, nextRegular, nextRare,
           onSessionDone, blockClears, entitledRares, awardEarnedRares, touchLogin, todayStr };
})();
