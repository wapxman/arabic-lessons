# -*- coding: utf-8 -*-
"""Раскрой миниатюры на спрайты (группы каравана) + чистый фон (inpaint)."""
import os
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'public', 'mini.jpg')
PUB = os.path.join(BASE, 'public')
OUT = os.path.join(BASE, 'out')

POLYS = {
    'a': [(10,355),(40,295),(95,295),(150,295),(160,240),(170,185),(195,156),(242,156),(260,192),(252,252),(292,272),(338,295),(348,342),(340,422),(322,472),(306,514),(250,516),(214,482),(196,516),(138,516),(108,472),(64,442),(18,415)],
    'b': [(278,284),(290,254),(314,260),(338,266),(352,256),(398,252),(414,290),(408,332),(452,372),(462,432),(448,502),(446,562),(432,590),(388,592),(360,576),(346,592),(308,590),(314,540),(304,480),(300,420),(314,360),(298,330),(280,306)],
    'c': [(362,236),(352,218),(362,190),(396,178),(442,188),(470,204),(484,230),(500,214),(516,130),(556,116),(606,122),(618,168),(612,208),(636,168),(700,152),(748,168),(764,198),(772,262),(784,302),(792,362),(778,422),(786,472),(772,524),(734,526),(716,480),(700,462),(736,562),(718,576),(640,580),(560,578),(538,562),(528,522),(508,516),(538,472),(498,452),(478,472),(464,522),(468,562),(446,522),(442,472),(452,422),(458,372),(458,332),(464,300),(462,264),(470,246),(430,248),(392,246)],
    'd': [(766,236),(778,210),(812,202),(846,210),(862,232),(872,260),(886,240),(900,180),(924,136),(962,130),(996,150),(1046,152),(1056,185),(1050,208),(1078,206),(1092,148),(1150,152),(1196,172),(1210,216),(1206,262),(1244,300),(1258,360),(1250,420),(1254,480),(1236,540),(1210,560),(1180,650),(1156,660),(1120,652),(1126,548),(1104,498),(1064,486),(1024,494),(1000,520),(992,568),(912,568),(904,544),(902,524),(896,648),(862,652),(856,520),(868,468),(876,420),(876,370),(880,330),(866,300),(846,280),(820,268),(790,262)],
}

# прямоугольные заплатки к маскам (x0,y0,x1,y1) — ноги и шеи верблюдов
EXTRA = {
    'c': [(445, 388, 545, 540), (415, 235, 525, 400)],
    'd': [(784, 378, 882, 548), (790, 250, 885, 400)],
}

def group_mask(w, h, poly, extras):
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    d.polygon(poly, fill=255)
    for r in extras:
        d.rectangle(r, fill=255)
    arr = np.array(m)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    arr = cv2.morphologyEx(arr, cv2.MORPH_CLOSE, k)
    return arr

def tile_band(img_np, y0, y1, sx0, sx1, w, x_step=0):
    """Собрать полосу [y0:y1] повторением чистого куска [sx0:sx1] с кроссфейдом стыков."""
    src = img_np[y0:y1, sx0:sx1].astype(np.float32)
    bh, bw = src.shape[:2]
    ov = 28
    band = np.zeros((bh, w, 3), np.float32)
    weight = np.zeros((bh, w, 1), np.float32)
    x = -x_step
    i = 0
    while x < w:
        piece = src if i % 2 == 0 else src[:, ::-1]
        x0 = max(x, 0)
        x1 = min(x + bw, w)
        if x1 > x0:
            ramp = np.ones((bh, x1 - x0, 1), np.float32)
            rl = min(ov, x1 - x0)
            ramp[:, :rl, 0] *= np.linspace(0.05, 1, rl)[None, :]
            ramp[:, -rl:, 0] *= np.linspace(1, 0.05, rl)[None, :]
            band[:, x0:x1] += piece[:, (x0 - x):(x1 - x)] * ramp
            weight[:, x0:x1] += ramp
        x += bw - ov
        i += 1
    band /= np.maximum(weight, 1e-6)
    return band.astype(np.uint8)

