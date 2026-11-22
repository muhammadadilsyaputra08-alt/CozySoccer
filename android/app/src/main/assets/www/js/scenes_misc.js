'use strict';
/* Cozy Pixel Soccer - training, tournament, result */
const Cc = G.C, UIx = G.UI, Fz = W.F1;

/* ---------- RESULT ---------- */
S.result = {
  enter(p) { this.p = p; this.o = p.out; this.t = 0; G.audio.stop(); G.audio.music(this.o.win ? 'BGM_Victory' : 'BGM_Defeat'); if (this.o.win) G.audio.sfx('SFX_Trophy', 0.6); },
  onBack() { this.next(); },
  next() { if (this.p.p && this.p.p.tournament) G.go('tournament'); else G.go('menu'); },
  draw(g) {
    this.t += 0.016; const o = this.o, P = this.p.p || {};
    G.backdrop(); g.fillStyle = 'rgba(57,12,20,0.65)'; g.fillRect(0, 0, G.LW, G.LH);
    const w = 460, h = 360, x = (G.LW - w) / 2, y = 12; G.frame(x, y, w, h);
    G.text(o.win ? 'KEMENANGAN!' : o.lost ? 'KEKALAHAN' : 'SERI', G.LW / 2, y + 10, { a: 'c', c: o.win ? Cc.gold : Cc.cream, s: 2 });
    G.text(o.teams[0] + '  ' + o.score[0] + ' - ' + o.score[1] + '  ' + o.teams[1], G.LW / 2, y + 36, { a: 'c' });
    if (o.pen) G.text('Adu penalti ' + o.pen[0] + ' - ' + o.pen[1], G.LW / 2, y + 52, { a: 'c', s: 1, c: Cc.gold });
    const rows = [['Penguasaan bola', Math.round(o.poss[0] / ((o.poss[0] + o.poss[1]) || 1) * 100) + '%', Math.round(o.poss[1] / ((o.poss[0] + o.poss[1]) || 1) * 100) + '%'],
      ['Total tembakan', o.stats[0].shots, o.stats[1].shots], ['Tepat sasaran', o.stats[0].sot, o.stats[1].sot],
      ['Akurasi umpan', Math.round(o.stats[0].passOk / (o.stats[0].passes || 1) * 100) + '%', Math.round(o.stats[1].passOk / (o.stats[1].passes || 1) * 100) + '%'],
      ['Tekel', o.stats[0].tackles, o.stats[1].tackles], ['Penyelamatan', o.stats[0].saves, o.stats[1].saves]];
    rows.forEach((r, i) => { const yy = y + 70 + i * 15; G.text(r[1], x + 40, yy, { s: 1 }); G.text(r[0], G.LW / 2, yy, { a: 'c', s: 1, c: Cc.gold }); G.text(r[2], x + w - 40, yy, { a: 'r', s: 1 }); });
    const gl = o.goals.map(q => (q.team === 0 ? '' : '(L) ') + q.name + " " + q.min + "'" + (q.pen ? ' (P)' : q.own ? ' (OG)' : '')); 
    G.text(gl.length ? 'Gol: ' + gl.join(', ') : 'Tanpa gol', G.LW / 2, y + 166, { a: 'c', s: 1 });
    G.text('Pemain terbaik: ' + o.pom + ' (+30 XP)', G.LW / 2, y + 184, { a: 'c', c: Cc.gold });
    const lv = o.xp.filter(q => q.pts > 0).map(q => q.name + ' +' + q.pts + ' poin'); G.text('XP skuad +' + o.xp[0].xp + (lv.length ? '  |  ' + lv.slice(0, 3).join(', ') : ''), G.LW / 2, y + 202, { a: 'c', s: 1 });
    let yy = y + 224; const coins = P.coins !== undefined ? P.coins : (o.coins || 0);
    if (P.tour) { P.tour.lines.forEach(l => { G.text(l, G.LW / 2, yy, { a: 'c', s: 1 }); yy += 13; }); }
    if (coins) { G.draw('Icons/Currency/Coin.png', G.LW / 2 - 50, yy - 3, 16, 16); G.text('+' + G.fmt(coins) + ' koin', G.LW / 2 - 30, yy, { c: Cc.gold }); yy += 20; }
    o.ach.forEach((id, i) => { G.draw(D.ACH[id].img, G.LW / 2 - 100, yy - 6, 24, 24); G.text(D.ACH[id].n + '  +' + D.ACH[id].coins, G.LW / 2 - 70, yy, { c: Cc.gold, s: 1 }); yy += 24; });
    if (UIx.button('Lanjut', G.LW / 2 - 60, y + h - 40, 120, 28, { kind: 'button_green_normal' })) this.next();
  }
};

