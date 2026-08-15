const views=document.getElementById("views"), tabs=document.getElementById("tabs");
const TABSETS={
 1:[{k:"w1",l:"Week 1"},{k:"w2",l:"Week 2"},{k:"w3",l:"Week 3"},{k:"w4",l:"Week 4"},{k:"map1",l:"Concept Map"},{k:"res1",l:"Resources"},{k:"daily",l:"⟳ Daily Loop"}],
 2:[{k:"w5",l:"Week 5"},{k:"w6",l:"Week 6"},{k:"w7",l:"Week 7"},{k:"w8",l:"Week 8"},{k:"real",l:"Reality Check"},{k:"res2",l:"Resources"},{k:"daily2",l:"⟳ Daily Loop"}]
};

function box(id,html){ return `<li><input type="checkbox" id="${id}"${store[id]?" checked":""}><label for="${id}">${html}</label></li>`; }
function tag(t){ return t==="KEY"?`<span class="tag t-key">KEY DAY</span>`:t==="REST"?`<span class="tag t-rest">REST</span>`:t==="MAC"?`<span class="tag t-mac">MAC-NATIVE</span>`:""; }

function renderWeeks(weeks,m,notes){
  let out="";
  weeks.forEach(w=>{
    let s=`<div class="view hide" data-m="${m}" data-k="w${w.n}"><div class="week"><h2>${w.title}</h2><p class="goal">${w.goal}</p>`;
    w.days.forEach((day,di)=>{
      s+=`<div class="day"><div class="dayhd"><div class="dnum">${day.d}</div><div class="dtitle">${day.t}${tag(day.tag)}</div></div><ul class="items">`;
      day.items.forEach((it,ii)=> s+=box(`m${m}w${w.n}d${di}i${ii}`,it));
      s+=`</ul></div>`;
    });
    if(notes[w.n]) s+=notes[w.n];
    s+=`</div></div>`;
    out+=s;
  });
  return out;
}

const tbl=(rows,cols)=>`<table><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr>${rows.map(x=>`<tr><td style="white-space:nowrap">${A(x[0],x[1])}</td><td>${x[2]}</td>${x[3]?`<td style="color:var(--dim);white-space:nowrap">${x[3]}</td>`:""}</tr>`).join("")}</table>`;

let html="";
html+=renderWeeks(M1_WEEKS,1,{
 1:`<div class="note"><b>Daily rhythm:</b> ~1.5 hr learn · ~2.5 hr build · ~0.5 hr log. <b>Never watch two videos back-to-back without writing code.</b> Everything goes in one public GitHub repo — your portfolio gets built as a side effect.</div>`,
 4:`<div class="note"><b>If you fall behind:</b> cut Week 4 breadth topics. Never cut evals.</div>`});

let m1=`<div class="view hide" data-m="1" data-k="map1"><div class="week"><h2>The Concept Map — everything an AI engineer needs</h2><p class="goal">Ten pillars. Tick items as they genuinely click.</p><div class="grid">`;
M1_PILLARS.forEach((p,pi)=>{ m1+=`<div class="card"><h3>${p.h}</h3><ul class="items">`; p.i.forEach((x,xi)=> m1+=box(`p${pi}i${xi}`,x)); m1+=`</ul></div>`; });
m1+=`</div><div class="note"><b>Skip this month:</b> building neural nets from scratch · deep math proofs · training from scratch · classical ML beyond vocabulary · framework tourism. Learn the raw agent loop, then <b>one</b> framework.</div></div></div>`;
html+=m1;

html+=`<div class="view hide" data-m="1" data-k="res1">
<div class="week"><h2>Tier 1 — Primary (these carry the month)</h2>${tbl(M1_RES.t1,["Resource","What it covers"])}</div>
<div class="week"><h2>Tier 2 — Reference & depth</h2>${tbl(M1_RES.t2,["Resource","What it covers"])}</div>
<div class="week"><h2>Video & community-recommended</h2>${tbl(M1_RES.yt,["Source","Best for","When"])}
<div class="note">On X, follow: @simonw · @HamelHusain · @karpathy · @swyx · @eugeneyan · @jerryjliu0</div></div>
<div class="week"><h2>Interview readiness — AI Engineer</h2><ul class="items">${M1_INTQ.map((q,i)=>box(`m1iq${i}`,q)).join("")}</ul></div></div>`;

html+=renderWeeks(M2_WEEKS,2,{
 5:`<div class="note"><b>New rule for this month:</b> every experiment gets logged with a hypothesis <i>before</i> you run it. That habit is the difference between an engineer who tries things and a scientist who tests things.</div>`,
 7:`<div class="note warn"><b>Mac reality:</b> MLX handles local fine-tuning beautifully, but CUDA-only libraries (bitsandbytes, flash-attention, much of TRL's fast path) won't run. Use free Colab/Kaggle T4 for those days. Total cost stays $0.</div>`,
 8:`<div class="note"><b>Day 53 is the highest-leverage day of the month.</b> Reproducing a published result is the strongest possible signal for an applied science role, and almost no self-taught candidate does it.</div>`});

