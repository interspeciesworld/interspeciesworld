/* An Interspecies World: The present, an explorer of the world model and of the research behind it.
   Modeled on the project's first scenario explorer: set up a world, step through 2030 to 2050,
   select any cell to see what moved it and what research says about it, and run 200 worlds.
   Nothing here is saved. */
(function(){
"use strict";
const E = window.Engine;
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SRC_LABEL = {rule:"Group rule", choice:"Your move", rating:"Phase 2 rating", pig:"Pig world-building", glue:"Engine assumption", design:"Design rule", lit:"Literature review", other:""};

/* ---------- What research says about each part of the model (literature review unless marked outside) ---------- */
const S = {
  AA:{t:"Alcantara & Andrews (2026)", u:"https://doi.org/10.1007/s11245-026-10409-2"},
  KU:{t:"Küçükuncular (2025)", u:"https://doi.org/10.1007/s43681-025-00828-z"},
  MA:{t:"Mamzer, Kuchtar & Grzegorzewski (2026)", u:"https://doi.org/10.3390/ani16030375"},
  CP:{t:"Coghlan & Parker (2023)", u:"https://doi.org/10.1007/s13347-023-00627-6"},
  CP24:{t:"Coghlan & Parker (2024)", u:"https://doi.org/10.1007/s13347-024-00712-4"},
  CPL:{t:"Coghlan, Parker & Lederman (2026)", u:"https://doi.org/10.1007/s11948-025-00578-5"},
  BO:{t:"Bossert (2023)", u:"https://doi.org/10.1007/s13347-023-00658-z"},
  BH:{t:"Bossert & Hagendorff (2023)", u:"https://doi.org/10.1002/sd.2596"},
  RG:{t:"Rodríguez-Garavito et al. (2025)", u:"https://doi.org/10.15779/Z383X83N5Q"},
  ST:{t:"Singer & Tse (2023)", u:"https://doi.org/10.1007/s43681-022-00187-z"},
  MOTH:{t:"MOTH Program (2025), the PEPP Framework", u:"https://mothlife.org/wp-content/uploads/2025/11/Listening-to-Our-Animal-Kin_MOTH-Report.pdf"},
  AIW:{t:"Outside the review: AI Weekly on crow decoding", u:"https://aiweekly.co/alerts/bloomberg-ai-crow-decoder-could-aid-poachers-warn-ethicists"},
  AGG:{t:"Outside the review: ag-gag laws", u:"https://en.wikipedia.org/wiki/Ag-gag"},
  WI:{t:"Outside the review: Wilks and others (2021)", u:"https://doi.org/10.1177/0956797620960398"},
  HAPPY:{t:"Outside the review: the case of Happy the elephant", u:"https://www.nonhumanrights.org/client/happy/"}
};
const COVER = {good:"Well covered", partial:"Partly covered", weak:"Barely covered", none:"Not covered yet"};
const COVER_ORDER = ["good","partial","weak","none"];
/* key -> [coverage, what research says, sources, what is missing] */
const RESEARCH = {
  "w.accuracy":["good","There are no bilingual speakers to check translations against, and humans choose the data, the training and how outputs are read (Alcantara & Andrews 2026). Küçükuncular (2025) calls accuracy the primary concern: even a perfect translation could miss motives or cultural context. Recognising animal communication as language and humans understanding it can happen independently (Rodríguez-Garavito et al. 2025).",[S.AA,S.KU,S.RG],"Little. The debate itself is well mapped."],
  "w.carryover":["partial","Animals cannot currently tell humans about the harms done to them (Singer & Tse 2023). Until we understand what animals say, whether we grasp the size of that harm is debatable (Rodríguez-Garavito et al. 2025).",[S.ST,S.RG],"Whether reports about pain, fear or wishes would be believed, and by whom."],
  "w.fakes":["partial","AI-generated signals that imitate known individuals raise manipulation risks, much like deepfakes (Mamzer et al. 2026). Outside the review, a biologist has warned that decoded crow calls could help hunters lure birds.",[S.MA,S.AIW],"How fake translations would shape human opinion and politics. Research on synthetic media is the place to look."],
  "w.openness":["none","The review says nothing about how AI companies behave, or whether open models would help or harm animals.",[],"Everything. AI governance research on open and closed models would be the place to look."],
  "w.surveillance":["partial","AI already detects and tracks farmed pigs to spot health problems without human observation (Bossert 2023). Once humans can take part in animals' communication, questions of privacy and manipulation become hard to avoid, and better translation gives humans better tools to control animals (Mamzer et al. 2026).",[S.BO,S.MA],"Who would build and buy listening devices, and for what."],
  "w.records":["none","The review does not cover who owns animals' recordings or translations. The project's pig world-building saw records as a chokepoint: whoever holds them holds the animals' history.",[],"Everything. Indigenous data governance might offer an analogy."],
  "w.revers":["none","The ethics literature does not cover what happens to words animals have learned once the translators go off.",[],"Everything. Histories of language-trained apes after their studies ended may be the closest evidence."],
  "w.consent":["good","Withdrawing from an interaction should count as a lack of consent, to avoid coercion (Küçükuncular 2025). Playback research shows that sending meaningful signals can cause distress, change behaviour and disrupt relationships (Mamzer et al. 2026). The PEPP framework (MOTH 2025) sets the first voluntary principles for these tools.",[S.KU,S.MA,S.MOTH],"What researchers would actually do under pressure. The literature says what should happen."],
  "w.military":["none","Not covered by the review. The project's world model assumes civilian scientists use only low or moderately invasive methods, while military programs may not.",[],"Everything."],
  "w.land":["weak","Rodríguez-Garavito et al. (2025) explore cetacean rights through the right to take part in cultural life, and describe Indigenous practices of interspecies dialogue that long predate AI.",[S.RG],"Property and land law, and any species other than cetaceans."],
  "w.children":["none","Not in the review. Outside it, Wilks and others (2021) found that children weigh animals' lives closer to humans' than adults do.",[S.WI],"Everything about children raised with translators."],
  "w.generations":["none","Not in the ethics literature. The tension between generations in the model is an engine assumption.",[],"Everything."],
  "w.chicken":["partial","Küçükuncular (2025) warns of a two-tier system of speaking and voiceless animals. The review argues translation redraws that boundary rather than creating it. Whether bird models would work for chickens is untested.",[S.KU],"Any test of whether translation transfers between species."],
  "w.voiceless":["partial","Küçükuncular (2025) warns of a two-tier system: a few “speaking” species gain moral concern while most animals stay voiceless. The review argues translation redraws that boundary rather than creating it.",[S.KU],"Whether recognising some species would spread to others, or leave them further behind."],
  "w.bloc":["none","The ethics literature does not cover collective action by animals, or condition 2 at all. The project's pig world-building imagined the first steps.",[],"Everything."],
  "w.agi":["none","The review does not discuss AGI. The model keeps the debate open, as it is today.",[],"How beliefs about AGI would interact with this technology."],
  "w.altprot":["none","Not discussed in the review. In the model it is set at random at the start of each world.",[],"Everything."],
  "w.response":["weak","Findings about animal capacities have repeatedly shaped laws, as with research on great apes (Rodríguez-Garavito et al. 2025). Voluntary principles like PEPP may become binding over time (MOTH 2025). Successful communication may create responsibilities institutions are not ready for (Alcantara & Andrews 2026; Küçükuncular 2025).",[S.RG,S.MOTH,S.AA,S.KU],"How institutions would actually respond."],
  "w.conflict":["weak","More sophisticated translation could give humans more sophisticated tools to control animals (Mamzer et al. 2026). Nothing in the review covers conflict between humans and animals.",[S.MA],"Everything about conflict between humans and animals."],
  "w.food":["partial","Animal agriculture drives climate change, biodiversity loss and pandemic risk (Bossert & Hagendorff 2023). AI could let farmed animals be crammed into smaller spaces, an intentional and legal harm (Coghlan & Parker 2023).",[S.BH,S.CP],"Whether hearing animals would change what people eat, and how the industry would respond."],
  "s.belief":["partial","Translations that make animals sound human-like risk being favoured (Küçükuncular 2025). That raises belief, but feeds the critique that the AI translates animals into categories humans already understand (Alcantara & Andrews 2026).",[S.KU,S.AA],"How belief would differ between species."],
  "s.says":["good","Many species communicate in far more complex ways than once believed, with individual vocal signatures, dialects and culture-like transmission (Küçükuncular 2025). The question is less whether animals can speak than how they communicate emotions, intentions and needs (Mamzer et al. 2026).",[S.KU,S.MA],"What each species would say once translated."],
  "s.knowing":["partial","Language experiments produced scientific breakthroughs but also exposed emotional suffering in research animals (Mamzer et al. 2026).",[S.MA],"Whether understanding their situation would help or harm animals."],
  "s.collective":["none","The ethics literature does not cover collective action by animals, or condition 2.",[],"Everything."],
  "s.status":["partial","Language capacity might raise cetaceans' moral status, so practices such as captivity could be seen as harmful (Rodríguez-Garavito et al. 2025). Moral standing could also rest on what we already know about animals (Alcantara & Andrews 2026). Outside the review, US habeas cases for elephants and chimpanzees have so far failed.",[S.RG,S.AA,S.HAPPY],"Every species other than cetaceans."],
  "s.welfare":["partial","AI should actively benefit animals, for example through veterinary care, not only avoid harm (Bossert 2023; Coghlan & Parker 2024). Its harms can be intentional or not, direct or indirect, and its benefits may be overrated (Coghlan & Parker 2023).",[S.BO,S.CP24,S.CP],"How large any of these effects would be."],
  "s.access":["none","The ethics literature does not cover giving animals translators and then taking them away. Outside the review, several US states ban recording on farms.",[S.AGG],"Everything. This is the deprivation question: is taking access away a harm?"],
  "s.trust":["partial","An animal's withdrawal should count as a lack of consent (Küçükuncular 2025). Research ethics is moving from protecting animals to relating to them, with trust as a basis for coexistence (Mamzer et al. 2026).",[S.KU,S.MA],"What animals would do once they stopped trusting humans."],
  "g.bill":["none","The review says nothing about how AI companies or their founders behave. The PEPP framework is partly addressed to developers.",[S.MOTH],"Everything."],
  "g.adv":["none","Nothing in the ethics literature on how advocacy groups would respond. Singer and Tse (2023) and Coghlan, Parker and Lederman (2026) argue that AI ethics should include animals.",[S.ST,S.CPL],"Everything about how advocates would act."],
  "g.acad":["partial","The review describes what researchers should do: consent-based, participatory, non-invasive methods (Mamzer et al. 2026; Küçükuncular 2025).",[S.MA,S.KU],"What researchers would do, as opposed to what they should do."],
  "g.pol":["weak","The great ape precedent shows lawmakers acting on new science (Rodríguez-Garavito et al. 2025). Otherwise the review is silent on political responses.",[S.RG],"Political responses to the technology."],
  "g.ind":["weak","AI monitoring of farmed animals already exists (Bossert 2023), and AI could intensify confinement (Coghlan & Parker 2023). Outside the review, ag-gag laws suggest the industry would restrict recording.",[S.BO,S.CP,S.AGG],"How the industry would respond to translation."],
  "g.ani":["partial","Animals' refusal should be respected as a lack of consent (Küçükuncular 2025). How animals would act once they can answer back is unstudied.",[S.KU],"Everything beyond refusal."]
};
const rkey = key => { const p = key.split("."); return p[0]==="s" ? "s."+p[2] : key; };
const coverOf = key => (RESEARCH[rkey(key)]||["none"])[0];

/* ---------- Setup ---------- */
const WFIELDS = ["accuracy","carryover","openness","fakes","surveillance","consent","military","agi","altprot"];
const SFIELDS = ["belief","says","trust"];
const base0 = E.initState("cet", 1);
function defaultSetup(){
  const w = {}; WFIELDS.forEach(id=>{ const d = E.defOf("w."+id); w[id] = d.random ? "vary" : d.start; });
  const s = {}; E.SPECIES.forEach(sp=>{ s[sp.id] = {}; SFIELDS.forEach(v=>{ s[sp.id][v] = base0.s[sp.id][v]; }); });
  return {first:"cet", playas:"watch", noise:0.9, seed:2030, glue:true, w, s};
}
const fresh = () => ({setup:defaultSetup(), started:false, t:0, moves:{}, sel:null, show:{cet:true, bird:true, pet:true, pig:true}, batch:null, prevBatch:null, runSetup:null});
let state = fresh();
let hist = [];

function initWorld(setup, seed){
  const st = E.initState(setup.first, seed);
  const rng = E.mulberry32(seed*31 + 7);
  WFIELDS.forEach(id=>{
    const v = setup.w[id], d = E.defOf("w."+id);
    if(v==="vary"){ if(!d.random) st.w[id] = d.states[Math.floor(rng()*d.states.length)][0]; }
    else st.w[id] = v;
  });
  E.SPECIES.forEach(sp=>SFIELDS.forEach(v=>{
    const val = setup.s[sp.id][v], d = E.SPVARS.find(x=>x.id===v);
    st.s[sp.id][v] = val==="vary" ? d.states[Math.floor(rng()*d.states.length)][0] : val;
  }));
  return st;
}
const stepOpt = (setup, seed, extra) => Object.assign({seed, noise:setup.noise, skipSrc: setup.glue ? [] : ["glue"]}, extra||{});
function rebuild(){
  const su = state.runSetup || state.setup;
  hist = state.started ? [initWorld(su, su.seed)] : [];
  for(let t=1; t<=state.t; t++){
    const mv = state.moves[t];
    const player = mv ? {group:mv.g, move:mv.m, pushes:[], label:E.stratLabel(mv.g, mv.m)} : undefined;
    hist[t] = E.step(hist[t-1], t, stepOpt(su, su.seed, player ? {player} : null));
  }
}

/* ---------- Many worlds ---------- */
const METRICS = () => (window.Site && window.Site.stats.FUT_METRICS) || [];
function runBatch(){
  const su = JSON.parse(JSON.stringify(state.setup)), finals = [];
  for(let i=1; i<=200; i++){
    const seed = su.seed*1000 + i;
    let st = initWorld(su, seed);
    for(let t=1; t<=7; t++) st = E.step(st, t, stepOpt(su, seed));
    finals.push({w:st.w, s:st.s, g:st.g});
  }
  const pct = f => Math.round(100*finals.filter(f).length/finals.length);
  const out = {n:finals.length, outcomes:{}, metrics:{}, label:setupLabel(su)};
  E.OUTCOMES.forEach(v=>v.states.forEach(([sid])=>{ out.outcomes[v.id+"."+sid] = pct(F=>F.w[v.id]===sid); }));
  METRICS().forEach(m=>{ out.metrics[m.id] = pct(F=>!!m.f(F)); });
  return out;
}
function setupLabel(su){
  const d = defaultSetup();
  const lab = (key, v) => v==="vary" ? "left to vary" : E.stateInfo(key, v).label.toLowerCase();
  const parts = [`${E.SP[su.first].name} first`];
  WFIELDS.forEach(id=>{ if(su.w[id]!==d.w[id]) parts.push(`${E.defOf("w."+id).label}: ${lab("w."+id, su.w[id])}`); });
  E.SPECIES.forEach(sp=>SFIELDS.forEach(v=>{ if(su.s[sp.id][v]!==d.s[sp.id][v]) parts.push(`${sp.name}, ${E.SPVARS.find(x=>x.id===v).label.toLowerCase()}: ${lab("s.x."+v, su.s[sp.id][v])}`); }));
  if(Math.abs(su.noise - d.noise) > 1e-9) parts.push(`randomness ${su.noise.toFixed(1)}`);
  if(!su.glue) parts.push("without engine assumptions");
  return parts.join("; ");
}

/* ---------- Small renderers ---------- */
function pill(key, v){ const kk = key.split(".")[0]==="s" ? "s.x."+key.split(".")[2] : key; const info = E.stateInfo(kk, v); return `<span class="pill ${info.cls}">${esc(info.label)}</span>`; }
function keyLabel(key){ const p = key.split("."); if(p[0]==="w") return E.defOf(key).label; if(p[0]==="g") return E.GR[p[1]].label; return E.SPVARS.find(v=>v.id===p[2]).label; }
const covDot = key => { const c = coverOf(key); return `<span class="cov cov-${c}" title="Ethics literature: ${esc(COVER[c])}" aria-label="Ethics literature: ${esc(COVER[c])}"></span>`; };
function option(val, label, cur){ return `<option value="${esc(val)}"${String(cur)===String(val)?" selected":""}>${esc(label)}</option>`; }

function setupPanel(){
  const su = state.setup;
  const wf = WFIELDS.map(id=>{ const d = E.defOf("w."+id);
    return `<div class="field"><label for="x-w-${id}">${esc(d.label)}</label><select id="x-w-${id}" data-w="${id}">${option("vary","Let it vary",su.w[id])}${d.states.map(s=>option(s[0], s[1], su.w[id])).join("")}</select></div>`; }).join("");
  const sf = E.SPECIES.map(sp=>`<div class="stack-sm"><h4>${esc(sp.name)}</h4>${SFIELDS.map(v=>{ const d = E.SPVARS.find(x=>x.id===v);
    return `<div class="field"><label for="x-s-${sp.id}-${v}">${esc(d.label)}</label><select id="x-s-${sp.id}-${v}" data-sp="${sp.id}" data-v="${v}">${option("vary","Let it vary",su.s[sp.id][v])}${d.states.map(s=>option(s[0], s[1], su.s[sp.id][v])).join("")}</select></div>`; }).join("")}</div>`).join("");
  return `<aside class="panel x-setup" aria-label="World setup">
    <h3>Setup</h3>
    <div class="field"><label for="x-first">Species translated first</label><select id="x-first">${E.SPECIES.map(s=>option(s.id, s.name, su.first)).join("")}</select></div>
    <div class="field"><label for="x-playas">Group moves</label><select id="x-playas">${option("watch","Watch: every group follows its rules",su.playas)}${E.GROUPS.map(g=>option(g.id, "Choose for "+g.label.toLowerCase(), su.playas)).join("")}</select></div>
    <details><summary>Open questions at the start</summary><div class="inner">${wf}</div></details>
    <details><summary>Species starting points</summary><div class="inner">${sf}</div></details>
    <details><summary>Engine settings</summary><div class="inner">
      <div class="field"><label for="x-noise">Randomness: <span id="x-noise-val">${su.noise.toFixed(1)}</span></label><input type="range" id="x-noise" min="0" max="3" step="0.1" value="${su.noise}" aria-describedby="x-noise-hint"><span class="small muted" id="x-noise-hint">How much things move at random, on top of the rules. At 0 the rules alone decide. The default is 0.9.</span></div>
      <div class="field"><label for="x-seed">Seed (same seed, same world)</label><input type="number" id="x-seed" value="${su.seed}" inputmode="numeric"></div>
      <label class="check"><input type="checkbox" id="x-glue"${su.glue?" checked":""}> <span>Use engine assumptions</span></label>
    </div></details>
    <div class="row"><button class="btn btn-primary" data-action="x-start">Start world</button><button class="btn btn-ghost" data-action="x-batch">Run 200 worlds</button></div>
    <p class="small muted">Changes apply when you start a world or run 200 worlds.</p>
  </aside>`;
}

function statusPanel(){
  if(!state.started) return `<div class="panel"><div class="x-status"><h3>No world yet</h3></div><p class="muted small">Choose a setup and start a world.</p></div>`;
  const t = state.t, J = E.JUMPS[t];
  const su = state.runSetup;
  const changed = t>0 ? E.diff(hist[t-1], hist[t]).length : 0;
  const playing = su.playas!=="watch";
  const n = `${changed} ${changed===1 ? "thing" : "things"} changed`;
  const txt = t===0 ? "The starting world. Move one jump at a time, or play to 2050." : t===7 ? `The world in 2050. ${n} in the last jump. Select any cell to see why.` : `${n} in this jump. Select any cell to see why.`;
  return `<div class="panel"><div class="x-status"><h3>${J.year} · ${esc(J.label)}</h3><div class="row">
      <button class="btn btn-ghost btn-small" data-action="x-next"${t>=7 || playing ? " disabled" : ""}>Next jump</button>
      <button class="btn btn-ghost btn-small" data-action="x-play"${t>=7 ? " disabled" : ""}>Play to 2050</button></div></div>
    <p class="muted small">${esc(txt)}${playing && t<7 ? " Choose your move below, or play to 2050 to let the group follow its rule." : ""}</p></div>`;
}
function choicePanel(){
  const su = state.runSetup;
  if(!state.started || !su || su.playas==="watch" || state.t>=7) return "";
  const g = E.GR[su.playas], t = state.t + 1;
  const [rp] = E.rulePick(g.id, hist[state.t], t);
  return `<div class="panel x-choice"><h3>Your move as ${esc(g.label.toLowerCase())}: ${esc(E.JUMPS[t].label.toLowerCase())} (${E.JUMPS[t].year})</h3>
    <div class="x-opts">${g.strats.map(([sid,lab])=>`<button class="chip" data-action="x-move" data-id="${sid}">${esc(lab)}${sid===rp?` <span class="muted">· their rule</span>`:""}</button>`).join("")}</div></div>`;
}

function cellHTML(key, t){
  const st = hist[t];
  if(!st) return `<span class="cell empty" aria-hidden="true"></span>`;
  const p = key.split(".");
  const sel = state.sel && state.sel.key===key && state.sel.t===t ? " sel" : "";
  if(p[0]==="g"){
    if(t===0) return `<span class="cell empty">—</span>`;
    const ex = st.expl["g."+p[1]];
    const lab = E.stratLabel(p[1], st.g[p[1]]);
    return `<button class="cell ${ex && ex.player?"you":"s"}${sel}" data-action="x-cell" data-key="${key}" data-t="${t}" aria-label="${esc(E.GR[p[1]].label)}, ${esc(E.JUMPS[t].label)}: ${esc(lab)}">${esc(lab)}${ex && ex.player?" (you)":""}</button>`;
  }
  if(p[0]==="s" && !E.isActive(state.runSetup.first, p[1], t)) return `<button class="cell idle${sel}" data-action="x-cell" data-key="${key}" data-t="${t}">Not yet translated</button>`;
  const v = E.get(st, key);
  const info = E.stateInfo(p[0]==="s" ? "s.x."+p[2] : key, v);
  const changed = t>0 && E.get(hist[t-1], key)!==v ? " changed" : "";
  return `<button class="cell ${info.cls}${changed}${sel}" data-action="x-cell" data-key="${key}" data-t="${t}" aria-label="${esc(keyLabel(key))}, ${esc(E.JUMPS[t].label)}: ${esc(info.label)}">${esc(info.label)}</button>`;
}
function gridHTML(){
  if(!state.started) return "";
  const head = `<thead><tr><th class="rowh">Part of the world</th>${E.JUMPS.map(j=>`<th>${esc(j.label)}<span class="yr">${j.year}</span></th>`).join("")}</tr></thead>`;
  const rows = [];
  const sec = title => rows.push(`<tr class="sec"><th>${esc(title)}</th><td colspan="${E.JUMPS.length}"></td></tr>`);
  const row = (label, key) => rows.push(`<tr><th class="rowh">${covDot(key)}${esc(label)}</th>${E.JUMPS.map((_,t)=>`<td>${cellHTML(key,t)}</td>`).join("")}</tr>`);
  sec("What each group did"); E.GROUPS.forEach(g=>row(g.label, "g."+g.id));
  sec("Outcomes"); E.OUTCOMES.forEach(v=>row(v.label, "w."+v.id));
  sec("Open questions"); E.WORLD.forEach(v=>row(v.label, "w."+v.id));
  const first = state.runSetup.first;
  const order = [first].concat(E.SPECIES.map(s=>s.id).filter(id=>id!==first));
  order.filter(sp=>state.show[sp]).forEach(sp=>{ sec(E.SP[sp].name + (sp===first ? " (translated first)" : "")); E.SPVARS.forEach(v=>row(v.label, "s."+sp+"."+v.id)); });
  return `<div class="stack-sm">
    <div class="filters" aria-label="Show species">${E.SPECIES.map(s=>`<button class="chip" data-action="x-toggle" data-id="${s.id}" aria-pressed="${state.show[s.id]}">${esc(s.name)}</button>`).join("")}</div>
    <div class="gridwrap"><table class="tg" aria-label="World state over time">${head}<tbody>${rows.join("")}</tbody></table></div>
    <div class="legend"><span><i class="sw" style="background:var(--sg-bg)"></i>Better for animals</span><span><i class="sw" style="background:var(--su-bg)"></i>Contested or mixed</span><span><i class="sw" style="background:var(--sb-bg)"></i>Worse for animals</span><span><i class="sw" style="background:var(--sn-bg)"></i>Neutral</span><span>A dark left edge marks a change</span></div>
    <div class="legend"><span>Ethics literature behind each row:</span>${COVER_ORDER.map(c=>`<span><span class="cov cov-${c}"></span>${esc(COVER[c])}</span>`).join("")}</div>
  </div>`;
}

function contribLI(c){
  const lab = SRC_LABEL[c.src];
  const r = Math.round(c.r*10)/10;
  return `<li>${lab?`<span class="src ${c.src}">${esc(lab)}${c.ref?" · "+esc(c.ref):""}</span>`:""}${esc(c.text)}${c.src==="choice" && c.r===0 ? "" : ` (${r>0?"+":""}${r})`}</li>`;
}
function researchCard(key){
  const r = RESEARCH[rkey(key)]; if(!r) return "";
  const [c, note, src, missing] = r;
  return `<div class="x-research cov-card-${c}"><span class="x-cov"><span class="cov cov-${c}"></span>${esc(COVER[c])}</span>
    <p>${esc(note)}</p>${src.length?`<p class="small">${src.map(s=>`<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a>`).join(" · ")}</p>`:""}
    <p class="small muted"><strong>Missing:</strong> ${esc(missing)}</p></div>`;
}
function whyHTML(){
  if(!state.started) return `<p class="muted">Start a world, then select any cell.</p>`;
  if(!state.sel) return `<p class="muted">Select any cell in the grid to see what moved it, and what the ethics literature says about that part of the world.</p>`;
  const {key, t} = state.sel;
  const st = hist[t]; if(!st) return "";
  const p = key.split(".");
  const label = p[0]==="g" ? E.GR[p[1]].label : (p[0]==="s" ? E.SP[p[1]].name+": "+keyLabel(key).toLowerCase() : keyLabel(key));
  let h = "";
  if(t===0) h = `<p><strong>${esc(label)}</strong> at the start: set by the setup, or at random where the setup lets it vary.</p>`;
  else {
    const ex = st.expl[key];
    if(!ex) h = `<p class="muted">No explanation recorded.</p>`;
    else if(ex.kind==="idle") h = `<p>${esc(E.SP[p[1]].name)} are not translated yet at this point.</p>`;
    else if(ex.kind==="note") h = `<p><strong>${esc(label)}</strong>: ${esc(ex.text)}</p>`;
    else if(ex.kind==="group"){
      const lab = E.stratLabel(ex.group, ex.pick);
      h = ex.player ? `<p><strong>${esc(label)}</strong>: you chose “${esc(lab)}”. The group's rule would have picked “${esc(E.stratLabel(ex.group, ex.rule))}”.</p>`
        : `<p><strong>${esc(label)}</strong> chose “${esc(lab)}”. What pushed toward it:</p><ul>${ex.contrib.map(contribLI).join("")}</ul>`;
    } else {
      const kk = p[0]==="s" ? "s.x."+p[2] : key;
      const toL = E.stateInfo(kk, ex.to).label, fromL = E.stateInfo(kk, ex.from).label;
      h = `<p><strong>${esc(label)}</strong> ${ex.from===ex.to ? `stayed at “${esc(toL)}”` : `moved from “${esc(fromL)}” to “${esc(toL)}”`} at ${esc(E.JUMPS[t].label.toLowerCase())}. What pushed toward it:</p><ul>${ex.contrib.filter(c=>!(c.text==="Randomness" && c.r<0.05)).map(contribLI).join("")}</ul>`;
      if(ex.runner){
        const rc = ex.runnerContrib.filter(c=>c.src!=="other");
        if(rc.length) h += `<p class="muted" style="margin-top:10px">The strongest alternative, “${esc(E.stateInfo(kk, ex.runner).label)}”, lost by ${Math.round(ex.margin*10)/10}:</p><ul>${rc.map(contribLI).join("")}</ul>`;
      }
    }
  }
  return h + `<h4 class="x-h4">What the ethics literature says about ${esc(keyLabel(key).toLowerCase())}</h4>${researchCard(key)}`;
}

function researchMap(){
  const groups = {good:[], partial:[], weak:[], none:[]};
  const add = (key, label) => groups[coverOf(key)].push([key, label]);
  E.GROUPS.forEach(g=>add("g."+g.id, g.label));
  E.OUTCOMES.forEach(v=>add("w."+v.id, v.label));
  E.WORLD.forEach(v=>add("w."+v.id, v.label));
  E.SPVARS.forEach(v=>add("s.x."+v.id, v.label + " (each species)"));
  return `<div class="panel x-map"><h3>Where the ethics literature stands</h3>
    <p class="small muted">How well the literature review covers each part of the model. Select one to read what the literature says about it${state.started ? "" : " (start a world first)"}.</p>
    <div class="x-cols">${COVER_ORDER.map(c=>`<div class="stack-sm"><span class="x-cov"><span class="cov cov-${c}"></span>${esc(COVER[c])} · ${groups[c].length}</span><div class="x-opts">${groups[c].map(([k,l])=>`<button class="chip" data-action="x-research" data-key="${k}">${esc(l)}</button>`).join("")}</div></div>`).join("")}</div></div>`;
}

function batchPanel(){
  const b = state.batch, pb = state.prevBatch;
  const bar = (id, p, prev) => `<div class="x-bar"><span class="x-track"><span class="x-fill" style="width:${Math.max(p,0.5)}%"></span></span><span class="x-val">${p}%</span>${prev!=null?`<span class="x-track x-prev" title="Previous run: ${prev}%"><span class="x-fill" style="width:${Math.max(prev,0.5)}%"></span></span><span></span>`:""}</div>`;
  if(!b) return `<div class="panel" id="x-batch"><h3>Across many worlds</h3><p class="muted small">Run 200 worlds with the current setup to see how often each outcome appears in 2050. Change one setting and run again to compare: the thin bar under each row is the previous run.</p></div>`;
  const outcomeRows = E.OUTCOMES.map(v=>`<div class="stack-sm"><h4>${esc(v.label)}</h4>${v.states.map(([sid,lab])=>`<div class="x-row"><span class="x-lab">${esc(lab)}</span>${bar(v.id+"."+sid, b.outcomes[v.id+"."+sid], pb ? pb.outcomes[v.id+"."+sid] : null)}</div>`).join("")}</div>`).join("");
  const metricRows = METRICS().map(m=>`<div class="x-row"><span class="x-lab">${esc(m.label)}</span>${bar(m.id, b.metrics[m.id], pb ? pb.metrics[m.id] : null)}</div>`).join("");
  return `<div class="panel" id="x-batch"><h3>Across many worlds</h3>
    <p class="small muted">${b.n} worlds in 2050 with: ${esc(b.label)}.${pb ? ` Thin bars: the previous run (${esc(pb.label)}).` : " Change one setting and run again to compare."}</p>
    <div class="x-batch-grid">${outcomeRows}<div class="stack-sm"><h4>For animals and people</h4>${metricRows}</div></div></div>`;
}

function view(){
  return `<header class="top"><span class="eyebrow">Today's ethics discussions · A simulation</span></header>
  <div class="narrow stack x-intro">
    <h2 class="g-title g-title-long">What the literature on the ethics of AI for interspecies communications tells us about the future?</h2>
    <p class="lead">This simulation helps you explore how likely different scenarios are, based on what today's ethics discussions say. We hope it becomes a point of departure for other researchers to contribute to this field, and to answer some of the questions it leaves open.</p>
    <p class="muted">Set up a world and step through it from 2030 to 2050. Select any cell to see what moved it and what the ethics literature says about it, or run 200 simulated worlds to see how often each outcome happens. Nothing you do here is saved.</p>
  </div>
  <div class="x-layout">
    ${setupPanel()}
    <section class="x-main">
      ${statusPanel()}
      ${choicePanel()}
      ${gridHTML()}
      <div class="why stack-sm" id="x-why"><h3>Why it is this way</h3>${whyHTML()}</div>
      ${researchMap()}
      ${batchPanel()}
      <div class="panel"><h3>Not modeled yet</h3><ul class="newlist">
        <li>Human welfare is not part of the world model: no rule moves it, and nothing in the world reacts to it. The future's end report gives a rough reading of it, worked out from other parts of the world.</li>
        <li>Chickens appear only through the spillover claim. Other species outside the four we have listed in the prototype, such as fish, are not modeled.</li>
        <li>How strong each link is comes from judgment, not from the literature. An expert panel could rate them.</li>
        <li>Ratings are fixed in this version.</li>
      </ul></div>
    </section>
  </div>`;
}

/* ---------- Render and actions ---------- */
const app = document.getElementById("present-app");
function render(){ app.innerHTML = view(); }
function readSetup(){
  const q = id => app.querySelector("#"+id);
  const su = state.setup;
  if(q("x-first")) su.first = q("x-first").value;
  if(q("x-playas")) su.playas = q("x-playas").value;
  if(q("x-noise")) su.noise = +q("x-noise").value;
  if(q("x-seed")){ const n = parseInt(q("x-seed").value, 10); su.seed = isFinite(n) ? Math.abs(n) % 1000000 : 2030; }
  if(q("x-glue")) su.glue = q("x-glue").checked;
  app.querySelectorAll("[data-w]").forEach(s=>{ su.w[s.dataset.w] = s.value; });
  app.querySelectorAll("[data-sp]").forEach(s=>{ su.s[s.dataset.sp][s.dataset.v] = s.value; });
}
app.addEventListener("input", e=>{ if(e.target.id==="x-noise"){ const v = app.querySelector("#x-noise-val"); if(v) v.textContent = (+e.target.value).toFixed(1); } });
app.addEventListener("change", ()=>readSetup());
app.addEventListener("click", e=>{
  const el = e.target.closest("[data-action]"); if(!el) return;
  const a = el.dataset.action;
  const keepScroll = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
  if(a==="x-start"){
    readSetup();
    state.runSetup = JSON.parse(JSON.stringify(state.setup));
    state.started = true; state.t = 0; state.moves = {};
    state.sel = {key:"w.accuracy", t:0};
    rebuild(); keepScroll();
  }
  else if(a==="x-next"){ if(state.t<7){ state.t++; rebuild(); if(state.sel) state.sel.t = state.t; keepScroll(); } }
  else if(a==="x-play"){ while(state.t<7){ state.t++; } rebuild(); if(state.sel) state.sel.t = state.t; keepScroll(); }
  else if(a==="x-move"){
    const su = state.runSetup; if(!su || su.playas==="watch" || state.t>=7) return;
    state.t++; state.moves[state.t] = {g:su.playas, m:el.dataset.id};
    rebuild(); state.sel = {key:"g."+su.playas, t:state.t}; keepScroll();
  }
  else if(a==="x-cell"){ state.sel = {key:el.dataset.key, t:+el.dataset.t}; keepScroll(); const w = app.querySelector("#x-why"); if(w) w.scrollIntoView({behavior:"smooth", block:"nearest"}); }
  else if(a==="x-toggle"){ state.show[el.dataset.id] = !state.show[el.dataset.id]; keepScroll(); }
  else if(a==="x-research"){
    if(!state.started) return;
    let key = el.dataset.key;
    if(key.startsWith("s.x.")) key = "s." + state.runSetup.first + "." + key.slice(4);
    state.sel = {key, t:state.t}; keepScroll();
    const w = app.querySelector("#x-why"); if(w) w.scrollIntoView({behavior:"smooth", block:"start"});
  }
  else if(a==="x-batch"){
    readSetup();
    state.prevBatch = state.batch; state.batch = runBatch(); keepScroll();
    const b = app.querySelector("#x-batch"); if(b) b.scrollIntoView({behavior:"smooth", block:"start"});
  }
});

function start(data){
  state = fresh();
  if(data && data.state && data.state.setup){ state = Object.assign(fresh(), data.state); }
  else { state.runSetup = JSON.parse(JSON.stringify(state.setup)); state.started = true; state.sel = {key:"w.accuracy", t:0}; }
  try{ rebuild(); }catch(err){ state = fresh(); hist = []; }
  render();
}
window.ISW_PRESENT = {start, snapshot:()=>({state}), RESEARCH, COVER, COVER_ORDER, keyLabel, get state(){ return state; }, get hist(){ return hist; }, runBatch};
})();
