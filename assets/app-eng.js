/* ---------- render ---------- */
function slug(w,d,i){ return "w"+w+"d"+d+"i"+i; }

function renderWeeks(){
  var html = "";
  for (var wi=0; wi<WEEKS.length; wi++){
    var W = WEEKS[wi];
    var tot=0, dn=0;
    for (var di=0; di<W.days.length; di++){
      for (var ii=0; ii<W.days[di].items.length; ii++){
        tot++; if (state.done[slug(W.n,di,ii)]) dn++;
      }
    }
    html += '<div class="week' + (wi===0 ? ' open' : '') + '" id="wk'+W.n+'">';
    html += '<div class="week-head" onclick="tog('+W.n+')">';
    html += '<span class="chev">&#9654;</span>';
    html += '<div style="flex:1"><div class="wnum">Week '+W.n+' &middot; '+W.phase+'</div><div class="wtitle">'+W.t+'</div></div>';
    html += '<span class="wcount" id="wc'+W.n+'">'+dn+'/'+tot+'</span>';
    html += '</div><div class="week-body">';
    html += '<div class="wgoal">'+W.goal+'</div>';
    for (var d=0; d<W.days.length; d++){
      var day = W.days[d];
      html += '<div class="day"><div class="day-top"><span class="day-name">'+D[d]+'</span><span class="day-focus">'+day.f+'</span></div><ul class="day-items">';
      for (var i=0; i<day.items.length; i++){
        var id = slug(W.n,d,i);
        var txt = day.items[i][0];
        var m = day.items[i][1];
        html += '<li><input type="checkbox" id="'+id+'"'+(state.done[id]?' checked':'')+' onchange="tick(\''+id+'\','+W.n+')"><label for="'+id+'">'+txt+(m?' <span class="mins">'+m+'m</span>':'')+'</label></li>';
      }
      html += '</ul></div>';
    }
    html += '</div></div>';
  }
  document.getElementById("weeks").innerHTML = html;
}

function tog(n){ document.getElementById("wk"+n).classList.toggle("open"); }

function tick(id, wn){
  var el = document.getElementById(id);
  if (el.checked) state.done[id] = 1; else delete state.done[id];
  save();
  recount(wn);
  overall();
}

function recount(wn){
  for (var wi=0; wi<WEEKS.length; wi++){
    if (WEEKS[wi].n !== wn) continue;
    var W = WEEKS[wi], tot=0, dn=0;
    for (var di=0; di<W.days.length; di++)
      for (var ii=0; ii<W.days[di].items.length; ii++){
        tot++; if (state.done[slug(W.n,di,ii)]) dn++;
      }
    var e = document.getElementById("wc"+wn);
    if (e) e.textContent = dn+"/"+tot;
  }
}

function overall(){
  var tot=0, dn=0;
  for (var wi=0; wi<WEEKS.length; wi++){
    var W = WEEKS[wi];
    for (var di=0; di<W.days.length; di++)
      for (var ii=0; ii<W.days[di].items.length; ii++){
        tot++; if (state.done[slug(W.n,di,ii)]) dn++;
      }
  }
  var pct = tot ? Math.round(dn/tot*100) : 0;
  document.getElementById("pbarFill").style.width = pct+"%";
  document.getElementById("pctLabel").textContent = pct+"% complete";
  document.getElementById("cntLabel").textContent = dn+" of "+tot+" tasks";
}

function resetAll(){
  if (!confirm("Clear all checkboxes? Your error log will be kept.")) return;
  state.done = {}; save(); renderWeeks(); overall();
}

