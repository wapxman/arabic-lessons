import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadAmiri } from '@remotion/google-fonts/Amiri';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { loadFont as loadAlegreya } from '@remotion/google-fonts/Alegreya';

const amiri = loadAmiri().fontFamily;
const manrope = loadManrope().fontFamily;
const alegreya = loadAlegreya().fontFamily;

// палитра «узбекская миниатюра» (по референсу: небо, пергамент, парча, купола)
const C = {
  cream: '#F2E7CE',   // светлый «пергаментный» текст на небе
  paper: '#F5EBD3',   // карточки-пергамент
  green: '#2E4A8F',   // главный акцент — глубокая синь халатов
  olive: '#8A5A2B',   // бронза рамок
  ochre: '#C9872F',   // охра
  ink: '#3A3328',
  muted: '#6E6652',
  line: '#D9C9A3',
  gold: '#D9A441',
  terra: '#B3543E',
  teal: '#4C9FA6',
  wall: '#C9A24B',
  sky1: '#97A4B8',
  sky2: '#AEB9C9',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

const typed = (txt, f, start, cps, fps) =>
  txt.slice(0, Math.max(0, Math.floor(((f - start) / fps) * cps)));

const pop = (f, fps, start, damping = 13) =>
  spring({ frame: f - start, fps, config: { damping, mass: 0.7 }, durationInFrames: 50 });

const slide = (f, fps, start) =>
  spring({ frame: f - start, fps, config: { damping: 200 }, durationInFrames: 40 });

// ---------- общие элементы ----------

const Swirl = ({ x, y, s = 1, flip = false }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} fill="none"
     stroke="#7E8CA3" strokeWidth={6} strokeLinecap="round" opacity={0.55}>
    <path d="M0,0 q34,-44 82,-26 q46,18 20,52 q-22,28 -56,12 q-26,-14 -8,-36 q14,-16 30,-4" />
    <path d="M110,14 q40,-18 72,2" />
  </g>
);

const Tuft = ({ x, y, ph }) => {
  const f = useCurrentFrame();
  const sway = 3 * Math.sin((f + ph) / 26);
  return (
    <g transform={`translate(${x},${y}) rotate(${sway})`} fill="none"
       stroke="#7A4A35" strokeWidth={5} strokeLinecap="round" opacity={0.8}>
      <path d="M0,0 q-16,-26 -30,-32" />
      <path d="M0,0 q0,-34 -6,-48" />
      <path d="M0,0 q14,-24 30,-30" />
      <path d="M0,0 q22,-10 34,-8" />
      <path d="M0,0 q-24,-8 -36,-4" />
    </g>
  );
};

const Dome = ({ x, w, h, color }) => (
  <g>
    <path d={`M${x - w / 2},0 q0,${-h} ${w / 2},${-h} q${w / 2},0 ${w / 2},${h} Z`}
          fill={color} stroke="#8A5A2B" strokeWidth={3} />
    <line x1={x} y1={-h - 16} x2={x} y2={-h} stroke="#8A5A2B" strokeWidth={4} />
  </g>
);

