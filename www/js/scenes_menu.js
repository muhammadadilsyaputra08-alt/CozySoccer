'use strict';
/* Cozy Pixel Soccer - menu scenes */

const C = G.C;

/* ---------- util tampilan ---------- */
S.coinBar = function (x, y) {
  G.draw('Icons/Currency/Coin.png', x - 4, y - 1, 16, 16);
  G.text(G.fmt(G.save.data.club.coins), x + 58, y + 1, { a: 'r', c: C.gold });
};
S.header = function (title) {
  G.backdrop(); G.g.fillStyle = 'rgba(57,12,20,0.55)'; G.g.fillRect(0, 0, G.LW, G.LH);
  G.nine('UI/Common/panel_wood_9slice.png', 0, 0, G.LW, 34, 6);
  G.text(title, G.LW / 2, 11, { a: 'c', c: C.gold });
  S.coinBar(G.LW - 62, 9);
};
S.portrait = function (p, x, y, size) { G.draw(D.portraitPath(p), x, y, size, size); };
S.pimg = p => D.portraitPath(p.srcId ? D.PLAYERS[p.srcId] : p);
S.picon = p => D.iconPath(p.srcId ? D.PLAYERS[p.srcId] : p);
S.card = function (p, x, y, o) {
  o = o || {}; const g = G.g;
  G.draw('Characters/Cards/Player_Card_' + p.rarity + '.png', x, y);
  g.save(); g.beginPath(); g.rect(x + 6, y + 12, 68, 66); g.clip(); G.draw(D.portraitPath(p), x + 8, y + 12, 64, 64); g.restore();
  G.text(p.pos, x + 9, y + 66, { s: 1, c: C.cream }); G.text('Lv' + (p.lv || p.startLv), x + 71, y + 66, { s: 1, a: 'r' });
  G.text('OVR ' + D.ovr(p), x + 71, y + 13, { s: 1, a: 'r', c: C.gold });
  G.text(p.name.slice(0, 9), x + 6, y + 79, { c: C.maroon, sh: false });
  const pr = p.kind === 'gk' ? [p.keys[0], p.keys[1]] : (D.GROUP[p.pos] === 'DEF' ? ['Defense', 'Physical'] : D.GROUP[p.pos] === 'MID' ? ['Passing', 'Dribbling'] : ['Shooting', 'Pace']);
  pr.forEach((k, i) => { G.text(k.slice(0, 3).toUpperCase(), x + 6, y + 91 + i * 10, { c: C.maroon, sh: false, s: 1 }); G.text(p.stats[k], x + 72, y + 91 + i * 10, { c: C.rust, sh: false, a: 'r' }); });
};
S.statRow = function (p, x, y, w) {
  p.keys.forEach((k, i) => {
    const yy = y + i * 17; G.draw('Icons/' + D.STAT_ID[k] + '.png', x, yy, 16, 16);
    G.text(D.STAT_ID_NAME[k], x + 20, yy + 3, { s: 1 }); G.text(p.stats[k], x + w - 66, yy + 3, { a: 'r', c: C.gold });
    G.g.drawImage(G.$('UI/Player_Upgrade/stat_bar_green.png'), 0, 0, Math.round(64 * p.stats[k] / 100), 8, x + w - 62, yy + 4, Math.round(64 * p.stats[k] / 100), 8);
  });
};

/* ---------- boot ---------- */
S.boot = {
  enter() { this.prog = 0; this.ready = false; this.err = null; },
  update() { },
  draw(g) {
    G.draw('Branding/Loading_Screen_320x180.png', 0, 0, 0, 0);
  }
};
S.boot.draw = function (g) {
  g.fillStyle = '#390c14'; g.fillRect(0, 0, G.LW, G.LH);
  const im = G.img['Branding/Loading_Screen_320x180.png'];
  if (im) { const x = Math.floor((G.LW - 640) / 2); g.drawImage(im, 0, 0, 320, 180, x, 12, 640, 360); }
  const w = 220, x = (G.LW - w) / 2;
  if (G.json['Branding/font_atlas.json'] && G.img['Branding/font_atlas.png']) { G.text('Memuat... ' + Math.round(this.prog * 100) + '%', G.LW / 2, G.LH - 46, { a: 'c' }); }
  g.fillStyle = '#2a1a0e'; g.fillRect(x, G.LH - 28, w, 8); g.fillStyle = '#ffbc30'; g.fillRect(x + 1, G.LH - 27, (w - 2) * this.prog, 6);
};

