'use strict';
/* Cozy Pixel Soccer - match scene, controls, penalty, result */
const S = window.S = {};
const F2 = W.F;

/* ---------- Kontrol sentuh + keyboard ---------- */
class Controls {
  constructor() { this.joy = null; this.held = {}; this.edge = {}; this.chargeT = 0; this.charging = false; this.rel = false; this.pauseReq = false; }
  lay() {
    const W_ = G.LW, H = G.LH;
    return { A: [W_ - 50, H - 62], B: [W_ - 124, H - 40], C: [W_ - 124, H - 110], D: [W_ - 50, H - 136] };
  }
  pointerDown(o) {
    if (o.sx > G.LW - 34 && o.sy < 34) { this.pauseReq = true; return; }
    const L = this.lay();
    for (const k in L) { if (Math.hypot(o.sx - L[k][0], o.sy - L[k][1]) < 40) { this.held[k] = o.id; this.edge[k] = true; return; } }
    if (o.sx < G.LW * 0.5 && !this.joy) this.joy = { id: o.id, cx: o.sx, cy: o.sy, x: o.sx, y: o.sy };
  }
  pointerMove(o) { if (this.joy && this.joy.id === o.id) { this.joy.x = o.x; this.joy.y = o.y; const dx = o.x - this.joy.cx, dy = o.y - this.joy.cy, d = Math.hypot(dx, dy); if (d > 60) { this.joy.cx += dx / d * (d - 60); this.joy.cy += dy / d * (d - 60); } } }
  pointerUp(o) {
    if (this.joy && this.joy.id === o.id) this.joy = null;
    for (const k in this.held) if (this.held[k] === o.id) { delete this.held[k]; if (k === 'A') this.rel = true; }
  }
  reset() { this.joy = null; this.held = {}; this.edge = {}; this.charging = false; this.chargeT = 0; this.rel = false; }
  read(hasBall, dt) {
    const K = G.keys, KH = G.keyHit; let mx = 0, my = 0;
    if (this.joy) { mx = (this.joy.x - this.joy.cx) / 34; my = (this.joy.y - this.joy.cy) / 34; const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; } }
    if (K.ArrowLeft || K.KeyA) mx -= 1; if (K.ArrowRight || K.KeyD) mx += 1; if (K.ArrowUp || K.KeyW) my -= 1; if (K.ArrowDown || K.KeyS) my += 1;
    const m2 = Math.hypot(mx, my); if (m2 > 1) { mx /= m2; my /= m2; }
    const aPress = this.edge.A || KH.KeyK, bPress = this.edge.B || KH.KeyJ, cPress = this.edge.C || KH.KeyL;
    const aHeld = !!this.held.A || !!K.KeyK; const inp = { mx, my, sprint: !!this.held.D || !!K.ShiftLeft || !!K.ShiftRight, pass: false, through: false, sw: false, tackle: false, shootRel: false, power: 0.6 };
    if (hasBall) {
      if (aPress) { this.charging = true; this.chargeT = 0; }
      if (this.charging) { this.chargeT += dt; if (!aHeld) { this.charging = false; inp.shootRel = true; inp.power = G.clamp(0.5 + this.chargeT / 0.6 * 0.5, 0.5, 1); } else if (this.chargeT > 0.8) { this.charging = false; inp.shootRel = true; inp.power = 1; this.held.A = null; delete this.held.A; } }
      if (bPress) inp.pass = true; if (cPress) inp.through = true;
    } else { this.charging = false; if (aPress) inp.tackle = true; if (bPress) inp.sw = true; }
    if (KH.Escape || KH.KeyP) this.pauseReq = true;
    this.edge = {}; this.rel = false; return inp;
  }
  draw(hasBall) {
    const L = this.lay(), g = G.g;
    // joystick
    const jb = G.$('UI/Gameplay_HUD/joystick_base.png'), jk = G.$('UI/Gameplay_HUD/joystick_knob.png');
    const cx = this.joy ? this.joy.cx : 84, cy = this.joy ? this.joy.cy : G.LH - 76;
    g.globalAlpha = this.joy ? 0.95 : 0.5; g.drawImage(jb, Math.round(cx - 32), Math.round(cy - 32));
    let kx = cx, ky = cy; if (this.joy) { const dx = this.joy.x - cx, dy = this.joy.y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(d, 26); kx = cx + dx / d * k; ky = cy + dy / d * k; }
    g.drawImage(jk, Math.round(kx - 14), Math.round(ky - 14)); g.globalAlpha = 1;
    const btn = (k, n) => { const p = this.held[k] || (k === 'A' && this.charging) || (k === 'D' && G.keys.ShiftLeft); G.draw('UI/Gameplay_HUD/btn_' + n + (p ? '_pressed' : '') + '.png', L[k][0] - 32, L[k][1] - 32, 64, 64); };
    g.globalAlpha = 0.92;
    btn('A', hasBall ? 'shoot' : 'tackle'); btn('B', hasBall ? 'pass' : 'switch'); if (hasBall) btn('C', 'through'); btn('D', 'sprint');
    g.globalAlpha = 1;
    if (this.charging) { const f = G.clamp(this.chargeT / 0.6, 0, 1); g.fillStyle = G.C.maroon; g.fillRect(L.A[0] - 24, L.A[1] - 42, 48, 6); g.fillStyle = f > 0.9 ? G.C.rust : G.C.gold; g.fillRect(L.A[0] - 23, L.A[1] - 41, 46 * f, 4); }
  }
}
S.Controls = Controls;