const Bg = () => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 150) * 26;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.sky1}, ${C.sky2} 70%, #A3AEBE)` }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        {/* облака-завитки, плывут двумя ярусами */}
        <g transform={`translate(${drift},0)`}>
          <Swirl x={120} y={260} s={1.1} />
          <Swirl x={700} y={180} s={0.9} flip />
        </g>
        <g transform={`translate(${-drift},0)`}>
          <Swirl x={430} y={420} s={0.7} />
          <Swirl x={880} y={520} s={0.8} flip />
        </g>
        {/* город с куполами у горизонта */}
        <g transform="translate(0,1800)" opacity={0.96}>
          <rect x={-10} y={-70} width={1100} height={75} fill={C.wall} stroke="#8A5A2B" strokeWidth={3} />
          <rect x={60} y={-150} width={150} height={80} fill={C.wall} stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={135} w={120} h={66} color={C.teal} />
          <rect x={300} y={-130} width={110} height={60} fill="#BD9440" stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={355} w={92} h={50} color="#3E5FA0" />
          <rect x={505} y={-160} width={170} height={90} fill={C.wall} stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={590} w={140} h={76} color={C.teal} />
          <rect x={790} y={-128} width={100} height={58} fill="#BD9440" stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={840} w={86} h={48} color="#3E5FA0" />
          <rect x={955} y={-148} width={26} height={78} fill={C.wall} stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={968} w={46} h={28} color={C.teal} />
          <rect x={235} y={-120} width={22} height={50} fill={C.wall} stroke="#8A5A2B" strokeWidth={3} />
          <Dome x={246} w={40} h={24} color="#3E5FA0" />
        </g>
        {/* земля и кустики */}
        <rect x={0} y={1805} width={1080} height={115} fill="#8D97A6" />
        <Tuft x={90} y={1878} ph={0} />
        <Tuft x={330} y={1894} ph={30} />
        <Tuft x={560} y={1872} ph={60} />
        <Tuft x={780} y={1896} ph={15} />
        <Tuft x={990} y={1880} ph={45} />
      </svg>
    </AbsoluteFill>
  );
};

const TopBar = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <div style={{ height: 12, background: 'rgba(242,231,206,0.28)' }}>
        <div
          style={{
            height: '100%',
            width: `${(f / durationInFrames) * 100}%`,
            background: C.gold,
            borderRadius: '0 6px 6px 0',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '22px 44px 0',
          fontFamily: manrope,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: 'rgba(242,231,206,0.88)',
        }}
      >
        <span>АРАБСКИЙ С НУЛЯ</span>
        <span style={{ color: C.gold }}>УРОК 1 · АЛФАВИТ</span>
      </div>
    </div>
  );
};

const Shell = ({ dur, children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 10, dur - 12, dur - 1], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity,
        fontFamily: manrope,
        color: C.ink,
        padding: '150px 70px 90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Kicker = ({ children, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, fps, at);
  return (
    <div
      style={{
        transform: `scale(${s})`,
        background: C.terra,
        color: C.cream,
        border: `3px solid ${C.olive}`,
        borderRadius: 999,
        padding: '14px 36px',
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '0.14em',
      }}
    >
      {children}
    </div>
  );
};

const H = ({ children, at, size = 76 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = slide(f, fps, at);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 60}px)`,
        fontFamily: alegreya,
        fontSize: size,
        fontWeight: 800,
        color: C.cream,
        textShadow: '0 3px 18px rgba(42,42,30,0.45)',
        textAlign: 'center',
        lineHeight: 1.1,
        marginTop: 26,
      }}
    >
      {children}
    </div>
  );
};

const Card = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = slide(f, fps, at);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 90}px)`,
        background: C.paper,
        border: `3px solid ${C.olive}`,
        outline: '2px solid rgba(138,90,43,0.45)',
        outlineOffset: -12,
        borderRadius: 26,
        padding: '36px 46px',
        width: '100%',
        boxShadow: '0 16px 44px rgba(42,42,30,0.30)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- 1. интро ----------

const Intro = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = interpolate(f, [45, 100], [100, 0], clamp);
  return (
    <Shell dur={180}>
      <div style={{ marginTop: 60 }}>
        <Kicker at={8}>ПЕРВЫЙ УРОК</Kicker>
      </div>
      <H at={16} size={104}>
        Алфавит:
        <br />
        первые шаги
      </H>
      <div
        style={{
          marginTop: 90,
          fontFamily: amiri,
          direction: 'rtl',
          fontSize: 150,
          color: C.cream,
          clipPath: `inset(0 0 0 ${reveal}%)`,
          lineHeight: 1.6,
        }}
      >
        السَّلامُ عَلَيْكُم
      </div>
      <div style={{ marginTop: 30, fontSize: 40, fontWeight: 800, color: C.gold, minHeight: 60, textShadow: '0 2px 12px rgba(42,42,30,0.4)' }}>
        {typed('ас-саля́му але́йкум — «мир вам!»', f, 95, 22, fps)}
      </div>
      <div
        style={{
          marginTop: 'auto',
          fontSize: 30,
          color: 'rgba(242,231,206,0.85)',
          opacity: interpolate(f, [130, 150], [0, 1], clamp),
        }}
      >
        полторы минуты · смотрите до конца
      </div>
    </Shell>
  );
};

