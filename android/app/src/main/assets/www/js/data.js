'use strict';
/* Cozy Pixel Soccer - data, save system, progression, shop */
const D = window.D = {};

D.OUT = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defense', 'Physical'];
D.GKS = ['Reflex', 'Handling', 'Positioning', 'Diving', 'Distribution', 'Physical'];
D.STAT_ID = { Pace: 'Stat/Pace', Shooting: 'Stat/Shooting', Passing: 'Stat/Passing', Dribbling: 'Stat/Dribbling', Defense: 'Stat/Defense', Physical: 'Stat/Physical',
  Reflex: 'Goalkeeper/Reflex', Handling: 'Goalkeeper/Handling', Positioning: 'Position/GK', Diving: 'Goalkeeper/Diving', Distribution: 'Stat/Passing' };
D.STAT_ID_NAME = { Pace: 'Kecepatan', Shooting: 'Tembakan', Passing: 'Umpan', Dribbling: 'Dribel', Defense: 'Bertahan', Physical: 'Fisik',
  Reflex: 'Refleks', Handling: 'Tangkapan', Positioning: 'Posisi', Diving: 'Terjang', Distribution: 'Distribusi' };
D.RARITY = { Common: { c: '#cfc7a6', n: 'Umum' }, Rare: { c: '#6fb3d1', n: 'Langka' }, Epic: { c: '#c98bd6', n: 'Epik' }, Legendary: { c: '#ffbc30', n: 'Legenda' } };
D.GROUP = { GK: 'GK', RB: 'DEF', CB: 'DEF', LB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', RW: 'ATT', LW: 'ATT', ST: 'ATT' };

D.PASSIVES = {
  'Quick Feet': 'Akselerasi sedikit meningkat saat membawa bola',
  'Sniper': 'Akurasi tembakan dari luar kotak penalti meningkat',
  'Iron Wall': 'Kemampuan menghadang lawan meningkat',
  'Playmaker': 'Umpan kepada rekan lebih akurat',
  'Eagle Eye': 'Akurasi umpan jauh meningkat',
  'Last Hope': 'Refleks kiper naik saat peluang berbahaya',
  'Speed Demon': 'Bonus kecepatan saat sprint',
  'Team Spirit': 'Bonus kecil untuk rekan di sekitarnya',
  'Predator': 'Penyelesaian peluang di kotak penalti meningkat',
  'Stamina King': 'Penurunan stamina berkurang'
};

/* Template statistik per posisi: Pace,Shooting,Passing,Dribbling,Defense,Physical */
const TPL = {
  RB: [62, 35, 52, 50, 62, 60], LB: [62, 35, 52, 50, 62, 58], CB: [50, 28, 45, 40, 68, 68], CDM: [55, 40, 58, 50, 64, 62],
  CM: [58, 50, 65, 58, 52, 56], CAM: [60, 58, 66, 64, 38, 48], RW: [70, 52, 55, 66, 30, 46], LW: [70, 52, 55, 66, 30, 46],
  ST: [66, 68, 48, 60, 28, 60], GK: [58, 56, 55, 54, 48, 50]
};
D.tplStats = function (pos, bonus) {
  const t = TPL[pos], keys = pos === 'GK' ? D.GKS : D.OUT, o = {};
  keys.forEach((k, i) => o[k] = G.clamp(t[i] + ((bonus && bonus[i]) || 0), 20, 99));
  return o;
};
const DP = 'Characters/Default_Players/', RP = 'Characters/Recruitable_Players/', GP = 'Characters/Generated/';
function mk(o) { return o; }
D.PLAYERS = {};
function add(p) {
  p.kind = p.pos === 'GK' ? 'gk' : 'out';
  if (!p.stats) p.stats = D.tplStats(p.pos, p.bonus);
  p.startLv = p.startLv || 1; p.rarity = p.rarity || 'Common'; p.passive = p.passive || null;
  p.keys = p.kind === 'gk' ? D.GKS : D.OUT;
  D.PLAYERS[p.id] = p;
}
/* 11 pemain default (roster.json): posisi, job, nomor */
[
  { id: 'GK', name: 'Bima', num: 1, pos: 'GK', job: 'Goalkeeper', maxlv: 15, base: DP + 'GK/Player_GK', bonus: [2, 1, 2, 0, 3, 0] },
  { id: 'RB', name: 'Raka', num: 2, pos: 'RB', job: 'Right Back', maxlv: 15, base: DP + 'RB/Player_RB', bonus: [2, 0, 0, 1, 1, 0] },
  { id: 'CB1', name: 'Dimas', num: 3, pos: 'CB', job: 'Center Back', maxlv: 18, base: DP + 'CB/Player_CB_01', bonus: [0, 0, 2, 0, 3, 1] },
  { id: 'CB2', name: 'Arga', num: 4, pos: 'CB', job: 'Center Back', maxlv: 14, base: DP + 'CB/Player_CB_02', bonus: [1, 0, 0, 0, 1, 4] },
  { id: 'LB', name: 'Fajar', num: 5, pos: 'LB', job: 'Left Back', maxlv: 15, base: DP + 'LB/Player_LB', bonus: [3, 1, 1, 0, 0, -2] },
  { id: 'CDM', name: 'Galih', num: 6, pos: 'CDM', job: 'Defensive Midfielder', maxlv: 16, base: DP + 'CDM/Player_CDM', bonus: [0, 0, 1, 0, 4, 2] },
  { id: 'CM', name: 'Nando', num: 8, pos: 'CM', job: 'Central Midfielder', maxlv: 20, base: DP + 'CM/Player_CM', bonus: [1, 1, 3, 2, 0, 0] },
  { id: 'CAM', name: 'Yoga', num: 10, pos: 'CAM', job: 'Attacking Midfielder', maxlv: 14, base: DP + 'CAM/Player_CAM', bonus: [0, 2, 3, 3, 0, -2] },
  { id: 'RW', name: 'Satria', num: 7, pos: 'RW', job: 'Right Winger', maxlv: 15, base: DP + 'RW/Player_RW', bonus: [4, 0, 1, 2, 0, -2] },
  { id: 'ST', name: 'Bagas', num: 9, pos: 'ST', job: 'Striker', maxlv: 15, base: DP + 'ST/Player_ST', bonus: [0, 4, 0, 1, 0, 2] },
  { id: 'LW', name: 'Tio', num: 11, pos: 'LW', job: 'Left Winger', maxlv: 12, base: DP + 'LW/Player_LW', bonus: [3, 2, 0, 5, 0, -3] }
].forEach(p => { p.def = true; p.away = p.id === 'GK' ? GP + 'Player_GK_opp.png' : p.base + '_away.png'; add(p); });

/* rekrutan: 3 dari paket aset + 7 varian (recolor) */
function rec(id, name, title, rarity, pos, job, num, maxlv, startLv, passive, price, base, stats, bonus) {
  add({ id, name, title, rarity, pos, job, num, maxlv, startLv, passive, price, base, stats, bonus, rec: true });
}
rec('Leon', 'Leon', 'The Guardian', 'Rare', 'GK', 'Goalkeeper', 1, 18, 3, 'Last Hope', 1200, RP + 'Leon/Player_Leon', { Reflex: 86, Handling: 79, Positioning: 66, Diving: 72, Distribution: 58, Physical: 64 });
rec('Rafael', 'Rafael', 'The Sniper', 'Epic', 'ST', 'Striker', 9, 20, 5, 'Sniper', 2500, RP + 'Rafael/Player_Rafael', { Pace: 82, Shooting: 91, Passing: 60, Dribbling: 72, Defense: 30, Physical: 66 });
rec('Kai', 'Kai', 'The Maestro', 'Legendary', 'CAM', 'Attacking Midfielder', 10, 20, 8, 'Playmaker', 4000, RP + 'Kai/Player_Kai', { Pace: 74, Shooting: 78, Passing: 94, Dribbling: 90, Defense: 44, Physical: 58 });
rec('Bayu', 'Bayu', 'Si Tembok', 'Common', 'CB', 'Center Back', 5, 16, 2, 'Iron Wall', 450, GP + 'Player_Bayu', null, [0, 0, 0, 0, 8, 6]);
rec('Dewa', 'Dewa', 'Kilat Sayap', 'Rare', 'RW', 'Right Winger', 17, 17, 3, 'Speed Demon', 950, GP + 'Player_Dewa', null, [14, 4, 2, 6, 0, -2]);
rec('Rizky', 'Rizky', 'Sang Pelari', 'Common', 'CDM', 'Defensive Midfielder', 14, 14, 2, 'Stamina King', 500, GP + 'Player_Rizky', null, [4, 0, 3, 0, 6, 8]);
rec('Hendra', 'Hendra', 'Mata Elang', 'Rare', 'CM', 'Central Midfielder', 16, 18, 3, 'Eagle Eye', 1000, GP + 'Player_Hendra', null, [2, 4, 14, 6, 0, 0]);
rec('Joni', 'Joni', 'Jiwa Tim', 'Rare', 'LB', 'Left Back', 15, 16, 3, 'Team Spirit', 850, GP + 'Player_Joni', null, [4, 0, 8, 4, 8, 2]);
rec('Ardi', 'Ardi', 'Si Pemangsa', 'Rare', 'ST', 'Striker', 19, 15, 3, 'Predator', 1100, GP + 'Player_Ardi', null, [-6, 20, 0, 4, 0, 10]);
rec('Wisnu', 'Wisnu', 'Kaki Lincah', 'Common', 'LW', 'Left Winger', 18, 20, 1, 'Quick Feet', 520, GP + 'Player_Wisnu', null, [2, 0, 2, 10, 0, -4]);
D.RECRUIT_IDS = Object.keys(D.PLAYERS).filter(k => D.PLAYERS[k].rec);
D.DEFAULT_IDS = Object.keys(D.PLAYERS).filter(k => D.PLAYERS[k].def);
D.sheetPath = (p, away) => (away && p.away) ? p.away : p.base + '.png';
D.portraitPath = p => p.base + '_portrait.png';
D.iconPath = p => p.base + '_profile_icon.png';

/* formasi: slot = [pos, x(0 gawang sendiri..1 gawang lawan), y(0 atas..1 bawah)] */
D.FORMATIONS = {
  '4-3-3': { info: 'Seimbang dan ofensif', slots: [['GK', .05, .5], ['RB', .22, .84], ['CB', .2, .62], ['CB', .2, .38], ['LB', .22, .16], ['CDM', .38, .5], ['CM', .5, .7], ['CAM', .52, .3], ['RW', .74, .84], ['ST', .8, .5], ['LW', .74, .16]] },
  '4-4-2': { info: 'Seimbang', slots: [['GK', .05, .5], ['RB', .22, .84], ['CB', .2, .62], ['CB', .2, .38], ['LB', .22, .16], ['RW', .5, .86], ['CM', .46, .62], ['CM', .46, .38], ['LW', .5, .14], ['ST', .76, .64], ['ST', .76, .36]] },
  '4-2-3-1': { info: 'Penguasaan lini tengah', slots: [['GK', .05, .5], ['RB', .22, .84], ['CB', .2, .62], ['CB', .2, .38], ['LB', .22, .16], ['CDM', .38, .64], ['CDM', .38, .36], ['RW', .6, .84], ['CAM', .6, .5], ['LW', .6, .16], ['ST', .8, .5]] },
  '3-5-2': { info: 'Dominasi lini tengah', slots: [['GK', .05, .5], ['CB', .2, .76], ['CB', .17, .5], ['CB', .2, .24], ['RB', .44, .9], ['LB', .44, .1], ['CDM', .4, .5], ['CM', .53, .68], ['CM', .53, .32], ['ST', .78, .62], ['ST', .78, .38]] }
};
D.FORM_LIST = Object.keys(D.FORMATIONS);

D.compat = function (slotPos, pos) {
  if (slotPos === pos) return 1;
  if (slotPos === 'GK' || pos === 'GK') return 0.55;
  if (D.GROUP[slotPos] === D.GROUP[pos]) return 0.92;
  return 0.8;
};

/* turnamen */
D.TOURNAMENTS = {
  beginner: { id: 'beginner', name: 'Beginner Cup', teams: 4, unlock: 0, mult: 1, ovr: [42, 47, 52], banner: 'UI/Tournament/Tournament_Banner_Beginner_Cup.png', logo: 'UI/Tournament/Beginner_Cup_Logo.png', bracket: 'UI/Tournament/Tournament_Bracket_4.png',
    names: ['Warung FC', 'Sawah United', 'Kopi Rangers'], desc: 'Turnamen pemula. 4 tim, sistem gugur.' },
  cozy: { id: 'cozy', name: 'Cozy League Cup', teams: 8, unlock: 600, mult: 1.5, ovr: [50, 54, 57, 60, 63, 66, 68], banner: 'UI/Tournament/Tournament_Banner_Cozy_League_Cup.png', logo: 'UI/Tournament/Cozy_League_Logo.png', bracket: 'UI/Tournament/Tournament_Bracket_8.png',
    names: ['Teh Manis SC', 'Soto Stars', 'Bakso Boys', 'Nasi Goreng FC', 'Es Campur Utd', 'Gado-Gado City', 'Martabak FC'], desc: '8 tim, sistem gugur. Lawan lebih tangguh.' },
  grand: { id: 'grand', name: 'Grand Pixel Cup', teams: 8, unlock: 1800, mult: 2, ovr: [62, 66, 70, 73, 76, 79, 83], banner: 'UI/Tournament/Tournament_Banner_Grand_Pixel_Cup.png', logo: 'UI/Tournament/Grand_Pixel_Cup_Logo.png', bracket: 'UI/Tournament/Tournament_Bracket_8.png',
    names: ['Pixel Titans', 'Neon Strikers', 'Lava Legends', 'Aurora FC', 'Thunder Pixel', 'Golden Boots', 'Iron Pixel'], desc: 'Kompetisi tertinggi. Hanya untuk tim terbaik.' }
};
D.TOUR_LIST = ['beginner', 'cozy', 'grand'];
D.REWARD = { win: 100, lose: 25, semi: 150, champ: 500, runner: 200 };
D.ACH = {
  first_win: { n: 'First Tournament Win', img: 'Branding/Achievement_First_Tournament_Win.png', coins: 200, d: 'Menang pertandingan turnamen pertama' },
  clean_sheet: { n: 'Clean Sheet', img: 'Branding/Achievement_Clean_Sheet.png', coins: 150, d: 'Menang tanpa kebobolan' },
  hat_trick: { n: 'Hat-trick', img: 'Branding/Achievement_Hat_trick.png', coins: 200, d: 'Satu pemain mencetak 3 gol' },
  comeback: { n: 'Comeback Victory', img: 'Branding/Achievement_Comeback_Victory.png', coins: 250, d: 'Menang setelah tertinggal' },
  perfect: { n: 'Perfect Tournament', img: 'Branding/Achievement_Perfect_Tournament.png', coins: 400, d: 'Juara tanpa kekalahan' }
};
D.TEAM_EMBLEMS = ['Branding/Team_Emblem_01.png', 'Branding/Team_Emblem_02.png', 'Branding/Team_Emblem_03.png', 'Branding/Team_Emblem_04.png', 'Branding/Team_Emblem_05.png', 'Branding/Team_Emblem_06.png'];

/* ---------- SAVE ---------- */
const KEY = 'cozy_pixel_soccer_save_v1';
G.save = {
  data: null,
  defaults() {
    const lineup = D.autoLineup('4-3-3', D.DEFAULT_IDS);
    const up = {}; D.DEFAULT_IDS.forEach(id => up[id] = { lv: 1, xp: 0, pts: 0, stats: Object.assign({}, D.PLAYERS[id].stats) });
    return {
      v: 1, club: { name: 'Cozy FC', coins: 800 },
      players: { owned: D.DEFAULT_IDS.slice(), starting_lineup: lineup, bench: D.DEFAULT_IDS.filter(i => !lineup.includes(i)), upgrades: up, captain: 'CM', formation: '4-3-3' },
      shop: { stock: [], refreshes: 0 },
      tournaments: { unlocked: ['beginner'], completed: [], best_results: {}, active: null },
      progress: { matches_played: 0, matches_won: 0, trophies: 0, goals: 0, achievements: {} },
      training: { best: {} },
      settings: { music: true, sfx: true, vibration: true, half: 3, musicVol: 0.6, sfxVol: 0.8, side: 'right' }
    };
  },
  load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { }
    let d = null;
    if (raw) { try { d = JSON.parse(raw); } catch (e) { try { d = JSON.parse(localStorage.getItem(KEY + '_bak')); } catch (e2) { d = null; } } }
    this.data = this.validate(d);
    if (!this.data.shop.stock.length) D.refreshShop(true);
    this.commit();
  },
  /* validasi struktur + batas nilai; fallback ke default bila rusak */
  validate(d) {
    const def = this.defaults();
    if (!d || typeof d !== 'object' || d.v !== 1 || !d.players || !d.club) return def;
    try {
      const out = Object.assign({}, def, d);
      out.club = { name: String(d.club.name || 'Cozy FC').slice(0, 16), coins: G.clamp(Math.floor(+d.club.coins) || 0, 0, 9999999) };
      const pl = d.players;
      const owned = (Array.isArray(pl.owned) ? pl.owned : []).filter((id, i, a) => D.PLAYERS[id] && a.indexOf(id) === i);
      D.DEFAULT_IDS.forEach(id => { if (!owned.includes(id)) owned.push(id); });
      const up = {};
      owned.forEach(id => {
        const t = D.PLAYERS[id], u = (pl.upgrades && pl.upgrades[id]) || {};
        const st = {}; t.keys.forEach(k => st[k] = G.clamp(Math.floor(u.stats && +u.stats[k]) || t.stats[k], 10, 99));
        up[id] = { lv: G.clamp(Math.floor(+u.lv) || t.startLv, 1, t.maxlv), xp: G.clamp(Math.floor(+u.xp) || 0, 0, 99), pts: G.clamp(Math.floor(+u.pts) || 0, 0, 999), stats: st };
      });
      const form = D.FORMATIONS[pl.formation] ? pl.formation : '4-3-3';
      let lineup = Array.isArray(pl.starting_lineup) ? pl.starting_lineup.slice(0, 11) : [];
      const ok = lineup.length === 11 && lineup.every((id, i) => owned.includes(id) && lineup.indexOf(id) === i);
      if (!ok) lineup = D.autoLineup(form, owned, up);
      out.players = { owned, starting_lineup: lineup, bench: owned.filter(i => !lineup.includes(i)), upgrades: up, captain: lineup.includes(pl.captain) ? pl.captain : lineup[6], formation: form };
      const tt = d.tournaments || {};
      out.tournaments = { unlocked: (Array.isArray(tt.unlocked) ? tt.unlocked : []).filter(t => D.TOURNAMENTS[t]), completed: (Array.isArray(tt.completed) ? tt.completed : []).filter(t => D.TOURNAMENTS[t]), best_results: tt.best_results && typeof tt.best_results === 'object' ? tt.best_results : {}, active: tt.active && D.TOURNAMENTS[tt.active.id] ? tt.active : null };
      if (!out.tournaments.unlocked.includes('beginner')) out.tournaments.unlocked.push('beginner');
      out.shop = { stock: (d.shop && Array.isArray(d.shop.stock) ? d.shop.stock : []).filter(id => D.PLAYERS[id] && D.PLAYERS[id].rec && !owned.includes(id)).slice(0, 4), refreshes: Math.floor(+(d.shop && d.shop.refreshes)) || 0 };
      out.progress = Object.assign(def.progress, d.progress || {});
      out.progress.achievements = (d.progress && typeof d.progress.achievements === 'object') ? d.progress.achievements : {};
      out.training = { best: (d.training && d.training.best) || {} };
      out.settings = Object.assign(def.settings, d.settings || {});
      out.settings.half = [1, 2, 3].includes(+out.settings.half) ? +out.settings.half : 3;
      return out;
    } catch (e) { return def; }
  },
  commit() {
    try { const s = JSON.stringify(this.data); const old = localStorage.getItem(KEY); if (old) localStorage.setItem(KEY + '_bak', old); localStorage.setItem(KEY, s); } catch (e) { }
  },
  reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '_bak'); } catch (e) { } this.data = this.defaults(); D.refreshShop(true); this.commit(); }
};

