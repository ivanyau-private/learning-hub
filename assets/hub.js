/* ============================================================
   Learning Hub — shared state, cross-device sync, and app shell
   ------------------------------------------------------------
   Storage model
     hub_state_v2  (localStorage)  the whole hub state
       ai:   { items: { id: {v:0|1, t:ms} } }
       eng:  { done:  { id: {v:0|1, t:ms} },
               scores:{ week: {v:int|null, t:ms} },
               errs:  { list:[...], t:ms } }        // whole-array LWW
       cfg:  { aiStart:"YYYY-MM-DD", engStart:"YYYY-MM-DD", t:ms }
   Sync backend: one private GitHub Gist holding the same JSON.
   Merge is per-key last-write-wins on timestamps, so two devices
   editing different things never clobber each other.
   ============================================================ */
(function () {
  "use strict";

  var LS_STATE = "hub_state_v2";
  var LS_TOKEN = "hub_gh_token";
  var LS_GIST = "hub_gist_id";
  var LS_LASTSYNC = "hub_last_sync";
  var GIST_FILE = "learning-hub.json";
  var API = "https://api.github.com";

  var now = function () { return Date.now(); };
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function blank() {
    return {
      ai: { items: {} },
      eng: { done: {}, scores: {}, errs: { list: [], t: 0 } },
      cfg: { aiStart: "", engStart: "", t: 0 },
      rev: 0
    };
  }

  var S = blank();
  var listeners = [];
  var pushTimer = null;
  var syncing = false;

  /* ---------------- load + legacy migration ---------------- */

  function load() {
    var raw = ls.get(LS_STATE);
    if (raw) {
      try { S = normalize(JSON.parse(raw)); } catch (e) { S = blank(); }
    } else {
      S = blank();
      migrateLegacy();
      persist();
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
    b.cfg = o.cfg || b.cfg;
    b.rev = o.rev || 0;
    return b;
  }

  /* Pull in progress from the two original standalone trackers so
     nothing already ticked is lost. Runs once, on first hub load. */
  function migrateLegacy() {
    var t = now() - 1; // slightly in the past so a fresh remote wins ties
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

  function persist() {
    S.rev = (S.rev || 0) + 1;
    ls.set(LS_STATE, JSON.stringify(S));
  }

  /* ---------------- merge ---------------- */

  function mergeMap(local, remote) {
    var changed = false;
    for (var k in remote) {
      var r = remote[k], l = local[k];
      if (!r || typeof r.t !== "number") continue;
      if (!l || r.t > l.t) { local[k] = r; changed = true; }
    }
    return changed;
  }

  function merge(remote) {
    remote = normalize(remote);
    var changed = false;
    if (mergeMap(S.ai.items, remote.ai.items)) changed = true;
    if (mergeMap(S.eng.done, remote.eng.done)) changed = true;
    if (mergeMap(S.eng.scores, remote.eng.scores)) changed = true;
    if ((remote.eng.errs.t || 0) > (S.eng.errs.t || 0)) { S.eng.errs = remote.eng.errs; changed = true; }
    if ((remote.cfg.t || 0) > (S.cfg.t || 0)) { S.cfg = remote.cfg; changed = true; }
    if (changed) persist();
    return changed;
  }

  /* ---------------- gist transport ---------------- */

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
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 200)); });
      return r.json();
    });
  }

  function createGist() {
    var body = { description: "Learning Hub sync — progress state", public: false, files: {} };
    body.files[GIST_FILE] = { content: JSON.stringify(S, null, 1) };
    return gh("/gists", { method: "POST", body: JSON.stringify(body) }).then(function (g) {
      ls.set(LS_GIST, g.id);
      return g.id;
    });
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

  function sync(opts) {
    opts = opts || {};
    if (!configured() || syncing) return Promise.resolve(false);
    syncing = true;
    status("Syncing…", "busy");
    return pull()
      .then(function (changed) { return push().then(function () { return changed; }); })
      .then(function (changed) {
        ls.set(LS_LASTSYNC, String(now()));
        status("Synced " + timeAgo(now()), "ok");
        if (changed) notify();
        return changed;
      })
      .catch(function (e) {
        status("Sync failed — " + String(e.message || e).slice(0, 60), "err");
        return false;
      })
      .then(function (r) { syncing = false; return r; });
  }

  function schedulePush() {
    if (!configured()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync({ silent: true }); }, 1500);
  }

  function notify() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  function timeAgo(t) {
    var s = Math.round((now() - t) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  /* ---------------- adapters for the two trackers ---------------- */

  // AI page expects a flat { id: true } object.
  function aiStore() {
    var o = {};
    for (var k in S.ai.items) if (S.ai.items[k].v) o[k] = true;
    return o;
  }
  function commitAi(store) {
    var t = now(), touched = false, k;
    for (k in store) {
      if (store[k] && !(S.ai.items[k] && S.ai.items[k].v)) { S.ai.items[k] = { v: 1, t: t }; touched = true; }
    }
    for (k in S.ai.items) {
      if (S.ai.items[k].v && !store[k]) { S.ai.items[k] = { v: 0, t: t }; touched = true; }
    }
    if (touched) { persist(); schedulePush(); }
  }

  // English page expects { done:{}, errs:[], scores:{} }.
  function engState() {
    var st = { done: {}, errs: [], scores: {} };
    for (var k in S.eng.done) if (S.eng.done[k].v) st.done[k] = 1;
    for (var w in S.eng.scores) if (S.eng.scores[w].v != null) st.scores[w] = S.eng.scores[w].v;
    st.errs = JSON.parse(JSON.stringify(S.eng.errs.list || []));
    return st;
  }
  function commitEng(st) {
    var t = now(), touched = false, k;
    for (k in st.done) {
      if (st.done[k] && !(S.eng.done[k] && S.eng.done[k].v)) { S.eng.done[k] = { v: 1, t: t }; touched = true; }
    }
    for (k in S.eng.done) {
      if (S.eng.done[k].v && !st.done[k]) { S.eng.done[k] = { v: 0, t: t }; touched = true; }
    }
    var seen = {};
    for (k in st.scores) {
      seen[k] = 1;
      if (!S.eng.scores[k] || S.eng.scores[k].v !== st.scores[k]) { S.eng.scores[k] = { v: st.scores[k], t: t }; touched = true; }
    }
    for (k in S.eng.scores) {
      if (!seen[k] && S.eng.scores[k].v != null) { S.eng.scores[k] = { v: null, t: t }; touched = true; }
    }
    if (JSON.stringify(st.errs) !== JSON.stringify(S.eng.errs.list)) {
      S.eng.errs = { list: JSON.parse(JSON.stringify(st.errs)), t: t };
      touched = true;
    }
    if (touched) { persist(); schedulePush(); }
  }

  /* ---------------- derived stats for the dashboard ---------------- */

  function tsList() {
    var out = [];
    function add(m) { for (var k in m) if (m[k].v && m[k].t) out.push(m[k].t); }
    add(S.ai.items); add(S.eng.done);
    return out;
  }

  function dayKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function activeDays() {
    var set = {};
    tsList().forEach(function (t) { set[dayKey(new Date(t))] = (set[dayKey(new Date(t))] || 0) + 1; });
    return set;
  }

  function streak() {
    var days = activeDays(), n = 0, d = new Date();
    if (!days[dayKey(d)]) d.setDate(d.getDate() - 1); // today not done yet doesn't break it
    while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function countDone(map) {
    var n = 0;
    for (var k in map) if (map[k].v) n++;
    return n;
  }

  /* ---------------- config ---------------- */

  function cfg() { return S.cfg || {}; }
  function setCfg(patch) {
    S.cfg = Object.assign({}, S.cfg, patch, { t: now() });
    persist(); schedulePush(); notify();
  }

  /* ---------------- app shell (nav + sync panel) ---------------- */

  var NAV = [
    { href: "index.html", label: "Dashboard", key: "home" },
    { href: "ai.html", label: "AI Course", key: "ai" },
    { href: "english.html", label: "English", key: "eng" }
  ];

  function shell(active) {
    var nav = document.createElement("div");
    nav.className = "hub-nav";
    nav.innerHTML =
      '<a class="hub-brand" href="index.html"><span class="hub-dot"></span><span class="hub-name">Learning Hub</span></a>' +
      '<nav>' + NAV.map(function (n) {
        return '<a href="' + n.href + '"' + (n.key === active ? ' class="on"' : '') + '>' + n.label + '</a>';
      }).join("") + '</nav>' +
      '<button id="hubSyncBtn" class="hub-syncbtn" title="Sync settings" aria-label="Sync settings">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.7-4.4M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.7 4.4"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>' +
      '<span id="hubSyncState" class="hub-sync"></span></button>';
    document.body.insertBefore(nav, document.body.firstChild);

    var panel = document.createElement("div");
    panel.className = "hub-modal";
    panel.id = "hubModal";
    panel.innerHTML =
      '<div class="hub-modal-in">' +
      '<div class="hub-modal-hd"><b>Cross-device sync</b><button id="hubClose" aria-label="Close">&times;</button></div>' +
      '<div class="hub-modal-bd">' +
      '<p class="hub-p">Progress is saved in this browser. To see the same progress on your phone and laptop, connect a <b>private GitHub Gist</b> — it acts as your database. Free, no server, all inside your own account.</p>' +
      '<label class="hub-lbl">GitHub token <span>classic token with only the <code>gist</code> scope</span></label>' +
      '<input id="hubTok" type="password" placeholder="ghp_…" autocomplete="off" spellcheck="false">' +
      '<label class="hub-lbl">Gist ID <span>leave blank on your first device and press Create</span></label>' +
      '<input id="hubGid" type="text" placeholder="e.g. 3f9a…" autocomplete="off" spellcheck="false">' +
      '<div class="hub-row"><button id="hubSave" class="hub-btn pri">Save &amp; sync</button>' +
      '<button id="hubCreate" class="hub-btn">Create new gist</button></div>' +
      '<p class="hub-msg" id="hubMsg"></p>' +
      '<hr>' +
      '<label class="hub-lbl">Start dates <span>used to work out which day of each plan you are on</span></label>' +
      '<div class="hub-row2"><span>AI course</span><input id="hubAiStart" type="date"></div>' +
      '<div class="hub-row2"><span>English plan</span><input id="hubEngStart" type="date"></div>' +
      '<hr>' +
      '<div class="hub-row"><button id="hubExport" class="hub-btn">Export backup</button>' +
      '<button id="hubImport" class="hub-btn">Import backup</button>' +
      '<input id="hubFile" type="file" accept="application/json" hidden></div>' +
      '<p class="hub-p dim">Your token is stored only in this browser and is never sent anywhere except api.github.com.</p>' +
      '</div></div>';
    document.body.appendChild(panel);

    var open = function () {
      document.getElementById("hubTok").value = token();
      document.getElementById("hubGid").value = gistId();
      document.getElementById("hubAiStart").value = cfg().aiStart || "";
      document.getElementById("hubEngStart").value = cfg().engStart || "";
      panel.classList.add("on");
    };
    var close = function () { panel.classList.remove("on"); };

    document.getElementById("hubSyncBtn").addEventListener("click", open);
    document.getElementById("hubClose").addEventListener("click", close);
    panel.addEventListener("click", function (e) { if (e.target === panel) close(); });

    var msg = function (t, k) {
      var m = document.getElementById("hubMsg");
      m.textContent = t; m.className = "hub-msg " + (k || "");
    };

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

    document.getElementById("hubAiStart").addEventListener("change", function () { setCfg({ aiStart: this.value }); });
    document.getElementById("hubEngStart").addEventListener("change", function () { setCfg({ engStart: this.value }); });

    document.getElementById("hubExport").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
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

  /* ---------------- init ---------------- */

  function init(opts) {
    opts = opts || {};
    load();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { shell(opts.page); });
    } else {
      shell(opts.page);
    }
    if (configured()) {
      sync({ silent: true });
      setInterval(function () { if (document.visibilityState === "visible") sync({ silent: true }); }, 60000);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") sync({ silent: true });
      });
      window.addEventListener("online", function () { sync({ silent: true }); });
    }
  }

  window.Hub = {
    init: init,
    state: function () { return S; },
    aiStore: aiStore, commitAi: commitAi,
    engState: engState, commitEng: commitEng,
    cfg: cfg, setCfg: setCfg,
    sync: sync, configured: configured, mergeRemote: merge,
    onChange: function (f) { listeners.push(f); },
    stats: { activeDays: activeDays, streak: streak, countDone: countDone, dayKey: dayKey },
    reload: function () { location.reload(); }
  };
})();