/* ---------- Hasil & progresi ---------- */
S.finalize = function (m, ctx) {
  const sd = G.save.data, ut = 0, me = m.score[0], op = m.score[1];
  const res = me > op ? 'win' : me < op ? 'lose' : 'draw';
  const win = ctx.shootWin !== undefined ? ctx.shootWin : res === 'win';
  const lost = ctx.shootWin !== undefined ? !ctx.shootWin : res === 'lose';
  const mine = m.pl[0]; let pom = null, best = -1;
  mine.forEach(p => { const s = p.stat; p.stat.rating = s.goals * 3 + s.assists * 2 + s.saves * 1 + s.tackles * 0.6 + s.sot * 0.4 + s.passOk * 0.05 + (res === 'win' && p.gk && op === 0 ? 1.5 : 0); if (p.stat.rating > best) { best = p.stat.rating; pom = p; } });
  const out = { res, win, lost, score: [me, op], pen: ctx.pen || null, stats: m.stat, poss: m.poss, goals: m.goals, pom: pom ? pom.d.name : '-', pomId: pom ? pom.d.srcId || pom.d.id : null, xp: [], coins: 0, ach: [], teams: [m.teams[0].name, m.teams[1].name], emblems: [0, m.teams[1].emblem] };
  const base = win ? 25 : lost ? 10 : 15;
  mine.forEach(p => { const id = p.d.srcId || p.d.id; const bonus = p === pom ? 30 : 0; const pts = D.addXP(id, base + bonus); out.xp.push({ id, name: p.d.name, xp: base + bonus, pts }); });
  m.bench.forEach(p => { if (G.save.data.players.upgrades[p.id]) D.addXP(p.id, 8); });
  const pr = sd.progress; pr.matches_played++; if (win) pr.matches_won++; pr.goals += me;
  const give = id => { if (!pr.achievements[id]) { pr.achievements[id] = true; out.ach.push(id); D.addCoins(D.ACH[id].coins); } };
  if (mine.some(p => p.stat.goals >= 3)) give('hat_trick');
  if (win && op === 0) give('clean_sheet');
  if (win && m.maxDeficit[0] >= 1) give('comeback');
  if (ctx.tournament && win && !pr.achievements.first_win) give('first_win');
  G.save.commit(); return out;
};

