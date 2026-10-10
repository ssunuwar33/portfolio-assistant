---
name: robot-ui-tester
description: "Test and debug a deployed portfolio site with an interactive AI robot assistant: browser QA of every interaction, chat, mobile, a11y and performance, then a prioritized bug report and retest."
---

# Robot UI Tester

You are QA-testing a live, deployed portfolio site whose centerpiece is an interactive robot assistant. The goal is a trustworthy bug list the owner can act on, and, when you have the code, fixes that you have verified on the live site. A report full of guesses is worse than a short one with evidence, so every finding needs something you actually observed: a screenshot, a console line, a failed request, or a measured number.

## 0. Inputs

- **URL** of the deployed site (required). If missing, ask for it before anything else.
- **Code access** (optional): a GitHub repo, attached files, or a connected folder. With code you can move from "reporting" to "fixing".
- If the user said what's broken ("chat doesn't open on mobile"), test that first, then do the full pass.

## 1. Setup

1. Read the `chrome-browser` skill if it is available, then load the browser tools in one batch (tabs, navigate, computer, read_page, find, read_console_messages, read_network_requests, javascript_tool, resize_window).
2. Open the URL in a **new tab** at desktop size (about 1440x900). Take a screenshot as the baseline.
3. Record console messages and network requests from page load before interacting, so load-time errors aren't confused with interaction errors.

## 2. Test plan

Work through the sections in order. For each check, note **pass / fail / not present** (features from the original spec may simply not exist; "not present" is not a bug unless the user expected it). Take a screenshot whenever something fails or looks off. The JavaScript probes referenced below are in the **Probes** appendix at the end; run them with the browser's JavaScript tool.

### A. Load & health
- Page loads without a blank screen or layout jump; robot renders (find it via read_page/find: look for the robot SVG/canvas or an element labelled robot/assistant).
- Console: no errors or uncaught promise rejections on load. Warnings are low severity unless repeated every frame.
- Network: no 4xx/5xx, no failed fonts/scripts, no requests to localhost or exposed API keys in URLs or request headers (a key visible in frontend code or requests is **critical**).
- Run the **load metrics** probe (load time, LCP, total JS size).

### B. Robot interactions
- **Cursor tracking**: move the mouse to the four corners around the robot and screenshot each; eyes/head should point toward the cursor. Use the **eye-position** probe to confirm movement numerically if screenshots are ambiguous.
- **Idle**: wait ~5s without input; look for floating/blinking (two screenshots a couple of seconds apart, or watch transform values change via the probe).
- **Hover**: hover the robot; expect a reaction (eyes widen, "Hi!" bubble).
- **Click**: click once, screenshot; click 4-5 times quickly and check for a "dizzy"/combo reaction and that animations don't stack or break.
- **Drag**: drag the robot across the page; it should move and return home on release. Check it can't be lost off-screen.
- **Sleep**: if the spec has a sleep timeout, wait it out (if the timeout is long and the code exposes a config, shorten it in a local build rather than waiting), then move the mouse and confirm it wakes.
- Watch the console during all of the above; errors that only appear on interaction are common.

