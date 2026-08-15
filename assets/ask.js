/* =========================================================================
   Learning Hub — "Ask about this checkpoint"
   Every task gets a ? button. It opens a panel with the task as context,
   any answers you've already saved for it, and two ways to get a new one:

     1. Ask in Claude   — opens claude.ai with the question and the full
                          task context pre-filled. No setup, no cost beyond
                          your normal subscription. Paste the reply back to
                          keep it attached to the task.
     2. Answer here     — if you've saved an Anthropic API key in Settings,
                          the page calls the Messages API directly and the
                          answer streams into the panel.

   Saved Q&A lives in the same synced state as your progress, so notes you
   make on your laptop are on your phone too.
   ========================================================================= */
window.ASK = (function () {
  "use strict";

  var el = null, ctx = null;

  var SYSTEM =
    "You are helping Ivan work through a self-directed study plan. He is a full-stack engineer in Toronto, " +
    "Cantonese first language, working through a 60-day AI engineering course and an 8-week English/CELPIP plan. " +
    "He is asking about one specific task in that plan. Answer that task directly and practically: what to do, " +
    "why it matters, and the first concrete step. Assume real engineering experience — skip the beginner framing. " +
    "Be concise. If the task is ambiguous, say what you would do and move on rather than asking him to clarify.";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function plain(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, " ").trim();
  }

  /* very small markdown → html, enough for an answer body */
  function md(s) {
    var out = esc(s)
      .replace(/```([\s\S]*?)```/g, function (_, c) { return "<pre>" + c.trim() + "</pre>"; })
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return out.split(/\n{2,}/).map(function (p) {
      if (/^<pre>/.test(p)) return p;
      if (/^\s*[-*]\s+/m.test(p)) {
        return "<ul>" + p.split("\n").filter(Boolean).map(function (l) {
          return "<li>" + l.replace(/^\s*[-*]\s+/, "") + "</li>";
        }).join("") + "</ul>";
      }
      if (/^\s*\d+\.\s+/m.test(p)) {
        return "<ol>" + p.split("\n").filter(Boolean).map(function (l) {
          return "<li>" + l.replace(/^\s*\d+\.\s+/, "") + "</li>";
        }).join("") + "</ol>";
      }
      return "<p>" + p.replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  /* ---------------- panel ---------------- */

  function build() {
    el = document.createElement("div");
    el.className = "hub-modal ask";
    el.id = "askModal";
    el.innerHTML =
      '<div class="hub-modal-in ask-in">' +
        '<div class="hub-modal-hd"><span>Ask about this checkpoint</span>' +
          '<button id="askClose" aria-label="Close">&times;</button></div>' +
        '<div class="hub-modal-bd">' +
          '<div class="ask-ctx" id="askCtx"></div>' +
          '<div id="askThread"></div>' +
          '<textarea id="askQ" rows="3" placeholder="What do you want to know about this task?"></textarea>' +
          '<div class="ask-chips" id="askChips"></div>' +
          '<div class="hub-row">' +
            '<button class="btn pri" id="askHere">Answer here</button>' +
            '<button class="btn" id="askClaude">Ask in Claude ↗</button>' +
            '<button class="btn" id="askPaste">Save a note</button>' +
          '</div>' +
          '<p class="hub-msg" id="askMsg"></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    document.getElementById("askClose").addEventListener("click", close);
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el.classList.contains("on")) close();
    });

    document.getElementById("askHere").addEventListener("click", answerHere);
    document.getElementById("askClaude").addEventListener("click", askInClaude);
    document.getElementById("askPaste").addEventListener("click", saveNote);
    document.getElementById("askChips").addEventListener("click", function (e) {
      var c = e.target.closest("button");
      if (!c) return;
      document.getElementById("askQ").value = c.dataset.q;
      document.getElementById("askQ").focus();
    });
    document.getElementById("askQ").addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") answerHere();
    });
  }

  var PROMPTS = [
    ["Explain it", "Explain what this task actually means and why it is in the plan."],
    ["First step", "What is the very first concrete step? Give me a command or a file to start with."],
    ["Stuck", "I am stuck on this. What are the usual sticking points and how do I get past them?"],
    ["Check me", "Here is what I did — tell me whether I actually got the point of this task:\n\n"],
    ["Go deeper", "Give me the deeper version of this — what would a strong engineer understand here that a beginner would not?"]
  ];

  function open(track, id) {
    if (!el) build();
    ctx = context(track, id);
    if (!ctx) return;

    document.getElementById("askCtx").innerHTML =
      '<span class="ask-kicker">' + esc(ctx.track === "ai" ? "AI course" : "English plan") +
      ' · ' + esc(ctx.dayLabel) + '</span>' + ctx.html;

    document.getElementById("askChips").innerHTML = PROMPTS.map(function (p) {
      return '<button data-q="' + esc(p[1]) + '">' + p[0] + '</button>';
    }).join("");

    document.getElementById("askQ").value = "";
    document.getElementById("askMsg").textContent = "";
    document.getElementById("askHere").style.display = Hub.apiKey() ? "" : "none";
    renderThread();

    el.className = "hub-modal ask on " + (ctx.track === "ai" ? "t-ai" : "t-eng");
    setTimeout(function () { document.getElementById("askQ").focus(); }, 60);
  }

  function close() { el.classList.remove("on"); }

  /* find the task and the day it belongs to */
  function context(track, id) {
    var days = PLANS.days(track);
    for (var i = 0; i < days.length; i++) {
      for (var j = 0; j < days[i].items.length; j++) {
        if (days[i].items[j].id === id) {
          return {
            track: track, id: id,
            html: '<div class="ask-task">' + days[i].items[j].html + '</div>',
            text: plain(days[i].items[j].html),
            dayLabel: "Day " + days[i].n + " — " + days[i].sub,
            week: days[i].weekLabel,
            mins: days[i].items[j].mins
          };
        }
      }
    }
    // reference checkboxes (concept map, interview banks, daily loop…)
    var row = document.querySelector('.task[data-id="' + id + '"] .txt');
    if (!row) return null;
    return {
      track: track, id: id,
      html: '<div class="ask-task">' + row.innerHTML + '</div>',
      text: plain(row.innerHTML),
      dayLabel: "Reference", week: "", mins: 0
    };
  }

  function promptText(q) {
    return "I'm working through my " +
      (ctx.track === "ai" ? "60-day AI engineering course" : "8-week English / CELPIP plan") +
      ".\n\n" + (ctx.week ? "Week: " + ctx.week + "\n" : "") +
      ctx.dayLabel + "\n" +
      "Task: " + ctx.text + (ctx.mins ? " (" + ctx.mins + " min)" : "") +
      "\n\nMy question: " + q;
  }

  /* ---------------- thread ---------------- */

  function renderThread() {
    var list = Hub.qaOf(ctx.id);
    var box = document.getElementById("askThread");
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = list.map(function (e, i) {
      return '<div class="qa">' +
        '<div class="qa-q">' + esc(e.q) + '<button class="qa-x" data-i="' + i + '" aria-label="Delete">&times;</button></div>' +
        '<div class="qa-a">' + md(e.a) + '</div>' +
        '<div class="qa-m">' + (e.via === "api" ? "answered here" : "saved note") + ' · ' + new Date(e.t).toLocaleDateString() + '</div>' +
        '</div>';
    }).join("");
    box.onclick = function (e) {
      var x = e.target.closest(".qa-x");
      if (!x) return;
      Hub.delQa(ctx.id, +x.dataset.i);
      renderThread();
      paintAskButtons();
    };
  }

  /* ---------------- the two routes ---------------- */

  function askInClaude() {
    var q = document.getElementById("askQ").value.trim() || PROMPTS[0][1];
    var url = "https://claude.ai/new?q=" + encodeURIComponent(promptText(q));
    window.open(url, "_blank", "noopener");
    document.getElementById("askMsg").innerHTML =
      'Opened in Claude. Paste the reply back with <b>Save a note</b> to keep it on this task.';
    document.getElementById("askMsg").className = "hub-msg";
  }

  function saveNote() {
    var q = document.getElementById("askQ").value.trim();
    if (!q) { msg("Type the question, then paste Claude's answer under it — or just write your own note.", "err"); return; }
    var parts = q.split(/\n---+\n/);
    var question = parts.length > 1 ? parts[0].trim() : "Note";
    var answer = parts.length > 1 ? parts.slice(1).join("\n").trim() : q;
    Hub.addQa(ctx.id, { q: question, a: answer, t: Date.now(), via: "note" });
    document.getElementById("askQ").value = "";
    renderThread(); paintAskButtons();
    msg("Saved to this task.", "ok");
    UI.sfx.tick();
  }

  function msg(t, k) {
    var m = document.getElementById("askMsg");
    m.innerHTML = t; m.className = "hub-msg " + (k || "");
  }

  function answerHere() {
    var q = document.getElementById("askQ").value.trim();
    if (!q) { msg("Ask something first.", "err"); return; }
    if (!Hub.apiKey()) { msg("Add an Anthropic API key in Settings to answer inside the page.", "err"); return; }

    var btn = document.getElementById("askHere");
    btn.disabled = true; btn.textContent = "Thinking…";
    msg("");

    var box = document.getElementById("askThread");
    var live = document.createElement("div");
    live.className = "qa live";
    live.innerHTML = '<div class="qa-q">' + esc(q) + '</div><div class="qa-a" id="askLive"><span class="dots"><i></i><i></i><i></i></span></div>';
    box.appendChild(live);
    live.scrollIntoView({ block: "nearest", behavior: "smooth" });

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Hub.apiKey(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: Hub.apiModel(),
        max_tokens: 1200,
        system: SYSTEM,
        messages: [{ role: "user", content: promptText(q) }]
      })
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error((j.error && j.error.message) || ("HTTP " + r.status));
          return j;
        });
      })
      .then(function (j) {
        var text = (j.content || []).filter(function (c) { return c.type === "text"; })
          .map(function (c) { return c.text; }).join("\n").trim();
        if (!text) throw new Error("Empty reply");
        Hub.addQa(ctx.id, { q: q, a: text, t: Date.now(), via: "api" });
        document.getElementById("askQ").value = "";
        renderThread(); paintAskButtons();
        UI.sfx.next();
      })
      .catch(function (e) {
        live.remove();
        msg("Couldn't reach the API — " + esc(e.message) +
            '. You can still use <b>Ask in Claude</b>.', "err");
      })
      .then(function () {
        btn.disabled = false; btn.textContent = "Answer here";
      });
  }

  /* ---------------- wiring ---------------- */

  /* mark every task that already has saved answers */
  function paintAskButtons() {
    document.querySelectorAll(".task[data-id]").forEach(function (row) {
      var b = row.querySelector(".askbtn");
      if (!b) return;
      b.classList.toggle("has", Hub.qaOf(row.dataset.id).length > 0);
    });
  }

  function button(id) {
    return '<button class="askbtn" data-ask="' + id + '" aria-label="Ask about this" title="Ask about this checkpoint">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9.2 9a2.9 2.9 0 1 1 3.9 2.7c-.8.3-1.1 1-1.1 1.8v.4"/><circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="12" cy="12" r="9.2"/></svg></button>';
  }

  /* one delegated listener covers every page */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".askbtn");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var row = b.closest(".task");
    var track = (row && row.dataset.track) || window.PAGE_TRACK || "ai";
    open(track, b.dataset.ask);
  }, true);

  return { open: open, button: button, paint: paintAskButtons };
})();