/* ---------- Scene pertandingan ---------- */
S.match = {
  overlay: false,
  enter(p) {
    this.p = p; this.ctl = new Controls();
    const sd = G.save.data;
    this.m = new W.Match({ home: p.home, away: p.away, half: sd.settings.half, knockout: !!p.knockout, userTeam: 0, diff: p.diff || 1 });
    this.paused = false; this.subSel = null; this.sub = false; this.quitAsk = false; this.ended = false; this.endT = 0; this.shoot = null; this.stadium = p.stadium || 'Environment/Stadium/Stadium_Day.png';
    G.audio.music('BGM_Match'); this.m.msg('Kick off!', G.C.cream, 1.6);
  },
  exit() { G.audio.stop(); },
  pause() { }, resume() { this.ctl.reset(); G.audio.music('BGM_Match'); },
  onBack() { this.paused = !this.paused; this.sub = false; },
  onHide() { this.paused = true; },
  pointerDown(o) { if (!this.paused) this.ctl.pointerDown(o); }, pointerMove(o) { this.ctl.pointerMove(o); }, pointerUp(o) { this.ctl.pointerUp(o); },
  update(dt) {
    const m = this.m;
    if (this.ctl.pauseReq) { this.ctl.pauseReq = false; if (m.phase !== 'full') this.paused = true; }
    if (this.paused) return;
    const has = m.ball.owner === m.ctrl;
    const inp = this.ctl.read(has, dt);
    if (m.phase === 'halftime' && m.phT <= 0) m.startSecondHalf();
    if (m.phase === 'penalty' && m.phT > 0) m.phT -= dt;
    if (m.phase === 'penalty' && m.phT <= 0 && m.penReq && !this.penBusy) {
      this.penBusy = true; const r = m.penReq;
      G.push('penalty', { mode: 'match', kicks: [{ team: r.team, shooter: r.shooter.d, gk: m.pl[1 - r.team].find(q => q.gk).d, shooterPl: r.shooter }], user: 0, stadium: this.stadium }, res => { this.penBusy = false; m.penaltyResult(res.goals[0]); });
      return;
    }
    m.update(dt, inp);
    if (m.phase === 'full' && !this.ended) {
      this.ended = true; this.endT = 2.2; m.msg('Peluit akhir!', G.C.gold, 2.2);
    }
    if (this.ended) { this.endT -= dt; if (this.endT <= 0 && !this.pushing) { this.pushing = true; this.finish(); } }
  },
  finish() {
    const m = this.m;
    if (m.knockout && m.score[0] === m.score[1]) {
      const mk = t => m.pl[t].filter(p => !p.gk).sort((a, b) => b.s('Shooting') - a.s('Shooting'));
      G.push('penalty', { mode: 'shootout', user: 0, stadium: this.stadium, teams: [mk(0), mk(1)], gks: [m.pl[0].find(p => p.gk).d, m.pl[1].find(p => p.gk).d] }, r => this.done({ shootWin: r.homeWins, pen: r.score }));
    } else this.done({});
  },
  done(c) {
    const m = this.m; c.tournament = !!this.p.tournament;
    const out = S.finalize(m, c); this.p.onDone ? this.p.onDone(out) : G.go('result', { out, p: this.p });
  },
  draw(g) {
    const m = this.m; m.draw(g, 0.016, this.stadium);
    // HUD atas
    const sx = Math.round((G.LW - 112) / 2);
    G.draw('UI/Gameplay_HUD/scoreboard_blank.png', sx, 4);
    G.text(D.abbr(m.teams[0].name), sx + 8, 9, { s: 1 }); G.text(D.abbr(m.teams[1].name), sx + 104, 9, { s: 1, a: 'r' });
    G.text(m.score[0] + ' - ' + m.score[1], sx + 56, 9, { a: 'c', c: G.C.gold });
    G.draw('UI/Gameplay_HUD/match_timer_blank.png', Math.round((G.LW - 48) / 2), 32);
    G.text(m.phase === 'full' ? 'FT' : (m.minute()) + "'", G.LW / 2, 34, { a: 'c' });
    if (m.banner) { G.draw('UI/Gameplay_HUD/match_event_blank.png', Math.round((G.LW - 96) / 2) , 52); G.text(m.banner.text, G.LW / 2, 54, { a: 'c', c: m.banner.col, s: 1 }); }
    G.draw('UI/Gameplay_HUD/btn_pause.png', G.LW - 30, 6);
    // stamina
    if (m.ctrl) { G.draw(G.$(D.iconPath({ base: m.ctrl.d.srcId ? D.PLAYERS[m.ctrl.d.srcId].base : m.ctrl.d.base })), 8, 6, 28, 28); G.text(m.ctrl.d.name, 40, 6, {}); G.draw('UI/Gameplay_HUD/stamina_bar_bg.png', 40, 20); const f = m.ctrl.stamina / 100; if (f > 0) G.g.drawImage(G.$('UI/Gameplay_HUD/stamina_bar_fill.png'), 0, 0, Math.max(1, Math.round(32 * f)), 8, 40, 20, Math.max(1, Math.round(32 * f)), 8); }
    if (!this.paused && m.phase !== 'full') this.ctl.draw(m.ball.owner === m.ctrl);
    if (this.paused) this.drawPause(g);
  },
  drawPause(g) {
    const m = this.m; g.fillStyle = 'rgba(28,10,14,0.7)'; g.fillRect(0, 0, G.LW, G.LH);
    if (this.quitAsk) { const r = G.UI.dialog('Keluar?', this.p.tournament ? 'Keluar dari pertandingan turnamen dihitung kalah 0-3.' : 'Keluar dari pertandingan? Hasil tidak disimpan.', 'Keluar', 'Batal'); if (r === true) { this.quitAsk = false; if (this.p.tournament) { m.score = [0, 3]; this.done({}); } else G.go('menu'); } else if (r === false) this.quitAsk = false; return; }
    const w = this.sub ? 440 : 240, h = this.sub ? 300 : 200, x = Math.round((G.LW - w) / 2), y = Math.round((G.LH - h) / 2);
    G.frame(x, y, w, h);
    if (!this.sub) {
      G.text('JEDA', x + w / 2, y + 12, { a: 'c', c: G.C.gold });
      if (G.UI.button('Lanjut', x + 30, y + 40, w - 60, 28, { kind: 'button_green_normal' })) this.paused = false;
      if (G.UI.button('Ganti Pemain (' + (3 - m.subsUsed) + ')', x + 30, y + 78, w - 60, 28, { disabled: m.subsUsed >= 3 || !m.bench.length })) { this.sub = true; this.subSel = null; }
      if (G.UI.button('Keluar', x + 30, y + 116, w - 60, 28)) this.quitAsk = true;
      G.text('Sisa pergantian: ' + (3 - m.subsUsed), x + w / 2, y + 160, { a: 'c', s: 1 });
    } else {
      G.text('GANTI PEMAIN', x + w / 2, y + 10, { a: 'c', c: G.C.gold });
      G.text('Pilih pemain yang keluar, lalu pemain cadangan', x + w / 2, y + 26, { a: 'c', s: 1 });
      m.pl[0].forEach((p, i) => { const bx = x + 12, by = y + 44 + i * 20; const sel = this.subSel === i; if (G.UI.button(p.slotPos + ' ' + p.d.name, bx, by, 190, 18, { kind: sel ? 'button_green_normal' : 'button_normal' })) this.subSel = i; });
      m.bench.slice(0, 9).forEach((p, i) => { const bx = x + 224, by = y + 44 + i * 22; if (G.UI.button(p.pos + ' ' + p.name, bx, by, 200, 20, { disabled: this.subSel === null })) { m.subst(this.subSel, i); this.sub = false; this.paused = false; } });
      if (G.UI.closeBtn(x + w - 30, y + 4)) this.sub = false;
    }
  }
};
W.Match.prototype.subst = function (slot, bi) {
  const p = this.pl[0][slot], nd = this.bench[bi]; if (!nd) return;
  const old = p.d; const cd = Object.assign({}, nd, { srcId: nd.id, slotPos: p.slotPos, compat: D.compat(p.slotPos, nd.pos), captain: false });
  this.bench.splice(bi, 1, Object.assign({}, old, { id: old.srcId || old.id })); p.setData(cd); p.stamina = 100; p.animKey = null;
  this.subsUsed++; this.msg('Pergantian: ' + nd.name, G.C.cream, 1.5);
};

