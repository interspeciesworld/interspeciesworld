/* An Interspecies World: site shell. Routing, consent, saving, statistics, methodology tables, boot. */
(function(){
"use strict";
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LS = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

/* ---------- Consent: asked once, before the first game ---------- */
let consentMem = LS.get("isw-consent");
if(consentMem!=="yes" && consentMem!=="no") consentMem = null;
let pendingStart = null, lastFocus = null;
const modal = document.getElementById("consent");
function openModal(cb){
  pendingStart = cb; lastFocus = document.activeElement;
  modal.hidden = false; document.body.classList.add("s-locked");
  const ok = modal.querySelector('[data-consent="yes"]'); if(ok) ok.focus();
}
function closeModal(){
  modal.hidden = true; document.body.classList.remove("s-locked");
  if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
}
const consent = {
  get(){ return consentMem; },
  set(v){ consentMem = v; LS.set("isw-consent", v); renderConsentStatus(); },
  ask(cb){ if(consentMem){ cb(); return; } openModal(cb); }
};
modal.addEventListener("click", e=>{
  const b = e.target.closest("[data-consent]");
  if(b){ consent.set(b.dataset.consent); closeModal(); const cb = pendingStart; pendingStart = null; if(cb) cb(); return; }
  if(e.target.closest("[data-consent-link]")){ pendingStart = null; closeModal(); }
});
modal.addEventListener("keydown", e=>{
  if(e.key!=="Tab") return;
  const f = Array.from(modal.querySelectorAll("button, a[href]"));
  if(!f.length) return;
  const first = f[0], last = f[f.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
});
function renderConsentStatus(){
  const el = document.getElementById("consent-status");
  if(el) el.textContent = consentMem==="yes" ? "Your games are saved anonymously" : consentMem==="no" ? "Your games are not saved" : "Not decided yet: we will ask when you start a game";
  document.querySelectorAll("[data-consent-set]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.consentSet===consentMem)));
}
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-consent-set]"); if(b) consent.set(b.dataset.consentSet);
});

/* ---------- Saving play data ----------
   On claude.ai: the artifact's db capability. On a self-hosted copy (GitHub Pages): Firestore,
   when the Firebase SDK and window.FIREBASE_CONFIG (firebase-config.js) are present. */
const use = name => { try{ return (window.claude && window.claude.use) ? window.claude.use(name).catch(()=>null) : Promise.resolve(null); }catch(e){ return Promise.resolve(null); } };
function firestoreDb(){
  try{
    const cfg = window.FIREBASE_CONFIG, fb = window.firebase;
    if(!fb || !fb.firestore || !cfg || !cfg.projectId || /YOUR_/.test(cfg.projectId)) return null;
    const app = (fb.apps && fb.apps.length) ? fb.app() : fb.initializeApp(cfg);
    const fs = fb.firestore(app);
    // Saved games are deleted automatically 12 months after the day they were played (Firestore TTL policy on expireAt).
    const expiry = () => { const d = new Date(); d.setUTCHours(0,0,0,0); d.setUTCDate(d.getUTCDate() + 365); return fb.firestore.Timestamp.fromDate(d); };
    return {collection: name => ({
      doc: id => { const ref = fs.collection(name).doc(id); return {
        set: body => ref.set(Object.assign({}, body, {expireAt: expiry()})),
        update: patch => ref.set(patch, {merge:true})   // merge, so nested choices and scenes add up instead of replacing each other
      }; },
      limit: n => ({get: () => fs.collection(name).limit(n).get()})
    })};
  }catch(e){ return null; }
}
const fsdb = firestoreDb();
const dbP = fsdb ? Promise.resolve(fsdb) : use("db");
let writable = null; // null: not told yet; false: this visitor cannot save
(async()=>{
  const db = await dbP;
  if(!db){ writable = false; return; }
  if(fsdb) return;   // Firestore: every visitor who says OK can save; the security rules decide what is accepted
  try{ const u = await use("user"); if(u && u.can){ const c = await u.can("data.write"); if(c===false) writable = false; } }catch(e){}
})();
const chains = {};
const data = {
  sharing(){ return consentMem==="yes" && writable!==false; },
  newId(){ const a = new Uint8Array(10); crypto.getRandomValues(a); return "p" + Array.from(a, b=>b.toString(16).padStart(2,"0")).join(""); },
  day(){ return new Date().toISOString().slice(0,10); },
  track(id, fn){
    if(!data.sharing() || !id) return;
    chains[id] = (chains[id] || Promise.resolve()).then(async()=>{
      const db = await dbP; if(!db) return;
      await fn(db.collection("plays").doc(id));
      if(plays) refreshLater();
    }).catch(err=>{ if(err && (err.code==="invalid_argument" || err.code==="permission-denied")) writable = false; });
  }
};

/* ---------- Statistics ---------- */
let plays = null, playsP = null, refreshT = 0;
function loadPlays(){
  if(playsP) return playsP;
  playsP = (async()=>{
    const db = await dbP;
    if(!db) return [];
    const timeout = new Promise(res=>setTimeout(()=>res(null), 10000));
    try{
      const snap = await Promise.race([db.collection("plays").limit(1000).get(), timeout]);
      if(!snap) return plays || [];
      return snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
    }catch(e){ return plays || []; }
  })().then(r=>{ plays = r; window.dispatchEvent(new Event("isw-plays")); if(currentRoute()==="privacy") renderStats(); return r; });
  return playsP;
}
function refreshLater(){ clearTimeout(refreshT); refreshT = setTimeout(()=>{ playsP = null; loadPlays(); }, 1500); }

const SPS = ["cet","bird","pet","pig"];
const FUT_METRICS = [
  {id:"welfare", label:"Animal welfare got worse for at least one species", f:F=>SPS.some(x=>F.s[x] && F.s[x].welfare==="worse")},
  {id:"access", label:"Animals lost some or all access to translators", f:F=>SPS.some(x=>F.s[x] && F.s[x].access!=="kept")},
  {id:"refuse", label:"Animals refused to talk to humans, or resisted them", f:F=>F.g && F.g.ani ? ["refuse","resist"].includes(F.g.ani) : null},
  {id:"confront", label:"Humans and animals ended in open conflict", f:F=>F.w.conflict==="confrontation"},
  {id:"polar", label:"People ended polarized over animals", f:F=>F.w.conflict==="polarization"},
  {id:"restrict", label:"The technology was restricted or suppressed", f:F=>F.w.response!=="adoption"},
  {id:"standing", good:true, label:"At least one species gained guardians or a voice in court", f:F=>SPS.some(x=>F.s[x] && (F.s[x].status==="guardian" || F.s[x].status==="self"))},
  {id:"farming", good:true, label:"Animal farming started to shrink", f:F=>F.w.food==="shrinking"},
  {id:"children", good:true, label:"Children grew up including animals in their moral circle", f:F=>F.w.children==="include"}
];
const COMPARE_IDS = ["welfare","access","refuse","confront","restrict","standing","farming"];
function futureFinals(excludeId){
  return (plays||[]).filter(p=>(p.game==="future" || (!p.game && p.v==="v2")) && p.completed && p.final && p.final.w && p.final.s && p.id!==excludeId).map(p=>p.final);
}
const DEFAULT_NOISE = 0.9;
const baseCache = {};
const noiseOf = n => (n==null || isNaN(+n)) ? DEFAULT_NOISE : Math.round(+n*10)/10;
function baseline(noise){
  const nz = noiseOf(noise), key = nz.toFixed(1);
  if(baseCache[key]) return baseCache[key];
  const E = window.Engine; const out = [];
  if(!E) return out;
  for(let seed=1; seed<=400; seed++){
    let st = E.initState(SPS[seed%4], seed);
    for(let t=1;t<=7;t++) st = E.step(st, t, {seed, noise:nz});
    out.push({w:st.w, s:st.s, g:st.g});
  }
  baseCache[key] = out;
  return out;
}
function share(list, f){
  let yes = 0, n = 0;
  list.forEach(F=>{ const v = f(F); if(v===null || v===undefined) return; n++; if(v) yes++; });
  return {yes, n, pct: n ? Math.round(100*yes/n) : null};
}
function barRow(name, cls, p){
  const w = p==null ? 0 : Math.max(p, 0.5);
  return `<div class="s-barrow"><span class="s-barname">${esc(name)}</span><span class="s-track" aria-hidden="true"><span class="s-fill ${cls}" style="width:${w}%"></span></span><span class="s-barval">${p==null?"–":p+"%"}</span></div>`;
}
function renderStats(){
  const fut = document.getElementById("stats-future");
  if(!fut) return;
  if(!plays){ loadPlays(); fut.innerHTML = `<p class="s-muted s-small">Loading saved games…</p>`; return; }
  const finals = futureFinals(), base = baseline();
  const nP = finals.length;
  fut.innerHTML = `
    <div class="s-legend"><span><i class="s-sw s-fill-p"></i>Players' worlds${nP ? ` (${nP} saved ${nP===1?"game":"games"})` : ""}</span><span><i class="s-sw s-fill-b"></i>No player: the world model on its own (${base.length} simulated worlds, at the default randomness of ${DEFAULT_NOISE})</span></div>
    ${nP ? "" : `<p class="s-note">No games are saved yet. Until people play, only the simulated worlds are shown: the world model running with no human choices at all, which is a useful baseline but says nothing about people.</p>`}
    <div class="s-metrics">${FUT_METRICS.map(m=>{
      const p = share(finals, m.f), b = share(base, m.f);
      return `<div class="s-metric"><div class="s-metric-label">${esc(m.label)}</div>${nP ? barRow("Players", "s-fill-p", p.pct) : ""}${barRow("No player", "s-fill-b", b.pct)}</div>`;
    }).join("")}</div>
    <p class="s-small s-muted">Each bar is the share of worlds where this was true in 2050. Animals refusing or resisting is counted only for games saved after it began to be recorded.</p>`;
}
function futureCompare(F, excludeId, noise){
  if(!plays){ loadPlays(); return `<div class="s-compare narrow"><h3>How your world compares</h3><p class="s-muted s-small">Loading other players' worlds…</p></div>`; }
  const nz = noiseOf(noise), others = futureFinals(excludeId), base = baseline(nz);
  const yn = (v, good) => v===null || v===undefined ? "–" : v ? `<span class="pill ${good?"g":"b"}">Yes</span>` : `<span class="pill n">No</span>`;
  const rows = FUT_METRICS.filter(m=>COMPARE_IDS.includes(m.id)).map(m=>{
    const o = share(others, m.f), b = share(base, m.f);
    return `<tr><td>${esc(m.label)}</td><td>${yn(m.f(F), m.good)}</td><td class="num">${o.pct==null?"–":o.pct+"%"}</td><td class="num">${b.pct==null?"–":b.pct+"%"}</td></tr>`;
  }).join("");
  return `<div class="s-compare stack-sm">
    <h3>How your world compares</h3>
    <p class="s-small s-muted">${others.length ? `Next to ${others.length} other saved ${others.length===1?"world":"worlds"} (at whatever randomness each player chose)` : "No other games are saved yet"}, and to ${base.length} worlds the model runs on its own with no player, at your randomness of ${nz.toFixed(1)}.</p>
    <div class="s-tablewrap"><table class="s-table"><thead><tr><th scope="col">In 2050</th><th scope="col">Your world</th><th scope="col">Other players</th><th scope="col">No player</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="s-small"><a href="#privacy">What we collect, and all results so far</a></p>
  </div>`;
}

/* ---------- Methodology tables, built from the games' own data ---------- */
const SRC_LABEL = {rating:"Phase 2 rating", lit:"Literature review", pig:"Pig world-building", glue:"Engine assumption", design:"Design rule"};
function renderMethod(){
  const E = window.Engine, R = window.ISW_PRESENT;
  const rulesEl = document.getElementById("m-rules");
  if(rulesEl && E && !rulesEl.dataset.done){
    const counts = {}; E.LINKS.forEach(l=>{ counts[l.src] = (counts[l.src]||0)+1; });
    const sumEl = document.getElementById("m-rule-counts");
    if(sumEl) sumEl.textContent = `${E.LINKS.length} rules: ${counts.rating||0} Phase 2 ratings, ${counts.lit||0} from the literature review, ${counts.pig||0} from the pig world-building, ${counts.glue||0} engine assumptions and ${counts.design||0} design rules.`;
    rulesEl.innerHTML = `<table class="s-table"><thead><tr><th scope="col">Rule</th><th scope="col">Weight</th><th scope="col">Source</th></tr></thead><tbody>${
      E.LINKS.map(l=>`<tr><td>${esc(l.text)}${l.per==="species"?` <span class="s-muted">(each species)</span>`:""}</td><td class="num">${l.r>0?"+":""}${l.r}</td><td><span class="s-src s-src-${l.src}">${esc(SRC_LABEL[l.src]||l.src)}${l.ref?` · ${esc(l.ref)}`:""}</span></td></tr>`).join("")
    }</tbody></table>`;
    rulesEl.dataset.done = "1";
  }
  const rEl = document.getElementById("m-research");
  if(rEl && R && !rEl.dataset.done){
    const rows = Object.entries(R.RESEARCH).sort((a,b)=>R.COVER_ORDER.indexOf(a[1][0]) - R.COVER_ORDER.indexOf(b[1][0]));
    const name = k => { const p = k.split("."); return p[0]==="s" ? R.keyLabel("s.cet."+p[1]) + " (each species)" : R.keyLabel(k); };
    rEl.innerHTML = `<table class="s-table"><thead><tr><th scope="col">Part of the model</th><th scope="col">Ethics literature</th><th scope="col">Sources</th><th scope="col">Missing</th></tr></thead><tbody>${
      rows.map(([k,[c, note, src, missing]])=>`<tr><td>${esc(name(k))}</td><td>${esc(R.COVER[c])}</td><td>${src.length ? src.map(s=>`<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a>`).join("; ") : `<span class="s-muted">None</span>`}</td><td>${esc(missing)}</td></tr>`).join("")
    }</tbody></table>`;
    rEl.dataset.done = "1";
  }
}

/* ---------- Routing ---------- */
const ROUTES = ["about","present","future","methodology","literature","privacy"];
let pendingAnchor = null;
function currentRoute(){ const r = (location.hash||"").slice(1); return ROUTES.includes(r) ? r : "about"; }
function show(scroll){
  const r = currentRoute();
  document.querySelectorAll("[data-route]").forEach(s=>{ s.hidden = s.dataset.route!==r; });
  document.querySelectorAll("[data-nav]").forEach(a=>{ if(a.dataset.nav===r) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  if(r==="about") startHeroWave(); else stopHeroWave();
  if(r==="privacy"){ renderStats(); renderConsentStatus(); }
  if(r==="methodology") renderMethod();
  if(pendingAnchor){ const el = document.getElementById(pendingAnchor); pendingAnchor = null; if(el){ el.scrollIntoView({block:"start"}); return; } }
  if(scroll) window.scrollTo({top:0});
}
window.addEventListener("hashchange", ()=>show(true));
function go(route, anchor){
  pendingAnchor = anchor || null;
  if(currentRoute()===route && location.hash==="#"+route) show(true);
  else location.hash = route;
}

/* ---------- Copy the contact address ---------- */
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-copy-email]"); if(!b) return;
  const addr = ["interspeciestranslation","gmail.com"].join("@");
  const done = ok => { const s = b.querySelector(".s-copy-label"); if(s){ s.textContent = ok ? "Copied" : "Select the address to copy it"; setTimeout(()=>{ s.textContent = "Copy address"; }, 2200); } };
  try{
    navigator.clipboard.writeText(addr).then(()=>done(true), ()=>{ selectText(b); done(false); });
  }catch(err){ selectText(b); done(false); }
});
function selectText(btn){
  const t = btn.parentElement && btn.parentElement.querySelector(".s-addr"); if(!t) return;
  const r = document.createRange(); r.selectNodeContents(t); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
}

