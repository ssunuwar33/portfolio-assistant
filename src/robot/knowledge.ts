/**
 * Local knowledge base: turns a visitor's message into a reply using simple
 * keyword scoring. No backend, no API key, works offline.
 *
 * HOW TO ADD Q&A
 *  1. Quick one-off answers: add to `customAnswers` in portfolio.config.ts.
 *  2. Answers that need logic or cards: add an object to `intents` below.
 *     Give it keywords (single words or phrases) and a `reply()` function.
 *     The intent with the highest keyword score wins; ties go to the one
 *     listed first.
 */
import { portfolio as p, quickReplies } from '../config/portfolio.config';
import type { BotReply } from './types';
import { timeGreeting } from './greeting';

interface Intent {
  id: string;
  keywords: string[];
  reply: (message: string) => BotReply;
}

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const first = p.firstName;
const nameTokens = p.name.toLowerCase().split(/\s+/);

const jokes = [
  'Why did the neural network go to therapy? It had too many unresolved layers.',
  "I'd tell you a UDP joke, but you might not get it.",
  'There are 10 kinds of robots: those who read binary and those who float.',
  'I tried to write a joke about recursion, but first I had to write a joke about recursion.',
];

export const intents: Intent[] = [
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'yo', 'hiya', 'howdy', 'sup', 'greetings', 'namaste',
      'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening'],
    reply: (m) => {
      const hello = /namaste/i.test(m) ? 'Namaste' : timeGreeting();
      return {
        text: pick([
          `${hello}! I'm ${p.robot.name}. Want to see what ${first} has been building?`,
          `${hello}! Ask me about ${first}'s projects, skills or how to get in touch.`,
        ]),
        mood: 'happy',
        attachments: [{ type: 'suggestions', options: quickReplies }],
      };
    },
  },
  {
    id: 'about',
    keywords: ['who', 'about', 'background', 'introduce', 'bio', 'summary', 'tell me about', ...nameTokens],
    reply: () => ({
      text: `${p.name} is an ${p.role} based in ${p.location}. ${p.summary}`,
      mood: 'happy',
      attachments: [{ type: 'suggestions', options: ['Show projects', 'Experience', 'Contact'] }],
    }),
  },
  {
    id: 'projects',
    keywords: ['project', 'projects', 'portfolio', 'work', 'built', 'build', 'made', 'showcase', 'apps', 'demo', 'case study'],
    reply: () => ({
      text: `Here are some things ${first} has built:`,
      mood: 'happy',
      attachments: [{ type: 'projects', projects: p.projects }],
    }),
  },
  {
    id: 'skills',
    keywords: ['skill', 'skills', 'stack', 'tech', 'technology', 'technologies', 'tools', 'programming', 'good at', 'know', 'framework', 'python', 'sql', 'tensorflow', 'llm', 'llms', 'automation', 'machine learning', 'ml'],
    reply: () => ({
      text: `${first}'s toolbox, grouped by where it gets used:`,
      attachments: [{ type: 'skills', groups: p.skills }],
    }),
  },
  {
    id: 'experience',
    keywords: ['experience', 'job', 'jobs', 'worked', 'work experience', 'career', 'history', 'role', 'roles', 'company', 'companies', 'intern', 'internship', 'cv', 'resume', 'bizzed'],
    reply: () => ({
      text: `${first}'s work experience, most recent first:`,
      attachments: [{ type: 'experience', items: p.experience }],
    }),
  },
  {
    id: 'education',
    keywords: ['education', 'degree', 'university', 'study', 'studied', 'msc', 'masters', 'bachelor', 'qualification', 'qualifications', 'greenwich', 'college'],
    reply: () => ({
      text: `${first}'s education and certifications:`,
      attachments: [{ type: 'experience', items: p.education }],
    }),
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'mail', 'reach', 'linkedin', 'github', 'touch', 'message', 'connect', 'socials', 'talk to'],
    reply: () => ({
      text: `The best way to reach ${first} is by email, or connect on LinkedIn:`,
      mood: 'happy',
      attachments: [{ type: 'contact', links: p.contact }],
    }),
  },
  {
    id: 'hire',
    keywords: ['hire', 'hiring', 'available', 'availability', 'freelance', 'open to', 'opportunity', 'job offer', 'recruit', 'recruiter'],
    reply: () => ({
      text: `${p.availability} To talk about a role or project, get in touch:`,
      mood: 'happy',
      attachments: [{ type: 'contact', links: p.contact }],
    }),
  },
  {
    id: 'location',
    keywords: ['where', 'location', 'based', 'live', 'city', 'country', 'timezone'],
    reply: () => ({ text: `${first} is based in ${p.location}.` }),
  },
  {
    id: 'robot',
    keywords: ['who are you', 'your name', 'robot', 'are you real', 'are you ai', 'bot', p.robot.name.toLowerCase()],
    reply: () => ({
      text: `I'm ${p.robot.name}, ${first}'s pocket-sized assistant. I'm drawn entirely in code, I run on keyword matching, and I get dizzy if you click me too fast.`,
      mood: 'happy',
    }),
  },
  {
    id: 'joke',
    keywords: ['joke', 'funny', 'laugh', 'make me laugh'],
    reply: () => ({ text: pick(jokes), mood: 'happy' }),
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank you', 'cheers', 'cool', 'awesome', 'nice', 'great', 'love it', 'amazing'],
    reply: () => ({ text: pick(['Happy to help!', 'Anytime!', 'Beep boop, you are welcome.']), mood: 'happy' }),
  },
  {
    id: 'bye',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'cya'],
    reply: () => ({ text: `Bye! I'll be floating right here if you need me.`, mood: 'happy' }),
  },
];

