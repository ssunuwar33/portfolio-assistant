import type { ContactLink, ExperienceItem, Project, SkillGroup } from '../config/portfolio.config';

/** Every face the robot can make. Each one has its own eye shape and color. */
export type Emotion =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'talking'
  | 'happy'
  | 'confused'
  | 'sleeping'
  | 'excited'
  | 'love'
  | 'dizzy'
  | 'yawning';

export const EMOTIONS: Emotion[] = [
  'idle', 'listening', 'thinking', 'talking', 'happy', 'confused',
  'sleeping', 'excited', 'love', 'dizzy', 'yawning',
];

/** Rich content the robot can attach under a text reply. */
export type Attachment =
  | { type: 'projects'; projects: Project[] }
  | { type: 'contact'; links: ContactLink[] }
  | { type: 'skills'; groups: SkillGroup[] }
  | { type: 'experience'; items: ExperienceItem[] }
  | { type: 'suggestions'; options: string[] };

/** What getReply() returns. Only `text` is required. */
export interface BotReply {
  text: string;
  attachments?: Attachment[];
  /** Drives the face shown right after the reply finishes typing. */
  mood?: 'happy' | 'confused' | 'neutral';
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  attachments?: Attachment[];
  /** Bot messages type out word by word; this is how many words are visible. */
  visibleWords?: number;
  streaming?: boolean;
}

/** Minimal history shape sent to an LLM endpoint. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type Placement = 'hero' | 'widget';