/* ---------- error log ---------- */
function renderErrs(){
  var el = document.getElementById("errList");
  if (!state.errs.length){ el.innerHTML = '<div class="empty">Nothing logged yet. Add your first mistake above.</div>'; return; }
  var counts = {};
  for (var i=0;i<state.errs.length;i++){
    var r = (state.errs[i].rule||"untagged").toLowerCase();
    counts[r] = (counts[r]||0)+1;
  }
  var h = '<table><tr><th>Wrong</th><th>Correct</th><th>Rule</th><th></th></tr>';
  for (var j=state.errs.length-1; j>=0; j--){
    var e = state.errs[j];
    var c = counts[(e.rule||"untagged").toLowerCase()];
    var flag = c>=3 ? ' <strong style="color:#b03030">&times;'+c+'</strong>' : '';
    h += '<tr><td class="bad">'+esc(e.wrong)+'</td><td class="good">'+esc(e.right)+'</td><td>'+esc(e.rule||"—")+flag+'</td><td><button class="btn ghost" onclick="delErr('+j+')">remove</button></td></tr>';
  }
  h += '</table>';
  el.innerHTML = h;
}
function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function addErr(){
  var w = document.getElementById("fWrong").value.trim();
  var r = document.getElementById("fRight").value.trim();
  var u = document.getElementById("fRule").value.trim();
  if (!w && !r) return;
  state.errs.push({wrong:w, right:r, rule:u});
  save();
  document.getElementById("fWrong").value="";
  document.getElementById("fRight").value="";
  renderErrs();
  document.getElementById("fWrong").focus();
}
function delErr(i){ state.errs.splice(i,1); save(); renderErrs(); }

function renderQuiz(){
  var h = "";
  for (var i=0;i<QUIZ.length;i++){
    h += '<div class="q" id="q'+i+'"><div class="q-top">'
      +  '<span class="q-n">'+(i+1)+'</span>'
      +  '<span class="q-s">'+esc(QUIZ[i][0])+'</span>'
      +  '<button class="q-btn" onclick="qtog('+i+')">show</button></div>'
      +  '<div class="q-a"><div class="fix">'+QUIZ[i][1]+'</div><div class="why">'+esc(QUIZ[i][2])+'</div></div></div>';
  }
  document.getElementById("qList").innerHTML = h;
}
function qtog(i){ document.getElementById("q"+i).classList.toggle("open"); }
function hideAll(){
  var qs = document.querySelectorAll(".q");
  for (var i=0;i<qs.length;i++) qs[i].classList.remove("open");
}

function renderScores(){
  var h = "";
  for (var w=1; w<=8; w++){
    var v = (state.scores && state.scores[w] != null) ? state.scores[w] : "";
    h += '<div class="sbox"><label>WK '+w+'</label>'
      +  '<input type="number" min="0" max="20" value="'+v+'" placeholder="–" onchange="setScore('+w+',this.value)"></div>';
  }
  document.getElementById("scoreRow").innerHTML = h;
  var t = "";
  for (var k=1; k<=8; k++){
    if (!state.scores || state.scores[k] == null) continue;
    var s = state.scores[k];
    t += '<div class="trendrow"><b>Week '+k+'</b><i style="width:'+(s/20*260)+'px"></i><span>'+s+'/20</span></div>';
  }
  document.getElementById("scoreTrend").innerHTML = t || '<div class="empty">No scores yet. Take the test on Sunday and enter it above.</div>';
}
function setScore(w, v){
  if (!state.scores) state.scores = {};
  if (v === "" ) delete state.scores[w];
  else state.scores[w] = Math.max(0, Math.min(20, parseInt(v,10) || 0));
  save(); renderScores();
}

document.addEventListener("keydown", function(ev){
  if (ev.key === "Enter" && document.activeElement &&
      ["fWrong","fRight","fRule"].indexOf(document.activeElement.id) >= 0) addErr();
});

/* ---------- tabs ---------- */
var btns = document.querySelectorAll(".tabs button");
for (var b=0; b<btns.length; b++){
  btns[b].addEventListener("click", function(){
    var all = document.querySelectorAll(".tabs button");
    for (var k=0;k<all.length;k++) all[k].classList.remove("on");
    this.classList.add("on");
    var ps = document.querySelectorAll(".panel");
    for (var k2=0;k2<ps.length;k2++) ps[k2].classList.remove("on");
    document.getElementById("p-"+this.getAttribute("data-p")).classList.add("on");
    window.scrollTo(0,0);
  });
}

renderWeeks();
overall();
renderErrs();
renderQuiz();
renderScores();



