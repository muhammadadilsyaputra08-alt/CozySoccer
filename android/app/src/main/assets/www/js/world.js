'use strict';
/* Cozy Pixel Soccer - match engine */
const W = window.W = {};
W.F1 = { L: 65, R: 575, T: 65, B: 320, CX: 320, CY: 192, GY0: 155, GY1: 230, BOXW: 65, BY0: 121, BY1: 264, ZBAR: 26 };
/* lapangan 2x (gambar stadion diskalakan 2x; sprite tetap 1x) */
const F = W.F = { L: 130, R: 1150, T: 130, B: 640, CX: 640, CY: 384, GY0: 310, GY1: 460, BOXW: 130, BY0: 242, BY1: 528, ZBAR: 38, WW: 1280, WH: 768 };
const DT = 1 / 60;
const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ---------- layout sprite ---------- */
W.layouts = function () {
  if (W._lay) return W._lay;
  const mk = j => { const m = {}; j.rows.forEach(r => m[r.name] = r); return m; };
  return W._lay = { out: mk(G.json['Characters/Default_Players/ST/Player_ST.json']), gk: mk(G.json['Characters/Goalkeeper/Player_GK_sheet.json']) };
};
W.drawSprite = function (g, img, row, frame, x, y, o) {
  o = o || {};
  const sx = frame * 32, sy = row * 32;
  if (o.rot) {
    g.save(); g.translate(Math.round(x), Math.round(y - 12)); g.rotate(o.rot); g.drawImage(img, sx, sy, 32, 32, -16, -16, 32, 32); g.restore();
  } else g.drawImage(img, sx, sy, 32, 32, Math.round(x - 16), Math.round(y - 28), 32, 32);
};

/* ---------- VFX ---------- */
const VFX = { Ball_Kick_Dust: [6, 16, 16], Ball_Impact: [4, 16, 16], Goal_Explosion: [8, 64, 64], Goal_Celebration_Particles: [8, 64, 64], Save_Impact: [5, 32, 32], Shooting_Trail: [4, 32, 10],
  Passing_Trail: [4, 28, 6], Sprint_Dust: [4, 16, 16], Tackle_Dust: [5, 24, 24], Level_Up_Sparkle: [8, 32, 32], Recruitment_Effect: [8, 48, 48], Upgrade_Effect: [8, 32, 32], Victory_Confetti: [8, 96, 64], Player_Selection_Glow: [4, 36, 18] };
W.vfxSpawn = function (list, name, x, y, o) { o = o || {}; list.push({ n: name, x, y, t: 0, fps: o.fps || 16, loop: !!o.loop, life: o.life || 0, flip: o.flip || 1, rot: o.rot || 0, s: o.s || 1 }); };
W.vfxDraw = function (g, list, dt) {
  for (let i = list.length - 1; i >= 0; i--) {
    const f = list[i], d = VFX[f.n]; f.t += dt;
    const fr = Math.floor(f.t * f.fps);
    if (!f.loop && fr >= d[0]) { list.splice(i, 1); continue; }
    if (f.life && f.t > f.life) { list.splice(i, 1); continue; }
    const im = G.$('VFX/' + f.n + '_' + d[0] + 'f_' + d[1] + 'x' + d[2] + '.png'); const idx = fr % d[0];
    g.save(); g.translate(Math.round(f.x), Math.round(f.y)); if (f.rot) g.rotate(f.rot); if (f.flip < 0) g.scale(-1, 1);
    g.drawImage(im, idx * d[1], 0, d[1], d[2], -d[1] * f.s / 2, -d[2] * f.s / 2, d[1] * f.s, d[2] * f.s); g.restore();
  }
};
W.drawStadium = function (g, name) {
  const im = G.$(name || 'Environment/Stadium/Stadium_Day.png'), x = G.wx;
  if (x > 0) { g.fillStyle = '#2b1410'; g.fillRect(0, 0, x + 1, 384); g.fillRect(x + 639, 0, G.LW - x - 638, 384); }
  g.drawImage(im, x, 0);
};

/* ---------- Bola ---------- */
class Ball {
  constructor() { this.reset(320, 192); }
  reset(x, y) { this.x = x; this.y = y; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0; this.owner = null; this.lastTeam = -1; this.lastPl = null; this.recv = null; this.pass = null; this.shot = false; this.kickT = 99; this.rot = 0; }
  speed() { return Math.hypot(this.vx, this.vy); }
}

/* ---------- Pemain ---------- */
class Pl {
  constructor(m, team, d, slotIdx, slot) {
    this.m = m; this.team = team; this.d = d; this.idx = slotIdx; this.slotPos = slot[0]; this.hx = slot[1]; this.hy = slot[2];
    this.gk = d.kind === 'gk'; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.fx = team === 0 ? 1 : -1; this.fy = 0; this.dir = team === 0 ? 'right' : 'left';
    this.dx = 0; this.dy = 0; this.sprint = false; this.stamina = 100; this.state = 'move'; this.stT = 0; this.at = Math.random();
    this.cd = 0; this.tcd = 0; this.aiT = Math.random() * 0.3; this.holdT = 0; this.recvT = 0; this.runTo = null; this.ts = 0;
    this.compat = d.compat === undefined ? 1 : d.compat; this.captain = !!d.captain; this.fouls = 0; this.hit = false; this.diveDir = 0; this.diveT = 0; this.gkDelay = -1; this.gkY = 0;
    this.stat = { goals: 0, assists: 0, shots: 0, sot: 0, passes: 0, passOk: 0, tackles: 0, saves: 0, rating: 0 };
    this.setData(d);
  }
  setData(d) {
    this.d = d; this.gk = d.kind === 'gk'; this.compat = d.compat === undefined ? 1 : d.compat;
    const useAway = !!d.away;
    let path;
    if (d.srcId && D.PLAYERS[d.srcId]) path = D.sheetPath(D.PLAYERS[d.srcId], useAway); else path = D.sheetPath(d, false);
    this.img = G.$(path); this.lay = this.gk ? W.layouts().gk : W.layouts().out; this.pre = this.gk ? 'GK_' : '';
    this.passive = d.passive || null;
  }
  s(k) { const v = this.d.stats[k]; return (v === undefined ? 50 : v) * this.compat + (this.m.captainBonus(this)) + this.ts; }
  has(p) { return this.passive === p; }
  speedMax() {
    let sp = (this.gk ? 52 + this.s('Positioning') * 0.3 : 44 + this.s('Pace') * 0.62) * 1.5;
    const sm = this.has('Speed Demon') ? 1.46 : 1.32;
    if (this.sprint && this.stamina > 2) sp *= sm;
    if (this.m.ball.owner === this) sp *= (0.9 + this.s('Dribbling') * 0.0012 + (this.has('Quick Feet') ? 0.07 : 0)) * (this.gk ? 1 : 1);
    const stf = this.stamina < 35 ? 0.72 + 0.28 * this.stamina / 35 : 1; sp *= stf;
    return sp * (1 + this.ts * 0.004);
  }
  play(name, loop) { const r = this.lay[this.pre + name] || this.lay[name]; if (!r) return; if (this.animName !== name) { this.animName = name; this.at = 0; } }
}

/* ---------- Pertandingan ---------- */
class Match {
  constructor(cfg) {
    this.cfg = cfg; this.teams = [cfg.home, cfg.away]; this.userTeam = cfg.userTeam === undefined ? 0 : cfg.userTeam;
    this.halfLen = cfg.half * 60; this.knockout = !!cfg.knockout; this.ball = new Ball();
    this.pl = [[], []]; this.all = []; this.fx = []; this.msgs = []; this.acc = 0; this.tm = 0;
    this.score = [0, 0]; this.half = 1; this.clock = 0; this.phase = 'kickoff'; this.phT = 1.4; this.kickTeam = 0; this.extra = false;
    this.goals = []; this.subsUsed = 0; this.bench = cfg.home.bench || []; this.poss = [0, 0]; this.trail = 0;
    this.stat = [{ shots: 0, sot: 0, passes: 0, passOk: 0, tackles: 0, saves: 0, fouls: 0 }, { shots: 0, sot: 0, passes: 0, passOk: 0, tackles: 0, saves: 0, fouls: 0 }];
    this.ctrl = null; this.restart = null; this.netT = 0; this.goalSide = 0; this.penReq = null; this.over = false; this.banner = null; this.trailing = [false, false]; this.maxDeficit = [0, 0];
    this.diff = cfg.diff || 1; this.autoSwitchT = 0; this.lastPasser = null; this.prevPasser = null; this.passerT = 0;
    for (let t = 0; t < 2; t++) {
      const slots = D.FORMATIONS[this.teams[t].form].slots;
      this.teams[t].players.forEach((d, i) => { const p = new Pl(this, t, d, i, slots[i]); this.pl[t].push(p); this.all.push(p); });
    }
    this.cam = { x: 0, y: 0 }; this.placeKickoff(0); this.updateCam(1, true);
    if (this.userTeam >= 0) this.ctrl = this.pl[this.userTeam][9] || this.pl[this.userTeam][8];
  }
  updateCam(dt, snap) {
    const b = this.ball, o = b.owner, vw = G.LW, vh = G.LH; let tx, ty;
    if (o) { tx = o.x + o.fx * 60; ty = o.y + o.fy * 36; } else { tx = b.x + b.vx * 0.35; ty = b.y + b.vy * 0.35; }
    if (this.phase === 'kickoff') { tx = F.CX; ty = F.CY; }
    const cx = G.clamp(tx - vw / 2, 0, F.WW - vw), cy = G.clamp(ty - vh / 2, 0, F.WH - vh);
    const k = snap ? 1 : Math.min(1, dt * 3.5); this.cam.x += (cx - this.cam.x) * k; this.cam.y += (cy - this.cam.y) * k;
  }
  captainBonus(p) { const t = this.teams[p.team]; return (t.mine && !p.captain && t.players.some(q => q.captain)) ? 1.5 : 0; }
  atkDir(team) { return team === 0 ? 1 : -1; }
  goalX(team) { return team === 0 ? F.L : F.R; } // gawang yang DIPERTAHANKAN tim
  homePos(p) {
    const x = p.team === 0 ? F.L + p.hx * (F.R - F.L) : F.R - p.hx * (F.R - F.L);
    const y = p.team === 0 ? F.T + p.hy * (F.B - F.T) : F.B - p.hy * (F.B - F.T);
    return [x, y];
  }
  msg(text, col, dur) { this.banner = { text, col: col || G.C.cream, t: dur || 2 }; }
  minute() { const f = Math.min(1, this.clock / this.halfLen); return this.extra ? 90 + Math.floor(f * 10) : Math.floor(f * 45) + (this.half === 2 ? 45 : 0); }

