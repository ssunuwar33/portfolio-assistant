import { motion } from 'framer-motion';

interface Props {
  options: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  reducedMotion?: boolean;
}

/** Tappable suggestion chips. Wraps on desktop, scrolls sideways on phones. */
export function QuickReplies({ options, onPick, disabled, reducedMotion }: Props) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Suggested questions">
      {options.map((opt, i) => (
        <motion.button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(opt)}
          initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 500, damping: 26 }}
          whileHover={reducedMotion ? undefined : { y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 cursor-pointer rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-fg transition-colors hover:border-primary/70 hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
