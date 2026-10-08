import { useCallback, useEffect, useRef, useState } from 'react';
import { portfolio, quickReplies } from '../config/portfolio.config';
import { getReply } from './getReply';
import { timeGreeting } from './greeting';
import type { Sfx } from './sound';
import type { Attachment, BotReply, ChatMessage, ChatTurn } from './types';

export type ChatPhase = 'idle' | 'thinking' | 'talking';

interface Options {
  reducedMotion: boolean;
  /** Called when a reply has finished typing out, with its mood. */
  onReplyDone?: (reply: BotReply) => void;
  onSfx?: (name: Sfx) => void;
}

let nextId = 0;
const uid = () => `m${++nextId}`;

/** Thinking time before a reply appears, so the robot doesn't feel instant-robotic. */
const THINK_MS = [650, 1150] as const;
/** Delay per word while typing out a reply. */
const WORD_MS = 42;

function describeAttachments(a?: Attachment[]): string {
  if (!a?.length) return '';
  return a
    .map((x) => {
      switch (x.type) {
        case 'projects': return ` Showing ${x.projects.length} project ${x.projects.length === 1 ? 'card' : 'cards'}: ${x.projects.map((p) => p.title).join(', ')}.`;
        case 'contact': return ` Contact options: ${x.links.map((l) => `${l.label} ${l.display}`).join(', ')}.`;
        case 'skills': return ` ${x.groups.map((g) => `${g.label}: ${g.items.join(', ')}`).join('. ')}.`;
        case 'experience': return ` ${x.items.map((i) => `${i.role} at ${i.org}, ${i.period}`).join('. ')}.`;
        case 'suggestions': return ` Suggested questions: ${x.options.join(', ')}.`;
      }
    })
    .join('');
}

/** Chat state machine: user message → thinking → reply typed word by word. */
export function useChat({ reducedMotion, onReplyDone, onSfx }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('idle');
  /** Text for the screen-reader live region (full reply, announced once). */
  const [announcement, setAnnouncement] = useState('');
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const cb = useRef({ onReplyDone, onSfx });
  cb.current = { onReplyDone, onSfx };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  /** Adds a bot message and types it out word by word. */
  const speak = useCallback((reply: BotReply) => {
    const id = uid();
    const words = reply.text.split(/\s+/).length;
    setAnnouncement(`${portfolio.robot.name}: ${reply.text}${describeAttachments(reply.attachments)}`);
    setMessages((m) => [...m, { id, from: 'bot', text: reply.text, attachments: reply.attachments, visibleWords: reducedMotion ? words : 0, streaming: true }]);
    setPhase('talking');
    cb.current.onSfx?.('reply');

    const finish = () => {
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, visibleWords: words, streaming: false } : msg)));
      setPhase('idle');
      busy.current = false;
      cb.current.onReplyDone?.(reply);
    };

    if (reducedMotion) { later(finish, 500); return; }
    let shown = 0;
    const tick = () => {
      shown += 1;
      // A little "voice": one babble syllable every other word.
      if (shown % 2 === 1) cb.current.onSfx?.('babble');
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, visibleWords: shown } : msg)));
      if (shown >= words) later(finish, 180);
      else later(tick, WORD_MS + (/[.,!?:]$/.test(reply.text.split(/\s+/)[shown - 1]) ? 140 : 0));
    };
    later(tick, WORD_MS);
  }, [reducedMotion]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy.current) return;
    busy.current = true;
    cb.current.onSfx?.('send');

    const history: ChatTurn[] = messages.map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    setMessages((m) => [...m, { id: uid(), from: 'user', text }]);
    setPhase('thinking');
    later(() => cb.current.onSfx?.('think'), 180);

    const started = performance.now();
    let reply: BotReply;
    try {
      reply = await getReply(text, history);
    } catch {
      reply = { text: 'Oops, my circuits hiccuped. Mind asking that again?', mood: 'confused' };
    }
    const minThink = THINK_MS[0] + Math.random() * (THINK_MS[1] - THINK_MS[0]);
    const wait = Math.max(0, minThink - (performance.now() - started));
    later(() => speak(reply), reducedMotion ? 0 : wait);
  }, [messages, speak, reducedMotion]);

  /** The first message when the chat opens. */
  const greet = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPhase('thinking');
    later(() => speak({
      text: `${timeGreeting()}! I'm ${portfolio.robot.name}, ${portfolio.firstName}'s assistant. Ask me anything!`,
      mood: 'happy',
      attachments: [{ type: 'suggestions', options: quickReplies }],
    }), reducedMotion ? 0 : 450);
  }, [speak, reducedMotion]);

  return { messages, phase, announcement, send, greet, busy: phase !== 'idle' };
}