  placeKickoff(team) {
    this.kickTeam = team; const b = this.ball; b.reset(F.CX, F.CY); this.restart = null;
    this.all.forEach(p => {
      let [x, y] = this.homePos(p); const k = p.team === 0 ? (x - F.L) / (F.R - F.L) : (F.R - x) / (F.R - F.L);
      const nx = 0.04 + Math.min(1, k / 0.85) * 0.42; x = p.team === 0 ? F.L + nx * (F.R - F.L) : F.R - nx * (F.R - F.L);
      p.x = x; p.y = y; p.vx = p.vy = 0; p.state = 'move'; p.cd = 0; p.runTo = null; p.fx = p.team === 0 ? 1 : -1; p.fy = 0; p.dir = p.team === 0 ? 'right' : 'left'; p.diveT = 0; p.gkDelay = -1;
    });
    const k = this.pl[team], taker = k.filter(p => !p.gk && (p.slotPos === 'ST' || p.slotPos === 'CAM')).sort((a, b) => b.hx - a.hx)[0] || k[9];
    taker.x = F.CX + (team === 0 ? -6 : 6); taker.y = F.CY; this.kickoffTaker = taker;
    const mate = k.filter(p => !p.gk && p !== taker).sort((a, b) => dist(a, taker) - dist(b, taker))[0];
    if (mate) { mate.x = F.CX + (team === 0 ? -34 : 34); mate.y = F.CY + 22; }
    this.phase = 'kickoff'; this.phT = 1.3;
    if (this.userTeam >= 0) this.ctrl = this.userTeam === team ? taker : this.pl[this.userTeam].filter(p => !p.gk).sort((a, b) => dist(a, b.ball || { x: F.CX, y: F.CY }) - dist(b, { x: F.CX, y: F.CY }))[0];
  }