// ---------- 2. как устроено письмо ----------

const FactCard = ({ at, icon, title, children }) => (
  <Card at={at} style={{ marginTop: 26 }}>
    <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 52, lineHeight: 1.1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>{title}</div>
        {children}
      </div>
    </div>
  </Card>
);

const Writing = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrowX = interpolate((f - 60) % 100, [0, 85], [150, -150], clamp);
  const arrowOp = interpolate((f - 60) % 100, [0, 10, 75, 85], [0, 1, 1, 0], clamp);
  const forms = ['بـ', 'ـبـ', 'ـب'];
  const labels = ['в начале', 'в середине', 'в конце'];
  return (
    <Shell dur={300}>
      <H at={8} size={78}>Как устроено письмо</H>
      <FactCard at={30} icon="⬅️" title="Справа налево">
        <div style={{ position: 'relative', marginTop: 8 }}>
          <span style={{ fontFamily: amiri, direction: 'rtl', fontSize: 110, color: C.ink }}>
            مرحبا
          </span>
          {f > 60 && (
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: `translateX(${arrowX}px)`,
                opacity: arrowOp,
                fontSize: 52,
                color: C.ochre,
                fontWeight: 800,
              }}
            >
              ←
            </div>
          )}
          <div style={{ fontSize: 28, color: C.muted, marginTop: 6 }}>
            марха́бан — «привет». Читаем от правого края!
          </div>
        </div>
      </FactCard>
      <FactCard at={95} icon="🔤" title="28 букв — и никаких заглавных" />
      <FactCard at={140} icon="🔗" title="Буквы соединяются">
        <div style={{ display: 'flex', gap: 44, marginTop: 14 }}>
          {forms.map((x, i) => {
            const s = pop(f, fps, 165 + i * 15);
            return (
              <div key={x} style={{ textAlign: 'center', transform: `scale(${s})` }}>
                <div style={{ fontFamily: amiri, fontSize: 96, color: C.green, direction: 'rtl' }}>{x}</div>
                <div style={{ fontSize: 24, color: C.muted }}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
      </FactCard>
      <FactCard at={215} icon="✒️" title="Гласные — значки над и под буквой">
        <div style={{ fontSize: 28, color: C.muted, marginTop: 4 }}>
          называются «огласовки» — увидите их через минуту
        </div>
      </FactCard>
    </Shell>
  );
};

// ---------- 3. буквы ----------

const LETTERS = [
  {
    glyph: 'ا', grow: true, dots: [], name: 'а́лиф', sound: 'долгая «аа»',
    note: 'своего согласного звука нет — просто тянет гласную',
    word: 'بَاب', wordTr: 'ба-а-б', wordRu: 'алиф в середине тянет «аа»',
  },
  {
    glyph: 'ب', dotless: 'ٮ', dots: [{ dx: 0, dy: 0.30 }], name: 'ба', sound: 'звук «б»',
    note: 'одна точка ПОД буквой',
    word: 'بَاب', wordTr: 'бааб', wordRu: 'дверь',
  },
  {
    glyph: 'ت', dotless: 'ٮ', dots: [{ dx: -0.09, dy: -0.33 }, { dx: 0.09, dy: -0.33 }],
    name: 'та', sound: 'звук «т»', note: 'две точки НАД буквой',
    word: 'تَاج', wordTr: 'таадж', wordRu: 'корона',
  },
  {
    glyph: 'ث', dotless: 'ٮ', dots: [{ dx: -0.1, dy: -0.3 }, { dx: 0.1, dy: -0.3 }, { dx: 0, dy: -0.44 }],
    name: 'са', sound: 'межзубный «с» — как th в think', note: 'три точки НАД буквой',
    word: 'ثَوْب', wordTr: 'сауб', wordRu: 'одежда',
  },
];

const LetterScene = ({ glyph, dotless, dots, grow, name, sound, note, word, wordTr, wordRu, idx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const FS = 430;
  const base = pop(f, fps, 10, 15);
  const fade = interpolate(f, [95, 115], [0, 1], clamp);
  const wordReveal = interpolate(f, [168, 198], [100, 0], clamp);
  return (
    <Shell dur={240}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: i === idx ? 44 : 16, height: 16, borderRadius: 10,
              background: i === idx ? C.gold : 'rgba(242,231,206,0.4)',
            }}
          />
        ))}
        <span style={{ fontSize: 26, fontWeight: 800, color: 'rgba(242,231,206,0.9)', marginLeft: 12 }}>
          БУКВА {idx + 1} / 4
        </span>
      </div>

      <div style={{ position: 'relative', width: 700, height: 600, marginTop: 10 }}>
        {/* бесточечная заготовка + летящие точки */}
        {dotless && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', opacity: 1 - fade,
            }}
          >
            <span style={{ fontFamily: amiri, fontSize: FS, color: C.green, direction: 'rtl', transform: `scale(${base})` }}>
              {dotless}
            </span>
            {dots.map((d, i) => {
              const s = pop(f, fps, 50 + i * 14);
              const fromX = d.dx >= 0 ? 420 : -420;
              const x = d.dx * FS + (1 - s) * fromX;
              const y = d.dy * FS - (1 - s) * 320;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute', left: '50%', top: '50%', width: 46, height: 46,
                    borderRadius: '50%', background: C.green, opacity: s,
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                />
              );
            })}
          </div>
        )}
        {/* настоящая буква */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', opacity: dotless ? fade : 1,
          }}
        >
          <span
            style={{
              fontFamily: amiri, fontSize: FS, color: C.green, direction: 'rtl',
              transform: grow ? `scaleY(${base})` : `scale(${dotless ? 1 : base})`,
              transformOrigin: 'center bottom', display: 'inline-block',
            }}
          >
            {glyph}
          </span>
        </div>
      </div>

      <Card at={120} style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 86, fontWeight: 800, color: C.ochre }}>{name}</span>
        <span style={{ fontSize: 40, fontWeight: 600, marginLeft: 30 }}>{sound}</span>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>{note}</div>
      </Card>

      <Card at={162} style={{ textAlign: 'center', marginTop: 26 }}>
        <div
          style={{
            fontFamily: amiri, direction: 'rtl', fontSize: 125, color: C.green,
            clipPath: `inset(0 0 0 ${wordReveal}%)`, lineHeight: 1.45,
          }}
        >
          {word}
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.ochre, minHeight: 48 }}>
          {typed(wordTr, f, 195, 14, fps)}
        </div>
        <div style={{ fontSize: 32, color: C.muted, opacity: interpolate(f, [210, 224], [0, 1], clamp) }}>
          {wordRu}
        </div>
      </Card>
    </Shell>
  );
};

