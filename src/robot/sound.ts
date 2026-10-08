/**
 * Sound effects, synthesized live with the Web Audio API (no audio files).
 *
 * Browsers only allow sound after the visitor's first click, tap or key press,
 * so `unlockAudio()` is wired to the first interaction. Before that, sounds
 * are skipped silently.
 *
 * TO TWEAK: each effect is a few notes in the `switch` inside playSfx().
 * Frequencies are in Hz, durations in seconds. MASTER_VOLUME scales everything.
 */
export type Sfx =
  | 'hover' | 'open' | 'close' | 'send' | 'think' | 'reply' | 'babble'
  | 'wave' | 'whoosh' | 'boing' | 'giggle' | 'love' | 'dizzy'
  | 'grab' | 'drop' | 'sleep' | 'yawn' | 'confused' | 'toggle';

const MASTER_VOLUME = 0.7;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a click/tap/keydown handler: browsers start audio only after a gesture. */
export function unlockAudio() {
  const a = audio();
  if (a && a.state === 'suspended') void a.resume();
}

/** Listens for the visitor's first interaction and unlocks audio. Returns a cleanup. */
export function unlockOnFirstGesture(): () => void {
  const events = ['pointerdown', 'keydown', 'touchstart'] as const;
  const handler = () => {
    unlockAudio();
    events.forEach((e) => window.removeEventListener(e, handler));
  };
  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
  return () => events.forEach((e) => window.removeEventListener(e, handler));
}

/** One note: pitch glides from f0 to f1 with a soft attack and decay. */
function tone(f0: number, f1: number, dur: number, { delay = 0, type = 'sine' as OscillatorType, vol = 0.1 } = {}) {
  const a = audio();
  if (!a || !master || a.state !== 'running') return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** Filtered noise burst, used for the "whoosh". */
function noise(dur: number, { delay = 0, from = 400, to = 3000, vol = 0.12 } = {}) {
  const a = audio();
  if (!a || !master || a.state !== 'running') return;
  const t = a.currentTime + delay;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  filter.frequency.exponentialRampToValueAtTime(from, t + dur);
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function playSfx(name: Sfx) {
  switch (name) {
    case 'hover': // soft, high "ding"
      return tone(1320, 1760, 0.09, { vol: 0.05 });
    case 'open': // rising two-note pop
      tone(520, 780, 0.08, { vol: 0.09 });
      return tone(780, 1170, 0.1, { delay: 0.07, vol: 0.08 });
    case 'close': // falling two-note
      tone(780, 620, 0.08, { vol: 0.07 });
      return tone(620, 440, 0.1, { delay: 0.07, vol: 0.06 });
    case 'send': // quick "fwip"
      return tone(600, 1200, 0.07, { type: 'triangle', vol: 0.08 });
    case 'think': // curious "hmm?" (two soft notes, second higher)
      tone(392, 392, 0.14, { type: 'triangle', vol: 0.05 });
      return tone(466, 523, 0.16, { delay: 0.16, type: 'triangle', vol: 0.05 });
    case 'reply': // bright little chime
      tone(988, 988, 0.08, { vol: 0.06 });
      return tone(1319, 1319, 0.12, { delay: 0.07, vol: 0.05 });
    case 'babble': // one syllable of "talking", randomly pitched
      return tone(rand(420, 720), rand(380, 760), rand(0.035, 0.06), { type: 'triangle', vol: 0.045 });
    case 'wave': // cheerful "hi-i!"
      tone(660, 880, 0.08, { vol: 0.08 });
      return tone(880, 1175, 0.12, { delay: 0.09, vol: 0.08 });
    case 'whoosh': // spin
      return noise(0.45, { vol: 0.14 });
    case 'boing': // jump
      tone(180, 520, 0.18, { type: 'triangle', vol: 0.11 });
      return tone(520, 300, 0.22, { delay: 0.18, type: 'triangle', vol: 0.08 });
    case 'giggle': // tee-hee-hee
      [0, 1, 2, 3].forEach((i) => tone(880 + i * 90, 1040 + i * 90, 0.06, { delay: i * 0.075, vol: 0.06 }));
      return;
    case 'love': // warm two-note sigh
      tone(523, 659, 0.14, { vol: 0.08 });
      return tone(659, 784, 0.22, { delay: 0.13, vol: 0.07 });
    case 'dizzy': // wobbly falling notes
      for (let i = 0; i < 6; i++) tone(900 - i * 80, 760 - i * 80, 0.1, { delay: i * 0.1, type: 'square', vol: 0.025 });
      return;
    case 'grab':
      return tone(500, 900, 0.08, { type: 'triangle', vol: 0.07 });
    case 'drop': // gentle landing
      tone(700, 420, 0.12, { vol: 0.07 });
      return tone(420, 330, 0.1, { delay: 0.12, vol: 0.05 });
    case 'sleep': // drowsy descending
      tone(500, 300, 0.35, { vol: 0.05 });
      return tone(300, 200, 0.45, { delay: 0.35, vol: 0.04 });
    case 'yawn': // long rising-then-falling glide
      tone(260, 520, 0.45, { vol: 0.06 });
      return tone(520, 330, 0.4, { delay: 0.45, vol: 0.05 });
    case 'confused': // "huh?"
      tone(440, 400, 0.1, { type: 'triangle', vol: 0.06 });
      return tone(400, 560, 0.16, { delay: 0.11, type: 'triangle', vol: 0.06 });
    case 'toggle':
      return tone(1046, 1318, 0.08, { vol: 0.07 });
  }
}

/* ── Remembered mute choice (per visitor, optional) ───────────────────────── */
const KEY = 'paru-sound-muted';
export function loadMuted(fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}
export function saveMuted(muted: boolean) {
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* storage blocked: fine */ }
}