/* ---------- PEMAIN (data dinamis) ---------- */
D.get = function (id) {
  const t = D.PLAYERS[id], u = G.save.data.players.upgrades[id];
  return Object.assign({}, t, { lv: u.lv, xp: u.xp, pts: u.pts, stats: u.stats });
};
D.ovr = function (p) {
  const g = D.GROUP[p.pos], s = p.stats;
  const w = p.kind === 'gk' ? [.3, .2, .2, .15, .05, .1] : g === 'DEF' ? [.15, .02, .13, .1, .4, .2] : g === 'MID' ? [.15, .1, .3, .25, .1, .1] : [.2, .35, .1, .25, .02, .08];
  let v = 0; p.keys.forEach((k, i) => v += s[k] * w[i]); return Math.round(v);
};
D.owned = () => G.save.data.players.owned.map(D.get);
D.costFor = lv => lv <= 5 ? 50 : lv <= 10 ? 100 : lv <= 15 ? 175 : 250;
D.canLevel = p => p.lv < p.maxlv;
D.levelUp = function (id) {
  const u = G.save.data.players.upgrades[id], t = D.PLAYERS[id], c = D.costFor(u.lv);
  if (u.lv >= t.maxlv || G.save.data.club.coins < c) return false;
  G.save.data.club.coins -= c; u.lv++; u.pts += 3; G.save.commit(); return true;
};
D.spend = function (id, key) {
  const u = G.save.data.players.upgrades[id]; if (u.pts < 1 || u.stats[key] >= 99) return false;
  u.stats[key]++; u.pts--; G.save.commit(); return true;
};
/* XP: 100 xp = 1 poin atribut. Mengembalikan jumlah poin baru */
D.addXP = function (id, xp) {
  const u = G.save.data.players.upgrades[id]; if (!u) return 0;
  u.xp += Math.round(xp); let g = 0; while (u.xp >= 100) { u.xp -= 100; u.pts++; g++; }
  return g;
};
D.addCoins = n => { G.save.data.club.coins = Math.max(0, G.save.data.club.coins + Math.round(n)); };

