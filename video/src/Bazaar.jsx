import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadAmiri } from '@remotion/google-fonts/Amiri';
import { loadFont as loadAlegreya } from '@remotion/google-fonts/Alegreya';

const amiri = loadAmiri().fontFamily;
const alegreya = loadAlegreya().fontFamily;

// Караван вырезан из полотна и идёт на дорисованный кодом базар.
const K = 1880 / 1280;           // масштаб: исходник 1280×669 → бокс 1880×983
const BOXW = 1880;
const BOXH = 983;
const BW = 1514;                 // ширина панели базара (с нахлёстом на шов)

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

const SPRITES = [
  { src: 'sprite_a.png', x: 2,   y: 148, w: 354, h: 376, amp: 5, T: 12, ph: 0.0, rock: 1.6 },
  { src: 'sprite_b.png', x: 270, y: 244, w: 200, h: 356, amp: 4, T: 13, ph: 1.7, rock: 1.2 },
  { src: 'sprite_c.png', x: 344, y: 108, w: 456, h: 480, amp: 5, T: 15, ph: 0.8, rock: 1.0 },
  { src: 'sprite_d.png', x: 758, y: 122, w: 508, h: 546, amp: 5, T: 16, ph: 2.4, rock: 1.0 },
];

// ---- детали базара (SVG) ----

const Swirl = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke="#76839B" strokeWidth={5} strokeLinecap="round" opacity={0.6}>
    <path d="M0,0 q30,-38 72,-22 q40,16 18,46 q-20,26 -50,10 q-24,-12 -6,-32 q12,-14 26,-3" />
    <path d="M96,12 q36,-16 64,2" />
  </g>
);

const Tuft = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke="#6E4A33" strokeWidth={4.5} strokeLinecap="round" opacity={0.85}>
    <path d="M0,0 q-14,-22 -27,-28" /><path d="M0,0 q-2,-30 -6,-42" />
    <path d="M0,0 q12,-22 26,-27" /><path d="M0,0 q20,-9 31,-7" /><path d="M0,0 q-22,-7 -32,-3" />
  </g>
);

const Dome = ({ x, y, w, h, color }) => (
  <g>
    <path d={`M${x - w / 2},${y} q0,${-h} ${w / 2},${-h} q${w / 2},0 ${w / 2},${h} Z`} fill={color} stroke="#6B4A26" strokeWidth={3} />
    <line x1={x} y1={y - h - 14} x2={x} y2={y - h} stroke="#6B4A26" strokeWidth={3.5} />
  </g>
);

const Awning = ({ x, y, w, drop = 34 }) => {
  const stripes = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    stripes.push(
      <path
        key={i}
        d={`M${x + (w / n) * i},${y} L${x + (w / n) * (i + 1)},${y} L${x + (w / n) * (i + 1) - 6},${y + drop} L${x + (w / n) * i - 6},${y + drop} Z`}
        fill={i % 2 ? '#B3543E' : '#EFE3C8'}
        stroke="#6B4A26"
        strokeWidth={2}
      />
    );
  }
  return <g>{stripes}</g>;
};

const Melon = ({ x, y, r = 16 }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r * 1.25} ry={r} fill="#7FA060" stroke="#4F6B3E" strokeWidth={2.5} />
    <path d={`M${x - r},${y - r * 0.4} q${r},${r * 0.5} ${2 * r},0`} fill="none" stroke="#4F6B3E" strokeWidth={2} />
    <path d={`M${x - r},${y + r * 0.4} q${r},${-r * 0.5} ${2 * r},0`} fill="none" stroke="#4F6B3E" strokeWidth={2} />
  </g>
);

const Jar = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-14,0 q-8,-26 0,-44 q4,-10 -4,-14 l36,0 q-8,4 -4,14 q8,18 0,44 Z" fill="#D9A441" stroke="#8A5A2B" strokeWidth={3} />
    <ellipse cx={0} cy={-58} rx={16} ry={5} fill="#C8942F" stroke="#8A5A2B" strokeWidth={2.5} />
  </g>
);

