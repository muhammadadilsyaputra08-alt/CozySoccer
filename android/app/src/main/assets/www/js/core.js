'use strict';
/* Cozy Pixel Soccer - core engine: canvas, scenes, input, text, UI primitives, audio, loader */
const G = window.G = {};
G.C = { cream: '#ffeccd', dark: '#2a1a0e', maroon: '#390c14', gold: '#ffbc30', green: '#8a9c73', rust: '#c64e2c',
  sage: '#677a5d', white: '#ffffff', wood: '#71441c', red: '#e0583a', blue: '#4a8aa5', grey: '#9aa08a' };
G.LH = 384; G.LW = 640;
G.img = {}; G.json = {}; G.abuf = {};
G.keys = {}; G.keyHit = {};
G.ptrs = new Map(); G.taps = [];
G.time = 0;
G.scenes = {}; G.stack = []; G.pending = null; G.fade = { a: 0, dir: 0, op: null };

/* ---------- util ---------- */
G.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
G.lerp = (a, b, t) => a + (b - a) * t;
G.rnd = (a, b) => a + Math.random() * (b - a);
G.rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.dist = (a, b, c, d) => Math.hypot(c - a, d - b);
G.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
G.fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
G.$ = p => G.img[p] || G.img['__missing'];
G.ic = n => G.$('Icons/' + n + '.png');

/* ---------- canvas ---------- */
G.init = function () {
  G.canvas = document.getElementById('c');
  G.sctx = G.canvas.getContext('2d');
  G.off = document.createElement('canvas');
  G.g = G.off.getContext('2d');
  const m = document.createElement('canvas'); m.width = m.height = 1; G.img['__missing'] = m;
  addEventListener('resize', G.resize);
  addEventListener('orientationchange', () => setTimeout(G.resize, 200));
  G.resize();
  const el = G.canvas;
  el.addEventListener('pointerdown', G._pd, { passive: false });
  el.addEventListener('pointermove', G._pm, { passive: false });
  el.addEventListener('pointerup', G._pu, { passive: false });
  el.addEventListener('pointercancel', G._pu, { passive: false });
  el.addEventListener('wheel', e => { G.wheel = (G.wheel || 0) + e.deltaY; e.preventDefault(); }, { passive: false });
  el.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    if (e.repeat) return;
    G.keys[e.code] = true; G.keyHit[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    G.audio.resume();
  });
  addEventListener('keyup', e => { G.keys[e.code] = false; });
  addEventListener('blur', () => { G.keys = {}; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { const s = G.top(); if (s && s.onHide) s.onHide(); G.audio.suspend(); } else G.audio.resume(); });
};

G.resize = function () {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = window.innerWidth, ch = window.innerHeight;
  G.LH = 384;
  G.LW = Math.round(G.clamp(G.LH * cw / ch, 640, 900));
  G.canvas.width = Math.floor(cw * dpr); G.canvas.height = Math.floor(ch * dpr);
  G.canvas.style.width = cw + 'px'; G.canvas.style.height = ch + 'px';
  G.off.width = G.LW; G.off.height = G.LH;
  G.scale = Math.min(G.canvas.width / G.LW, G.canvas.height / G.LH);
  G.ox = Math.floor((G.canvas.width - G.LW * G.scale) / 2);
  G.oy = Math.floor((G.canvas.height - G.LH * G.scale) / 2);
  G.sctx.imageSmoothingEnabled = false; G.g.imageSmoothingEnabled = false;
  G.wx = Math.floor((G.LW - 640) / 2); // offset dunia 640x384 di tengah
};

