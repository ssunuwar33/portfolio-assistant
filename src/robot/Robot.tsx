/**
 * The robot's body, drawn in SVG. Purely visual: give it an emotion and
 * (optionally) look values, and it animates itself. All interaction lives in
 * RobotAssistant.tsx, so you can also drop <Robot emotion="happy" /> anywhere.
 *
 * Layers (each is an HTML element so transforms stay on the GPU):
 *   float → body (arms, chest light) + head (antenna, shell, screen)
 *         → face (eyes/mouth, slides inside the screen) + fx (Zzz, ?, hearts)
 *
 * Shell colors are CSS variables (--robot-shell-1/2, --robot-outline) in
 * src/index.css; eye colors come from portfolio.config.ts.
 */
import { useId } from 'react';
import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { FACE_H, FACE_W, RobotFace, emotionColor } from './RobotFace';
import type { Emotion } from './types';

const VB_W = 200;
const VB_H = 230;
const SCREEN = { x: 44, y: 52, w: FACE_W, h: FACE_H, r: 30 };
const SPARKLE = 'M0 -6 Q0.8 -0.8 6 0 Q0.8 0.8 0 6 Q-0.8 0.8 -6 0 Q-0.8 -0.8 0 -6Z';
const HEART = 'M0 7 C -9 0 -11 -6 -6 -9 C -3 -11 0 -9 0 -6 C 0 -9 3 -11 6 -9 C 11 -6 9 0 0 7 Z';

export interface RobotProps {
  emotion: Emotion;
  /** Width in px; height is 1.15 × width. */
  size?: number;
  lookX?: MotionValue<number>;
  lookY?: MotionValue<number>;
  /** Plays the waving-arm animation while true. */
  waving?: boolean;
  /** Turns off floating and decorative motion. */
  reducedMotion?: boolean;
}

