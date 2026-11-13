import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// «Ожившая миниатюра» чистым кодом: параллакс неба, дрожь кустов,
// медленный проезд камеры, световой проход, пылинки, виньетка, музыка.

const W = 1880;
const H = 983;

export const Alive = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pan = interpolate(f, [0, durationInFrames], [12, -72]);
  const breath = 1.07 + 0.008 * Math.sin(f / 80);
  const skyDrift = -f * 0.1; // облака уплывают влево относительно города
  const bf = 0.011 + 0.0025 * Math.sin(f / 19);
  const sweep = interpolate(f, [0, durationInFrames], [-55, 135]);

  const imgStyle = { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' };
  const layer = (extraX, mask, filter) => ({
    position: 'absolute',
    inset: 0,
    transform: `scale(${breath}) translateX(${pan + extraX}px)`,
    ...(mask ? { WebkitMaskImage: mask, maskImage: mask } : {}),
    ...(filter ? { filter } : {}),
  });

  const dust = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 137) % 100,
    y0: (i * 61) % 100,
    s: 4 + (i % 3) * 3,
    ph: i * 37,
  }));

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg,#2A231C,#1D1812)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="0" height="0">
        <defs>
          <filter id="wob">
            <feTurbulence type="fractalNoise" baseFrequency={`${bf} 0.06`} numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5 + 2 * Math.sin(f / 13)} />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'relative',
          width: W,
          height: H,
          overflow: 'hidden',
          outline: '3px solid #8A5A2B',
          outlineOffset: 6,
          borderRadius: 4,
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* базовый слой — вся картина, медленный проезд */}
        <div style={layer(0, null, null)}>
          <Img src={staticFile('mini.jpg')} style={imgStyle} />
        </div>
        {/* небо — дрейфует отдельно (облака плывут) */}
        <div style={layer(skyDrift, 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,0) 23%)', null)}>
          <Img src={staticFile('mini.jpg')} style={imgStyle} />
        </div>
        {/* кусты у земли — дрожат на ветру */}
        <div style={layer(0, 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,0) 16%)', 'url(#wob)')}>
          <Img src={staticFile('mini.jpg')} style={imgStyle} />
        </div>
        {/* тёплый световой проход */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            bottom: '-50%',
            left: `${sweep}%`,
            width: '36%',
            transform: 'rotate(14deg)',
            background: 'linear-gradient(90deg, transparent, rgba(255,230,180,0.65), transparent)',
            opacity: 0.1,
            mixBlendMode: 'soft-light',
          }}
        />
        {/* пылинки в луче */}
        {dust.map((d, i) => {
          const y = (d.y0 + 100 - (f / durationInFrames) * 20 - (i % 4) * 2) % 100;
          const op = 0.22 + 0.18 * Math.sin((f + d.ph) / 23);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(d.x + 3 * Math.sin((f + d.ph) / 41)) % 100}%`,
                top: `${y}%`,
                width: d.s,
                height: d.s,
                borderRadius: '50%',
                background: 'rgba(245,235,210,0.9)',
                opacity: op,
                filter: 'blur(1.5px)',
              }}
            />
          );
        })}
        {/* виньетка */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 58%, rgba(15,15,25,0.28) 100%)',
          }}
        />
      </div>
      <Audio
        src={staticFile('music.wav')}
        volume={(fr) => (fr > durationInFrames - 70 ? Math.max(0, (durationInFrames - fr) / 70) * 0.55 : 0.55)}
      />
    </AbsoluteFill>
  );
};
