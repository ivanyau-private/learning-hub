/* =========================================================================
   Learning Hub — plan model
   Flattens both curricula into a single day-indexed shape so the dashboard
   and both trackers read from exactly the same source.

   Day: { n, track, label, sub, weekLabel, weekN, tag, items:[{id,html,mins}] }
   ========================================================================= */
window.PLANS = (function () {
  "use strict";

  /* ---------------- AI: 8 weeks × 7 days across 2 months ---------------- */
  var AI_DAYS = [];
  [[1, M1_WEEKS], [2, M2_WEEKS]].forEach(function (pair) {
    var m = pair[0];
    pair[1].forEach(function (w) {
      w.days.forEach(function (day, di) {
        AI_DAYS.push({
          n: AI_DAYS.length + 1,
          track: "ai",
          label: day.d,
          sub: day.t,
          weekLabel: w.title,
          weekGoal: w.goal,
          weekN: w.n,
          month: m,
          tag: day.tag || "",
          items: day.items.map(function (it, ii) {
            return { id: "m" + m + "w" + w.n + "d" + di + "i" + ii, html: it, mins: 0 };
          })
        });
        // the day's reading, appended with its own id namespace so it never
        // collides with (or shifts) the positional task ids above
        var dn = AI_DAYS.length, r = (typeof READINGS !== "undefined") && READINGS[dn];
        if (r) {
          AI_DAYS[dn - 1].items.push({
            id: "read" + dn,
            html: '<b>Read \u00b7 ' + BOOKS[r[0]].title + '</b> \u2014 ' + r[1] +
                  '<span class="why">' + r[2] + '</span>',
            mins: 35,
            reading: true
          });
        }
      });
    });
  });

  /* ---------------- English: 8 weeks × 7 days ---------------- */
  var DOW = (typeof D !== "undefined") ? D : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var ENG_DAYS = [];
  WEEKS.forEach(function (w) {
    w.days.forEach(function (day, di) {
      ENG_DAYS.push({
        n: ENG_DAYS.length + 1,
        track: "eng",
        label: "Day " + (ENG_DAYS.length + 1),
        sub: day.f,
        weekLabel: "Week " + w.n + " — " + w.t,
        weekGoal: w.goal,
        weekN: w.n,
        dow: DOW[di],
        phase: w.phase || "",
        tag: /GRAMMAR REVIEW/i.test(day.f) ? "KEY" : "",
        items: day.items.map(function (it, ii) {
          return { id: "w" + w.n + "d" + di + "i" + ii, html: escapeHtml(it[0]), mins: it[1] || 0 };
        })
      });
    });
  });

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------- totals ---------------- */

  function sumItems(days) { return days.reduce(function (a, d) { return a + d.items.length; }, 0); }

  // The AI tracker also has non-day checkboxes (concept map, interview banks,
  // gaps, the daily loop and the weekly rollup) — counted so percentages match.
  var AI_EXTRA =
    M1_PILLARS.reduce(function (a, p) { return a + p.i.length; }, 0) +
    M2_GAPS.reduce(function (a, g) { return a + g.i.length; }, 0) +
    M1_INTQ.length + M2_INTQ.length +
    DAILY_STEPS.length * 2 + WEEKLY_ROLLUP.length * 2;

  var TOTALS = {
    ai: sumItems(AI_DAYS) + AI_EXTRA,
    eng: sumItems(ENG_DAYS),
    aiDays: sumItems(AI_DAYS),
    engDays: sumItems(ENG_DAYS)
  };
  TOTALS.all = TOTALS.ai + TOTALS.eng;

  /* ---------------- day helpers ---------------- */

  function days(track) { return track === "ai" ? AI_DAYS : ENG_DAYS; }

  function dayState(day) {
    var done = 0;
    day.items.forEach(function (it) { if (Hub.isDone(day.track, it.id)) done++; });
    return { done: done, total: day.items.length, complete: done === day.items.length && done > 0 };
  }

  function startIso(track) { return track === "ai" ? Hub.cfg().aiStart : Hub.cfg().engStart; }

  function daysSince(iso) {
    if (!iso) return null;
    var a = new Date(iso + "T00:00:00"), b = new Date();
    b.setHours(0, 0, 0, 0);
    return Math.floor((b - a) / 86400000);
  }

  /* Which day should we land on? The scheduled one if a start date is set,
     otherwise the first day that isn't finished. */
  function currentIndex(track) {
    var list = days(track);
    var n = daysSince(startIso(track));
    if (n !== null && n >= 0) return Math.max(0, Math.min(n, list.length - 1));
    for (var i = 0; i < list.length; i++) if (!dayState(list[i]).complete) return i;
    return list.length - 1;
  }

  function progress(track) {
    var map = track === "ai" ? Hub.state().ai.items : Hub.state().eng.done;
    var done = Hub.stats.countDone(map), total = TOTALS[track];
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  /* ---------------- resources ---------------- */

  var RESOURCES = [];
  function addRes(rows, group) {
    (rows || []).forEach(function (r) {
      if (!r || !r[1]) return;
      RESOURCES.push({ title: r[0], url: r[1], desc: String(r[2] || "").replace(/<[^>]+>/g, ""), group: group });
    });
  }
  addRes(M1_RES.t1, "AI · primary");
  addRes(M1_RES.t2, "AI · reference");
  addRes(M1_RES.yt, "AI · video");
  addRes(M2_RES.t1, "AI · month 2");
  addRes(M2_RES.t2, "AI · Apple Silicon & tooling");
  addRes(M2_RES.yt, "AI · video");
  addRes(DAILY_SOURCES, "AI · daily loop");
  if (typeof BOOKS !== "undefined") {
    Object.keys(BOOKS).forEach(function (k) {
      var b = BOOKS[k];
      RESOURCES.push({ title: b.title, url: "ai.html#books", desc: b.author + " — " + b.role, group: "Books · your PDFs" });
    });
  }

  return {
    ai: AI_DAYS, eng: ENG_DAYS, days: days,
    totals: TOTALS, dayState: dayState, currentIndex: currentIndex,
    progress: progress, resources: RESOURCES, daysSince: daysSince, startIso: startIso
  };
})();