const Man = ({ x, y, robe = '#B3543E', s = 1, flip = false }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <path d="M-20,0 L-14,-62 L16,-62 L24,0 Z" fill={robe} stroke="#5A3A24" strokeWidth={2.5} />
    <path d="M-14,-40 L-30,-24 L-24,-18 L-10,-30 Z" fill={robe} stroke="#5A3A24" strokeWidth={2} />
    <rect x={-14} y={-44} width={30} height={7} fill="#D9A441" stroke="#5A3A24" strokeWidth={1.5} />
    <circle cx={2} cy={-74} r={12} fill="#E8C9A0" stroke="#5A3A24" strokeWidth={2} />
    <path d="M-6,-70 q8,10 16,0 l-2,8 q-7,5 -13,0 Z" fill="#4A3426" />
    <ellipse cx={2} cy={-88} rx={15} ry={8} fill="#F2EBDC" stroke="#5A3A24" strokeWidth={2} />
    <ellipse cx={2} cy={-92} rx={10} ry={6} fill="#FBF6EA" stroke="#5A3A24" strokeWidth={1.5} />
    <path d="M-20,0 l8,0 0,5 -10,0 Z M24,0 l-8,0 0,5 10,0 Z" fill="#2A2420" />
  </g>
);

const Pennant = ({ x, top }) => (
  <g>
    <line x1={x} y1={700} x2={x} y2={top} stroke="#54341E" strokeWidth={6} />
    <path d={`M${x},${top} l54,14 -54,14 Z`} fill="#B3543E" stroke="#54341E" strokeWidth={2.5} />
  </g>
);

