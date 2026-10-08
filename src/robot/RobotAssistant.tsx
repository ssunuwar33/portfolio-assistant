/**
 * <RobotAssistant /> — the robot + its behaviour + the chat, in one component.
 *
 *   <RobotAssistant placement="widget" />   floating bottom-right on every page
 *   <RobotAssistant placement="hero" />     big centerpiece inside your hero section
 *
 * Behaviour summary
 *   • Eyes/head follow the cursor (touch on phones, idle glances otherwise)
 *   • Hover: perks up + "Hi!"      • Click: random reaction (+ opens chat)
 *   • 5 quick clicks: dizzy        • Drag: carry it around, it floats home
 *   • 30s idle: sleeps, wakes with a yawn on any activity
 *   • Enter on the robot opens chat, Esc closes it
 */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { animate, motion, useAnimationControls, useMotionValue, useReducedMotion } from 'framer-motion';
import { portfolio } from '../config/portfolio.config';
import { ChatPanel } from './ChatPanel';
import { ChatIcon, SoundOffIcon, SoundOnIcon } from './icons';
import { Mascot } from './Mascot';
import { loadMuted, playSfx, saveMuted, unlockAudio, unlockOnFirstGesture, type Sfx } from './sound';
import { timeGreeting } from './greeting';
import { SpeechBubble } from './SpeechBubble';
import { useChat } from './useChat';
import { useLook, type LookTarget } from './useLook';
import { useMediaQuery } from './useMediaQuery';
import type { BotReply, Emotion, Placement } from './types';

export interface RobotAssistantProps {
  placement?: Placement;
  /** Hero only: which side of the robot the chat panel opens on (desktop). */
  panelSide?: 'left' | 'right';
  /** Robot width in px. Defaults: hero 260, widget 120 (smaller on phones). */
  size?: number;
  /** Force a face (useful for previews). Interaction keeps working. */
  debugEmotion?: Emotion | null;
  /** Hero only: content shown above the robot (e.g. your role). It moves with
   *  the robot when the chat opens, so the panel never covers it. */
  heading?: ReactNode;
}

type Reaction = 'wave' | 'spin' | 'jump' | 'happy' | 'love';