/* ---------- LINEUP ---------- */
D.autoLineup = function (form, ids, up) {
  const slots = D.FORMATIONS[form].slots, used = new Set(), out = [];
  const val = id => { const t = D.PLAYERS[id]; const s = up && up[id] ? up[id].stats : t.stats; let v = 0; t.keys.forEach(k => v += s[k]); return v; };
  slots.forEach((sl, i) => {
    let best = null, bs = -1;
    ids.forEach(id => { if (used.has(id)) return; const t = D.PLAYERS[id]; const sc = D.compat(sl[0], t.pos) * 1000 + val(id) / 10 + (t.pos === sl[0] ? 500 : 0); if (sc > bs) { bs = sc; best = id; } });
    used.add(best); out.push(best);
  });
  return out;
};
D.setFormation = function (form) {
  const p = G.save.data.players; p.formation = form;
  p.starting_lineup = D.autoLineup(form, p.owned, p.upgrades); p.bench = p.owned.filter(i => !p.starting_lineup.includes(i));
  if (!p.starting_lineup.includes(p.captain)) p.captain = p.starting_lineup[6];
  G.save.commit();
};
D.swapSlots = function (a, b) { const l = G.save.data.players.starting_lineup;[l[a], l[b]] = [l[b], l[a]]; G.save.commit(); };
D.swapBench = function (slot, benchId) {
  const p = G.save.data.players; const old = p.starting_lineup[slot];
  p.starting_lineup[slot] = benchId; p.bench = p.owned.filter(i => !p.starting_lineup.includes(i));
  if (p.captain === old) p.captain = benchId; G.save.commit();
};
D.slotRating = function (id, slotPos) { const p = D.get(id); return Math.round(D.ovr(p) * D.compat(slotPos, p.pos)); };
D.teamRatings = function () {
  const p = G.save.data.players, sl = D.FORMATIONS[p.formation].slots; let a = 0, m = 0, d = 0, o = 0, na = 0, nm = 0, nd = 0;
  p.starting_lineup.forEach((id, i) => { const r = D.slotRating(id, sl[i][0]); o += r; const g = D.GROUP[sl[i][0]]; if (g === 'ATT') { a += r; na++; } else if (g === 'MID') { m += r; nm++; } else { d += r; nd++; } });
  return { att: Math.round(a / (na || 1)), mid: Math.round(m / (nm || 1)), def: Math.round(d / (nd || 1)), ovr: Math.round(o / 11) };
};
D.activePassives = function () {
  const p = G.save.data.players, out = [];
  p.starting_lineup.forEach(id => { const t = D.PLAYERS[id]; if (t.passive) out.push({ id, name: t.name, passive: t.passive }); });
  return out;
};