/* ---------- menu utama ---------- */
S.menu = {
  enter() { G.audio.music('BGM_Main_Menu'); this.exitAsk = false; },
  onBack() { this.exitAsk = true; },
  draw(g) {
    G.backdrop(); const sd = G.save.data, cx = G.LW / 2;
    // bar atas
    g.fillStyle = 'rgba(57,12,20,0.7)'; g.fillRect(0, 0, G.LW, 24);
    G.draw('Branding/Team_Emblem_01.png', 4, -4, 32, 32); G.text(sd.club.name, 38, 7, { c: C.cream });
    G.text('Pemain ' + sd.players.owned.length, 150, 7, { s: 1 });
    const done = sd.tournaments.completed.length, tr = sd.progress.trophies;
    G.text('Piala ' + tr, 240, 7, { s: 1, c: C.gold });
    S.coinBar(G.LW - 62, 4);
    const act = sd.tournaments.active; G.text(act ? 'Turnamen: ' + D.TOURNAMENTS[act.id].name : 'Turnamen: -', G.LW - 76, 7, { s: 1, a: 'r' });
    G.draw('Branding/Game_Logo.png', cx - 182, 26, 364, 136);
    const bx = cx - 212, by = 168, bw = 208, bh = 44;
    const list = [['play', 'Main'], ['training', 'Training'], ['tournament', 'Tournament'], ['team', 'Team'], ['players', 'Players'], ['upgrade', 'Upgrade'], ['shop', 'Shop'], ['settings', 'Settings']];
    UI.lock = this.exitAsk;
    list.forEach((it, i) => {
      const col = i % 2 === 0 ? 0 : 1, row = i >> 1, x = bx + col * 216, y = by + row * 50 - 2;
      let hit = false;
      if (it[0] === 'play') hit = UI.sprite('UI/Main_Menu/btn_play.png', x, y, 2);
      else if (it[0] === 'upgrade') { hit = UI.button('UPGRADE', x, y, bw, bh, { kind: 'button_normal', icon: 'Icons/Progress/Upgrade.png', s: 1 }); }
      else hit = UI.sprite('UI/Main_Menu/btn_' + it[0] + '.png', x, y, 2);
      if (hit) { if (it[0] === 'play') G.go('friendly'); else G.go(it[0]); }
    });
    if (UI.sprite('UI/Main_Menu/btn_exit.png', G.LW - 108, G.LH - 26, 1)) this.exitAsk = true;
    UI.lock = false;
    if (this.exitAsk) { const r = UI.dialog('Keluar', 'Keluar dari game?', 'Keluar', 'Batal'); if (r === true) { if (window.Android && Android.exitApp) Android.exitApp(); else this.exitAsk = false; } else if (r === false) this.exitAsk = false; }
  }
};