/* ── Matching ──────────────────────────────────────────────────────────────── */

export const normalize = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Very light stemming so "projects" matches "project" and vice versa. */
const stem = (w: string) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/s$/, '');

function score(text: string, tokens: Set<string>, keywords: string[]): number {
  let total = 0;
  for (const raw of keywords) {
    const k = normalize(raw);
    if (!k) continue;
    if (k.includes(' ')) {
      if (` ${text} `.includes(` ${k} `)) total += 2; // phrases count double
    } else if (tokens.has(stem(k))) {
      total += 1;
    }
  }
  return total;
}

/** Returns the best-matching reply, or null when nothing matched. */
export function matchKnowledge(message: string): BotReply | null {
  const text = normalize(message);
  if (!text) return null;
  const tokens = new Set(text.split(' ').map(stem));

  // 1. A specific project by name or alias ("tell me about PixelSense").
  const project = p.projects.find((proj) =>
    score(text, tokens, [proj.title, ...(proj.aliases ?? [])]) > 0 ||
    text.includes(normalize(proj.title)),
  );
  // Only answer with a single project when the user isn't asking for all of them.
  if (project && !/\bprojects\b|\ball\b/.test(text)) {
    return {
      text: `${project.title}: ${project.description}`,
      mood: 'happy',
      attachments: [{ type: 'projects', projects: [project] }],
    };
  }

  // 2. Custom one-off answers from the config.
  for (const c of p.customAnswers) {
    if (score(text, tokens, c.keywords) > 0) return { text: c.answer };
  }

  // 3. Intents.
  let best: { intent: Intent; s: number } | null = null;
  for (const intent of intents) {
    const s = score(text, tokens, intent.keywords);
    if (s > 0 && (!best || s > best.s)) best = { intent, s };
  }
  return best ? best.intent.reply(message) : null;
}

/** Shown when nothing matched. */
export function fallbackReply(): BotReply {
  return {
    text: pick([
      `Hmm, my circuits don't have an answer for that one yet. Try one of these:`,
      `That's a bit outside my memory banks. I'm great at these topics though:`,
    ]),
    mood: 'confused',
    attachments: [{ type: 'suggestions', options: quickReplies }],
  };
}

/** Plain-text facts used to build an LLM system prompt (see server/api/chat.ts). */
export function knowledgeAsText(): string {
  return [
    `Name: ${p.name}`,
    `Role: ${p.headline}`,
    `Location: ${p.location}`,
    `Availability: ${p.availability}`,
    `Summary: ${p.summary}`,
    `Skills: ${p.skills.map((g) => `${g.label}: ${g.items.join(', ')}`).join(' | ')}`,
    `Projects:\n${p.projects.map((x) => `- ${x.title} (${x.context ?? ''}): ${x.description} [${x.tags.join(', ')}] ${x.link ?? ''}`).join('\n')}`,
    `Experience:\n${p.experience.map((x) => `- ${x.role}, ${x.org} (${x.period}): ${x.summary}`).join('\n')}`,
    `Education and certifications:\n${p.education.map((x) => `- ${x.role}, ${x.org} (${x.period}): ${x.summary}`).join('\n')}`,
    `Other facts:\n${p.customAnswers.map((c) => `- ${c.answer}`).join('\n')}`,
    `Contact: ${p.contact.map((c) => `${c.label}: ${c.display}`).join(', ')}`,
  ].join('\n');
}