/* ---------- pointer ---------- */
G._pos = e => {
  const r = G.canvas.getBoundingClientRect();
  const sx = G.canvas.width / r.width, sy = G.canvas.height / r.height;
  return { x: ((e.clientX - r.left) * sx - G.ox) / G.scale, y: ((e.clientY - r.top) * sy - G.oy) / G.scale };
};
G._pd = e => {
  e.preventDefault(); G.audio.resume();
  try { G.canvas.setPointerCapture(e.pointerId); } catch (_) { }
  const p = G._pos(e);
  const o = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, px: p.x, py: p.y, t0: performance.now(), moved: false, dx: 0, dy: 0, down: true };
  G.ptrs.set(e.pointerId, o);
  const s = G.top(); if (s && s.pointerDown) s.pointerDown(o);
};
G._pm = e => {
  const o = G.ptrs.get(e.pointerId); if (!o) return;
  e.preventDefault();
  const p = G._pos(e);
  o.dx += p.x - o.x; o.dy += p.y - o.y; o.x = p.x; o.y = p.y;
  if (Math.hypot(o.x - o.sx, o.y - o.sy) > 8) o.moved = true;
  const s = G.top(); if (s && s.pointerMove) s.pointerMove(o);
};
G._pu = e => {
  const o = G.ptrs.get(e.pointerId); if (!o) return;
  e.preventDefault();
  const p = G._pos(e); o.x = p.x; o.y = p.y; o.down = false;
  if (!o.moved && performance.now() - o.t0 < 700) G.taps.push({ x: o.x, y: o.y });
  const s = G.top(); if (s && s.pointerUp) s.pointerUp(o);
  G.ptrs.delete(e.pointerId);
};
G.pointerIn = (x, y, w, h) => { for (const o of G.ptrs.values()) if (o.sx >= x && o.sx <= x + w && o.sy >= y && o.sy <= y + h && o.x >= x - 6 && o.x <= x + w + 6 && o.y >= y - 6 && o.y <= y + h + 6) return o; return null; };

/* ---------- scenes ---------- */
G.top = () => G.stack.length ? G.stack[G.stack.length - 1].scene : null;
G.go = (name, params) => { G.pending = { t: 'go', name, params }; };
G.push = (name, params, cb) => { G.pending = { t: 'push', name, params, cb }; };
G.pop = result => { G.pending = { t: 'pop', result }; };
G._apply = function (op) {
  const st = G.stack;
  const leave = () => { const t = st.pop(); if (t && t.scene.exit) t.scene.exit(); return t; };
  if (op.t === 'go') { while (st.length) leave(); const sc = G.scenes[op.name]; st.push({ name: op.name, scene: sc }); sc.enter && sc.enter(op.params || {}); }
  else if (op.t === 'push') { const sc = G.scenes[op.name]; const prev = G.top(); if (prev && prev.pause) prev.pause(); st.push({ name: op.name, scene: sc, cb: op.cb }); sc.enter && sc.enter(op.params || {}); }
  else if (op.t === 'pop') { const t = leave(); const prev = G.top(); if (prev && prev.resume) prev.resume(); if (t && t.cb) t.cb(op.result); }
  G.taps.length = 0; G.keyHit = {};
};
G.back = function () { const s = G.top(); if (s && s.onBack) s.onBack(); };