// ---------- 4. огласовки ----------

const HARAKAT = [
  { s: 'بَ', tr: 'ба', nm: 'фатха', d: 'чёрточка НАД буквой → «а»' },
  { s: 'بِ', tr: 'би', nm: 'кясра', d: 'чёрточка ПОД буквой → «и»' },
  { s: 'بُ', tr: 'бу', nm: 'дамма', d: 'завиток сверху → «у»' },
];

const HarakatOne = ({ s, tr, nm, d }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = pop(f, fps, 6, 14);
  const op = interpolate(f, [0, 8, 100, 110], [0, 1, 1, 0], clamp);
  return (
    <div style={{ opacity: op, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: amiri, direction: 'rtl', fontSize: 400, color: C.green,
          lineHeight: 1.25, transform: `scale(${sc})`,
        }}
      >
        {s}
      </div>
      <div style={{ background: C.paper, border: `3px solid ${C.olive}`, outline: '2px solid rgba(138,90,43,0.45)', outlineOffset: -12, borderRadius: 24, padding: '26px 60px', textAlign: 'center', boxShadow: '0 16px 44px rgba(42,42,30,0.30)' }}>
        <span style={{ fontSize: 46, fontWeight: 800, color: C.ochre }}>{nm}</span>
        <span style={{ fontSize: 58, fontWeight: 800, color: C.green, marginLeft: 34 }}>
          {typed(`«${tr}»`, f, 24, 12, fps)}
        </span>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 6 }}>{d}</div>
      </div>
    </div>
  );
};