/* ---------- pertandingan persahabatan ---------- */
S.friendly = {
  enter() { },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('PERTANDINGAN CEPAT'); if (UI.back()) { G.go('menu'); return; }
    const R = D.teamRatings(), cx = G.LW / 2;
    G.text('Tim kamu: OVR ' + R.ovr, cx, 50, { a: 'c', c: C.gold });
    const lv = [['Mudah', -8, 0.8, 40], ['Normal', 0, 1, 70], ['Sulit', 9, 1.06, 110]];
    lv.forEach((l, i) => {
      const x = cx - 150, y = 74 + i * 78;
      G.panel('cream', x, y, 300, 68);
      G.text(l[0], x + 14, y + 10, { c: C.maroon, sh: false }); G.text('Lawan OVR ~' + Math.max(30, R.ovr + l[1]) + '   Hadiah menang: ' + l[3] + ' koin', x + 14, y + 28, { c: C.dark, sh: false, s: 1 });
      if (UI.button('Main', x + 200, y + 34, 90, 26, { kind: 'button_green_normal' })) {
        const opp = D.makeOpponent(G.pick(['Kampung FC', 'Desa United', 'Pasar City', 'Sungai Stars']), Math.max(30, R.ovr + l[1]), G.rndi(1, 5));
        G.go('match', { home: D.myTeam(), away: opp, diff: l[2], reward: l[3], friendly: true, onDone: out => { if (out.win) D.addCoins(l[3]); else if (out.res === 'draw') D.addCoins(l[3] / 2); else D.addCoins(15); G.save.commit(); G.go('result', { out, p: { friendly: true, coins: out.win ? l[3] : out.res === 'draw' ? Math.round(l[3] / 2) : 15 } }); } });
      }
    });
  }
};

/* ---------- settings ---------- */
S.settings = {
  enter() { this.reset = false; },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('SETTINGS'); if (UI.back()) { G.go('menu'); return; }
    const s = G.save.data.settings, x = 70, w = G.LW - 140; G.panel('cream', x, 44, w, 296);
    const row = (i, icon, label) => { const y = 54 + i * 40; G.draw('Icons/' + icon + '.png', x + 12, y + 2, 16, 16); G.text(label, x + 36, y + 5, { c: C.maroon, sh: false }); return y; };
    let y = row(0, 'Settings/Music', 'Musik'); if (UI.sprite(s.music ? 'UI/Common/toggle_on.png' : 'UI/Common/toggle_off.png', x + w - 50, y, 1.3)) { s.music = !s.music; G.audio.refresh(); G.save.commit(); }
    y = row(1, 'Settings/Sound', 'Efek suara'); if (UI.sprite(s.sfx ? 'UI/Common/toggle_on.png' : 'UI/Common/toggle_off.png', x + w - 50, y, 1.3)) { s.sfx = !s.sfx; G.save.commit(); }
    y = row(2, 'Settings/Vibration', 'Getar'); if (UI.sprite(s.vibration ? 'UI/Common/toggle_on.png' : 'UI/Common/toggle_off.png', x + w - 50, y, 1.3)) { s.vibration = !s.vibration; G.save.commit(); if (s.vibration) G.vibrate(40); }
    y = row(3, 'Match/Clock', 'Durasi babak: ' + s.half + ' menit'); [1, 2, 3].forEach((m, i) => { if (UI.button(String(m), x + w - 130 + i * 38, y - 2, 34, 22, { kind: s.half === m ? 'button_green_normal' : 'button_normal' })) { s.half = m; G.save.commit(); } });
    y = row(4, 'Settings/Language', 'Bahasa: Indonesia');
    y = row(5, 'Settings/Info', 'Cozy Pixel Soccer v1.0 alpha');
    y = row(6, 'Settings/Privacy', 'Offline penuh, tanpa data dikirim');
    if (UI.button('Hapus Data Simpanan', x + 20, 54 + 7 * 40 - 8, w - 40, 26, { kind: 'button_normal', c: C.cream })) this.reset = true;
    if (this.reset) { const r = UI.dialog('Reset?', 'Semua progres akan dihapus permanen.', 'Hapus', 'Batal'); if (r === true) { G.save.reset(); this.reset = false; G.audio.refresh(); } else if (r === false) this.reset = false; }
  }
};