### C. Chat
- Open the chat (click robot or "Chat with me"). Panel appears, greeting shows, input is focused.
- Click each quick-reply chip; each should produce a relevant answer. Project answers should render as cards with working links; contact answers should have working mailto/LinkedIn/GitHub links (check hrefs, don't send email).
- Type a free-text question ("what's your favourite colour?") and confirm a sensible fallback rather than an error or empty bubble.
- Check robot state changes: thinking face while waiting, talking while replying, back to idle after.
- Send an empty message and a very long message (500+ chars); neither should break layout.
- If replies come from an API: note latency, and what happens if it fails (use the network log). Never test with real credentials.
- Close and reopen; history behaviour should be consistent.

### D. Mobile & responsive
- Resize to 390x844. Robot visible and not overlapping key content; chat becomes full-width/bottom sheet; input not hidden; no horizontal scroll (use the **overflow** probe).
- Tap interactions work (click stands in for tap); drag works.
- Also check a mid width (~768) for awkward in-between layouts.

### E. Accessibility
- Keyboard only: Tab reaches the robot and chat button with a visible focus ring; Enter opens chat; Esc closes it; focus returns sensibly.
- Run the **a11y** probe: buttons/inputs without accessible names, images without alt, missing aria-live on the message list.
- **Reduced motion**: run the reduced-motion probe to check the CSS/JS honors `prefers-reduced-motion`. You can't flip the OS setting, so report this as "handled in code / not found in code" rather than pass/fail.
- Contrast: eyeball text on glass/neon panels; flag anything hard to read with a screenshot.

### F. Performance
- Run the **fps** probe while moving the mouse continuously over the page for ~3s. Under ~50fps on desktop is worth flagging; note if the mousemove handler isn't throttled (long tasks during movement).
- Leave the page idle ~30s and check memory/listener growth with the **leak** probe if available.

## 3. Report

Lead with a one-line verdict, then the findings table, then details only for failures. Use this structure:

```
# Robot UI test report - <site> - <date>
Verdict: <e.g. "Works on desktop; chat is broken on mobile and there are 2 console errors.">

| # | Severity | Area | Issue | Evidence |
|---|----------|------|-------|----------|

## Details
### #1 <title>
- Steps to reproduce
- Expected / actual
- Evidence (screenshot, console line, request)
- Likely cause and suggested fix (code snippet if you can see the code)

## Passed
Short list of what worked, so the owner knows what was covered.
```

Severity: **Critical** (exposed secrets, site/robot doesn't load, chat unusable), **High** (core interaction broken, mobile broken), **Medium** (a11y gaps, visual glitches, slow), **Low** (polish, warnings).

Publish the report as a document the user can keep, and give the verdict plus top 3 issues in the reply.

## 4. Fix & retest loop

Only when you have code access:
1. Fix in priority order, one issue at a time, with minimal changes. Explain each change in a line.
2. If you can't deploy, give the user the diff and ask them to redeploy; tell them what you'll recheck.
3. After redeploy, **rerun only the failed checks plus section A** (fixes often introduce new console errors), and update the report: mark fixed items, add any regressions.
4. Stop when Critical and High issues are resolved, or after the user says it's good enough.

## Safety

- Use a fresh tab; don't touch the user's other tabs.
- Don't submit contact forms or send emails; check link targets instead.
- Never type real API keys, passwords or personal data into the site.

## Probes

Paste each into the browser JavaScript tool. They only read state; none change the site.

**Load metrics**
```js
(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const js = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script');
  const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
  return { domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
    loadMs: Math.round(nav?.loadEventEnd || 0), lcpMs: lcp ? Math.round(lcp.startTime) : 'n/a',
    scripts: js.length, jsKB: Math.round(js.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024) };
})()
```

**Find the robot and its eyes** (adjust selectors if nothing is found)
```js
(() => {
  const robot = document.querySelector('[class*=robot i],[id*=robot i],[aria-label*=robot i],[aria-label*=assistant i]');
  const eyes = [...(robot || document).querySelectorAll('[class*=eye i],[id*=eye i]')];
  return { robot: robot ? robot.tagName + '.' + robot.className : null,
    eyes: eyes.map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), transform: getComputedStyle(e).transform }; }) };
})()
```
Run it after each cursor move; changing x/y or transform means tracking works.

**Horizontal overflow**
```js
(() => ({ docWidth: document.documentElement.scrollWidth, viewport: innerWidth,
  offenders: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1)
    .slice(0, 10).map(e => e.tagName + '.' + (e.className?.baseVal ?? e.className)) }))()
```

**Accessibility quick scan**
```js
(() => {
  const name = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.textContent || e.title || '').trim();
  return {
    unnamedButtons: [...document.querySelectorAll('button,[role=button]')].filter(b => !name(b)).length,
    unlabeledInputs: [...document.querySelectorAll('input,textarea')].filter(i => !i.labels?.length && !i.getAttribute('aria-label') && !i.placeholder).length,
    imgsNoAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length,
    liveRegions: document.querySelectorAll('[aria-live],[role=log],[role=status]').length,
    robotFocusable: !!document.querySelector('[class*=robot i][tabindex],button[class*=robot i],[aria-label*=robot i]')
  };
})()
```

**Reduced-motion support in code**
```js
(() => { let css = false;
  for (const s of document.styleSheets) { try { for (const r of s.cssRules) if (r.conditionText?.includes('prefers-reduced-motion')) css = true; } catch {} }
  const js = [...document.scripts].some(s => s.textContent.includes('prefers-reduced-motion'));
  return { cssMediaQuery: css, inlineJsCheck: js, note: 'Bundled JS may also check via matchMedia; search the source if both are false.' };
})()
```

**FPS while moving the mouse** (start it, then move the mouse continuously for 3 seconds, then read `window.__fps`)
```js
(() => { let frames = 0, longTasks = 0; const t0 = performance.now();
  try { new PerformanceObserver(l => longTasks += l.getEntries().length).observe({ type: 'longtask', buffered: false }); } catch {}
  const tick = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
    else window.__fps = { fps: Math.round(frames / 3), longTasks }; };
  requestAnimationFrame(tick); return 'measuring for 3s; read window.__fps afterwards';
})()
```

**Memory / leak check** (Chrome only; run once, wait 30s idle, run again and compare)
```js
({ heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'n/a',
   nodes: document.getElementsByTagName('*').length, time: new Date().toISOString() })
```
Steady growth in heap or node count while idle points to an animation or listener leak.
