/**
 * getReply(message) is the ONE function the chat calls to get an answer.
 *
 * By default it uses the local keyword knowledge base (knowledge.ts).
 *
 * TO CONNECT A REAL LLM
 *  1. Deploy server/api/chat.ts (or your own route) and set your provider key
 *     as a server environment variable, e.g. ANTHROPIC_API_KEY.
 *  2. Set `llm.endpoint` in portfolio.config.ts to that route, e.g. '/api/chat'.
 *  That's it. The browser only ever talks to YOUR endpoint, so the API key
 *  never appears in frontend code. If the endpoint fails or times out, the
 *  robot quietly falls back to the local knowledge base.
 *
 *  Rich cards still work with an LLM: when the local matcher recognises the
 *  topic (projects, contact...), its cards are attached under the LLM's text.
 */
import { portfolio } from '../config/portfolio.config';
import { fallbackReply, matchKnowledge } from './knowledge';
import type { BotReply, ChatTurn } from './types';

export async function getReply(message: string, history: ChatTurn[] = []): Promise<BotReply> {
  const local = matchKnowledge(message);

  if (portfolio.llm.endpoint) {
    try {
      const text = await askServer(message, history);
      if (text) {
        const cards = local?.attachments?.filter((a) => a.type !== 'suggestions');
        return { text, attachments: cards, mood: local?.mood ?? 'neutral' };
      }
    } catch (err) {
      console.warn('[robot] LLM endpoint failed, using local answers.', err);
    }
  }

  return local ?? fallbackReply();
}

async function askServer(message: string, history: ChatTurn[]): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), portfolio.llm.timeoutMs);
  try {
    const res = await fetch(portfolio.llm.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only the last few turns are sent to keep requests small.
      body: JSON.stringify({ message, history: history.slice(-8) }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { reply?: string };
    return (data.reply ?? '').trim();
  } finally {
    clearTimeout(timer);
  }
}
