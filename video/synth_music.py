# -*- coding: utf-8 -*-
"""Фоновая музыка для урока: мягкие переборы в ладе хиджаз (D), 84 сек, WAV 16-bit mono."""
import math
import os
import struct
import wave

SR = 44100
DUR = 84.0
N = int(SR * DUR)

# частоты: D3-пад + мелодия в хиджазе от D4
def f_of(name):
    notes = {'D3': 146.83, 'A3': 220.0, 'D4': 293.66, 'Eb4': 311.13, 'Fs4': 369.99,
             'G4': 392.0, 'A4': 440.0, 'Bb4': 466.16, 'C5': 523.25, 'D5': 587.33}
    return notes[name]

# спокойный, повторяющийся мотив (каждая нота ~1.4 с)
MOTIF = ['D4', 'Fs4', 'G4', 'A4', 'Bb4', 'A4', 'G4', 'Fs4',
         'G4', 'A4', 'Bb4', 'C5', 'A4', 'G4', 'Fs4', 'Eb4',
         'D4', 'Fs4', 'A4', 'D5', 'C5', 'Bb4', 'A4', 'G4',
         'Fs4', 'G4', 'A4', 'Fs4', 'Eb4', 'Fs4', 'D4', 'D4']
STEP = 1.4  # сек между нотами

buf = [0.0] * N

# пад: D3 + A3, очень тихо, лёгкое дыхание громкости
for i in range(N):
    t = i / SR
    lfo = 0.6 + 0.4 * math.sin(2 * math.pi * t / 16.0)
    buf[i] += 0.045 * lfo * (math.sin(2 * math.pi * f_of('D3') * t) +
                             0.7 * math.sin(2 * math.pi * f_of('A3') * t))

# переборы: синус + вторая гармоника, экспоненциальное затухание
k = 0
t0 = 0.6
while t0 < DUR - 3.0:
    note = MOTIF[k % len(MOTIF)]
    freq = f_of(note)
    start = int(t0 * SR)
    length = int(1.8 * SR)
    for j in range(length):
        idx = start + j
        if idx >= N:
            break
        t = j / SR
        env = math.exp(-t / 0.55)
        s = math.sin(2 * math.pi * freq * t) + 0.35 * math.sin(2 * math.pi * freq * 2 * t)
        buf[idx] += 0.11 * env * s
    k += 1
    t0 += STEP

# фейды и нормализация
fade_in, fade_out = int(2.0 * SR), int(3.5 * SR)
for i in range(fade_in):
    buf[i] *= i / fade_in
for i in range(fade_out):
    buf[N - 1 - i] *= i / fade_out
peak = max(abs(x) for x in buf)
gain = 0.32 / peak if peak > 0 else 1.0

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, 'music.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    frames = bytearray()
    for x in buf:
        v = int(max(-1.0, min(1.0, x * gain)) * 32767)
        frames += struct.pack('<h', v)
    w.writeframes(bytes(frames))
print('OK', path, os.path.getsize(path), 'bytes')
