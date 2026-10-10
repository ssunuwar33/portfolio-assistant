/**
 * OPTIONAL: server route that lets the robot answer with a real LLM.
 *
 * The browser calls THIS route (set `llm.endpoint: '/api/chat'` in the config);
 * this route calls the model provider with a key stored as an environment
 * variable. The key never reaches frontend code.
 *
 * Written as a standard Web `Request → Response` handler, so it runs as-is on
 * Vercel (api/ folder), Netlify Functions v2, Cloudflare Workers, Deno or Bun.
 * For Express, see the adapter at the bottom.
 *
 * Setup:
 *   1. Copy .env.example to .env (or set the variable in your host's dashboard):
 *        ANTHROPIC_API_KEY=sk-ant-...
 *   2. Deploy this file as /api/chat.
 *   3. In portfolio.config.ts set llm.endpoint = '/api/chat'.
 *
 * Using a different provider? Only `callModel()` needs to change.
 */
import { portfolio } from '../../src/config/portfolio.config';
import { knowledgeAsText } from '../../src/robot/knowledge';

interface Body {
  message?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const SYSTEM_PROMPT = `You are ${portfolio.robot.name}, a small, friendly robot assistant on ${portfolio.name}'s portfolio website.
Answer visitors' questions about ${portfolio.firstName} using ONLY the facts below. If something isn't covered, say you don't know and suggest asking about projects, skills, experience or contact details.
Keep answers short (1-3 sentences), warm and a little playful. Plain text only, no markdown. Never invent projects, employers, dates or contact details.

FACTS
${knowledgeAsText()}`;

const ALLOWED_ORIGINS = (process.env.CHAT_ALLOWED_ORIGINS ?? 'https://subashsunuwar.co.uk')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const MAX_BODY_BYTES = 8 * 1024;

// Very small in-memory token bucket per IP. Good enough for a single-instance
// deployment; swap for Upstash/Vercel KV if the function scales out.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT_MAX;
}

function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get('x-forwarded-for')?.split(',')[0].trim()
    || h.get('x-real-ip')
    || h.get('cf-connecting-ip')
    || 'unknown');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const origin = req.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len && len > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);

  if (rateLimited(clientIp(req))) return json({ error: 'Too many requests' }, 429);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const message = (body.message ?? '').toString().slice(0, 500).trim();
  if (!message) return json({ error: 'Empty message' }, 400);

  // Keep only well-formed, recent turns, and cap their length.
  const history = (body.history ?? [])
    .filter((t) => (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .slice(-8)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 1000) }));

  try {
    const reply = await callModel([...history, { role: 'user', content: message }]);
    return json({ reply });
  } catch (err) {
    console.error('[api/chat]', (err as Error).message);
    // The robot falls back to its local answers when this fails.
    return json({ error: 'Upstream error' }, 502);
  }
}

async function callModel(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  // The Messages API needs the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001', // small + fast suits a chat widget
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

/* ── Express adapter (if you run a Node server instead) ─────────────────────
import express from 'express';
const app = express();
app.use(express.json());
app.post('/api/chat', async (req, res) => {
  const r = await handler(new Request('http://local/api/chat', { method: 'POST', body: JSON.stringify(req.body) }));
  res.status(r.status).json(await r.json());
});
app.listen(3000);
──────────────────────────────────────────────────────────────────────────── */