/* ---------- TOURNAMENT ---------- */
S.tournament = {
  enter() { G.audio.music('BGM_Tournament'); this.msg = null; this.sel = null; },
  onBack() { G.go('menu'); },
  draw(g) {
    S.header('TOURNAMENT'); if (UIx.back()) { G.go('menu'); return; }
    const sd = G.save.data, act = sd.tournaments.active;
    if (act) return this.drawActive(act);
    const cw = 200, ox = Math.round((G.LW - 3 * cw - 20) / 2);
    D.TOUR_LIST.forEach((id, i) => {
      const T = D.TOURNAMENTS[id], x = ox + i * (cw + 10), y = 46, unlocked = sd.tournaments.unlocked.includes(id);
      G.panel('cream', x, y, cw, 322);
      const bn = G.$(T.banner); G.draw(bn, x + 6, y + 8, cw - 12, Math.round((cw - 12) * bn.height / bn.width));
      G.draw(T.logo, x + cw / 2 - 24, y + 80, 48, 48); G.text(T.name, x + cw / 2, y + 134, { a: 'c', c: Cc.maroon, sh: false });
      G.wrap(T.desc, cw - 20, 1).forEach((l, k) => G.text(l, x + 10, y + 152 + k * 12, { c: Cc.dark, sh: false, s: 1 }));
      G.text(T.teams + ' tim | hadiah x' + T.mult, x + 10, y + 192, { c: Cc.rust, sh: false, s: 1 });
      const best = sd.tournaments.best_results[id]; G.text('Terbaik: ' + (best || '-'), x + 10, y + 208, { c: Cc.dark, sh: false, s: 1 });
      if (sd.tournaments.completed.includes(id)) G.draw('Icons/Status/Completed.png', x + cw - 26, y + 130, 16, 16);
      if (unlocked) { if (UIx.button('Mulai', x + 30, y + 270, cw - 60, 30, { kind: 'button_green_normal' })) { D.startTournament(id); G.save.commit(); }
      } else { G.draw('Icons/Status/Locked.png', x + cw / 2 - 8, y + 232, 16, 16); if (UIx.button('Buka ' + T.unlock + ' koin', x + 20, y + 270, cw - 40, 30, { disabled: sd.club.coins < T.unlock })) { D.addCoins(-T.unlock); sd.tournaments.unlocked.push(id); G.audio.sfx('SFX_Coin'); G.save.commit(); } }
    });
  },
  drawActive(act) {
    const T = D.TOURNAMENTS[act.id], sd = G.save.data, g = G.g, cur = act.rounds[act.round], total = Math.log2(T.teams);
    const rn = D.roundName(act.round, total);
    G.panel('cream', 20, 42, G.LW - 40, 332); G.draw(T.logo, 30, 48, 40, 40); G.text(T.name, 78, 54, { c: Cc.maroon, sh: false }); G.text(rn, 78, 70, { c: Cc.rust, sh: false });
    const half = Math.ceil(cur.length / 2);
    const colw = 170;
    cur.forEach((ti, i) => {
      const pair = i >> 1, side = i & 1, x = 34 + (pair % 4) * 148, y = 108 + Math.floor(pair / 4) * 80 + side * 26; const t = act.teams[ti];
      G.nine('UI/Common/' + (t.mine ? 'button_green_normal' : 'button_normal') + '_9slice.png', x, y, 140, 22, 5); G.draw(D.TEAM_EMBLEMS[t.emblem % 6], x + 2, y - 5, 28, 28); G.text(t.name.slice(0, 16), x + 32, y + 6, { s: 1 });
    });
    const me = act.teams[0], oi = cur[1], opp = act.teams[oi];
    G.text('Pertandingan berikutnya:  ' + me.name + '  vs  ' + opp.name, G.LW / 2, 262, { a: 'c', c: Cc.maroon, sh: false, s: 1 });
    G.text('Hasil: ' + (act.results.length ? act.results.map(r => r.s).join('  |  ') : '-'), G.LW / 2, 280, { a: 'c', c: Cc.dark, sh: false, s: 1 });
    if (UIx.button('Main Sekarang', G.LW / 2 - 90, 304, 180, 32, { kind: 'button_green_normal', icon: 'Icons/Football/Ball.png' })) this.play(act, T, opp, rn, total);
    if (UIx.button('Batalkan turnamen', G.LW / 2 - 90, 342, 180, 22)) { sd.tournaments.active = null; G.save.commit(); }
  },
  play(act, T, opp, rn, total) {
    const idx = Math.max(0, act.teams.indexOf(opp) - 1); const tm = D.makeOpponent(opp.name, opp.ovr, opp.emblem);
    const self = this;
    G.go('match', { home: D.myTeam(), away: tm, knockout: true, tournament: true, diff: 1, onDone: out => self.after(act, T, opp, rn, total, out) });
  },
  after(act, T, opp, rn, total, out) {
    const sd = G.save.data, cur = act.rounds[act.round], mult = T.mult, win = out.win; let coins = 0; const lines = [];
    coins += (win ? D.REWARD.win : D.REWARD.lose) * mult; lines.push((win ? 'Menang' : 'Kalah') + ' pertandingan: +' + Math.round(coins));
    const next = []; for (let i = 0; i < cur.length; i += 2) { let w; if (i === 0) w = win ? cur[0] : cur[1]; else { const sc = D.simScore(act.teams[cur[i]], act.teams[cur[i + 1]]); w = sc[0] > sc[1] ? cur[i] : sc[0] < sc[1] ? cur[i + 1] : (Math.random() < 0.5 ? cur[i] : cur[i + 1]); } next.push(w); }
    act.results.push({ s: rn.split(' ')[0].slice(0, 1) + ': ' + out.score[0] + '-' + out.score[1] + (out.pen ? '(p)' : '') });
    const isFinal = act.round === total - 1, isSemi = rn === 'Semi Final'; let fin = null;
    if (win && isSemi) { const b = D.REWARD.semi * mult; coins += b; lines.push('Bonus semifinal: +' + Math.round(b)); }
    if (isFinal) { if (win) { const b = D.REWARD.champ * mult; coins += b; lines.push('JUARA! Bonus: +' + Math.round(b)); fin = 'Juara'; } else { const b = D.REWARD.runner * mult; coins += b; lines.push('Runner-up. Bonus: +' + Math.round(b)); fin = 'Runner-up'; } }
    else if (!win) fin = rn;
    coins = Math.round(coins); D.addCoins(coins);
    if (fin) {
      const prev = sd.tournaments.best_results[T.id]; const rank = { 'Quarter Final': 1, 'Semi Final': 2, 'Runner-up': 3, 'Juara': 4 };
      if (!prev || (rank[fin] || 0) >= (rank[prev] || 0)) sd.tournaments.best_results[T.id] = fin;
      if (fin === 'Juara') { sd.progress.trophies++; if (!sd.tournaments.completed.includes(T.id)) sd.tournaments.completed.push(T.id); if (!sd.progress.achievements.perfect) { sd.progress.achievements.perfect = true; out.ach.push('perfect'); D.addCoins(D.ACH.perfect.coins); } }
      D.refreshShop(true); sd.tournaments.active = null;
    } else { act.rounds.push(next); act.round++; }
    G.save.commit(); G.go('result', { out, p: { tournament: true, coins, tour: { lines } } });
  }
};

