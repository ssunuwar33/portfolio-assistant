/**
 * The character: a cartoon portrait drawn in SVG (short brown bob, big brown
 * eyes, freckles, cream collared shirt). Same props and emotions as <Robot>,
 * so RobotAssistant can use either one (see `robot.character` in the config).
 *
 * Coordinates use the same 200 × 230 box as the robot.
 * Skin, hair, eye and shirt colors are in the PALETTE object below.
 */
import { useEffect, useId, useRef } from 'react';
import { motion, useAnimationControls, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { Effects } from './Robot';
import { emotionColor } from './RobotFace';
import type { Emotion } from './types';

const PALETTE = {
  skin: '#f6cbb2',
  skinLight: '#fde2d2',
  skinShadow: '#e4a88c',
  skinDeep: '#cf8f74',
  hair: '#4a2b1d',
  hairDark: '#2b170f',
  hairShine: '#7c4c34',
  brow: '#3a2216',
  lash: '#22130b',
  irisLight: '#c98a4a',
  iris: '#8e4f22',
  irisDark: '#4a2410',
  pupil: '#1a0d06',
  lips: '#dc8a82',
  lipsDark: '#b45f58',
  mouth: '#6e2a2a',
  tongue: '#e57580',
  blush: '#f2867f',
  freckle: '#c98166',
  shirt: '#f5e8da',
  shirtShadow: '#dcc3a9',
  shirtLine: '#c9ad91',
};

const P = PALETTE;
const EYE_L = { x: 79, y: 105 };
const EYE_R = { x: 121, y: 105 };
const OPEN_EYES: Emotion[] = ['idle', 'listening', 'thinking', 'talking', 'confused', 'excited', 'love', 'dizzy'];
const BLINKABLE: Emotion[] = ['idle', 'listening', 'talking', 'excited', 'confused'];
const HEART = 'M0 7 C -9 0 -11 -6 -6 -9 C -3 -11 0 -9 0 -6 C 0 -9 3 -11 6 -9 C 11 -6 9 0 0 7 Z';
const SPIRAL = 'M0 0 a1.6 1.6 0 0 1 3.2 0 a3.2 3.2 0 0 1 -6.4 0 a4.8 4.8 0 0 1 9.6 0 a6.4 6.4 0 0 1 -12.8 0';
const SPARKLE = 'M0 -6 Q0.8 -0.8 6 0 Q0.8 0.8 0 6 Q-0.8 0.8 -6 0 Q-0.8 -0.8 0 -6Z';

const pop = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 520, damping: 24 },
} as const;

/** Writes a motion value straight to an SVG `transform` attribute (no re-renders). */
function useSvgTransform(value: MotionValue<string>) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const apply = (v: string) => ref.current?.setAttribute('transform', v);
    apply(value.get());
    return value.on('change', apply);
  }, [value]);
  return ref;
}

/* ── Brows ───────────────────────────────────────────────────────────────── */
type BrowPose = { y: number; rotate: number };
const BROWS: Partial<Record<Emotion, [BrowPose, BrowPose]>> = {
  listening: [{ y: -3, rotate: 0 }, { y: -3, rotate: 0 }],
  thinking: [{ y: 1, rotate: 7 }, { y: -6, rotate: -4 }],
  talking: [{ y: -1, rotate: 0 }, { y: -1, rotate: 0 }],
  happy: [{ y: -3, rotate: -3 }, { y: -3, rotate: 3 }],
  confused: [{ y: -6, rotate: -6 }, { y: 1, rotate: -9 }],
  sleeping: [{ y: 3, rotate: 0 }, { y: 3, rotate: 0 }],
  excited: [{ y: -7, rotate: 0 }, { y: -7, rotate: 0 }],
  love: [{ y: -4, rotate: -5 }, { y: -4, rotate: 5 }],
  dizzy: [{ y: -2, rotate: -14 }, { y: -2, rotate: 14 }],
  yawning: [{ y: -5, rotate: -4 }, { y: -5, rotate: 4 }],
};