def synthetic_bg(img_np, w, h):
    """Фон без фигур: небо родное, город/холмы/земля — мощение чистыми кусками."""
    syn = img_np.copy()
    SKY_END, CITY_END, HILL_END = 116, 218, 266
    syn[SKY_END:CITY_END] = tile_band(img_np, SKY_END, CITY_END, 8, 150, w)
    syn[CITY_END:HILL_END] = tile_band(img_np, CITY_END, HILL_END, 8, 150, w)
    strip_y0, strip_y1 = 566, 636
    bh = strip_y1 - strip_y0
    y = HILL_END
    i = 0
    while y < h:
        hh = min(bh, h - y)
        band = tile_band(img_np, strip_y0, strip_y1, 8, 1000, w, x_step=(i * 190) % 700)
        if hh < bh:
            band = band[:hh]
        # вертикальный кроссфейд между рядами
        if y > HILL_END:
            vf = min(26, hh)
            ramp = np.linspace(0, 1, vf)[:, None, None]
            syn[y:y+vf] = (syn[y:y+vf].astype(np.float32) * (1 - ramp) + band[:vf].astype(np.float32) * ramp).astype(np.uint8)
            if hh > vf:
                syn[y+vf:y+hh] = band[vf:]
        else:
            syn[y:y+hh] = band
        y += bh - 26
        i += 1
    return syn

def build_panel(img_np, h):
    """Пустой холст-продолжение картины (для базарной панели), ширина 1031 (→1514 в кадре)."""
    PW = 1031
    panel = np.zeros((h, PW, 3), np.uint8)
    panel[0:116] = tile_band(img_np, 0, 116, 8, 348, PW)        # небо с верхней рамкой
    panel[116:218] = tile_band(img_np, 116, 218, 8, 150, PW)    # город
    panel[218:266] = tile_band(img_np, 218, 266, 8, 150, PW)    # холмы
    y, i = 266, 0
    while y < 646:
        hh = min(70, 646 - y)
        band = tile_band(img_np, 566, 636, 8, 1000, PW, x_step=(i * 230) % 700)[:hh]
        vf = min(20, hh)
        ramp = np.linspace(0, 1, vf)[:, None, None]
        panel[y:y+vf] = (panel[y:y+vf].astype(np.float32) * (1 - ramp) + band[:vf].astype(np.float32) * ramp).astype(np.uint8) if y > 266 else band[:vf]
        if hh > vf:
            panel[y+vf:y+hh] = band[vf:]
        y += 70 - 20
        i += 1
    panel[646:h] = tile_band(img_np, 646, h, 8, 1000, PW)       # нижняя рамка и паспарту
    return panel

def main(mode):
    img = Image.open(SRC).convert('RGB')
    w, h = img.size

    if mode == 'qc':
        over = img.copy()
        d = ImageDraw.Draw(over, 'RGBA')
        colors = {'a': (255,0,0,90), 'b': (0,200,0,90), 'c': (0,80,255,90), 'd': (255,0,255,90)}
        for k, poly in POLYS.items():
            d.polygon(poly, fill=colors[k], outline=(0,0,0,255))
        os.makedirs(OUT, exist_ok=True)
        over.save(os.path.join(OUT, 'poly_qc.png'))
        print('qc saved')
        return

    # спрайты с мягкой альфой (маска: полигон + заплатки + закрытие)
    union = np.zeros((h, w), np.uint8)
    for k, poly in POLYS.items():
        arr = group_mask(w, h, poly, EXTRA.get(k, []))
        union = np.maximum(union, arr)
        m_soft = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(2.5))
        ys, xs = np.where(arr > 0)
        x0, y0 = max(int(xs.min())-8, 0), max(int(ys.min())-8, 0)
        x1, y1 = min(int(xs.max())+8, w), min(int(ys.max())+8, h)
        sp = img.crop((x0, y0, x1, y1)).convert('RGBA')
        sp.putalpha(m_soft.crop((x0, y0, x1, y1)))
        sp.save(os.path.join(PUB, f'sprite_{k}.png'))
        print(f'sprite_{k}: bbox=({x0},{y0},{x1},{y1}) size={sp.size}')

    # чистый фон: оригинал там, где чисто; синтетика — под фигурами
    bad = cv2.dilate(union, np.ones((11, 11), np.uint8)).astype(np.float32) / 255.0
    img_np = np.array(img)
    syn = synthetic_bg(img_np, w, h)
    alpha = cv2.GaussianBlur(bad, (13, 13), 0)[..., None]
    out = (syn.astype(np.float32) * alpha + img_np.astype(np.float32) * (1 - alpha)).astype(np.uint8)
    out[:, 0:12] = out[:, 12:24][:, ::-1]  # залечить левую рамку картины для шва
    Image.fromarray(out).save(os.path.join(PUB, 'bg_clean.png'))
    print('bg_clean saved (synthetic bands)')

    panel = build_panel(np.array(img), h)
    Image.fromarray(panel).save(os.path.join(PUB, 'panel_bg.png'))
    print('panel_bg saved', panel.shape)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'qc')
