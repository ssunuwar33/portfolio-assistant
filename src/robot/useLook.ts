import { useEffect, useRef, type RefObject } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';

export interface LookTarget { x: number; y: number }

/**
 * Where the robot is looking, as two smoothed values in the range -1..1.
 *
 * - Follows the mouse (or a finger while touching), relative to the robot.
 * - Pointer events are throttled to one update per animation frame, and the
 *   robot's position is cached so we never force layout on every move.
 * - When the pointer has been still for a while, the robot glances around.
 * - `override` pins the gaze (e.g. looking up while thinking).
 * - `enabled: false` (reduced motion) keeps the gaze centered.
 */
export function useLook(
  ref: RefObject<HTMLElement>,
  { enabled, override }: { enabled: boolean; override: LookTarget | null },
): { lookX: MotionValue<number>; lookY: MotionValue<number> } {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const lookX = useSpring(rawX, { stiffness: 140, damping: 18, mass: 0.6 });
  const lookY = useSpring(rawY, { stiffness: 140, damping: 18, mass: 0.6 });

  const overrideRef = useRef(override);
  overrideRef.current = override;

  // Apply / release an override immediately.
  useEffect(() => {
    if (override) {
      rawX.set(override.x);
      rawY.set(override.y);
    }
  }, [override?.x, override?.y]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    let rect: DOMRect | null = null;
    let frame = 0;
    let px = 0;
    let py = 0;
    let lastMove = 0;
    const measure = () => { if (ref.current) rect = ref.current.getBoundingClientRect(); };
    measure();

    const update = () => {
      frame = 0;
      if (overrideRef.current || !rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.4; // roughly eye level
      // tanh gives a soft falloff: big reaction nearby, saturating far away.
      rawX.set(Math.tanh((px - cx) / (window.innerWidth * 0.35)));
      rawY.set(Math.tanh((py - cy) / (window.innerHeight * 0.35)));
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Idle glances: when the pointer is still (or on touch devices), look around.
    let glanceTimer: number;
    const glance = () => {
      if (!overrideRef.current && performance.now() - lastMove > 3500) {
        const center = Math.random() < 0.35;
        rawX.set(center ? 0 : (Math.random() * 2 - 1) * 0.8);
        rawY.set(center ? 0 : (Math.random() * 2 - 1) * 0.45);
      }
      glanceTimer = window.setTimeout(glance, 2200 + Math.random() * 3200);
    };
    glanceTimer = window.setTimeout(glance, 3000);

    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(glanceTimer);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [enabled, ref, rawX, rawY]);

  return { lookX, lookY };
}