const GridCell = ({ g, tr, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, fps, at, 16);
  return (
    <div style={{ textAlign: 'center', transform: `scale(${s})` }}>
      <div style={{ fontFamily: amiri, direction: 'rtl', fontSize: 130, color: C.green, lineHeight: 1.35 }}>{g}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: C.ochre }}>{tr}</div>
    </div>
  );
};

const Harakat = () => {
  const grid = ['بَ', 'بِ', 'بُ', 'تَ', 'تِ', 'تُ', 'ثَ', 'ثِ', 'ثُ'];
  const trs = ['ба', 'би', 'бу', 'та', 'ти', 'ту', 'са', 'си', 'су'];
  return (
    <Shell dur={480}>
      <H at={6} size={78}>Огласовки: а · и · у</H>
      <div style={{ position: 'relative', width: '100%', flex: 1, marginTop: 10 }}>
        {HARAKAT.map((h, i) => (
          <Sequence key={h.nm} from={35 + i * 108} durationInFrames={112} layout="none">
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center' }}>
              <HarakatOne {...h} />
            </div>
          </Sequence>
        ))}
        <Sequence from={362} durationInFrames={118} layout="none">
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
            <div
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24,
                background: C.paper, border: `3px solid ${C.olive}`,
                outline: '2px solid rgba(138,90,43,0.45)', outlineOffset: -12,
                borderRadius: 30, padding: 40,
                boxShadow: '0 16px 44px rgba(42,42,30,0.30)',
              }}
            >
              {grid.map((g, i) => (
                <GridCell key={g} g={g} tr={trs[i]} at={8 + i * 5} />
              ))}
            </div>
          </div>
        </Sequence>
      </div>
    </Shell>
  );
};

// ---------- 5. первое слово ----------

const WordScene = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = [
    { ch: 'ب', x: 230, at: 20, fromX: 650, fromY: 0 },
    { ch: 'ا', x: 40, at: 55, fromX: 0, fromY: -520 },
    { ch: 'ب', x: -210, at: 90, fromX: -650, fromY: 0 },
  ];
  const trio = interpolate(f, [128, 146], [1, 0], clamp);
  const lig = interpolate(f, [132, 150], [0, 1], clamp);
  const fatha = interpolate(f, [168, 184], [0, 1], clamp);
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, f - 250) / 5) * (f > 250 ? 1 : 0);
  return (
    <Shell dur={300}>
      <H at={6} size={78}>Собираем первое слово</H>
      <div style={{ fontSize: 34, color: 'rgba(242,231,206,0.92)', marginTop: 14, opacity: slide(f, fps, 14), textShadow: '0 2px 10px rgba(42,42,30,0.35)' }}>
        ب + ا + ب — читаем справа налево
      </div>
      <div style={{ position: 'relative', width: '100%', height: 640, marginTop: 20 }}>
        {parts.map((p, i) => {
          const s = pop(f, fps, p.at, 15);
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: '50%', top: '42%', opacity: s * trio,
                fontFamily: amiri, direction: 'rtl', fontSize: 270, color: C.olive,
                transform: `translate(calc(-50% + ${p.x + (1 - s) * p.fromX}px), calc(-50% + ${(1 - s) * p.fromY}px))`,
              }}
            >
              {p.ch}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: '42%', textAlign: 'center',
            transform: `translateY(-50%) scale(${0.92 + lig * 0.08})`, opacity: lig,
          }}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontFamily: amiri, direction: 'rtl', fontSize: 380, color: C.green, opacity: 1 - fatha }}>
              باب
            </span>
            <span
              style={{
                position: 'absolute', left: 0, top: 0, width: '100%',
                fontFamily: amiri, direction: 'rtl', fontSize: 380, color: C.green, opacity: fatha,
              }}
            >
              بَاب
            </span>
          </span>
        </div>
      </div>
      <Card at={196} style={{ textAlign: 'center', transform: `scale(${pulse})` }}>
        <span style={{ fontSize: 52, fontWeight: 800, color: C.ochre }}>
          {typed('бааб', f, 200, 10, fps)}
        </span>
        <span
          style={{
            fontSize: 56, fontWeight: 800, color: C.green, marginLeft: 36,
            opacity: interpolate(f, [228, 242], [0, 1], clamp),
          }}
        >
          дверь 🚪
        </span>
      </Card>
    </Shell>
  );
};

