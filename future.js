/* An Interspecies World: The future (role-play game, v2), adapted to run inside the site. */
(function(){
"use strict";
const E = window.Engine, C = window.CONTENT;
const PRO = 4, LV = 7;
const ROLE = Object.fromEntries(C.ROLES.map(r=>[r.id,r]));
const SPI = C.SPECIES_INFO;
const SRC_LABEL = {choice:"Your choice", rule:"Group rule", rating:"Phase 2 rating", pig:"Pig scenario", glue:"Engine assumption", design:"v2 design rule", lit:"Literature review", other:""};
const esc = s => String(s).replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
/* Story text: escaped, with *Company names* set in italics */
const fmt = s => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const val = (x,c) => typeof x==="function" ? x(c) : x;
function joinList(arr){
  if(arr.length<=1) return arr.join("");
  const oxford = arr.some(x=>x.includes(" and "));
  return arr.slice(0,-1).join(", ") + (oxford ? ", and " : " and ") + arr[arr.length-1];
}
const listPlural = id => id==="pet" ? "cats and dogs" : SPI[id].plural;

/* ---------- State ---------- */
const fresh = () => ({screen:"intro", pendingRole:null, role:null, first:null, step:0, phase:"choose", choiceIdx:null,
  seed:0, noise:0.9, picks:[], levelScene:{}, share:true, playId:null, aboutFrom:null, worldFrom:null, sel:null,
  show:{cet:true, bird:true, pet:true, pig:true}});
let state = fresh();
let hist = [];

const roleName = () => state.role==="animal" ? ROLE.animal.bySpecies[state.first].name : ROLE[state.role].name;
const curT = () => state.step - PRO + 1;
const myGroup = () => ROLE[state.role].group;

function makeCtx(t){
  const st = hist[Math.max(0, t-1)] || hist[0];
  const sp = SPI[state.first];
  const act = E.activeList(state.first, Math.max(t,0));
  return {t, st, act, seed:state.seed, role:state.role, isAnimal:state.role==="animal", first:state.first, sp, pl:sp.plural, sg:sp.single,
    w:st.w, s:st.s, g:st.g||{}, flags:st.flags||{},
    others:E.SPECIES.map(s=>s.id).filter(id=>id!==state.first),
    list:ids=>joinList(ids.map(listPlural)), listNames:ids=>cap(joinList(ids.map(listPlural)))};
}

/* ---------- Replaying choices (keeps the world deterministic for a seed) ---------- */
/* Effects on the starting world: from a prologue choice (src undefined = "Your choice") or decided by the world (src "glue") */
function applyEffects(eff, label, src){
  const s0 = hist[0];
  (eff.set||[]).forEach(([k,v])=>{
    E.expand(k, state.first, E.activeList(state.first,0)).forEach(kk=>{ const q = kk.split("."); if(q[0]==="w") s0.w[q[1]] = v; else s0.s[q[1]][q[2]] = v; });
  });
  Object.assign(s0.flags, eff.flags||{});
  (eff.queue||[]).forEach(([k,v,r,lab])=>s0.queued.push({key:k, val:v, r:r==null?2:r, label:lab||label, src}));
}
function applyPick(p){
  if(p.kind==="pro"){
    const c = makeCtx(0);
    const pr = C.prologue(p.step, c);
    const ch = pr && pr.choices && pr.choices.find(x=>x.id===p.id); if(!ch) return;
    applyEffects(ch, ch.label.replace(/\*/g,""));
  } else {
    const sc = C.SCENES[p.scene];
    const c = makeCtx(p.t);
    const ch = sc.choices[state.role].find(x=>x.id===p.id); if(!ch) return;
    hist[p.t] = E.step(hist[p.t-1], p.t, {seed:state.seed, noise:(state.noise==null ? 0.9 : state.noise), player:{group:myGroup(), move:ch.move, pushes:ch.push||[], label:val(ch.label,c).replace(/\*/g,"")}});
  }
}
function rebuild(){
  hist = state.first ? [E.initState(state.first, state.seed)] : [];
  if(!state.first) return;
  // What the animals decide in the prologue (who talks, what they say first) is set by the world, not the player
  const c0 = makeCtx(0);
  for(let i=0;i<PRO;i++){ const pr = C.prologue(i, c0); if(pr && pr.auto) applyEffects(pr.auto, pr.title, "glue"); }
  state.picks.forEach(applyPick);
}
function pickScene(t){
  if(C.FIXED[t]) return C.FIXED[t];
  const c = makeCtx(t);
  const played = Object.values(state.levelScene);
  let best = null, bp = -Infinity;
  C.POOL.forEach(id=>{
    if(played.includes(id)) return;
    const sc = C.SCENES[id];
    if(!sc.eligible(c,t)) return;
    const p = sc.priority(c,t);
    if(p>bp){ bp = p; best = id; }
  });
  return best || C.POOL.find(id=>!played.includes(id));
}

/* ---------- Saving play data: consent and storage are handled by the site (site.js) ---------- */
function track(fn){ if(!state.playId || !window.Site) return; window.Site.data.track(state.playId, fn); }function newId(){ const a = new Uint8Array(10); crypto.getRandomValues(a); return "p" + Array.from(a, b=>b.toString(16).padStart(2,"0")).join(""); }
function newSeed(){ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % 1000000; }

/* ---------- Small renderers ---------- */
function pill(key, v, changed){
  const kk = key.split(".")[0]==="s" ? "s.x."+key.split(".")[2] : key;
  const info = E.stateInfo(kk, v);
  return `<span class="pill ${info.cls}${changed?" ch":""}">${esc(info.label)}</span>`;
}
function keyLabel(key){
  const p = key.split(".");
  if(p[0]==="w") return E.defOf(key).label;
  return E.SPVARS.find(v=>v.id===p[2]).label;
}
function keyScope(key){
  const p = key.split(".");
  if(p[0]==="w") return "World";
  if(p[1]==="first") return SPI[state.first].name;
  if(p[1]==="*") return "Every species";
  return SPI[p[1]].name;
}
function pushHint(ch, c, isLevel){
  const parts = [];
  if(isLevel && ch.move) parts.push(`${E.GR[myGroup()].label}: ${E.stratLabel(myGroup(), ch.move)}`);
  const act = E.activeList(state.first, c.t);
  (ch.push || ch.queue || []).filter(([k])=>E.expand(k, state.first, act).length>0)
    .slice().sort((a,b)=>(b[2]||2)-(a[2]||2)).slice(0,2)
    .forEach(([k,v])=>{ const kk = k.split(".")[0]==="s" ? "s.x."+k.split(".")[2] : k; parts.push(`${keyScope(k)==="World" ? keyLabel(k) : keyScope(k)+", "+keyLabel(k).toLowerCase()} → ${E.stateInfo(kk,v).label}`); });
  return parts.join(" · ");
}

/* ---------- Header and progress ---------- */
function header(){
  const inGame = ["play","report","world"].includes(state.screen);
  let actions = "";
  if(state.screen==="world") actions += `<button class="btn btn-ghost btn-small" data-action="world-back">Back to the ${state.worldFrom==="report"?"report":"story"}</button>`;
  else if(inGame) actions += `<button class="btn btn-ghost btn-small" data-action="timeline">World timeline</button>`;
  if(inGame) actions += `<button class="btn btn-ghost btn-small" data-action="restart">Start over</button>`;
  actions += `<button class="btn btn-ghost btn-small" data-action="method">How it works</button>`;
  return `<header class="top"><span class="eyebrow">The future · Role play</span><div class="top-actions">${actions}</div></header>`;
}function progress(){
  const cur = state.screen==="report" || state.screen==="world" && state.worldFrom==="report" ? 99 : state.step;
  let h = `<div class="timeline" aria-label="Progress"><div class="tl ${cur<PRO?"now":"done"}"><div class="tl-bar"></div><div class="tl-label">2030</div></div>`;
  for(let k=1;k<=LV;k++){
    const idx = PRO + k - 1;
    const cls = cur>idx ? "done" : cur===idx ? "now" : "";
    h += `<div class="tl ${cls}" title="${esc(E.JUMPS[k].label)} · ${E.JUMPS[k].year}"><div class="tl-bar"></div><div class="tl-label">${esc(E.JUMPS[k].short)}</div></div>`;
  }
  return h + `</div>`;
}
function footer(){ return ""; }function sourcesBlock(list){
  if(!list || !list.length) return "";
  return `<details class="sources"><summary>Why this matters · Sources</summary>
    <ul>${list.map(s=>`<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join("")}</ul></details>`;
}

/* ---------- Intro, about, role, species ---------- */
function viewIntro(){
  return `${header()}
  <div class="narrow">
  <section class="hero fade stack">
    <span class="eyebrow">2030 to 2050 · Seven jumps in time</span>
    <h2 class="g-title">Play the next 25 years</h2>
    <p class="lead">It is 2030 in the United States. Several AI firms can now translate animal communication into basic human speech, and talk back to the animals. Researchers call this condition 1. Within five years comes condition 2: AI will teach animals new words and give them ways to keep records.</p>
    <p>Choose who you are and which animals are understood first. Each decision forks the world: the other groups react by their own rules, and the next scene depends on what your world has become (<button class="linkbtn" data-action="method">how this works</button>). You can follow every species side by side as it happens.</p>
    <div class="facts"><span>20–25 minutes</span><span>6 roles</span><span>4 species groups</span><span>7 jumps in time</span><span>Different scenes each time</span></div>
    <div class="noise-field"><label for="f-noise">Randomness: <span id="f-noise-val">${(state.noise==null ? 0.9 : state.noise).toFixed(1)}</span></label><input type="range" id="f-noise" min="0" max="3" step="0.1" value="${state.noise==null ? 0.9 : state.noise}" aria-describedby="f-noise-hint"><span class="small muted" id="f-noise-hint">How much things move at random, on top of the rules and your choices. At 0 the rules alone decide. The default is 0.9.</span></div>
    <div class="row"><button class="btn btn-primary" data-action="begin">Begin</button></div>
    <div class="note stack">
      <p>The story is imagined. The laws, cases and research it refers to are real, and scenes link to their sources. Nobody in the story knows whether the translations are accurate, and the game never tells you.</p>
    </div>
  </section></div>`;
}
function viewAbout(){ return viewIntro(); }function viewRole(){
  const r = state.pendingRole ? ROLE[state.pendingRole] : null;
  return `${header()}
  <div class="narrow">
  <section class="scene stack-lg fade">
    <div class="stack"><span class="eyebrow">Step 1 of 2</span><h2>Who are you?</h2><p class="muted">Each role sees the same breakthrough from a different place, with different power and different pressures. Your role decides which group's moves you make.</p></div>
    <div class="grid">${C.ROLES.map(x=>`<button class="pick" data-action="pick-role" data-id="${x.id}" aria-pressed="${state.pendingRole===x.id}">
      <span class="k">${esc(x.title)}</span><span class="t">${esc(x.id==="animal"?"You become the animal":x.name)}</span><span class="d">${fmt(x.line)}</span></button>`).join("")}</div>
    ${r ? `<div class="bio stack" id="bio">
      <span class="eyebrow">${esc(r.title)}${r.age?` · ${r.age}`:""} · moves for ${esc(E.GR[r.group].label.toLowerCase())}</span>
      <h3>${esc(r.id==="animal"?"You become the animal":r.name)}</h3>
      ${r.bio.map(t=>`<p>${fmt(t)}</p>`).join("")}
      <div class="row"><button class="btn btn-primary" data-action="confirm-role">Play as ${esc(r.id==="animal"?"the animal":r.short)}</button></div>
    </div>` : ""}
  </section></div>${footer()}`;
}
function viewSpecies(){
  const isAnimal = state.role==="animal";
  const s = state.first ? SPI[state.first] : null;
  const ab = s && isAnimal ? ROLE.animal.bySpecies[s.id] : null;
  return `${header()}
  <div class="narrow">
  <section class="scene stack-lg fade">
    <div class="stack"><span class="eyebrow">Step 2 of 2</span>
      <h2>${isAnimal ? "Which animal are you?" : "Which animals are translated first?"}</h2>
      <p class="muted">${isAnimal ? "The species you choose is the first to be understood by humans, and you become one of them." : "The species you choose is understood first. The others follow a year later, and you can watch all four as the world changes."}</p></div>
    <div class="grid">${Object.values(SPI).map(x=>`<button class="pick" data-action="pick-species" data-id="${x.id}" aria-pressed="${state.first===x.id}">
      <span class="k">${esc(x.group)}</span><span class="t">${esc(x.name)}</span><span class="d">${esc(isAnimal ? "You are "+ROLE.animal.bySpecies[x.id].name+"." : x.line)}</span></button>`).join("")}</div>
    ${s ? `<div class="bio stack" id="bio">
      ${ab ? `<span class="eyebrow">The animal · ${esc(s.group)}</span><h3>${esc(ab.name)}</h3>${ab.bio.map(t=>`<p>${fmt(t)}</p>`).join("")}`
           : `<span class="eyebrow">${esc(s.group)}</span><h3>${esc(s.name)} first</h3><p>${esc(s.line)}</p>`}
      <div class="row"><button class="btn btn-primary" data-action="start">Start in 2030</button><button class="btn btn-ghost" data-action="back-role">Change role</button></div>
    </div>` : ""}
  </section></div>${footer()}`;
}

/* ---------- World panel (beside the story) ---------- */
const PANEL_SP = ["belief","trust","access","status","welfare","collective"];
const PANEL_W = ["accuracy","fakes","records","surveillance","revers","land","children","generations","bloc","response","conflict","food"];
function worldPanel(idx, cmpIdx, caption){
  const st = hist[idx], prev = cmpIdx!=null && cmpIdx>=0 ? hist[cmpIdx] : null;
  const order = [state.first].concat(E.SPECIES.map(s=>s.id).filter(id=>id!==state.first));
  const cards = order.map(sp=>{
    const active = E.isActive(state.first, sp, st.t);
    const head = `<h4><span>${esc(SPI[sp].name)}</span>${sp===state.first?`<span class="mini">First</span>`:""}</h4>`;
    if(!active) return `<div class="spc idle">${head}<span class="pill idle">Translated from 2031</span></div>`;
    return `<div class="spc${sp===state.first?" first":""}">${head}${PANEL_SP.map(v=>{
      const def = E.SPVARS.find(x=>x.id===v);
      const ch = prev && E.isActive(state.first, sp, prev.t) && prev.s[sp][v]!==st.s[sp][v];
      return `<div class="kv"><span class="k">${esc(def.short)}</span>${pill("s."+sp+"."+v, st.s[sp][v], ch)}</div>`;
    }).join("")}</div>`;
  }).join("");
  const rows = PANEL_W.map(id=>{
    const ch = prev && prev.w[id]!==st.w[id];
    return `<span class="lab">${esc(E.defOf("w."+id).label)}</span><span>${pill("w."+id, st.w[id], ch)}</span>`;
  }).join("");
  return `<aside class="world" aria-label="The world right now">
    <div class="world-head"><h3>The world</h3><span class="eyebrow">${esc(caption)}</span></div>
    <div class="sgrid">${cards}</div>
    <div class="wl">${rows}</div>
    <div class="legend"><span><i class="sw" style="background:var(--sg-bg)"></i>Better for animals</span><span><i class="sw" style="background:var(--su-bg)"></i>Contested</span><span><i class="sw" style="background:var(--sb-bg)"></i>Worse</span><span><span class="pill ch" style="padding:0 4px"></span>Just changed</span></div>
    <button class="btn btn-ghost btn-small" data-action="timeline">Open the full timeline</button>
  </aside>`;
}

/* ---------- Play ---------- */
function changeList(items, max){
  if(!items.length) return "";
  const shown = items.slice(0, max||items.length);
  const more = items.length - shown.length;
  return `<ul class="changes">${shown.map(d=>`<li><span class="who">${esc(d.key.split(".")[0]==="w" ? "World" : SPI[d.key.split(".")[1]].name)}</span>${esc(keyLabel(d.key))}: ${pill(d.key, d.from)} <span class="arrow">→</span> ${pill(d.key, d.to)}</li>`).join("")}</ul>${more>0?`<p class="small muted">And ${more} more. Open the world timeline to see them all.</p>`:""}`;
}
function splitChanges(t){
  const ds = E.diff(hist[t-1], hist[t]);
  const ex = hist[t].expl;
  const mine = [], other = [];
  ds.forEach(d=>{ const e = ex[d.key]; (e && e.contrib && e.contrib.some(c=>c.src==="choice") ? mine : other).push(d); });
  return {mine, other};
}
function meanwhile(t){
  const st = hist[t];
  return `<ul class="meanwhile">${E.GROUPS.filter(g=>g.id!==myGroup()).map(g=>{
    const ex = st.expl["g."+g.id];
    let why = ex.pick===ex.rule ? ex.ruleWhy : ((ex.contrib.find(c=>c.src!=="other")||{}).text || "Randomness and pressure from other groups");
    return `<li><strong>${esc(g.label)}</strong>: ${esc(E.stratLabel(g.id, ex.pick))}<span class="reason">${esc(why)}.</span></li>`;
  }).join("")}</ul>`;
}
function viewPlay(){
  const isPro = state.step < PRO;
  let where, title, paras, frameText = "", question = "", choices = null, themes = [], sources = [], c, kind, readout = "";
  if(isPro){
    c = makeCtx(0);
    const pr = C.prologue(state.step, c);
    where = "Prologue · 2030"; title = pr.title; paras = pr.body; kind = pr.kind; question = pr.question || ""; choices = pr.choices || null; themes = pr.themes; sources = pr.sources; readout = pr.readout || "";
  } else {
    const t = curT();
    const sc = C.SCENES[state.levelScene[t]];
    c = makeCtx(t);
    where = `Level ${t} of 7 · ${E.JUMPS[t].label} · ${E.JUMPS[t].year}`; title = sc.title; paras = sc.body(c); kind = "choice";
    frameText = val(sc.frame[state.role], c); question = sc.question; choices = sc.choices[state.role]; themes = sc.themes; sources = sc.sources;
  }
  const persp = `${roleName()} · ${SPI[state.first].name} first`;
  let action = "";
  if(kind==="info"){
    action = `<div class="row"><button class="btn btn-primary" data-action="continue">Continue</button></div>`;
  } else if(state.phase==="choose"){
    action = `<div class="stack"><h3>${esc(question)}</h3><div class="choices">${choices.map((ch,k)=>{
      const hint = pushHint(ch, c, !isPro);
      return `<button class="choice" data-action="choose" data-i="${k}">
        <span class="key">${"ABC"[k]}</span><span class="lbl">${fmt(val(ch.label,c))}</span>
        ${ch.readout?`<span class="readout">${esc(ch.readout)}</span>`:""}
        ${hint?`<span class="sub">${esc(hint)}</span>`:""}
      </button>`; }).join("")}</div></div>`;
  } else {
    const ch = choices[state.choiceIdx];
    let after = "";
    if(!isPro){
      const t = curT();
      const {mine, other} = splitChanges(t);
      after = `<div class="stack-sm"><h3>What your choice changed</h3>${mine.length ? changeList(mine) : `<p class="muted small">Nothing moved this time. The world resisted, or other pressures were stronger. Your move still shaped what the other groups did.</p>`}</div>
        <div class="stack-sm"><h3>Meanwhile</h3>${meanwhile(t)}</div>
        ${other.length ? `<div class="stack-sm"><h3>Elsewhere in the world</h3>${changeList(other, 8)}</div>` : ""}`;
    }
    const last = state.step+1 >= PRO+LV;
    action = `<div class="stack fade">
      <div class="chosen stack-sm"><span class="eyebrow">You chose</span><p><strong>${fmt(val(ch.label,c))}</strong></p>${ch.readout?`<p class="mono" style="color:var(--green);font-size:.85rem">${esc(ch.readout)}</p>`:""}<p>${fmt(val(ch.out,c)||"")}</p></div>
      ${after}
      <div class="row"><button class="btn btn-primary" data-action="continue">${last?"See your world in 2050":"Continue"}</button><button class="btn btn-ghost" data-action="timeline">World timeline</button></div>
    </div>`;
  }
  // World panel: before the choice shows the world going in; after it shows the result
  let panel;
  if(isPro) panel = worldPanel(0, null, "At the start · 2030");
  else {
    const t = curT();
    panel = state.phase==="outcome" ? worldPanel(t, t-1, `After your choice · ${E.JUMPS[t].year}`) : worldPanel(t-1, t-2, `Going in · ${E.JUMPS[t-1].label}`);
  }
  return `${header()}${progress()}
  <div class="playgrid">
    <section class="scene stack-lg fade" id="scene">
      <div class="stack-sm">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(where)}</span><span class="tag p">${esc(persp)}</span></div>
        <h2>${esc(title)}</h2>
      </div>
      <div class="stack">${paras.filter(Boolean).map(p=>`<p>${fmt(p)}</p>`).join("")}${readout?`<p class="mono" style="color:var(--green);font-size:.9rem">${esc(readout)}</p>`:""}</div>
      ${frameText ? `<p class="frame"><span class="eyebrow">You, ${esc(state.role==="animal"?roleName():ROLE[state.role].short)}</span>${fmt(frameText)}</p>` : ""}
      ${action}
      ${sourcesBlock(sources)}
    </section>
    ${panel}
  </div>${footer()}`;
}

/* ---------- Timeline view ---------- */
function cellHTML(key, t){
  const st = hist[t];
  if(!st) return `<span class="cell empty" aria-hidden="true"></span>`;
  const p = key.split(".");
  const sel = state.sel && state.sel.key===key && state.sel.t===t ? " sel" : "";
  if(p[0]==="g"){
    if(t===0) return `<span class="cell empty">—</span>`;
    const ex = st.expl["g."+p[1]];
    const lab = E.stratLabel(p[1], st.g[p[1]]);
    return `<button class="cell ${ex && ex.player?"you":"s"}${sel}" data-action="cell" data-key="${key}" data-t="${t}" aria-label="${esc(E.GR[p[1]].label)}, ${esc(E.JUMPS[t].label)}: ${esc(lab)}">${esc(lab)}${ex && ex.player?" (you)":""}</button>`;
  }
  if(p[0]==="s" && !E.isActive(state.first, p[1], t)) return `<span class="cell idle">Not yet translated</span>`;
  const v = E.get(st, key);
  const info = E.stateInfo(p[0]==="s" ? "s.x."+p[2] : key, v);
  const changed = t>0 && E.get(hist[t-1], key)!==v ? " changed" : "";
  return `<button class="cell ${info.cls}${changed}${sel}" data-action="cell" data-key="${key}" data-t="${t}" aria-label="${esc(keyLabel(key))}, ${esc(E.JUMPS[t].label)}: ${esc(info.label)}">${esc(info.label)}</button>`;
}
function contribLI(c){
  const lab = SRC_LABEL[c.src];
  const r = Math.round(c.r*10)/10;
  return `<li>${lab?`<span class="src ${c.src}">${esc(lab)}${c.ref?" · "+esc(c.ref):""}</span>`:""}${esc(c.text)}${c.src==="choice" && c.r===0 ? "" : ` (${r>0?"+":""}${r})`}</li>`;
}
function whyHTML(){
  if(!state.sel) return `<p class="muted">Select a cell in the grid to see what moved it.</p>`;
  const {key, t} = state.sel;
  const st = hist[t]; if(!st) return "";
  const p = key.split(".");
  const label = p[0]==="g" ? E.GR[p[1]].label : (p[0]==="s" ? SPI[p[1]].name+": "+keyLabel(key).toLowerCase() : keyLabel(key));
  if(t===0) return `<p><strong>${esc(label)}</strong> at the start: set by the setup, your prologue choices, or at random.</p>`;
  const ex = st.expl[key];
  if(!ex) return `<p class="muted">No explanation recorded.</p>`;
  if(ex.kind==="idle") return `<p>${esc(SPI[p[1]].name)} are not translated yet at this point.</p>`;
  if(ex.kind==="note") return `<p><strong>${esc(label)}</strong>: ${esc(ex.text)}</p>`;
  if(ex.kind==="group"){
    const lab = E.stratLabel(ex.group, ex.pick);
    if(ex.player) return `<p><strong>${esc(label)}</strong>: you chose “${esc(lab)}”. The group's rule would have picked “${esc(E.stratLabel(ex.group, ex.rule))}”.</p>`;
    return `<p><strong>${esc(label)}</strong> chose “${esc(lab)}”. What pushed toward it:</p><ul>${ex.contrib.map(contribLI).join("")}</ul>`;
  }
  const toL = E.stateInfo(p[0]==="s"?"s.x."+p[2]:key, ex.to).label, fromL = E.stateInfo(p[0]==="s"?"s.x."+p[2]:key, ex.from).label;
  let h = `<p><strong>${esc(label)}</strong> ${ex.from===ex.to ? `stayed at “${esc(toL)}”` : `moved from “${esc(fromL)}” to “${esc(toL)}”`} at ${esc(E.JUMPS[t].label.toLowerCase())}. What pushed toward it:</p><ul>${ex.contrib.filter(c=>!(c.text==="Randomness" && c.r<0.05)).map(contribLI).join("")}</ul>`;
  if(ex.runner){
    const rc = ex.runnerContrib.filter(c=>c.src!=="other");
    if(rc.length) h += `<p class="muted" style="margin-top:10px">The strongest alternative, “${esc(E.stateInfo(p[0]==="s"?"s.x."+p[2]:key, ex.runner).label)}”, lost by ${Math.round(ex.margin*10)/10}:</p><ul>${rc.map(contribLI).join("")}</ul>`;
  }
  return h;
}
function viewWorld(){
  const head = `<thead><tr><th class="rowh">Variable</th>${E.JUMPS.map(j=>`<th>${esc(j.label)}<span class="yr">${j.year}</span></th>`).join("")}</tr></thead>`;
  const rows = [];
  const sec = title => rows.push(`<tr class="sec"><th>${esc(title)}</th><td colspan="${E.JUMPS.length}"></td></tr>`);
  const row = (label, key) => rows.push(`<tr><th class="rowh">${esc(label)}</th>${E.JUMPS.map((_,t)=>`<td>${cellHTML(key,t)}</td>`).join("")}</tr>`);
  sec("What each group did"); E.GROUPS.forEach(g=>row(g.label+(g.id===myGroup()?" (you)":""), "g."+g.id));
  sec("Outcomes"); E.OUTCOMES.forEach(v=>row(v.label, "w."+v.id));
  sec("Open questions"); E.WORLD.forEach(v=>row(v.label, "w."+v.id));
  const order = [state.first].concat(E.SPECIES.map(s=>s.id).filter(id=>id!==state.first));
  order.filter(sp=>state.show[sp]).forEach(sp=>{ sec(SPI[sp].name + (sp===state.first?" (translated first)":"")); E.SPVARS.forEach(v=>row(v.label, "s."+sp+"."+v.id)); });
  return `${header()}${progress()}
  <section class="stack-lg fade" style="padding-top:30px">
    <div class="stack-sm narrow">
      <span class="eyebrow">World timeline · seed ${state.seed}</span>
      <h2>The world so far</h2>
      <p class="muted">Every group, outcome and species across the jumps. Select any cell to see what moved it. A dark left edge marks a change.</p>
    </div>
    <div class="stack-sm"><span class="k">Show species</span><div class="filters">${E.SPECIES.map(s=>`<button class="chip" data-action="toggle-sp" data-id="${s.id}" aria-pressed="${state.show[s.id]}">${esc(s.name)}</button>`).join("")}</div></div>
    <div class="gridwrap"><table class="tg" aria-label="World state over time">${head}<tbody>${rows.join("")}</tbody></table></div>
    <div class="legend"><span><i class="sw" style="background:var(--sg-bg)"></i>Better for animals</span><span><i class="sw" style="background:var(--su-bg)"></i>Contested or mixed</span><span><i class="sw" style="background:var(--sb-bg)"></i>Worse for animals</span><span><i class="sw" style="background:var(--sn-bg)"></i>Neutral</span><span><i class="sw" style="background:var(--pink-soft)"></i>Your move</span></div>
    <div class="why stack-sm" id="why"><h3>Why it is this way</h3>${whyHTML()}</div>
  </section>${footer()}`;
}