/* ---------- SHOP ---------- */
D.refreshShop = function (free) {
  const s = G.save.data, owned = s.players ? s.players.owned : [];
  const pool = D.RECRUIT_IDS.filter(id => !owned.includes(id));
  G.shuffle(pool);
  const cheap = pool.filter(id => D.PLAYERS[id].rarity === 'Common');
  const stock = []; if (cheap.length) stock.push(cheap[0]);
  pool.forEach(id => { if (stock.length < 4 && !stock.includes(id)) stock.push(id); });
  s.shop.stock = stock; if (!free) s.shop.refreshes++; G.save.commit && G.save.data && G.save.commit();
};
D.buy = function (id) {
  const s = G.save.data, t = D.PLAYERS[id];
  if (!t || s.players.owned.includes(id) || s.club.coins < t.price) return false;
  s.club.coins -= t.price; s.players.owned.push(id);
  s.players.upgrades[id] = { lv: t.startLv, xp: 0, pts: 0, stats: Object.assign({}, t.stats) };
  s.players.bench.push(id); s.shop.stock = s.shop.stock.filter(x => x !== id);
  G.save.commit(); return true;
};

/* ---------- OPPONENT ---------- */
D.TEAM_COLORS = ['Warung', 'Sawah'];
D.makeOpponent = function (name, ovr, emblem) {
  const form = G.pick(D.FORM_LIST), slots = D.FORMATIONS[form].slots, players = [];
  const names = ['Agus', 'Budi', 'Cahya', 'Dodi', 'Eko', 'Fikri', 'Gilang', 'Hadi', 'Iwan', 'Joko', 'Kiki', 'Lutfi', 'Mada', 'Nanda', 'Oki', 'Pandu', 'Qori', 'Rudi', 'Sigit', 'Tono', 'Udin', 'Vito', 'Wawan', 'Yudi', 'Zaki'];
  G.shuffle(names);
  slots.forEach((sl, i) => {
    const pos = sl[0], tpl = TPL[pos], keys = pos === 'GK' ? D.GKS : D.OUT, st = {};
    keys.forEach((k, j) => st[k] = G.clamp(Math.round(tpl[j] + (ovr - 56) * 1.0 + G.rnd(-4, 4)), 25, 97));
    const src = D.DEFAULT_IDS.find(id => D.PLAYERS[id].pos === pos) || 'ST';
    const tplP = pos === 'CB' ? (players.filter(q => q.pos === 'CB').length % 2 ? 'CB2' : 'CB1') : src;
    players.push({ id: 'opp' + i, srcId: tplP, name: names[i], num: [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11][i] || (i + 1), pos, kind: pos === 'GK' ? 'gk' : 'out', keys, stats: st, passive: null, rarity: 'Common', away: true });
  });
  return { name, ovr, emblem: emblem || 0, form, players, skill: G.clamp((ovr - 40) / 50, 0.1, 1) };
};
D.myTeam = function () {
  const p = G.save.data.players, form = p.formation, sl = D.FORMATIONS[form].slots;
  const players = p.starting_lineup.map((id, i) => Object.assign(D.get(id), { srcId: id, slotPos: sl[i][0], compat: D.compat(sl[i][0], D.PLAYERS[id].pos), captain: id === p.captain }));
  return { name: G.save.data.club.name, ovr: D.teamRatings().ovr, emblem: 0, form, players, bench: p.bench.map(D.get), mine: true };
};
D.abbr = n => { const w = n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean); return (w.length > 1 ? (w[0][0] + w[1][0] + (w[1][1] || '')) : n.slice(0, 3)).toUpperCase().slice(0, 3); };