/* ---------- loop ---------- */
G.start = function () {
  let last = performance.now();
  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; G.time += dt;
    G.tick(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};
G.tick = function (dt) {
  const f = G.fade;
  if (G.pending && !f.op) { f.op = G.pending; G.pending = null; f.dir = 1; }
  if (f.dir === 1) { f.a += dt / 0.12; if (f.a >= 1) { f.a = 1; G._apply(f.op); f.op = null; f.dir = -1; } }
  else if (f.dir === -1) { f.a -= dt / 0.12; if (f.a <= 0) { f.a = 0; f.dir = 0; } }
  const s = G.top();
  const g = G.g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#1c0a0e'; g.fillRect(0, 0, G.LW, G.LH);
  if (s) {
    if (f.dir !== 1 || f.a < 1) {
      if (!f.op) s.update && s.update(dt);
      // overlay: gambar scene di bawahnya dulu
      let i = G.stack.length - 1; while (i > 0 && G.stack[i].scene.overlay) i--;
      for (; i < G.stack.length; i++) G.stack[i].scene.draw(g);
    }
  }
  if (f.a > 0) { g.fillStyle = 'rgba(28,10,14,' + f.a + ')'; g.fillRect(0, 0, G.LW, G.LH); }
  G.taps.length = 0; G.keyHit = {}; G.wheel = 0;
  for (const o of G.ptrs.values()) { o.dx = 0; o.dy = 0; }
  const sc = G.sctx; sc.setTransform(1, 0, 0, 1, 0, 0); sc.imageSmoothingEnabled = false;
  sc.fillStyle = '#1c0a0e'; sc.fillRect(0, 0, G.canvas.width, G.canvas.height);
  sc.drawImage(G.off, 0, 0, G.LW, G.LH, G.ox, G.oy, Math.round(G.LW * G.scale), Math.round(G.LH * G.scale));
};

/* ---------- font ---------- */
G.tintCache = {};
G.tinted = function (col) {
  if (G.tintCache[col]) return G.tintCache[col];
  const a = G.img['Branding/font_atlas.png'];
  const c = document.createElement('canvas'); c.width = a.width; c.height = a.height;
  const x = c.getContext('2d'); x.drawImage(a, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return G.tintCache[col] = c;
};
G.textW = function (s, sc) {
  const f = G.json['Branding/font_atlas.json']; sc = sc || 1; let w = 0;
  for (const ch of String(s)) w += (f.adv[ch] || f.adv['?']) ;
  return w * sc;
};
G.text = function (s, x, y, o) {
  o = o || {}; const g = o.g || G.g, f = G.json['Branding/font_atlas.json'], sc = o.s || 1;
  s = String(s); const w = G.textW(s, sc);
  if (o.a === 'c') x -= w / 2; else if (o.a === 'r') x -= w;
  x = Math.round(x); y = Math.round(y);
  const draw = (col, ox, oy) => {
    const t = G.tinted(col); let cx = x + ox;
    for (const ch of s) {
      let code = ch.charCodeAt(0); if (code < 32 || code > 126) code = 63;
      const i = code - f.first, sx = (i % f.cols) * f.cw, sy = Math.floor(i / f.cols) * f.ch;
      g.drawImage(t, sx, sy, f.cw, f.ch, cx - f.ox * sc, y + oy, f.cw * sc, f.ch * sc);
      cx += (f.adv[ch] || f.adv['?']) * sc;
    }
  };
  if (o.sh !== false) draw(o.shc || G.C.maroon, sc, sc);
  draw(o.c || G.C.cream, 0, 0);
  return w;
};
G.wrap = function (s, maxW, sc) {
  const words = String(s).split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (G.textW(t, sc) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
};

/* ---------- gambar ---------- */
G.draw = function (img, x, y, w, h, o) {
  const g = (o && o.g) || G.g; if (typeof img === 'string') img = G.$(img);
  g.drawImage(img, Math.round(x), Math.round(y), w === undefined ? img.width : w, h === undefined ? img.height : h);
};
G.nine = function (img, x, y, w, h, b, g) {
  g = g || G.g; if (typeof img === 'string') img = G.$(img);
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const iw = img.width, ih = img.height, mw = iw - 2 * b, mh = ih - 2 * b, cw = w - 2 * b, ch = h - 2 * b;
  g.drawImage(img, 0, 0, b, b, x, y, b, b); g.drawImage(img, iw - b, 0, b, b, x + w - b, y, b, b);
  g.drawImage(img, 0, ih - b, b, b, x, y + h - b, b, b); g.drawImage(img, iw - b, ih - b, b, b, x + w - b, y + h - b, b, b);
  g.drawImage(img, b, 0, mw, b, x + b, y, cw, b); g.drawImage(img, b, ih - b, mw, b, x + b, y + h - b, cw, b);
  g.drawImage(img, 0, b, b, mh, x, y + b, b, ch); g.drawImage(img, iw - b, b, b, mh, x + w - b, y + b, b, ch);
  g.drawImage(img, b, b, mw, mh, x + b, y + b, cw, ch);
};
G.panel = (kind, x, y, w, h) => G.nine('UI/Common/panel_' + kind + '_9slice.png', x, y, w, h, 6);
G.frame = (x, y, w, h) => G.nine('UI/Common/window_9slice.png', x, y, w, h, 6);

/* latar menu: ilustrasi 2x, tepi diperluas */
G.backdrop = function (name) {
  const g = G.g, im = G.$(name || 'Branding/Background_Illustration_320x180.png');
  const dw = im.width * 2, dh = im.height * 2, x0 = Math.floor((G.LW - dw) / 2), y0 = G.LH - dh;
  g.drawImage(im, 0, 0, 1, im.height, 0, y0, Math.max(0, x0) + 1, dh);
  g.drawImage(im, im.width - 1, 0, 1, im.height, x0 + dw - 1, y0, G.LW - (x0 + dw) + 2, dh);
  if (y0 > 0) { g.drawImage(im, 0, 0, im.width, 1, x0, 0, dw, y0 + 1); }
  g.drawImage(im, 0, 0, im.width, im.height, x0, y0, dw, dh);
};

/* ---------- UI immediate mode ---------- */
const UI = G.UI = { lock: false };
UI.tap = (x, y, w, h) => {
  if (UI.lock) return false;
  for (let i = 0; i < G.taps.length; i++) { const t = G.taps[i]; if (t.x >= x && t.x <= x + w && t.y >= y && t.y <= y + h) { G.taps.splice(i, 1); G.audio.sfx('SFX_Button_Click', 0.7); return true; } }
  return false;
};
UI.held = (x, y, w, h) => !UI.lock && !!G.pointerIn(x, y, w, h);
/* tombol gambar (sprite) skala s */
UI.sprite = function (path, x, y, s, pressedPath) {
  s = s || 1; const im = G.$(path), w = im.width * s, h = im.height * s;
  const held = UI.held(x, y, w, h);
  const use = held && pressedPath ? G.$(pressedPath) : im;
  G.draw(use, x, y + (held && !pressedPath ? 1 : 0), w, h);
  return UI.tap(x, y, w, h);
};
/* tombol 9-slice dengan label */
UI.button = function (label, x, y, w, h, o) {
  o = o || {}; const kind = o.kind || 'button_normal'; const dis = o.disabled;
  const held = !dis && UI.held(x, y, w, h);
  const nm = dis ? (kind.startsWith('button_green') ? 'button_green_disabled' : 'button_disabled') : (held ? (kind.startsWith('button_green') ? 'button_green_pressed' : 'button_pressed') : kind);
  G.nine('UI/Common/' + nm + '_9slice.png', x, y, w, h, 5);
  const ty = y + Math.round((h - 10) / 2) + (held ? 1 : 0);
  if (o.icon) {
    const iw = 16, tw = G.textW(label, o.s || 1), tot = iw + 3 + tw, sx = x + (w - tot) / 2;
    G.draw(o.icon, sx, y + (h - 16) / 2 + (held ? 1 : 0), 16, 16); G.text(label, sx + iw + 3, ty, { c: dis ? G.C.grey : (o.c || G.C.cream), s: o.s || 1 });
  } else G.text(label, x + w / 2, ty, { a: 'c', c: dis ? G.C.grey : (o.c || G.C.cream), s: o.s || 1 });
  return !dis && UI.tap(x, y, w, h);
};
UI.back = function (label) {
  const x = 6, y = 6;
  const held = UI.held(x, y, 24, 24);
  G.draw('UI/Common/btn_back.png', x, y + (held ? 1 : 0));
  if (label) G.text(label, x + 30, y + 7, { s: 1 });
  return UI.tap(x, y, 24, 24);
};
UI.closeBtn = function (x, y) { const held = UI.held(x, y, 24, 24); G.draw('UI/Common/btn_close.png', x, y + (held ? 1 : 0)); return UI.tap(x, y, 24, 24); };
UI.bar = function (x, y, w, frac, fill) {
  G.nine('UI/Common/progress_bg_9slice.png', x, y, w, 10, 3);
  const fw = Math.round((w - 4) * G.clamp(frac, 0, 1));
  if (fw > 0) G.nine('UI/Common/progress_fill_' + (fill || 'green') + '_9slice.png'.replace('_9slice', '') , x + 2, y + 2, fw, 6, 2);
};
/* area scroll vertikal */
UI.scrollState = {};
UI.scrollBegin = function (id, x, y, w, h, contentH) {
  const st = UI.scrollState[id] || (UI.scrollState[id] = { off: 0, vel: 0 });
  const g = G.g; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const maxOff = Math.max(0, contentH - h);
  if (!UI.lock) {
    const p = G.pointerIn(x, y, w, h);
    if (p && p.moved) { st.off -= p.dy; st.vel = -p.dy / 0.016; }
    else { st.off += st.vel * 0.016; st.vel *= 0.9; }
    if (G.wheel && G.mouseIn && G.mouseIn(x, y, w, h)) st.off += G.wheel * 0.5;
  }
  st.off = G.clamp(st.off, 0, maxOff);
  g.translate(0, -Math.round(st.off));
  UI._sc = { x, y, w, h, st, maxOff };
  return Math.round(st.off);
};
UI.scrollEnd = function () {
  const g = G.g, s = UI._sc; g.restore();
  if (s.maxOff > 0) {
    const th = Math.max(16, s.h * s.h / (s.h + s.maxOff)), ty = s.y + (s.h - th) * (s.st.off / s.maxOff);
    g.fillStyle = 'rgba(57,12,20,0.5)'; g.fillRect(s.x + s.w - 3, s.y, 2, s.h);
    g.fillStyle = G.C.gold; g.fillRect(s.x + s.w - 3, ty, 2, th);
  }
};
/* tap dalam area scroll harus berada di dalam viewport */
UI.tapIn = function (x, y, w, h) {
  const s = UI._sc; if (s) { const ty = y - s.st.off; if (ty + h < s.y || ty > s.y + s.h) return false; const t = G.taps.find(t => t.x >= x && t.x <= x + w && t.y >= ty && t.y <= ty + h && t.y >= s.y && t.y <= s.y + s.h); if (t && !UI.lock) { G.taps.splice(G.taps.indexOf(t), 1); G.audio.sfx('SFX_Button_Click', 0.7); return true; } return false; }
  return UI.tap(x, y, w, h);
};
/* dialog konfirmasi */
UI.dialog = function (title, msg, yes, no) {
  const g = G.g; g.fillStyle = 'rgba(28,10,14,0.65)'; g.fillRect(0, 0, G.LW, G.LH);
  const w = 280, h = 130, x = (G.LW - w) / 2, y = (G.LH - h) / 2;
  UI.lock = false; G.panel('cream', x, y, w, h);
  G.text(title, x + w / 2, y + 10, { a: 'c', c: G.C.maroon, sh: false });
  const lines = G.wrap(msg, w - 30);
  lines.forEach((l, i) => G.text(l, x + w / 2, y + 30 + i * 12, { a: 'c', c: G.C.dark, sh: false }));
  let r = null;
  if (UI.button(yes || 'Ya', x + 20, y + h - 36, 110, 24, { kind: 'button_green_normal' })) r = true;
  if (UI.button(no || 'Batal', x + w - 130, y + h - 36, 110, 24)) r = false;
  return r;
};

/* ---------- audio ---------- */
G.audio = {
  ctx: null, musicName: null, src: null,
  init() { try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.mus = this.ctx.createGain(); this.mus.connect(this.ctx.destination); this.sfxg = this.ctx.createGain(); this.sfxg.connect(this.ctx.destination); } catch (e) { this.ctx = null; } },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  vols() { const s = G.save ? G.save.data.settings : { music: true, sfx: true, musicVol: 0.6, sfxVol: 0.8 }; return s; },
  sfx(name, vol) {
    if (!this.ctx) return; const s = this.vols(); if (!s.sfx) return;
    const b = G.abuf[name]; if (!b) return;
    const src = this.ctx.createBufferSource(), gn = this.ctx.createGain();
    src.buffer = b; gn.gain.value = (vol === undefined ? 1 : vol) * s.sfxVol; src.connect(gn); gn.connect(this.sfxg); src.start();
  },
  music(name) {
    if (!this.ctx) return; this.musicName = name;
    if (this.src) { try { this.src.stop(); } catch (_) { } this.src = null; }
    const s = this.vols(); const b = G.abuf[name]; if (!b || !s.music) return;
    const src = this.ctx.createBufferSource(); src.buffer = b;
    const meta = G.json['Audio/audio_meta.json']; src.loop = !!(meta && meta.loop[name]);
    this.mus.gain.value = 0.55 * s.musicVol; src.connect(this.mus); src.start(); this.src = src;
  },
  refresh() { const n = this.musicName; this.music(n); if (this.mus) this.mus.gain.value = 0.55 * this.vols().musicVol; },
  stop() { if (this.src) { try { this.src.stop(); } catch (_) { } this.src = null; } this.musicName = null; }
};
G.vibrate = ms => { try { if (G.save && G.save.data.settings.vibration && navigator.vibrate) navigator.vibrate(ms); } catch (_) { } };

/* ---------- loader ---------- */
G.base = 'assets/';
G.loadAll = async function (onProgress) {
  const man = await (await fetch(G.base + 'manifest.json')).json();
  const files = man.files; let done = 0; const total = files.length;
  const tick = () => { done++; onProgress && onProgress(done / total); };
  const jobs = files.map(f => {
    if (f.endsWith('.png')) return new Promise(res => { const im = new Image(); im.onload = () => { G.img[f] = im; tick(); res(); }; im.onerror = () => { console.warn('missing', f); tick(); res(); }; im.src = G.base + f; });
    if (f.endsWith('.json')) return fetch(G.base + f).then(r => r.json()).then(j => { G.json[f] = j; tick(); }).catch(() => { tick(); });
    if (f.endsWith('.ogg')) {
      return fetch(G.base + f).then(r => r.arrayBuffer()).then(ab => new Promise(res => {
        if (!G.audio.ctx) { tick(); return res(); }
        G.audio.ctx.decodeAudioData(ab, b => { G.abuf[f.split('/').pop().replace('.ogg', '')] = b; tick(); res(); }, () => { tick(); res(); });
      })).catch(() => { tick(); });
    }
    tick(); return Promise.resolve();
  });
  await Promise.all(jobs);
};