// ---------- 6. финал ----------

const Outro = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    { t: 'Четыре буквы: ا · ب · ت · ث', at: 55 },
    { t: 'Огласовки: а · и · у', at: 80 },
    { t: 'Первое слово: بَاب — дверь', at: 105 },
  ];
  const bar = interpolate(f, [150, 200], [0, 1 / 60], clamp);
  return (
    <Shell dur={300}>
      <div style={{ marginTop: 40 }}>
        <Kicker at={8}>ИТОГИ</Kicker>
      </div>
      <H at={16} size={96}>Урок 1 пройден! 🎉</H>
      <Card at={40} style={{ marginTop: 50 }}>
        {rows.map((r) => {
          const s = pop(f, fps, r.at, 14);
          return (
            <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '18px 0', opacity: Math.min(1, s * 1.2) }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%', background: C.green, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34, fontWeight: 800, transform: `scale(${s})`,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 40, fontWeight: 600 }}>{r.t}</div>
            </div>
          );
        })}
      </Card>
      <Card at={135} style={{ marginTop: 30, textAlign: 'center', background: C.green, color: C.cream, border: `3px solid ${C.gold}` }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.14em', opacity: 0.85 }}>ДАЛЬШЕ · УРОК 2</div>
        <div style={{ fontFamily: amiri, direction: 'rtl', fontSize: 120, lineHeight: 1.4 }}>ج · ح · خ</div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>три новые буквы и первый значок тишины — сукун</div>
      </Card>
      <div style={{ width: '100%', marginTop: 44 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 800, color: 'rgba(242,231,206,0.92)' }}>
          <span>прогресс курса</span>
          <span>урок 1 из 60</span>
        </div>
        <div style={{ height: 18, background: 'rgba(242,231,206,0.28)', borderRadius: 10, marginTop: 10 }}>
          <div style={{ height: '100%', width: `${Math.max(2.5, bar * 100)}%`, background: C.gold, borderRadius: 10 }} />
        </div>
      </div>
      <div style={{ marginTop: 'auto', fontSize: 28, color: 'rgba(242,231,206,0.9)', opacity: interpolate(f, [235, 255], [0, 1], clamp) }}>
        каждый кадр нарисован кодом · Remotion × Клауди ♥
      </div>
    </Shell>
  );
};

// ---------- сборка ----------

export const Lesson1 = () => {
  return (
    <AbsoluteFill style={{ fontFamily: manrope }}>
      <Bg />
      <Sequence from={0} durationInFrames={180}>
        <Intro />
      </Sequence>
      <Sequence from={180} durationInFrames={300}>
        <Writing />
      </Sequence>
      {LETTERS.map((L, i) => (
        <Sequence key={L.name} from={480 + i * 240} durationInFrames={240}>
          <LetterScene {...L} idx={i} />
        </Sequence>
      ))}
      <Sequence from={1440} durationInFrames={480}>
        <Harakat />
      </Sequence>
      <Sequence from={1920} durationInFrames={300}>
        <WordScene />
      </Sequence>
      <Sequence from={2220} durationInFrames={300}>
        <Outro />
      </Sequence>
      <TopBar />
      <Audio src={staticFile('music.wav')} volume={0.5} />
    </AbsoluteFill>
  );
};
