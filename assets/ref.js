/* =========================================================================
   Learning Hub — reference sections
   Everything in the two plans that isn't a scheduled day: the concept map,
   resource tables, interview banks, the daily model-update loop, and the
   English template / trap / pronunciation material plus its three tools.
   ========================================================================= */
window.REF = (function () {
  "use strict";

  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.6l4.6 4.6L19 7.8"/></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function checkList(track, pairs) {
    return '<ul class="tasks">' + pairs.map(function (p) {
      var done = Hub.isDone(track, p.id);
      return '<li class="task' + (done ? " done" : "") + '" data-id="' + p.id + '" data-track="' + track + '">' +
        '<button class="tick" aria-label="Toggle">' + CHECK + '</button>' +
        '<div class="body"><div class="txt">' + p.html + '</div></div>' +
        ASK.button(p.id) + '</li>';
    }).join("") + '</ul>';
  }

  function table(rows, cols) {
    return '<table><tr>' + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>" +
      rows.map(function (r) {
        return '<tr><td style="white-space:nowrap"><a href="' + r[1] + '" target="_blank" rel="noopener">' + esc(r[0]) + '</a></td>' +
          '<td>' + (r[2] || "") + '</td>' + (r[3] ? '<td class="meta" style="white-space:nowrap">' + r[3] + '</td>' : "") + '</tr>';
      }).join("") + "</table>";
  }

  /* ============================ AI ============================ */

  function aiTabs() {
    var pillars = [];
    M1_PILLARS.forEach(function (p, pi) {
      p.i.forEach(function (x, xi) { pillars.push({ id: "p" + pi + "i" + xi, html: esc(x), group: p.h }); });
    });

    var conceptHtml = '<p class="hub-p">Ten pillars — tick each one as it genuinely clicks, not when you have read about it.</p>' +
      '<div class="refpanel"><div class="grid2">' +
      M1_PILLARS.map(function (p, pi) {
        return '<div class="card"><h3>' + esc(p.h) + '</h3>' +
          checkList("ai", p.i.map(function (x, xi) { return { id: "p" + pi + "i" + xi, html: esc(x) }; })) + '</div>';
      }).join("") +
      '</div><div class="tip"><strong>Skip this month:</strong> building neural nets from scratch · deep maths proofs · training from scratch · classical ML beyond vocabulary · framework tourism. Learn the raw agent loop, then <b>one</b> framework.</div></div>';

    var resHtml = '<div class="refpanel">' +
      '<div class="card"><h3>Tier 1 — primary (these carry month 1)</h3>' + table(M1_RES.t1, ["Resource", "What it covers"]) + '</div>' +
      '<div class="card"><h3>Tier 2 — reference &amp; depth</h3>' + table(M1_RES.t2, ["Resource", "What it covers"]) + '</div>' +
      '<div class="card"><h3>Video &amp; community</h3>' + table(M1_RES.yt, ["Source", "Best for", "When"]) +
        '<div class="tip">On X, follow: @simonw · @HamelHusain · @karpathy · @swyx · @eugeneyan · @jerryjliu0</div></div>' +
      '<div class="card"><h3>Month 2 — core curriculum</h3>' + table(M2_RES.t1, ["Resource", "What it covers"]) + '</div>' +
      '<div class="card"><h3>Apple Silicon, compute &amp; tooling</h3>' +
        '<p>Your M4 Pro is a legitimately good ML machine — if you use MLX rather than fighting CUDA.</p>' +
        table(M2_RES.t2, ["Resource", "What it covers"]) + '</div>' +
      '<div class="card"><h3>Month 2 — video &amp; writing</h3>' + table(M2_RES.yt, ["Source", "Best for", "When"]) + '</div>' +
      '</div>';

    var intHtml = '<div class="refpanel">' +
      '<div class="card"><h3>AI Engineer — question bank</h3>' +
        checkList("ai", M1_INTQ.map(function (q, i) { return { id: "m1iq" + i, html: q }; })) + '</div>' +
      '<div class="card"><h3>Applied Scientist — question bank</h3>' +
        checkList("ai", M2_INTQ.map(function (q, i) { return { id: "m2iq" + i, html: q }; })) +
        '<div class="tip"><strong>Your unfair advantage:</strong> most applied scientist candidates cannot ship. You can. "I can take a model from experiment to production with evals, tracing and cost control" is a rarer sentence than "I know transformers."</div></div>' +
      '</div>';

    var realHtml = '<div class="refpanel">' +
      '<div class="card warn"><h3>Say this out loud once</h3>' +
        '<p>Applied Scientist / MLE is genuinely reachable from your background, but it is a <strong>6–12 month</strong> path, not a one-month one. Month 2 gets you past ML screens and gives you a portfolio that reads as scientific. It does not make you a scientist yet — interviewers can tell the difference, and pretending otherwise is the fastest way to fail an onsite.</p></div>' +
      '<div class="grid2">' + M2_GAPS.map(function (g, gi) {
        return '<div class="card"><h3>' + esc(g.h) + '</h3>' +
          checkList("ai", g.i.map(function (x, xi) { return { id: "g" + gi + "i" + xi, html: esc(x) }; })) + '</div>';
      }).join("") + '</div></div>';

    var loopHtml = dailyLoopHtml(1) ;

    return [
      { key: "map", label: "Concept Map", html: conceptHtml },
      { key: "res", label: "Resources", html: resHtml },
      { key: "int", label: "Interview Bank", html: intHtml },
      { key: "real", label: "Reality Check", html: realHtml },
      { key: "loop", label: "⟳ Daily Loop", html: loopHtml }
    ];
  }

  /* the daily model-update ritual — reused on the dashboard */
  function dailyLoopHtml(m) {
    return '<div class="refpanel">' +
      '<div class="card"><h3>⟳ Daily model-update loop</h3>' +
      '<p>15 minutes, every morning, on top of your study hours. The failure mode is doom-scrolling releases and learning nothing — this loop forces a decision on every item and ends with something written down. Cap it at 15 minutes; if it runs longer you are reading, not filtering.</p>' +
      checkList("ai", DAILY_STEPS.map(function (s, i) { return { id: "m" + m + "dl" + i, html: s }; })) +
      '</div>' +
      '<div class="card"><h3>Sources</h3><p>Two subscriptions is the right number. The trackers are for lookup, not reading.</p>' +
      table(DAILY_SOURCES, ["Source", "Why", "Cadence"]) +
      '<div class="tip"><strong>Discipline rule:</strong> during months 1–2, a new model release is <b>never</b> a reason to change what you are studying that day. Note it, keep going.</div></div>' +
      '<div class="card"><h3>Weekly rollup</h3><p>Sunday, 20 minutes — do this instead of the daily loop on rest days.</p>' +
      checkList("ai", WEEKLY_ROLLUP.map(function (s, i) { return { id: "m" + m + "wk" + i, html: s }; })) +
      '</div></div>';
  }

  /* ============================ English ============================ */

  function engTabs() {
    var t = [
      { key: "over", label: "Overview", html: '<div class="refpanel">' + ENG_REF.overview + '</div>' },
      { key: "speak", label: "Speaking Templates", html: '<div class="refpanel">' + ENG_REF.speaking + '</div>' },
      { key: "write", label: "Writing Templates", html: '<div class="refpanel">' + ENG_REF.writing + '</div>' },
      { key: "work", label: "Work &amp; Interview", html: '<div class="refpanel">' + ENG_REF.work + '</div>' },
      { key: "canto", label: "Cantonese Traps", html: '<div class="refpanel">' + ENG_REF.canto + '</div>' },
      { key: "sound", label: "Pronunciation", html: '<div class="refpanel">' + ENG_REF.sound + '</div>' },
      { key: "gram", label: "Grammar Hit List", html: '<div class="refpanel">' + ENG_REF.grammar + '</div>' },
      { key: "test", label: "Weekly Test", html: '<div class="refpanel" id="quizPanel"></div>' },
      { key: "log", label: "My Error Log", html: '<div class="refpanel" id="logPanel"></div>' }
    ];
    return t;
  }

  /* ---- the three English tools ---- */

  function renderQuiz() {
    var el = document.getElementById("quizPanel");
    if (!el) return;
    el.innerHTML =
      '<div class="card"><h3>Weekly grammar test</h3>' +
      '<p>20 sentences, no notes, say each fix <strong>aloud</strong>. Tap a sentence to reveal the fix. Record your score below — it is the single clearest signal of whether the plan is working.</p>' +
      '<div class="hub-row"><button class="btn" id="qHide">Hide all answers</button></div></div>' +
      '<div class="card"><h3>Scores out of 20</h3><div class="scorerow" id="scoreRow"></div>' +
      '<p class="meta" id="scoreTrend" style="margin-top:12px"></p></div>' +
      '<div id="qList"></div>';

    document.getElementById("qList").innerHTML = QUIZ.map(function (q, i) {
      return '<div class="qcard" id="q' + i + '"><div class="q" data-i="' + i + '"><b>' + (i + 1) + '</b><span>' + q[0] + '</span></div>' +
        '<div class="a"><div style="margin-bottom:7px">' + q[1] + '</div><div class="meta">' + (q[2] || "") + '</div></div></div>';
    }).join("");

    document.getElementById("qList").addEventListener("click", function (e) {
      var q = e.target.closest(".q");
      if (q) document.getElementById("q" + q.dataset.i).classList.toggle("open");
    });
    document.getElementById("qHide").addEventListener("click", function () {
      document.querySelectorAll("#qList .qcard").forEach(function (c) { c.classList.remove("open"); });
    });
    renderScores();
  }

  function renderScores() {
    var row = document.getElementById("scoreRow");
    if (!row) return;
    var out = "";
    for (var w = 1; w <= 8; w++) {
      var v = Hub.engScore(w);
      out += '<label>W' + w + '<input type="number" min="0" max="20" data-w="' + w + '" value="' + (v == null ? "" : v) + '"></label>';
    }
    row.innerHTML = out;
    row.onchange = function (e) {
      var i = e.target;
      if (!i.dataset.w) return;
      var v = i.value === "" ? null : Math.max(0, Math.min(20, parseInt(i.value, 10) || 0));
      Hub.setEngScore(i.dataset.w, v);
      if (v != null) i.value = v;
      trend();
    };
    trend();
  }

  function trend() {
    var el = document.getElementById("scoreTrend");
    if (!el) return;
    var pts = [];
    for (var w = 1; w <= 8; w++) { var v = Hub.engScore(w); if (v != null) pts.push([w, v]); }
    if (pts.length < 2) { el.textContent = pts.length ? "One score logged. Two makes a trend." : "No scores yet."; return; }
    var d = pts[pts.length - 1][1] - pts[0][1];
    el.innerHTML = pts.map(function (p) { return "W" + p[0] + ": <strong>" + p[1] + "</strong>"; }).join(" · ") +
      ' — <span class="' + (d >= 0 ? "good" : "bad") + '">' + (d >= 0 ? "+" : "") + d + " since week " + pts[0][0] + "</span>";
  }

  function renderLog() {
    var el = document.getElementById("logPanel");
    if (!el) return;
    el.innerHTML =
      '<div class="card"><h3>My error log</h3>' +
      '<p>Every mistake goes here. Anything that shows up three or more times is your real weakness — drill that, ignore the rest.</p>' +
      '<div class="logrow">' +
      '<input id="eWrong" placeholder="What you said (wrong)">' +
      '<input id="eRight" placeholder="The fix (correct)">' +
      '<input id="eRule" placeholder="Pattern / rule" style="max-width:180px">' +
      '<button class="btn pri" id="eAdd">Add</button></div>' +
      '<div id="eSummary" class="meta"></div></div>' +
      '<div id="eList"></div>';

    document.getElementById("eAdd").addEventListener("click", addErr);
    ["eWrong", "eRight", "eRule"].forEach(function (id) {
      document.getElementById(id).addEventListener("keydown", function (e) { if (e.key === "Enter") addErr(); });
    });
    paintLog();
  }

  function addErr() {
    var w = document.getElementById("eWrong").value.trim();
    var r = document.getElementById("eRight").value.trim();
    var u = document.getElementById("eRule").value.trim();
    if (!w || !r) { UI.toast("Need both the wrong and the corrected version"); return; }
    var list = Hub.engErrs();
    list.push({ wrong: w, right: r, rule: u || "untagged" });
    Hub.setEngErrs(list);
    document.getElementById("eWrong").value = "";
    document.getElementById("eRight").value = "";
    document.getElementById("eWrong").focus();
    UI.sfx.tick();
    paintLog();
  }

  function paintLog() {
    var list = Hub.engErrs();
    var box = document.getElementById("eList");
    var sum = document.getElementById("eSummary");
    if (!box) return;
    if (!list.length) { box.innerHTML = '<p class="empty">Nothing logged yet. Add your first mistake above.</p>'; sum.textContent = ""; return; }

    var counts = {};
    list.forEach(function (e) { var k = (e.rule || "untagged").toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 4);
    sum.innerHTML = list.length + " logged — most frequent: " +
      top.map(function (k) { return "<strong>" + esc(k) + "</strong> ×" + counts[k]; }).join(" · ");

    box.innerHTML = list.slice().reverse().map(function (e, ri) {
      var i = list.length - 1 - ri;
      return '<div class="errcard"><div><span class="bad">' + esc(e.wrong) + '</span> → <span class="good">' + esc(e.right) + '</span>' +
        '<div class="meta">' + esc(e.rule || "untagged") + '</div></div>' +
        '<button class="x" data-i="' + i + '" aria-label="Delete">&times;</button></div>';
    }).join("");

    box.onclick = function (e) {
      var b = e.target.closest(".x");
      if (!b) return;
      var list = Hub.engErrs();
      list.splice(+b.dataset.i, 1);
      Hub.setEngErrs(list);
      paintLog();
    };
  }

  /* ============================ mount ============================ */

  function mount(track, tabsEl, bodyEl) {
    var tabs = track === "ai" ? aiTabs() : engTabs();
    document.getElementById(tabsEl).innerHTML = tabs.map(function (t, i) {
      return '<button data-k="' + t.key + '"' + (i === 0 ? ' class="on"' : '') + '>' + t.label + '</button>';
    }).join("");
    document.getElementById(bodyEl).innerHTML = tabs.map(function (t, i) {
      return '<div class="refpanel-host' + (i === 0 ? " on" : "") + '" data-k="' + t.key + '" style="display:' + (i === 0 ? "block" : "none") + '">' + t.html + '</div>';
    }).join("");

    document.getElementById(tabsEl).addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      this.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
      document.getElementById(bodyEl).querySelectorAll(".refpanel-host").forEach(function (p) {
        p.style.display = p.dataset.k === b.dataset.k ? "block" : "none";
      });
    });

    // checkbox rows inside reference panels write straight through to Hub
    document.getElementById(bodyEl).addEventListener("click", function (e) {
      var tk = e.target.closest(".tick");
      if (!tk) return;
      var row = tk.closest(".task"), id = row.dataset.id;
      var was = Hub.isDone(track, id);
      Hub.setDone(track, id, !was);
      row.classList.toggle("done", !was);
      row.classList.remove("pop"); void row.offsetWidth; row.classList.add("pop");
      if (!was) UI.sfx.tick(); else UI.sfx.untick();
      if (window.onHubProgress) window.onHubProgress();
    });

    if (track === "eng") { renderQuiz(); renderLog(); }
    ASK.paint();
  }

  return { mount: mount, dailyLoopHtml: dailyLoopHtml, checkList: checkList, table: table };
})();