let m2=`<div class="view hide" data-m="2" data-k="real"><div class="week"><h2>Reality Check</h2><p class="goal">An honest read on what two months buys you — and what it doesn't.</p>
<div class="note red"><b>Say this out loud once:</b> Applied Scientist / MLE is genuinely reachable from your background, but it is a <b>6–12 month</b> path, not a one-month one. Month 2 gets you past ML screens and gives you a portfolio that reads as scientific. It does not make you a scientist yet — interviewers can tell the difference, and pretending otherwise is the fastest way to fail an onsite.</div>
<div class="grid" style="margin-top:14px">`;
M2_GAPS.forEach((g,gi)=>{ m2+=`<div class="card"><h3>${g.h}</h3><ul class="items">`; g.i.forEach((x,xi)=> m2+=box(`g${gi}i${xi}`,x)); m2+=`</ul></div>`; });
m2+=`</div></div>
<div class="week"><h2>Interview readiness — Applied Scientist</h2><ul class="items">${M2_INTQ.map((q,i)=>box(`m2iq${i}`,q)).join("")}</ul>
<div class="note"><b>Your unfair advantage:</b> most applied scientist candidates cannot ship. You can. "I can take a model from experiment to production with evals, tracing, and cost control" is a rarer sentence than "I know transformers."</div></div></div>`;
html+=m2;

html+=`<div class="view hide" data-m="2" data-k="res2">
<div class="week"><h2>Core curriculum — all free</h2>${tbl(M2_RES.t1,["Resource","What it covers"])}</div>
<div class="week"><h2>Apple Silicon, compute & tooling</h2><p class="goal">Your M4 Pro is a legitimately good ML machine — if you use MLX rather than fighting CUDA.</p>${tbl(M2_RES.t2,["Resource","What it covers"])}</div>
<div class="week"><h2>Video & writing (community-recommended)</h2>${tbl(M2_RES.yt,["Source","Best for","When"])}</div></div>`;

/* ---- Daily loop (same content, rendered into both months) ---- */
function dailyView(m){
  return `<div class="view hide" data-m="${m}" data-k="${m===1?'daily':'daily2'}">
  <div class="week"><h2>⟳ Daily Model-Update Loop</h2><p class="goal">15 minutes, every morning, on top of your 4–5 study hours. A scheduled brief lands in your chat at 8:00 AM daily.</p>
  <div class="note"><b>Why this is a separate ritual and not "read AI news":</b> the failure mode is doom-scrolling releases and learning nothing. The loop below forces a decision on every item and ends with something written down. Cap it at 15 minutes — if it runs longer you're reading, not filtering.</div>
  <ul class="items" style="padding-left:0;margin-top:14px">${DAILY_STEPS.map((s,i)=>box(`m${m}dl${i}`,s)).join("")}</ul>
  </div>
  <div class="week"><h2>Sources</h2><p class="goal">Two subscriptions is the right number. The trackers are for lookup, not reading.</p>${tbl(DAILY_SOURCES,["Source","Why","Cadence"])}
  <div class="note warn"><b>Discipline rule:</b> during Months 1–2, a new model release is <b>never</b> a reason to change what you're studying that day. Note it, keep going. The curriculum is the priority; the loop exists so nothing important passes you silently, not so you can chase it.</div></div>
  <div class="week"><h2>Weekly rollup</h2><p class="goal">Sunday, 20 minutes — do this instead of the daily loop on rest days.</p>
  <ul class="items" style="padding-left:0">${WEEKLY_ROLLUP.map((s,i)=>box(`m${m}wk${i}`,s)).join("")}</ul></div></div>`;
}
html+=dailyView(1)+dailyView(2);

views.innerHTML=html;

let curMonth=1;
function setMonth(m){
  curMonth=m;
  document.documentElement.style.setProperty('--accent', m===1?'var(--a1)':'var(--purple)');
  document.querySelectorAll('.mo').forEach(x=>x.classList.toggle('on', +x.dataset.m===m));
  tabs.innerHTML=TABSETS[m].map((t,i)=>`<div class="tab${i===0?' on':''}" data-k="${t.k}">${t.l}</div>`).join("");
  const first=TABSETS[m][0].k;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hide', !(+v.dataset.m===m && v.dataset.k===first)));
  document.getElementById('barLabel').textContent=`Month ${m} progress`;
  upd();
}
document.querySelectorAll('.mo').forEach(el=>el.addEventListener('click',()=>setMonth(+el.dataset.m)));

tabs.addEventListener("click",e=>{
  const t=e.target.closest(".tab"); if(!t)return;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===t));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hide", !(+v.dataset.m===curMonth && v.dataset.k===t.dataset.k)));
  window.scrollTo({top:0,behavior:"smooth"});
});

const allBoxes=[...document.querySelectorAll('input[type=checkbox]')];
function monthBoxes(m){ return allBoxes.filter(b=>{ const v=b.closest('.view'); return v && +v.dataset.m===m; }); }
function stat(list){ const d=list.filter(b=>b.checked).length; return {d,t:list.length,p:list.length?Math.round(d/list.length*100):0}; }
function upd(){
  const s1=stat(monthBoxes(1)), s2=stat(monthBoxes(2)), cur=curMonth===1?s1:s2;
  document.getElementById("fill").style.width=cur.p+"%";
  document.getElementById("pct").textContent=cur.p+"%";
  document.getElementById("cnt").textContent=`(${cur.d} / ${cur.t} items)`;
  document.getElementById("mp1").textContent=`${s1.p}% · ${s1.d}/${s1.t}`;
  document.getElementById("mp2").textContent=`${s2.p}% · ${s2.d}/${s2.t}`;
}
allBoxes.forEach(b=>b.addEventListener("change",()=>{ store[b.id]=b.checked; if(!b.checked) delete store[b.id]; save(); upd(); }));

function resetAll(){ if(!confirm("Clear all progress across both months?"))return; store={}; save(); allBoxes.forEach(b=>b.checked=false); upd(); }
setMonth(1);