const BazaarPanel = () => (
  <svg width={BW} height={BOXH} style={{ display: 'block', position: 'absolute', left: 0, top: 0 }}>
    <Swirl x={150} y={80} s={1.0} />
    <Swirl x={700} y={54} s={0.8} />
    <Swirl x={1180} y={88} s={0.9} />
    {/* ВОРОТА БАЗАРА — высокий айван с куполом, виден над караваном */}
    <g>
      <rect x={430} y={262} width={240} height={450} fill="#C8A24B" stroke="#6B4A26" strokeWidth={4} />
      <rect x={456} y={288} width={188} height={424} fill="#B98F3C" stroke="#6B4A26" strokeWidth={3} />
      <path d="M478,712 L478,452 Q550,368 622,452 L622,712 Z" fill="#2E3D58" stroke="#6B4A26" strokeWidth={3} />
      <path d="M478,470 Q550,392 622,470" fill="none" stroke="#4C9FA6" strokeWidth={8} />
      <Dome x={550} y={262} w={190} h={78} color="#4C9FA6" />
      <path d="M452,248 l0,-52 30,12 -30,12 Z" fill="#B3543E" stroke="#54341E" strokeWidth={2.5} />
      <path d="M648,248 l0,-52 30,12 -30,12 Z" fill="#B3543E" stroke="#54341E" strokeWidth={2.5} />
      {/* узор-гирих на фасаде */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${468 + i * 60},300 l24,16 -24,16 -24,-16 Z`} fill="#2E4A8F" stroke="#54341E" strokeWidth={2} opacity={0.9} />
      ))}
    </g>
    {/* вывеска بازار на высоком столбе */}
    <g>
      <line x1={880} y1={700} x2={880} y2={236} stroke="#54341E" strokeWidth={8} />
      <rect x={768} y={206} width={224} height={66} rx={10} fill="#8A5A2B" stroke="#54341E" strokeWidth={3.5} />
      <rect x={776} y={214} width={208} height={50} rx={7} fill="#F2E7CE" stroke="#54341E" strokeWidth={2} />
      <text x={880} y={252} textAnchor="middle" fontFamily={amiri} fontSize={42} fill="#3A3328">بازار</text>
    </g>
    {/* вымпелы и навес базарной улицы */}
    <Pennant x={1160} top={208} />
    <Pennant x={1395} top={226} />
    <g>
      <Awning x={1090} y={356} w={400} drop={38} />
      <line x1={1096} y1={356} x2={1096} y2={700} stroke="#54341E" strokeWidth={6} />
      <line x1={1484} y1={356} x2={1484} y2={700} stroke="#54341E" strokeWidth={6} />
    </g>
    <g>
      <Awning x={120} y={396} w={300} drop={36} />
      <line x1={126} y1={396} x2={126} y2={700} stroke="#54341E" strokeWidth={6} />
    </g>
    {/* дальний ряд: торговцы и товар (выше = дальше, по канону миниатюры) */}
    <Man x={320} y={560} robe="#B3543E" s={0.85} />
    <Man x={1230} y={548} robe="#2E4A8F" s={0.8} flip />
    <Melon x={255} y={556} r={12} /><Melon x={282} y={552} r={11} />
    <Jar x={1296} y={548} s={0.62} /><Jar x={1326} y={548} s={0.5} />
    {/* ковёр, вывешенный у ворот */}
    <g>
      <rect x={692} y={430} width={104} height={128} fill="#2E4A8F" stroke="#54341E" strokeWidth={3} />
      {[0, 1].map((r) =>
        [0, 1].map((c) => (
          <path key={`${r}${c}`} d={`M${718 + c * 52},${452 + r * 52} l18,13 -18,13 -18,-13 Z`} fill={(r + c) % 2 ? '#C8A24B' : '#B3543E'} stroke="#54341E" strokeWidth={2} />
        ))
      )}
    </g>
    {/* кустики на земле */}
    <Tuft x={300} y={870} /><Tuft x={700} y={900} s={0.9} /><Tuft x={1150} y={856} s={1.1} />
    <Tuft x={500} y={940} s={0.8} /><Tuft x={980} y={944} />
  </svg>
);

const Plaque = ({ text, from, to }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [from, from + 18, to - 18, to], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center',
        opacity: op, zIndex: 5,
      }}
    >
      <div
        style={{
          background: '#F5EBD3', border: '3px solid #8A5A2B', outline: '2px solid rgba(138,90,43,0.45)',
          outlineOffset: -9, borderRadius: 16, padding: '14px 42px',
          fontFamily: alegreya, fontSize: 40, fontWeight: 700, color: '#3A3328',
          boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- композиция ----

export const Bazaar = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const T = interpolate(f, [30, 510], [0, 1150], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const walk = interpolate(f, [0, 30, 480, 540], [0.35, 1, 1, 0.3], clamp);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg,#2A231C,#1D1812)', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'relative', width: BOXW, height: BOXH, overflow: 'hidden',
          outline: '3px solid #8A5A2B', outlineOffset: 6, borderRadius: 4,
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* мир: [базар][полотно], едет вправо — караван идёт влево, к базару */}
        <div style={{ position: 'absolute', left: -BW, top: 0, width: BW + BOXW, height: BOXH, transform: `translateX(${T}px)` }}>
          <Img
            src={staticFile('panel_bg.png')}
            style={{ position: 'absolute', left: 0, top: 0, width: BW, height: BOXH }}
          />
          <Img
            src={staticFile('bg_clean.png')}
            style={{ position: 'absolute', left: BW - 16, top: 0, width: BOXW, height: BOXH }}
          />
          <BazaarPanel />
        </div>
        {/* караван: на месте в кадре, шагает */}
        {SPRITES.map((s, i) => {
          const bob = s.amp * walk * Math.sin((2 * Math.PI * f) / s.T + s.ph);
          const rot = s.rock * walk * Math.sin((2 * Math.PI * f) / s.T + s.ph - Math.PI / 2);
          const sway = 4 * walk * Math.sin(f / 37 + s.ph * 2);
          return (
            <Img
              key={i}
              src={staticFile(s.src)}
              style={{
                position: 'absolute',
                left: s.x * K + sway,
                top: s.y * K + bob,
                width: s.w * K,
                height: s.h * K,
                transform: `rotate(${rot}deg)`,
                transformOrigin: '50% 88%',
              }}
            />
          );
        })}
        <Plaque text="Караван идёт на базар…" from={24} to={150} />
        <Plaque text="Пришли — вот и базар!" from={505} to={592} />
        {/* виньетка */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 58%, rgba(15,15,25,0.26) 100%)' }} />
      </div>
      <Audio
        src={staticFile('music.wav')}
        volume={(fr) => (fr > durationInFrames - 70 ? Math.max(0, (durationInFrames - fr) / 70) * 0.55 : 0.55)}
      />
    </AbsoluteFill>
  );
};
