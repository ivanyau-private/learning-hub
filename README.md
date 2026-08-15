# Learning Hub

One site for both learning tracks — the 60-day AI course and the 8-week English plan —
with progress that follows you between phone and laptop.

```
index.html          dashboard: combined progress, today's tasks, streak, resource search
ai.html             the 60-day AI course tracker (340 items)
english.html        the 8-week English plan tracker (218 items)
assets/hub.js       shared state + cross-device sync + nav/settings shell
assets/dashboard.js dashboard logic
assets/data-*.js    the plan content, shared by the dashboard and the trackers
assets/app-*.js     each tracker's original rendering engine
sw.js               service worker (offline)
manifest.webmanifest + icons/   installable app
```

Everything is static. No build step, no server, no dependencies.

---

## 1. Deploy to GitHub Pages

Create an empty repo on GitHub (call it `learning-hub`), then from this folder:

```bash
git remote add origin https://github.com/YOUR_USERNAME/learning-hub.git
git branch -M main
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**

A minute later it's live at:

```
https://YOUR_USERNAME.github.io/learning-hub/
```

The repo has to be public for Pages to work on a free account. That's fine — the repo
holds the study plans, not your progress. Progress lives in your browser and in a
*private* Gist (next section).

---

## 2. Turn on cross-device sync

Progress is stored in the browser by default, which means your phone and laptop would
drift apart. Connecting a private Gist fixes that. It's free and stays inside your own
GitHub account.

**Make a token** — [github.com/settings/tokens](https://github.com/settings/tokens) →
*Generate new token (classic)* → tick **only** the `gist` scope → set no expiry (or a long
one) → copy it.

> Only `gist`. Don't give it `repo`. If the token ever leaks, the worst anyone can do is
> read and write your gists.

**First device** — open the site → click the ⟳ button in the top right → paste the token →
press **Create new gist**. Copy the Gist ID it shows you.

**Every other device** — open the site → ⟳ → paste the same token **and** that Gist ID →
press **Save & sync**.

That's it. Ticking a box on your laptop shows up on your phone the next time it syncs —
which happens on load, when you switch back to the tab, every 60 seconds while open, and
about 1.5 seconds after any change.

Merging is per-item last-write-wins on timestamps, so two devices editing different
things never overwrite each other. Offline changes are kept and pushed when you're back.

There's also **Export / Import backup** in the same panel if you'd rather move progress
around by hand, or just want a snapshot.

---

## 3. Install it on your phone

**iPhone** — open the site in Safari → Share → *Add to Home Screen*.
**Android** — Chrome → menu → *Install app*.

It then opens fullscreen like a native app and works offline (the service worker caches
the whole site). Set up sync *before* you install, so the token comes along.

---

## 4. Set your start dates

In the ⟳ panel, set a start date for each track. The dashboard then shows **today's**
tasks rather than "up next", and you can see at a glance whether you're on pace.

Leave them blank and the dashboard just shows the first day you haven't finished — which
is the better mode if you're not studying every single day.

---

## 5. Changing the content later

The plans live in `assets/data-ai.js` and `assets/data-eng.js` as plain arrays. Add a day,
edit a task, add a resource — the dashboard and the tracker both pick it up, no other
changes needed.

Two things to know:

- **Item IDs are positional.** An AI item's key is `m{month}w{week}d{dayIndex}i{itemIndex}`;
  an English item's is `w{week}d{dayIndex}i{itemIndex}`. Inserting a task in the *middle* of
  a day shifts every later item's ID and their ticks appear to move. Append to the end of a
  day instead, and nothing shifts.
- **Bump the cache version** in `sw.js` (`const CACHE = "learning-hub-v1"` → `v2`) whenever
  you deploy, or installed devices may serve the old files for a while.

---

## Notes

- Existing progress from the two original standalone trackers is migrated automatically the
  first time you open the hub in a browser that has it (`ivan_ai_course_60` and `ivan_eng_v1`).
- The token is stored only in that browser's localStorage and is sent only to `api.github.com`.
- The service worker deliberately never caches API calls, so sync always hits the network.
