/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PORTFOLIO CONFIG — the only file you need to edit to change what PARU knows.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Filled in from Subash Sunuwar's CV. PARU's answers, project cards, contact
 *  buttons and quick-reply chips are all generated from this object.
 *
 *  • Colors      → edit `theme` below (accent color per emotion) and the CSS
 *                  variables at the top of src/index.css (site + panel colors).
 *  • Add Q&A     → add an entry to `customAnswers` below, or add a new intent
 *                  in src/robot/knowledge.ts for anything that needs logic.
 *  • Real LLM    → set `llm.endpoint` and deploy server/api/chat.ts.
 *                  (Your API key lives on the server only. Never put it here.)
 */

export interface Project {
  title: string;
  description: string;
  tags: string[];
  /** Optional: a repo or demo URL. Cards without a link aren't clickable. */
  link?: string;
  /** Short context shown on the card, e.g. "MSc dissertation" or "Bizzed AI". */
  context?: string;
  /** Optional extra words that should match this project in chat. */
  aliases?: string[];
}

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  summary: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface ContactLink {
  kind: 'email' | 'linkedin' | 'github' | 'website' | 'resume';
  label: string;
  /** Shown on the button (e.g. the address itself). */
  display: string;
  href: string;
}

export interface CustomAnswer {
  /** Any of these words/phrases in the visitor's message triggers the answer. */
  keywords: string[];
  answer: string;
}