  /* ---------- update ---------- */
  update(dt, inp) {
    this.acc += Math.min(dt, 0.1); inp = inp || {};
    while (this.acc >= DT) {
      this.step(DT, inp); this.acc -= DT;
      inp = Object.assign({}, inp, { pass: false, through: false, sw: false, tackle: false, shootRel: false, shootPress: false });
    }
  }
  step(dt, inp) {
    this.tm += dt; this.updateCam(dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    const b = this.ball;
    this.all.forEach(p => { p.at += dt; if (p.cd > 0) p.cd -= dt; if (p.tcd > 0) p.tcd -= dt; if (p.recvT > 0) p.recvT -= dt; });
    switch (this.phase) {
      case 'kickoff':
        this.phT -= dt; this.settleKickoff(dt);
        if (this.phT <= 0) { this.phase = 'play'; this.give(this.kickoffTaker); this.sfx('SFX_Whistle'); }
        break;
      case 'play': this.playStep(dt, inp); break;
      case 'goal':
        this.phT -= dt; this.netT += dt; this.animateAll(dt); this.moveBall(dt, true);
        if (this.phT <= 0) { this.afterGoal(); }
        break;
      case 'dead':
        this.phT -= dt; this.deadStep(dt, inp);
        break;
      case 'halftime': this.phT -= dt; this.animateAll(dt); break;
      case 'penalty': this.animateAll(dt); break;
      case 'full': this.animateAll(dt); break;
    }
  }
  settleKickoff(dt) {
    this.all.forEach(p => { p.vx = p.vy = 0; p.state = 'move'; p.dx = p.dy = 0; p.animName = null; this.animate(p, dt); });
    this.ball.x = F.CX; this.ball.y = F.CY;
  }
  animateAll(dt) { this.all.forEach(p => { if (p.state !== 'celebrate') { p.vx *= 0.9; p.vy *= 0.9; } this.moveStep(p, dt, true); this.animate(p, dt); }); }

  playStep(dt, inp) {
    const b = this.ball, ut = this.userTeam;
    this.clock += dt; if (b.owner) this.poss[b.owner.team] += dt; if (this.passerT > 0) this.passerT -= dt;
    b.kickT += dt;
    this.updateTeamSpirit();
    if (ut >= 0) this.userControl(dt, inp);
    this.all.forEach(p => { p.aiT -= dt; if (p !== this.ctrl) this.ai(p, dt); });
    this.all.forEach(p => this.moveStep(p, dt));
    this.separate();
    this.moveBall(dt);
    this.pickup();
    this.checkTackles();
    this.checkRules();
    this.all.forEach(p => this.animate(p, dt));
    if (this.phase === 'play' && this.clock >= this.halfLen) this.endHalf();
  }
  updateTeamSpirit() {
    this.all.forEach(p => p.ts = 0);
    this.all.forEach(q => { if (q.has('Team Spirit')) this.pl[q.team].forEach(p => { if (p !== q && dist(p, q) < 75) p.ts = 3; }); });
  }

  /* ---------- kontrol user ---------- */
  userControl(dt, inp) {
    const ut = this.userTeam, b = this.ball; let c = this.ctrl;
    if (!c) return;
    // auto switch
    this.autoSwitchT -= dt;
    if (b.owner && b.owner.team === ut && !b.owner.gk) { if (c !== b.owner) this.ctrl = c = b.owner; }
    else if (this.autoSwitchT <= 0 && !(b.owner && b.owner.team === ut)) {
      this.autoSwitchT = 0.3;
      const cand = this.pl[ut].filter(p => !p.gk && p.state !== 'fall').sort((a, b2) => dist(a, b) - dist(b2, b))[0];
      if (cand && cand !== c && dist(cand, b) < dist(c, b) - 40 && (c.state === 'move')) this.ctrl = c = cand;
    }
    if (inp.sw) this.switchPlayer(inp);
    c = this.ctrl;
    const has = b.owner === c;
    const mx = inp.mx || 0, my = inp.my || 0, mag = Math.min(1, Math.hypot(mx, my));
    c.dx = mag > 0.12 ? mx / (mag || 1) * mag : 0; c.dy = mag > 0.12 ? my / (mag || 1) * mag : 0; c.sprint = !!inp.sprint && mag > 0.2;
    c.runTo = null;
    const busy = c.state === 'kick' || c.state === 'tackle' || c.state === 'fall' || c.state === 'dive';
    if (busy) return;
    if (has) {
      if (inp.pass) this.userPass(c, inp, false);
      else if (inp.through) this.userPass(c, inp, true);
      else if (inp.longPass) this.userPass(c, inp, false, true);
      else if (inp.shootRel) this.userShoot(c, inp);
    } else if (inp.tackle || inp.shootRel) {
      const [fx, fy] = mag > 0.3 ? norm(mx, my) : [c.fx, c.fy];
      this.startTackle(c, fx, fy);
    }
  }
  switchPlayer(inp) {
    const ut = this.userTeam, b = this.ball, c = this.ctrl;
    let cand = this.pl[ut].filter(p => !p.gk && p !== c);
    const mx = inp.mx || 0, my = inp.my || 0;
    if (Math.hypot(mx, my) > 0.4) {
      const [ux, uy] = norm(mx, my);
      cand = cand.map(p => { const rx = p.x - c.x, ry = p.y - c.y, d = Math.hypot(rx, ry) || 1; return { p, s: (rx * ux + ry * uy) / d * 100 - d * 0.1 }; }).filter(o => o.s > 20).sort((a, b2) => b2.s - a.s).map(o => o.p);
      if (cand.length) { this.ctrl = cand[0]; return; }
      cand = this.pl[ut].filter(p => !p.gk && p !== c);
    }
    cand.sort((a, b2) => dist(a, b) - dist(b2, b));
    if (cand[0]) this.ctrl = cand[0];
  }

  /* ---------- aksi bola ---------- */
  give(p) {
    const b = this.ball; if (!p) return;
    if (b.pass) { const from = b.pass.from; if (p.team === b.pass.team) { if (p !== from) { this.stat[p.team].passOk++; from.stat.passOk++; this.prevPasser = this.lastPasser; this.lastPasser = from; this.passerT = 5; } } else { } b.pass = null; }
    else if (b.lastTeam >= 0 && b.lastTeam !== p.team) { this.lastPasser = null; }
    b.owner = p; b.vx = b.vy = 0; b.z = 0; b.vz = 0; b.recv = null; b.shot = false; b.lastTeam = p.team; b.lastPl = p; p.recvT = 0.25; p.holdT = 0; p.cd = 0;
    p.runTo = null;
    if (p.team === this.userTeam && !p.gk) this.ctrl = p;
  }
  kickBall(p, vx, vy, vz, o) {
    o = o || {}; const b = this.ball;
    b.owner = null; b.vx = vx; b.vy = vy; b.vz = vz || 0; b.lastTeam = p.team; b.lastPl = p; b.kickT = 0; b.recv = o.recv || null; b.shot = !!o.shot; b.pass = o.pass || null;
    p.cd = 0.45; p.state = 'kick'; p.stT = o.shot ? 0.34 : 0.28; p.animName = null; p.animKind = o.shot ? 'shoot' : 'pass'; p.at = 0;
    p.fx = vx / (Math.hypot(vx, vy) || 1); p.fy = vy / (Math.hypot(vx, vy) || 1);
    b.x = p.x + p.fx * 6; b.y = p.y + p.fy * 6;
    W.vfxSpawn(this.fx, 'Ball_Kick_Dust', p.x + p.fx * 8, p.y + 1);
    this.sfx(o.shot ? 'SFX_Shoot' : 'SFX_Pass');
    if (o.shot) { W.vfxSpawn(this.fx, 'Shooting_Trail', b.x - p.fx * 14, b.y - 4, { rot: Math.atan2(vy, vx), life: 0.3 }); }
  }
  doPass(p, tx, ty, target, o) {
    o = o || {}; const b = this.ball;
    let dx = tx - p.x, dy = ty - p.y; const d = Math.hypot(dx, dy) || 1;
    let ang = Math.atan2(dy, dx);
    let err = (100 - p.s('Passing')) * 0.0013 + 0.012; if (p.has('Playmaker')) err *= 0.55; if (p.has('Eagle Eye') && d > 150) err *= 0.5;
    if (p.gk) err = (100 - p.s('Distribution')) * 0.0013 + 0.015;
    err *= (0.6 + d / 520);
    ang += G.rnd(-1, 1) * err * 1.7;
    let sp = o.through ? 230 + d * 0.5 : 170 + d * 0.55; sp = G.clamp(sp, 200, 430); sp += p.s('Passing') * 0.35; if (p.has('Eagle Eye') && d > 150) sp *= 1.08;
    const lob = o.lob || (d > 340 && !o.through); const vz = lob ? (d > 400 ? 190 : 150) : 0;
    this.stat[p.team].passes++; p.stat.passes++;
    this.kickBall(p, Math.cos(ang) * sp, Math.sin(ang) * sp, vz, { recv: target || null, pass: { from: p, team: p.team, target } });
    if (target) { if (p.team === this.userTeam) this.ctrl = target; if (o.through) target.runTo = { x: tx, y: ty, t: 1.6 }; }
  }
  userPass(c, inp, through, long) {
    const mx = inp.mx || 0, my = inp.my || 0, mag = Math.hypot(mx, my);
    const [ux, uy] = mag > 0.3 ? norm(mx, my) : [c.fx, c.fy];
    const mates = this.pl[c.team].filter(p => p !== c && !p.gk || (p.gk && p !== c && c.x * this.atkDir(c.team) < 0));
    let best = null, bs = -999; const ad = this.atkDir(c.team);
    mates.forEach(p => {
      const rx = p.x - c.x, ry = p.y - c.y, d = Math.hypot(rx, ry); if (d < 24 || d > (long ? 700 : 520)) return;
      const cos = (rx * ux + ry * uy) / d; if (cos < (through ? 0.35 : 0.55)) return;
      let s = long ? cos * 100 + d * 0.12 : cos * 100 - d * (through ? 0.06 : 0.14);
      if (through) s += (p.x - c.x) * ad * 0.25;
      if (!long && this.laneBlocked(c, p)) s -= 25;
      if (s > bs) { bs = s; best = p; }
    });
    if (best) {
      if (through) {
        const lead = 60 + Math.hypot(best.vx, best.vy) * 0.6; let tx = best.x + ad * lead + best.vx * 0.5, ty = best.y + best.vy * 0.5;
        tx = G.clamp(tx, F.L + 8, F.R - 8); ty = G.clamp(ty, F.T + 8, F.B - 8);
        this.doPass(c, tx, ty, best, { through: true });
      } else {
        const t = dist(c, best) / 300; this.doPass(c, best.x + best.vx * t * 0.6, best.y + best.vy * t * 0.6, best, { lob: !!long });
      }
    } else {
      const d = long ? 400 : through ? 200 : 150; this.doPass(c, G.clamp(c.x + ux * d, F.L, F.R), G.clamp(c.y + uy * d, F.T, F.B), null, { through, lob: !!long });
    }
  }
  laneBlocked(a, t) {
    const opp = this.pl[1 - a.team]; const ax = a.x, ay = a.y, bx = t.x, by = t.y, dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (const o of opp) { let u = ((o.x - ax) * dx + (o.y - ay) * dy) / l2; if (u < 0.1 || u > 0.95) continue; const px = ax + dx * u, py = ay + dy * u; if (Math.hypot(o.x - px, o.y - py) < 15) return true; }
    return false;
  }
  userShoot(c, inp) {
    const power = G.clamp(inp.power === undefined ? 0.7 : inp.power, 0.45, 1);
    const mx = inp.mx || 0, my = inp.my || 0, mag = Math.hypot(mx, my);
    this.shoot(c, power, mag > 0.3 ? mx : null, mag > 0.3 ? my : null);
  }
  shoot(p, power, ux, uy) {
    const ad = this.atkDir(p.team), gx = ad > 0 ? F.R : F.L;
    let dirx = ux === null || ux === undefined ? p.fx : ux, diry = ux === null || ux === undefined ? p.fy : uy; [dirx, diry] = norm(dirx, diry);
    const toG = norm(gx - p.x, F.CY - p.y), cos = dirx * toG[0] + diry * toG[1];
    let tx, ty;
    if (cos > 0.5 && (gx - p.x) * ad > 20) { tx = gx; ty = F.CY + (G.clamp(diry * 1.4 + (uy ? 0 : 0), -1, 1)) * 62; if (Math.abs(diry) < 0.15 || ux === null) ty = F.CY + G.rnd(-45, 45); }
    else { tx = p.x + dirx * 200; ty = p.y + diry * 200; }
    const d = Math.hypot(tx - p.x, ty - p.y) || 1; let ang = Math.atan2(ty - p.y, tx - p.x);
    const inBox = Math.abs(p.x - gx) < F.BOXW && p.y > F.BY0 && p.y < F.BY1;
    let err = (100 - p.s('Shooting')) * 0.0016 + 0.018;
    if (p.has('Sniper') && !inBox) err *= 0.55; if (p.has('Predator') && inBox) err *= 0.6;
    err *= (0.65 + 0.55 * power) * (0.7 + d / 900);
    ang += G.rnd(-1, 1) * err * 1.8;
    let sp = (200 + p.s('Shooting') * 1.25) * (0.72 + 0.34 * power) * 1.4; if (p.has('Predator') && inBox) sp *= 1.07;
    let vz = power > 0.85 ? G.rnd(40, 110) : G.rnd(0, 40);
    if (power > 0.95 && Math.random() < (100 - p.s('Shooting')) * 0.004) vz = G.rnd(150, 220);
    this.stat[p.team].shots++; p.stat.shots++;
    const onT = Math.abs(Math.atan2(F.CY - p.y, gx - p.x) - ang) < 0.25 && Math.abs(p.x - gx) < 620; if (onT) { this.stat[p.team].sot++; p.stat.sot++; }
    this.kickBall(p, Math.cos(ang) * sp, Math.sin(ang) * sp, vz, { shot: true });
    this.shotBy = p; this.shotT = 0;
  }

  /* ---------- tackle & duel ---------- */
  startTackle(p, fx, fy) {
    if (p.tcd > 0 || p.state === 'tackle' || p.state === 'fall' || p.state === 'kick' || p.gk) return false;
    p.state = 'tackle'; p.stT = 0.34; p.hit = false; p.tcd = 1.0; p.animKind = 'tackle'; p.animName = null; p.at = 0;
    const [nx, ny] = norm(fx, fy); p.fx = nx; p.fy = ny; p.vx = nx * 150; p.vy = ny * 150; this.sfx('SFX_Tackle', 0.5);
    W.vfxSpawn(this.fx, 'Tackle_Dust', p.x, p.y);
    return true;
  }
  checkTackles() {
    const b = this.ball;
    this.all.forEach(t => {
      if (t.state !== 'tackle' || t.hit) return;
      const el = 0.34 - t.stT; if (el < 0.05 || el > 0.24) return;
      const c = b.owner;
      if (c && c.team !== t.team && dist(t, c) < 17 && !c.gk) {
        t.hit = true; this.duel(t, c);
      } else if (!c) {
        if (dist(t, b) < 13 && b.z < 8) { t.hit = true; this.give(t); t.stat.tackles++; this.stat[t.team].tackles++; }
      } else {
        // kontak dengan pemain lain tanpa bola -> kemungkinan pelanggaran
        for (const o of this.pl[1 - t.team]) { if (o !== c && !o.gk && dist(t, o) < 12 && o.state !== 'fall' && Math.random() < 0.012) { t.hit = true; this.foul(t, o); return; } }
      }
    });
  }
  duel(t, c) {
    let p = 0.42 + (t.s('Defense') - c.s('Dribbling')) * 0.006 + (t.has('Iron Wall') ? 0.14 : 0) - (c.sprint ? 0.05 : 0) + (c.fx * t.fx + c.fy * t.fy > 0.4 ? 0.12 : 0) + (t.s('Physical') - c.s('Physical')) * 0.002;
    p = G.clamp(p, 0.12, 0.88);
    if (Math.random() < p) {
      const b = this.ball; b.owner = null; b.vx = t.fx * 95 + G.rnd(-25, 25); b.vy = t.fy * 95 + G.rnd(-25, 25); b.lastTeam = t.team; b.lastPl = t; b.pass = null; b.kickT = 0.2; b.recv = null;
      c.cd = 0.55; c.state = 'fall'; c.stT = 0.35; c.animKind = 'fall'; c.animName = null; c.at = 0; t.cd = 0.05; t.stat.tackles++; this.stat[t.team].tackles++;
      this.lastPasser = null; this.sfx('SFX_Tackle', 0.8); W.vfxSpawn(this.fx, 'Tackle_Dust', c.x, c.y);
    } else {
      if (Math.random() < 0.12) this.foul(t, c);
      else { t.state = 'fall'; t.stT = 0.6; t.animKind = 'fall'; t.animName = null; t.at = 0; t.vx *= 0.3; t.vy *= 0.3; }
    }
  }
  foul(by, victim) {
    if (this.phase !== 'play') return;
    this.sfx('SFX_Whistle'); this.stat[by.team].fouls++; by.fouls++;
    victim.state = 'fall'; victim.stT = 0.9; victim.animKind = 'fall'; victim.animName = null; victim.at = 0; victim.vx = victim.vy = 0;
    const own = this.goalX(by.team), inBox = Math.abs(victim.x - (this.goalX(by.team))) < F.BOXW && victim.y > F.BY0 && victim.y < F.BY1;
    this.ball.owner = null; this.ball.vx = this.ball.vy = 0;
    if (inBox) { this.msg('PENALTI!', G.C.gold, 1.6); this.penReq = { team: victim.team, shooter: this.pickPenTaker(victim.team), why: 'foul' }; this.phase = 'penalty'; this.phT = 1.2; this.ball.x = victim.x; this.ball.y = victim.y; this.ball.z = 0; return; }
    this.msg('Pelanggaran!', G.C.cream, 1.4);
    this.setRestart('free', victim.team, G.clamp(victim.x, F.L + 10, F.R - 10), G.clamp(victim.y, F.T + 10, F.B - 10));
  }
  pickPenTaker(team) { const l = this.pl[team].filter(p => !p.gk).sort((a, b) => b.s('Shooting') - a.s('Shooting')); return l[0]; }

  /* ---------- gerak ---------- */
  moveStep(p, dt, free) {
    const st = p.state;
    if (st === 'kick' || st === 'tackle' || st === 'fall' || st === 'dive') { p.stT -= dt; if (p.stT <= 0) { p.state = 'move'; p.animName = null; p.diveT = 0; if (st === 'dive') { p.state = 'fall'; p.stT = 0.5; p.animKind = 'getup'; p.animName = null; p.at = 0; } } }
    if (st === 'tackle') { const k = Math.max(0, p.stT / 0.34); p.vx = p.fx * 150 * k; p.vy = p.fy * 150 * k; }
    else if (st === 'fall') { p.vx *= 0.88; p.vy *= 0.88; }
    else if (st === 'dive') { /* diatur gkDive */ }
    else if (st === 'celebrate') { p.vx *= 0.9; p.vy *= 0.9; }
    else if (!free) {
      let mag = Math.min(1, Math.hypot(p.dx, p.dy)), sp = p.speedMax() * (st === 'kick' ? 0.35 : 1);
      const tx = p.dx * sp, ty = p.dy * sp;
      let k = Math.min(1, dt * (mag > 0 ? 9 : 12)); p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
      const run = Math.hypot(p.vx, p.vy);
      // stamina
      const drainK = (p.has('Stamina King') ? 0.6 : 1) * (1.3 - p.s('Physical') / 100 * 0.6);
      if (p.sprint && run > 40 && p.stamina > 0) p.stamina -= 9 * drainK * dt;
      else if (run > 20) p.stamina -= 0.35 * drainK * dt; else p.stamina += 5 * dt;
      p.stamina = G.clamp(p.stamina, 0, 100);
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = G.clamp(p.x, F.L - 60, F.R + 60); p.y = G.clamp(p.y, F.T - 8, F.B + 10);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 14 && p.state !== 'tackle' && p.state !== 'dive') { const [nx, ny] = norm(p.vx, p.vy); p.fx += (nx - p.fx) * Math.min(1, dt * 14); p.fy += (ny - p.fy) * Math.min(1, dt * 14); const l = Math.hypot(p.fx, p.fy) || 1; p.fx /= l; p.fy /= l; }
    if (p.sprint && sp > 80 && Math.random() < 0.05) W.vfxSpawn(this.fx, 'Sprint_Dust', p.x - p.fx * 6, p.y);
  }
  separate() {
    const a = this.all;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
      const p = a[i], q = a[j]; const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d < 9 && d > 0.01) { const push = (9 - d) * 0.5, nx = dx / d, ny = dy / d; if (p.state !== 'tackle') { p.x -= nx * push; p.y -= ny * push; } if (q.state !== 'tackle') { q.x += nx * push; q.y += ny * push; } }
    }
  }
  animate(p, dt) {
    const sp = Math.hypot(p.vx, p.vy), has = this.ball.owner === p;
    // arah sprite (hysteresis)
    const ax = Math.abs(p.fx), ay = Math.abs(p.fy), cur = p.dir; let nd;
    if (ax > ay * (cur === 'left' || cur === 'right' ? 0.8 : 1.25)) nd = p.fx > 0 ? 'right' : 'left'; else nd = p.fy > 0 ? 'down' : 'up'; p.dir = nd;
    let name;
    const st = p.state;
    if (st === 'celebrate') name = p.gk ? 'celebrate' : 'celebrate';
    else if (st === 'fall') name = p.animKind === 'getup' ? 'get_up' : 'fall';
    else if (st === 'kick') name = (p.animKind === 'shoot' ? 'shoot_' : 'pass_') + nd;
    else if (st === 'tackle') name = 'tackle_' + nd;
    else if (st === 'dive') name = 'dive';
    else if (p.recvT > 0 && sp < 40) name = 'receive_' + nd;
    else if (sp < 12) name = 'idle_' + nd;
    else if (p.gk) name = 'move_' + nd;
    else if (has) name = 'dribble_' + nd;
    else if (p.sprint && sp > p.speedMax() * 0.6 && sp > 90) name = 'sprint_' + nd;
    else if (sp > 70) name = 'run_' + nd; else name = 'walk_' + nd;
    if (p.animKey !== name) { p.animKey = name; p.at = 0; }
    p.animNameR = name;
  }

  /* ---------- bola ---------- */
  moveBall(dt, inNet) {
    const b = this.ball, o = b.owner;
    if (o) {
      const lead = (o.sprint ? 11 : 8), tx = o.x + o.fx * lead, ty = o.y + o.fy * lead + 1;
      const k = Math.min(1, dt * 16); b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.z = 0; b.vx = o.vx; b.vy = o.vy;
      b.rot += dt * Math.hypot(o.vx, o.vy) * 0.2; return;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.z > 0 || b.vz > 0) {
      b.vz -= 450 * dt; b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; if (b.vz < -45) { b.vz = -b.vz * 0.5; b.vx *= 0.85; b.vy *= 0.85; if (!inNet) this.sfx('SFX_Ball_Bounce', 0.35); } else b.vz = 0; }
    } else { const f = Math.pow(0.5, dt); b.vx *= f; b.vy *= f; if (Math.hypot(b.vx, b.vy) < 4) { b.vx = b.vy = 0; } }
    b.rot += dt * b.speed() * 0.25;
    if (inNet) { const gx = this.goalSide > 0 ? F.R : F.L; const inx = this.goalSide > 0 ? gx + 36 : gx - 36; if ((this.goalSide > 0 && b.x > inx) || (this.goalSide < 0 && b.x < inx)) { b.x = inx; b.vx *= -0.2; } b.vx *= 0.97; b.y = G.clamp(b.y, F.GY0 + 4, F.GY1 - 4); }
  }
  pickup() {
    const b = this.ball; if (b.owner || this.phase !== 'play') return;
    const sp = b.speed(); let best = null, bd = 99;
    this.all.forEach(p => {
      if (p.cd > 0 || p.state === 'fall' || p.state === 'tackle' || b.z > (p.gk ? 32 : 12)) return;
      let reach = p.gk ? (p.state === 'dive' ? 38 : 24) : 11.5; const d = dist(p, b);
      if (d < reach && d < bd) { bd = d; best = p; }
    });
    if (!best) { return; }
    const p = best;
    if (p.gk && b.lastTeam !== p.team && (b.shot || sp > 220)) { b.shot = true; this.gkSave(p); return; }
    const lim = (b.recv === p ? 650 : 300 + p.s('Passing') * 1.1 + (p.gk ? 120 : 0));
    if (sp > lim && b.lastPl !== p && b.kickT > 0.15) {
      // blok / deflect
      b.vx *= -0.35 + G.rnd(-0.2, 0.2); b.vy = b.vy * 0.5 + G.rnd(-70, 70); p.cd = 0.3; b.recv = null; b.pass = null; b.lastTeam = p.team; b.lastPl = p; b.shot = false; this.sfx('SFX_Ball_Bounce', 0.5);
      W.vfxSpawn(this.fx, 'Ball_Impact', b.x, b.y - 3); return;
    }
    if (b.shot && b.lastTeam !== p.team) { this.lastPasser = null; }
    this.give(p);
  }
  /* kiper menyelamatkan bola tembakan */
  gkDiveSave() {
    const b = this.ball; if (!b.shot || b.owner) return;
    for (const p of this.all) {
      if (!p.gk || p.team === b.lastTeam) continue;
      const reach = p.state === 'dive' ? 40 : 26; if (dist(p, b) < reach && b.z < 34) { this.gkSave(p); return; }
    }
  }
  gkSave(p) {
    const b = this.ball, sp = b.speed(); if (!b.shot && sp < 60) { this.give(p); return; }
    let pc = 0.5 + p.s('Handling') * 0.0065 - sp * 0.0007 + (p.state === 'dive' ? -0.08 : 0.05) + (p.has('Last Hope') && Math.abs(p.x - b.lastPl.x) < 130 ? 0.1 : 0);
    pc = G.clamp(pc, 0.12, 0.88); p.stat.saves++; this.stat[p.team].saves++;
    W.vfxSpawn(this.fx, 'Save_Impact', b.x, b.y - 4); this.sfx('SFX_Ball_Bounce', 0.7);
    const sh = b.lastPl; if (sh && sh.team !== p.team) { /* sot sudah dihitung */ }
    if (Math.random() < pc) { this.give(p); p.holdT = 0; this.msg('Penyelamatan!', G.C.cream, 1.1); }
    else { // tepis
      const ad = this.atkDir(p.team); b.shot = false; b.owner = null; b.vx = ad * G.rnd(90, 180); b.vy = (b.y > p.y ? 1 : -1) * G.rnd(80, 200); b.vz = G.rnd(20, 90); b.recv = null; p.cd = 0.5; b.lastTeam = p.team; b.lastPl = p; b.pass = null;
      this.msg('Ditepis!', G.C.cream, 1);
    }
    if (p.state === 'dive') { p.stT = Math.min(p.stT, 0.25); }
  }

  /* ---------- aturan ---------- */
  checkRules() {
    const b = this.ball, o = b.owner;
    // tiang gawang: bola lepas memantul dari tiang (tidak bisa masuk dari samping)
    if (!o) for (const gx of [F.L, F.R]) for (const py of [F.GY0, F.GY1]) {
      const dx = b.x - gx, dy = b.y - py, d = Math.hypot(dx, dy), PR = 9;
      if (d < PR && d > 0.01 && b.z < F.ZBAR) {
        const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
        if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; if (b.speed() > 60) { W.vfxSpawn(this.fx, 'Ball_Impact', b.x, b.y - 4); this.sfx('SFX_Ball_Bounce', 0.8); if (b.shot) this.msg('Tiang gawang!', G.C.gold, 1.2); } b.shot = false; b.pass = null; }
        b.x = gx + nx * PR; b.y = py + ny * PR;
      }
    }
    // gawang: harus masuk dari depan (bukan menyusur garis)
    for (const side of [-1, 1]) {
      const gx = side < 0 ? F.L : F.R;
      const crossed = side < 0 ? b.x < gx : b.x > gx;
      if (!crossed) continue;
      const inMouth = b.y > F.GY0 + 4 && b.y < F.GY1 - 4;
      if (o && o.gk) continue;
      if (inMouth && b.z < F.ZBAR && (o || Math.abs(b.vx) > 0.2 * b.speed())) { this.goal(side); return; }
    }
    if (o && o.gk) return;
    // keluar
    let out = null;
    if (b.y < F.T - 2 || b.y > F.B + 2) out = { t: 'throw', x: G.clamp(b.x, F.L + 8, F.R - 8), y: b.y < F.T ? F.T - 4 : F.B + 4 };
    else if (b.x < F.L - 3 || b.x > F.R + 3) {
      const side = b.x < F.L ? -1 : 1; const defTeam = side < 0 ? 0 : 1;
      if (b.lastTeam === defTeam) out = { t: 'corner', team: 1 - defTeam, x: side < 0 ? F.L + 3 : F.R - 3, y: b.y < F.CY ? F.T + 3 : F.B - 3 };
      else out = { t: 'goalkick', team: defTeam };
    }
    if (out) {
      if (this.stat && b.pass) { b.pass = null; }
      this.sfx('SFX_Whistle', 0.4);
      if (out.t === 'throw') { const team = 1 - (b.lastTeam < 0 ? 0 : b.lastTeam); this.msg('Lemparan ke dalam', G.C.cream, 1.2); this.setRestart('throw', team, out.x, out.y + (out.y < F.CY ? 6 : -6)); }
      else if (out.t === 'corner') { this.msg('Tendangan sudut', G.C.cream, 1.4); this.setRestart('corner', out.team, out.x, out.y); }
      else { this.msg('Tendangan gawang', G.C.cream, 1.2); const gx = out.team === 0 ? F.L + 44 : F.R - 44; this.setRestart('goalkick', out.team, gx, F.CY + G.rnd(-36, 36)); }
    }
  }
  goal(side) {
    const b = this.ball, scoringTeam = side < 0 ? 1 : 0;
    this.score[scoringTeam]++; let scorer = b.lastPl, own = false;
    if (scorer && scorer.team !== scoringTeam) { own = true; }
    if (scorer && !own) { scorer.stat.goals++; if (this.lastPasser && this.lastPasser !== scorer && this.lastPasser.team === scoringTeam && this.passerT > 0) this.lastPasser.stat.assists++; }
    this.goals.push({ team: scoringTeam, name: scorer ? scorer.d.name : '?', min: this.minute() + 1, own, pl: scorer });
    const trail = this.score[1 - this.userTeam] - this.score[this.userTeam]; if (this.userTeam >= 0) { this.maxDeficit[0] = Math.max(this.maxDeficit[0], trail); }
    this.goalSide = side; this.netT = 0; this.phase = 'goal'; this.phT = 3.2; b.shot = false; b.owner = null; b.vx *= 0.35; b.vy *= 0.35;
    this.sfx('SFX_Goal'); this.sfx('SFX_Crowd_Cheer', 0.9); G.vibrate(60);
    this.msg('GOOOL! ' + (scorer ? scorer.d.name : ''), G.C.gold, 3);
    W.vfxSpawn(this.fx, 'Goal_Explosion', side < 0 ? F.L - 12 : F.R + 12, F.CY, { s: 2 });
    this.all.forEach(p => { if (p.team === scoringTeam && !p.gk) { p.state = 'move'; } });
    if (scorer && !own) { scorer.state = 'celebrate'; scorer.stT = 3; scorer.animKind = 'cel'; W.vfxSpawn(this.fx, 'Goal_Celebration_Particles', scorer.x, scorer.y - 20, { fps: 10 }); }
    this.lastScoringTeam = scoringTeam;
    this.all.forEach(p => { p.runTo = null; });
    this.celeb = scorer && !own ? scorer : null;
  }
  afterGoal() {
    this.all.forEach(p => { if (p.state === 'celebrate') p.state = 'move'; });
    // cek akhir babak (waktu habis saat gol animasi)
    if (this.clock >= this.halfLen) { this.endHalf(); return; }
    this.placeKickoff(1 - this.lastScoringTeam);
  }
  setRestart(type, team, x, y) {
    const b = this.ball; b.reset(x, y); b.lastTeam = -1; this.phase = 'dead'; this.phT = type === 'goalkick' ? 1.1 : 1.0;
    const mates = this.pl[team].filter(p => type === 'goalkick' ? p.gk : !p.gk);
    const taker = mates.sort((a, c) => dist(a, b) - dist(c, b))[0] || this.pl[team][0];
    const ad = this.atkDir(team);
    this.restart = { type, team, taker, x, y, t: 0, auto: type === 'throw' ? 1.6 : 1.8 };
    taker.x = x - (type === 'throw' ? 0 : ad * 5); taker.y = y + (type === 'throw' ? (y < F.CY ? -8 : 8) : 0); taker.vx = taker.vy = 0; taker.state = 'move'; taker.cd = 0;
    taker.fx = type === 'throw' ? 0 : ad; taker.fy = type === 'throw' ? (y < F.CY ? 1 : -1) : 0;
    if (type === 'throw') { taker.y = y < F.CY ? F.T - 8 : F.B + 8; }
    if (this.userTeam >= 0 && team === this.userTeam && !taker.gk) this.ctrl = taker;
    else if (this.userTeam >= 0) { const c = this.pl[this.userTeam].filter(p => !p.gk).sort((a, c2) => dist(a, b) - dist(c2, b))[0]; this.ctrl = c; }
  }
  deadStep(dt, inp) {
    const r = this.restart, b = this.ball; if (!r) { this.phase = 'play'; return; }
    r.t += dt;
    // pemain lain bergerak ke formasi; lawan menjauh dari bola
    this.all.forEach(p => {
      if (p === r.taker) { p.dx = p.dy = 0; return; }
      if (p !== this.ctrl) this.restartPositions(p, r);
      else { p.dx = inp.mx || 0; p.dy = inp.my || 0; p.sprint = false; }
    });
    this.all.forEach(p => { this.moveStep(p, dt); this.animate(p, dt); });
    // lawan tak boleh dekat bola
    this.pl[1 - r.team].forEach(p => { const d = dist(p, b); if (d < 60 && d > 0.1) { p.x += (p.x - b.x) / d * (60 - d) * 0.2; p.y += (p.y - b.y) / d * (60 - d) * 0.2; } });
    this.ball.x = r.x; this.ball.y = r.type === 'throw' ? (r.y < F.CY ? F.T - 3 : F.B + 3) : r.y;
    if (this.phT <= 0) {
      if (!r.started) { r.started = true; this.give(r.taker); this.restartHold = 0; }
    }
    if (r.started) {
      this.phase = 'play'; // lanjut permainan; taker auto-main (AI) atau dikontrol user
      r.taker.holdT = 0; this.autoRestart = r;
    }
  }
  restartPositions(p, r) {
    const [hx, hy] = this.homePos(p); const b = this.ball;
    let tx = hx + (b.x - hx) * (p.team === r.team ? 0.4 : 0.3), ty = hy + (b.y - hy) * 0.25;
    if (p.gk) { tx = this.goalX(p.team) + this.atkDir(p.team) * 12; ty = F.CY; }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    p.dx = d > 6 ? dx / d : 0; p.dy = d > 6 ? dy / d : 0; p.sprint = d > 80;
  }
  endHalf() {
    if (this.phase === 'full' || this.phase === 'halftime') return;
    this.sfx('SFX_Whistle'); this.sfx('SFX_Whistle', 0.6);
    this.all.forEach(p => { p.vx = p.vy = 0; p.dx = p.dy = 0; });
    if (this.half === 1 && !this.extra) { this.phase = 'halftime'; this.phT = 2.2; this.msg('Babak pertama selesai', G.C.cream, 2.2); this.halfDone = 1; }
    else if (this.extra) { this.finish(); }
    else { // akhir babak 2
      if (this.score[0] === this.score[1] && this.knockout) { this.phase = 'full'; this.finishDraw = true; this.over = true; this.result = 'draw'; }
      else this.finish();
    }
  }
  startSecondHalf() { this.half = 2; this.clock = 0; this.placeKickoff(1); }
  finish() { this.phase = 'full'; this.over = true; this.result = this.score[0] > this.score[1] ? 'home' : this.score[0] < this.score[1] ? 'away' : 'draw'; this.sfx('SFX_Whistle'); this.all.forEach(p => { p.state = 'move'; }); }
  /* hasil penalti dari scene penalti */
  penaltyResult(goal) {
    const r = this.penReq; this.penReq = null; if (!r) return;
    const team = r.team, b = this.ball;
    if (goal) { r.shooter.stat.goals++; this.score[team]++; this.stat[team].shots++; this.stat[team].sot++; this.goals.push({ team, name: r.shooter.d.name, min: this.minute() + 1, pen: true, pl: r.shooter }); this.lastScoringTeam = team; this.goalSide = team === 0 ? 1 : -1; this.phase = 'goal'; this.phT = 2.6; this.netT = 0; this.msg('GOOOL! ' + r.shooter.d.name, G.C.gold, 2.6); this.sfx('SFX_Goal'); this.sfx('SFX_Crowd_Cheer', 0.9); b.reset(this.goalSide > 0 ? F.R + 10 : F.L - 10, F.CY); this.celeb = null; }
    else { this.stat[team].shots++; this.stat[team].sot++; const def = 1 - team; this.stat[def].saves++; this.msg('Penalti gagal!', G.C.cream, 1.6); this.setRestart('goalkick', def, def === 0 ? F.L + 44 : F.R - 44, F.CY); }
  }

  /* ---------- AI ---------- */
  ai(p, dt) {
    if (this.phase !== 'play') return;
    const st = p.state; if (st === 'kick' || st === 'tackle' || st === 'fall' || st === 'dive' || st === 'celebrate') { p.dx = p.dy = 0; if (p.gk && st === 'dive') this.gkDiveMove(p, dt); return; }
    if (p.gk) return this.gkAI(p, dt);
    const b = this.ball, ad = this.atkDir(p.team);
    if (b.owner === p) return this.carrierAI(p, dt);
    const owner = b.owner, mates = this.pl[p.team], opps = this.pl[1 - p.team];
    const skill = this.teams[p.team].skill === undefined ? 0.6 : this.teams[p.team].skill;
    let tx, ty, spr = false;
    const [hx, hy] = this.homePos(p), grp = D.GROUP[p.slotPos];
    if (p.runTo && p.runTo.t > 0) { p.runTo.t -= dt; tx = p.runTo.x; ty = p.runTo.y; spr = true; if (dist(p, p.runTo) < 8) p.runTo = null; }
    else if (!owner && b.recv === p) { const t = Math.min(0.6, dist(p, b) / 150); tx = b.x + b.vx * t; ty = b.y + b.vy * t; spr = dist(p, b) > 30; }
    else if (!owner) {
      // bola lepas: dua terdekat mengejar
      const ranked = mates.filter(q => !q.gk && q.state !== 'fall').sort((a, c) => dist(a, b) - dist(c, b));
      const rk = ranked.indexOf(p);
      const lim = this.restartAuto ? 1 : 2;
      if (rk >= 0 && rk < lim && this.gkSafe(p, b)) {
        const t = Math.min(0.6, dist(p, b) / 240); tx = b.x + b.vx * t; ty = b.y + b.vy * t; spr = dist(p, b) > 40;
        if (b.recv && b.recv.team !== p.team && b.recv !== p && dist(b.recv, b) < dist(p, b) - 12) { tx = hx; ty = hy; spr = false; }
      } else { [tx, ty] = this.shapeTarget(p, false); }
    } else if (owner.team !== p.team) {
      // bertahan
      const ranked = mates.filter(q => !q.gk && q.state !== 'fall').sort((a, c) => dist(a, owner) - dist(c, owner));
      const rk = ranked.indexOf(p); const press = (rk === 0) || (rk === 1 && dist(p, owner) < 150 + skill * 60);
      if (owner.gk) { const dd = dist(p, owner); const [sx, sy] = this.shapeTarget(p, false); tx = sx; ty = sy; if (dd < 70) { tx = p.x + (p.x - owner.x) / (dd || 1) * 30; ty = p.y + (p.y - owner.y) / (dd || 1) * 30; } }
      else if (press && !(this.restart && this.restart.protect)) {
        const own = this.goalX(p.team), gdx = own - owner.x, gdy = F.CY - owner.y, gl = Math.hypot(gdx, gdy) || 1;
        const lead = rk === 0 ? 4 : 18; tx = owner.x + owner.vx * 0.25 + gdx / gl * lead; ty = owner.y + owner.vy * 0.25 + gdy / gl * lead * 0.5; spr = dist(p, owner) > 45 && p.stamina > 30;
        const dd = dist(p, owner);
        if (dd < 24 && p.tcd <= 0 && p.aiT <= 0) {
          p.aiT = G.rnd(0.6, 1.3) * (1.4 - skill * 0.5);
          const front = (owner.x - p.x) * p.fx + (owner.y - p.y) * p.fy;
          if (Math.random() < 0.18 + skill * 0.3 && front > -4) this.startTackle(p, owner.x - p.x, owner.y - p.y);
        }
      } else { [tx, ty] = this.shapeTarget(p, false, true); }
    } else {
      // tim menguasai bola
      [tx, ty] = this.shapeTarget(p, true);
    }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    const sk = this.teams[p.team].skill === undefined ? 0.6 : this.teams[p.team].skill;
    const sf = p.team === this.userTeam ? 1 : (0.9 + sk * 0.12) * (this.diff || 1);
    p.dx = d > 4 ? dx / d * Math.min(1, d / 14) * sf : 0; p.dy = d > 4 ? dy / d * Math.min(1, d / 14) * sf : 0;
    p.sprint = spr && d > 20 && p.stamina > 22;
  }
  gkSafe(p, b) { return true; }
  shapeTarget(p, attacking, marking) {
    const b = this.ball, ad = this.atkDir(p.team), grp = D.GROUP[p.slotPos]; let [hx, hy] = this.homePos(p);
    const wx = attacking ? { DEF: 0.28, MID: 0.42, ATT: 0.55 }[grp] : { DEF: 0.38, MID: 0.45, ATT: 0.32 }[grp];
    let x = hx + (b.x - hx) * wx + (attacking ? ad * { DEF: 45, MID: 80, ATT: 120 }[grp] : 0);
    let y = hy + (b.y - hy) * (attacking ? 0.22 : 0.3);
    if (marking) {
      const opps = this.pl[1 - p.team].filter(o => !o.gk); let near = null, nd = 110;
      opps.forEach(o => { const d = Math.hypot(o.x - hx, o.y - hy); if (d < nd) { nd = d; near = o; } });
      if (near) { const own = this.goalX(p.team); x = x * 0.4 + (near.x + (own - near.x) * 0.15) * 0.6; y = y * 0.4 + near.y * 0.6; }
    }
    if (attacking && (grp === 'ATT' || grp === 'MID') && b.owner) {
      // cari ruang: jauhkan dari rekan terdekat
      this.pl[p.team].forEach(q => { if (q !== p && !q.gk) { const d = Math.hypot(q.x - x, q.y - y); if (d < 38 && d > 0.1) { x += (x - q.x) / d * (38 - d) * 0.6; y += (y - q.y) / d * (38 - d) * 0.6; } } });
    }
    // jangan melewati garis tengah terlalu jauh saat bertahan (pemain bertahan)
    if (!attacking && grp === 'DEF') { const lim = F.CX + ad * 70; x = ad > 0 ? Math.min(x, lim) : Math.max(x, lim); }
    return [G.clamp(x, F.L + 8, F.R - 8), G.clamp(y, F.T + 8, F.B - 8)];
  }
  carrierAI(p, dt) {
    const b = this.ball, ad = this.atkDir(p.team), gx = ad > 0 ? F.R : F.L, opps = this.pl[1 - p.team];
    p.holdT += dt;
    const dGoal = Math.hypot(gx - p.x, F.CY - p.y);
    let nearest = 999, nd = null; opps.forEach(o => { const d = dist(o, p); if (d < nearest) { nearest = d; nd = o; } });
    const skill = this.teams[p.team].skill === undefined ? 0.6 : this.teams[p.team].skill;
    // default: dribel ke gawang
    let tx = gx - ad * 20, ty = F.CY + (p.y - F.CY) * 0.5;
    if (nd && nearest < 46) { const rx = p.x - nd.x, ry = p.y - nd.y, l = Math.hypot(rx, ry) || 1; tx += rx / l * 70; ty += ry / l * 70; }
    const mates = this.pl[p.team];
    // restart otomatis / kiper
    const userHolding = p === this.ctrl;
    if (p.aiT <= 0 && (!userHolding)) {
      p.aiT = 0.16 + Math.random() * 0.1;
      const inZone = Math.abs(gx - p.x) < 360 && Math.abs(p.y - F.CY) < 210 && (gx - p.x) * ad > 10;
      const pressure = nearest < 30;
      let shootP = 0; if (inZone) shootP = dGoal < 200 ? 0.38 : dGoal < 290 ? 0.16 : 0.06; if (pressure) shootP *= 1.5; shootP *= (0.6 + skill * 0.6);
      if (p.holdT > 0.35 && inZone && Math.random() < shootP * 0.7 && !this.shotBlocked(p, gx)) { this.shoot(p, G.rnd(0.6, 1), null, null); return; }
      // umpan
      const opt = this.bestPass(p);
      const advanced = opt && ((opt.t.x - p.x) * ad > 50);
      let passP = 0; if (pressure) passP = 0.55; if (p.holdT > 1.4) passP = Math.max(passP, 0.5); if (nearest < 18) passP = 0.9; if (advanced && opt.s > 50 && p.holdT > 0.5) passP = Math.max(passP, 0.2);
      if (p.holdT < 0.25) passP = 0;
      if (opt && Math.random() < passP && opt.s > -15) {
        const t = opt.t, tt = dist(p, t) / 210;
        if (advanced && (t.x - p.x) * ad > 110 && Math.random() < 0.35) { const lead = 60; this.doPass(p, G.clamp(t.x + ad * lead, F.L + 8, F.R - 8), t.y, t, { through: true }); }
        else this.doPass(p, t.x + t.vx * tt * 0.6, t.y + t.vy * tt * 0.6, t, {});
        return;
      }
      // tekel balik kalau terdesak & dekat
    }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
    p.dx = dx / d; p.dy = dy / d; p.sprint = d > 80 && (nearest > 40) && p.stamina > 30;
  }
  shotBlocked(p, gx) { return false; }
  bestPass(p) {
    const ad = this.atkDir(p.team); let best = null, bs = -999; const opps = this.pl[1 - p.team];
    this.pl[p.team].forEach(t => {
      if (t === p || (t.gk && p.x * ad > 0 && false)) return; if (t.gk && (p.x - this.goalX(p.team)) * ad > 260) return;
      const d = dist(p, t); if (d < 50 || d > 520) return;
      let s = (t.x - p.x) * ad * 0.9 - d * 0.08;
      let open = 60; opps.forEach(o => { const dd = dist(o, t); if (dd < open) open = dd; }); s += open * 0.6;
      if (this.laneBlocked(p, t)) s -= 40; const grp = D.GROUP[t.slotPos]; if (grp === 'ATT') s += 6;
      if (t.gk) s -= 30;
      if (s > bs) { bs = s; best = t; }
    });
    return best ? { t: best, s: bs } : null;
  }
  /* ---------- Kiper ---------- */
  gkAI(p, dt) {
    const b = this.ball, ad = this.atkDir(p.team), gline = this.goalX(p.team);
    if (b.owner === p) {
      p.dx = p.dy = 0; p.holdT += dt;
      if (p.holdT > 1.0 && p !== this.ctrl) {
        const opt = this.bestPass(p);
        if (opt) { this.doPass(p, opt.t.x, opt.t.y, opt.t, { lob: dist(p, opt.t) > 300 }); }
        else this.doPass(p, p.x + ad * 150, p.y + G.rnd(-60, 60), null, {});
      }
      return;
    }
    // ancaman tembakan
    const owner = b.owner;
    let threat = null;
    if (!owner && b.shot && b.lastTeam !== p.team && b.vx * (-ad) > 60) {
      const t = (gline - b.x) / b.vx; if (t > 0 && t < 2.4) { const yy = b.y + b.vy * t * 0.85; if (yy > F.GY0 - 40 && yy < F.GY1 + 40) threat = { y: yy, t }; }
    }
    if (threat && p.gkDelay < 0 && p.state === 'move') {
      const reflex = p.s('Reflex') + (p.has('Last Hope') && b.lastPl && Math.abs(b.lastPl.x - p.x) < 130 ? 12 : 0);
      p.gkDelay = Math.max(0.03, 0.2 - reflex * 0.0016) * (p.team === this.userTeam ? 1 : (1.2 - (this.teams[p.team].skill || 0.5) * 0.4)); p.gkY = threat.y; p.gkSp = (150 + p.s('Diving') * 1.55 + reflex * 0.4) * 1.6; p.gkT = threat.t;
    }
    if (p.gkDelay >= 0) {
      p.gkDelay -= dt;
      if (p.gkDelay <= 0) {
        const dy = p.gkY - p.y;
        if (Math.abs(dy) > 24) { p.state = 'dive'; p.stT = 0.75; p.diveDir = dy < 0 ? -1 : 1; p.diveT = 0; p.animKind = 'dive'; p.at = 0; this.sfx('SFX_Tackle', 0.25); }
        p.gkDelay = -1; p.gkMove = 0.4;
      }
    }
    if (p.state !== 'dive') {
      if (p.gkMove > 0 && threat) { p.gkMove -= dt; p.dx = 0; p.dy = G.clamp((p.gkY - p.y) / 6, -1, 1); p.sprint = true; return; }
      // posisi: busur antara bola dan gawang
      const ballD = Math.hypot(b.x - gline, b.y - F.CY) || 1, out = G.clamp(ballD * 0.1, 10, 64);
      const vx = (b.x - gline) / ballD, vy = (b.y - F.CY) / ballD;
      let tx = gline + vx * out * 0.9 * 1 + ad * 8, ty = G.clamp(F.CY + vy * out * 1.6 + (b.y - F.CY) * 0.08, F.GY0 + 4, F.GY1 - 4);
      // bola lepas & lambat di kotak: keluar ambil
      const inBox = Math.abs(b.x - gline) < F.BOXW && b.y > F.BY0 && b.y < F.BY1;
      if (!owner && inBox && b.speed() < 110 && !b.shot) {
        const nearest = this.all.filter(q => !q.gk || q === p).sort((a, c) => dist(a, b) - dist(c, b))[0];
        if (nearest === p || dist(p, b) < dist(nearest, b) + 14) { tx = b.x; ty = b.y; }
      }
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      p.dx = d > 3 ? dx / d * Math.min(1, d / 10) : 0; p.dy = d > 3 ? dy / d * Math.min(1, d / 10) : 0; p.sprint = d > 60;
    }
  }
  gkDiveMove(p, dt) {
    p.diveT += dt; const sp = p.gkSp || 220;
    const dy = p.gkY - p.y; const move = Math.sign(dy) * Math.min(Math.abs(dy), sp * dt * (p.diveT < 0.35 ? 1 : 0.2));
    p.y += move; p.vy = move / dt; p.vx = 0; p.x = G.clamp(p.x, this.goalX(p.team) - 6, this.goalX(p.team) + 90);
  }
}
W.Match = Match; W.Ball = Ball; W.Pl = Pl;
Match.prototype.sfx = function (n, v) { if (this.silent) return; G.audio.sfx(n, v); };
Match.prototype.restartAuto = null;