/* ---------- team ---------- */
S.team = {
  enter() { this.sel = null; this.selBench = null; this.cmp = null; },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('TEAM'); if (UI.back()) { G.go('menu'); return; }
    const pd = G.save.data.players, sl = D.FORMATIONS[pd.formation].slots, ox = Math.max(8, Math.round((G.LW - 640) / 2) + 8);
    const px = ox, py = 42, pw = 316, ph = 238;
    g.fillStyle = '#6f8a52'; g.fillRect(px, py, pw, ph); g.strokeStyle = '#e8e2c0'; g.lineWidth = 1; g.strokeRect(px + 3.5, py + 3.5, pw - 7, ph - 7); g.beginPath(); g.moveTo(px + pw / 2, py + 4); g.lineTo(px + pw / 2, py + ph - 4); g.stroke();
    g.beginPath(); g.arc(px + pw / 2, py + ph / 2, 24, 0, 7); g.stroke(); g.strokeRect(px + 4, py + 70, 40, 98); g.strokeRect(px + pw - 44, py + 70, 40, 98);
    pd.starting_lineup.forEach((id, i) => {
      const s = sl[i], x = px + 16 + s[1] * (pw - 50), y = py + 12 + s[2] * (ph - 56), p = D.get(id);
      G.draw('UI/Team_Management/slot_starting_xi.png', x - 8, y - 6, 32, 32);
      G.draw(D.iconPath(p), x - 6, y - 4, 28, 28);
      if (id === pd.captain) G.draw('UI/Team_Management/captain_badge.png', x + 8, y - 8);
      const comp = D.compat(s[0], p.pos); G.text(s[0], x + 8, y + 26, { a: 'c', s: 1, c: comp < 1 ? C.red : C.cream });
      if (this.sel === i) G.draw('UI/Team_Management/selector_frame.png', x - 9, y - 7);
      if (UI.tap(x - 8, y - 6, 32, 38)) { if (this.sel === null || this.sel === i) { this.sel = this.sel === i ? null : i; } else { D.swapSlots(this.sel, i); this.sel = null; } this.selBench = null; }
    });
    // panel kanan
    const rx = px + pw + 10, rw = G.LW - rx - 8;
    G.panel('dark', rx, 42, rw, 238);
    const fi = D.FORM_LIST.indexOf(pd.formation);
    if (UI.button('<', rx + 6, 48, 24, 22)) D.setFormation(D.FORM_LIST[(fi + 3) % 4]);
    G.text(pd.formation, rx + rw / 2, 53, { a: 'c', c: C.gold }); if (UI.button('>', rx + rw - 30, 48, 24, 22)) D.setFormation(D.FORM_LIST[(fi + 1) % 4]);
    G.text(D.FORMATIONS[pd.formation].info, rx + rw / 2, 72, { a: 'c', s: 1 });
    const R = D.teamRatings(); G.text('ATK ' + R.att + '  MID ' + R.mid + '  DEF ' + R.def + '  OVR ' + R.ovr, rx + rw / 2, 86, { a: 'c', s: 1, c: C.gold });
    G.text('Cadangan (tap lalu pilih slot)', rx + 8, 100, { s: 1 });
    const bn = pd.bench.length, vh = 112; UI.scrollBegin('bench', rx + 4, 112, rw - 8, vh, bn * 22);
    pd.bench.forEach((id, i) => {
      const p = D.get(id), y = 112 + i * 22, sel = this.selBench === id; G.nine('UI/Common/' + (sel ? 'button_green_normal' : 'button_normal') + '_9slice.png', rx + 6, y, rw - 18, 20, 5);
      G.draw(D.iconPath(p), rx + 8, y - 4, 24, 24); G.text(p.pos + ' ' + p.name, rx + 36, y + 5, { s: 1 }); G.text(D.ovr(p), rx + rw - 16, y + 5, { s: 1, a: 'r', c: C.gold });
      if (UI.tapIn(rx + 6, y, rw - 18, 20)) { if (this.sel !== null) { D.swapBench(this.sel, id); this.sel = null; this.selBench = null; } else this.selBench = sel ? null : id; }
    });
    UI.scrollEnd();
    // info pilihan
    const iy = 288; G.panel('cream', ox, iy, G.LW - ox * 2 + 0, 90);
    const sid = this.sel !== null ? pd.starting_lineup[this.sel] : this.selBench;
    if (sid) {
      const p = D.get(sid); G.draw(D.portraitPath(p), ox + 8, iy + 12, 64, 64);
      G.text(p.name + '  ' + p.pos + '  Lv' + p.lv + '/' + p.maxlv, ox + 80, iy + 8, { c: C.maroon, sh: false });
      p.keys.forEach((k, i) => G.text(D.STAT_ID_NAME[k].slice(0, 4) + ' ' + p.stats[k], ox + 80 + (i % 3) * 78, iy + 26 + Math.floor(i / 3) * 12, { c: C.dark, sh: false, s: 1 }));
      G.text(p.passive ? p.passive + ': ' + D.PASSIVES[p.passive] : 'Tanpa passive', ox + 80, iy + 54, { c: C.rust, sh: false, s: 1 });
      if (this.sel !== null) { if (UI.button(sid === pd.captain ? 'Kapten' : 'Jadikan Kapten', G.LW - ox - 130, iy + 58, 120, 24, { kind: 'button_green_normal', icon: 'Icons/Player/Captain.png' })) { pd.captain = sid; G.save.commit(); } }
    } else {
      const ps = D.activePassives(); G.text('Passive aktif:', ox + 10, iy + 8, { c: C.maroon, sh: false });
      G.text(ps.length ? ps.map(q => q.name + ' (' + q.passive + ')').join(', ') : 'Belum ada. Rekrut pemain di Shop!', ox + 10, iy + 24, { c: C.dark, sh: false, s: 1 });
      G.text('Tap slot untuk menukar pemain. Pemain di luar posisi mendapat penalti (merah).', ox + 10, iy + 60, { c: C.sage, sh: false, s: 1 });
    }
  }
};

