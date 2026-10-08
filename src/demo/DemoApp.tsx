/**
 * Single-screen page: name logo, role line, and the robot. Everything about you
 * (projects, skills, experience, contact) is answered inside the chat.
 *
 * To use the robot inside an existing site instead, render
 * <RobotAssistant placement="widget" /> or placement="hero" where you need it.
 */
import { portfolio } from '../config/portfolio.config';
import { RobotAssistant } from '../robot';

export function DemoApp() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(48rem_34rem_at_50%_45%,var(--glow-2),transparent_65%),radial-gradient(36rem_28rem_at_30%_75%,var(--glow-1),transparent_65%)]" />
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--line)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(closest-side,black,transparent)]" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <a href="#top" className="font-display text-[19px] font-bold tracking-tight text-fg">
          {portfolio.name}<span className="text-primary">.</span>
        </a>
      </header>

      <main id="top" className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        <h1 className="sr-only">{portfolio.name}</h1>
        <RobotAssistant
          placement="hero"
          panelSide="right"
          heading={
            <p className="max-w-[24rem] font-mono text-[12px] leading-relaxed tracking-[0.12em] text-balance text-primary uppercase">
              {[...portfolio.headline.split(' · '), portfolio.location].map((part, i, all) => (
                <span key={part}>
                  <span className="whitespace-nowrap">{part}{i < all.length - 1 ? ' ·' : ''}</span>{' '}
                </span>
              ))}
            </p>
          }
        />
      </main>
    </div>
  );
}
