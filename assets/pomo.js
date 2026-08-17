/* =========================================================================
   Learning Hub — pomodoro
   -------------------------------------------------------------------------
   25 work / 5 short / 15 long every 4 blocks, all adjustable in Settings.

   The run is wall-clock, not a JS timer: {phase, startedAt, cycleIndex} sit
   in localStorage and every view recomputes the countdown from startedAt, so
   a block keeps ticking while you move between index/ai/english, reload, or
   relaunch the PWA. The interval below only repaints — losing it costs
   nothing. The run itself stays device-local (a half-finished block on the
   iPad is not something the Mac should adopt); only the per-day counts sync.

   The pomodoro deliberately never calls Hub.addTime. The per-task timer owns
   logged minutes and is bound to an item id; a pomodoro is bound to nothing,
   and the intended way to work is both at once — so crediting time here would
   double every minute. Blocks are a separate, coarser unit of "focus done".
   ========================================================================= */
window.Pomo = (function () {
  "use strict";

  var LS_RUN = "hub_pomo_run";
  var GRACE = 60000;            // a phase that ended this recently still ends "live"
  var TICK = 500;

  var ICON = {
    play:  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="6.5" y="4.5" width="4" height="15" rx="1.2"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2"/></svg>',
    skip:  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 5l9 7-9 7z"/><rect x="16.2" y="5" width="3" height="14" rx="1.2"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 2.5V8H15"/></svg>'
  };

  var run = null, mounts = [], ticker = null, titleBase = null;

  /* ============================ run state ============================ */

  function fresh() { return { phase: "idle", up: "work", startedAt: 0, pausedAt: 0, cycleIndex: 0 }; }

  function stored() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(LS_RUN) || "null"); } catch (e) {}
    if (!o || typeof o !== "object" || !o.phase) return null;
    if (typeof o.cycleIndex !== "number") o.cycleIndex = 0;
    if (!o.up) o.up = "work";
    return o;
  }
  function load() { run = stored() || fresh(); }
  function save() { try { localStorage.setItem(LS_RUN, JSON.stringify(run)); } catch (e) {} }

  function cfg() { return Hub.pomoCfg(); }
  function mins(phase) {
    var c = cfg();
    return phase === "work" ? c.work : phase === "short" ? c.short : phase === "long" ? c.long : 0;
  }
  function dur(phase) { return mins(phase) * 60000; }
  function running() { return run.phase !== "idle" && !run.pausedAt; }
  function elapsed() { return run.phase === "idle" ? 0 : (run.pausedAt || Date.now()) - run.startedAt; }
  function remain() {
    if (run.phase === "idle") return dur(run.up);
    return Math.max(0, dur(run.phase) - elapsed());
  }
  function frac() {
    var d = dur(run.phase);
    return (run.phase === "idle" || !d) ? 0 : Math.min(1, elapsed() / d);
  }

  /* ============================ transitions ============================ */

  function begin(phase, at) {
    run.phase = phase;
    run.startedAt = at || Date.now();
    run.pausedAt = 0;
    run.up = phase;
    save(); ensureTicker(); paintAll();
  }

  /* A phase is over. Credit it, work out what comes next, and either roll
     straight on (we were here to see it) or park at idle — chaining phases
     after a long absence would hand out blocks nobody sat through. */
  function endPhase(live) {
    var was = run.phase, endedAt = run.startedAt + dur(was), next;
    // a second tab may have got here first — adopt its result instead of
    // crediting the same block twice
    var other = stored();
    if (other && (other.phase !== was || other.startedAt !== run.startedAt)) {
      run = other; ensureTicker(); paintAll(); return;
    }
    if (was === "work") {
      Hub.addPomo(endedAt);
      run.cycleIndex += 1;
      next = (run.cycleIndex % cfg().every === 0) ? "long" : "short";
    } else {
      if (was === "long") run.cycleIndex = 0;
      next = "work";
    }
    if (live) {
      announce(was, next);
      begin(next, endedAt);      // chained from the exact end, so drift never accumulates
    } else {
      run.phase = "idle"; run.up = next; run.startedAt = 0; run.pausedAt = 0;
      save(); stopTicker(); paintAll();
    }
  }

  function announce(was, next) {
    if (!window.UI) return;
    if (was === "work") {
      UI.sfx.win();
      UI.toast("Block done · " + Hub.pomoToday() + " today — " + mins(next) + " min " +
               (next === "long" ? "long break" : "break"), 3200);
    } else if (was === "long") {
      UI.confetti({ count: 150 });
      UI.sfx.win();
      UI.toast("Full cycle done — " + cfg().every + " blocks of focus", 3400);
    } else {
      UI.sfx.start();
      UI.toast("Break over — " + mins(next) + " min of focus", 2600);
    }
  }

  function toggle() {
    if (run.phase === "idle") { if (window.UI) UI.sfx.start(); begin(run.up || "work"); return; }
    if (run.pausedAt) {
      run.startedAt += Date.now() - run.pausedAt;
      run.pausedAt = 0;
      if (window.UI) UI.sfx.start();
      save(); ensureTicker();
    } else {
      run.pausedAt = Date.now();
      if (window.UI) UI.sfx.untick();
      save(); stopTicker();
    }
    paintAll();
  }

  // skipping is not finishing: no block is credited, so no long break is earned
  function skip() {
    var next = (run.phase === "idle" ? run.up : run.phase) === "work" ? "short" : "work";
    if (window.UI) UI.sfx.next();
    begin(next);
  }

  function reset() {
    run = fresh();
    save(); stopTicker(); paintAll();
    if (window.UI) UI.sfx.untick();
  }

  /* ============================ ticking ============================ */

  function tick() {
    if (!running()) { stopTicker(); paintAll(); return; }
    var over = elapsed() - dur(run.phase);
    if (over >= 0) { endPhase(over < GRACE); return; }
    paintAll();
  }

  function ensureTicker() { if (!ticker && running()) ticker = setInterval(tick, TICK); }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  /* ============================ painting ============================ */

  function phaseLabel() {
    var c = cfg(), p = run.phase === "idle" ? run.up : run.phase;
    var s = p === "work" ? "Focus · block " + ((run.cycleIndex % c.every) + 1) + " of " + c.every
          : p === "long" ? "Long break" : "Short break";
    if (run.phase === "idle") s += " · ready";
    else if (run.pausedAt) s += " · paused";
    return s;
  }

  function fullHtml() {
    return '<div class="pring">' + UI.ringSvg(46, 5, "gradTimer") + '</div>' +
      '<div class="pinfo"><b class="ptime">0:00</b><span class="pphase"></span></div>' +
      '<div class="pcount"><b class="pn">0</b><span>blocks<br>today</span></div>' +
      '<div class="pacts">' +
        '<button class="pbtn pri" data-p="toggle" aria-label="Start or pause the pomodoro"></button>' +
        '<button class="pbtn" data-p="skip" aria-label="Skip this phase">' + ICON.skip + '</button>' +
        '<button class="pbtn" data-p="reset" aria-label="Reset the cycle">' + ICON.reset + '</button>' +
      '</div>';
  }

  function chipHtml() {
    return '<button class="pc-main" data-p="toggle"><i class="pdot"></i><b class="ptime">0:00</b>' +
           '<u class="pn"></u></button>' +
           '<button class="pc-skip" data-p="skip" aria-label="Skip this phase">' + ICON.skip + '</button>';
  }

  function paint(el) {
    var t = el.querySelector(".ptime");
    if (t) t.textContent = UI.clock(remain());
    el.setAttribute("data-phase", run.phase === "idle" ? "idle" : run.phase);
    el.classList.toggle("paused", !!run.pausedAt);
    el.classList.toggle("run", running());

    var n = Hub.pomoToday();
    var cnt = el.querySelector(".pn");
    if (cnt) { cnt.textContent = n; if (el._pv === "chip") cnt.style.display = n ? "" : "none"; }

    if (el._pv === "chip") {
      el.querySelector(".pc-main").title = phaseLabel() + " · " + n + " blocks today";
      return;
    }
    var ring = el.querySelector(".pring");
    if (ring) UI.setRing(ring, frac());
    el.querySelector(".pphase").textContent = phaseLabel();
    el.querySelector('[data-p="toggle"]').innerHTML = running() ? ICON.pause : ICON.play;
    el.querySelector('[data-p="reset"]').style.display =
      (run.phase === "idle" && !run.cycleIndex) ? "none" : "";
  }

  function paintTitle() {
    if (titleBase === null) titleBase = document.title;
    document.title = running() ? UI.clock(remain()) + " · " + titleBase : titleBase;
  }

  function paintAll() {
    mounts = mounts.filter(function (el) { return document.body.contains(el); });
    mounts.forEach(function (el) { try { paint(el); } catch (e) {} });
    paintTitle();
  }

  /* ============================ mounting ============================ */

  function mount(el, variant) {
    if (!el) return;
    variant = variant || el.getAttribute("data-pomo") || "full";
    el._pv = variant;
    el.className = variant === "chip" ? "pchip" : "pomo";
    el.innerHTML = variant === "chip" ? chipHtml() : fullHtml();
    if (!el._bound) {
      el._bound = true;
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-p]");
        if (!b) return;
        e.preventDefault();
        if (b.dataset.p === "toggle") toggle();
        else if (b.dataset.p === "skip") skip();
        else reset();
      });
    }
    if (mounts.indexOf(el) < 0) mounts.push(el);
    paint(el);
    ensureTicker();
  }

  /* ============================ boot ============================ */

  function boot() {
    load();
    // a phase may well have expired while the page was closed or navigating
    if (running() && elapsed() >= dur(run.phase)) endPhase(elapsed() - dur(run.phase) < GRACE);
    document.querySelectorAll("[data-pomo]").forEach(function (el) { mount(el); });
    paintAll();
    ensureTicker();
  }

  load();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // background tabs get throttled, so catch up the moment we are visible again
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") tick();
  });

  // another tab of the same app started, paused or ended something
  addEventListener("storage", function (e) {
    if (e.key !== LS_RUN) return;
    load(); ensureTicker(); paintAll();
  });

  return {
    mount: mount, toggle: toggle, skip: skip, reset: reset, start: begin,
    paint: paintAll,
    today: function () { return Hub.pomoToday(); },
    state: function () {
      return { phase: run.phase, up: run.up, startedAt: run.startedAt, pausedAt: run.pausedAt,
               cycleIndex: run.cycleIndex, remain: remain(), running: running() };
    }
  };
})();
