/**
 * The robot's face: eyes, mouth and cheeks, drawn inside the screen.
 * Coordinates use a 112 × 82 box (the size of the face screen).
 *
 * To restyle an emotion, edit its case in <Eye> and <Mouth> below.
 * Colors come from `theme.emotionColors` in portfolio.config.ts.
 */
import { useEffect, useId } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { portfolio } from '../config/portfolio.config';
import type { Emotion } from './types';

export const FACE_W = 112;
export const FACE_H = 82;
const EYE_L = { x: 36, y: 36 };
const EYE_R = { x: 76, y: 36 };
const MOUTH = { x: 56, y: 60 };

const BLINKABLE: Emotion[] = ['idle', 'listening', 'talking', 'excited'];

export const emotionColor = (e: Emotion) => portfolio.theme.emotionColors[e];

const pop = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 520, damping: 22 },
} as const;

const HEART = 'M0 7 C -9 0 -11 -6 -6 -9 C -3 -11 0 -9 0 -6 C 0 -9 3 -11 6 -9 C 11 -6 9 0 0 7 Z';
const SPIRAL = 'M0 0 a2 2 0 0 1 4 0 a4 4 0 0 1 -8 0 a6 6 0 0 1 12 0 a8 8 0 0 1 -16 0';

function Eye({ emotion, side, color, still }: { emotion: Emotion; side: 'l' | 'r'; color: string; still: boolean }) {
  const shine = <circle cx={3} cy={-5} r={2.3} fill="#fff" opacity={0.85} />;
  let shape: JSX.Element;
  switch (emotion) {
    case 'listening':
      shape = <><rect x={-9} y={-13} width={18} height={26} rx={9} fill={color} />{shine}</>;
      break;
    case 'excited':
      shape = (
        <>
          <circle r={12.5} fill={color} />
          <circle cx={4} cy={-4} r={3.6} fill="#fff" opacity={0.9} />
          <circle cx={-3.5} cy={4.5} r={1.6} fill="#fff" opacity={0.7} />
        </>
      );
      break;
    case 'thinking':
      shape = <rect x={-8} y={-5} width={16} height={side === 'l' ? 9 : 11} rx={4.5} fill={color} />;
      break;
    case 'happy':
      shape = <path d="M-10 4 Q0 -11 10 4" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />;
      break;
    case 'confused':
      shape = side === 'l'
        ? <><circle r={10} fill={color} /><circle cx={3} cy={-3} r={2.4} fill="#fff" opacity={0.85} /></>
        : <rect x={-9} y={-3} width={18} height={6} rx={3} fill={color} />;
      break;
    case 'sleeping':
      shape = <path d="M-10 -1 Q0 7 10 -1" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />;
      break;
    case 'yawning':
      shape = (
        <path
          d={side === 'l' ? 'M-8 -6 L6 0 L-8 6' : 'M8 -6 L-6 0 L8 6'}
          fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
        />
      );
      break;
    case 'dizzy':
      shape = (
        <motion.path
          d={SPIRAL} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round"
          animate={still ? undefined : { rotate: side === 'l' ? 360 : -360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
      );
      break;
    case 'love':
      shape = (
        <g transform="scale(1.35)">
          <motion.path
            d={HEART} fill={color}
            animate={still ? undefined : { scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
          />
        </g>
      );
      break;
    default: // idle, talking
      shape = <><rect x={-8} y={-11} width={16} height={22} rx={8} fill={color} />{shine}</>;
  }
  return <motion.g key={emotion} {...(still ? {} : pop)}>{shape}</motion.g>;
}

function Mouth({ emotion, color, still }: { emotion: Emotion; color: string; still: boolean }) {
  const line = (d: string, w = 3) => <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />;
  let shape: JSX.Element;
  switch (emotion) {
    case 'talking':
      shape = (
        <motion.ellipse
          rx={6.5} ry={4.5} fill={color}
          animate={still ? undefined : { scaleY: [0.3, 1, 0.5, 0.9, 0.35, 0.8, 0.3], scaleX: [1, 0.85, 1, 0.9, 1, 0.9, 1] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
        />
      );
      break;
    case 'happy':
    case 'love':
      shape = <path d="M-10 -3 Q0 12 10 -3 Z" fill={color} />;
      break;
    case 'excited':
      shape = <ellipse rx={4.5} ry={5} fill={color} />;
      break;
    case 'listening':
      shape = line('M-5 0 Q0 3.5 5 0');
      break;
    case 'thinking':
      shape = <g transform="translate(7 0)">{line('M-5 1 L5 -1.5')}</g>;
      break;
    case 'confused':
    case 'dizzy':
      shape = line('M-9 1 Q-4.5 -3 0 1 Q4.5 5 9 1', 2.6);
      break;
    case 'sleeping':
      shape = (
        <motion.circle
          r={2.6} fill={color}
          animate={still ? undefined : { scale: [0.8, 1.25, 0.8] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        />
      );
      break;
    case 'yawning':
      shape = (
        <motion.ellipse
          rx={6} ry={8} fill={color}
          animate={still ? undefined : { scaleY: [0.4, 1.1, 0.9, 0.4] }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
        />
      );
      break;
    default:
      shape = line('M-7 0 Q0 5 7 0');
  }
  return <motion.g key={emotion} {...(still ? {} : pop)}>{shape}</motion.g>;
}

export interface RobotFaceProps {
  emotion: Emotion;
  /** Disable all face animation (reduced motion or static previews). */
  still?: boolean;
}

/** Renders as an SVG <g>; place it inside an <svg viewBox="0 0 112 82">. */
export function RobotFace({ emotion, still = false }: RobotFaceProps) {
  const color = emotionColor(emotion);
  const glowId = `glow-${useId().replace(/:/g, '')}`;
  const blink = useAnimationControls();
  const blinkable = BLINKABLE.includes(emotion);

  // Random blinking, sometimes a double blink.
  useEffect(() => {
    if (!blinkable || still) return;
    let t: number;
    let alive = true;
    const loop = () => {
      t = window.setTimeout(async () => {
        if (!alive) return;
        await blink.start({ scaleY: [1, 0.08, 1], transition: { duration: 0.17 } });
        if (alive && Math.random() < 0.22) {
          await blink.start({ scaleY: [1, 0.08, 1], transition: { duration: 0.15 } });
        }
        if (alive) loop();
      }, 2200 + Math.random() * 3800);
    };
    loop();
    return () => { alive = false; clearTimeout(t); };
  }, [blinkable, still, blink]);

  const blush = emotion === 'happy' || emotion === 'love' || emotion === 'excited';
  const dim = emotion === 'sleeping' ? 0.65 : 1;

  return (
    <g opacity={dim}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowId})`}>
        <motion.g animate={blink} style={{ originY: 0.5 }}>
          <g transform={`translate(${EYE_L.x} ${EYE_L.y})`}><Eye emotion={emotion} side="l" color={color} still={still} /></g>
          <g transform={`translate(${EYE_R.x} ${EYE_R.y})`}><Eye emotion={emotion} side="r" color={color} still={still} /></g>
        </motion.g>
        <g transform={`translate(${MOUTH.x} ${MOUTH.y})`}><Mouth emotion={emotion} color={color} still={still} /></g>
      </g>
      {blush && (
        <motion.g initial={still ? false : { opacity: 0 }} animate={{ opacity: 0.55 }}>
          <ellipse cx={17} cy={52} rx={7} ry={3.6} fill="#ff7eb6" />
          <ellipse cx={95} cy={52} rx={7} ry={3.6} fill="#ff7eb6" />
        </motion.g>
      )}
    </g>
  );
}

/** Small face-only avatar, used in the chat header. */
export function RobotAvatar({ emotion, size = 36, still }: { emotion: Emotion; size?: number; still?: boolean }) {
  return (
    <svg width={size} height={(size * FACE_H) / FACE_W} viewBox={`0 0 ${FACE_W} ${FACE_H}`} aria-hidden="true">
      <rect x={1} y={1} width={FACE_W - 2} height={FACE_H - 2} rx={30} fill="#0a0e1d" stroke={emotionColor(emotion)} strokeOpacity={0.45} strokeWidth={2} />
      <RobotFace emotion={emotion} still={still} />
    </svg>
  );
}