/* ---------- Report ---------- */
function humanWelfare(st){
  const f = [];
  const add = (v,t) => f.push([v,t]);
  if(st.w.conflict==="confrontation") add(-2,"Humans and animals are in open conflict");
  else if(st.w.conflict==="polarization") add(-1,"People are polarized over animals");
  else add(1,"There is no open conflict");
  if(st.w.fakes==="widespread") add(-1,"Fake translations are widespread");
  if(st.w.surveillance==="mass") add(-1,"Mass monitoring reaches into everyday life");
  if(st.w.military==="confirmed") add(-1,"Military use of translation is confirmed");
  if(st.w.generations==="split") add(-1,"Families are split between generations");
  if(st.w.food==="shrinking" && st.w.altprot==="costly") add(-1,"Animal farming is shrinking while alternatives are still costly, so food jobs and prices take a hit");
  if(st.w.food==="shrinking") add(1,"Animal farming is shrinking, which helps on climate, biodiversity and pandemic risk");  // R21, literature review
  if(st.w.response==="suppressed") add(-1,"The technology was suppressed, with arrests and lost research");
  if(st.w.children==="include") add(1,"Children grow up including animals in their moral circle");
  if(st.w.accuracy==="genuine" && st.w.fakes!=="widespread") add(1,"People broadly trust what they hear from animals");
  const score = f.reduce((a,b)=>a+b[0],0);
  return {word: score>=1 ? "Better" : score<=-2 ? "Worse" : "About the same", factors:f};
}
function animalWelfare(st){
  const act = E.activeList(state.first, st.t);
  const better = act.filter(sp=>st.s[sp].welfare==="better").length, worse = act.filter(sp=>st.s[sp].welfare==="worse").length;
  return better>worse ? "Better" : worse>better ? "Worse" : "About the same";
}
function viewReport(){
  const st = hist[LV];
  const hw = humanWelfare(st);
  const order = [state.first].concat(E.SPECIES.map(s=>s.id).filter(id=>id!==state.first));
  const spCards = order.map(sp=>`<div class="spc${sp===state.first?" first":""}"><h4><span>${esc(SPI[sp].name)}</span>${sp===state.first?`<span class="mini">First</span>`:""}</h4>${E.SPVARS.map(v=>`<div class="kv"><span class="k">${esc(v.short)}</span>${pill("s."+sp+"."+v.id, st.s[sp][v.id])}</div>`).join("")}</div>`).join("");
  const themeRows = C.THEMES.map(th=>{
    let vals;
    if(th.species) vals = order.map(sp=>`<span class="pill n" style="background:transparent">${esc(SPI[sp].name)}</span>${pill("s."+sp+"."+th.species, st.s[sp][th.species])}`).join("");
    else vals = pill(th.key, E.get(st, th.key)) + (th.key2 ? pill(th.key2, E.get(st, th.key2)) : "");
    return `<div class="theme-row"><div><div class="nm">${esc(th.name)}</div><div class="ds">${esc(th.short)}</div></div><div class="vals">${vals}</div></div>`;
  }).join("");
  const path = state.picks.filter(p=>p.kind==="lvl").map(p=>{
    const sc = C.SCENES[p.scene], c = makeCtx(p.t);
    const ch = sc.choices[state.role].find(x=>x.id===p.id);
    const {mine} = splitChanges(p.t);
    return `<li><span class="eyebrow">${esc(E.JUMPS[p.t].label)} · ${E.JUMPS[p.t].year} · ${esc(sc.title)}</span>${fmt(val(ch.label,c))}${mine.length?changeList(mine,3):""}</li>`;
  }).join("");
  const played = Object.values(state.levelScene);
  const missed = C.POOL.filter(id=>!played.includes(id));
  return `${header()}${progress()}
  <section class="stack-lg fade" style="padding-top:30px">
    <div class="stack-sm narrow"><span class="eyebrow">World report · 2050</span><h2>The world you built</h2>
      <p>Twenty years after the ${esc(SPI[state.first].plural)} were first understood, played as ${esc(roleName())}. By 2050, the institutional response to the translators is “${esc(E.stateInfo("w.response", st.w.response).label)}” and conflict stands at “${esc(E.stateInfo("w.conflict", st.w.conflict).label)}”. Whether the animals were ever really understood is still open: ${esc(E.stateInfo("w.accuracy", st.w.accuracy).label.toLowerCase())}.</p></div>
    <div class="welfare">
      <div class="wcard"><span class="eyebrow">Animal welfare</span><span class="big">${animalWelfare(st)}</span>
        <ul>${order.map(sp=>`<li>${esc(SPI[sp].name)}: ${esc(E.stateInfo("s.x.welfare", st.s[sp].welfare).label.toLowerCase())}</li>`).join("")}</ul></div>
      <div class="wcard"><span class="eyebrow">Human welfare</span><span class="big">${hw.word}</span>
        <ul>${hw.factors.map(f=>`<li>${esc(f[1])}</li>`).join("")}</ul>
        <p class="small muted">A rough reading from the factors above. All are engine assumptions, except the benefits of shrinking animal farming, which come from the literature review (R21).</p></div>
    </div>
    <div class="stack-sm"><h3>Four species in 2050</h3><div class="sgrid4">${spCards}</div></div>
    <div class="stack-sm"><h3>Where your world stands</h3><div class="themes">${themeRows}</div></div>
    <div class="stack-sm narrow"><h3>Your forks</h3><ol class="path">${path}</ol></div>
    ${missed.length ? `<div class="stack-sm narrow"><h3>Scenes you did not reach</h3><p class="muted small">Your world never got there this time. Play again with other choices, another role or another species.</p><ul class="newlist">${missed.map(id=>`<li><strong>${esc(C.SCENES[id].title)}</strong>. ${esc(C.SCENES[id].hint)}</li>`).join("")}</ul></div>` : ""}
    ${window.Site ? window.Site.stats.futureCompare(st, state.playId, state.noise) : ""}
    <div class="row"><button class="btn btn-primary" data-action="timeline">Open the full timeline</button><button class="btn btn-ghost" data-action="restart">Play again</button><button class="btn btn-ghost" data-action="method">How it works</button><a class="btn btn-ghost" href="#present">Try The present</a></div>
  </section>${footer()}`;
}