export function Robot({ emotion, size = 200, lookX, lookY, waving = false, reducedMotion = false }: RobotProps) {
  const zeroX = useMotionValue(0);
  const zeroY = useMotionValue(0);
  const lx = lookX ?? zeroX;
  const ly = lookY ?? zeroY;
  const uid = useId().replace(/:/g, '');
  const color = emotionColor(emotion);
  const asleep = emotion === 'sleeping';

  // Parallax: head turns a little, face slides more, body barely moves.
  const headRotate = useTransform(lx, (v) => v * 8);
  const headX = useTransform(lx, (v) => v * size * 0.02);
  const headY = useTransform(ly, (v) => v * size * 0.012);
  const faceX = useTransform(lx, (v) => v * size * 0.05);
  const faceY = useTransform(ly, (v) => v * size * 0.035);
  const bodyRotate = useTransform(lx, (v) => v * 3);

  const floatAnim = reducedMotion
    ? undefined
    : { y: asleep ? [0, -size * 0.02, 0] : [0, -size * 0.05, 0] };
  const floatTransition = { repeat: Infinity, duration: asleep ? 5 : 3.4, ease: 'easeInOut' as const };

  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  return (
    <div className="relative select-none" style={{ width: size, height: size * 1.15 }} aria-hidden="true">
      {/* Ground shadow: shrinks as the robot rises. */}
      <motion.div
        className="absolute left-1/2 rounded-[50%]"
        style={{
          width: size * 0.42, height: size * 0.07, bottom: size * 0.005, x: '-50%',
          background: 'radial-gradient(closest-side, var(--robot-shadow), transparent)',
        }}
        animate={floatAnim ? { scaleX: asleep ? [1, 0.95, 1] : [1, 0.78, 1], opacity: [0.9, 0.55, 0.9] } : undefined}
        transition={floatTransition}
      />

      <motion.div className="absolute inset-0" animate={floatAnim} transition={floatTransition}>
        {/* Body */}
        <motion.div className="absolute inset-0" style={{ rotate: bodyRotate, transformOrigin: '50% 70%' }}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" overflow="visible">
            <defs>
              <linearGradient id={`shell-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--robot-shell-1)' }} />
                <stop offset="1" style={{ stopColor: 'var(--robot-shell-2)' }} />
              </linearGradient>
            </defs>
            {/* Arms (left arm sways, right arm waves) */}
            <motion.rect
              x={42} y={156} width={15} height={32} rx={7.5} fill={`url(#shell-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5}
              style={{ originX: 0.5, originY: 0.1 }}
              animate={reducedMotion ? undefined : { rotate: [8, 14, 8] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
            />
            <motion.rect
              x={143} y={156} width={15} height={32} rx={7.5} fill={`url(#shell-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5}
              style={{ originX: 0.5, originY: 0.1 }}
              animate={waving && !reducedMotion ? { rotate: [-8, -150, -115, -150, -115, -8] } : { rotate: [-8, -14, -8] }}
              transition={waving ? { duration: 1.2, ease: 'easeInOut' } : { repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
            />
            <rect x={62} y={142} width={76} height={60} rx={28} fill={`url(#shell-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5} />
            {/* Chest light */}
            <circle cx={100} cy={180} r={9} fill="#0a0e1d" />
            <motion.circle
              cx={100} cy={180} r={5} fill={color}
              animate={reducedMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
              transition={{ repeat: Infinity, duration: asleep ? 4 : 2, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Head */}
        <motion.div
          className="absolute inset-0"
          style={{ rotate: headRotate, x: headX, y: headY, transformOrigin: '50% 62%' }}
        >
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" overflow="visible">
            <defs>
              <linearGradient id={`head-${uid}`} x1="0.1" y1="0" x2="0.4" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--robot-shell-1)' }} />
                <stop offset="1" style={{ stopColor: 'var(--robot-shell-2)' }} />
              </linearGradient>
              <linearGradient id={`screen-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#161d38" />
                <stop offset="1" stopColor="#070a16" />
              </linearGradient>
              <radialGradient id={`halo-${uid}`}>
                <stop offset="0" stopColor={color} stopOpacity={0.8} />
                <stop offset="1" stopColor={color} stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* Antenna */}
            <rect x={97} y={18} width={6} height={24} rx={3} fill="var(--robot-shell-2)" stroke="var(--robot-outline)" strokeWidth={1} />
            <motion.circle
              cx={100} cy={14} fill={`url(#halo-${uid})`}
              initial={{ r: 12, opacity: 0.6 }}
              animate={reducedMotion ? { r: 12, opacity: 0.6 } : { r: asleep ? [9, 11, 9] : [10, 17, 10], opacity: asleep ? [0.3, 0.5, 0.3] : [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: asleep ? 4 : 1.8, ease: 'easeInOut' }}
            />
            <circle cx={100} cy={14} r={6.5} fill={color} />
            <circle cx={98} cy={12} r={2} fill="#fff" opacity={0.8} />

            {/* Ears */}
            <rect x={16} y={76} width={18} height={38} rx={9} fill={`url(#head-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5} />
            <rect x={166} y={76} width={18} height={38} rx={9} fill={`url(#head-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5} />
            <rect x={21} y={88} width={4} height={14} rx={2} fill={color} opacity={0.7} />
            <rect x={175} y={88} width={4} height={14} rx={2} fill={color} opacity={0.7} />

            {/* Shell */}
            <rect x={28} y={38} width={144} height={114} rx={46} fill={`url(#head-${uid})`} stroke="var(--robot-outline)" strokeWidth={1.5} />
            <ellipse cx={66} cy={50} rx={20} ry={5.5} fill="#fff" opacity={0.45} transform="rotate(-14 66 50)" />

            {/* Screen */}
            <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r} fill={`url(#screen-${uid})`} />
            <rect
              x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r}
              fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={1.5}
            />
          </svg>

          {/* Face, clipped to the screen so eyes can't slide off it */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: pct(SCREEN.x, VB_W), top: pct(SCREEN.y, VB_H),
              width: pct(SCREEN.w, VB_W), height: pct(SCREEN.h, VB_H),
              borderRadius: `${(SCREEN.r / SCREEN.w) * 100}% / ${(SCREEN.r / SCREEN.h) * 100}%`,
            }}
          >
            <motion.div className="h-full w-full" style={{ x: faceX, y: faceY }}>
              <svg viewBox={`0 0 ${FACE_W} ${FACE_H}`} width="100%" height="100%" overflow="visible">
                <RobotFace emotion={emotion} still={reducedMotion} />
              </svg>
            </motion.div>
            {/* Screen gloss */}
            <div className="pointer-events-none absolute inset-x-[12%] top-[6%] h-[22%] rounded-full bg-white/[0.06]" />
          </div>

          {/* Effects that pop out of the head */}
          <svg className="pointer-events-none absolute inset-0" viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" overflow="visible">
            <Effects emotion={emotion} color={color} still={reducedMotion} />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Effects({ emotion, color, still }: { emotion: Emotion; color: string; still: boolean }) {
  const loop = (delay: number, duration = 2.4) => ({ repeat: Infinity, duration, delay, ease: 'easeOut' as const });

  switch (emotion) {
    case 'thinking':
      return (
        <g>
          {[{ x: 166, y: 40, r: 3 }, { x: 178, y: 26, r: 4.5 }, { x: 192, y: 10, r: 6.5 }].map((d, i) => (
            <motion.circle
              key={i} cx={d.x} cy={d.y} r={d.r} fill={color}
              animate={still ? { opacity: 0.8 } : { opacity: [0.15, 1, 0.15] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </g>
      );
    case 'confused':
      return (
        <motion.text
          x={0} y={0} fontSize={34} fontWeight={800} fill={color} fontFamily="var(--font-display)"
          style={{ originX: 0.5, originY: 0.9 }}
          initial={{ opacity: 0, x: 170, y: 52 }}
          animate={{ opacity: 1, x: 170, y: 40, rotate: still ? 0 : [0, 14, -10, 0] }}
          transition={{ duration: 0.9 }}
        >?</motion.text>
      );
    case 'sleeping':
      return (
        <g fontFamily="var(--font-display)" fontWeight={700} fill={color}>
          {[0, 1, 2].map((i) => (
            <motion.text
              key={i} x={0} y={0} fontSize={14 + i * 5}
              initial={{ opacity: 0, x: 150, y: 44 }}
              animate={still ? { opacity: 0.8, x: 152 + i * 14, y: 40 - i * 16 } : { opacity: [0, 1, 0], x: [150, 168 + i * 6], y: [44, 4 - i * 6] }}
              transition={loop(i * 0.8, 2.6)}
            >z</motion.text>
          ))}
        </g>
      );
    case 'dizzy':
      return (
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={still ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        >
          <circle cx={100} cy={30} r={46} fill="none" />
          {[0, 120, 240].map((a) => {
            const rad = (a * Math.PI) / 180;
            return <path key={a} d={SPARKLE} fill={color} transform={`translate(${100 + Math.cos(rad) * 46} ${30 + Math.sin(rad) * 14}) scale(1.3)`} />;
          })}
        </motion.g>
      );
    case 'love':
      return (
        <g>
          {[{ x: 168, d: 0 }, { x: 34, d: 0.5 }, { x: 150, d: 1 }].map((h, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, x: h.x, y: 60 }}
              animate={still ? { opacity: 1, x: h.x, y: 30 } : { opacity: [0, 1, 0], x: h.x, y: [60, 0] }}
              transition={loop(h.d, 1.8)}
            >
              <path d={HEART} fill="#ff6fb5" transform="scale(1.1)" />
            </motion.g>
          ))}
        </g>
      );
    case 'excited':
    case 'happy':
      return (
        <g>
          {[{ x: 26, y: 46 }, { x: 176, y: 52 }, { x: 160, y: 24 }].map((s, i) => (
            <g key={`${emotion}-${i}`} transform={`translate(${s.x} ${s.y})`}>
              <motion.path
                d={SPARKLE} fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={still ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                transition={{ duration: 0.9, delay: i * 0.15, repeat: emotion === 'excited' ? Infinity : 0, repeatDelay: 0.6 }}
              />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}