/* ---------- Turnamen: state & simulasi ---------- */
D.startTournament = function (id) {
  const T = D.TOURNAMENTS[id], s = G.save.data;
  const opps = T.names.slice(0, T.teams - 1).map((n, i) => ({ name: n, ovr: T.ovr[i], emblem: (i + 1) % 6 }));
  G.shuffle(opps);
  const teams = [{ name: s.club.name, mine: true, emblem: 0, ovr: 0 }].concat(opps);
  s.tournaments.active = { id, teams, round: 0, rounds: [], results: [], alive: teams.map((t, i) => i), played: 0, lost: false, mw: 0 };
  s.tournaments.active.rounds = [teams.map((t, i) => i)];
  G.save.commit(); return s.tournaments.active;
};
D.roundName = (n, total) => total === 2 ? (n === 0 ? 'Semi Final' : 'Final') : (n === 0 ? 'Quarter Final' : n === 1 ? 'Semi Final' : 'Final');
D.simScore = function (a, b) {
  const d = (a.ovr - b.ovr) / 40, ga = Math.max(0, Math.round(1.4 + d * 1.2 + G.rnd(-1.2, 1.4))), gb = Math.max(0, Math.round(1.4 - d * 1.2 + G.rnd(-1.2, 1.4)));
  return [ga, gb];
};
