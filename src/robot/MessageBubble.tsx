import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ContactLink, ExperienceItem, Project, SkillGroup } from '../config/portfolio.config';
import { ArrowUpRight, CheckIcon, CopyIcon, contactIcon } from './icons';
import { QuickReplies } from './QuickReplies';
import type { Attachment, ChatMessage } from './types';

interface Props {
  message: ChatMessage;
  /** Only the latest bot message shows its suggestion chips. */
  isLatest: boolean;
  busy: boolean;
  onPick: (text: string) => void;
  reducedMotion: boolean;
}

function MessageBubbleImpl({ message, isLatest, busy, onPick, reducedMotion }: Props) {
  const isUser = message.from === 'user';
  const words = message.text.split(/\s+/);
  const visible = isUser ? message.text : words.slice(0, message.visibleWords ?? words.length).join(' ');
  const done = isUser || !message.streaming;

  return (
    <motion.li
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-accent px-3.5 py-2 text-[14px] leading-relaxed font-medium text-on-primary'
            : 'max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-bubble px-3.5 py-2 text-[14px] leading-relaxed text-fg'
        }
      >
        <span className="sr-only">{isUser ? 'You said: ' : ''}</span>
        {visible}
        {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-primary" aria-hidden="true" />}
      </div>

      {done && message.attachments?.map((a, i) => (
        <motion.div
          key={i}
          className="w-full"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.08 }}
        >
          <AttachmentView attachment={a} isLatest={isLatest} busy={busy} onPick={onPick} reducedMotion={reducedMotion} />
        </motion.div>
      ))}
    </motion.li>
  );
}

// Skips re-renders for every non-latest bubble on each streaming word tick.
export const MessageBubble = memo(MessageBubbleImpl, (prev, next) =>
  prev.message === next.message
  && prev.isLatest === next.isLatest
  && prev.busy === next.busy
  && prev.reducedMotion === next.reducedMotion
  && prev.onPick === next.onPick,
);

function AttachmentView({ attachment: a, isLatest, busy, onPick, reducedMotion }: { attachment: Attachment } & Omit<Props, 'message'>) {
  switch (a.type) {
    case 'projects': return <ProjectCards projects={a.projects} reducedMotion={reducedMotion} />;
    case 'contact': return <ContactButtons links={a.links} />;
    case 'skills': return <Skills groups={a.groups} />;
    case 'experience': return <Experience items={a.items} />;
    case 'suggestions': return isLatest ? <QuickReplies options={a.options} onPick={onPick} disabled={busy} reducedMotion={reducedMotion} /> : null;
  }
}

function ProjectCards({ projects, reducedMotion }: { projects: Project[]; reducedMotion: boolean }) {
  return (
    <ul className="grid gap-2">
      {projects.map((p, i) => (
        <motion.li
          key={p.title}
          initial={reducedMotion ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          {(() => {
            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-[15px] font-semibold text-fg">{p.title}</h4>
                  {p.link && <ArrowUpRight className="mt-0.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />}
                </div>
                {p.context && <p className="mt-0.5 font-mono text-[11px] text-primary">{p.context}</p>}
                <p className="mt-1 text-[13px] leading-snug text-muted">{p.description}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Technologies">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-md bg-accent/12 px-1.5 py-0.5 font-mono text-[11px] text-accent-strong">{t}</li>
                  ))}
                </ul>
              </>
            );
            const card = 'group block rounded-xl border border-line bg-card p-3';
            return p.link ? (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${card} transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
              >
                {inner}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <div className={card}>{inner}</div>
            );
          })()}
        </motion.li>
      ))}
    </ul>
  );
}

function ContactButtons({ links }: { links: ContactLink[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* Clipboard blocked: the address is selectable text, so visitors can copy it by hand. */
    }
  };

  return (
    <ul className="grid gap-2">
      {links.map((l) => {
        const Icon = contactIcon[l.kind];
        const external = !l.href.startsWith('mailto:');
        return (
          <li key={l.label} className="flex items-stretch gap-1.5">
            <a
              href={l.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-[15px] text-primary"><Icon /></span>
              <span className="min-w-0">
                <span className="block font-semibold text-fg">{l.label}</span>
                <span className="block truncate font-mono text-[11.5px] text-muted select-all">{l.display}</span>
              </span>
              {external && <ArrowUpRight className="ml-auto shrink-0 text-muted" />}
            </a>
            {l.kind === 'email' && (
              <button
                type="button"
                onClick={() => copy(l.display)}
                aria-label={copied === l.display ? 'Email address copied' : `Copy ${l.display}`}
                className="grid w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-card text-muted transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {copied === l.display ? <CheckIcon className="text-primary" /> : <CopyIcon />}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="grid gap-2.5 rounded-xl border border-line bg-card p-3">
      {groups.map((g) => (
        <div key={g.label}>
          <h4 className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{g.label}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {g.items.map((s) => (
              <li key={s} className="rounded-md border border-line bg-bubble px-2 py-0.5 text-[12.5px] text-fg">{s}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Experience({ items }: { items: ExperienceItem[] }) {
  return (
    <ol className="relative grid gap-3 rounded-xl border border-line bg-card p-3 pl-7">
      <span className="absolute top-5 bottom-5 left-[15px] w-px bg-line" aria-hidden="true" />
      {items.map((x) => (
        <li key={x.role + x.org} className="relative">
          <span className="absolute top-1.5 -left-[17px] size-2.5 rounded-full border-2 border-primary bg-bg" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <h4 className="text-[14px] font-semibold text-fg">{x.role} <span className="font-normal text-muted">· {x.org}</span></h4>
            <span className="font-mono text-[11px] text-muted tabular-nums">{x.period}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{x.summary}</p>
        </li>
      ))}
    </ol>
  );
}
