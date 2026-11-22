'use strict';
(async function () {
  G.init(); G.audio.init();
  // font dimuat dulu agar layar loading bisa menampilkan teks
  const li = (p) => new Promise(r => { const i = new Image(); i.onload = () => { G.img[p] = i; r(); }; i.onerror = r; i.src = G.base + p; });
  try { G.json['Branding/font_atlas.json'] = await (await fetch(G.base + 'Branding/font_atlas.json')).json(); } catch (e) { }
  await li('Branding/font_atlas.png'); await li('Branding/Loading_Screen_320x180.png');
  G.scenes.boot = S.boot; G.go('boot'); G.start();
  window.addEventListener('error', e => { G.lastError = String(e.message); });
  await G.loadAll(p => { S.boot.prog = p; });
  G.save.load(); G.audio.refresh();
  G.mouseIn = (x, y, w, h) => true;
  G.go('menu');
})();
