/* =========================================================================
   Learning Hub — home
   Combined progress, one-tap entry into either track, a live timer, today's
   tasks from both plans, the daily AI-update ritual, activity, resources.
   ========================================================================= */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.6l4.6 4.6L19 7.8"/></svg>';
  var ICON = {
    play:  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6.5" y="4.5" width="4" height="15" rx="1.2"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2"/></svg>'
  };
  var MAX_ROWS = 6;

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* ============================ hero ============================ */

  $("heroRing").innerHTML = UI.ringSvg(132, 12, "gradRing") +
    '<div class="lab"><b id="ringPct">0%</b><i>overall</i></div>';

  function renderHero() {
    var ai = PLANS.progress("ai"), en = PLANS.progress("eng");
    var done = ai.done + en.done, total = PLANS.totals.all;
    var pct = total ? Math.round(done / total * 100) : 0;
    UI.setRing($("heroRing"), pct / 100);
    $("ringPct").textContent = pct + "%";
    UI.countTo($("statDone"), done);
    UI.countTo($("statStreak"), Hub.stats.streak());
    $("statTime").textContent = UI.human(Hub.timeToday() + runningMs());

    var h = new Date().getHours();
    var part = h < 5 ? "Late night" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
    var todayN = Hub.stats.doneToday();
    $("greeting").textContent = part + ", Ivan — " +
      (todayN ? todayN + " task" + (todayN === 1 ? "" : "s") + " done today. Keep it moving." :
                "nothing ticked today yet. One task is enough to keep the streak.");
  }

  /* ============================ tracks + quick start ============================ */

  function renderTracks() {
    [["ai", "ai", "AI"], ["eng", "en", "English"]].forEach(function (t) {
      var key = t[0], p = PLANS.progress(key), pre = t[1];
      $(pre + "Bar").style.width = p.pct + "%";
      $(pre + "Pct").textContent = p.pct + "%";
      $(pre + "Cnt").textContent = p.done + " / " + p.total + " items";
      var d = PLANS.days(key)[PLANS.currentIndex(key)];
      $(pre + "Meta").textContent = d ? d.weekLabel : "";
    });

    ["ai", "eng"].forEach(function (key) {
      var pre = key === "ai" ? "qAi" : "qEn";
      var i = PLANS.currentIndex(key), d = PLANS.days(key)[i], st = PLANS.dayState(d);
      var started = !!PLANS.startIso(key);
      $(pre + "Title").textContent = st.complete
        ? "Day " + d.n + " is done — review"
        : (st.done ? "Continue day " + d.n : (started ? "Start day " + d.n : "Start day " + d.n));
      $(pre + "Sub").textContent = esc(d.sub) + " · " + (st.total - st.done) + " left";
    });
  }

  /* ============================ today ============================ */

  function dayCard(key, pre) {
    var i = PLANS.currentIndex(key), d = PLANS.days(key)[i], st = PLANS.dayState(d);
    $(pre + "TodayTitle").textContent = d.label + " — " + d.sub;
    $(pre + "TodayWeek").textContent = d.weekLabel;
    $(pre + "Cnt2").textContent = st.done + " / " + st.total;
    $(pre + "More").href = (key === "ai" ? "ai.html" : "english.html") + "#d" + d.n;

    var rows = d.items.slice(0, MAX_ROWS).map(function (it) {
      var done = Hub.isDone(key, it.id);
      var spent = Hub.timeOf(it.id);
      return '<li class="task' + (done ? " done" : "") + '" data-track="' + key + '" data-id="' + it.id + '">' +
        '<button class="tick" aria-label="Toggle">' + CHECK + '</button>' +
        '<div class="body"><div class="txt">' + it.html +
          (it.mins ? '<span class="mins">' + it.mins + 'm</span>' : "") +
          (spent ? '<span class="spent">' + UI.human(spent) + '</span>' : "") +
        '</div></div>' +
        ASK.button(it.id) +
        '<button class="timerbtn" data-id="' + it.id + '" data-mins="' + (it.mins || 0) + '" aria-label="Timer">' +
        (running.id === it.id ? ICON.pause : ICON.play) + '</button></li>';
    }).join("");
    $(pre + "Today").innerHTML = rows || '<p class="empty">Nothing scheduled.</p>';
    ASK.paint();
    if (d.items.length > MAX_ROWS) {
      $(pre + "More").textContent = "Open the full day — " + (d.items.length - MAX_ROWS) + " more →";
    } else {
      $(pre + "More").textContent = "Open the full day →";
    }
  }

  function renderToday() {
    $("todayHd").textContent = (Hub.cfg().aiStart || Hub.cfg().engStart) ? "Today" : "Up next";
    dayCard("ai", "ai");
    dayCard("eng", "en");
  }

  /* ============================ timer ============================ */

  var running = { id: null, t0: 0, mins: 0, raf: null, track: null, label: "" };

  function runningMs() { return running.id ? Date.now() - running.t0 : 0; }

  function startTimer(id, mins, track, label) {
    stopTimer(true);
    running = { id: id, t0: Date.now(), mins: mins, raf: null, track: track, label: label };
    UI.sfx.start();
    $("timerBar").classList.add("live", track === "ai" ? "t-ai" : "t-eng");
    $("tStop").style.display = "";
    tickLoop();
    renderToday();
  }

  function stopTimer(silent) {
    if (!running.id) return;
    var ms = Date.now() - running.t0;
    Hub.addTime(running.id, ms);
    cancelAnimationFrame(running.raf);
    running = { id: null, t0: 0, mins: 0, raf: null, track: null, label: "" };
    $("timerBar").classList.remove("live", "t-ai", "t-eng");
    $("tStop").style.display = "none";
    $("tLead").textContent = "0:00";
    $("tLeadSub").textContent = "nothing running — hit ▸ on any task to time it";
    if (!silent) UI.toast("Logged " + UI.human(ms));
    paintTimeTotals();
    renderToday();
  }

  function tickLoop() {
    if (!running.id) return;
    var ms = Hub.timeOf(running.id) + runningMs();
    $("tLead").textContent = UI.clock(ms);
    $("tLeadSub").textContent = running.label.replace(/<[^>]+>/g, "").slice(0, 64) +
      (running.mins ? " · target " + running.mins + "m" : "");
    $("statTime").textContent = UI.human(Hub.timeToday() + runningMs());
    running.raf = requestAnimationFrame(tickLoop);
  }

  function paintTimeTotals() {
    $("tToday").textContent = UI.human(Hub.timeToday());
    $("tAll").textContent = UI.human(Hub.timeTotal());
  }

  $("tStop").addEventListener("click", function () { stopTimer(); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && running.id) stopTimer(true);
  });

  /* ============================ daily AI update ritual ============================ */

  function renderLoop() {
    var steps = DAILY_STEPS.map(function (s, i) {
      var id = "m1dl" + i, done = Hub.isDone("ai", id);
      return '<li class="task' + (done ? " done" : "") + '" data-track="ai" data-id="' + id + '">' +
        '<button class="tick" aria-label="Toggle">' + CHECK + '</button>' +
        '<div class="body"><div class="txt">' + s + '</div></div>' + ASK.button(id) + '</li>';
    }).join("");

    var srcs = DAILY_SOURCES.map(function (r) {
      return '<a class="src" href="' + r[1] + '" target="_blank" rel="noopener">' + esc(r[0]) +
        '<span class="cad" data-c="' + esc(r[3] || "") + '">' + esc(r[3] || "ref") + '</span></a>';
    }).join("");

    var doneN = DAILY_STEPS.filter(function (_, i) { return Hub.isDone("ai", "m1dl" + i); }).length;

    $("loopCard").innerHTML =
      '<div class="hd" style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:4px">' +
        '<h3 style="margin:0;font-size:16px;font-weight:700">Skim · classify · log · fold in</h3>' +
        '<span class="cnt" style="font-size:12px;color:var(--faint)">' + doneN + ' / ' + DAILY_STEPS.length + '</span></div>' +
      '<p style="font-size:13.2px;color:var(--dim);margin:0 0 14px;line-height:1.6">' +
        'Every item gets a verdict — <b style="color:var(--rose)">Act</b>, <b style="color:var(--amber)">Track</b>, or <b>Ignore</b> — and the loop ends with one line written down. Cap it at 15 minutes; longer means you are reading, not filtering.</p>' +
      '<ul class="tasks">' + steps + '</ul>' +
      '<div class="srcs">' + srcs + '</div>' +
      '<p style="font-size:12.5px;color:var(--faint);margin:14px 0 0;line-height:1.6">' +
        '<b>Discipline rule:</b> during months 1–2 a new model release is never a reason to change what you are studying that day. Note it, keep going. ' +
        '<a href="ai.html" style="color:var(--a1);text-decoration:none">Full loop &amp; weekly rollup →</a></p>';
  }

  /* ============================ heatmap ============================ */

  function renderHeat() {
    var days = Hub.stats.activeDays(), out = "";
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    var start = new Date(d); start.setDate(start.getDate() - 7 * 11);
    var cur = new Date(start);
    for (var w = 0; w < 12; w++) {
      out += '<div class="col">';
      for (var i = 0; i < 7; i++) {
        var k = Hub.stats.dayKey(cur), c = days[k] || 0;
        var lvl = c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 12 ? 3 : 4;
        out += '<i data-l="' + lvl + '" title="' + k + ' · ' + c + ' items"></i>';
        cur.setDate(cur.getDate() + 1);
      }
      out += "</div>";
    }
    $("heat").innerHTML = out;
    $("heatFrom").textContent = Hub.stats.dayKey(start);
    $("heatTo").textContent = "today";
  }

  /* ============================ resources ============================ */

  function renderRes(q) {
    q = (q || "").toLowerCase();
    var list = PLANS.resources.filter(function (r) {
      return !q || (r.title + " " + r.desc + " " + r.group).toLowerCase().indexOf(q) > -1;
    });
    $("resCount").textContent = list.length + " links";
    $("resList").innerHTML = list.map(function (r) {
      return '<a href="' + r.url + '" target="_blank" rel="noopener">' + esc(r.title) +
        '<span>' + esc(r.desc).slice(0, 96) + '</span></a>';
    }).join("") || '<p class="empty">Nothing matches.</p>';
  }

  /* ============================ wiring ============================ */

  document.addEventListener("click", function (e) {
    var tk = e.target.closest(".tick");
    if (tk) {
      var row = tk.closest(".task"), track = row.dataset.track, id = row.dataset.id;
      var was = Hub.isDone(track, id);
      Hub.setDone(track, id, !was);
      row.classList.toggle("done", !was);
      row.classList.remove("pop"); void row.offsetWidth; row.classList.add("pop");
      if (!was) UI.sfx.tick(); else UI.sfx.untick();
      renderHero(); renderTracks(); renderHeat(); renderLoop();
      var i = PLANS.currentIndex(track), d = PLANS.days(track)[i];
      if (!was && PLANS.dayState(d).complete) {
        UI.confetti({ count: 160 }); UI.sfx.win();
        UI.toast("🎉 Day " + d.n + " complete");
      }
      renderToday();
      return;
    }
    var tb = e.target.closest(".timerbtn");
    if (tb) {
      var row2 = tb.closest(".task");
      if (running.id === tb.dataset.id) stopTimer();
      else startTimer(tb.dataset.id, +tb.dataset.mins, row2.dataset.track, row2.querySelector(".txt").textContent);
    }
  });

  $("resSearch").addEventListener("input", function () { renderRes(this.value); });
  $("bannerBtn").addEventListener("click", function () { $("hubSyncBtn").click(); });

  function renderAll() {
    renderHero(); renderTracks(); renderToday(); renderLoop(); renderHeat();
    paintTimeTotals();
    $("setupBanner").style.display = Hub.configured() ? "none" : "flex";
  }

  Hub.onChange(renderAll);

  function boot() { UI.gradDefs(); renderAll(); renderRes(""); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