/* ---------- players ---------- */
S.players = {
  enter() { this.det = null; this.cmp = null; },
  onBack() { if (this.det) this.det = null; else G.go('menu'); },
  draw(g) {
    S.header('PLAYERS'); if (UI.back()) { this.onBack(); return; }
    const list = D.owned(), cw = 86, cols = Math.max(4, Math.floor((G.LW - 20) / cw)), ox = Math.round((G.LW - cols * cw) / 2), rows = Math.ceil(list.length / cols);
    UI.lock = !!this.det;
    UI.scrollBegin('pl', 0, 38, G.LW, G.LH - 38, rows * 122 + 10);
    list.forEach((p, i) => { const x = ox + (i % cols) * cw + 3, y = 42 + Math.floor(i / cols) * 122; S.card(p, x, y); if (p.id === G.save.data.players.captain) G.draw('UI/Team_Management/captain_badge.png', x + 60, y - 2); if (UI.tapIn(x, y, 80, 112)) this.det = p.id; });
    UI.scrollEnd(); UI.lock = false;
    if (this.det) this.drawDetail();
  },
  drawDetail() {
    const g = G.g; g.fillStyle = 'rgba(28,10,14,0.75)'; g.fillRect(0, 0, G.LW, G.LH);
    const p = D.get(this.det), w = 440, h = 300, x = (G.LW - w) / 2, y = 42;
    G.frame(x, y, w, h); S.card(p, x + 14, y + 16);
    G.text(p.name + (p.title ? ' - ' + p.title : ''), x + 106, y + 14, { c: C.gold }); G.draw('Icons/Rarity/' + p.rarity + '.png', x + 106, y + 30, 16, 16); G.text(D.RARITY[p.rarity].n + ' | ' + p.job, x + 126, y + 34, { s: 1, c: D.RARITY[p.rarity].c });
    G.text('Level ' + p.lv + ' / ' + p.maxlv + '   OVR ' + D.ovr(p) + '   No.' + p.num, x + 106, y + 52, { s: 1 });
    S.statRow(p, x + 106, y + 70, 220);
    G.text(p.passive ? 'Passive: ' + p.passive : 'Passive: -', x + 106, y + 178, { c: C.gold, s: 1 });
    G.wrap(p.passive ? D.PASSIVES[p.passive] : 'Pemain default tidak punya passive.', 320, 1).forEach((l, i) => G.text(l, x + 106, y + 192 + i * 12, { s: 1 }));
    G.text('XP ' + p.xp + '/100  Poin: ' + p.pts, x + 106, y + 226, { s: 1 });
    UI.bar(x + 106, y + 240, 160, p.xp / 100, 'gold');
    if (UI.button('Upgrade', x + 106, y + 260, 100, 28, { kind: 'button_green_normal' })) { S.upgrade.pre = p.id; G.go('upgrade'); }
    if (UI.closeBtn(x + w - 30, y + 4)) this.det = null;
  }
};

