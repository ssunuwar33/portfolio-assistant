# PARU: a portfolio assistant

A small floating robot that lives on your portfolio, follows the cursor, reacts to clicks, falls asleep when ignored, and answers questions about you in a chat panel.

React + TypeScript + Tailwind CSS v4 + Framer Motion. No images, no backend required.

```bash
npm install
npm run dev      # demo page at http://localhost:5173
npm run build    # typecheck + production build
```

## Make it yours (3 files)

| What | Where |
|---|---|
| Your name, role, skills, projects, experience, contact links, robot name | `src/config/portfolio.config.ts` |
| Site colors, panel glass, robot shell colors (dark + light) | top of `src/index.css` |
| Eye/antenna color per emotion | `theme.emotionColors` in `portfolio.config.ts` |
| Character: cartoon portrait or robot | `robot.character` in `portfolio.config.ts` (`'avatar'` or `'robot'`) |
| Character's skin, hair, eye, lip and shirt colors | `PALETTE` at the top of `src/robot/Character.tsx` |

## Use it in your site

Copy `src/robot/`, `src/config/` and the token block + `.glass`/`.icon-btn`/`.chat-cta` rules from `src/index.css`, then:

```tsx
import { RobotAssistant } from './robot';

<RobotAssistant placement="widget" />                    // floating, bottom-right
<RobotAssistant placement="hero" panelSide="left" />     // big, inside your hero
```

Props: `placement` (`'hero' | 'widget'`), `panelSide` (hero only), `heading` (hero only: content above the robot, such as your role), `size` (px), `debugEmotion` (force a face).

`<Robot emotion="happy" size={120} />` renders the robot alone with no behaviour, if you want it elsewhere (a 404 page, a loader…).

## Components

```
src/robot/
  RobotAssistant.tsx  behaviour: hover, click reactions, dizzy, drag, sleep/yawn, sound, layout
  Character.tsx       SVG portrait: pupils follow the cursor, brows, blinks, waving hand, 11 moods
  Mascot.tsx          picks Character or Robot from the config
  Robot.tsx           SVG robot body: float, shadow, head tilt, arms, antenna, Zzz / ? / hearts
  RobotFace.tsx       eyes + mouth for each emotion, blinking, header avatar
  ChatPanel.tsx       glass panel (desktop) / bottom sheet (phones), a11y, Esc to close
  MessageBubble.tsx   chat bubbles + project cards, contact buttons, skills, timeline
  QuickReplies.tsx    suggestion chips
  SpeechBubble.tsx    pop-in bubble above the robot
  knowledge.ts        local keyword-matching answers
  getReply.ts         the single function the chat calls (local or LLM)
  useChat.ts          thinking → typing word-by-word state machine
  useLook.ts          throttled cursor tracking + idle glances
  sound.ts            synthesized sound effects (Web Audio): edit notes or MASTER_VOLUME here
server/api/chat.ts    optional LLM proxy that keeps the API key server-side
```

## Sound

All sounds are generated in code (no audio files) and are on by default: hover, open/close, send, a "hmm?" while thinking, a chime plus a babbling "voice" while replies type out, and a different sound for each reaction (wave, spin whoosh, jump boing, giggle, heart eyes, dizzy, drag and drop, sleep, yawn). Browsers only play sound after the visitor's first click or tap. The mute button is next to "Chat with me" and in the chat header, and each visitor's choice is remembered in their browser. To start muted, set `soundOnByDefault: false` in the config.

## Add questions and answers

- One-off answers: add `{ keywords: [...], answer: '...' }` to `customAnswers` in the config.
- Answers with cards or logic: add an intent to `intents` in `src/robot/knowledge.ts`. Phrases (with spaces) score double; the highest score wins.

## Connect a real LLM

1. Deploy `server/api/chat.ts` as `/api/chat` (Vercel, Netlify, Cloudflare, Bun, or Express via the adapter at the bottom of the file).
2. Set `LLM API KEY` as a **server** environment variable (see `.env.example`). Never prefix it with `VITE_`.
3. Set `llm.endpoint: '/api/chat'` in `portfolio.config.ts`.

The browser only talks to your route. If the route fails or times out, the robot falls back to its local answers. When the local matcher recognises the topic, its cards (projects, contact buttons) still appear under the LLM's text. To use another provider, change `callModel()` only.

## Accessibility & performance

- `prefers-reduced-motion`: no cursor tracking, floating, spins or jumps; replies appear instantly.
- Robot is a real `<button>`: Tab to focus, **Enter** opens chat, **Space** plays a reaction, **Esc** closes chat and returns focus.
- Chat is a labelled dialog; each full reply is announced once through a polite live region (not word by word).
- Animations use transforms and opacity only; pointer tracking runs at most once per frame and caches the robot's position.
- Only runtime dependencies: `react`, `react-dom`, `framer-motion`.
