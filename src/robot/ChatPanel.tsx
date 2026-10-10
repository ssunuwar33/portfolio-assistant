import { forwardRef, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { portfolio } from '../config/portfolio.config';
import { CloseIcon, SendIcon, SoundOffIcon, SoundOnIcon } from './icons';
import { MessageBubble } from './MessageBubble';
import { MascotAvatar } from './Mascot';
import type { ChatPhase } from './useChat';
import type { ChatMessage, Emotion } from './types';

export interface ChatPanelProps {
  id: string;
  open: boolean;
  /** 'sheet' = full-width bottom sheet (phones); 'float' = panel beside the robot. */
  variant: 'sheet' | 'float';
  /** Tailwind classes that position and size the floating panel next to the robot. */
  floatClassName?: string;
  /** Where the floating panel grows from, e.g. 'bottom right'. */
  origin?: string;
  messages: ChatMessage[];
  phase: ChatPhase;
  emotion: Emotion;
  announcement: string;
  muted: boolean;
  reducedMotion: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
  onToggleMute: () => void;
  /** Reports whether the visitor is typing, so the robot can look attentive. */
  onTypingChange: (typing: boolean) => void;
}

const statusText: Record<ChatPhase, string> = { idle: 'Online', thinking: 'Thinking…', talking: 'Typing…' };

export const ChatPanel = forwardRef<HTMLInputElement, ChatPanelProps>(function ChatPanel(props, inputRef) {
  const {
    id, open, variant, floatClassName = '', origin = 'bottom right', messages, phase, emotion, announcement,
    muted, reducedMotion, onSend, onClose, onToggleMute, onTypingChange,
  } = props;
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const busy = phase !== 'idle';
  const titleId = `${id}-title`;
  const lastBotId = [...messages].reverse().find((m) => m.from === 'bot')?.id;

  // Keep the newest message in view while replies type out.
  const visibleWordCount = messages.reduce((n, m) => n + (m.visibleWords ?? 0), 0);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages.length, visibleWordCount, phase, reducedMotion]);

  useEffect(() => onTypingChange(draft.trim().length > 0), [draft, onTypingChange]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    onSend(draft);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
  };

  const sheet = variant === 'sheet';
  const panelMotion = sheet
    ? reducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 320, damping: 34 } }
    : reducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
      : { initial: { opacity: 0, scale: 0.85, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 8 }, transition: { type: 'spring' as const, stiffness: 380, damping: 30 } };

  // Lock the body scroll while the full-screen sheet is open so touch devices don't scroll behind.
  useEffect(() => {
    if (!open || !sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, sheet]);

  return (
    <>
      {/* Screen-reader announcements: each full reply is read once (not word by word). */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{open ? announcement : ''}</div>

      <AnimatePresence>
        {open && sheet && (
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        {open && (
          <motion.section
            key="panel"
            id={id}
            role="dialog"
            aria-modal={sheet || undefined}
            aria-labelledby={titleId}
            onKeyDown={onKeyDown}
            {...panelMotion}
            style={sheet ? undefined : { transformOrigin: origin }}
            className={
              sheet
                ? 'glass fixed inset-x-0 bottom-0 z-[70] flex h-[80dvh] flex-col rounded-t-[28px] border-x-0 border-b-0 pb-[env(safe-area-inset-bottom,0px)]'
                : `glass absolute z-[70] flex w-[380px] max-w-[calc(100vw-32px)] flex-col rounded-[24px] ${floatClassName}`
            }
          >
            {sheet && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />}

            <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
              <MascotAvatar emotion={emotion} still={reducedMotion} />
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-[16px] leading-tight font-semibold text-fg">
                  {portfolio.robot.name}
                </h2>
                <p className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className={`size-1.5 rounded-full ${busy ? 'animate-pulse bg-accent' : 'bg-ok'}`} aria-hidden="true" />
                  {statusText[phase]}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={!muted}
                aria-label={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
                title={muted ? 'Sound off' : 'Sound on'}
                className="icon-btn"
              >
                {muted ? <SoundOffIcon /> : <SoundOnIcon />}
              </button>
              <button type="button" onClick={onClose} aria-label="Close chat (Esc)" title="Close (Esc)" className="icon-btn">
                <CloseIcon />
              </button>
            </header>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <ol className="flex flex-col gap-3" aria-label="Conversation">
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isLatest={m.id === lastBotId}
                    busy={busy}
                    onPick={onSend}
                    reducedMotion={reducedMotion}
                  />
                ))}
                {phase === 'thinking' && (
                  <motion.li
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-bubble px-3.5 py-3"
                    aria-label={`${portfolio.robot.name} is thinking`}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-accent"
                        animate={reducedMotion ? undefined : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={reducedMotion ? undefined : { repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                        style={reducedMotion ? { opacity: 0.8 } : undefined}
                      />
                    ))}
                  </motion.li>
                )}
              </ol>
            </div>

            <form onSubmit={submit} className="flex shrink-0 items-center gap-2 border-t border-line p-3">
              <label htmlFor={`${id}-input`} className="sr-only">Message {portfolio.robot.name}</label>
              <input
                ref={inputRef}
                id={`${id}-input`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ask about ${portfolio.firstName}…`}
                autoComplete="off"
                maxLength={300}
                className="min-w-0 flex-1 rounded-full border border-line bg-field px-4 py-2.5 text-[14px] text-fg placeholder:text-muted focus:border-primary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <motion.button
                type="submit"
                disabled={!draft.trim() || busy}
                whileTap={{ scale: 0.9 }}
                aria-label="Send message"
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-[18px] text-on-primary transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </motion.button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
});