/* ----- Auto-main pada restart oleh AI atau user idle ----- */
const _step = Match.prototype.playStep;
Match.prototype.playStep = function (dt, inp) {
  const r = this.autoRestart;
  if (r) {
    r.auto -= dt; const b = this.ball;
    if (b.owner !== r.taker || r.auto <= -20) { this.autoRestart = null; }
    else {
      r.taker.dx = 0; r.taker.dy = 0;
      const isUser = r.taker === this.ctrl;
      if (r.auto <= 0 && (!isUser || r.auto < -0.2)) {
        const opt = this.bestPass(r.taker);
        if (isUser && r.auto > -0.2) { /* tunggu */ }
        else {
          if (r.type === 'corner' && opt) this.doPass(r.taker, opt.t.x, opt.t.y, opt.t, { lob: true });
          else if (opt) this.doPass(r.taker, opt.t.x, opt.t.y, opt.t, {});
          else this.doPass(r.taker, r.taker.x + this.atkDir(r.team) * 100, r.taker.y, null, {});
          this.autoRestart = null;
        }
      }
    }
  }
  _step.call(this, dt, inp);
  if (this.autoRestart && this.ball.owner !== this.autoRestart.taker) this.autoRestart = null;
};

/* ---------- gambar ---------- */
Match.prototype.draw = function (g, dt, stadium) {
  const vw = G.LW, vh = G.LH, cx = G.clamp(Math.round(this.cam.x / 2) * 2, 0, F.WW - vw), cy = G.clamp(Math.round(this.cam.y / 2) * 2, 0, F.WH - vh);
  g.drawImage(G.$(stadium || 'Environment/Stadium/Stadium_Day.png'), cx / 2, cy / 2, vw / 2, vh / 2, 0, 0, vw, vh);
  g.save(); g.translate(-cx, -cy); this.camR = { x: cx, y: cy };
  // jaring gawang saat gol
  if (this.phase === 'goal' || this.netT > 0 && this.phase === 'goal') {
    const side = this.goalSide, im = G.$(side > 0 ? 'Environment/Goals/Goal_Right_NetAnim_4f.png' : 'Environment/Goals/Goal_Left_NetAnim_4f.png');
    const fr = Math.min(3, Math.floor(this.netT * 8)); g.drawImage(im, fr * 30, 0, 30, 86, side > 0 ? F.R - 6 : F.L - 54, F.CY - 86, 60, 172);
  }
  const list = this.all.slice().sort((a, b) => a.y - b.y); const b = this.ball;
  // bayangan
  const sh = G.$('Objects/Football/Player_Shadow.png');
  this.all.forEach(p => { if (p.state === 'dive') return; g.drawImage(sh, Math.round(p.x - 9), Math.round(p.y - 4)); });
  const bsh = G.$('Objects/Football/Football_Shadow.png'); g.drawImage(bsh, Math.round(b.x - 5), Math.round(b.y - 1 + (b.owner ? 0 : 0)));
  // glow pemain kontrol
  if (this.ctrl && this.userTeam >= 0 && this.phase !== 'full') { const gl = G.$('VFX/Player_Selection_Glow_4f_36x18.png'); const f = Math.floor(G.time * 8) % 4; g.drawImage(gl, f * 36, 0, 36, 18, Math.round(this.ctrl.x - 18), Math.round(this.ctrl.y - 9), 36, 18); }
  let ballDrawn = false;
  const drawBall = () => {
    ballDrawn = true;
    const fast = b.speed() > 60 || (b.owner && Math.hypot(b.owner.vx, b.owner.vy) > 30);
    if (fast) { const sp = G.$('Objects/Football/Football_8x8_Spin_4f.png'), f = Math.floor(b.rot) & 3; g.drawImage(sp, (Math.abs(f) % 4) * 10, 0, 10, 10, Math.round(b.x - 5), Math.round(b.y - b.z - 8), 10, 10); }
    else g.drawImage(G.$('Objects/Football/Football_8x8.png'), Math.round(b.x - 4), Math.round(b.y - b.z - 7));
  };
  list.forEach(p => {
    if (!ballDrawn && b.y < p.y && !(b.owner && b.owner === p)) drawBall();
    this.drawPlayer(g, p);
    if (b.owner === p) { drawBall(); }
  });
  if (!ballDrawn) drawBall();
  // indikator pemain aktif
  if (this.ctrl && this.userTeam >= 0 && this.phase !== 'full') { const ai = G.$('UI/Gameplay_HUD/active_player_indicator.png'); g.drawImage(ai, Math.round(this.ctrl.x - 6), Math.round(this.ctrl.y - 42 + Math.sin(G.time * 8) * 2)); }
  W.vfxDraw(g, this.fx, dt || 0.016);
  g.restore();
};
Match.prototype.drawPlayer = function (g, p) {
  let key = p.animKey || 'idle_down', row, frames, fps, loop, rot = 0, nm = key;
  const L = p.lay;
  if (p.gk && p.state === 'dive') {
    nm = p.diveDir < 0 ? 'GK_dive_left' : 'GK_dive_right'; rot = Math.PI / 2;
    const r = L[nm]; const fr = Math.min(r.frames - 1, Math.floor(p.at * r.fps)); W.drawSprite(g, p.img, r.row, fr, p.x, p.y, { rot }); return;
  }
  if (p.gk) {
    if (key === 'get_up') nm = 'GK_get_up'; else if (key === 'celebrate') nm = 'GK_celebrate'; else if (key.startsWith('pass') || key.startsWith('shoot')) nm = 'GK_kick_' + (p.dir === 'left' ? 'left' : 'right'); else if (key.startsWith('dribble') || key.startsWith('run') || key.startsWith('sprint') || key.startsWith('walk')) nm = 'GK_move_' + p.dir; else if (key.startsWith('receive') || key.startsWith('tackle')) nm = 'GK_idle_' + p.dir; else if (key === 'fall') nm = 'GK_get_up'; else nm = 'GK_' + key;
  } else {
    if (key === 'get_up') nm = 'fall';
  }
  const r = L[nm] || L[p.gk ? 'GK_idle_down' : 'idle_down'];
  const fr = r.loop ? Math.floor(p.at * r.fps) % r.frames : Math.min(r.frames - 1, Math.floor(p.at * r.fps));
  W.drawSprite(g, p.img, r.row, fr, p.x, p.y, {});
  if (!p.gk && p.stamina < 25 && this.phase === 'play' && p.team === this.userTeam && p === this.ctrl) { /* indikator lelah */ }
};