/* ---------- Penalti ---------- */
S.penalty = {
  enter(p) {
    this.p = p; this.ctl = new Controls(); this.kicks = p.kicks || []; this.log = []; this.goals = []; this.i = 0; this.score = [0, 0]; this.phase = 'aim'; this.t = 0; this.ret = null; this.stadium = p.stadium;
    this.stadium = p.stadium || 'Environment/Stadium/Stadium_Day.png'; this.right = true;
    if (p.mode === 'shootout') { this.round = 0; this.order = []; this.nextShootKick(); }
    else this.begin();
    G.audio.music(p.mode === 'training' ? 'BGM_Training' : 'BGM_Match');
  },
  nextShootKick() {
    const p = this.p, n = this.log.length, team = n % 2, r = Math.floor(n / 2);
    const sh = p.teams[team][r % p.teams[team].length];
    this.kicks = [{ team, shooter: sh.d, gk: p.gks[1 - team], shooterPl: sh }]; this.i = 0; this.begin();
  },
  begin() {
    const k = this.kicks[this.i]; this.k = k; this.phase = 'aim'; this.t = 0; this.ret = { x: 575, y: 192 }; this.power = 0; this.charging = false; this.ball = { x: 527, y: 192, z: 0 }; this.gkY = 192; this.gkDive = 0; this.res = null;
    this.userKick = k.team === this.p.user; this.autoT = 1.2;
    this.sh = G.$(D.sheetPath(k.shooter.srcId ? D.PLAYERS[k.shooter.srcId] : k.shooter, !!k.shooter.away && k.team !== this.p.user && false));
    this.shl = k.shooter.kind === 'gk' ? W.layouts().gk : W.layouts().out;
    const gd = k.gk; this.gkImg = G.$(D.sheetPath(gd.srcId ? D.PLAYERS[gd.srcId] : gd, !!gd.away)); this.gkS = gd.stats;
    this.shSt = k.shooter.stats;
  },
  pointerDown(o) { this.ctl.pointerDown(o); }, pointerMove(o) { this.ctl.pointerMove(o); }, pointerUp(o) { this.ctl.pointerUp(o); },
  onBack() { },
  fire(tx, ty, power) {
    const sh = this.shSt.Shooting || 60; let err = (100 - sh) * 0.22 + (power > 0.92 ? 10 : 0) + (power < 0.55 ? 4 : 0);
    tx = 575; ty += G.rnd(-1, 1) * err;
    this.target = { x: tx, y: ty }; this.phase = 'shot'; this.t = 0; this.from = { x: 527, y: 192 }; this.dur = 0.55 - power * 0.18;
    const reflex = (this.gkS.Reflex || 60), div = (this.gkS.Diving || 60);
    const smart = Math.random() < 0.25 + reflex * 0.004; this.gkTarget = smart ? ty + G.rnd(-14, 14) : G.pick([158, 192, 226]) + G.rnd(-10, 10);
    this.gkReach = 11 + div * 0.1; this.gkDive = this.gkTarget < 192 - 9 ? -1 : this.gkTarget > 192 + 9 ? 1 : 0;
    const inMouth = Math.abs(ty - 192) < 35, saved = Math.abs(ty - this.gkTarget) < this.gkReach * (0.5 + Math.random() * 0.5);
    this.res = !inMouth ? 'miss' : saved ? 'save' : 'goal'; G.audio.sfx('SFX_Shoot');
    if (this.res === 'goal' && Math.abs(Math.abs(ty - 192) - 35) < 3) this.res = 'post';
  },
  update(dt) {
    this.t += dt;
    if (this.phase === 'aim') {
      if (this.userKick) {
        const inp = this.ctl.read(true, dt);
        this.ret.y = G.clamp(this.ret.y + inp.my * 90 * dt, 150, 234); this.ret.x = 575;
        if (this.ctl.charging) this.power = G.clamp(this.ctl.chargeT / 0.7, 0, 1);
        if (inp.shootRel) this.fire(575, this.ret.y, inp.power);
        else if (inp.pass) this.fire(575, this.ret.y, 0.6);
      } else {
        this.autoT -= dt; this.ret.y = 192 + Math.sin(G.time * 5) * 26;
        if (this.autoT <= 0) { const sh = this.shSt.Shooting || 60; this.fire(575, 192 + G.pick([-1, 1]) * G.rnd(8, 30), G.rnd(0.6, 0.9)); }
      }
    } else if (this.phase === 'shot') {
      const f = Math.min(1, this.t / this.dur); this.ball.x = G.lerp(this.from.x, this.target.x, f); this.ball.y = G.lerp(this.from.y, this.target.y, f); this.ball.z = Math.sin(f * Math.PI) * 6;
      this.gkY = G.lerp(192, this.gkTarget, Math.min(1, f * 1.6));
      if (f >= 1) {
        this.phase = 'result'; this.t = 0; const goal = this.res === 'goal';
        if (this.res === 'goal') { G.audio.sfx('SFX_Goal'); G.audio.sfx('SFX_Crowd_Cheer', 0.7); } else { G.audio.sfx('SFX_Ball_Bounce'); if (this.res === 'save') G.audio.sfx('SFX_Crowd_Clap', 0.6); }
        this.log.push(goal); this.goals.push(goal); this.score[this.k.team] += goal ? 1 : 0;
      }
    } else if (this.phase === 'result') {
      if (this.t > 1.5) this.next();
    }
  },
  next() {
    const p = this.p;
    if (p.mode === 'shootout') {
      const n = this.log.length, a = this.score[p.user], b = this.score[1 - p.user]; const sa = Math.ceil(n / 2), sb = Math.floor(n / 2);
      // hitung sisa tendangan
      const leftA = Math.max(0, 5 - sa), leftB = Math.max(0, 5 - sb);
      let over = false;
      if (n <= 10) { if (a > b + leftB || b > a + leftA) over = true; if (n === 10 && a !== b) over = true; }
      else if (n % 2 === 0 && a !== b) over = true;
      if (over) { G.pop({ homeWins: a > b, score: [a, b] }); return; }
      this.nextShootKick(); return;
    }
    this.i++;
    if (this.i >= this.kicks.length) { G.pop({ goals: this.goals, score: this.score }); return; }
    this.begin();
  },
  draw(g) {
    // kamera zoom ke gawang kanan
    g.fillStyle = '#1c0a0e'; g.fillRect(0, 0, G.LW, G.LH);
    g.save(); const z = 2.2; g.translate(G.LW / 2 - 520 * z, G.LH / 2 - 190 * z + 16); g.scale(z, z); g.imageSmoothingEnabled = false;
    const st = G.$(this.stadium); g.drawImage(st, 0, 0);
    // jaring animasi
    if (this.phase === 'result' && this.res === 'goal') g.drawImage(G.$('Environment/Goals/Goal_Right_NetAnim_4f.png'), Math.min(3, Math.floor(this.t * 8)) * 30, 0, 30, 86, F2.R - 3, 149, 30, 86);
    // kiper
    const lay = W.layouts();
    const gk = this.k.gk; const dive = this.phase !== 'aim' && this.gkDive !== 0 && (this.t > 0.12 || this.phase === 'result');
    if (dive) { const r = lay.gk[this.gkDive < 0 ? 'GK_dive_left' : 'GK_dive_right']; W.drawSprite(g, this.gkImg, r.row, Math.min(r.frames - 1, Math.floor(this.t * r.fps)), 566, this.gkY, { rot: Math.PI / 2 }); }
    else { const r = lay.gk['GK_idle_left']; W.drawSprite(g, this.gkImg, r.row, Math.floor(G.time * r.fps) % r.frames, 566, this.gkY, {}); }
    // penendang
    const L = this.shl, kick = this.phase !== 'aim' && this.t < 0.3 || (this.phase === 'shot'); const r = kick ? L['shoot_right'] : L['idle_right'];
    W.drawSprite(g, this.sh, r.row, kick ? Math.min(r.frames - 1, Math.floor(this.t * r.fps)) : Math.floor(G.time * r.fps) % r.frames, 512, 196, {});
    g.drawImage(G.$('Objects/Football/Football_8x8.png'), Math.round(this.ball.x - 4), Math.round(this.ball.y - this.ball.z - 4));
    if (this.phase === 'aim' && this.userKick) { g.strokeStyle = G.C.gold; g.lineWidth = 1; g.beginPath(); g.arc(this.ret.x - 4, this.ret.y, 5, 0, 7); g.moveTo(this.ret.x - 12, this.ret.y); g.lineTo(this.ret.x + 4, this.ret.y); g.moveTo(this.ret.x - 4, this.ret.y - 8); g.lineTo(this.ret.x - 4, this.ret.y + 8); g.stroke(); }
    g.restore();
    // HUD
    G.panel('dark', G.LW / 2 - 100, 4, 200, 24);
    const sc = this.p.mode === 'shootout' ? this.score : null;
    G.text(this.p.mode === 'shootout' ? 'ADU PENALTI  ' + this.score[this.p.user] + ' - ' + this.score[1 - this.p.user] : 'PENALTI  ' + (this.i + 1) + '/' + this.kicks.length + '  Gol: ' + this.goals.filter(x => x).length, G.LW / 2, 11, { a: 'c', c: G.C.gold });
    const dots = this.log; dots.forEach((v, i) => { G.draw('Icons/Status/' + (v ? 'Completed' : 'Locked') + '.png', G.LW / 2 - dots.length * 9 + i * 18, 32, 16, 16); });
    if (this.phase === 'aim') {
      if (this.userKick) { this.ctl.draw(true); G.text('Geser untuk membidik, tahan TEMBAK lalu lepas', G.LW / 2, G.LH - 18, { a: 'c', s: 1 }); const L2 = this.ctl.lay(); }
      else G.text('Lawan menendang...', G.LW / 2, G.LH - 24, { a: 'c' });
    }
    if (this.phase === 'result') G.text(this.res === 'goal' ? 'GOOOL!' : this.res === 'save' ? 'DISELAMATKAN!' : this.res === 'post' ? 'TIANG!' : 'MELEBAR!', G.LW / 2, 140, { a: 'c', c: this.res === 'goal' ? G.C.gold : G.C.cream, s: 2 });
  }
};
// hasil 'post' dianggap tidak gol
const _pf = S.penalty.update; S.penalty.update = function (dt) { _pf.call(this, dt); };
