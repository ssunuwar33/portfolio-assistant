import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  text: string | null;
  /** Changes on every new message so the pop-in replays even for the same text. */
  id: number;
  align?: 'center' | 'end';
  reducedMotion?: boolean;
}

/** The little comic-style bubble that pops out above the robot's head. */
export function SpeechBubble({ text, id, align = 'center', reducedMotion }: Props) {
  const pos = align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';
  const tail = align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-[22%]';
  return (
    <div className={`pointer-events-none absolute bottom-[calc(100%-6px)] z-10 ${pos}`} aria-hidden="true">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={id}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 4 }}
            transition={{ type: 'spring', stiffness: 560, damping: 24 }}
            style={{ transformOrigin: align === 'center' ? '50% 100%' : '78% 100%' }}
            className="glass relative w-max max-w-[220px] rounded-2xl px-3.5 py-2 text-center text-[13.5px] leading-snug font-semibold text-fg"
          >
            {text}
            <span className={`glass absolute -bottom-[7px] size-3.5 rotate-45 rounded-[3px] border-t-0 border-l-0 ${tail}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