/* ---------- TRAINING ---------- */
S.DRILLS = [
  { id: 'shooting', n: 'Shooting Practice', d: 'Cetak ke sudut gawang dalam 40 detik.', ic: 'Stat/Shooting' },
  { id: 'passing', n: 'Passing Practice', d: 'Umpan tepat ke target dalam 40 detik.', ic: 'Stat/Passing' },
  { id: 'dribbling', n: 'Dribbling Course', d: 'Lewati kerucut secepat mungkin.', ic: 'Stat/Dribbling' },
  { id: 'gk', n: 'Goalkeeper Practice', d: 'Tahan 10 tembakan. Tombol 1 = terjun.', ic: 'Goalkeeper/Reflex', gk: true },
  { id: 'freekick', n: 'Free Kick', d: '5 tendangan bebas melewati tembok.', ic: 'Football/Whistle' },
  { id: 'penalty', n: 'Penalty Practice', d: '5 penalti melawan kiper.', ic: 'Football/Goal' }
];
S.training = {
  enter() { G.audio.music('BGM_Training'); this.sel = null; },
  onBack() { if (this.sel) this.sel = null; else G.go('menu'); },
  draw(g) {
    S.header('TRAINING'); if (UIx.back()) { this.onBack(); return; }
    const best = G.save.data.training.best;
    if (!this.sel) {
      S.DRILLS.forEach((d, i) => {
        const x = G.LW / 2 - 250 + (i % 2) * 254, y = 48 + Math.floor(i / 2) * 106;
        G.panel('cream', x, y, 246, 98); G.draw('Icons/' + d.ic + '.png', x + 10, y + 10, 24, 24); G.text(d.n, x + 42, y + 14, { c: Cc.maroon, sh: false });
        G.wrap(d.d, 220, 1).forEach((l, k) => G.text(l, x + 12, y + 40 + k * 12, { c: Cc.dark, sh: false, s: 1 }));
        G.text('Terbaik: ' + (best[d.id] || '-'), x + 12, y + 70, { c: Cc.rust, sh: false, s: 1 });
        if (UIx.button('Pilih', x + 160, y + 62, 76, 26, { kind: 'button_green_normal' })) this.sel = d;
      });
      G.text('Latihan tanpa batas energi. XP kecil agar turnamen tetap jadi sumber progres utama.', G.LW / 2, G.LH - 22, { a: 'c', s: 1 });
    } else {
      const d = this.sel; G.text('Pilih pemain untuk ' + d.n, G.LW / 2, 42, { a: 'c', c: Cc.gold });
      const list = D.owned().filter(p => d.gk ? p.kind === 'gk' : (d.id === 'penalty' || d.id === 'freekick' || d.id === 'shooting' || d.id === 'passing' || d.id === 'dribbling') ? p.kind !== 'gk' : true);
      const cw = 86, cols = Math.max(4, Math.floor((G.LW - 20) / cw)), ox = Math.round((G.LW - cols * cw) / 2);
      UIx.scrollBegin('tp', 0, 56, G.LW, G.LH - 56, Math.ceil(list.length / cols) * 122 + 8);
      list.forEach((p, i) => { const x = ox + (i % cols) * cw + 3, y = 60 + Math.floor(i / cols) * 122; S.card(p, x, y); if (UIx.tapIn(x, y, 80, 112)) { if (d.id === 'penalty') this.startPen(p); else G.go('drill', { kind: d.id, id: p.id }); } });
      UIx.scrollEnd();
    }
  },
  startPen(p) {
    const sel = D.get(p.id), gk = D.makeOpponent('x', 55, 0).players[0], kicks = []; for (let i = 0; i < 5; i++) kicks.push({ team: 0, shooter: sel, gk });
    G.push('penalty', { mode: 'training', kicks, user: 0 }, r => { const n = r.goals.filter(x => x).length; const rank = n >= 5 ? 'S' : n >= 4 ? 'A' : n >= 3 ? 'B' : 'C'; G.go('drillend', { kind: 'penalty', id: p.id, rank, label: n + '/5 gol' }); });
  }
};

