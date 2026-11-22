#!/usr/bin/env python3
"""Pra-pemrosesan aset: panel HUD kosong, varian rekrutan (recolor), GK lawan, manifest.json.
Jalankan dari root proyek: python3 tools/prepare_assets.py"""
import json, os, shutil
from collections import Counter
from PIL import Image

A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'assets')
A = os.path.abspath(A)

def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def blank(src, dst, inset):
    im = Image.open(os.path.join(A, src)).convert('RGBA')
    w, h = im.size
    inner = [im.getpixel((x, y)) for y in range(inset, h-inset) for x in range(inset, w-inset)]
    col = Counter(inner).most_common(1)[0][0]
    for y in range(inset, h-inset):
        for x in range(inset, w-inset):
            im.putpixel((x, y), col)
    im.save(os.path.join(A, dst))

blank('UI/Gameplay_HUD/scoreboard.png', 'UI/Gameplay_HUD/scoreboard_blank.png', 4)
blank('UI/Gameplay_HUD/match_timer.png', 'UI/Gameplay_HUD/match_timer_blank.png', 3)
blank('UI/Gameplay_HUD/match_event_notification.png', 'UI/Gameplay_HUD/match_event_blank.png', 3)

pal = json.load(open(os.path.join(A, 'Characters/Cosmetics/cosmetic_palettes.json')))

def recolor(path_in, path_out, mapping):
    im = Image.open(os.path.join(A, path_in)).convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            k = (r, g, b)
            if a and k in mapping:
                px[x, y] = mapping[k] + (a,)
    os.makedirs(os.path.dirname(os.path.join(A, path_out)), exist_ok=True)
    im.save(os.path.join(A, path_out))

def pmap(src_hair, src_skin, dst_hair, dst_skin):
    m = {}
    for s, d in zip(pal['hair'][src_hair] + pal['skin'][src_skin], pal['hair'][dst_hair] + pal['skin'][dst_skin]):
        m[hexrgb(s)] = hexrgb(d)
    return m

# (id, sumber folder/nama, hair src, skin src, hair dst, skin dst)
GEN = [
    ('Bayu',  'CB/Player_CB_01', 'black', 's3', 'olive',  's4'),
    ('Dewa',  'RW/Player_RW',    'sage',  's3', 'blonde', 's2'),
    ('Rizky', 'CB/Player_CB_01', 'black', 's3', 'brown',  's2'),
    ('Hendra','RW/Player_RW',    'sage',  's3', 'ginger', 's4'),
    ('Joni',  'CB/Player_CB_01', 'black', 's3', 'rust',   's1'),
    ('Ardi',  'RW/Player_RW',    'sage',  's3', 'brown',  's1'),
    ('Wisnu', 'CB/Player_CB_01', 'black', 's3', 'sage',   's3'),
]
for name, src, hs, ss, hd, sd in GEN:
    m = pmap(hs, ss, hd, sd)
    base = 'Characters/Default_Players/' + src
    for suf in ('', '_portrait', '_profile_icon'):
        recolor(base + suf + '.png', 'Characters/Generated/Player_%s%s.png' % (name, suf), m)

# GK lawan: seragam olive -> biru-sage
gk = {hexrgb('#817b1a'): hexrgb('#b06ac4'), hexrgb('#5f521a'): hexrgb('#6a3a82')}
recolor('Characters/Default_Players/GK/Player_GK.png', 'Characters/Generated/Player_GK_opp.png', gk)


# seragam lawan: pixel yang berbeda antara home & away (= kostum) diganti biru-putih; rambut/kulit tetap
KIT = {hexrgb('#ac4427'): hexrgb('#2d5a73'), hexrgb('#c64e2c'): hexrgb('#4a8aa5'), hexrgb('#b8993d'): hexrgb('#d8e6ee'), hexrgb('#ebda8d'): hexrgb('#ffffff')}
OUT = {'RB': 'RB/Player_RB', 'CB1': 'CB/Player_CB_01', 'CB2': 'CB/Player_CB_02', 'LB': 'LB/Player_LB', 'CDM': 'CDM/Player_CDM', 'CM': 'CM/Player_CM',
       'CAM': 'CAM/Player_CAM', 'RW': 'RW/Player_RW', 'ST': 'ST/Player_ST', 'LW': 'LW/Player_LW'}
for pid, rel in OUT.items():
    h = Image.open(os.path.join(A, 'Characters/Default_Players/%s.png' % rel)).convert('RGBA')
    w = Image.open(os.path.join(A, 'Characters/Default_Players/%s_away.png' % rel)).convert('RGBA')
    hp, wp = h.load(), w.load()
    for y in range(h.height):
        for x in range(h.width):
            p, q = hp[x, y], wp[x, y]
            if p[3] and q[3] and p[:3] != q[:3] and p[:3] in KIT:
                hp[x, y] = KIT[p[:3]] + (p[3],)
    h.save(os.path.join(A, 'Characters/Generated/Opp_%s.png' % pid))

# manifest
files = []
for root, _, fs in os.walk(A):
    for f in fs:
        if f.endswith(('.png', '.json', '.ogg')) and f != 'manifest.json':
            files.append(os.path.relpath(os.path.join(root, f), A).replace(os.sep, '/'))
files.sort()
json.dump({'files': files}, open(os.path.join(A, 'manifest.json'), 'w'))
print('manifest', len(files))
