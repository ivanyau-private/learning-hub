/* =========================================================================
   Learning Hub — shared state, cross-device sync, app shell
   -------------------------------------------------------------------------
   localStorage "hub_state_v2"
     ai:   { items:  { id:{v:0|1,t:ms} } }
     eng:  { done:   { id:{v:0|1,t:ms} },
             scores: { week:{v:int|null,t:ms} },
             errs:   { list:[…], t:ms } }        // whole-array LWW
     time: { id: {ms,t} }                        // seconds spent per task
     qa:   { id: {list:[{q,a,t,via}], t} }       // saved answers per task
     pomo: { "2026-08-17": {n,t} }               // pomodoro blocks finished, per day
     cfg:  { aiStart, engStart, pomo:{work,short,long,every}, t }

   Sync backend: one private GitHub Gist holding the same JSON.
   Per-key last-write-wins on timestamps, so two devices editing different
   things never clobber each other. Time entries and pomodoro counts merge by
   taking the larger value, which is monotonic and therefore safe.
   ========================================================================= */
(function () {
  "use strict";

  var LS_STATE = "hub_state_v2";
  var LS_TOKEN = "hub_gh_token";
  var LS_GIST = "hub_gist_id";
  var LS_LASTSYNC = "hub_last_sync";
  var LS_THEME = "hub_theme";
  var LS_APIKEY = "hub_anthropic_key";
  var LS_MODEL = "hub_anthropic_model";
  var DEFAULT_MODEL = "claude-sonnet-4-5";
  var LS_SOUND = "hub_sound";
  var GIST_FILE = "learning-hub.json";
  var API = "https://api.github.com";
  var POMO_DEF = { work: 25, short: 5, long: 15, every: 4 };

  var now = function () { return Date.now(); };
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function blank() {
    return {
      ai: { items: {} },
      eng: { done: {}, scores: {}, errs: { list: [], t: 0 } },
      time: {},
      qa: {},
      pomo: {},
      cfg: { aiStart: "", engStart: "", t: 0 },
      rev: 0
    };
  }

  var S = blank();
  var listeners = [];
  var pushTimer = null;
  var syncing = false;

  /* ============================ theme + sound ============================ */

  function theme() { return ls.get(LS_THEME) || "auto"; }
  function applyTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) {
      var dark = t === "dark" || (t === "auto" && !matchMedia("(prefers-color-scheme: light)").matches);
      m.setAttribute("content", dark ? "#0a0c13" : "#f4f5fa");
    }
  }
  function setTheme(t) { ls.set(LS_THEME, t); applyTheme(t); paintThemeBtn(); }
  function cycleTheme() {
    var order = ["auto", "dark", "light"];
    setTheme(order[(order.indexOf(theme()) + 1) % 3]);
  }
  function soundOn() { return ls.get(LS_SOUND) !== "0"; }
  function setSound(on) { ls.set(LS_SOUND, on ? "1" : "0"); }

  // apply before first paint to avoid a flash
  applyTheme(theme());

  /* ============================ load + migration ============================ */

  function load() {
    var raw = ls.get(LS_STATE);
    if (raw) {
      try { S = normalize(JSON.parse(raw)); } catch (e) { S = blank(); }
    } else {
      S = blank(); migrateLegacy(); persist();
    }
  }

  function normalize(o) {
    var b = blank();
    if (!o || typeof o !== "object") return b;
    b.ai.items = (o.ai && o.ai.items) || {};
    b.eng.done = (o.eng && o.eng.done) || {};
    b.eng.scores = (o.eng && o.eng.scores) || {};
    b.eng.errs = (o.eng && o.eng.errs) || { list: [], t: 0 };
    if (!Array.isArray(b.eng.errs.list)) b.eng.errs = { list: [], t: 0 };
    b.time = o.time || {};
    b.qa = o.qa || {};
    b.pomo = o.pomo || {};
    b.cfg = o.cfg || b.cfg;
    b.rev = o.rev || 0;
    return b;
  }

  /* Progress from the two original standalone trackers, so nothing already
     ticked is lost. Runs once, the first time the hub loads in a browser. */
  function migrateLegacy() {
    var t = now() - 1;
    try {
      var ai = JSON.parse(ls.get("ivan_ai_course_60") || "{}");
      for (var k in ai) if (ai[k]) S.ai.items[k] = { v: 1, t: t };
    } catch (e) {}
    try {
      var eng = JSON.parse(ls.get("ivan_eng_v1") || "{}");
      if (eng.done) for (var d in eng.done) if (eng.done[d]) S.eng.done[d] = { v: 1, t: t };
      if (eng.scores) for (var w in eng.scores) S.eng.scores[w] = { v: eng.scores[w], t: t };
      if (Array.isArray(eng.errs) && eng.errs.length) S.eng.errs = { list: eng.errs, t: t };
    } catch (e) {}
  }

  function persist() { S.rev = (S.rev || 0) + 1; ls.set(LS_STATE, JSON.stringify(S)); }

  /* ============================ merge ============================ */

  function mergeMap(local, remote) {
    var changed = false;
    for (var k in remote) {
      var r = remote[k], l = local[k];
      if (!r || typeof r.t !== "number") continue;
      if (!l || r.t > l.t) { local[k] = r; changed = true; }
    }
    return changed;
  }
  // time and pomodoro counts only accumulate, so the larger value is the truer one
  function mergeMax(local, remote, field) {
    var changed = false;
    for (var k in remote) {
      var r = remote[k];
      if (!r || typeof r[field] !== "number") continue;
      if (!local[k] || r[field] > local[k][field]) { local[k] = r; changed = true; }
    }
    return changed;
  }

  function merge(remote) {
    remote = normalize(remote);
    var changed = false;
    if (mergeMap(S.ai.items, remote.ai.items)) changed = true;
    if (mergeMap(S.eng.done, remote.eng.done)) changed = true;
    if (mergeMap(S.eng.scores, remote.eng.scores)) changed = true;
    if (mergeMax(S.time, remote.time, "ms")) changed = true;
    if (mergeMax(S.pomo, remote.pomo, "n")) changed = true;
    if (mergeMap(S.qa, remote.qa)) changed = true;
    if ((remote.eng.errs.t || 0) > (S.eng.errs.t || 0)) { S.eng.errs = remote.eng.errs; changed = true; }
    if ((remote.cfg.t || 0) > (S.cfg.t || 0)) { S.cfg = remote.cfg; changed = true; }
    if (changed) persist();
    return changed;
  }

  /* ============================ gist transport ============================ */

  function token() { return ls.get(LS_TOKEN) || ""; }
  function gistId() { return ls.get(LS_GIST) || ""; }
  function configured() { return !!(token() && gistId()); }

  function gh(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + token(),
      "X-GitHub-Api-Version": "2022-11-28"
    }, opts.headers || {});
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 160)); });
      return r.json();
    });
  }

  function createGist() {
    var body = { description: "Learning Hub sync — progress state", public: false, files: {} };
    body.files[GIST_FILE] = { content: JSON.stringify(S, null, 1) };
    return gh("/gists", { method: "POST", body: JSON.stringify(body) })
      .then(function (g) { ls.set(LS_GIST, g.id); return g.id; });
  }

  function pull() {
    return gh("/gists/" + gistId()).then(function (g) {
      var f = g.files && g.files[GIST_FILE];
      if (!f) return false;
      if (f.truncated && f.raw_url) {
        return fetch(f.raw_url).then(function (r) { return r.json(); }).then(merge);
      }
      return merge(JSON.parse(f.content || "{}"));
    });
  }

  function push() {
    var body = { files: {} };
    body.files[GIST_FILE] = { content: JSON.stringify(S, null, 1) };
    return gh("/gists/" + gistId(), { method: "PATCH", body: JSON.stringify(body) });
  }

  function status(msg, kind) {
    var el = document.getElementById("hubSyncState");
    if (el) { el.textContent = msg; el.className = "hub-sync " + (kind || ""); }
    var b = document.getElementById("hubSyncBtn");
    if (b) b.dataset.state = kind || "";
  }

  function sync() {
    if (!configured() || syncing) return Promise.resolve(false);
    syncing = true; status("Syncing…", "busy");
    return pull()
      .then(function (changed) { return push().then(function () { return changed; }); })
      .then(function (changed) {
        ls.set(LS_LASTSYNC, String(now()));
        status(timeAgo(now()), "ok");
        if (changed) notify();
        return changed;
      })
      .catch(function (e) { status("Sync failed", "err"); console.warn("[hub] sync", e); return false; })
      .then(function (r) { syncing = false; return r; });
  }

  function schedulePush() {
    if (!configured()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(sync, 1500);
  }

  function notify() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  function timeAgo(t) {
    var s = Math.round((now() - t) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  /* ============================ progress API ============================ */

  function isDone(track, id) {
    var m = track === "ai" ? S.ai.items : S.eng.done;
    return !!(m[id] && m[id].v);
  }

  function setDone(track, id, on) {
    var m = track === "ai" ? S.ai.items : S.eng.done;
    var cur = !!(m[id] && m[id].v);
    if (cur === !!on) return false;
    m[id] = { v: on ? 1 : 0, t: now() };
    persist(); schedulePush(); return true;
  }

  /* ---- English extras, kept in the shape the widgets expect ---- */
  function engErrs() { return (S.eng.errs.list || []).slice(); }
  function setEngErrs(list) { S.eng.errs = { list: list.slice(), t: now() }; persist(); schedulePush(); }
  function engScore(w) { return S.eng.scores[w] ? S.eng.scores[w].v : null; }
  function setEngScore(w, v) { S.eng.scores[w] = { v: v, t: now() }; persist(); schedulePush(); }

  /* ---- saved questions & answers, one thread per task ---- */
  function qaOf(id) { return (S.qa[id] && S.qa[id].list) || []; }
  function addQa(id, entry) {
    var list = qaOf(id).slice();
    list.push(entry);
    S.qa[id] = { list: list, t: now() };
    persist(); schedulePush();
  }
  function delQa(id, i) {
    var list = qaOf(id).slice();
    list.splice(i, 1);
    S.qa[id] = { list: list, t: now() };
    persist(); schedulePush();
  }
  function qaCount() { var n = 0; for (var k in S.qa) n += (S.qa[k].list || []).length; return n; }
  function apiKey() { return ls.get(LS_APIKEY) || ""; }
  function apiModel() { return ls.get(LS_MODEL) || DEFAULT_MODEL; }

  /* ---- time tracking ---- */
  function timeOf(id) { return (S.time[id] && S.time[id].ms) || 0; }
  function addTime(id, ms) {
    if (!ms || ms < 1000) return;
    S.time[id] = { ms: timeOf(id) + ms, t: now() };
    persist(); schedulePush();
  }
  function timeToday() {
    var k = dayKey(new Date()), total = 0;
    for (var id in S.time) {
      var e = S.time[id];
      if (e.t && dayKey(new Date(e.t)) === k) total += e.ms;
    }
    return total;
  }
  function timeTotal() { var t = 0; for (var id in S.time) t += S.time[id].ms; return t; }

  /* ---- pomodoro: blocks finished per calendar day, plus the durations ---- */
  function pomoOf(key) { return (S.pomo[key] && S.pomo[key].n) || 0; }
  function addPomo(when) {
    var k = dayKey(new Date(when || now()));
    S.pomo[k] = { n: pomoOf(k) + 1, t: now() };
    persist(); schedulePush();
    return S.pomo[k].n;
  }
  function pomoToday() { return pomoOf(dayKey(new Date())); }
  function pomoTotal() { var n = 0; for (var k in S.pomo) n += S.pomo[k].n; return n; }
  function pomoCfg() {
    var c = (S.cfg && S.cfg.pomo) || {};
    return {
      work: +c.work || POMO_DEF.work, short: +c.short || POMO_DEF.short,
      long: +c.long || POMO_DEF.long, every: +c.every || POMO_DEF.every
    };
  }
  function setPomoCfg(patch) { setCfg({ pomo: Object.assign(pomoCfg(), patch) }); }

  /* ============================ derived stats ============================ */

  function dayKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function activeDays() {
    var set = {};
    function add(m) { for (var k in m) if (m[k].v && m[k].t) { var d = dayKey(new Date(m[k].t)); set[d] = (set[d] || 0) + 1; } }
    add(S.ai.items); add(S.eng.done);
    return set;
  }
  function streak() {
    var days = activeDays(), n = 0, d = new Date();
    if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function countDone(map) { var n = 0; for (var k in map) if (map[k].v) n++; return n; }
  function doneToday() { return activeDays()[dayKey(new Date())] || 0; }

  /* ============================ config ============================ */

  function cfg() { return S.cfg || {}; }
  function setCfg(patch) {
    S.cfg = Object.assign({}, S.cfg, patch, { t: now() });
    persist(); schedulePush(); notify();
  }

  /* ============================ app shell ============================ */

  var NAV = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "ai.html", label: "AI Course", key: "ai" },
    { href: "english.html", label: "English", key: "eng" }
  ];

  var ICONS = {
    sync: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.7-4.4M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.7 4.4"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>',
    auto: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/></svg>',
    dark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    light:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
  };

  function paintThemeBtn() {
    var b = document.getElementById("hubThemeBtn");
    if (!b) return;
    var t = theme();
    b.innerHTML = ICONS[t] || ICONS.auto;
    b.title = "Theme: " + t + " (click to change)";
  }

  function shell(active) {
    var nav = document.createElement("div");
    nav.className = "hub-nav";
    nav.innerHTML =
      '<a class="hub-brand" href="index.html"><span class="hub-dot"></span><span class="hub-name">Learning Hub</span></a>' +
      '<nav>' + NAV.map(function (n) {
        return '<a href="' + n.href + '"' + (n.key === active ? ' class="on"' : '') + '>' + n.label + '</a>';
      }).join("") + '</nav>' +
      '<button id="hubThemeBtn" class="icon-btn" aria-label="Theme"></button>' +
      '<button id="hubSyncBtn" class="icon-btn" aria-label="Sync settings">' + ICONS.sync +
      '<span id="hubSyncState" class="hub-sync"></span></button>';
    document.body.insertBefore(nav, document.body.firstChild);
    paintThemeBtn();
    document.getElementById("hubThemeBtn").addEventListener("click", cycleTheme);

    var panel = document.createElement("div");
    panel.className = "hub-modal"; panel.id = "hubModal";
    panel.innerHTML =
      '<div class="hub-modal-in">' +
      '<div class="hub-modal-hd"><span>Settings</span><button id="hubClose" aria-label="Close">&times;</button></div>' +
      '<div class="hub-modal-bd">' +
      '<div class="switch" style="margin-bottom:6px"><input type="checkbox" id="hubSound"><label for="hubSound">Sound effects</label></div>' +
      '<hr>' +
      '<label class="hub-lbl" style="margin-top:18px">Pomodoro <span>minutes per phase</span></label>' +
      '<div class="hub-row2"><span>Focus block</span><input id="hubPomWork" type="number" min="1" max="180" step="1"></div>' +
      '<div class="hub-row2"><span>Short break</span><input id="hubPomShort" type="number" min="1" max="60" step="1"></div>' +
      '<div class="hub-row2"><span>Long break</span><input id="hubPomLong" type="number" min="1" max="90" step="1"></div>' +
      '<div class="hub-row2"><span>Blocks before a long break</span><input id="hubPomEvery" type="number" min="2" max="12" step="1"></div>' +
      '<hr>' +
      '<label class="hub-lbl">Start dates <span>so the app knows which day you are on</span></label>' +
      '<div class="hub-row2"><span>AI course</span><input id="hubAiStart" type="date"></div>' +
      '<div class="hub-row2"><span>English plan</span><input id="hubEngStart" type="date"></div>' +
      '<hr>' +
      '<label class="hub-lbl" style="margin-top:18px">Cross-device sync</label>' +
      '<p class="hub-p">Connect a <b>private GitHub Gist</b> and your progress follows you between phone and laptop. Free, no server, inside your own account.</p>' +
      '<label class="hub-lbl">GitHub token <span>classic token, <code>gist</code> scope only</span></label>' +
      '<input id="hubTok" type="password" placeholder="ghp_…" autocomplete="off" spellcheck="false">' +
      '<label class="hub-lbl">Gist ID <span>blank on your first device — press Create</span></label>' +
      '<input id="hubGid" type="text" placeholder="e.g. 3f9a…" autocomplete="off" spellcheck="false">' +
      '<div class="hub-row"><button id="hubSave" class="btn pri">Save &amp; sync</button>' +
      '<button id="hubCreate" class="btn">Create new gist</button></div>' +
      '<p class="hub-msg" id="hubMsg"></p>' +
      '<hr>' +
      '<label class="hub-lbl" style="margin-top:18px">Answer questions inside the page <span>optional</span></label>' +
      '<p class="hub-p">Every task has a <b>?</b> button. Without a key it opens claude.ai with the task pre-filled — free, uses your normal subscription. Add an <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Anthropic API key</a> and answers appear inline instead, billed per use.</p>' +
      '<input id="hubKey" type="password" placeholder="sk-ant-…" autocomplete="off" spellcheck="false">' +
      '<label class="hub-lbl">Model</label>' +
      '<input id="hubModel" type="text" placeholder="claude-sonnet-4-5" autocomplete="off" spellcheck="false">' +
      '<hr>' +
      '<div class="hub-row"><button id="hubExport" class="btn">Export backup</button>' +
      '<button id="hubImport" class="btn">Import backup</button>' +
      '<input id="hubFile" type="file" accept="application/json" hidden></div>' +
      '<p class="hub-p dim">Your token is stored only in this browser and is sent only to api.github.com.</p>' +
      '</div></div>';
    document.body.appendChild(panel);

    var open = function () {
      document.getElementById("hubTok").value = token();
      document.getElementById("hubGid").value = gistId();
      document.getElementById("hubAiStart").value = cfg().aiStart || "";
      document.getElementById("hubEngStart").value = cfg().engStart || "";
      document.getElementById("hubSound").checked = soundOn();
      var pc = pomoCfg();
      document.getElementById("hubPomWork").value = pc.work;
      document.getElementById("hubPomShort").value = pc.short;
      document.getElementById("hubPomLong").value = pc.long;
      document.getElementById("hubPomEvery").value = pc.every;
      document.getElementById("hubKey").value = apiKey();
      document.getElementById("hubModel").value = apiModel();
      panel.classList.add("on");
    };
    var close = function () { panel.classList.remove("on"); };

    document.getElementById("hubSyncBtn").addEventListener("click", open);
    document.getElementById("hubClose").addEventListener("click", close);
    panel.addEventListener("click", function (e) { if (e.target === panel) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("on")) close(); });

    var msg = function (t, k) {
      var m = document.getElementById("hubMsg");
      m.textContent = t; m.className = "hub-msg " + (k || "");
    };

    document.getElementById("hubSound").addEventListener("change", function () {
      setSound(this.checked);
      if (this.checked && window.UI) UI.sfx.tick();
    });

    document.getElementById("hubSave").addEventListener("click", function () {
      ls.set(LS_TOKEN, document.getElementById("hubTok").value.trim());
      ls.set(LS_GIST, document.getElementById("hubGid").value.trim());
      if (!configured()) { msg("Need both a token and a gist ID.", "err"); return; }
      msg("Syncing…");
      sync().then(function () { msg("Connected. This device is in sync.", "ok"); notify(); });
    });

    document.getElementById("hubCreate").addEventListener("click", function () {
      ls.set(LS_TOKEN, document.getElementById("hubTok").value.trim());
      if (!token()) { msg("Paste a token first.", "err"); return; }
      msg("Creating gist…");
      createGist().then(function (id) {
        document.getElementById("hubGid").value = id;
        msg("Created. Copy this Gist ID to your other devices: " + id, "ok");
        sync();
      }).catch(function (e) { msg("Failed: " + e.message, "err"); });
    });

    document.getElementById("hubKey").addEventListener("change", function () { ls.set(LS_APIKEY, this.value.trim()); notify(); });
    document.getElementById("hubModel").addEventListener("change", function () { ls.set(LS_MODEL, this.value.trim() || DEFAULT_MODEL); });
    [["hubPomWork", "work", 1, 180], ["hubPomShort", "short", 1, 60],
     ["hubPomLong", "long", 1, 90], ["hubPomEvery", "every", 2, 12]].forEach(function (f) {
      document.getElementById(f[0]).addEventListener("change", function () {
        var v = Math.max(f[2], Math.min(f[3], Math.round(+this.value || 0) || pomoCfg()[f[1]]));
        this.value = v;
        var patch = {}; patch[f[1]] = v;
        setPomoCfg(patch);
        if (window.Pomo) Pomo.paint();
      });
    });

    document.getElementById("hubAiStart").addEventListener("change", function () { setCfg({ aiStart: this.value }); });
    document.getElementById("hubEngStart").addEventListener("change", function () { setCfg({ engStart: this.value }); });

    document.getElementById("hubExport").addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }));
      a.download = "learning-hub-backup-" + dayKey(new Date()) + ".json";
      a.click();
    });
    document.getElementById("hubImport").addEventListener("click", function () { document.getElementById("hubFile").click(); });
    document.getElementById("hubFile").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      f.text().then(function (t) {
        try { merge(JSON.parse(t)); msg("Backup merged.", "ok"); notify(); schedulePush(); }
        catch (e) { msg("Not a valid backup file.", "err"); }
      });
    });

    if (configured()) {
      var last = +(ls.get(LS_LASTSYNC) || 0);
      status(last ? timeAgo(last) : "", "ok");
    } else {
      status("Set up sync", "off");
    }
  }

  /* ============================ init ============================ */

  function init(opts) {
    opts = opts || {};
    load();
    var boot = function () {
      shell(opts.page);
      if (window.UI) UI.gradDefs();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    if (configured()) {
      sync();
      setInterval(function () { if (document.visibilityState === "visible") sync(); }, 60000);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") sync(); });
      addEventListener("online", sync);
    }
  }

  window.Hub = {
    init: init,
    state: function () { return S; },
    isDone: isDone, setDone: setDone,
    engErrs: engErrs, setEngErrs: setEngErrs, engScore: engScore, setEngScore: setEngScore,
    timeOf: timeOf, addTime: addTime, timeToday: timeToday, timeTotal: timeTotal,
    addPomo: addPomo, pomoOf: pomoOf, pomoToday: pomoToday, pomoTotal: pomoTotal,
    pomoCfg: pomoCfg, setPomoCfg: setPomoCfg,
    qaOf: qaOf, addQa: addQa, delQa: delQa, qaCount: qaCount,
    apiKey: apiKey, apiModel: apiModel,
    cfg: cfg, setCfg: setCfg,
    sync: sync, configured: configured, mergeRemote: merge,
    theme: theme, setTheme: setTheme, soundOn: soundOn, setSound: setSound,
    onChange: function (f) { listeners.push(f); },
    stats: { activeDays: activeDays, streak: streak, countDone: countDone, dayKey: dayKey, doneToday: doneToday }
  };
})();