/* ---------- DRILLS ---------- */
S.drill = {
  enter(p) {
    this.p = p; this.pd = D.get(p.id); this.ctl = new S.Controls(); this.k = p.kind; this.score = 0; this.t = 0; this.time = 40; this.done = false; this.msgT = 0; this.fx = [];
    const lay = W.layouts(); this.lay = this.pd.kind === 'gk' ? lay.gk : lay.out; this.img = G.$(D.sheetPath(this.pd, false)); this.pre = this.pd.kind === 'gk' ? 'GK_' : '';
    this.a = { x: 200, y: 192, vx: 0, vy: 0, fx: 1, fy: 0, st: 'move', stT: 0, at: 0, dive: 0 }; this.ball = { x: 210, y: 192, z: 0, vx: 0, vy: 0, vz: 0, own: true, rt: 0 };
    this.shots = 0; this.pen = 0; this.cones = []; this.targets = []; this.gate = 0; this.wait = 0; this.res = null; G.audio.music('BGM_Training');
    if (this.k === 'passing') { this.newTarget(); }
    if (this.k === 'dribbling') { this.time = 60; this.a.x = 90; this.ball.x = 100; for (let i = 0; i < 8; i++) this.cones.push({ x: 160 + i * 50, y: i % 2 ? 235 : 150, hit: false }); this.pen = 0; }
    if (this.k === 'gk') { this.a.x = 78; this.a.y = 192; this.ball.own = false; this.ball.x = -99; this.shots = 0; this.wait = 1.5; this.time = 999; this.saves = 0; }
    if (this.k === 'freekick') { this.time = 999; this.setFK(); this.shots = 0; this.goals = 0; }
    if (this.k === 'shooting') { this.a.x = 330; this.ball.x = 340; }
    this.shotAt = -9;
  },
  setFK() { this.a.x = 430; this.a.y = 192 + G.rnd(-60, 60); this.ball.x = 438; this.ball.y = this.a.y; this.ball.own = true; this.ball.vx = this.ball.vy = this.ball.z = 0; this.gkY = 192; this.gkT = 0; this.wait = 0; this.wallY = this.a.y > 192 ? this.a.y - 40 : this.a.y + 40; this.wallY = G.clamp((this.a.y + 192) / 2, 150, 235); },
  newTarget() { this.target = { x: G.rnd(150, 540), y: G.rnd(90, 295) }; },
  pointerDown(o) { this.ctl.pointerDown(o); }, pointerMove(o) { this.ctl.pointerMove(o); }, pointerUp(o) { this.ctl.pointerUp(o); },
  onBack() { G.go('training'); },
  rank(v, th) { return v >= th[0] ? 'S' : v >= th[1] ? 'A' : v >= th[2] ? 'B' : 'C'; },
  end(rank, label) { if (this.done) return; this.done = true; G.go('drillend', { kind: this.k, id: this.p.id, rank, label }); },
  kick(vx, vy, vz) { const b = this.ball, a = this.a; b.own = false; b.vx = vx; b.vy = vy; b.vz = vz || 0; a.st = 'kick'; a.stT = 0.3; a.at = 0; b.rt = 0; this.shotAt = this.t; this.shots++; G.audio.sfx('SFX_Kick'); this.scored = false; },
  update(dt) {
    if (this.ctl.pauseReq) { this.ctl.pauseReq = false; G.go('training'); return; }
    this.t += dt; const a = this.a, b = this.ball, pd = this.pd; const has = b.own;
    const inp = this.ctl.read(has || this.k === 'gk', dt);
    if (this.msgT > 0) this.msgT -= dt;
    // gerak
    const gk = this.k === 'gk'; const sp = (44 + (pd.stats.Pace || pd.stats.Positioning || 55) * 0.62) * (inp.sprint ? 1.3 : 1) * (has ? 0.93 : 1) * (gk ? 1.4 : 1);
    let tx = inp.mx * sp, ty = inp.my * sp; if (this.k === 'freekick') { tx = 0; ty = 0; }
    if (a.st === 'kick') { a.stT -= dt; if (a.stT <= 0) a.st = 'move'; tx *= 0.3; ty *= 0.3; }
    if (a.st === 'dive') { a.stT -= dt; tx = 0; ty = a.dive * 230 * Math.max(0, a.stT / 0.45); if (a.stT <= 0) { a.st = 'get'; a.stT = 0.4; a.at = 0; } }
    else if (a.st === 'get') { a.stT -= dt; tx = ty = 0; if (a.stT <= 0) a.st = 'move'; }
    const kk = Math.min(1, dt * 10); a.vx += (tx - a.vx) * kk; a.vy += (ty - a.vy) * kk; a.x += a.vx * dt; a.y += a.vy * dt; a.at += dt;
    a.x = G.clamp(a.x, 40, gk ? 140 : 600); a.y = G.clamp(a.y, 60, 328);
    if (Math.hypot(a.vx, a.vy) > 14) { const l = Math.hypot(a.vx, a.vy); a.fx = a.vx / l; a.fy = a.vy / l; }
    // bola
    if (b.own) { const k2 = Math.min(1, dt * 16); b.x += (a.x + a.fx * 9 - b.x) * k2; b.y += (a.y + a.fy * 9 + 1 - b.y) * k2; b.z = 0; }
    else {
      b.x += b.vx * dt; b.y += b.vy * dt; b.rt += dt;
      if (b.z > 0 || b.vz > 0) { b.vz -= 450 * dt; b.z += b.vz * dt; if (b.z <= 0) { b.z = 0; b.vz = Math.abs(b.vz) > 45 ? -b.vz * 0.5 : 0; } } else { const f = Math.pow(0.5, dt); b.vx *= f; b.vy *= f; }
    }
    this['u_' + this.k](dt, inp);
  },
  face(inp) { return Math.hypot(inp.mx, inp.my) > 0.3 ? [inp.mx, inp.my] : [this.a.fx, this.a.fy]; },
  aimShot(tx, ty, stat, power, spd) { const a = this.a; let ang = Math.atan2(ty - a.y, tx - a.x); ang += G.rnd(-1, 1) * ((100 - stat) * 0.0016 + 0.02) * 1.8 * (0.7 + 0.5 * power); return [Math.cos(ang) * spd, Math.sin(ang) * spd]; },
  /* -- shooting -- */
  u_shooting(dt, inp) {
    const b = this.ball, a = this.a;
    if (b.own && inp.shootRel) { const ty = 192 + G.clamp(inp.my, -1, 1) * 36; const v = this.aimShot(575, ty, this.pd.stats.Shooting, inp.power, 230 + this.pd.stats.Shooting * 1.2 * inp.power); this.kick(v[0], v[1], inp.power > 0.85 ? 50 : 10); }
    if (!b.own) {
      if (b.x >= Fz.R && !this.scored && b.z < 26) { this.scored = true; if (Math.abs(b.y - 192) < 36) { const d = Math.abs(b.y - 192); const pts = d > 22 ? 3 : d > 8 ? 2 : 1; this.score += pts; this.msgT = 0.8; this.msg = '+' + pts; G.audio.sfx('SFX_Goal', 0.5); } }
      if (b.rt > 1.2 || b.x > 620 || b.x < 20 || b.y < 40 || b.y > 350) { b.own = true; a.x = G.clamp(a.x, 60, 480); }
    }
    this.time -= dt; if (this.time <= 0) this.end(this.rank(this.score, [28, 20, 12]), this.score + ' poin');
  },
  /* -- passing -- */
  u_passing(dt, inp) {
    const b = this.ball, a = this.a, tg = this.target;
    if (b.own && (inp.pass || inp.shootRel)) { const [fx, fy] = this.face(inp); const d = Math.hypot(tg.x - a.x, tg.y - a.y); let ang = Math.atan2(fy, fx); const aimT = Math.hypot(inp.mx, inp.my) < 0.3 ? 0 : 1; ang += G.rnd(-1, 1) * ((100 - this.pd.stats.Passing) * 0.0013 + 0.012) * 1.7; const sp = 210 + this.pd.stats.Passing * 0.4; this.kick(Math.cos(ang) * sp, Math.sin(ang) * sp, 0); }
    if (!b.own) {
      if (Math.hypot(b.x - tg.x, b.y - tg.y) < 15 && !this.scored) { this.scored = true; this.score++; this.msgT = 0.7; this.msg = 'Tepat!'; G.audio.sfx('SFX_Coin', 0.6); this.newTarget(); }
      if (b.rt > 1.3 || b.x > 620 || b.x < 20 || b.y < 50 || b.y > 340) { b.own = true; }
    }
    this.time -= dt; if (this.time <= 0) this.end(this.rank(this.score, [12, 8, 5]), this.score + ' target');
  },
  /* -- dribbling -- */
  u_dribbling(dt, inp) {
    const a = this.a; this.time -= dt; this.el = (this.el || 0) + dt;
    this.cones.forEach(c => { if (!c.hit && Math.hypot(a.x - c.x, a.y - (c.y + 4)) < 13) { c.hit = true; this.pen += 2; this.msgT = 0.8; this.msg = '+2 detik'; G.audio.sfx('SFX_Tackle', 0.5); } });
    if (a.x > 560) { const tm = this.el + this.pen; this.end(tm <= 20 ? 'S' : tm <= 27 ? 'A' : tm <= 36 ? 'B' : 'C', tm.toFixed(1) + ' dtk'); }
    if (this.time <= 0) this.end('C', 'Waktu habis');
    a.x = G.clamp(a.x, 40, 620);
  },
  /* -- goalkeeper -- */
  u_gk(dt, inp) {
    const a = this.a, b = this.ball; a.x = G.clamp(a.x, 70, 110);
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0 && this.shots < 10) { const sx = G.rnd(260, 380), sy = G.rnd(110, 275); b.x = sx; b.y = sy; b.z = 0; const ty = 192 + G.rnd(-34, 34); const ang = Math.atan2(ty - sy, 65 - sx); const sp = G.rnd(200, 290); b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.vz = G.rnd(0, 40); b.own = false; b.rt = 0; this.shots++; this.scored = false; G.audio.sfx('SFX_Shoot', 0.5); } }
    if ((inp.tackle || inp.shootRel) && a.st === 'move') { a.st = 'dive'; a.stT = 0.45; a.at = 0; a.dive = Math.abs(inp.my) > 0.2 ? Math.sign(inp.my) : 0; if (a.dive === 0) { a.st = 'move'; } }
    if (!b.own && b.x > 0 && !this.scored) {
      const reach = a.st === 'dive' ? 24 : 14;
      if (Math.hypot(b.x - a.x, b.y - a.y) < reach && b.z < 32) { this.scored = true; if (Math.random() < 0.3 + this.pd.stats.Handling * 0.006 + 0.1) { this.saves++; this.msg = 'Selamat!'; G.audio.sfx('SFX_Crowd_Clap', 0.6); } else { this.saves += 0.5; this.msg = 'Ditepis'; } this.msgT = 0.9; b.vx = 90; b.vy = G.rnd(-70, 70); b.rt = 0; this.wait = 1; }
      else if (b.x < Fz.L) { this.scored = true; this.msg = 'Gol...'; this.msgT = 0.9; this.wait = 1.1; b.vx *= 0.2; }
      else if (b.rt > 2) { this.scored = true; this.wait = 0.7; }
    }
    if (this.shots >= 10 && this.wait <= 0 && this.scored && !this.done) { this.wait = 99; this.end(this.rank(this.saves, [9, 7, 5]), Math.floor(this.saves) + '/10 penyelamatan'); }
  },
  /* -- free kick -- */
  u_freekick(dt, inp) {
    const b = this.ball, a = this.a; this.gkT += dt;
    if (b.own && inp.shootRel && this.wait <= 0) {
      const ty = 192 + G.clamp(inp.my, -1, 1) * 40 + (a.y - 192) * 0.0; const v = this.aimShot(575, ty + (inp.my === 0 ? 0 : 0), this.pd.stats.Shooting, inp.power, 190 + this.pd.stats.Shooting * 0.9 * inp.power); this.kick(v[0], v[1], 130 + inp.power * 75);
      this.gkTarget = G.pick([160, 192, 224]) + G.rnd(-8, 8); this.scored = false; this.passedWall = false;
    }
    if (b.own) { a.y = a.y; }
    if (!b.own) {
      this.gkY = G.lerp(this.gkY, this.gkTarget, Math.min(1, dt * 3));
      if (!this.passedWall && b.x >= 395 && b.rt < 2) { this.passedWall = true; if (b.z < 22 && Math.abs(b.y - this.wallY) < 28) { b.vx *= -0.3; b.vz = 0; this.scored = true; this.msg = 'Terblok tembok'; this.msgT = 1; this.wait = 1.2; } }
      if (!this.scored && b.x >= Fz.R) { this.scored = true; if (b.z < 26 && Math.abs(b.y - 192) < 36) { if (Math.abs(b.y - this.gkY) < 18 + this.pd.stats.Passing * 0.0) { this.msg = 'Diselamatkan'; } else { this.goals++; this.msg = 'GOL!'; G.audio.sfx('SFX_Goal', 0.6); } } else this.msg = 'Melebar'; this.msgT = 1; this.wait = 1.2; }
      if (b.rt > 2.2 || b.x > 620) { if (!this.scored) { this.msg = 'Gagal'; this.msgT = 1; } this.scored = true; this.wait = Math.max(this.wait, 0.3); }
      if (this.scored) { this.wait -= dt; if (this.wait <= 0) { if (this.shots >= 5) this.end(this.rank(this.goals, [4, 3, 2]), this.goals + '/5 gol'); else this.setFK(); } }
    }
  },
  draw(g) {
    W.drawStadium(g); g.save(); g.translate(G.wx, 0); const a = this.a, b = this.ball;
    if (this.k === 'passing') { G.draw('Objects/Training_Equipment/Passing_Target.png', this.target.x - 12, this.target.y - 12); }
    if (this.k === 'shooting') [170, 192, 214].forEach(y => G.draw('Objects/Training_Equipment/Shooting_Target.png', 566, y - 16, 32, 32));
    if (this.k === 'dribbling') this.cones.forEach(c => G.draw('Objects/Training_Equipment/Training_Cone.png', c.x - 6, c.y - 10));
    if (this.k === 'freekick') { G.draw('Objects/Training_Equipment/Free_Kick_Wall.png', 391, this.wallY - 18); }
    // kiper lawan (freekick) / kiper sasaran
    if (this.k === 'freekick' || this.k === 'gk') {
      const gimg = this.k === 'gk' ? this.img : G.$('Characters/Generated/Player_GK_opp.png'), lay = W.layouts().gk;
      if (this.k === 'freekick') { const r = lay['GK_idle_left']; W.drawSprite(g, gimg, r.row, Math.floor(G.time * 4) % 2, 566, this.gkY || 192, {}); }
    }
    g.drawImage(G.$('Objects/Football/Football_Shadow.png'), Math.round(b.x - 5), Math.round(b.y - 1));
    // aktor
    const L = this.lay, pre = this.pre, dir = Math.abs(a.fx) > Math.abs(a.fy) ? (a.fx > 0 ? 'right' : 'left') : (a.fy > 0 ? 'down' : 'up'), sp = Math.hypot(a.vx, a.vy);
    if (this.k === 'gk') {
      if (a.st === 'dive') { const r = L[a.dive < 0 ? 'GK_dive_left' : 'GK_dive_right']; W.drawSprite(g, this.img, r.row, Math.min(2, Math.floor(a.at * r.fps)), a.x, a.y, { rot: Math.PI / 2 }); }
      else { const r = L['GK_' + (sp > 12 ? 'move_' : 'idle_') + 'right']; W.drawSprite(g, this.img, r.row, Math.floor(a.at * r.fps) % r.frames, a.x, a.y, {}); }
    } else {
      let nm = a.st === 'kick' ? 'shoot_' + dir : sp < 12 ? 'idle_' + dir : (b.own ? 'dribble_' : 'run_') + dir; const r = L[nm]; const fr = r.loop ? Math.floor(a.at * r.fps) % r.frames : Math.min(r.frames - 1, Math.floor(a.at * r.fps));
      g.drawImage(G.$('Objects/Football/Player_Shadow.png'), Math.round(a.x - 9), Math.round(a.y - 4)); W.drawSprite(g, this.img, r.row, fr, a.x, a.y, {});
    }
    g.drawImage(G.$('Objects/Football/Football_8x8.png'), Math.round(b.x - 4), Math.round(b.y - b.z - 7));
    g.restore();
    G.panel('dark', 8, 8, 170, 40);
    const names = { shooting: 'Shooting Practice', passing: 'Passing Practice', dribbling: 'Dribbling Course', gk: 'Goalkeeper Practice', freekick: 'Free Kick' };
    G.text(names[this.k], 16, 12, { s: 1, c: Cc.gold });
    let st = ''; if (this.k === 'shooting' || this.k === 'passing') st = 'Skor ' + this.score + '   Waktu ' + Math.max(0, Math.ceil(this.time)); else if (this.k === 'dribbling') st = 'Waktu ' + ((this.el || 0) + this.pen).toFixed(1); else if (this.k === 'gk') st = 'Tembakan ' + this.shots + '/10  Save ' + Math.floor(this.saves); else st = 'Tendangan ' + this.shots + '/5  Gol ' + this.goals;
    G.text(st, 16, 28, { s: 1 }); if (this.msgT > 0) G.text(this.msg, G.LW / 2, 90, { a: 'c', c: Cc.gold, s: 2 });
    if (UIx.sprite('UI/Gameplay_HUD/btn_pause.png', G.LW - 30, 6)) G.go('training');
    this.ctl.draw(this.ball.own || this.k === 'gk');
    if (this.k === 'gk') G.text('Tombol 1 + arah atas/bawah = terjun', G.LW / 2, G.LH - 16, { a: 'c', s: 1 });
  }
};
S.drillend = {
  enter(p) { this.p = p; this.t = 0; const xp = { S: 40, A: 30, B: 20, C: 10 }[p.rank]; this.xp = xp; this.pts = D.addXP(p.id, xp); const best = G.save.data.training.best, ord = 'CBAS'; if (!best[p.kind] || ord.indexOf(p.rank) > ord.indexOf(best[p.kind].split(' ')[0])) best[p.kind] = p.rank + ' (' + p.label + ')'; G.save.commit(); G.audio.sfx('SFX_Level_Up', 0.6); G.audio.stop(); },
  onBack() { G.go('training'); },
  draw(g) {
    G.backdrop(); g.fillStyle = 'rgba(57,12,20,0.6)'; g.fillRect(0, 0, G.LW, G.LH);
    const x = (G.LW - 256) / 2, y = 60; G.nine('UI/Training/Training_Rank_Panel.png', x, y, 256, 230, 6);
    G.text('LATIHAN SELESAI', G.LW / 2, y + 14, { a: 'c', c: Cc.gold }); const ri = 'SABC'.indexOf(this.p.rank);
    g.drawImage(G.$('UI/Training/Rank_S_A_B_C.png'), ri * 50, 0, 50, 40, G.LW / 2 - 50, y + 40, 100, 80);
    G.text(this.p.label, G.LW / 2, y + 130, { a: 'c' }); const pd = D.get(this.p.id);
    G.text(pd.name + ' +' + this.xp + ' XP' + (this.pts ? '  (+' + this.pts + ' poin!)' : ''), G.LW / 2, y + 150, { a: 'c', s: 1, c: Cc.gold });
    if (UIx.button('Ulangi', x + 20, y + 180, 100, 28, { kind: 'button_green_normal' })) { if (this.p.kind === 'penalty') G.go('training'); else G.go('drill', { kind: this.p.kind, id: this.p.id }); }
    if (UIx.button('Selesai', x + 136, y + 180, 100, 28)) G.go('training');
  }
};

/* ---------- registrasi scene ---------- */
['boot', 'menu', 'friendly', 'settings', 'team', 'players', 'upgrade', 'shop', 'result', 'tournament', 'training', 'drill', 'drillend', 'match', 'penalty'].forEach(n => { G.scenes[n] = S[n]; });
S.penalty.overlay = false;