/* ---------- Hero signal wave (About) ---------- */
let waveStop = null;
function startHeroWave(){
  if(waveStop) return;
  const canvas = document.getElementById("hero-wave"); if(!canvas) return;
  const ctx = canvas.getContext("2d"); if(!ctx) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 0, raf = 0, alive = true;
  function size(){ const d = window.devicePixelRatio||1; canvas.width = Math.max(1, canvas.clientWidth*d); canvas.height = Math.max(1, canvas.clientHeight*d); ctx.setTransform(d,0,0,d,0,0); }
  function draw(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    const cs = getComputedStyle(document.documentElement);
    const pink = cs.getPropertyValue("--pink").trim(), green = cs.getPropertyValue("--green").trim();
    const animal = p => Math.sin(p*22 + t)*0.55 + Math.sin(p*57 - t*1.6)*0.3 + Math.sin(p*9 + t*0.4)*0.15;
    const human = p => Math.sin(p*13 - t*0.8 + 1.3)*0.7 + Math.sin(p*29 + t*1.1)*0.3;
    const amp = h*0.36;
    const line = (fn, color) => { ctx.beginPath(); for(let x=0; x<=w; x+=2){ const p = x/w, env = Math.sin(Math.PI*Math.min(1, p*1.05+0.02)); const y = h/2 + fn(p)*amp*env; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); } ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke(); };
    const mix = p => { const s = Math.max(0, Math.min(1, (p-0.35)/0.5)); return s*s*(3-2*s); };
    line(p=>animal(p), pink);
    line(p=>human(p)*(1-mix(p)) + animal(p)*mix(p)*0.92, green);
  }
  function loop(){ if(!alive) return; t += 0.012; draw(); raf = requestAnimationFrame(loop); }
  size();
  const onR = () => { size(); draw(); };
  window.addEventListener("resize", onR);
  if(reduce) draw(); else loop();
  waveStop = () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onR); waveStop = null; };
}
function stopHeroWave(){ if(waveStop) waveStop(); }

/* ---------- Public surface for the two games ---------- */
window.Site = {consent, data, go, stats:{futureCompare, loadPlays, baseline, FUT_METRICS}};

/* ---------- Boot (keeps games in progress across live updates) ---------- */
function boot(saved){
  saved = saved || {};
  try{ window.ISW_PRESENT.start(saved.present || {}); }catch(e){ window.ISW_PRESENT.start({}); }
  try{ window.ISW_FUTURE.start(saved.future || {}); }catch(e){ window.ISW_FUTURE.start({}); }
  renderConsentStatus();
  show(false);
}
const hot = window.claude && window.claude.hot;
if(hot && hot.snapshot) hot.snapshot(() => ({present: window.ISW_PRESENT.snapshot(), future: window.ISW_FUTURE.snapshot()}));
if(hot && hot.ready) hot.ready(boot);
else boot((hot && hot.data) || {});
})();