/* ---------- upgrade ---------- */
S.upgrade = {
  enter() { this.id = this.pre || G.save.data.players.starting_lineup[9]; this.pre = null; this.flash = 0; },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('UPGRADE'); if (UI.back()) { G.go('menu'); return; }
    const owned = G.save.data.players.owned, lx = 8, lw = 150;
    G.panel('dark', lx, 40, lw, 336);
    UI.scrollBegin('upl', lx + 4, 44, lw - 8, 328, owned.length * 26);
    owned.forEach((id, i) => { const p = D.get(id), y = 44 + i * 26, sel = id === this.id; G.nine('UI/Common/' + (sel ? 'button_green_normal' : 'button_normal') + '_9slice.png', lx + 6, y, lw - 22, 24, 5); G.draw(D.iconPath(p), lx + 8, y - 2, 26, 26); G.text(p.name, lx + 38, y + 4, { s: 1 }); G.text('Lv' + p.lv + (p.pts ? ' +' + p.pts : ''), lx + 38, y + 13, { s: 1, c: p.pts ? C.gold : C.grey }); if (UI.tapIn(lx + 6, y, lw - 22, 24)) this.id = id; });
    UI.scrollEnd();
    const p = D.get(this.id), x = lx + lw + 10, w = G.LW - x - 8;
    G.panel('cream', x, 40, w, 336);
    S.portrait(p, x + 10, 50, 64); G.text(p.name + ' (' + p.pos + ')', x + 84, 52, { c: C.maroon, sh: false }); G.text('OVR ' + D.ovr(p) + '  Lv ' + p.lv + '/' + p.maxlv, x + 84, 68, { c: C.dark, sh: false, s: 1 });
    if (p.lv >= p.maxlv) G.draw('UI/Player_Upgrade/max_level_indicator.png', x + 84, 84);
    G.text('XP ' + p.xp + '/100', x + 84, 100, { c: C.dark, sh: false, s: 1 }); UI.bar(x + 84, 112, 120, p.xp / 100, 'gold');
    G.text('Poin atribut: ' + p.pts, x + 10, 128, { c: C.rust, sh: false });
    p.keys.forEach((k, i) => {
      const yy = 148 + i * 26; G.draw('Icons/' + D.STAT_ID[k] + '.png', x + 10, yy, 16, 16); G.text(D.STAT_ID_NAME[k], x + 30, yy + 4, { c: C.maroon, sh: false, s: 1 });
      G.g.drawImage(G.$('UI/Player_Upgrade/stat_bar_green.png'), 0, 0, Math.round(64 * p.stats[k] / 100), 8, x + 100, yy + 4, Math.round(64 * p.stats[k] / 100), 8);
      G.text(p.stats[k], x + 174, yy + 4, { c: C.dark, sh: false });
      if (UI.button('+', x + w - 54, yy - 3, 40, 22, { kind: 'button_green_normal', disabled: p.pts < 1 || p.stats[k] >= 99 })) { D.spend(p.id, k); G.audio.sfx('SFX_Upgrade'); this.flash = 0.5; }
    });
    const cost = D.costFor(p.lv), can = p.lv < p.maxlv;
    G.text(can ? 'Naik level: ' + cost + ' koin (+3 poin)' : 'Level maksimum', x + 10, 312, { c: C.dark, sh: false, s: 1 });
    if (UI.button(can ? 'Naik Level' : 'MAX', x + 10, 328, 130, 30, { kind: 'button_green_normal', disabled: !can || G.save.data.club.coins < cost, icon: 'Icons/Progress/LevelUp.png' })) { if (D.levelUp(p.id)) { G.audio.sfx('SFX_Level_Up'); this.flash = 0.8; } }
    if (this.flash > 0) { this.flash -= 0.016; const f = Math.floor((0.8 - this.flash) * 12) % 8; g.drawImage(G.$('VFX/Upgrade_Effect_8f_32x32.png'), f * 32, 0, 32, 32, x + 26, 56, 64, 64); }
  }
};

