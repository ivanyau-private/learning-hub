/* =========================================================================
   Learning Hub — shared UI primitives
   confetti · toast · sound · swipe · time formatting · count-up numbers
   ========================================================================= */
window.UI = (function () {
  "use strict";

  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- confetti ---------------- */

  var cv, ctx, parts = [], raf = null;

  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.id = "confetti";
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    addEventListener("resize", size);
    size();
  }
  function size() {
    if (!cv) return;
    var d = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function confetti(opts) {
    opts = opts || {};
    if (reduced) return;
    ensureCanvas();
    cv.classList.add("on");
    var n = opts.count || 130;
    var colors = opts.colors || [css("--ai-1", "#7c6cff"), css("--ai-2", "#b46cff"),
                                 css("--en-1", "#0fd39b"), css("--en-2", "#37e0d0"),
                                 css("--amber", "#f7b955")];
    var ox = opts.x != null ? opts.x : innerWidth / 2;
    var oy = opts.y != null ? opts.y : innerHeight * 0.42;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 5 + Math.random() * 13;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp * (0.6 + Math.random() * 0.9),
        vy: Math.sin(a) * sp - 5 - Math.random() * 6,
        w: 5 + Math.random() * 7, h: 3 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .4,
        c: colors[(Math.random() * colors.length) | 0],
        life: 1
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.42; p.vx *= 0.992; p.x += p.vx; p.y += p.vy;
      p.rot += p.vr; p.life -= 0.0085;
      if (p.life <= 0 || p.y > innerHeight + 60) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (parts.length) { raf = requestAnimationFrame(tick); }
    else { raf = null; cv.classList.remove("on"); ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------------- toast ---------------- */

  var toastEl, toastTimer;
  function toast(msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = msg;
    requestAnimationFrame(function () { toastEl.classList.add("on"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, ms || 2600);
  }

  /* ---------------- sound (WebAudio, no files) ---------------- */

  var actx = null;
  function audio() {
    if (actx === null) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = false; }
    }
    return actx;
  }
  function beep(freq, dur, vol, type) {
    if (!window.Hub || !Hub.soundOn || !Hub.soundOn()) return;
    var a = audio(); if (!a) return;
    if (a.state === "suspended") a.resume();
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(vol || .06, a.currentTime + .012);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + (dur || .12));
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + (dur || .12) + .02);
  }
  var sfx = {
    tick:  function () { beep(660, .07, .05, "triangle"); },
    untick:function () { beep(320, .07, .04, "triangle"); },
    next:  function () { beep(520, .06, .035, "sine"); },
    win:   function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { setTimeout(function () { beep(f, .22, .06, "triangle"); }, i * 95); }); },
    start: function () { beep(880, .09, .045, "sine"); }
  };

  /* ---------------- swipe ---------------- */

  function swipe(el, handlers) {
    var x0 = 0, y0 = 0, t0 = 0, tracking = false;
    el.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); tracking = true;
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (!tracking) return; tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
      if (dt > 700 || Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      if (dx > 0 && handlers.right) handlers.right();
      if (dx < 0 && handlers.left) handlers.left();
    }, { passive: true });
  }

  /* ---------------- formatting ---------------- */

  function clock(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }
  function human(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + "m";
    return Math.floor(m / 60) + "h " + (m % 60) + "m";
  }

  /* ---------------- count-up numbers ---------------- */

  function countTo(el, to, ms) {
    var from = parseFloat(el.textContent.replace(/[^\d.-]/g, "")) || 0;
    if (reduced || from === to) { el.textContent = to; return; }
    var t0 = performance.now(); ms = ms || 700;
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------- svg helpers ---------------- */

  function ringSvg(size, stroke, gradId) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="bgc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="fgc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke +
      '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '"/></svg>';
  }
  function setRing(el, frac) {
    var c = el.querySelector(".fgc");
    if (!c) return;
    var len = parseFloat(c.getAttribute("stroke-dasharray"));
    c.style.strokeDashoffset = len * (1 - Math.max(0, Math.min(1, frac)));
  }

  /* gradient <defs> shared by every ring on the page */
  function gradDefs() {
    if (document.getElementById("uiGradDefs")) return;
    var d = document.createElement("div");
    d.id = "uiGradDefs";
    d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML =
      '<svg><defs>' +
      '<linearGradient id="gradRing" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="var(--a1)"/><stop offset="100%" stop-color="var(--a2)"/></linearGradient>' +
      '<linearGradient id="gradTimer" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="var(--a1)"/><stop offset="100%" stop-color="var(--a2)"/></linearGradient>' +
      '</defs></svg>';
    document.body.appendChild(d);
  }

  return {
    confetti: confetti, toast: toast, sfx: sfx, swipe: swipe,
    clock: clock, human: human, countTo: countTo,
    ringSvg: ringSvg, setRing: setRing, gradDefs: gradDefs, reduced: reduced
  };
})();
