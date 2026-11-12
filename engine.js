/* An Interspecies World v2: world engine.
   Adapted from the interspecies world engine prototype (Phase 2 draft ratings, 8 November 2026),
   plus the pig scenario from the condition 2 world-building, plus the v2 design rules.
   Every link names its source so the game can show why the world moved. */
(function(global){
"use strict";

const JUMPS = [
  {label:"Start",           short:"2030",   year:2030},
  {label:"The day after",   short:"Day",    year:2030},
  {label:"The week after",  short:"Week",   year:2030},
  {label:"The month after", short:"Month",  year:2030},
  {label:"1 year after",    short:"1 yr",   year:2031},
  {label:"5 years after",   short:"5 yrs",  year:2035},
  {label:"10 years after",  short:"10 yrs", year:2040},
  {label:"20 years after",  short:"20 yrs", year:2050}
];
const ALL_FROM = 4;  // the other species are translated from 1 year after (2031)
const C2_FROM  = 4;  // v2 design rule: condition 2 reaches every translated species between 2031 and 2035

const SPECIES = [
  {id:"cet",  name:"Cetaceans"},
  {id:"bird", name:"Birds"},
  {id:"pet",  name:"Cats and dogs"},
  {id:"pig",  name:"Pigs"}
];
const SP = Object.fromEntries(SPECIES.map(s=>[s.id,s]));

/* States: [id, label, class]. Classes: g better for animals, u contested or mixed, b worse for animals, n neutral. */
const WORLD = [
  {id:"accuracy", label:"Accuracy debate", states:[["genuine","Most say genuine","g"],["useful","Most say useful model","u"],["projection","Most say projection","b"]], start:"useful"},
  {id:"carryover", label:"Trust in reports of feelings", states:[["full","Trusted","g"],["partial","Partly trusted","u"],["refused","Not trusted","b"]], random:true},
  {id:"fakes", label:"Fake translations", states:[["rare","Rare","g"],["caught","Common, often caught","u"],["widespread","Widespread","b"]], start:"rare"},
  {id:"openness", label:"Open versus closed models", states:[["open","Open models dominate","u"],["both","Both persist","u"],["closed","Closed models dominate","u"]], start:"both"},
  {id:"surveillance", label:"Surveillance of animals", states:[["research","Research only","g"],["commercial","Commercial listening","u"],["mass","Mass monitoring","b"]], start:"commercial"},  // R11: AI monitoring of farmed animals already exists
  {id:"records", label:"Animals' records", states:[["animals","Kept by the animals","g"],["researchers","Held by researchers","u"],["open","Open archive","u"],["seized","Seized by the state","b"]], start:"researchers"},
  {id:"revers", label:"If the translators go off", states:[["reversible","The words fade","n"],["lasting","Words last in study groups","u"],["spreads","Words spread animal to animal","u"]], start:"reversible"},
  {id:"consent", label:"Study animals", states:[["well","Handled well","g"],["contested","Contested","u"],["scandal","Scandal","b"]], start:"well"},
  {id:"military", label:"Military use", states:[["none","None known","g"],["suspected","Suspected","u"],["confirmed","Confirmed","b"]], start:"none"},
  {id:"land", label:"Land claims", states:[["none","Not raised","n"],["ignored","Raised, ignored","b"],["contested","Contested","u"],["recognized","Some places recognized","g"]], start:"none"},
  {id:"children", label:"Children", states:[["scared","Mostly frightened","b"],["divided","Divided","u"],["include","Include animals","g"]], start:"divided"},
  {id:"generations", label:"Between generations", states:[["agree","Little conflict","n"],["tension","Tension","u"],["split","Open split","u"]], start:"agree"},
  {id:"chicken", label:"Chicken spillover", states:[["none","Not raised","n"],["claimed","Claimed, untested","u"],["partly","Partly tested","u"],["tested","Tested","g"]], start:"none"},
  {id:"voiceless", label:"Voiceless animals", states:[["left","Left behind","b"],["spill","Some spillover","u"],["included","Included","g"]], start:"left"},  // R14
  {id:"bloc", label:"Animals act as", states:[["separate","Separate species","n"],["united","One group","u"]], start:"separate", derived:true},
  {id:"agi", label:"AGI debate", states:[["imminent","Believed imminent","u"],["contested","Contested","u"],["distant","Believed distant","u"]], random:true, sticky:true},
  {id:"altprot", label:"Alternative proteins", states:[["cheap","Cheap","g"],["costly","Still costly","n"]], random:true, fixed:true, note:"Set at random at the start of each world and held fixed."}
];
const OUTCOMES = [
  {id:"response", label:"Institutional response", states:[["adoption","Open adoption","u"],["restricted","Restricted","u"],["suppressed","Suppressed","b"]], start:"adoption"},  // R17: open adoption is contested, not good for animals by default
  {id:"conflict", label:"Conflict", states:[["none","None","g"],["polarization","Polarization among humans","u"],["confrontation","Humans versus animals","b"]], start:"none"},
  {id:"food", label:"Food system", states:[["unchanged","Unchanged","n"],["reformed","Reformed","u"],["shrinking","Animal farming shrinking","g"]], start:"unchanged"}
];
const SPVARS = [
  {id:"belief", label:"Public belief", short:"Belief", states:[["high","High","g"],["mixed","Mixed","u"],["low","Low","b"]]},
  {id:"says", label:"What they say", short:"Says", states:[["rich","Rich preferences","g"],["immediate","Immediate wants","u"],["alien","Hard to interpret","n"]]},
  {id:"knowing", label:"Knowing their situation", short:"Knowing", states:[["suffering","More suffering","b"],["neutral","Roughly neutral","n"],["agency","Agency","g"]], start:"neutral"},
  {id:"collective", label:"Collective action", short:"Organizing", states:[["none","None","n"],["group","Within a group","u"],["movement","Organized movement","u"]], start:"none"},
  {id:"status", label:"Legal status", short:"Status", states:[["unchanged","Unchanged","n"],["welfare","Welfare reform","u"],["guardian","Guardians","g"],["self","Speak for themselves","g"]], start:"unchanged"},
  {id:"welfare", label:"Welfare", short:"Welfare", states:[["worse","Worse","b"],["same","About the same","n"],["better","Better","g"]], start:"same"},
  {id:"access", label:"Access to translators", short:"Access", states:[["kept","Kept","g"],["partly","Partly removed","u"],["removed","Removed","b"]], start:"kept"},
  {id:"trust", label:"Trust in humans and the device", short:"Trust", states:[["high","High","g"],["guarded","Guarded","u"],["low","Low","b"]], start:"guarded"}
];
const SP_START = {
  cet:  {belief:"high",  says:"rich"},
  bird: {belief:"mixed", says:"immediate"},
  pet:  {belief:"high",  says:"immediate"},
  pig:  {belief:"low",   says:"rich"}
};
const GROUPS = [
  {id:"bill", label:"Tech billionaires", strats:[["open","Release models openly"],["pets","Sell pet translators"],["quiet","Stay quiet on farming"],["listen","Sell listening devices"],["defense","Work with defense agencies"]]},
  {id:"adv",  label:"Animal advocates", strats:[["chickens","Extend claims to chickens"],["careful","Campaign carefully"],["push","Push hard on farmed animals"],["partner","Partner with tech companies"],["guidelines","Campaign for animals in AI ethics guidelines"]]},
  {id:"acad", label:"Academics", strats:[["validate","Validate the translations"],["ethicists","Argue for higher status"],["dispute","Dispute the translations"],["protect","Protect the animals' records"],["pepp","Adopt consent-based methods (PEPP-style)"]]},
  {id:"pol",  label:"Lawmakers", strats:[["restrict","Restrict the technology"],["standing","Create legal standing"],["stall","Stall"],["regulate","Regulate"],["research","Regulate research on translated species"],["codify","Turn voluntary principles into law"]]},
  {id:"ind",  label:"Animal industry", strats:[["pivot","Pivot to alternative proteins"],["restrictRec","Restrict recording on farms"],["deny","Deny and lobby"],["rebrand","Rebrand with welfare claims"],["manage","Use AI to monitor and manage animals"]]},
  {id:"ani",  label:"Animals", strats:[["refuse","Refuse"],["resist","Resist"],["negotiate","Negotiate"],["engage","Engage"]]}
];
const GR = Object.fromEntries(GROUPS.map(g=>[g.id,g]));

/* ---------- Helpers ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ALLW = WORLD.concat(OUTCOMES);
function defOf(key){
  const p = key.split(".");
  if(p[0]==="w") return ALLW.find(v=>v.id===p[1]);
  if(p[0]==="s") return SPVARS.find(v=>v.id===p[2]);
  if(p[0]==="g") return GR[p[1]];
  return null;
}
function stateInfo(key, val){
  const d = defOf(key);
  const list = d && (d.states || d.strats);
  const s = list && list.find(x=>x[0]===val);
  return s ? {label:s[1], cls:s[2]||"s"} : {label:String(val), cls:"n"};
}
const stratLabel = (gid,sid) => (GR[gid].strats.find(x=>x[0]===sid)||[sid,sid])[1];
const isActive = (first, sp, t) => sp===first || t>=ALL_FROM;
const activeList = (first, t) => SPECIES.map(s=>s.id).filter(sp=>isActive(first,sp,t));
function get(st, key){
  const p = key.split(".");
  if(p[0]==="w") return st.w[p[1]];
  if(p[0]==="s") return st.s[p[1]][p[2]];
  return st.g ? st.g[p[1]] : undefined;
}
const any = (c, f) => c.act.some(f);
const rights = ["guardian","self"];
const trustDown = (c, sp) => c.s[sp].trust==="high" ? "guarded" : "low";
const trustUp   = (c, sp) => c.s[sp].trust==="low" ? "guarded" : "high";

/* ---------- Group rules ---------- */
function rulePick(gid, st, t){
  const act = activeList(st.first, t), w = st.w, s = st.s, pg = st.g || {};
  const c2 = t >= C2_FROM;
  if(gid==="bill"){
    if(w.response==="suppressed" || pg.pol==="restrict") return ["open","Suppression looks likely, so the open-model company releases everything openly"];
    if(act.includes("pet") && s.pet.belief==="high") return ["pets","Public belief is high for pets, so sell pet translators"];
    return ["quiet","Otherwise stay quiet on farming"];
  }
  if(gid==="adv"){
    if(act.includes("bird") && w.chicken==="none") return ["chickens","Bird models exist, so chicken charities extend the claim to chickens"];
    if(w.fakes==="widespread") return ["careful","Fakes are widespread, so campaign carefully"];
    if(w.accuracy==="genuine" || w.bloc==="united") return ["push","The debate leans genuine or the animals have united, so push hard on farmed animals"];
    if(t<=3) return ["guidelines","Translation has just become public, so campaign to include animals in AI ethics guidelines (G07)"];
    return ["partner","Otherwise partner with tech companies"];
  }
  if(gid==="acad"){
    if((w.military!=="none" || pg.pol==="restrict") && w.records==="researchers") return ["protect","State pressure is rising, so researchers protect the archive"];
    if(w.consent==="contested" || w.consent==="scandal") return ["pepp","The study animals' consent is contested, so academics adopt consent-based, non-invasive methods (G01)"];
    if(w.carryover!=="refused" && w.accuracy!=="projection") return ["validate","Checkable reports hold up, so scientists validate"];
    if(act.some(sp=>s[sp].says==="rich")) return ["ethicists","A species says something rich, so ethicists argue for higher status"];
    return ["dispute","Otherwise dispute"];
  }
  if(gid==="pol"){
    const fl = st.flags || {};
    if(w.conflict!=="none") return ["restrict","Conflict has arisen, so restrict"];
    if(t<=3) return ["stall","Institutions are not ready for what the animals say, so lawmakers wait (R18, design rule)"];
    if(w.accuracy==="genuine" && !fl.researchRules) return ["research","Scientists accept the translations, so regulate research on translated species, as with great apes (R01, G04)"];
    if(fl.pepp && !fl.codified) return ["codify","Researchers adopted voluntary principles earlier, so turn them into law (R19, G05)"];
    if(t>=ALL_FROM && act.some(sp=>s[sp].belief==="high")) return ["standing","Public belief is high for a species, so create standing for it"];
    if(pg.ind==="deny" && w.response==="restricted") return ["stall","The animal industry is lobbying and winning, so stall"];
    return ["regulate","Otherwise regulate the technology"];
  }
  if(gid==="ind"){
    if(w.altprot==="cheap" && t>=5) return ["pivot","Alternative proteins are cheap, so some companies pivot"];
    if(act.includes("pig") && s.pig.status!=="unchanged") return ["restrictRec","Pig status has risen, so restrict recording on farms"];
    if(act.includes("pig") && w.surveillance==="commercial") return ["manage","Pigs are translated and farms are already monitored, so use AI to monitor and manage animals (G03)"];
    return ["deny","Otherwise deny and lobby"];
  }
  if(gid==="ani"){
    if(w.consent==="scandal" || act.some(sp=>s[sp].trust==="low")) return ["refuse","Trust in humans is low or a consent scandal hit, so the animals refuse"];
    if(c2 && act.some(sp=>s[sp].collective==="movement")) return ["resist","Condition 2 and an organized movement, so resist"];
    if(!c2) return ["negotiate","Before condition 2, negotiate"];
    return ["engage","Otherwise engage"];
  }
  return [GR[gid].strats[0][0], ""];
}

/* ---------- Links ----------
   src: rating = Phase 2 draft ratings; pig = pig scenario (condition 2 world-building);
        glue = engine assumption so every variable can move; design = v2 design rule;
        lit = rule drawn from the literature review and approved in review (ref = its ID in the review workbook). */
const R="rating", P="pig", G="glue", D="design", L="lit";
const LINKS = [
  // Phase 2 ratings, as in the explorer
  {src:R, r:2, per:"species", text:"Accuracy debate leans genuine → status: guardians", when:c=>c.w.accuracy==="genuine", to:sp=>["s."+sp+".status","guardian"]},
  {src:R, r:2, per:"species", text:"Accuracy debate leans projection → status: unchanged", when:c=>c.w.accuracy==="projection", to:sp=>["s."+sp+".status","unchanged"]},
  {src:R, r:2, text:"Reports of feelings trusted → pig welfare: better", when:c=>c.w.carryover==="full" && c.act.includes("pig"), to:()=>["s.pig.welfare","better"]},
  {src:R, r:2, text:"Reports of feelings not trusted → pig welfare: about the same", when:c=>c.w.carryover==="refused" && c.act.includes("pig"), to:()=>["s.pig.welfare","same"]},
  {src:R, r:2, text:"Fake translations widespread → accuracy debate: projection", when:c=>c.w.fakes==="widespread", to:()=>["w.accuracy","projection"]},
  {src:R, r:3, text:"Tech billionaires release models openly → open models dominate", when:c=>c.g.bill==="open", to:()=>["w.openness","open"]},
  {src:R, r:-2, text:"Open models dominate → suppression gets harder", when:c=>c.w.openness==="open", to:()=>["w.response","suppressed"]},
  {src:R, r:1, text:"Open models dominate → fake translations: common", when:c=>c.w.openness==="open", to:()=>["w.fakes","caught"]},
  {src:R, r:3, text:"Advocates extend claims to chickens → chicken spillover: claimed", when:c=>c.g.adv==="chickens", to:()=>["w.chicken","claimed"]},
  {src:R, r:2, phase:"strategy", text:"Chicken spillover claimed → industry: deny and lobby", when:c=>c.w.chicken!=="none", to:()=>["g.ind","deny"]},
  {src:R, r:1, text:"Advocates campaign carefully → accuracy debate: genuine", when:c=>c.g.adv==="careful", to:()=>["w.accuracy","genuine"]},
  {src:R, r:2, text:"Scientists validate → accuracy debate: genuine", when:c=>c.g.acad==="validate", to:()=>["w.accuracy","genuine"]},
  {src:R, r:2, text:"Academics dispute → accuracy debate: projection", when:c=>c.g.acad==="dispute", to:()=>["w.accuracy","projection"]},
  {src:R, r:1, text:"Consent scandal over study animals → response: restricted", when:c=>c.w.consent==="scandal", to:()=>["w.response","restricted"]},
  {src:R, r:2, text:"Industry denies and lobbies → response: restricted", when:c=>c.g.ind==="deny", to:()=>["w.response","restricted"]},
  {src:R, r:2, text:"Industry restricts recording on farms → surveillance: research only", when:c=>c.g.ind==="restrictRec", to:()=>["w.surveillance","research"]},
  {src:R, r:1, phase:"strategy", text:"Pig status rises → industry: pivot to alternative proteins", when:c=>rights.includes(c.s.pig.status), to:()=>["g.ind","pivot"]},
  {src:R, r:2, text:"Industry pivots → food: animal farming shrinking", when:c=>c.g.ind==="pivot", to:()=>["w.food","shrinking"]},
  {src:R, r:2, text:"Captive cetaceans translated → cetacean status: guardians", when:c=>c.act.includes("cet"), to:()=>["s.cet.status","guardian"]},
  {src:R, r:2, text:"Public belief high for cats and dogs → their status: welfare reform", when:c=>c.act.includes("pet") && c.s.pet.belief==="high", to:()=>["s.pet.status","welfare"]},
  {src:R, r:3, per:"species", text:"Lawmakers create standing → status: guardians", when:(c,sp)=>c.g.pol==="standing" && c.standingFor.includes(sp), to:sp=>["s."+sp+".status","guardian"]},
  {src:R, r:1, per:"species", text:"Knowing their situation brings suffering → access: partly removed", when:(c,sp)=>c.s[sp].knowing==="suffering", to:sp=>["s."+sp+".access","partly"]},
  {src:R, r:3, text:"An organized animal movement → conflict: humans versus animals", when:c=>any(c,sp=>c.s[sp].collective==="movement"), to:()=>["w.conflict","confrontation"]},
  {src:R, r:2, text:"An organized animal movement → response: suppressed", when:c=>any(c,sp=>c.s[sp].collective==="movement"), to:()=>["w.response","suppressed"]},
  {src:R, r:1, text:"Military use confirmed → conflict: polarization", when:c=>c.w.military==="confirmed", to:()=>["w.conflict","polarization"]},
  {src:R, r:1, phase:"strategy", text:"AGI believed imminent → lawmakers: stall", when:c=>c.w.agi==="imminent", to:()=>["g.pol","stall"]},
  {src:R, r:1, text:"AGI believed imminent → accuracy debate: genuine", when:c=>c.w.agi==="imminent", to:()=>["w.accuracy","genuine"]},

  // Literature review rules (R01–R20 and G01–G08, reviewed November 2026). Ranges were set at their lower end.
  {src:L, ref:"R01, G04", r:2, text:"Lawmakers regulate research on translated species → study animals: handled well", when:c=>c.g.pol==="research", to:()=>["w.consent","well"]},
  {src:L, ref:"G04", r:1, per:"species", text:"Lawmakers regulate research on translated species → status: welfare reform", when:(c,sp)=>c.g.pol==="research" && c.s[sp].status==="unchanged", to:sp=>["s."+sp+".status","welfare"]},
  {src:L, ref:"R02", r:2, per:"species", text:"Accuracy debate leans genuine → status: welfare reform first", when:(c,sp)=>c.w.accuracy==="genuine" && c.s[sp].status==="unchanged", to:sp=>["s."+sp+".status","welfare"]},
  {src:L, ref:"R03", r:2, text:"Cetaceans' language capacity makes captivity look harmful → cetacean welfare: better", when:c=>c.act.includes("cet") && c.s.cet.says==="rich", to:()=>["s.cet.welfare","better"]},
  {src:L, ref:"R03", r:2, text:"Cetaceans' language capacity → cetacean status: welfare reform", when:c=>c.act.includes("cet") && c.s.cet.says==="rich" && c.s.cet.status==="unchanged", to:()=>["s.cet.status","welfare"]},
  {src:L, ref:"R04", r:2, text:"Academics argue cetacean rights through human rights → cetacean status rises a step", when:c=>c.g.acad==="ethicists" && c.act.includes("cet") && c.s.cet.status!=="self", to:c=>["s.cet.status", c.s.cet.status==="guardian" ? "self" : "guardian"]},
  {src:L, ref:"R04", r:2, text:"Cetaceans' right to cultural life → land claims: contested (protected waters)", when:c=>c.act.includes("cet") && rights.includes(c.s.cet.status) && c.w.land==="none", to:()=>["w.land","contested"]},
  {src:L, ref:"R06", r:2, per:"species", text:"Faked translations sent to animals distress them → welfare: worse", when:c=>c.w.fakes==="widespread", to:sp=>["s."+sp+".welfare","worse"]},
  {src:L, ref:"R07", r:1, per:"species", text:"Human-sounding translations are favoured → public belief: high", when:(c,sp)=>c.s[sp].says==="rich", to:sp=>["s."+sp+".belief","high"]},
  {src:L, ref:"R07", r:1, text:"Human-sounding translations feed the critique → accuracy debate: projection", when:c=>any(c,sp=>c.s[sp].says==="rich"), to:()=>["w.accuracy","projection"]},
  {src:L, ref:"R08", r:1, per:"species", text:"Humans send signals to animals at scale (condition 2) → welfare: worse", when:c=>c.c2, to:sp=>["s."+sp+".welfare","worse"]},
  {src:L, ref:"R08, G06", r:1, phase:"strategy", text:"Two-way use at scale (condition 2) → animals: refuse", when:c=>c.c2, to:()=>["g.ani","refuse"]},
  {src:L, ref:"R09, G06", r:2, phase:"strategy", text:"Fakes aimed at animals → animals: refuse", when:c=>c.w.fakes==="widespread", to:()=>["g.ani","refuse"]},
  {src:L, ref:"R10, G03", r:2, text:"Industry uses AI to manage animals → pig welfare: worse", when:c=>c.g.ind==="manage" && c.act.includes("pig"), to:()=>["s.pig.welfare","worse"]},
  {src:L, ref:"R10, G03", r:2, text:"Industry uses AI to manage animals → surveillance: commercial", when:c=>c.g.ind==="manage", to:()=>["w.surveillance","commercial"]},
  {src:L, ref:"R12", r:2, text:"Animals withdraw and academics respect it → study animals: handled well", when:c=>c.g.ani==="refuse" && c.g.acad==="pepp", to:()=>["w.consent","well"]},
  {src:L, ref:"R12", r:2, text:"Animals withdraw and academics override it → study animals: contested", when:c=>c.g.ani==="refuse" && c.g.acad==="validate" && c.w.consent==="well", to:()=>["w.consent","contested"]},
  {src:L, ref:"R12", r:2, text:"Withdrawal overridden again → study animals: scandal", when:c=>c.g.ani==="refuse" && c.g.acad==="validate" && c.w.consent==="contested", to:()=>["w.consent","scandal"]},
  {src:L, ref:"R13", r:1, text:"Experiments expose animals' suffering → study animals: contested", when:c=>c.w.consent==="well" && any(c,sp=>c.s[sp].knowing==="suffering"), to:()=>["w.consent","contested"]},
  {src:L, ref:"R14", r:2, text:"A few translated species gain rights → voiceless animals: left behind", when:c=>any(c,sp=>rights.includes(c.s[sp].status)), to:()=>["w.voiceless","left"]},
  {src:L, ref:"R14", r:2, text:"Chicken claim partly tested → voiceless animals: some spillover", when:c=>c.w.chicken==="partly", to:()=>["w.voiceless","spill"]},
  {src:L, ref:"R14", r:2, text:"Chicken translation tested → voiceless animals: included", when:c=>c.w.chicken==="tested", to:()=>["w.voiceless","included"]},
  {src:L, ref:"R15", r:1, per:"species", text:"Reports of feelings trusted → public belief: high", when:c=>c.w.carryover==="full", to:sp=>["s."+sp+".belief","high"]},
  {src:L, ref:"R15", r:1, per:"species", text:"Reports of feelings trusted → welfare: better (beyond pigs)", when:(c,sp)=>c.w.carryover==="full" && sp!=="pig", to:sp=>["s."+sp+".welfare","better"]},
  {src:L, ref:"R19, G05", r:1, text:"Voluntary principles become law → study animals: handled well", when:c=>c.g.pol==="codify", to:()=>["w.consent","well"]},
  {src:L, ref:"R19, G05", r:1, text:"Voluntary principles become law → surveillance: research only", when:c=>c.g.pol==="codify", to:()=>["w.surveillance","research"]},
  {src:L, ref:"R19, G05", r:1, text:"Voluntary principles become law → fake translations: often caught", when:c=>c.g.pol==="codify", to:()=>["w.fakes","caught"]},
  {src:L, ref:"R20", r:2, text:"Open models help poachers and hunters → cetacean welfare: worse", when:c=>c.w.openness==="open" && c.act.includes("cet"), to:()=>["s.cet.welfare","worse"]},
  {src:L, ref:"R20", r:2, text:"Open models help poachers and hunters → bird welfare: worse", when:c=>c.w.openness==="open" && c.act.includes("bird"), to:()=>["s.bird.welfare","worse"]},
  {src:L, ref:"G01", r:2, text:"Academics adopt consent-based methods → study animals: handled well", when:c=>c.g.acad==="pepp", to:()=>["w.consent","well"]},
  {src:L, ref:"G01", r:1, text:"Academics adopt consent-based methods → surveillance: research only", when:c=>c.g.acad==="pepp", to:()=>["w.surveillance","research"]},
  {src:L, ref:"G01", r:1, text:"Slower, non-invasive verification → accuracy debate: useful model", when:c=>c.g.acad==="pepp", to:()=>["w.accuracy","useful"]},
  {src:L, ref:"G02", r:1, text:"Validating through playback → study animals: contested", when:c=>c.g.acad==="validate" && c.w.consent==="well", to:()=>["w.consent","contested"]},
  {src:L, ref:"G02", r:1, text:"Validating through playback → welfare of the species tested: worse", when:c=>c.g.acad==="validate" && c.act.includes(c.first), to:c=>["s."+c.first+".welfare","worse"]},
  {src:L, ref:"G07", r:1, text:"Advocates campaign for AI ethics guidelines → study animals: handled well", when:c=>c.g.adv==="guidelines", to:()=>["w.consent","well"]},
  {src:L, ref:"G07", r:1, text:"Advocates campaign for AI ethics guidelines → surveillance: research only", when:c=>c.g.adv==="guidelines", to:()=>["w.surveillance","research"]},
  {src:L, ref:"G08", r:1, text:"Advocates and tech companies push AI that benefits animals → cat and dog welfare: better", when:c=>c.g.adv==="partner" && c.act.includes("pet"), to:()=>["s.pet.welfare","better"]},
  {src:L, ref:"G08", r:1, text:"Advocates and tech companies push AI that benefits animals → pig welfare: better", when:c=>c.g.adv==="partner" && c.act.includes("pig"), to:()=>["s.pig.welfare","better"]},

  // Pig scenario (condition 2 world-building)
  {src:P, r:1, per:"species", text:"Institutions restrict the technology → access: partly removed", when:c=>c.w.response==="restricted", to:sp=>["s."+sp+".access","partly"]},
  {src:P, r:1, text:"Ag-gag style limits on farms → pig access: partly removed", when:c=>c.g.ind==="restrictRec" && c.act.includes("pig"), to:()=>["s.pig.access","partly"]},
  {src:P, r:2, text:"Animals lost the tools but kept organizing → the words spread animal to animal", when:c=>c.c2 && any(c,sp=>c.s[sp].access!=="kept") && any(c,sp=>c.s[sp].collective!=="none"), to:()=>["w.revers","spreads"]},
  {src:P, r:1, text:"Animals outside the studies use the new words → accuracy debate: genuine", when:c=>c.w.revers==="spreads", to:()=>["w.accuracy","genuine"]},
  {src:P, r:1, per:"species", text:"Animals keep their own records → a movement can last", when:(c,sp)=>c.c2 && c.w.records==="animals", to:sp=>["s."+sp+".collective","movement"]},
  {src:P, r:1, text:"Animals that document their lives are easier to track → surveillance: commercial", when:c=>c.w.records==="animals" || c.w.records==="open", to:()=>["w.surveillance","commercial"]},
  {src:P, r:1, per:"species", text:"Mass monitoring picks out leaders → collective action: within a group", when:(c,sp)=>c.c2 && c.w.surveillance==="mass", to:sp=>["s."+sp+".collective","group"]},
  {src:P, r:1, text:"Industry fights the testimony → fake translations: common", when:c=>c.g.ind==="deny", to:()=>["w.fakes","caught"]},
  {src:P, r:1, text:"Advocates push hard while belief is low → fake translations: common", when:c=>c.g.adv==="push" && c.s[c.first].belief==="low", to:()=>["w.fakes","caught"]},
  {src:P, r:1, text:"State interest in dual use → records: seized", when:c=>c.w.military!=="none", to:()=>["w.records","seized"]},
  {src:P, r:1, text:"Lawmakers restrict the technology → records: seized", when:c=>c.g.pol==="restrict" && c.w.records==="researchers", to:()=>["w.records","seized"]},
  {src:P, r:2, text:"Researchers protect the archive → records: held by researchers", when:c=>c.g.acad==="protect", to:()=>["w.records","researchers"]},
  {src:P, r:2, text:"Animals asked to go home → land claims: raised", when:c=>c.c2 && c.flags.home && c.w.land==="none", to:()=>["w.land","ignored"]},

  // Engine assumptions from the explorer
  {src:G, r:1, per:"species", text:"Accuracy debate leans genuine → public belief: high", when:c=>c.w.accuracy==="genuine", to:sp=>["s."+sp+".belief","high"]},
  {src:G, r:1, per:"species", text:"Accuracy debate leans projection → public belief: low", when:c=>c.w.accuracy==="projection", to:sp=>["s."+sp+".belief","low"]},
  {src:G, r:1, per:"species", text:"Condition 2 and rich communication → organized movement", when:(c,sp)=>c.c2 && c.s[sp].says==="rich", to:sp=>["s."+sp+".collective","movement"]},
  {src:G, r:1, per:"species", text:"Condition 2 and immediate wants → collective action within a group", when:(c,sp)=>c.c2 && c.s[sp].says==="immediate", to:sp=>["s."+sp+".collective","group"]},
  {src:G, r:1, per:"species", text:"Guardians plus condition 2 and rich communication → speak for themselves", when:(c,sp)=>c.c2 && c.s[sp].status==="guardian" && c.s[sp].says==="rich", to:sp=>["s."+sp+".status","self"]},
  {src:G, r:1, per:"species", text:"Any status gain → welfare: better", when:(c,sp)=>c.s[sp].status!=="unchanged", to:sp=>["s."+sp+".welfare","better"]},
  {src:G, r:2, per:"species", text:"Institutional response: suppressed → access: removed", when:c=>c.w.response==="suppressed", to:sp=>["s."+sp+".access","removed"]},
  {src:G, r:2, text:"Lawmakers restrict → response: restricted", when:c=>c.g.pol==="restrict", to:()=>["w.response","restricted"]},
  {src:G, r:1, text:"Open models dominate → response: open adoption", when:c=>c.w.openness==="open", to:()=>["w.response","adoption"]},
  {src:G, r:1, text:"Pig welfare better → food system: reformed", when:c=>c.act.includes("pig") && c.s.pig.welfare==="better", to:()=>["w.food","reformed"]},

  // Engine assumptions added in v2
  {src:G, r:2, text:"Condition 2 words are learned, not worn → they last in study groups", when:c=>c.c2 && c.w.revers==="reversible", to:()=>["w.revers","lasting"]},
  {src:G, r:1, text:"Open vocabularies on any phone → the words spread", when:c=>c.c2 && c.w.openness==="open", to:()=>["w.revers","spreads"]},
  {src:G, r:1, text:"Open models on every phone → surveillance: commercial", when:c=>c.w.openness==="open", to:()=>["w.surveillance","commercial"]},
  {src:G, r:2, text:"Tech billionaires sell listening devices → surveillance: commercial", when:c=>c.g.bill==="listen", to:()=>["w.surveillance","commercial"]},
  {src:G, r:2, text:"Tech billionaires work with defense → military use: suspected", when:c=>c.g.bill==="defense" && c.w.military==="none", to:()=>["w.military","suspected"]},
  {src:G, r:1, text:"Defense work while military use is suspected → confirmed", when:c=>c.g.bill==="defense" && c.w.military==="suspected", to:()=>["w.military","confirmed"]},
  {src:G, r:2, text:"Humans versus animals → surveillance: mass monitoring", when:c=>c.w.conflict==="confrontation", to:()=>["w.surveillance","mass"]},
  {src:G, r:1, text:"Tech billionaires sell pet translators → pet belief: high", when:c=>c.g.bill==="pets" && c.act.includes("pet"), to:()=>["s.pet.belief","high"]},
  {src:G, r:1, per:"species", text:"Animals engage → public belief: high", when:c=>c.g.ani==="engage", to:sp=>["s."+sp+".belief","high"]},
  {src:G, r:2, text:"Animals resist → conflict: humans versus animals", when:c=>c.g.ani==="resist", to:()=>["w.conflict","confrontation"]},
  {src:G, r:1, text:"Animals negotiate → conflict: none", when:c=>c.g.ani==="negotiate", to:()=>["w.conflict","none"]},
  {src:G, r:1, text:"Advocates push hard → conflict: polarization", when:c=>c.g.adv==="push", to:()=>["w.conflict","polarization"]},
  {src:L, ref:"R16", r:1, per:"species", text:"Ethicists argue for status → status: welfare reform, whatever the accuracy debate says", when:c=>c.g.acad==="ethicists", to:sp=>["s."+sp+".status","welfare"]},
  {src:G, r:1, text:"Industry rebrands with welfare claims → pig status: welfare reform", when:c=>c.g.ind==="rebrand" && c.act.includes("pig"), to:()=>["s.pig.status","welfare"]},
  {src:G, r:1, text:"Lawmakers regulate → fake translations: often caught", when:c=>c.g.pol==="regulate", to:()=>["w.fakes","caught"]},
  {src:G, r:1, text:"Lawmakers regulate → surveillance: research only", when:c=>c.g.pol==="regulate", to:()=>["w.surveillance","research"]},
  {src:G, r:1, text:"Humans versus animals → response: suppressed", when:c=>c.w.conflict==="confrontation", to:()=>["w.response","suppressed"]},
  {src:G, r:1, per:"species", text:"Humans versus animals → welfare: worse", when:c=>c.w.conflict==="confrontation", to:sp=>["s."+sp+".welfare","worse"]},
  {src:G, r:1, per:"species", text:"Knowing their situation brings suffering → welfare: worse", when:(c,sp)=>c.s[sp].knowing==="suffering", to:sp=>["s."+sp+".welfare","worse"]},
  {src:G, r:1, text:"Chicken claim and scientists validate → partly tested", when:c=>c.c2 && c.w.chicken==="claimed" && c.g.acad==="validate", to:()=>["w.chicken","partly"]},
  {src:G, r:1, text:"Partly tested and scientists validate → tested", when:c=>c.w.chicken==="partly" && c.g.acad==="validate", to:()=>["w.chicken","tested"]},
  {src:G, r:1, text:"Chicken translation tested → food system: reformed", when:c=>c.w.chicken==="tested", to:()=>["w.food","reformed"]},
  {src:G, r:1, text:"Lawmakers create standing → land claims: contested", when:c=>c.g.pol==="standing" && c.w.land!=="none", to:()=>["w.land","contested"]},
  {src:G, r:1, text:"Industry denies → land claims: ignored", when:c=>c.g.ind==="deny" && (c.w.land==="ignored" || c.w.land==="contested"), to:()=>["w.land","ignored"]},
  {src:G, r:1, text:"Guardians and contested claims → some places recognized", when:c=>c.w.land==="contested" && any(c,sp=>rights.includes(c.s[sp].status)), to:()=>["w.land","recognized"]},
  {src:G, r:2, text:"Humans versus animals → children: mostly frightened", when:c=>c.w.conflict==="confrontation", to:()=>["w.children","scared"]},
  {src:G, r:1, text:"Children who talk to their pets every day → include animals", when:c=>c.t>=5 && c.act.includes("pet") && c.s.pet.belief==="high", to:()=>["w.children","include"]},
  {src:G, r:1, text:"Fake translations widespread → children: divided", when:c=>c.w.fakes==="widespread", to:()=>["w.children","divided"]},
  {src:G, r:1, text:"Children include animals while farming is unchanged → tension between generations", when:c=>c.t>=6 && c.w.children==="include" && c.w.food==="unchanged", to:()=>["w.generations","tension"]},
  {src:G, r:1, text:"Children include animals while industry denies → tension between generations", when:c=>c.t>=5 && c.w.children==="include" && c.g.ind==="deny", to:()=>["w.generations","tension"]},
  {src:G, r:1, text:"Tension at home plus open conflict → open split", when:c=>c.w.generations==="tension" && c.w.conflict!=="none", to:()=>["w.generations","split"]},
  {src:G, r:1, text:"Children include animals → food system: reformed", when:c=>c.t>=6 && c.w.children==="include", to:()=>["w.food","reformed"]},

  // Animals' trust in humans and the device (engine assumptions; trust moves one step at a time)
  {src:G, r:2, per:"species", text:"Access to translators removed → trust in humans falls", when:(c,sp)=>c.s[sp].access==="removed", to:(sp,c)=>["s."+sp+".trust", trustDown(c,sp)]},
  {src:G, r:1, per:"species", text:"Access partly removed → trust in humans falls", when:(c,sp)=>c.s[sp].access==="partly", to:(sp,c)=>["s."+sp+".trust", trustDown(c,sp)]},
  {src:G, r:1, per:"species", text:"Consent scandal over study animals → trust in humans falls", when:c=>c.w.consent==="scandal", to:(sp,c)=>["s."+sp+".trust", trustDown(c,sp)]},
  {src:G, r:1, per:"species", text:"Mass monitoring → trust in humans falls", when:c=>c.w.surveillance==="mass", to:(sp,c)=>["s."+sp+".trust", trustDown(c,sp)]},
  {src:G, r:1, per:"species", text:"Humans versus animals → trust in humans falls", when:c=>c.w.conflict==="confrontation", to:(sp,c)=>["s."+sp+".trust", trustDown(c,sp)]},
  {src:G, r:1, per:"species", text:"Guardians or a voice in court → trust in humans rises", when:(c,sp)=>rights.includes(c.s[sp].status), to:(sp,c)=>["s."+sp+".trust", trustUp(c,sp)]},
  {src:G, r:1, per:"species", text:"Animals negotiate and there is no conflict → trust in humans rises", when:c=>c.g.ani==="negotiate" && c.w.conflict==="none", to:(sp,c)=>["s."+sp+".trust", trustUp(c,sp)]},

  // v2 design rules
  {src:D, r:1, per:"species", text:"Animals act as one group → collective action spreads across species", when:c=>c.c2 && c.w.bloc==="united", to:sp=>["s."+sp+".collective","group"]},
  {src:D, r:1, per:"species", text:"Animals act as one group and one species has a movement → others join it", when:c=>c.c2 && c.w.bloc==="united" && any(c,x=>c.s[x].collective==="movement"), to:sp=>["s."+sp+".collective","movement"]},
  {src:D, r:1, text:"Animals act as one group → conflict: polarization", when:c=>c.w.bloc==="united", to:()=>["w.conflict","polarization"]}
];

/* ---------- Engine ---------- */
function initState(first, seed){
  const rng = mulberry32((seed|0)*7919 + 17);
  const pick = arr => arr[Math.floor(rng()*arr.length)];
  const st = {t:0, first, w:{}, s:{}, g:null, flags:{}, queued:[], expl:{}};
  ALLW.forEach(v=>{ st.w[v.id] = v.random ? pick(v.states)[0] : v.start; });
  SPECIES.forEach(sp=>{
    st.s[sp.id] = {};
    SPVARS.forEach(v=>{ st.s[sp.id][v.id] = (SP_START[sp.id]||{})[v.id] || v.start; });
  });
  return st;
}

function expand(key, first, act){
  const p = key.split(".");
  if(p[0]!=="s") return [key];
  if(p[1]==="first") return act.includes(first) ? ["s."+first+"."+p[2]] : [];
  if(p[1]==="*") return act.map(sp=>"s."+sp+"."+p[2]);
  return act.includes(p[1]) ? [key] : [];
}
function validState(key, val){ const d = defOf(key); return !!(d && d.states && d.states.some(s=>s[0]===val)); }

/* One jump. opt: {seed, noise, player:{group, move, pushes:[[key,state,weight]], label}} */
function step(prev, t, opt){
  opt = opt || {};
  const rng = mulberry32(((opt.seed|0)*1000) + t*37 + 1);
  const noise = opt.noise == null ? 0.9 : opt.noise;
  const skip = opt.skipSrc || [];  // link sources to leave out, e.g. ["glue"] to run without engine assumptions
  const act = activeList(prev.first, t);
  const c2 = t >= C2_FROM;
  const expl = {};

  // 1. Group strategies: rules, rating links, chance; the player's group takes the player's move
  const g = {};
  const sctx = {w:prev.w, s:prev.s, g:prev.g||{}, act, c2, t, flags:prev.flags, first:prev.first};
  GROUPS.forEach(grp=>{
    const [rp, rwhy] = rulePick(grp.id, prev, t);
    const scores = {}, contrib = {};
    grp.strats.forEach(([sid])=>{ scores[sid]=0; contrib[sid]=[]; });
    scores[rp] += 3; contrib[rp].push({src:"rule", r:3, text:rwhy});
    LINKS.filter(l=>l.phase==="strategy" && !skip.includes(l.src)).forEach(l=>{
      if(l.when(sctx)){ const [key,val] = l.to(sctx); if(key==="g."+grp.id && scores[val]!=null){ scores[val]+=l.r; contrib[val].push({src:l.src, r:l.r, text:l.text, ref:l.ref}); } }
    });
    grp.strats.forEach(([sid])=>{ const n = rng()*noise*0.6; scores[sid]+=n; contrib[sid].push({src:"other", r:n, text:"Randomness"}); });
    let best = grp.strats[0][0];
    grp.strats.forEach(([sid])=>{ if(scores[sid]>scores[best]) best = sid; });
    let player = false;
    if(opt.player && opt.player.group===grp.id && opt.player.move){ best = opt.player.move; player = true; }
    g[grp.id] = best;
    expl["g."+grp.id] = {kind:"group", group:grp.id, pick:best, rule:rp, ruleWhy:rwhy, player,
      contrib: player ? [{src:"choice", r:0, text:"You chose: "+opt.player.label}] : contrib[best].filter(c=>c.src!=="other" || c.r>0.05)};
  });

  // 2. Links
  const standingFor = act.filter(sp=>prev.s[sp].belief==="high");
  const ctx = {w:prev.w, s:prev.s, g, act, c2, t, flags:prev.flags||{}, standingFor, first:prev.first};
  const add = {};
  const push = (key,val,c)=>{ (add[key] = add[key] || {}); (add[key][val] = add[key][val] || []).push(c); };
  LINKS.filter(l=>l.phase!=="strategy" && !skip.includes(l.src)).forEach(l=>{
    if(l.per==="species"){
      act.forEach(sp=>{ if(l.when(ctx, sp)){ const [k,v] = l.to(sp, ctx); push(k,v,{src:l.src, r:l.r, text:l.text, ref:l.ref}); } });
    } else if(l.when(ctx)){ const [k,v] = l.to(ctx); push(k,v,{src:l.src, r:l.r, text:l.text, ref:l.ref}); }
  });

  // 3. The player's pushes (and any queued from the prologue)
  const pushes = (prev.queued||[]).slice();
  if(opt.player && opt.player.pushes) opt.player.pushes.forEach(p=>pushes.push({key:p[0], val:p[1], r:p[2]==null?2:p[2], label:opt.player.label}));
  pushes.forEach(p=>{
    expand(p.key, prev.first, act).forEach(k=>{ if(validState(k, p.val)) push(k, p.val, {src:p.src||"choice", r:p.r, text:p.src ? p.label : "Your choice: "+p.label}); });
  });

  // 4. Resolve every variable
  const next = {t, first:prev.first, w:{}, s:{}, g, flags:Object.assign({}, prev.flags), queued:[], expl};
  // Remember one-off group moves, so later jumps can react to them (R19 and G05 need a delay)
  if(g.acad==="pepp") next.flags.pepp = true;
  if(g.pol==="codify") next.flags.codified = true;
  if(g.pol==="research") next.flags.researchRules = true;
  const resolve = (key, def, cur, inertia) => {
    const scores = {}, contrib = {};
    def.states.forEach(([sid])=>{ scores[sid]=0; contrib[sid]=[]; });
    scores[cur] += inertia; contrib[cur].push({src:"other", r:inertia, text:"Inertia: things tend to stay as they are"});
    const a = add[key] || {};
    Object.keys(a).forEach(val=>{ if(scores[val]==null) return; a[val].forEach(c=>{ scores[val]+=c.r; contrib[val].push(c); }); });
    def.states.forEach(([sid])=>{ const n = rng()*noise; scores[sid]+=n; contrib[sid].push({src:"other", r:n, text:"Randomness"}); });
    let best = def.states[0][0];
    def.states.forEach(([sid])=>{ if(scores[sid]>scores[best]) best = sid; });
    let runner = null;
    def.states.forEach(([sid])=>{ if(sid!==best && (runner===null || scores[sid]>scores[runner])) runner = sid; });
    expl[key] = {kind:"var", from:cur, to:best, contrib:contrib[best], runner, runnerContrib: runner ? contrib[runner] : [], margin: runner ? scores[best]-scores[runner] : 0};
    return best;
  };
  ALLW.forEach(v=>{
    const key = "w."+v.id, cur = prev.w[v.id];
    if(v.derived){ next.w[v.id] = cur; return; }
    if(v.fixed){ next.w[v.id] = cur; expl[key] = {kind:"note", text:v.note}; return; }
    next.w[v.id] = resolve(key, v, cur, v.sticky ? 3 : 2);
  });
  SPECIES.forEach(sp=>{
    next.s[sp.id] = {};
    SPVARS.forEach(v=>{
      const key = "s."+sp.id+"."+v.id, cur = prev.s[sp.id][v.id];
      if(!act.includes(sp.id)){ next.s[sp.id][v.id] = cur; expl[key] = {kind:"idle"}; return; }
      if(v.id==="collective" && !c2){ next.s[sp.id][v.id] = "none"; expl[key] = {kind:"note", text:"Collective action needs condition 2, which arrives from 2031."}; return; }
      next.s[sp.id][v.id] = resolve(key, v, cur, 2);
    });
  });

  // 5. v2 design rule: losing access makes the animals act as one group
  const lost = act.filter(sp=>next.s[sp].access!=="kept");
  if(prev.w.bloc==="united"){
    next.w.bloc = "united";
    expl["w.bloc"] = {kind:"note", text:"The animals have acted as one group since they first lost access to translators (v2 design rule)."};
  } else if(lost.length){
    next.w.bloc = "united";
    expl["w.bloc"] = {kind:"note", text:lost.map(id=>SP[id].name).join(", ")+" lost access to translators, so the animals now act as one group (v2 design rule)."};
  } else {
    next.w.bloc = "separate";
    expl["w.bloc"] = {kind:"note", text:"No species has lost access to translators, so each species acts on its own."};
  }
  return next;
}

function diff(a, b){
  const out = [];
  ALLW.forEach(v=>{ if(a.w[v.id]!==b.w[v.id]) out.push({key:"w."+v.id, from:a.w[v.id], to:b.w[v.id]}); });
  SPECIES.forEach(sp=>{ SPVARS.forEach(v=>{ const x = a.s[sp.id][v.id], y = b.s[sp.id][v.id]; if(x!==y) out.push({key:"s."+sp.id+"."+v.id, from:x, to:y}); }); });
  return out;
}

global.Engine = {JUMPS, ALL_FROM, C2_FROM, SPECIES, SP, WORLD, OUTCOMES, SPVARS, GROUPS, GR, LINKS,
  initState, step, diff, defOf, stateInfo, stratLabel, isActive, activeList, get, expand, validState, rulePick, mulberry32};
})(window);