/* ---------- Render ---------- */
const app = document.getElementById("future-app");
let waveStop = null;
function render(scrollTop){
  if(waveStop){ waveStop(); waveStop = null; }
  const v = {intro:viewIntro, about:viewAbout, role:viewRole, species:viewSpecies, play:viewPlay, report:viewReport, world:viewWorld}[state.screen] || viewIntro;
  app.innerHTML = v();
  if(state.screen==="intro"){ const cv = app.querySelector("#wave"); if(cv) waveStop = startWave(cv); }
  if(scrollTop) window.scrollTo({top:0});
}

/* ---------- Actions ---------- */
app.addEventListener("change", e=>{ if(e.target.id==="share") state.share = e.target.checked; });
app.addEventListener("click", e=>{
  const el = e.target.closest("[data-action]"); if(!el) return;
  const a = el.dataset.action;
  if(a==="home"){ if(["play","report","world"].includes(state.screen) || state.screen==="intro") return; state.screen = "intro"; render(true); }
  else if(a==="about" || a==="method"){ if(window.Site) window.Site.go("methodology", "m-future"); }

  else if(a==="about-back"){ state.screen = state.aboutFrom || "intro"; render(true); }
  else if(a==="begin"){ const go = ()=>{ state.screen = "role"; render(true); }; if(window.Site) window.Site.consent.ask(go); else go(); }
  else if(a==="pick-role"){ state.pendingRole = el.dataset.id; render(); const b = app.querySelector("#bio"); if(b) b.scrollIntoView({behavior:"smooth", block:"nearest"}); }
  else if(a==="confirm-role"){ state.role = state.pendingRole; state.first = null; state.screen = "species"; render(true); }
  else if(a==="back-role"){ state.screen = "role"; render(true); }
  else if(a==="pick-species"){ state.first = el.dataset.id; render(); const b = app.querySelector("#bio"); if(b) b.scrollIntoView({behavior:"smooth", block:"nearest"}); }
  else if(a==="start"){
    state.seed = newSeed(); state.picks = []; state.levelScene = {}; state.step = 0; state.phase = "choose"; state.choiceIdx = null; state.sel = null; state.screen = "play";
    rebuild();
    state.playId = null;
    if(window.Site && window.Site.data.sharing()){
      state.playId = newId();
      const body = {game:"future", v:"v3.0", startedOn:new Date().toISOString().slice(0,10), role:state.role, first:state.first, noise:(state.noise==null ? 0.9 : state.noise), choices:{}, scenes:{}, completed:false};
      track(ref=>ref.set(body));
    }
    render(true);
  }
  else if(a==="choose"){
    const i = +el.dataset.i;
    if(state.step < PRO){
      const pr = C.prologue(state.step, makeCtx(0));
      const ch = pr.choices[i];
      const p = {kind:"pro", step:state.step, id:ch.id};
      state.picks.push(p); applyPick(p);
      track(ref=>ref.update({choices:{[pr.id]:ch.id}, lastStep:pr.id}));
    } else {
      const t = curT(), sid = state.levelScene[t];
      const ch = C.SCENES[sid].choices[state.role][i];
      const p = {kind:"lvl", t, scene:sid, id:ch.id};
      state.picks.push(p); applyPick(p);
      track(ref=>ref.update({choices:{["L"+t]:ch.id}, scenes:{["L"+t]:sid}, lastStep:"L"+t}));
    }
    state.choiceIdx = i; state.phase = "outcome";
    render();
    const sc = app.querySelector("#scene"); if(sc) sc.scrollIntoView({behavior:"smooth", block:"start"});
  }
  else if(a==="continue"){
    state.step++; state.phase = "choose"; state.choiceIdx = null;
    if(state.step >= PRO+LV){
      state.screen = "report";
      const st = hist[LV];
      track(ref=>ref.update({completed:true, final:{w:st.w, s:st.s, g:st.g}}));
    } else if(state.step >= PRO){
      const t = curT();
      if(!state.levelScene[t]) state.levelScene[t] = pickScene(t);
    }
    render(true);
  }
  else if(a==="restart"){ const share = state.share, noise = state.noise; state = fresh(); state.share = share; if(noise!=null) state.noise = noise; hist = []; render(true); }
  else if(a==="timeline"){ state.worldFrom = state.screen; state.screen = "world"; if(!state.sel && hist.length>1){ state.sel = {key:"w.response", t:hist.length-1}; } render(true); }
  else if(a==="world-back"){ state.screen = state.worldFrom==="report" ? "report" : "play"; render(true); }
  else if(a==="toggle-sp"){ state.show[el.dataset.id] = !state.show[el.dataset.id]; render(); }
  else if(a==="cell"){ state.sel = {key:el.dataset.key, t:+el.dataset.t}; render(); const w = app.querySelector("#why"); if(w) w.scrollIntoView({behavior:"smooth", block:"nearest"}); }
});