const REACTIONS: Record<Reaction, { emotion: Emotion; lines: string[]; sfx: Sfx }> = {
  wave: { emotion: 'happy', lines: ['Hey hey!', 'Hello, human!'], sfx: 'wave' },
  spin: { emotion: 'excited', lines: ['Wheee, a spin!', 'Did you see that?'], sfx: 'whoosh' },
  jump: { emotion: 'happy', lines: ['Boing!', 'Up I go!'], sfx: 'boing' },
  happy: { emotion: 'happy', lines: ['That tickles!', 'Hehe, beep boop.'], sfx: 'giggle' },
  love: { emotion: 'love', lines: ['Aww, I like you too.', 'You make my circuits warm.'], sfx: 'love' },
};

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function RobotAssistant({ placement = 'widget', panelSide = 'left', size, debugEmotion = null, heading }: RobotAssistantProps) {
  const reduce = useReducedMotion() ?? false;
  const isSm = useMediaQuery('(min-width: 640px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const hero = placement === 'hero';
  const robotSize = size ?? (hero ? (isSm ? 260 : 200) : isSm ? 120 : 96);
  // Phones (and tablets in hero mode) get the bottom sheet.
  const variant = (hero ? isLg : isSm) ? 'float' : 'sheet';

  const panelId = `robot-chat-${useId().replace(/:/g, '')}`;
  const robotRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [chatOpen, setChatOpen] = useState(false);
  const [muted, setMuted] = useState(() => loadMuted(!portfolio.robot.soundOnByDefault));
  useEffect(() => saveMuted(muted), [muted]);
  // Browsers allow sound only after the first click/tap/key press.
  useEffect(() => unlockOnFirstGesture(), []);
  const toggleMute = useCallback(() => {
    unlockAudio();
    setMuted((m) => {
      if (m) window.setTimeout(() => playSfx('toggle'), 30);
      return !m;
    });
  }, []);
  const [sleeping, setSleeping] = useState(false);
  const [transient, setTransient] = useState<Emotion | null>(null);
  const [hovered, setHovered] = useState(false);
  const [typing, setTyping] = useState(false);
  const [waving, setWaving] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const sleepingRef = useRef(sleeping);
  sleepingRef.current = sleeping;
  const dizzyRef = useRef(false);
  const timers = useRef<Record<string, number>>({});
  const reaction = useAnimationControls();

  const sfx = useCallback((name: Sfx) => { if (!mutedRef.current) playSfx(name); }, []);

  const after = (key: string, ms: number, fn: () => void) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(fn, ms);
  };
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  /** Show an emotion for a moment, then fall back to the computed one. */
  const flash = useCallback((e: Emotion, ms = 1400) => {
    setTransient(e);
    after('flash', ms, () => setTransient(null));
  }, []);

  /** Pop a speech bubble above the robot. */
  const say = useCallback((text: string, ms = 2000) => {
    setBubble({ text, id: Date.now() });
    after('bubble', ms, () => setBubble(null));
  }, []);

  /* ── Chat ──────────────────────────────────────────────────────────────── */
  const onReplyDone = useCallback((r: BotReply) => {
    if (r.mood === 'happy') flash('happy', 1500);
    if (r.mood === 'confused') { flash('confused', 2000); sfx('confused'); }
  }, [flash, sfx]);
  const chat = useChat({ reducedMotion: reduce, onReplyDone, onSfx: sfx });

  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;
  const openChat = useCallback(() => {
    if (!chatOpenRef.current && chat.messages.length === 0) chat.greet();
    setChatOpen(true);
    sfx('open');
    // Focus the input once the panel has animated in.
    after('focus', reduce ? 0 : 280, () => inputRef.current?.focus({ preventScroll: true }));
  }, [chat, sfx, reduce]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    sfx('close');
    robotRef.current?.focus({ preventScroll: true });
  }, [sfx]);

  // Esc closes the chat from anywhere on the page.
  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') closeChat(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, closeChat]);

  /* ── Sleep / wake ──────────────────────────────────────────────────────── */
  const lastActivity = useRef(performance.now());
  const wake = useCallback(() => {
    setSleeping(false);
    lastActivity.current = performance.now();
    flash('yawning', 1500);
    say('*yaaawn* …oh! Hi there.', 2200);
    sfx('yawn');
  }, [flash, say, sfx]);

  useEffect(() => {
    const onActivity = () => {
      lastActivity.current = performance.now();
      if (sleepingRef.current) wake();
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    const check = window.setInterval(() => {
      const idleFor = performance.now() - lastActivity.current;
      if (!sleepingRef.current && chat.phase === 'idle' && idleFor > portfolio.robot.sleepAfterSeconds * 1000) {
        setSleeping(true);
        setBubble(null);
        sfx('sleep');
      }
    }, 1000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearInterval(check);
    };
  }, [wake, sfx, chat.phase]);

  /* ── Emotion + gaze ────────────────────────────────────────────────────── */
  const emotion: Emotion =
    debugEmotion ??
    (sleeping ? 'sleeping'
      : transient ? transient
      : chat.phase === 'thinking' ? 'thinking'
      : chat.phase === 'talking' ? 'talking'
      : hovered ? 'excited'
      : chatOpen && typing ? 'listening'
      : 'idle');

  const lookOverride: LookTarget | null =
    emotion === 'thinking' ? { x: 0.55, y: -0.75 }
      : emotion === 'sleeping' ? { x: 0, y: 0.45 }
      : emotion === 'listening' && chatOpen ? (variant === 'sheet' ? { x: 0, y: 0.6 } : hero ? { x: panelSide === 'left' ? -0.6 : 0.6, y: 0 } : { x: -0.3, y: -0.6 })
      : null;
  const { lookX, lookY } = useLook(robotRef, { enabled: !reduce, override: lookOverride });

  /* ── Reactions ─────────────────────────────────────────────────────────── */
  const react = useCallback(async (kind: Reaction) => {
    const r = REACTIONS[kind];
    flash(r.emotion, 1500);
    say(pick(r.lines), 1800);
    sfx(r.sfx);
    if (kind === 'wave') { setWaving(true); after('wave', 1200, () => setWaving(false)); }
    if (reduce) return;
    const s = robotSize;
    switch (kind) {
      case 'wave': await reaction.start({ rotate: [0, -5, 5, -3, 0], transition: { duration: 0.9 } }); break;
      case 'spin': await reaction.start({ rotate: [0, 360], transition: { duration: 0.75, ease: [0.6, 0, 0.3, 1] } }); reaction.set({ rotate: 0 }); break;
      case 'jump': await reaction.start({ y: [0, -s * 0.3, 0, -s * 0.06, 0], scaleY: [1, 1.06, 0.9, 1.02, 1], scaleX: [1, 0.95, 1.08, 0.99, 1], transition: { duration: 0.9, ease: 'easeOut' } }); break;
      case 'happy': await reaction.start({ scale: [1, 1.14, 0.95, 1], transition: { duration: 0.6 } }); break;
      case 'love': await reaction.start({ scale: [1, 1.08, 1, 1.08, 1], transition: { duration: 0.9 } }); break;
    }
  }, [flash, say, sfx, reaction, reduce, robotSize]);

  const goDizzy = useCallback(async () => {
    dizzyRef.current = true;
    flash('dizzy', 2800);
    say('Whoa… slow down, the room is spinning!', 2600);
    sfx('dizzy');
    if (!reduce) {
      await reaction.start({
        rotate: [0, -16, 14, -11, 9, -6, 3, 0],
        x: [0, -8, 8, -6, 5, -3, 0],
        transition: { duration: 2.4, ease: 'easeInOut' },
      });
    }
    after('undizzy', reduce ? 2800 : 400, () => {
      dizzyRef.current = false;
      flash('confused', 1300);
      say("Okay… I'm okay.", 1500);
    });
  }, [flash, say, sfx, reaction, reduce]);

  /* ── Pointer handlers ──────────────────────────────────────────────────── */
  const clicks = useRef<number[]>([]);
  const lastHoverSound = useRef(0);
  const dragged = useRef(false);
  const lastReaction = useRef<Reaction | null>(null);

  const onClick = () => {
    if (dragged.current) return;
    if (sleepingRef.current) { wake(); return; }
    if (dizzyRef.current) return;

    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1600), now];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      void goDizzy();
      return;
    }

    const options = (Object.keys(REACTIONS) as Reaction[]).filter((r) => r !== lastReaction.current);
    const kind = pick(options);
    lastReaction.current = kind;
    void react(kind);
    if (portfolio.robot.openChatOnClick && !chatOpen) after('open', 650, openChat);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sleepingRef.current) wake();
      if (chatOpen) inputRef.current?.focus();
      else openChat();
    }
  };

  // Drag: the robot follows the pointer, then floats back home on release.
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const onDragStart = () => {
    dragged.current = true;
    flash('excited', 60000);
    say('Wheee!', 60000);
    sfx('grab');
  };
  const onDragEnd = () => {
    const spring = reduce
      ? { duration: 0.2 }
      : { type: 'spring' as const, stiffness: 60, damping: 9, mass: 1.2 };
    animate(dragX, 0, spring);
    animate(dragY, 0, spring);
    flash('happy', 1600);
    say('Floating home…', 1600);
    sfx('drop');
  };

  /* ── Initial hello ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (sleepingRef.current) return;
      setWaving(true);
      after('wave', 1200, () => setWaving(false));
      flash('happy', 1600);
      say(`${timeGreeting()}! I'm ${portfolio.robot.name}. Ask me about ${portfolio.firstName}!`, 3600);
    }, 1400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Render ────────────────────────────────────────────────────────────── */
  const robotButton = (
    <motion.button
      ref={robotRef}
      type="button"
      className="robot-hit relative block cursor-grab touch-none rounded-[40%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:cursor-grabbing"
      aria-label={`${portfolio.robot.name}, ${portfolio.firstName}'s assistant. Press Enter to chat.`}
      aria-haspopup="dialog"
      aria-expanded={chatOpen}
      aria-controls={chatOpen ? panelId : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerDown={() => { dragged.current = false; }}
      onHoverStart={() => {
        if (sleepingRef.current) return;
        setHovered(true);
        if (!dizzyRef.current) say('Hi!', 1400);
        const now = performance.now();
        if (now - lastHoverSound.current > 1200) { lastHoverSound.current = now; sfx('hover'); }
      }}
      onHoverEnd={() => setHovered(false)}
      drag
      dragMomentum={false}
      dragElastic={0.9}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ x: dragX, y: dragY }}
      whileHover={reduce || sleeping ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
    >
      {/* Bubble lives inside the button so it travels with the robot while dragged. */}
      <SpeechBubble text={bubble?.text ?? null} id={bubble?.id ?? 0} align={hero ? 'center' : 'end'} reducedMotion={reduce} />
      <motion.div animate={reaction}>
        <Mascot emotion={emotion} size={robotSize} lookX={lookX} lookY={lookY} waving={waving} reducedMotion={reduce} />
      </motion.div>
    </motion.button>
  );

  const muteButton = (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
      title={muted ? 'Sound off' : 'Sound on'}
      className="icon-btn glass"
    >
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
    </button>
  );

  const chatButton = (
    <motion.button
      type="button"
      onClick={chatOpen ? closeChat : openChat}
      aria-expanded={chatOpen}
      aria-controls={chatOpen ? panelId : undefined}
      whileTap={{ scale: 0.95 }}
      className="chat-cta"
    >
      <ChatIcon className="text-[17px]" />
      {chatOpen ? 'Close chat' : 'Ask about Subash'}
    </motion.button>
  );

  const panel = (
    <ChatPanel
      ref={inputRef}
      id={panelId}
      open={chatOpen}
      variant={variant}
      floatClassName={
        hero
          ? // Spans the full height of the heading + robot + buttons column.
            `top-0 bottom-0 min-h-[440px] ${panelSide === 'left' ? 'right-full mr-6' : 'left-full ml-6'}`
          : 'bottom-full right-0 mb-3 h-[min(560px,calc(100dvh-200px))]'
      }
      origin={hero ? (panelSide === 'left' ? 'right center' : 'left center') : 'bottom right'}
      messages={chat.messages}
      phase={chat.phase}
      emotion={emotion}
      announcement={chat.announcement}
      muted={muted}
      reducedMotion={reduce}
      onSend={chat.send}
      onClose={closeChat}
      onToggleMute={toggleMute}
      onTypingChange={setTyping}
    />
  );

  if (hero) {
    // When the side panel opens, slide the robot over so robot + panel stay centered together.
    const PANEL_AND_GAP = 380 + 24;
    const shift = chatOpen && variant === 'float' ? (panelSide === 'right' ? -1 : 1) * (PANEL_AND_GAP / 2) : 0;
    return (
      <motion.div
        className="relative flex flex-col items-center gap-5"
        animate={{ x: shift }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 170, damping: 24 }}
      >
        {heading && <div className="mb-[4.5rem] text-center">{heading}</div>}
        <div className="relative">{robotButton}</div>
        <div className="flex items-center gap-2">
          {chatButton}
          {muteButton}
        </div>
        {panel}
      </motion.div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-end gap-2 pb-[env(safe-area-inset-bottom,0px)] sm:right-6 sm:bottom-6">
      {!chatOpen && (
        <motion.div
          className="mb-3 flex flex-col items-end gap-2"
          initial={reduce ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {muteButton}
          {chatButton}
        </motion.div>
      )}
      <div className="relative">
        {robotButton}
        {variant === 'float' && panel}
      </div>
      {variant === 'sheet' && panel}
    </div>
  );
}
