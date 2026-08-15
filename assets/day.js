/* =========================================================================
   Learning Hub — day-by-day view + focus mode
   One day on screen at a time, a rail to jump between days, a per-task
   timer, and a distraction-free focus mode driven by keyboard or swipe.
   ========================================================================= */
window.DayView = (function () {
  "use strict";

  var TRACK, DAYS, host, idx = 0;
  var focusEl = null, fIdx = 0, fList = [];
  var timer = { id: null, t0: 0, raf: null, target: 0 };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.6l4.6 4.6L19 7.8"/></svg>';
  var ICON = {
    play:  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="6.5" y="4.5" width="4" height="15" rx="1.2"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2"/></svg>',
    left:  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    bolt:  '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M13.5 2L4 13.6h6.1L9.6 22 20 10.2h-6.3z"/></svg>'
  };

  /* ============================ rail ============================ */

  function renderRail() {
    var out = "", lastWeek = null;
    DAYS.forEach(function (d, i) {
      if (d.weekN !== lastWeek) {
        lastWeek = d.weekN;
        out += '<div class="wsep">W' + d.weekN + '</div>';
      }
      var st = PLANS.dayState(d);
      var cls = "pip" + (i === idx ? " on" : "") + (st.complete ? " done" : (st.done ? " part" : ""));
      out += '<button class="' + cls + '" data-i="' + i + '" title="' + esc(d.sub) + '">' +
        '<b>' + d.n + '</b><u>' + (d.dow || ("M" + d.month)) + '</u></button>';
    });
    $("#dvRail").innerHTML = out;
    var on = $("#dvRail .pip.on");
    if (on) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  /* ============================ day panel ============================ */

  function renderDay() {
    var d = DAYS[idx], st = PLANS.dayState(d);
    var chip = d.tag ? '<span class="chip ' + d.tag.toLowerCase() + '">' + (d.tag === "KEY" ? "Key day" : d.tag === "REST" ? "Rest" : "Mac-native") + '</span>' : "";
    var est = d.items.reduce(function (a, it) { return a + (it.mins || 0); }, 0);
    var spent = d.items.reduce(function (a, it) { return a + Hub.timeOf(it.id); }, 0);

    host.innerHTML =
      '<div class="dayhead">' +
        '<div class="n">' + d.n + '</div>' +
        '<div class="t"><h2>' + esc(d.sub) + chip + '</h2>' +
        '<p>' + esc(d.weekLabel) + (d.dow ? " · " + d.dow : "") + (est ? " · ~" + est + " min" : "") + '</p></div>' +
      '</div>' +
      (d.weekGoal && (idx === 0 || DAYS[idx - 1].weekN !== d.weekN)
        ? '<div class="card" style="margin:14px 0 0;font-size:13.5px;color:var(--dim)">' + esc(d.weekGoal) + '</div>' : "") +
      '<div class="dayprog">' +
        '<div class="bar"><i id="dvBar" style="width:0%"></i></div>' +
        '<span class="pc" id="dvPc"></span>' +
        (spent ? '<span class="spent">' + UI.human(spent) + ' logged</span>' : "") +
      '</div>' +
      '<button class="btn pri big wide" id="dvFocus" style="margin-bottom:18px">' + ICON.bolt +
        (st.complete ? "Review this day in focus mode" : st.done ? "Continue — " + (st.total - st.done) + " left" : "Start day " + d.n) + '</button>' +
      '<ul class="tasks" id="dvTasks">' + d.items.map(taskRow).join("") + '</ul>' +
      '<div class="daynav">' +
        '<button class="btn" id="dvPrev"' + (idx === 0 ? " disabled" : "") + '>' + ICON.left + ' Prev</button>' +
        '<button class="btn wide" id="dvNext"' + (idx === DAYS.length - 1 ? " disabled" : "") + '>Next day ' + ICON.right + '</button>' +
      '</div>';

    paintBar(); ASK.paint();
    $("#dvFocus").addEventListener("click", function () { openFocus(); });
    $("#dvPrev").addEventListener("click", function () { go(idx - 1); });
    $("#dvNext").addEventListener("click", function () { go(idx + 1); });

    $("#dvTasks").addEventListener("click", function (e) {
      var tk = e.target.closest(".tick");
      if (tk) { toggle(tk.closest(".task").dataset.id); return; }
      var tb = e.target.closest(".timerbtn");
      if (tb) { toggleTimer(tb.dataset.id, tb); }
    });
  }

  function taskRow(it) {
    var done = Hub.isDone(TRACK, it.id);
    var spent = Hub.timeOf(it.id);
    return '<li class="task' + (done ? " done" : "") + '" data-id="' + it.id + '" data-track="' + TRACK + '">' +
      '<button class="tick" aria-label="Toggle">' + CHECK + '</button>' +
      '<div class="body"><div class="txt">' + it.html +
        (it.mins ? '<span class="mins">' + it.mins + 'm</span>' : "") +
        (spent ? '<span class="spent">' + UI.human(spent) + '</span>' : "") +
      '</div></div>' +
      ASK.button(it.id) +
      '<button class="timerbtn" data-id="' + it.id + '" aria-label="Timer">' + ICON.play + '</button>' +
      '</li>';
  }

  function paintBar() {
    var st = PLANS.dayState(DAYS[idx]);
    var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
    var bar = $("#dvBar"), pc = $("#dvPc");
    if (bar) bar.style.width = pct + "%";
    if (pc) pc.textContent = st.done + " / " + st.total;
  }

  /* ============================ mutations ============================ */

  function toggle(id) {
    var was = Hub.isDone(TRACK, id);
    Hub.setDone(TRACK, id, !was);
    var row = $('.task[data-id="' + id + '"]');
    if (row) {
      row.classList.toggle("done", !was);
      row.classList.remove("pop"); void row.offsetWidth; row.classList.add("pop");
    }
    if (!was) UI.sfx.tick(); else UI.sfx.untick();
    paintBar(); renderRail();
    if (!was) checkDayDone();
    if (window.onHubProgress) window.onHubProgress();
  }

  var celebrated = {};
  function checkDayDone() {
    var d = DAYS[idx], st = PLANS.dayState(d);
    if (!st.complete || celebrated[d.n]) return;
    celebrated[d.n] = true;
    UI.confetti({ count: 150 });
    UI.sfx.win();
    var streak = Hub.stats.streak();
    UI.toast("🎉 Day " + d.n + " complete" + (streak > 1 ? " · " + streak + "-day streak" : ""), 3400);
  }

  /* ============================ timer ============================ */

  function stopTimer(commit) {
    if (!timer.id) return;
    if (commit !== false) Hub.addTime(timer.id, Date.now() - timer.t0);
    cancelAnimationFrame(timer.raf);
    var id = timer.id;
    timer = { id: null, t0: 0, raf: null, target: 0 };
    document.querySelectorAll('.timerbtn[data-id="' + id + '"]').forEach(function (b) {
      b.classList.remove("run"); b.innerHTML = ICON.play;
    });
    return id;
  }

  function startTimer(id, mins) {
    stopTimer();
    timer.id = id; timer.t0 = Date.now(); timer.target = (mins || 0) * 60000;
    UI.sfx.start();
    document.querySelectorAll('.timerbtn[data-id="' + id + '"]').forEach(function (b) {
      b.classList.add("run"); b.innerHTML = ICON.pause;
    });
    loopTimer();
  }

  function toggleTimer(id, btn) {
    if (timer.id === id) {
      var ms = Date.now() - timer.t0;
      stopTimer();
      UI.toast("Logged " + UI.human(ms));
      renderDay();
    } else {
      var it = findItem(id);
      startTimer(id, it ? it.mins : 0);
    }
  }

  function loopTimer() {
    if (!timer.id) return;
    var el = $("#fTimer");
    if (el) {
      var base = Hub.timeOf(timer.id);
      var ms = base + (Date.now() - timer.t0);
      var lab = $("#fTimerNum");
      if (lab) lab.textContent = UI.clock(ms);
      if (timer.target) {
        UI.setRing(el, ms / timer.target);
        el.classList.toggle("over", ms > timer.target);
      } else {
        UI.setRing(el, (ms % 300000) / 300000);
      }
    }
    timer.raf = requestAnimationFrame(loopTimer);
  }

  function findItem(id) {
    for (var i = 0; i < DAYS.length; i++) {
      for (var j = 0; j < DAYS[i].items.length; j++) if (DAYS[i].items[j].id === id) return DAYS[i].items[j];
    }
    return null;
  }

  // don't bank time while the tab is in the background
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && timer.id) {
      var id = timer.id; stopTimer(true);
      timer.paused = id;
    }
  });

  /* ============================ focus mode ============================ */

  function buildFocus() {
    focusEl = document.createElement("div");
    focusEl.className = "focus " + (TRACK === "ai" ? "t-ai" : "t-eng");
    focusEl.id = "focusOverlay";
    focusEl.innerHTML =
      '<div class="focus-top">' +
        '<button class="icon-btn" id="fExit" aria-label="Exit focus mode">Esc</button>' +
        '<div class="bar"><i id="fBar" style="width:0%"></i></div>' +
        '<span class="steps" id="fSteps"></span>' +
      '</div>' +
      '<div class="focus-body" id="fBody"></div>' +
      '<div class="focus-hint desk">' +
        '<kbd>space</kbd> complete · <kbd>J</kbd>/<kbd>K</kbd> move · <kbd>T</kbd> timer · <kbd>esc</kbd> exit</div>' +
      '<div class="focus-hint mob">swipe → to complete · swipe ← to skip</div>';
    document.body.appendChild(focusEl);

    $("#fExit", focusEl).addEventListener("click", closeFocus);
    UI.swipe(focusEl, {
      right: function () { completeCurrent(); },
      left: function () { step(1); }
    });
  }

  function openFocus(startAt) {
    if (!focusEl) buildFocus();
    fList = DAYS[idx].items.slice();
    var first = startAt;
    if (first == null) {
      first = 0;
      for (var i = 0; i < fList.length; i++) if (!Hub.isDone(TRACK, fList[i].id)) { first = i; break; }
    }
    fIdx = first;
    focusEl.classList.add("on");
    document.body.style.overflow = "hidden";
    paintFocus(0);
  }

  function closeFocus() {
    stopTimer();
    focusEl.classList.remove("on");
    document.body.style.overflow = "";
    renderDay(); renderRail();
    if (window.onHubProgress) window.onHubProgress();
  }

  function paintFocus(dir) {
    var day = DAYS[idx];
    var doneCount = day.items.filter(function (it) { return Hub.isDone(TRACK, it.id); }).length;
    $("#fBar", focusEl).style.width = Math.round(doneCount / day.items.length * 100) + "%";
    $("#fSteps", focusEl).textContent = doneCount + " / " + day.items.length;

    var body = $("#fBody", focusEl);

    if (doneCount === day.items.length) {
      body.innerHTML =
        '<div class="focus-done">' +
          '<div class="big grad">Day ' + day.n + ' done</div>' +
          '<p>' + day.items.length + ' tasks · ' + UI.human(day.items.reduce(function (a, it) { return a + Hub.timeOf(it.id); }, 0)) + ' logged</p>' +
          '<div class="focus-actions">' +
            (idx < DAYS.length - 1 ? '<button class="btn pri big" id="fNextDay">Start day ' + DAYS[idx + 1].n + '</button>' : '') +
            '<button class="btn big" id="fClose2">Back to the list</button>' +
          '</div>' +
        '</div>';
      var nd = $("#fNextDay", focusEl);
      if (nd) nd.addEventListener("click", function () { go(idx + 1); fList = DAYS[idx].items.slice(); fIdx = 0; paintFocus(0); });
      $("#fClose2", focusEl).addEventListener("click", closeFocus);
      return;
    }

    var it = fList[fIdx];
    var done = Hub.isDone(TRACK, it.id);
    var spent = Hub.timeOf(it.id);
    var ringSize = 168, stroke = 11;

    body.innerHTML =
      '<div class="focus-kicker">' + esc(day.label) + ' · task ' + (fIdx + 1) + ' of ' + fList.length + '</div>' +
      '<p class="focus-task ' + (dir > 0 ? "focus-slide-l" : dir < 0 ? "focus-slide-r" : "") + '">' + it.html + '</p>' +
      '<div class="tring" id="fTimer">' + UI.ringSvg(ringSize, stroke, "gradTimer") +
        '<div class="lab"><b id="fTimerNum">' + UI.clock(spent) + '</b><span>' +
        (it.mins ? "of " + it.mins + " min" : "elapsed") + '</span></div></div>' +
      '<div class="focus-actions">' +
        '<div class="frow">' +
          '<button class="btn" id="fTimerBtn" style="flex:1">' + ICON.play + ' Start timer</button>' +
          '<button class="btn askbtn-wide" data-ask="' + it.id + '">? Ask</button>' +
        '</div>' +
        '<div class="frow">' +
          '<button class="btn" id="fPrev" aria-label="Previous task">' + ICON.left + '</button>' +
          '<button class="btn pri big" id="fDone">' + (done ? "Done ✓ — next" : "Complete") + '</button>' +
          '<button class="btn" id="fSkip" aria-label="Skip">' + ICON.right + '</button>' +
        '</div>' +
      '</div>';

    if (it.mins) UI.setRing($("#fTimer", focusEl), spent / (it.mins * 60000));

    $("#fPrev", focusEl).addEventListener("click", function () { step(-1); });
    $("#fSkip", focusEl).addEventListener("click", function () { step(1); });
    $("#fDone", focusEl).addEventListener("click", completeCurrent);
    $("#fTimerBtn", focusEl).addEventListener("click", function () {
      if (timer.id === it.id) {
        var ms = Date.now() - timer.t0; stopTimer();
        UI.toast("Logged " + UI.human(ms));
        this.innerHTML = ICON.play + " Start timer";
      } else {
        startTimer(it.id, it.mins);
        this.innerHTML = ICON.pause + " Pause";
      }
    });
    if (timer.id === it.id) $("#fTimerBtn", focusEl).innerHTML = ICON.pause + " Pause";
  }

  function step(delta) {
    if (!fList.length) return;
    stopTimer();
    var n = fIdx + delta;
    if (n < 0) n = fList.length - 1;
    if (n >= fList.length) n = 0;
    fIdx = n;
    UI.sfx.next();
    paintFocus(delta);
  }

  function completeCurrent() {
    var it = fList[fIdx];
    if (!it) return;
    if (timer.id === it.id) { Hub.addTime(it.id, Date.now() - timer.t0); stopTimer(false); }
    if (!Hub.isDone(TRACK, it.id)) {
      Hub.setDone(TRACK, it.id, true);
      UI.sfx.tick();
    }
    var day = DAYS[idx];
    var allDone = day.items.every(function (x) { return Hub.isDone(TRACK, x.id); });
    if (allDone) {
      if (!celebrated[day.n]) {
        celebrated[day.n] = true;
        UI.confetti({ count: 190 }); UI.sfx.win();
      }
      paintFocus(0);
      return;
    }
    // jump to the next unfinished task
    for (var i = 1; i <= fList.length; i++) {
      var n = (fIdx + i) % fList.length;
      if (!Hub.isDone(TRACK, fList[n].id)) { fIdx = n; break; }
    }
    paintFocus(1);
  }

  /* ============================ keyboard ============================ */

  document.addEventListener("keydown", function (e) {
    if (!focusEl || !focusEl.classList.contains("on")) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === "escape") { e.preventDefault(); closeFocus(); }
    else if (k === " " || k === "enter") { e.preventDefault(); completeCurrent(); }
    else if (k === "j" || k === "arrowright" || k === "arrowdown") { e.preventDefault(); step(1); }
    else if (k === "k" || k === "arrowleft" || k === "arrowup") { e.preventDefault(); step(-1); }
    else if (k === "t") { e.preventDefault(); var b = $("#fTimerBtn", focusEl); if (b) b.click(); }
  });

  /* ============================ navigation ============================ */

  function go(n) {
    if (n < 0 || n >= DAYS.length) return;
    stopTimer();
    idx = n;
    renderRail(); renderDay();
    if (location.hash.slice(1) !== "d" + DAYS[idx].n) history.replaceState(null, "", "#d" + DAYS[idx].n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* ============================ mount ============================ */

  function mount(opts) {
    TRACK = opts.track;
    DAYS = PLANS.days(TRACK);
    host = document.getElementById(opts.dayEl);

    var fromHash = /^#d(\d+)$/.exec(location.hash);
    idx = fromHash ? Math.max(0, Math.min(+fromHash[1] - 1, DAYS.length - 1)) : PLANS.currentIndex(TRACK);

    // pre-mark already-finished days so we don't re-confetti on load
    DAYS.forEach(function (d) { if (PLANS.dayState(d).complete) celebrated[d.n] = true; });

    renderRail(); renderDay();

    document.getElementById(opts.railEl).addEventListener("click", function (e) {
      var p = e.target.closest(".pip");
      if (p) go(+p.dataset.i);
    });

    // swipe between days on the day panel itself
    UI.swipe(host, { left: function () { go(idx + 1); }, right: function () { go(idx - 1); } });

    addEventListener("hashchange", function () {
      var m = /^#d(\d+)$/.exec(location.hash);
      if (m && +m[1] - 1 !== idx) go(+m[1] - 1);
      if (location.hash === "#focus") { history.replaceState(null, "", "#d" + DAYS[idx].n); openFocus(); }
    });

    if (opts.autoFocus) setTimeout(function () { openFocus(); }, 120);
  }

  return { mount: mount, go: go, focus: openFocus, current: function () { return idx; } };
})();
