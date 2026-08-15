/* ===== Learning Hub — dashboard =====
   Reads the same plan data the two trackers use, and the same
   Hub state, so everything here stays in lockstep with ai.html
   and english.html. */
(function () {
  "use strict";

  var S = Hub.state();
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s); };

  /* ---------- flatten the two plans into day lists ---------- */

  // AI: [{m, wn, di, title, weekTitle, items:[{id, html}]}]
  var AI_DAYS = [];
  [[1, M1_WEEKS], [2, M2_WEEKS]].forEach(function (pair) {
    var m = pair[0];
    pair[1].forEach(function (w) {
      w.days.forEach(function (day, di) {
        AI_DAYS.push({
          m: m, wn: w.n, di: di,
          title: day.d + " — " + day.t,
          weekTitle: w.title,
          tag: day.tag || "",
          items: day.items.map(function (it, ii) {
            return { id: "m" + m + "w" + w.n + "d" + di + "i" + ii, html: it };
          })
        });
      });
    });
  });

  // English: [{wn, di, title, weekTitle, items:[{id, text, mins}]}]
  var ENG_DAYS = [];
  WEEKS.forEach(function (w) {
    w.days.forEach(function (day, di) {
      ENG_DAYS.push({
        wn: w.n, di: di,
        title: D[di] + " — " + day.f,
        weekTitle: "Week " + w.n + " · " + w.t,
        items: day.items.map(function (it, ii) {
          return { id: "w" + w.n + "d" + di + "i" + ii, text: it[0], mins: it[1] };
        })
      });
    });
  });

  /* ---------- totals ---------- */

  function aiTotal() {
    var n = 0;
    AI_DAYS.forEach(function (d) { n += d.items.length; });
    M1_PILLARS.forEach(function (p) { n += p.i.length; });
    M2_GAPS.forEach(function (g) { n += g.i.length; });
    n += M1_INTQ.length + M2_INTQ.length;
    n += DAILY_STEPS.length * 2;   // daily loop rendered in both months
    n += WEEKLY_ROLLUP.length * 2; // weekly rollup, rendered in both months
    return n;
  }
  function engTotal() {
    var n = 0;
    ENG_DAYS.forEach(function (d) { n += d.items.length; });
    return n;
  }

  var AI_TOTAL = aiTotal(), ENG_TOTAL = engTotal();

  function isDone(map, id) { return !!(map[id] && map[id].v); }
  function aiDone() { return Hub.stats.countDone(S.ai.items); }
  function engDone() { return Hub.stats.countDone(S.eng.done); }

  /* ---------- which day are we on ---------- */

  function daysSince(iso) {
    if (!iso) return null;
    var a = new Date(iso + "T00:00:00");
    var b = new Date(); b.setHours(0, 0, 0, 0);
    return Math.floor((b - a) / 86400000);
  }

  function focusIndex(days, map, startIso) {
    var n = daysSince(startIso);
    if (n !== null && n >= 0) return Math.min(n, days.length - 1);
    // no start date: first day that isn't fully ticked
    for (var i = 0; i < days.length; i++) {
      var all = days[i].items.every(function (it) { return isDone(map, it.id); });
      if (!all) return i;
    }
    return days.length - 1;
  }

  /* ---------- rendering ---------- */

  function pct(d, t) { return t ? Math.round(d / t * 100) : 0; }

  function renderHero() {
    var ad = aiDone(), ed = engDone();
    var done = ad + ed, total = AI_TOTAL + ENG_TOTAL, p = pct(done, total);
    var R = 46, C = 2 * Math.PI * R;
    $("ringFg").style.strokeDasharray = C;
    $("ringFg").style.strokeDashoffset = C * (1 - p / 100);
    $("ringPct").textContent = p + "%";
    $("statDone").textContent = done;
    $("statLeft").textContent = total - done;
    $("statStreak").textContent = Hub.stats.streak();
  }

  function renderTracks() {
    var ad = aiDone(), ed = engDone();
    var ap = pct(ad, AI_TOTAL), ep = pct(ed, ENG_TOTAL);
    $("aiBar").style.width = ap + "%";
    $("engBar").style.width = ep + "%";
    $("aiPct").textContent = ap + "%";
    $("engPct").textContent = ep + "%";
    $("aiCnt").textContent = ad + " / " + AI_TOTAL + " items";
    $("engCnt").textContent = ed + " / " + ENG_TOTAL + " items";

    var ai = AI_DAYS[focusIndex(AI_DAYS, S.ai.items, Hub.cfg().aiStart)];
    var en = ENG_DAYS[focusIndex(ENG_DAYS, S.eng.done, Hub.cfg().engStart)];
    $("aiMeta").textContent = ai ? ai.weekTitle : "";
    $("engMeta").textContent = en ? en.weekTitle : "";
  }

  function renderToday() {
    var started = !!(Hub.cfg().aiStart || Hub.cfg().engStart);
    $("todayHd").textContent = started ? "Today" : "Up next";

    // --- AI ---
    var ai = AI_DAYS[focusIndex(AI_DAYS, S.ai.items, Hub.cfg().aiStart)];
    if (!ai) { $("aiToday").innerHTML = '<p class="empty">Course complete.</p>'; }
    else {
      $("aiTodayTitle").textContent = ai.title;
      $("aiTodayWeek").textContent = ai.weekTitle + (ai.tag ? " · " + ai.tag : "");
      $("aiToday").innerHTML = ai.items.map(function (it) {
        var d = isDone(S.ai.items, it.id);
        return '<li class="' + (d ? "done" : "") + '"><input type="checkbox" data-t="ai" data-id="' + it.id + '"' +
          (d ? " checked" : "") + ' id="t_' + it.id + '"><label for="t_' + it.id + '">' + it.html + '</label></li>';
      }).join("");
    }

    // --- English ---
    var en = ENG_DAYS[focusIndex(ENG_DAYS, S.eng.done, Hub.cfg().engStart)];
    if (!en) { $("engToday").innerHTML = '<p class="empty">Plan complete.</p>'; }
    else {
      $("engTodayTitle").textContent = en.title;
      $("engTodayWeek").textContent = en.weekTitle;
      $("engToday").innerHTML = en.items.map(function (it) {
        var d = isDone(S.eng.done, it.id);
        return '<li class="' + (d ? "done" : "") + '"><input type="checkbox" data-t="eng" data-id="' + it.id + '"' +
          (d ? " checked" : "") + ' id="t_' + it.id + '"><label for="t_' + it.id + '">' + esc(it.text) +
          (it.mins ? ' <span class="mins">' + it.mins + 'm</span>' : "") + '</label></li>';
      }).join("");
    }
  }

  function renderHeat() {
    var days = Hub.stats.activeDays();
    var out = "", d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); // monday of this week
    var start = new Date(d); start.setDate(start.getDate() - 7 * 11); // 12 weeks
    var cur = new Date(start);
    for (var w = 0; w < 12; w++) {
      out += '<div class="col">';
      for (var i = 0; i < 7; i++) {
        var k = Hub.stats.dayKey(cur);
        var c = days[k] || 0;
        var lvl = c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 12 ? 3 : 4;
        out += '<i data-l="' + lvl + '" title="' + k + ' · ' + c + ' items"></i>';
        cur.setDate(cur.getDate() + 1);
      }
      out += "</div>";
    }
    $("heat").innerHTML = out;
    $("heatFrom").textContent = Hub.stats.dayKey(start);
    $("heatTo").textContent = Hub.stats.dayKey(new Date());
  }

  /* ---------- resources ---------- */

  var RESOURCES = [];
  function addRes(rows, track) {
    (rows || []).forEach(function (r) {
      if (!r || !r[1]) return;
      RESOURCES.push({ title: r[0], url: r[1], desc: r[2] || "", track: track });
    });
  }
  addRes(M1_RES.t1, "AI · primary"); addRes(M1_RES.t2, "AI · reference"); addRes(M1_RES.yt, "AI · video");
  addRes(M2_RES.t1, "AI · month 2"); addRes(M2_RES.t2, "AI · tooling"); addRes(M2_RES.yt, "AI · video");
  addRes(DAILY_SOURCES, "AI · daily loop");

  function renderRes(q) {
    q = (q || "").toLowerCase();
    var list = RESOURCES.filter(function (r) {
      return !q || (r.title + " " + r.desc + " " + r.track).toLowerCase().indexOf(q) > -1;
    });
    $("resCount").textContent = list.length + " links";
    $("resList").innerHTML = list.map(function (r) {
      return '<a href="' + r.url + '" target="_blank" rel="noopener">' + esc(r.title) +
        '<span>' + esc(r.desc).replace(/<[^>]+>/g, "").slice(0, 90) + '</span></a>';
    }).join("") || '<p class="empty">Nothing matches.</p>';
  }

  /* ---------- wiring ---------- */

  function renderAll() {
    S = Hub.state();
    renderHero(); renderTracks(); renderToday(); renderHeat();
    $("setupBanner").style.display = Hub.configured() ? "none" : "flex";
  }

  document.addEventListener("change", function (e) {
    var b = e.target;
    if (b.tagName !== "INPUT" || b.type !== "checkbox" || !b.dataset.t) return;
    if (b.dataset.t === "ai") {
      var st = Hub.aiStore();
      if (b.checked) st[b.dataset.id] = true; else delete st[b.dataset.id];
      Hub.commitAi(st);
    } else {
      var es = Hub.engState();
      if (b.checked) es.done[b.dataset.id] = 1; else delete es.done[b.dataset.id];
      Hub.commitEng(es);
    }
    b.closest("li").classList.toggle("done", b.checked);
    S = Hub.state();
    renderHero(); renderTracks(); renderHeat();
  });

  $("resSearch").addEventListener("input", function () { renderRes(this.value); });
  $("bannerBtn").addEventListener("click", function () { document.getElementById("hubSyncBtn").click(); });

  Hub.onChange(renderAll);
  renderAll();
  renderRes("");
})();