function Brow({ side, emotion, still }: { side: 'l' | 'r'; emotion: Emotion; still: boolean }) {
  const pose = (BROWS[emotion] ?? [{ y: 0, rotate: 0 }, { y: 0, rotate: 0 }])[side === 'l' ? 0 : 1];
  const d = side === 'l' ? 'M -15 4 Q -4 -7 14 -1' : 'M -14 -1 Q 4 -7 15 4';
  return (
    <g transform={`translate(${side === 'l' ? 78 : 122} 85)`}>
      <motion.path
        d={d} fill="none" stroke={P.brow} strokeWidth={5.6} strokeLinecap="round"
        animate={pose}
        transition={still ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
      />
    </g>
  );
}

/* ── Eyes ────────────────────────────────────────────────────────────────── */
function Eye({ side, emotion, irisRef, uid, still }: {
  side: 'l' | 'r'; emotion: Emotion; irisRef: React.RefObject<SVGGElement>; uid: string; still: boolean;
}) {
  const pos = side === 'l' ? EYE_L : EYE_R;
  const mirror = side === 'r' ? 'scale(-1 1)' : undefined; // lashes flick outward on both sides
  const clip = `eye-${uid}-${side}`;

  if (!OPEN_EYES.includes(emotion)) {
    let lines: JSX.Element;
    if (emotion === 'happy') {
      lines = <>
        <path d="M -13 4 Q 0 -10 13 4" fill="none" stroke={P.lash} strokeWidth={3.4} strokeLinecap="round" />
        <path d="M -12 2 L -17 -1" stroke={P.lash} strokeWidth={2.2} strokeLinecap="round" />
      </>;
    } else if (emotion === 'sleeping') {
      lines = <>
        <path d="M -13 -1 Q 0 9 13 -1" fill="none" stroke={P.lash} strokeWidth={3.2} strokeLinecap="round" />
        {['M -8 4 l -1.5 4', 'M 0 6 l 0 4.5', 'M 8 4 l 1.5 4'].map((l) => <path key={l} d={l} stroke={P.lash} strokeWidth={1.6} strokeLinecap="round" />)}
      </>;
    } else { // yawning: squeezed shut
      lines = <path d="M -11 -6 L 5 0 L -11 6" fill="none" stroke={P.lash} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />;
    }
    return (
      <g transform={`translate(${pos.x} ${pos.y})`}>
        <motion.g key={emotion} {...(still ? {} : pop)}><g transform={mirror}>{lines}</g></motion.g>
      </g>
    );
  }

  const scale =
    emotion === 'excited' ? { scale: 1.12, scaleY: 1 }
      : emotion === 'listening' ? { scale: 1.06, scaleY: 1 }
      : emotion === 'thinking' ? { scaleY: 0.8, scale: 1 }
      : emotion === 'confused' ? (side === 'r' ? { scaleY: 0.68, scale: 1 } : { scale: 1.08, scaleY: 1 })
      : { scale: 1, scaleY: 1 };

  return (
    <g transform={`translate(${pos.x} ${pos.y})`}>
      <motion.g animate={scale} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <defs>
          <clipPath id={clip}><ellipse rx={15} ry={13.5} /></clipPath>
          <radialGradient id={`${clip}-iris`}>
            <stop offset="0" stopColor={P.irisLight} />
            <stop offset="0.65" stopColor={P.iris} />
            <stop offset="1" stopColor={P.irisDark} />
          </radialGradient>
        </defs>
        <ellipse rx={15} ry={13.5} fill="#fffaf6" />
        <g clipPath={`url(#${clip})`}>
          <g ref={irisRef}>
            {emotion === 'love' ? (
              <g transform="scale(1.15)">
                <motion.path
                  d={HEART} fill="#ff4f86"
                  animate={still ? undefined : { scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                />
              </g>
            ) : emotion === 'dizzy' ? (
              <motion.path
                d={SPIRAL} fill="none" stroke={P.iris} strokeWidth={2.2} strokeLinecap="round"
                animate={still ? undefined : { rotate: side === 'l' ? 360 : -360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              />
            ) : (
              <>
                <circle r={10.6} fill={`url(#${clip}-iris)`} stroke={P.irisDark} strokeWidth={1} />
                <circle r={5.2} fill={P.pupil} />
                <circle cx={3.8} cy={-4.2} r={3} fill="#fff" />
                <circle cx={-3.2} cy={3.4} r={1.2} fill="#fff" opacity={0.8} />
                {emotion === 'excited' && <path d={SPARKLE} fill="#fff" transform="translate(-4 -4) scale(0.55)" />}
              </>
            )}
          </g>
          {/* Upper-lid shadow */}
          <ellipse cy={-11} rx={15.5} ry={5} fill={P.skinShadow} opacity={0.3} />
        </g>
        <g transform={mirror}>
          <path d="M -16 -2 Q -11 -13 1 -14.2 Q 11 -14 15.5 -6" fill="none" stroke={P.lash} strokeWidth={3.6} strokeLinecap="round" />
          <path d="M -15.5 -3 L -21 -6" stroke={P.lash} strokeWidth={2.3} strokeLinecap="round" />
          <path d="M -13.5 -8 L -17.5 -12.5" stroke={P.lash} strokeWidth={2.1} strokeLinecap="round" />
          <path d="M -9 12.5 Q 0 15 9 12.5" fill="none" stroke={P.skinDeep} strokeWidth={1} opacity={0.3} />
        </g>
      </motion.g>
    </g>
  );
}

/* ── Mouth ───────────────────────────────────────────────────────────────── */
function Mouth({ emotion, still }: { emotion: Emotion; still: boolean }) {
  const closedSmile = (
    <>
      <path d="M -14 -2 Q -7 -6 0 -3.5 Q 7 -6 14 -2 Q 7 9 0 9 Q -7 9 -14 -2 Z" fill={P.lips} />
      <path d="M -13.5 -1.5 Q 0 3.5 13.5 -1.5" fill="none" stroke={P.lipsDark} strokeWidth={1.3} strokeLinecap="round" />
      <ellipse cx={0} cy={5} rx={5} ry={1.4} fill="#fff" opacity={0.25} />
    </>
  );
  const openSmile = (
    <>
      <path d="M -14 -2 Q 0 0 14 -2 Q 12 13 0 14 Q -12 13 -14 -2 Z" fill={P.mouth} />
      <path d="M -11 -1 Q 0 0.5 11 -1 L 10 2.5 Q 0 4 -10 2.5 Z" fill="#fff" />
      <ellipse cx={0} cy={10} rx={6} ry={3} fill={P.tongue} />
      <path d="M -14 -2 Q 0 0 14 -2" fill="none" stroke={P.lipsDark} strokeWidth={1.4} strokeLinecap="round" />
    </>
  );
  let shape: JSX.Element;
  switch (emotion) {
    case 'talking':
      shape = (
        <motion.g
          animate={still ? undefined : { scaleY: [0.35, 1, 0.55, 0.9, 0.4, 0.8, 0.35] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
        >
          <ellipse rx={8} ry={6} fill={P.mouth} />
          <ellipse cy={3} rx={4.5} ry={2.2} fill={P.tongue} />
          <ellipse rx={8} ry={6} fill="none" stroke={P.lipsDark} strokeWidth={1.6} />
        </motion.g>
      );
      break;
    case 'happy':
    case 'love':
    case 'excited':
      shape = openSmile;
      break;
    case 'thinking':
      shape = <g transform="translate(5 1)"><path d="M -5 0 Q 1 -3 6 0 Q 1 4 -5 0 Z" fill={P.lips} /></g>;
      break;
    case 'confused':
    case 'dizzy':
      shape = <path d="M -10 1 Q -5 -3 0 1 Q 5 5 10 1" fill="none" stroke={P.lipsDark} strokeWidth={2.4} strokeLinecap="round" />;
      break;
    case 'sleeping':
      shape = <path d="M -5 0 Q 0 3 5 0" fill="none" stroke={P.lipsDark} strokeWidth={2} strokeLinecap="round" />;
      break;
    case 'yawning':
      shape = (
        <motion.g animate={still ? undefined : { scaleY: [0.4, 1.1, 0.9, 0.4] }} transition={{ duration: 1.3, ease: 'easeInOut' }}>
          <ellipse rx={7.5} ry={10} fill={P.mouth} />
          <ellipse cy={5} rx={4.5} ry={3} fill={P.tongue} />
        </motion.g>
      );
      break;
    default:
      shape = closedSmile;
  }
  return <motion.g key={emotion} {...(still ? {} : pop)}>{shape}</motion.g>;
}

/* ── Waving hand ─────────────────────────────────────────────────────────── */
function Hand({ waving, still }: { waving: boolean; still: boolean }) {
  return (
    <g transform="translate(168 196)">
      <motion.g
        initial={false}
        animate={waving && !still
          ? { y: 0, opacity: 1, rotate: [0, -18, 14, -18, 14, 0] }
          : { y: 60, opacity: 0, rotate: 0 }}
        transition={waving ? { duration: 1.2, ease: 'easeInOut', y: { type: 'spring', stiffness: 260, damping: 18 } } : { duration: 0.3 }}
        style={{ originX: 0.5, originY: 0.85 }}
      >
        <rect x={-11} y={10} width={22} height={40} rx={7} fill={P.shirt} stroke={P.shirtLine} strokeWidth={1} />
        {[{ x: -10, h: 13 }, { x: -4.5, h: 16 }, { x: 1, h: 16 }, { x: 6.5, h: 13 }].map((f) => (
          <rect key={f.x} x={f.x} y={-6 - f.h} width={5} height={f.h + 6} rx={2.5} fill={P.skin} stroke={P.skinShadow} strokeWidth={0.8} />
        ))}
        <rect x={-17} y={-8} width={5.5} height={13} rx={2.75} fill={P.skin} stroke={P.skinShadow} strokeWidth={0.8} transform="rotate(-35 -14 0)" />
        <ellipse rx={11} ry={11.5} cy={1} fill={P.skin} stroke={P.skinShadow} strokeWidth={0.8} />
      </motion.g>
    </g>
  );
}

/* ── Full drawing (used by the big character and the chat-header avatar) ── */
export interface CharacterArtProps {
  emotion: Emotion;
  lookX?: MotionValue<number>;
  lookY?: MotionValue<number>;
  waving?: boolean;
  still?: boolean;
  showEffects?: boolean;
}

export function CharacterArt({ emotion, lookX, lookY, waving = false, still = false, showEffects = true }: CharacterArtProps) {
  const zx = useMotionValue(0);
  const zy = useMotionValue(0);
  const lx = lookX ?? zx;
  const ly = lookY ?? zy;
  const uid = useId().replace(/:/g, '');

  // Parallax: head turns around the neck, features slide a bit more, pupils most.
  const headT = useTransform([lx, ly], ([x, y]: number[]) => `translate(${x * 3} ${y * 2}) rotate(${x * 6} 100 176)`);
  const bodyT = useTransform(lx, (x) => `rotate(${x * 2} 100 230)`);
  const faceT = useTransform([lx, ly], ([x, y]: number[]) => `translate(${x * 4} ${y * 3})`);
  const irisT = useTransform([lx, ly], ([x, y]: number[]) => `translate(${x * 3.6} ${y * 3})`);
  const headBackRef = useSvgTransform(headT);
  const headRef = useSvgTransform(headT);
  const bodyRef = useSvgTransform(bodyT);
  const faceRef = useSvgTransform(faceT);
  const irisL = useSvgTransform(irisT);
  const irisR = useSvgTransform(irisT);

  // Blinking.
  const blink = useAnimationControls();
  const blinkable = BLINKABLE.includes(emotion);
  useEffect(() => {
    if (!blinkable || still) return;
    let t: number;
    let alive = true;
    const loop = () => {
      t = window.setTimeout(async () => {
        if (!alive) return;
        await blink.start({ scaleY: [1, 0.06, 1], transition: { duration: 0.18 } });
        if (alive && Math.random() < 0.2) await blink.start({ scaleY: [1, 0.06, 1], transition: { duration: 0.15 } });
        if (alive) loop();
      }, 2400 + Math.random() * 3600);
    };
    loop();
    return () => { alive = false; clearTimeout(t); };
  }, [blinkable, still, blink]);

  const blushStrong = emotion === 'happy' || emotion === 'love' || emotion === 'excited';
  const hairFront =
    'M 38 104 C 36 60 62 28 100 27 C 140 27 166 58 162 104 C 161 126 160 148 158 166 C 154 156 151 136 148 118 ' +
    'C 149 100 149 88 143 79 C 130 64 106 64 84 52 C 72 60 62 72 57 90 C 54 108 52 132 48 160 C 42 146 39 124 38 104 Z';

  return (
    <g>
      <defs>
        <radialGradient id={`face-${uid}`} cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor={P.skinLight} />
          <stop offset="0.7" stopColor={P.skin} />
          <stop offset="1" stopColor={P.skinShadow} />
        </radialGradient>
        <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={P.hair} />
          <stop offset="1" stopColor={P.hairDark} />
        </linearGradient>
        <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.shirt} />
          <stop offset="1" stopColor={P.shirtShadow} />
        </linearGradient>
        <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.82" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`mask-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="230">
          <rect width="200" height="230" fill={`url(#fade-${uid})`} />
        </mask>
        <linearGradient id={`hfade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.86" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`handmask-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="250">
          <rect width="240" height="250" fill={`url(#hfade-${uid})`} />
        </mask>
        <filter id={`soft-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Hair behind the head */}
      <g ref={headBackRef}>
        <path
          d="M 100 26 C 58 26 34 54 34 96 C 34 126 36 150 40 168 C 48 175 64 176 78 170 L 122 170 C 136 176 152 175 160 168 C 164 150 166 126 166 96 C 166 54 142 26 100 26 Z"
          fill={`url(#hair-${uid})`}
        />
      </g>

      {/* Neck, shoulders, collar (fades out at the bottom) */}
      <g ref={bodyRef} mask={`url(#mask-${uid})`}>
        <path d="M 88 140 L 88 178 C 94 183 106 183 112 178 L 112 140 Z" fill={P.skin} />
        <path d="M 88 142 Q 100 166 112 142 L 112 140 L 88 140 Z" fill={P.skinShadow} />
        <path d="M 32 232 C 34 200 60 182 86 175 L 114 175 C 140 182 166 200 168 232 Z" fill={`url(#shirt-${uid})`} />
        <path d="M 89 173 L 100 206 L 111 173 Z" fill={P.skinShadow} />
        <path d="M 88 169 L 66 199 L 98 196 Z" fill={P.shirt} stroke={P.shirtLine} strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M 112 169 L 134 199 L 102 196 Z" fill={P.shirt} stroke={P.shirtLine} strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M 100 206 L 100 232" stroke={P.shirtLine} strokeWidth={1.2} />
        <circle cx={100} cy={216} r={2.6} fill={P.shirt} stroke={P.shirtLine} strokeWidth={1} />
        {[[56, 214], [74, 224], [144, 214], [126, 224], [46, 228], [154, 228], [64, 202], [136, 202]].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={2.6} ry={3.4} fill="none" stroke={P.shirtLine} strokeWidth={0.9} opacity={0.8} />
        ))}
      </g>
      {/* Waving hand rises from below; only its sleeve fades out */}
      <g mask={`url(#handmask-${uid})`}>
        <Hand waving={waving} still={still} />
      </g>

      {/* Head */}
      <g ref={headRef}>
        {/* Face */}
        <path d="M 52 96 C 52 60 74 42 100 42 C 126 42 148 60 148 96 C 148 128 130 152 100 155 C 70 152 52 128 52 96 Z" fill={`url(#face-${uid})`} />
        {/* Soft shadow the fringe casts on the forehead */}
        <path d={hairFront} transform="translate(0 4)" fill={P.skinDeep} opacity={0.28} filter={`url(#soft-${uid})`} />

        {/* Features */}
        <g ref={faceRef}>
          <motion.ellipse
            cx={70} cy={126} rx={12} ry={7.5} fill={P.blush} filter={`url(#soft-${uid})`}
            animate={{ opacity: blushStrong ? 0.6 : 0.32 }}
          />
          <motion.ellipse
            cx={130} cy={126} rx={12} ry={7.5} fill={P.blush} filter={`url(#soft-${uid})`}
            animate={{ opacity: blushStrong ? 0.6 : 0.32 }}
          />
          {[[88, 120], [84, 123], [91, 124], [112, 120], [116, 123], [109, 124], [96, 117], [104, 117]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={0.75} fill={P.freckle} opacity={0.65} />
          ))}
          <Brow side="l" emotion={emotion} still={still} />
          <Brow side="r" emotion={emotion} still={still} />
          <motion.g animate={blink} style={{ originY: 0.5 }}>
            <Eye side="l" emotion={emotion} irisRef={irisL} uid={uid} still={still} />
            <Eye side="r" emotion={emotion} irisRef={irisR} uid={uid} still={still} />
          </motion.g>
          {/* Nose */}
          <ellipse cx={100} cy={126} rx={6.5} ry={4.8} fill={P.skinShadow} opacity={0.55} />
          <ellipse cx={96.2} cy={128.2} rx={1.7} ry={1} fill={P.skinDeep} />
          <ellipse cx={103.8} cy={128.2} rx={1.7} ry={1} fill={P.skinDeep} />
          <circle cx={101.2} cy={123.4} r={1.7} fill="#fff" opacity={0.55} />
          <g transform="translate(100 141)"><Mouth emotion={emotion} still={still} /></g>
        </g>

        {/* Hair in front: side part, fringe sweeping across the forehead */}
        <path d={hairFront} fill={`url(#hair-${uid})`} />
        <path d="M 86 32 C 114 32 144 50 154 96" fill="none" stroke={P.hairDark} strokeWidth={1.4} opacity={0.5} />
        <path d="M 80 36 C 60 50 46 80 46 124" fill="none" stroke={P.hairDark} strokeWidth={1.4} opacity={0.5} />
        <path d="M 92 40 C 114 48 134 58 144 78" fill="none" stroke={P.hairShine} strokeWidth={4} strokeLinecap="round" opacity={0.35} />
        <path d="M 70 40 C 58 52 50 70 48 90" fill="none" stroke={P.hairShine} strokeWidth={3} strokeLinecap="round" opacity={0.3} />

        {/* Ears + earrings */}
        {[52, 148].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={110} rx={7} ry={11} fill={P.skin} />
            <ellipse cx={x + (x < 100 ? 1 : -1)} cy={110} rx={3.2} ry={6} fill={P.skinShadow} />
            <circle cx={x} cy={121} r={2.3} fill="#fff" stroke="#c9c9d2" strokeWidth={0.8} />
          </g>
        ))}
        {showEffects && <Effects emotion={emotion} color={emotionColor(emotion)} still={still} />}
      </g>
    </g>
  );
}

/* ── Big character with floating + glow ──────────────────────────────────── */
export interface CharacterProps {
  emotion: Emotion;
  size?: number;
  lookX?: MotionValue<number>;
  lookY?: MotionValue<number>;
  waving?: boolean;
  reducedMotion?: boolean;
}

export function Character({ emotion, size = 200, lookX, lookY, waving = false, reducedMotion = false }: CharacterProps) {
  const asleep = emotion === 'sleeping';
  return (
    <div className="relative select-none" style={{ width: size, height: size * 1.15 }} aria-hidden="true">
      {/* Soft glow behind */}
      <div
        className="absolute inset-[8%] rounded-full"
        style={{ background: `radial-gradient(closest-side, ${emotionColor(emotion)}33, transparent)` }}
      />
      <motion.div
        className="absolute inset-0"
        animate={reducedMotion ? undefined : { y: asleep ? [0, -size * 0.01, 0] : [0, -size * 0.025, 0] }}
        transition={{ repeat: Infinity, duration: asleep ? 5 : 3.6, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 200 230" width="100%" height="100%" overflow="visible">
          <CharacterArt emotion={emotion} lookX={lookX} lookY={lookY} waving={waving} still={reducedMotion} />
        </svg>
      </motion.div>
    </div>
  );
}

/** Round face avatar for the chat header. */
export function CharacterAvatar({ emotion, size = 40, still }: { emotion: Emotion; size?: number; still?: boolean }) {
  const id = `av-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="40 30 120 120" aria-hidden="true">
      <defs><clipPath id={id}><circle cx={100} cy={90} r={60} /></clipPath></defs>
      <circle cx={100} cy={90} r={60} fill="#efe4f7" />
      <g clipPath={`url(#${id})`}>
        <CharacterArt emotion={emotion} still={still} showEffects={false} />
      </g>
      <circle cx={100} cy={90} r={59} fill="none" stroke={emotionColor(emotion)} strokeOpacity={0.6} strokeWidth={2.5} />
    </svg>
  );
}