/* ---------- shop ---------- */
S.shop = {
  enter() { G.audio.music('BGM_Shop'); this.sel = null; this.fx = 0; this.msg = null; },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('SHOP'); if (UI.back()) { G.go('menu'); return; }
    const sd = G.save.data, stock = sd.shop.stock; G.draw('UI/Recruitment/recruitment_banner.png', (G.LW - 320) / 2, 38, 320, 56);
    if (!stock.length) G.text('Stok habis. Perbarui stok!', G.LW / 2, 180, { a: 'c' });
    const cw = 92, ox = Math.round((G.LW - stock.length * cw) / 2);
    stock.forEach((id, i) => {
      const p = Object.assign({}, D.PLAYERS[id], { lv: D.PLAYERS[id].startLv }), x = ox + i * cw + 6, y = 104;
      S.card(p, x, y); G.draw('UI/Recruitment/price_tag.png', x + 14, y + 114); G.text(G.fmt(p.price), x + 52, y + 118, { a: 'c', c: sd.club.coins >= p.price ? C.gold : C.red, s: 1 });
      if (UI.tap(x, y, 80, 112)) this.sel = id;
    });
    if (UI.sprite('UI/Recruitment/shop_refresh_icon.png', G.LW - 60, 44, 2)) { if (sd.club.coins >= 100) { D.addCoins(-100); D.refreshShop(); } else this.msg = 'Koin kurang untuk refresh (100)'; }
    G.text('100', G.LW - 44, 80, { a: 'c', s: 1, c: C.gold });
    if (this.msg) G.text(this.msg, G.LW / 2, 270, { a: 'c', c: C.red });
    G.text('Stok diperbarui setelah turnamen selesai', G.LW / 2, G.LH - 14, { a: 'c', s: 1 });
    if (this.sel) {
      const p = D.get2(this.sel); g.fillStyle = 'rgba(28,10,14,0.75)'; g.fillRect(0, 0, G.LW, G.LH);
      const w = 420, h = 280, x = (G.LW - w) / 2, y = 52; G.frame(x, y, w, h); S.card(p, x + 14, y + 14);
      G.text(p.name + ' - ' + (p.title || ''), x + 106, y + 14, { c: C.gold }); G.text(D.RARITY[p.rarity].n + ' | ' + p.job + ' | Max Lv ' + p.maxlv, x + 106, y + 32, { s: 1, c: D.RARITY[p.rarity].c });
      S.statRow(p, x + 106, y + 52, 220); G.text('Passive: ' + (p.passive || '-'), x + 106, y + 160, { c: C.gold, s: 1 });
      G.wrap(p.passive ? D.PASSIVES[p.passive] : '', 300, 1).forEach((l, i) => G.text(l, x + 106, y + 174 + i * 12, { s: 1 }));
      const afford = sd.club.coins >= p.price;
      if (UI.sprite('UI/Recruitment/btn_recruit.png', x + 106, y + 226, 2)) { if (afford && D.buy(p.id)) { G.audio.sfx('SFX_Recruitment'); this.done = p.name; this.sel = null; } }
      G.text(G.fmt(p.price) + ' koin', x + 260, y + 240, { c: afford ? C.gold : C.red });
      if (UI.closeBtn(x + w - 30, y + 4)) this.sel = null;
    }
    if (this.done) { const r = UI.dialog('Berhasil!', this.done + ' bergabung dengan klubmu!', 'OK', 'Tutup'); if (r !== null) this.done = null; }
  }
};
D.get2 = id => Object.assign({}, D.PLAYERS[id], { lv: D.PLAYERS[id].startLv, stats: D.PLAYERS[id].stats });