export const portfolio = {
  /* ── About you ─────────────────────────────────────────────────────────── */
  name: 'Subash Sunuwar',
  firstName: 'Subash',
  /** Used in sentences ("Subash is an AI Engineer and Data Scientist…"). */
  role: 'AI Engineer and Data Scientist',
  /** The line shown above the character. */
  headline: 'AI Engineer · LLM & Automation Engineer · Junior Data Scientist',
  location: 'London, UK',
  availability: 'Subash is based in London and has the right to work in the UK.',
  summary:
    'With an MSc in Data Science (Merit), Subash turns AI prototypes into working business tools: production LLM integrations, workflow automation and deep-learning computer-vision systems. Highlights include a Claude API plugin that cut routine admin from 30–45 minutes to under 10, and a CNN-GRU crime-detection model that reached 94.8% AUC and beat published baselines.',

  skills: [
    { label: 'LLMs & AI', items: ['Claude API', 'Google Gemini', 'OpenRouter', 'Prompt engineering', 'Model Context Protocol (MCP)', 'AI agents', 'NLP'] },
    { label: 'Automation', items: ['N8N', 'Zapier', 'REST APIs', 'Meta Ads API', 'Gmail & Calendar APIs', 'Google Sheets API', 'Notion CRM', 'Slack'] },
    { label: 'Machine learning', items: ['TensorFlow', 'Keras', 'Scikit-learn', 'Computer vision (OpenCV)', 'CNN (MobileNetV2)', 'GRU / LSTM', 'Model evaluation'] },
    { label: 'Programming & data', items: ['Python', 'SQL', 'R', 'Java (Spring Boot)', 'Pandas', 'NumPy', 'MySQL', 'Graph databases', 'ETL pipelines'] },
    { label: 'Tools', items: ['Git', 'Docker (familiar)', 'Jupyter', 'Microsoft 365', 'Windows Server', 'Active Directory'] },
  ] satisfies SkillGroup[],

  projects: [
    {
      title: 'Real-Time Crime Detection',
      context: 'MSc dissertation · 2024',
      description: 'Hybrid CNN-GRU video classifier (MobileNetV2 + GRU) trained on 1,874 UCF-Crime clips: 94.8% AUC, 0.89 F1, beating published baselines of 75–84%. Deployed in Flask with per-second predictions on uploaded video.',
      tags: ['TensorFlow', 'OpenCV', 'MobileNetV2', 'GRU', 'Flask'],
      aliases: ['crime', 'dissertation', 'cctv', 'video', 'cnn', 'mobilenet', 'ucf'],
    },
    {
      title: 'Claude MCP Admin Plugin',
      context: 'Bizzed AI · 2026',
      description: 'A Claude API plugin that drafts emails, schedules meetings and generates proposals across Gmail and Google Calendar through the Model Context Protocol, cutting routine tasks from 30–45 minutes to under 10.',
      tags: ['Claude API', 'MCP', 'Gmail API', 'Calendar API'],
      aliases: ['mcp', 'claude', 'plugin', 'gmail', 'calendar', 'proposal'],
    },
    {
      title: 'Lead-Response Automation',
      context: 'Bizzed AI · 2026',
      description: 'Connects the Meta Ads API to Zapier so an outbound call fires within 60 seconds of a new lead, cutting average response time from hours to under a minute.',
      tags: ['Meta Ads API', 'Zapier', 'Automation'],
      aliases: ['lead', 'leads', 'meta', 'facebook', 'zapier', 'ads'],
    },
    {
      title: 'Facial Recognition for Smart Glasses',
      context: 'Bizzed AI · 2026',
      description: 'Data pipeline for a production system that matches live video frames against the CRM with OpenCV and a GRU model, so staff can identify contacts hands-free on smart glasses.',
      tags: ['OpenCV', 'GRU', 'Data pipeline'],
      aliases: ['facial', 'face', 'recognition', 'smart glasses', 'glasses'],
    },
    {
      title: 'Job Application Tracker',
      context: 'Independent project · 2025',
      description: 'N8N workflow using NVIDIA Nemotron 3 Ultra via OpenRouter to classify inbound emails and extract company, role, date and platform into Google Sheets, removing about 80% of manual data entry.',
      tags: ['N8N', 'OpenRouter', 'LLM extraction', 'Sheets API'],
      aliases: ['job tracker', 'tracker', 'application tracker', 'n8n', 'nemotron', 'job application'],
    },
  ] as Project[],

  experience: [
    {
      role: 'AI Engineer Intern',
      org: 'Bizzed AI',
      period: 'Mar 2026 – Jun 2026',
      summary: 'Built LLM and automation tools: a Claude MCP plugin for Gmail and Calendar, a 60-second lead-response pipeline, a Notion-to-Slack alerting system that cut missed task reviews by about 90%, and a facial-recognition data pipeline.',
    },
    {
      role: 'Colleague',
      org: 'Tesco, London',
      period: 'Jan 2023 – present',
      summary: 'Serves 100+ customers per shift and leads a team of up to 10 colleagues during peak trading.',
    },
    {
      role: 'IT Support Specialist',
      org: 'Aarambha Infosys, Kathmandu',
      period: 'Aug 2018 – Jan 2021',
      summary: 'Tier-1 support across hardware, software and networks; administered Windows Server, Microsoft 365 and Active Directory.',
    },
  ] satisfies ExperienceItem[],

  education: [
    {
      role: 'MSc Data Science (Merit)',
      org: 'University of Greenwich, London',
      period: 'Sep 2023 – Oct 2024',
      summary: 'Machine Learning, Big Data, Data Visualisation, Graph and Modern Databases.',
    },
    {
      role: 'BE Computer Engineering',
      org: 'Pokhara University, Nepal',
      period: 'Sep 2016 – Mar 2022',
      summary: 'Artificial Intelligence, Data Structures and Algorithms, Database Management Systems, Computer Architecture.',
    },
    {
      role: 'Data Scientist Associate',
      org: 'DataCamp',
      period: 'Jan 2026 – Jan 2028',
      summary: 'Professional certification.',
    },
  ] satisfies ExperienceItem[],

  contact: [
    { kind: 'email', label: 'Email', display: 'ssunuwar33@gmail.com', href: 'mailto:ssunuwar33@gmail.com' },
    { kind: 'linkedin', label: 'LinkedIn', display: 'in/subashsunuwar33', href: 'https://www.linkedin.com/in/subashsunuwar33' },
    { kind: 'github', label: 'GitHub', display: 'ssunuwar33', href: 'https://github.com/ssunuwar33' },
  ] satisfies ContactLink[],

  /** Extra one-off answers. Matched before the general topics. */
  customAnswers: [
    {
      keywords: ['visa', 'right to work', 'sponsorship', 'sponsor', 'work permit'],
      answer: 'Subash has the right to work in the UK.',
    },
    {
      keywords: ['speak', 'spoken', 'nepali', 'hindi', 'english'],
      answer: 'Subash speaks English (fluent), Hindi (fluent) and Nepali (native).',
    },
    {
      keywords: ['certification', 'certificate', 'certified', 'datacamp'],
      answer: 'Subash is a DataCamp certified Data Scientist Associate (January 2026, valid through January 2028).',
    },
  ] satisfies CustomAnswer[],

  /* ── The assistant ─────────────────────────────────────────────────────── */
  robot: {
    name: 'ANKU',
    /** Which character to draw: 'avatar' (cartoon portrait) or 'robot'. */
    character: 'avatar' as 'avatar' | 'robot',
    /** Seconds without any activity before the character falls asleep. */
    sleepAfterSeconds: 30,
    /** Clicking the character also opens the chat (a reaction still plays). */
    openChatOnClick: true,
    /** Sound effects are on by default (they start after the visitor's first
     *  click or tap, as browsers require). Visitors can mute them; the choice
     *  is remembered in their browser. */
    soundOnByDefault: true,
  },

  /* ── Colors ────────────────────────────────────────────────────────────────
   * Accent color per emotion (robot eyes, glow, effects like Zzz and hearts).
   * Site, panel and button colors are CSS variables in src/index.css. */
  theme: {
    emotionColors: {
      idle: '#3ee6ff',
      listening: '#7df3ff',
      thinking: '#b58cff',
      talking: '#3ee6ff',
      happy: '#5cf2a6',
      confused: '#ffc861',
      sleeping: '#5b7cff',
      excited: '#ff9de2',
      love: '#ff6fb5',
      dizzy: '#ff9b5c',
      yawning: '#7a93ff',
    },
  },

  /* ── LLM (optional) ────────────────────────────────────────────────────────
   * Leave `endpoint` empty to use the local keyword knowledge base only.
   * Set it to your server route (e.g. '/api/chat') to get free-form answers.
   * The route keeps the API key server-side; see server/api/chat.ts. */
  llm: {
    endpoint: '',
    timeoutMs: 12000,
  },
};

export type Portfolio = typeof portfolio;

/** Quick-reply chips shown under PARU's greeting. */
export const quickReplies = [
  `Who is ${portfolio.firstName}?`,
  'Show projects',
  'Skills',
  'Experience',
  'Education',
  'Contact',
];
