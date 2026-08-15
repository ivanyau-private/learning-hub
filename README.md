# Learning Hub

One site for both learning tracks — the 60-day AI course and the 8-week English plan —
built around doing **one day at a time**, with progress that follows you between phone
and laptop.

```
index.html            home: combined progress, one-tap start, live timer,
                      today's tasks from both plans, the daily AI-update ritual,
                      activity heatmap, searchable resource library
ai.html               AI course — day by day, 56 days
english.html          English plan — day by day, 56 days

assets/theme.css      the whole design system (dark by default, light on request)
assets/hub.js         state, cross-device sync, settings, app shell
assets/ui.js          confetti, toasts, sound, swipe, rings, counters
assets/plans.js       both curricula flattened into one day-indexed model
assets/day.js         the day view + focus mode + per-task timer
assets/ref.js         concept map, resources, interview banks, English tools
assets/ask.js         the ? button on every checkpoint
assets/data-*.js      plan content
assets/ref-eng.js     English templates / traps / pronunciation material

sw.js, manifest.webmanifest, icons/    installable, works offline
```

Static. No build step, no dependencies, no server.

---

## How it works day to day

**Home** shows where you are and gets you moving in one tap. The two big gradient
buttons drop you straight into today's day in focus mode — one for each track.

**Focus mode** shows a single task, full screen, and nothing else. Complete it and the
next one slides in. Finish the day and you get confetti and a jump into tomorrow.

| | keyboard | phone |
|---|---|---|
| complete | `space` / `enter` | swipe → |
| next / previous | `J` `K` or arrows | swipe ← to skip |
| start / pause timer | `T` | tap the button |
| exit | `esc` | tap Esc |

**The day rail** across the top of each tracker is every day of the plan. Green-tinted
means finished, a small bar underneath means partly done, and the glowing one is where
you are. Tap any day to jump; swipe left and right on the day panel to move one at a
time. The URL carries the day (`ai.html#d17`), so you can bookmark or share a specific one.

**Timers.** Every task has a ▸ button. English tasks carry the plan's own minute
estimates, and the ring in focus mode fills toward that target and turns amber when you
run over. Time is logged per task and totalled on the home page — today and all time.
The timer stops itself if you switch tabs, so walking away doesn't inflate your numbers.

---

## The ? button — asking about a checkpoint

Every task has a **?** next to it. It opens a panel with that task as context, plus
whatever you've already saved against it. Two ways to get an answer:

**Ask in Claude** (no setup) opens claude.ai in a new tab with the track, the week, the
day and the exact task already written into the prompt, followed by your question. Uses
your normal subscription. Paste the reply back with **Save a note** and it stays attached
to that task forever.

**Answer here** (optional) needs an [Anthropic API key](https://console.anthropic.com/settings/keys)
in Settings. The page then calls the Messages API directly and the answer renders inline.
Billed per use, key stored only in that browser. The model is editable in Settings —
default `claude-sonnet-4-5`.

Either way the Q&A is saved into the same synced state as your progress, so notes made on
your laptop are on your phone. A task with saved answers gets a dot on its ? button.

---

## 1. Deploy to GitHub Pages

Create an empty repo on GitHub (call it `learning-hub`), then from this folder:

```bash
git remote add origin https://github.com/YOUR_USERNAME/learning-hub.git
git branch -M main
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**

Live a minute later at `https://YOUR_USERNAME.github.io/learning-hub/`.

The repo has to be public for Pages on a free account. That's fine — it holds the study
plans, not your progress. Progress lives in your browser and in a *private* Gist.

---

## 2. Turn on cross-device sync

**Make a token** — [github.com/settings/tokens](https://github.com/settings/tokens) →
*Generate new token (classic)* → tick **only** the `gist` scope → copy it.

> Only `gist`. Don't give it `repo`. If it ever leaks, the worst anyone can do is read and
> write your gists.

**First device** — ⟳ in the top right → paste the token → **Create new gist**. Copy the
Gist ID it shows you.

**Every other device** — ⟳ → paste the same token **and** that Gist ID → **Save & sync**.

Syncs on load, when you switch back to the tab, every 60 seconds while open, and about
1.5 seconds after any change. Merging is per-item last-write-wins on timestamps, so two
devices editing different things never overwrite each other; logged time merges by taking
the larger total, which is always the truer one. Offline changes push when you're back.

**Export / Import backup** in the same panel if you'd rather move things by hand.

---

## 3. Install it on your phone

**iPhone** — open in Safari → Share → *Add to Home Screen*.
**Android** — Chrome → menu → *Install app*.

Opens fullscreen like a native app and works offline. Set up sync *before* installing so
the token comes along.

---

## 4. Settings worth setting

- **Start dates** for each track. The home page then shows *today's* day rather than
  "up next", and you can see whether you're on pace. Leave them blank and it just shows
  the first day you haven't finished — better if you're not studying every single day.
- **Theme** cycles auto → dark → light from the moon button in the nav.
- **Sound** is on by default: a click on tick, a chime on a finished day. Toggle in Settings.

---

## 5. Changing the content later

The plans are plain arrays in `assets/data-ai.js` and `assets/data-eng.js`. Add a day,
edit a task, add a resource — the home page and the tracker both pick it up.

Two things to know:

- **Item IDs are positional.** AI items are `m{month}w{week}d{dayIndex}i{itemIndex}`,
  English items are `w{week}d{dayIndex}i{itemIndex}`. Inserting a task in the *middle* of a
  day shifts every later ID, so ticks, logged time and saved answers appear to move.
  Append to the end of a day instead and nothing shifts.
- **Bump the cache version** in `sw.js` (`learning-hub-v3` → `v4`) whenever you deploy, or
  installed devices may serve the old files for a while.

---

## Notes

- Progress from the two original standalone trackers migrates automatically the first time
  you open the hub in a browser that has it (`ivan_ai_course_60` and `ivan_eng_v1`).
- Tokens and API keys live only in that browser's localStorage, and are sent only to
  `api.github.com` and `api.anthropic.com` respectively.
- The service worker never caches either API, so sync and answers always hit the network.
- Everything respects `prefers-reduced-motion`.