/* ---------- Signal wave (intro) ---------- */
function startWave(canvas){
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 0, raf = 0, alive = true;
  function size(){ const d = window.devicePixelRatio||1; canvas.width = canvas.clientWidth*d; canvas.height = canvas.clientHeight*d; ctx.setTransform(d,0,0,d,0,0); }
  function draw(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    const cs = getComputedStyle(document.documentElement);
    const pink = cs.getPropertyValue("--pink").trim(), green = cs.getPropertyValue("--green").trim();
    const animal = p => Math.sin(p*22 + t)*0.55 + Math.sin(p*57 - t*1.6)*0.3 + Math.sin(p*9 + t*0.4)*0.15;
    const human = p => Math.sin(p*13 - t*0.8 + 1.3)*0.7 + Math.sin(p*29 + t*1.1)*0.3;
    const amp = h*0.36;
    const line = (fn, color) => {
      ctx.beginPath();
      for(let x=0; x<=w; x+=2){ const p = x/w, env = Math.sin(Math.PI*Math.min(1, p*1.05+0.02)); const y = h/2 + fn(p)*amp*env; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
    };
    const mix = p => { const s = Math.max(0, Math.min(1, (p-0.35)/0.5)); return s*s*(3-2*s); };
    line(p=>animal(p), pink);
    line(p=>human(p)*(1-mix(p)) + animal(p)*mix(p)*0.92, green);
  }
  function loop(){ if(!alive) return; t += 0.012; draw(); raf = requestAnimationFrame(loop); }
  size();
  const onR = () => { size(); draw(); };
  window.addEventListener("resize", onR);
  if(reduce) draw(); else loop();
  return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
}

/* ---------- Boot: started by the site (site.js), which also keeps games across live updates ---------- */
function start(data){
  if(data && data.state && data.state.screen){ state = Object.assign(fresh(), data.state); }
  try{ rebuild(); }catch(err){ state = fresh(); hist = []; }
  render();
}
window.addEventListener("isw-plays", ()=>{ if(state.screen==="report") render(); });
app.addEventListener("input", e=>{ if(e.target && e.target.id==="f-noise"){ state.noise = Math.round(+e.target.value*10)/10; const v = app.querySelector("#f-noise-val"); if(v) v.textContent = state.noise.toFixed(1); } });
window.__isw = {get state(){ return state; }, get hist(){ return hist; }, E, C, pickScene, makeCtx};
window.ISW_FUTURE = {start, snapshot:()=>({state})};
})();