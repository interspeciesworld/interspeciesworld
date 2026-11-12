/* An Interspecies World v2: story content.
   Each choice names the move it makes for the player's group and what it pushes in the world:
   push: [key, state, weight]. Keys: w.<var>, s.first.<var> (the species translated first),
   s.<species>.<var>, s.*.<var> (every translated species). Weights: 1 slight, 2 influence, 3 strong, 4 decisive. */
(function(global){
"use strict";

const SRC = {
  ceti:{t:"Project CETI: research on sperm whale communication", u:"https://www.projectceti.org/"},
  esp:{t:"Earth Species Project: AI research on animal communication", u:"https://www.earthspecies.org/"},
  nhrp:{t:"Nonhuman Rights Project: legal cases for animal personhood", u:"https://www.nonhumanrights.org/"},
  happy:{t:"Happy, an elephant at the Bronx Zoo: the Nonhuman Rights Project's case", u:"https://www.nonhumanrights.org/client/happy/"},
  aggag:{t:"Ag-gag laws in the United States", u:"https://en.wikipedia.org/wiki/Ag-gag"},
  owa:{t:"Open Wing Alliance: a coalition campaigning for chickens", u:"https://openwingalliance.org/"},
  wilks:{t:"Wilks and others (2021), Children prioritize humans over animals less than adults do, Psychological Science", u:"https://doi.org/10.1177/0956797620960398"},
  espcrows:{t:"Earth Species Project (2025), How tiny biologgers are revealing the hidden communication of carrion crows", u:"https://earthspecies.org/2025/12/15/unlocking-avian-secrets-how-tiny-biologgers-are-revealing-the-hidden-communication-of-carrion-crows/"},
  mongabay:{t:"Mongabay (2026), From caws to code: AI helps decrypt animal communication", u:"https://news.mongabay.com/2026/05/from-caws-to-code-ai-helps-decrypt-animal-communication/"},
  crows:{t:"Marzluff and others (2010), Lasting recognition of threatening people by wild American crows, Animal Behaviour", u:"https://doi.org/10.1016/j.anbehav.2009.12.022"},
  pigs:{t:"Briefer and others (2022), Classification of pig calls produced from birth to slaughter, Scientific Reports", u:"https://doi.org/10.1038/s41598-022-07174-8"},
  literacy:{t:"Anti-literacy laws in the United States", u:"https://en.wikipedia.org/wiki/Anti-literacy_laws_in_the_United_States"},
  trials:{t:"Animal trials in medieval and early modern Europe", u:"https://en.wikipedia.org/wiki/Animal_trial"}
};

const SPECIES_INFO = {
  cet:{id:"cet", name:"Cetaceans", group:"Wildlife", plural:"whales", single:"whale",
    line:"Sperm whales in open ocean and coastal waters, and orcas held in US marine parks.",
    study:"a sperm whale family that researchers have followed for fifteen years", sources:[SRC.ceti]},
  bird:{id:"bird", name:"Birds", group:"Wild birds", plural:"crows", single:"crow",
    line:"American crows roosting on a university campus. Crows are among the first birds AI researchers are already trying to decode.",
    study:"a roost of 300 American crows on the Calder University campus, 50 of them wearing tiny audio tags", sources:[SRC.espcrows, SRC.mongabay, SRC.crows]},
  pet:{id:"pet", name:"Cats and dogs", group:"Companion animals", plural:"dogs and cats", single:"dog",
    line:"Dogs and cats taking part in the study from 60 family homes.",
    study:"dogs and cats living in 60 family homes", sources:[]},
  pig:{id:"pig", name:"Pigs", group:"Farmed animals", plural:"pigs", single:"pig",
    line:"Twenty pigs born on an industrial farm and now living at the research centre.",
    study:"twenty pigs born on an industrial farm and now living at the research centre", sources:[SRC.pigs]}
};

const ROLES = [
  {id:"scientist", group:"acad", title:"The scientist", name:"Dr. Rowan Ilunga", short:"Rowan", age:41,
    line:"Leads the lab that makes the breakthrough.",
    bio:["As a child, Rowan grew up near a river delta and recorded frog calls on an old phone. They studied linguistics, then moved into bioacoustics after hearing recordings of whale clicks at a student conference.",
         "For nine years they have led the animal-language lab at Calder University, a public university in the US. They feel responsible for the animals in the study, and they worry about who will use the results."]},
  {id:"activist", group:"adv", title:"The vegan animal activist", name:"Sasha Moreno", short:"Sasha", age:29,
    line:"Campaigns to end animal farming, with millions behind them.",
    bio:["Sasha went vegan at 16 after volunteering at a farm sanctuary, where they met a pig who had escaped from a transport truck.",
         "They now coordinate campaigns for the Animal Futures Coalition, an alliance of the largest US animal charities with millions of supporters. Advocates are one of the loudest voices in this debate. For years they have argued that animals suffer. Now they wonder what happens if the animals say something advocates did not expect."]},
  {id:"lobbyist", group:"ind", title:"The factory farming lobbyist", name:"Jules Hartmann", short:"Jules", age:47,
    line:"Speaks for the meat and dairy industry in Washington.",
    bio:["Jules grew up on a family dairy farm that was later bought by a large company. They studied agricultural economics and joined a national meat and dairy trade association in Washington, DC.",
         "They represent companies that employ hundreds of thousands of people and feed millions. They believe affordable food is a public good, and they fear the breakthrough could end their industry almost overnight."]},
  {id:"legislator", group:"pol", title:"The legislator", name:"Senator Noor Adeyemi", short:"Noor", age:52,
    line:"Chairs the Senate subcommittee that will write the rules.",
    bio:["Noor is a former environmental lawyer who now serves as a US senator and chairs a Senate subcommittee on technology and agriculture. They are known for careful, slow lawmaking.",
         "Now they must decide what US law should say about beings who can speak for themselves, while voters, farm states, AI companies and advocates all push them in different directions."]},
  {id:"billionaire", group:"bill", title:"The tech billionaire", name:"Kai Lindqvist", short:"Kai", age:38,
    line:"Founded an AI company working on interspecies communication.",
    bio:["Kai left a PhD in machine learning at 24 to found an AI company working on interspecies communication. The company releases its models openly for anyone to use, which made Kai a billionaire and a regular target of regulators.",
         "It is one of several firms that can now translate animals. *WAInderful* and *Sable Systems* keep their models closed. Kai believes open models keep power spread out. Now they must decide what that means when the models can talk to animals."]},
  {id:"animal", group:"ani", title:"The animal", name:"One of the animals in the study", short:"you", age:null,
    line:"You become one of the animals who can now be understood.",
    bio:["You become one of the animals in the study. Who you are depends on the species you choose next."],
    bySpecies:{
      cet:{name:"Coda-7", bio:["That is the research team's name for you. Your family calls you by a pattern of clicks humans cannot pronounce.","You are a young sperm whale. You live in a family group led by your grandmother, and you have grown up with research drones and underwater microphones around you."]},
      bird:{name:"Tally", bio:["The researchers named you after the tally marks they use to count your roost.","You are a two-year-old American crow. You remember every human who has ever trapped one of you, and you have told the others."]},
      pet:{name:"Pepper", bio:["You are a four-year-old mixed-breed dog, adopted from a shelter. You take part in the study from your family's home, with the family cat.","You know the rules of the house well, and you know that a treat comes after sitting."]},
      pig:{name:"Wren (lab ID 0412)", bio:["You were born on an industrial farm. At eight weeks old you were moved to the research centre with nineteen other pigs.","You still remember your mother and your siblings."]}
    }}
];

const THEMES = [
  {id:"verification", name:"Verifying translations", short:"Whether anyone can check that a translation is accurate", key:"w.accuracy"},
  {id:"misinformation", name:"Misinformation", short:"Fake or edited translations used to mislead people", key:"w.fakes"},
  {id:"surveillance", name:"Surveillance of animals", short:"Who is listening to animals, and how much", key:"w.surveillance"},
  {id:"records", name:"Animals' records", short:"Who holds what animals record about their own lives", key:"w.records"},
  {id:"reversibility", name:"Reversibility", short:"What happens to the new words if the translators go off", key:"w.revers"},
  {id:"access", name:"Access to translators", short:"Whether animals keep access once they have it", species:"access"},
  {id:"consent", name:"Consent to take part", short:"How the study animals were treated", key:"w.consent"},
  {id:"personhood", name:"Legal standing", short:"Whether animals can be heard in law", species:"status"},
  {id:"land", name:"Land claims", short:"Animals' claims to the places they live", key:"w.land"},
  {id:"children", name:"Children", short:"How children see animals, and whether generations clash", key:"w.children", key2:"w.generations"},
  {id:"food", name:"Food systems", short:"What happens to farming and what people eat", key:"w.food"},
  {id:"conflict", name:"Conflict", short:"Clashes between humans and animals, or among humans", key:"w.conflict", key2:"w.response"}
];

/* ---------- Prologue ---------- */
const FIRST_WORDS = {
  cet:[
    {id:"bay", label:"“Get out of our bay.”", readout:"[bay] [ours] [you] [leave]", themes:["land","consent"], set:[["s.first.says","rich"]], flags:{home:true}, out:"Shipping companies call their lawyers the same afternoon."},
    {id:"boats", label:"They ask how humans build boats and equipment that go underwater.", readout:"[you] [float] [how] · [you] [deep] [how]", themes:["surveillance","access"], set:[["s.first.says","rich"],["s.first.knowing","agency"]], out:"Navy officials ask the lab for a briefing."},
    {id:"listen", label:"They never speak to humans. The team only listens to their conversations.", readout:"[—] no words addressed to humans", themes:["consent","surveillance"], set:[["s.first.says","alien"]], flags:{factions:true}, out:"The team keeps listening. Some of them ask whether they should."}
  ],
  bird:[
    {id:"warn", label:"They warn each other about one researcher, by name.", readout:"[human] [net] [bad] · [tell] [all]", themes:["surveillance","consent"], set:[["s.first.says","rich"],["s.first.knowing","agency"]], out:"The researcher who handles the nets asks to move to another project."},
    {id:"trees", label:"They ask why the old trees by the river were cut down.", readout:"[trees] [gone] [why]", themes:["land"], set:[["s.first.says","rich"]], flags:{home:true}, out:"The campus grounds office receives 4,000 emails."},
    {id:"fly", label:"They only talk to each other. When a human speaks, they fly away.", readout:"[—] no words addressed to humans", themes:["consent"], set:[["s.first.says","alien"]], flags:{factions:true}, out:"The roost goes quiet whenever the team arrives."}
  ],
  pet:[
    {id:"noowner", label:"They say they don't want an owner.", readout:"[owner] [no]", themes:["personhood","consent"], set:[["s.first.says","rich"],["s.first.knowing","agency"]], out:"Pet owners do not take it well."},
    {id:"move", label:"They ask to go and live somewhere else.", readout:"[place] [other] [go]", themes:["land","personhood"], set:[["s.first.says","rich"]], flags:{home:true}, out:"Shelters get calls from owners asking what to do."},
    {id:"simple", label:"They ask to go out, and for food when they need it. They share no more complex thoughts.", readout:"[out] · [food] · [now]", themes:["verification"], set:[["s.first.says","immediate"]], out:"Skeptics say dogs always said this. Owners are delighted anyway."}
  ],
  pig:[
    {id:"left", label:"They ask about the other pigs who were left behind.", readout:"[others] [family] [where]", themes:["food","consent"], set:[["s.first.says","rich"],["s.first.knowing","suffering"]], out:"The team checks the farm's records. Some of the pigs' families are still there."},
    {id:"home", label:"They ask for the experiment to end and to be sent home.", readout:"[stop] [this] · [home] [go]", themes:["consent","land"], set:[["s.first.knowing","suffering"]], flags:{home:true}, out:"Nobody knows which home they mean: the farm, or somewhere before it."},
    {id:"stories", label:"They tell stories of how they have suffered in their lives.", readout:"[before] [pain] [small] [space] [bad]", themes:["food","records"], set:[["s.first.says","rich"],["s.first.knowing","suffering"]], out:"The team publishes three of the stories. The industry says the AI wrote them."}
  ]
};

/* What the animal character says, in its own voice (human roles never choose the animals' words). */
const OWN_WORDS = {
  bay:"Tell them: “Get out of our bay.”", boats:"Ask how humans build boats and machines that go underwater.", listen:"Say nothing to the humans. Talk only to your family.",
  warn:"Warn the others about one researcher, by name.", trees:"Ask why the old trees by the river were cut down.", fly:"Talk only to the other crows. When a human speaks, fly away.",
  noowner:"Say you don't want an owner.", move:"Ask to go and live somewhere else.", simple:"Ask to go out, and for food when you need it.",
  left:"Ask about the other pigs who were left behind.", home:"Ask for the experiment to end and to be sent home.", stories:"Tell the story of what you have suffered."
};
/* Engine assumption: how likely it is that some study animals refuse to talk, by species. */
const REFUSE_ODDS = {cet:0.7, bird:0.7, pet:0.3, pig:0.5};

const ROLE_PRESS = {
  activist:"You watch on your phone in a train station. Around you, strangers stop to watch too.",
  lobbyist:"You watch with the association's communications team. Nobody speaks until it ends.",
  legislator:"Your chief of staff turns up the volume in the subcommittee room. By the end, three colleagues have texted you.",
  billionaire:"You watch with your engineers. Before it ends, they say they can match it.",
  animal:"You notice more humans than usual, and more machines, all pointed at you."
};

function prologue(i, c){
  if(i===0) return {id:"P1", kind:"info", title:"The breakthrough", themes:["verification","records"],
    sources:c.sp.sources.concat([SRC.esp]),
    body:[
      `It is 2030. A team at Calder University, working with *WAInderful*, the biggest AI company in the world, announces a result many thought impossible. Their AI can translate the communication of ${c.pl} into basic human speech, and human speech back again.`,
      "Researchers call this condition 1. The AI does not only listen to animals and decode what they say. It can talk back, and ask them questions.",
      c.role==="billionaire"
        ? "Within days, two more firms say they can do the same. *Sable Systems*, which sells AI to defense agencies, keeps its models closed. The company you founded, which has worked on interspecies communication for years, says it will release its models openly, as it always does."
        : "Within days, two more firms say they can do the same. *Sable Systems*, which sells AI to defense agencies, keeps its models closed. The company founded by the billionaire Kai Lindqvist, which has worked on interspecies communication for years, says it will release its models openly, as it always does.",
      "For now, only words and simple concepts come through, not full sentences. Animals can grasp some human concepts through it: rules (rather than laws), ownership, good and bad, family, and money as a condition, the way a treat follows sitting.",
      "Researchers expect the next step within five years, and call it condition 2. AI will design new words that animals can learn, so they can reason beyond what their own calls allow, and simple tools will let them record their thoughts, the way people use pen and paper.",
      "Nobody can yet check whether the translations are accurate. The team says the words are the animals' own. Critics say the AI fills the gaps with human ideas. Nobody in this world will find out for certain, and neither will you."
    ]};
  if(i===1){
    if(c.role==="scientist") return {id:"P2", kind:"choice", title:"How does the world find out?", themes:["verification","misinformation"], sources:[],
      body:["The results are ready. *WAInderful* wants a press conference. Your department head wants a paper. Two rival labs have asked for the data."],
      question:"What do you do first?",
      choices:[
        {id:"paper", label:"Publish a peer-reviewed paper first.", queue:[["w.accuracy","genuine",1],["w.fakes","rare",1]], out:"The paper takes four months. Journalists quote the abstract, mostly correctly."},
        {id:"press", label:"Hold a press conference with *WAInderful*.", queue:[["w.fakes","caught",2],["s.first.belief","high",1]], out:"The clips are everywhere within the hour, and so are the edits."},
        {id:"labs", label:"Share the data quietly with other labs so they can check it.", queue:[["w.accuracy","genuine",2],["w.openness","open",1]], out:"Two labs confirm the basic result before the news breaks."}
      ]};
    return {id:"P2", kind:"info", title:"The press conference", themes:["misinformation"], sources:[],
      body:[`The university and *WAInderful* hold a press conference. Within an hour, recordings of ${c.pl} and their translations are everywhere.`, ROLE_PRESS[c.role]]};
  }
  if(i===2){
    // Whether the study animals want to talk is theirs to decide, so the world decides it, not a human player.
    const someRefuse = global.Engine.mulberry32((c.seed|0)*31 + 7)() < REFUSE_ODDS[c.first];
    const auto = someRefuse ? {flags:{factions:true}, queue:[["w.consent","contested",1,"Not every study animal wants to talk"]]} : {};
    if(c.isAnimal) return {id:"P3", kind:"choice", title:"Do you want to talk?", themes:["consent"], sources:[], auto,
      body:[`The translator is switched on for you and the other ${c.pl} in the study.`,
        someRefuse ? "Some of the others turn away whenever a human speaks." : "The others seem willing to talk, at least for now."],
      question:"Do you want to talk to the humans?",
      choices:[
        {id:"talk", label:"Yes. Talk to them.", queue:[["s.first.belief","high",1]], out:"The humans lean in. Every sound you make is recorded."},
        {id:"away", label:"No. Turn away.", flags:{factions:true}, queue:[["w.consent","contested",1],["s.first.knowing","agency",1]], out:"The team writes down your refusal. They are not sure yet what it means."}
      ]};
    return {id:"P3", kind:"info", title:"Who wants to talk?", themes:["consent"], sources:[], auto,
      body:[`The translator is switched on for the study: ${c.sp.study}.`,
        someRefuse ? `Not all of the ${c.pl} want to talk. Some turn away whenever a human speaks, and the team has to decide what a refusal means.`
                   : `All of the ${c.pl} in the study seem willing to talk, at least for now. The researchers are relieved, and the data come fast.`]};
  }
  if(i===3){
    if(c.isAnimal) return {id:"P4", kind:"choice", title:"First words", themes:[], sources:c.sp.sources,
      body:["The first translations arrive word by word. The humans wait for you to speak."],
      question:"What do you say first?",
      choices:FIRST_WORDS[c.first].map(fw=>Object.assign({}, fw, {label:OWN_WORDS[fw.id]}))};
    // What the animals say is theirs to decide, so the world decides it for human players.
    const fw = FIRST_WORDS[c.first][Math.floor(global.Engine.mulberry32((c.seed|0)*53 + 11)()*3)];
    return {id:"P4", kind:"info", title:"First words", themes:fw.themes, sources:c.sp.sources,
      auto:{set:fw.set, flags:fw.flags},
      body:["The first translations arrive word by word.", fw.label, fw.out], readout:fw.readout};
  }
  return null;
}

/* ---------- Level scenes ---------- */
const CHECK = {
  cet:"A whale reports where a calf was born before the drones had found it, and the team confirms it.",
  bird:"A crow names the researcher who trapped it two years ago, and the lab's records agree.",
  pet:"A dog reports where a lost toy is hidden in the house, and the owner finds it there.",
  pig:"A pig reports which of the twenty was taken from the farm first, a detail only the farm's records show."
};
const CLIP = {
  pig:"In it, a pig on a farm appears to say it is happy to be eaten.",
  cet:"In it, a whale appears to threaten the crew of a fishing boat.",
  bird:"In it, crows appear to name a woman who has been poisoning them, and to give her street.",
  pet:"In it, a dog appears to say that its owner hits it. The owner's face is visible."
};
const NEWWORDS = {
  pig:"At the research centre, the twenty pigs learn the new words within weeks. Some start recording what they remember from the farm.",
  cet:"The whale family in the study starts using click patterns the AI suggested, and teaching them to the calves.",
  bird:"The crows on campus pick up the new words faster than any other species. They start leaving recorded warnings for each other.",
  pet:"In the study homes, dogs and cats start recording messages for their owners, and for each other."
};
const BLOC = {
  cet:"Whales gather near the same shipping lanes on the same days.",
  bird:"Crows carry calls from park to park across whole cities.",
  pet:"Dogs across a city refuse commands on the same morning.",
  pig:"Pigs at sanctuaries go silent together."
};
const CLAIMS = {
  cet:"Whales ask ships to stay out of a calving bay.",
  bird:"Crows ask for a stand of old trees to be left standing.",
  pet:"Some dogs ask to live somewhere other than their owners' homes.",
  pig:"Pigs at the research centre and in sanctuaries ask to go home. Nobody knows where they mean."
};
const lostList = c => c.act.filter(sp=>c.s[sp].access!=="kept");
const anyAct = (c, f) => c.act.some(f);

const SCENES = {
verify:{id:"verify", title:"Is it real?", themes:["verification","consent"], sources:[SRC.esp],
  body:c=>[
    `The morning after the announcement, every news channel runs the same clip: a ${c.sg} call, then a line of text underneath. By noon the argument has started. Is the AI translating, or making things up?`,
    `Some reports can be checked. ${CHECK[c.first]} Reports about pain, fear or wishes cannot be checked the same way, and those are the ones that matter most.`,
    {full:"Early polls say most people trust what the animals report about their feelings.", partial:"Early polls say most people trust the reports they can check, but not the ones about feelings.", refused:"Early polls say most people will not trust any report about feelings, however good the checkable ones are."}[c.w.carryover]
  ],
  frame:{
    scientist:"Your phone has not stopped since 5 a.m. Journalists want a yes or no. Other labs want your data.",
    activist:"The coalition's group chat is exploding. Some want to launch a campaign today. Others say wait until the science settles.",
    lobbyist:"The association's board meets at 8 a.m. The only item on the agenda: what do we say, and how fast?",
    legislator:"Your staff have drafted three statements: welcoming, cautious, and silent. Reporters are outside your office.",
    billionaire:"Your engineers say they can match the result in weeks. Your board wants to know whether you will release it openly, as you always have.",
    animal:"The translator is on. Humans keep asking you the same questions, again and again, as if testing you."
  },
  question:"What do you do first?",
  choices:{
    scientist:[
      {id:"a", label:"Release the full data so other labs can test it.", move:"validate", push:[["w.accuracy","genuine",2],["w.openness","open",1]], out:"Three labs start replicating within the week. Critics now have the data too."},
      {id:"b", label:"Say clearly what the AI can and cannot show.", move:"validate", push:[["w.carryover","partial",3],["w.fakes","rare",1]], out:"Your caution earns trust from other scientists, and bores the press."},
      {id:"c", label:"Keep the data in the lab until the paper is peer reviewed.", move:"protect", push:[["w.openness","closed",2],["w.fakes","caught",1]], out:"The paper will take months. Rumors fill the gap."}],
    activist:[
      {id:"a", label:"Launch a campaign today: “They told us. Now listen.”", move:"push", push:[["s.first.belief","high",3],["w.fakes","caught",1]], out:"Millions share it. Skeptics call it the advocates' AI."},
      {id:"b", label:"Hold back until independent labs confirm the result.", move:"careful", push:[["w.accuracy","genuine",1]], out:"Some supporters call you timid. Scientists start returning your calls."},
      {id:"c", label:"Demand an independent review of how the study animals are treated.", move:"careful", push:[["w.consent","well",3]], out:"The university agrees to an outside review of the study animals' care."}],
    lobbyist:[
      {id:"a", label:"Call it AI ventriloquism, on every channel.", move:"deny", push:[["w.accuracy","projection",3],["s.pig.belief","low",1]], out:"“The machine wrote it” is trending by evening."},
      {id:"b", label:"Fund your own scientists to test the claim.", move:"deny", push:[["w.accuracy","useful",2]], out:"Your scientists will take a year. A year of doubt suits your members."},
      {id:"c", label:"Ask members quietly what their barns would sound like.", move:"restrictRec", push:[["w.surveillance","research",2]], out:"Some members say they would rather not know. Others ask for legal advice."}],
    legislator:[
      {id:"a", label:"Announce Senate hearings on how to verify translations.", move:"regulate", push:[["w.carryover","partial",2],["w.fakes","rare",1]], out:"Hearings are set for next month. Everyone starts preparing testimony."},
      {id:"b", label:"Say nothing. It is too early.", move:"stall", push:[], out:"Your silence is noticed by both sides, and read differently by each."},
      {id:"c", label:"Call for a pause on new animal translation studies.", move:"restrict", push:[["w.response","restricted",3],["w.consent","well",1]], out:"Labs protest. The industry quietly applauds."}],
    billionaire:[
      {id:"a", label:"Promise that your company's version will be open to everyone.", move:"open", push:[["w.accuracy","genuine",1]], out:"Thousands of developers sign up for early access."},
      {id:"b", label:"Offer the university free computing power to check the result.", move:"quiet", push:[["w.accuracy","genuine",2],["w.openness","both",1]], out:"The university accepts. *WAInderful* is not pleased."},
      {id:"c", label:"Talk to *Sable Systems* about defense uses, quietly.", move:"defense", push:[["w.military","suspected",2]], out:"*Sable Systems* is interested. So, it turns out, is the Pentagon."}],
    animal:[
      {id:"a", label:"Answer every question patiently.", move:"engage", push:[["s.first.belief","high",2],["w.accuracy","genuine",1]], out:"The researchers start to trust your answers, and to ask harder questions."},
      {id:"b", label:"Stop answering the same question twice.", move:"refuse", push:[["w.consent","contested",2],["s.first.knowing","agency",2]], out:"The team writes in its notes: refusal may itself be evidence."},
      {id:"c", label:"Ask a question back: why do you want to know?", move:"negotiate", push:[["w.accuracy","genuine",1],["s.first.says","rich",2]], out:"Your question goes viral. Nobody agrees on what it means."}]
  }},

clip:{id:"clip", title:"The clip", themes:["misinformation"], sources:[],
  body:c=>[
    `A week in, one video spreads faster than anything else. ${CLIP[c.first]}`,
    "Nobody can tell yet whether the clip is real, edited, or made from scratch. " + ({open:"Open models make it easy to produce a translation at home, so fakes are cheap.", closed:"The closed models are hard to reach, so whoever made it had help.", both:(c.role==="billionaire" ? "Your company's open model" : "The open model from Kai Lindqvist's company") + " runs on any laptop, so anyone could have made it."}[c.w.openness]),
    "Some people suspect the industry. Others suspect advocates. " + (c.w.fakes==="rare" ? "It is the first fake anyone has noticed." : "It is not the first fake this week.")
  ],
  frame:{
    scientist:"Reporters send you the clip and ask whether it is real. Your team could check it against raw recordings, if any exist.",
    activist:"Some of your own supporters are sharing the clip. A few ask why you are not.",
    lobbyist:"Members are forwarding the clip to you. One asks whether the association should share it too.",
    legislator:"Colleagues want to know whether to quote the clip in tomorrow's floor speeches.",
    billionaire:"The clip was made with an open model. Possibly yours.",
    animal:"The humans show you a clip of another animal like you. You do not recognize the voice."
  },
  question:"What do you do about the clip?",
  choices:{
    scientist:[
      {id:"a", label:"Publish a method anyone can use to check a translation against the raw audio.", move:"validate", push:[["w.fakes","caught",3]], out:"Fact-checkers adopt it within days. Fakes keep coming, but more get caught."},
      {id:"b", label:"Say only that the clip is not from your study.", move:"validate", push:[["w.fakes","caught",1]], out:"True, and almost nobody hears it over the noise."},
      {id:"c", label:"Stay out of it. Commenting gives it oxygen.", move:"protect", push:[["w.fakes","widespread",2]], out:"The clip reaches 80 million views without a scientist's word on it."}],
    activist:[
      {id:"a", label:"Debunk it, even if it would help your side.", move:"careful", push:[["w.fakes","caught",2],["w.accuracy","genuine",1]], out:"Journalists start to trust you. Some supporters stop."},
      {id:"b", label:"Share it, labeled “unverified”.", move:"push", push:[["w.fakes","widespread",3],["s.first.belief","high",1]], out:"It travels twice as fast with your label attached."},
      {id:"c", label:"Ask platforms to label every animal translation.", move:"partner", push:[["w.fakes","caught",2],["w.surveillance","commercial",1]], out:"Platforms agree, and start logging every translation anyone shares."}],
    lobbyist:[
      {id:"a", label:"Share it and let the public decide.", move:"deny", push:[["w.fakes","widespread",3],["w.accuracy","projection",1]], out:"Its reach doubles. So does the suspicion that your side made it."},
      {id:"b", label:"Say every translation could be as unreliable as this one.", move:"deny", push:[["w.accuracy","projection",2]], out:"“If one is fake, they all could be” becomes the line of the week."},
      {id:"c", label:"Keep the association well away from it.", move:"rebrand", push:[["w.fakes","caught",1]], out:"You stay clean, and a little behind the story."}],
    legislator:[
      {id:"a", label:"Introduce a bill making fake animal translations a crime.", move:"regulate", push:[["w.fakes","caught",3],["w.surveillance","commercial",1]], out:"To enforce it, companies will have to log translations. Privacy groups object."},
      {id:"b", label:"Quote the clip in a floor speech.", move:"stall", push:[["w.fakes","widespread",2]], out:"Your speech goes viral. The clip is debunked two days later."},
      {id:"c", label:"Say nothing until it has been checked.", move:"stall", push:[], out:"Nothing happens, which in Washington is also a decision."}],
    billionaire:[
      {id:"a", label:"Add a hidden watermark to every translation your models make.", move:"open", push:[["w.fakes","caught",3],["w.surveillance","commercial",1]], out:"Watermarks help catch fakes, and let anyone trace who translated what."},
      {id:"b", label:"Say tools are neutral and people are responsible.", move:"open", push:[["w.fakes","widespread",2]], out:"Your engineers cheer. Regulators take note."},
      {id:"c", label:"Limit the open model to verified developers.", move:"quiet", push:[["w.openness","both",3],["w.fakes","caught",1]], out:"Open-source purists call it a betrayal. Fakes slow down."}],
    animal:[
      {id:"a", label:"Tell the humans: that is not one of us.", move:"engage", push:[["w.fakes","caught",1],["w.accuracy","genuine",1]], out:"Your denial is translated, shared, and doubted."},
      {id:"b", label:"Ignore it. Human arguments are not your concern.", move:"refuse", push:[], out:"The humans argue about you without you."},
      {id:"c", label:"Ask the humans who made it.", move:"negotiate", push:[["s.first.says","rich",1],["w.fakes","caught",1]], out:"The question lands in a room full of people with different answers."}]
  }},

listen:{id:"listen", title:"Who is listening?", themes:["surveillance","records"], sources:[SRC.aggag],
  body:c=>[
    "A month in, listening devices are everywhere. *WAInderful* sells a home device that translates pets around the clock. *Sable Systems* offers “acoustic monitoring” to the Navy and to large farms. " + (c.role==="billionaire" ? "Your company's open model runs on any phone." : "The open model from Kai Lindqvist's company runs on any phone."),
    `Every translation is recorded somewhere. The recordings of the ${c.pl} in the study are now among the most sought-after data in the world.` + (c.w.surveillance==="commercial" ? " Commercial listening has already started." : ""),
    "A federal agency writes to the university asking for copies of everything, “for national security review”."
  ],
  frame:{
    scientist:"*WAInderful* wants exclusive rights to the study recordings. The agency wants copies. Nobody has asked the animals.",
    activist:"An allied group wants to put listening devices on farms to document conditions.",
    lobbyist:"Members are worried. If a pig can be recorded, so can a barn.",
    legislator:"Three bills land on your desk: one bans recording on farms, one licenses listening devices, and one bans selling animal voice data.",
    billionaire:"Your company could release a free app that lets anyone listen to any animal.",
    animal:"You notice new devices near you. The humans seem to be listening even when they are not talking to you."
  },
  question:"Who should hold the recordings, and who gets to listen?",
  choices:{
    scientist:[
      {id:"a", label:"Refuse both. The recordings stay in the lab.", move:"protect", push:[["w.records","researchers",3],["w.military","none",1]], out:"The agency's letter is polite. The next one is less polite."},
      {id:"b", label:c=>`Ask the ${c.pl} who may hear their recordings, and follow their answer.`, move:"protect", push:[["w.records","animals",3],["w.consent","well",1]], out:c=>`Most of the ${c.pl} want strangers kept out. You are not sure how to enforce that.`},
      {id:"c", label:"Publish everything in an open archive.", move:"validate", push:[["w.records","open",3],["w.accuracy","genuine",1]], out:"Researchers everywhere can check your work. So can anyone else."}],
    activist:[
      {id:"a", label:"Put listening devices on farms to document conditions.", move:"push", push:[["w.surveillance","commercial",2],["w.records","open",1],["w.carryover","full",1]], out:"The first farm recordings are hard to listen to. In several states they are also illegal."},
      {id:"b", label:"Campaign against listening devices in animals' homes.", move:"careful", push:[["w.surveillance","research",3]], out:"You find unexpected allies among privacy groups."},
      {id:"c", label:"Demand that the recordings belong to the animals.", move:"push", push:[["w.records","animals",2]], out:"Lawyers say animals cannot own anything. You say that is the point."}],
    lobbyist:[
      {id:"a", label:"Lobby to extend ag-gag laws to translators.", move:"restrictRec", push:[["w.surveillance","research",2],["s.pig.access","partly",2]], out:"Several states already ban filming on farms. Adding translators takes one amendment."},
      {id:"b", label:"Get members to buy monitoring from *Sable Systems* for their barns.", move:"rebrand", push:[["w.surveillance","commercial",3]], out:"Your members now hear everything in their barns. So do the servers at *Sable Systems*."},
      {id:"c", label:"Urge the agency to take custody of the study recordings.", move:"deny", push:[["w.records","seized",3],["w.military","suspected",1]], out:"The agency is happy to help. Its reasons are not the same as yours."}],
    legislator:[
      {id:"a", label:"Introduce a bill to license listening devices, like radio transmitters.", move:"regulate", push:[["w.surveillance","research",3],["w.openness","closed",1]], out:"Licensing slows the market and favors the biggest companies."},
      {id:"b", label:"Introduce a bill banning the sale of animal voice data.", move:"regulate", push:[["w.surveillance","research",2],["w.records","researchers",1]], out:"Companies start giving the data away instead."},
      {id:"c", label:"Let the market decide for now.", move:"stall", push:[["w.surveillance","commercial",3]], out:"By next quarter, one in five US homes has a listening device."}],
    billionaire:[
      {id:"a", label:"Release a free listening app built on your open model.", move:"open", push:[["w.surveillance","commercial",3]], out:"Fifty million downloads in a week. Nobody controls what gets recorded."},
      {id:"b", label:"Sell a premium pet translator.", move:"pets", push:[["w.surveillance","commercial",1],["s.pet.belief","high",1]], out:"It sells out by Friday."},
      {id:"c", label:"Sell monitoring to defense agencies.", move:"defense", push:[["w.military","suspected",3],["w.surveillance","mass",1]], out:"The contract is classified. The rumors are not."}],
    animal:[
      {id:"a", label:"Stay away from the places where the devices are.", move:"refuse", push:[["s.first.knowing","agency",2],["w.surveillance","research",1]], out:c=>`The researchers notice the ${c.pl} avoiding certain places. They do not know why.`},
      {id:"b", label:"Ask the humans to turn the devices off.", move:"negotiate", push:[["w.surveillance","research",2],["w.consent","well",1]], out:"Some devices go dark. You cannot tell which."},
      {id:"c", label:"Use the devices to reach more humans.", move:"engage", push:[["s.first.belief","high",2],["w.surveillance","commercial",1]], out:"More humans hear you. More of them listen without asking."}]
  }},

words:{id:"words", title:"New words", themes:["records","reversibility","consent"], sources:[SRC.literacy],
  body:c=>[
    `A year after the breakthrough, the other species are translated too: ${c.list(c.others)}.`,
    "The next step arrives early. AI systems design new words that animals can learn: words for “tomorrow”, “if” and “we”. With simple recording tools, animals can keep their own records, the way people use pen and paper. This is condition 2. It reaches every translated species between now and 2035.",
    "Whoever designs the vocabulary shapes what can be said in it. Critics ask whose thoughts the animals will be thinking. Nobody can show where the animal ends and the AI begins.",
    NEWWORDS[c.first]
  ],
  frame:{
    scientist:c=>`Your lab is first in line for the new vocabulary. The ${c.pl} will be able to record what they remember. You must decide who holds those records.`,
    activist:"For the first time, animals could testify about farms, labs and homes. Your coalition must decide what to do with that.",
    lobbyist:"If animals can keep records, every barn becomes evidence.",
    legislator:"There is no law on who owns an animal's record of its own life.",
    billionaire:"Your company could release the new vocabulary openly, for every species at once.",
    animal:"The new words let you say things you could not say before: “before”, “later”, “we”. And you can keep what you say."
  },
  question:"Who keeps the animals' records?",
  choices:{
    scientist:[
      {id:"a", label:c=>`Give the ${c.pl} their own recording tools, and keep no copies.`, move:"protect", push:[["w.records","animals",3],["w.revers","lasting",1]], out:c=>`The ${c.pl} start recording each other. You can no longer read everything they keep.`},
      {id:"b", label:"Keep the records in the lab, for the animals' protection.", move:"protect", push:[["w.records","researchers",3]], out:"The archive grows in your office. So does your worry about who might come for it."},
      {id:"c", label:"Pause the new words until the animals can agree to them.", move:"ethicists", push:[["w.consent","well",2],["w.revers","reversible",2]], out:"Other labs do not pause. Your study animals are among the few without the new words."}],
    activist:[
      {id:"a", label:"Collect the animals' testimony about farms, labs and homes.", move:"push", push:[["w.records","open",2],["w.carryover","full",2]], out:"The first testimonies are hard to read. The industry calls them coached."},
      {id:"b", label:"Campaign for animals to control who sees their records.", move:"careful", push:[["w.records","animals",3]], out:"It becomes a rallying cry: their words, their records."},
      {id:"c", label:"Push to extend the new words to chickens.", move:"chickens", push:[["w.chicken","claimed",2]], out:"Chicken charities are ready. No lab is, yet."}],
    lobbyist:[
      {id:"a", label:"Lobby to make farm recordings trade secrets.", move:"restrictRec", push:[["s.pig.access","partly",2],["w.surveillance","research",1]], out:"Several farm states pass it within months."},
      {id:"b", label:"Argue that AI-designed words mean AI thoughts, not animal thoughts.", move:"deny", push:[["w.accuracy","projection",3]], out:"It is your strongest argument yet. Some philosophers agree with you."},
      {id:"c", label:"Start investing in alternative proteins, quietly.", move:"pivot", push:[["w.food","reformed",1]], out:"Your board calls it insurance."}],
    legislator:[
      {id:"a", label:"Write a bill: an animal's records belong to the animal, held by a guardian.", move:"standing", push:[["w.records","animals",3],["s.first.status","guardian",2]], out:"The bill borrows from how courts handle records for children."},
      {id:"b", label:"Back a bill letting agencies seize records that touch national security.", move:"restrict", push:[["w.records","seized",4],["w.military","suspected",1]], out:"Researchers start keeping fewer records, and hiding some."},
      {id:"c", label:"Stall. Nobody knows what these records are yet.", move:"stall", push:[], out:"The records pile up with no rules at all."}],
    billionaire:[
      {id:"a", label:"Release the new vocabulary openly, for every species.", move:"open", push:[["w.revers","spreads",3],["w.records","animals",1]], out:"Within a month, animals no lab has met are learning words from strangers' phones."},
      {id:"b", label:"Release it for pets only.", move:"pets", push:[["s.pet.belief","high",2],["s.pig.access","partly",1]], out:"Pet owners love it. Farm animals are left out."},
      {id:"c", label:"Keep it closed until you understand the risks.", move:"quiet", push:[["w.openness","closed",2]], out:"*WAInderful* and *Sable Systems* fill the gap."}],
    animal:[
      {id:"a", label:"Keep records of everything that has happened to you.", move:"engage", push:[["w.records","animals",3],["s.first.knowing","suffering",1],["s.first.collective","group",1]], out:c=>c.first==="pig" ? "Your records begin with the day you were taken from your mother." : "Your records begin with your earliest memory."},
      {id:"b", label:"Teach the new words to others who were never in the study.", move:"negotiate", push:[["w.revers","spreads",3],["s.first.collective","group",2]], out:c=>`The researchers notice ${c.pl} outside the study using the new words.`},
      {id:"c", label:"Refuse the new words.", move:"refuse", push:[["w.consent","contested",2],["s.first.access","partly",1]], out:"Some of you take the words anyway. The group splits."}]
  }},

switch:{id:"switch", title:"The off switch", themes:["access","reversibility"], sources:[],
  hint:"Comes up when the translators face a crackdown, or around 2035 if nothing else is more pressing.",
  eligible:(c,t)=>t>=5,
  priority:c=>{
    const pressure = c.w.response!=="adoption" || c.g.pol==="restrict" || lostList(c).length>0 || c.w.conflict!=="none" || c.w.military!=="none";
    return pressure ? 92 : 58;
  },
  body:c=>{
    const lost = lostList(c);
    return [
      c.w.response==="suppressed" ? "Federal agencies have already started switching translators off. A bill in Congress would make it permanent."
        : (c.w.response==="restricted" || c.g.pol==="restrict") ? "A bill in Congress would cut animals' access to translators. Its supporters call it a pause."
        : "*Sable Systems* tells Congress that every translator should have an off switch, in case animals organize. The idea gains support fast.",
      {reversible:"Scientists are split on what switching off would do. So far, animals without devices seem to lose the new words.",
       lasting:"Scientists warn it may not undo much. Animals who learned the new words still use them with each other, devices or not.",
       spreads:"Scientists warn it would undo almost nothing. The words are spreading from animal to animal, beyond any device, and beyond what humans can read."}[c.w.revers],
      lost.length ? `${c.listNames(lost)} have already lost some access.` : "So far, every translated species still has access."
    ];
  },
  frame:{
    scientist:"Your study animals would lose the tools they use to talk to you, and perhaps to each other.",
    activist:"Switching off would silence the only witnesses to what happens on farms.",
    lobbyist:"An off switch would end the testimony problem, if it works.",
    legislator:"The bill needs your subcommittee's vote to reach the floor.",
    billionaire:"Your company's models are on hundreds of millions of phones. You cannot recall them. You could stop updating them.",
    animal:"The humans are talking about taking the words away."
  },
  question:"Should the translators be switched off?",
  choices:{
    scientist:[
      {id:"a", label:"Testify that switching off would not undo what animals have learned.", move:"ethicists", push:[["s.*.access","kept",2],["w.revers","lasting",1]], out:"Your testimony makes the bill look pointless, and the animals look harder to control."},
      {id:"b", label:"Propose a middle path: access stays, under supervision.", move:"validate", push:[["s.*.access","partly",2],["w.response","restricted",1]], out:"Both sides call it a compromise. Neither likes it."},
      {id:"c", label:"Comply quietly, and lock the animals' records away.", move:"protect", push:[["s.first.access","removed",2],["w.records","researchers",2]], out:"Your lab goes quiet. The records stay in a locked room."}],
    activist:[
      {id:"a", label:"Fight the bill with a national campaign.", move:"push", push:[["s.*.access","kept",2],["w.conflict","polarization",1]], out:"Millions march. So do counter-protesters."},
      {id:"b", label:"Help animals keep using translators illegally.", move:"push", push:[["w.revers","spreads",2],["w.response","suppressed",1]], out:"Underground translators spread. So do arrests."},
      {id:"c", label:"Negotiate: animals in sanctuaries keep access.", move:"careful", push:[["s.*.access","partly",2]], out:"Animals in sanctuaries keep their voices. Animals on farms do not."}],
    lobbyist:[
      {id:"a", label:"Back the switch-off for farm animals only.", move:"deny", push:[["s.pig.access","removed",3],["w.response","restricted",1]], out:"The pig translators go dark on farms. The barns go quiet, at least to human ears."},
      {id:"b", label:"Back a total switch-off, for every species.", move:"deny", push:[["s.*.access","removed",2],["w.response","suppressed",2]], out:"Pet owners are furious. You had not counted on them."},
      {id:"c", label:"Stay out of it. The industry looks bad either way.", move:"rebrand", push:[], out:"You let others take the heat."}],
    legislator:[
      {id:"a", label:"Back the switch-off and move it out of your subcommittee.", move:"restrict", push:[["s.*.access","removed",4],["w.response","suppressed",3]], out:"With your support, the bill passes. Translators go dark across the country."},
      {id:"b", label:"Block it, and propose a guardian system instead.", move:"standing", push:[["s.*.access","kept",3],["s.*.status","guardian",2]], out:"Courts start appointing guardians for animals who ask for one."},
      {id:"c", label:"Stall it in committee.", move:"stall", push:[], out:"The bill dies quietly. The question does not."}],
    billionaire:[
      {id:"a", label:"Keep updating the open models, whatever the law says.", move:"open", push:[["s.*.access","kept",2],["w.response","suppressed",1]], out:"Your models stay on every phone. Your lawyers get busy."},
      {id:"b", label:"Build the off switch and sell it to the government.", move:"defense", push:[["s.*.access","partly",3],["w.military","suspected",1]], out:"The switch works on new devices. Older phones still run the old models."},
      {id:"c", label:"Stop updates, but leave existing models alone.", move:"quiet", push:[["w.revers","lasting",2]], out:"The models freeze. The animals keep talking on old phones."}],
    animal:[
      {id:"a", label:"Teach the words to others, so they cannot be taken away.", move:"resist", push:[["w.revers","spreads",3],["s.first.collective","movement",2]], out:"The words travel faster than any law."},
      {id:"b", label:"Send a messenger to ask the humans to keep the translators on.", move:"negotiate", push:[["s.first.access","kept",2],["s.first.belief","high",1]], out:"Your messenger picks a human carefully: the one most likely to listen."},
      {id:"c", label:"Stop talking to humans.", move:"refuse", push:[["s.first.knowing","agency",2]], out:"Your silence is louder than anything you said."}]
  }},

bloc:{id:"bloc", title:"One voice", themes:["access","conflict"], sources:[],
  hint:"Comes up once any species loses access to translators and the animals start acting as one group.",
  eligible:(c,t)=>t>=5 && c.w.bloc==="united",
  priority:()=>100,
  body:c=>{
    const lost = lostList(c);
    return [
      `Since ${lost.length ? c.list(lost) : "the first animals"} lost access to translators, something has changed. Animals that never spoke to each other now seem to coordinate across species.`,
      c.act.map(sp=>BLOC[sp]).join(" "),
      "Researchers call it a bloc. The industry calls it a threat. Nobody can tell whether the animals are coordinating, or whether humans are seeing patterns that are not there."
    ];
  },
  frame:{
    scientist:"Your data show coordinated behavior. Publishing could protect the animals, or justify a crackdown.",
    activist:"For the first time, the animals seem to be running their own campaign.",
    lobbyist:"Barns report “synchronized refusals”. Members are frightened.",
    legislator:"Some colleagues call it an uprising. Others call it a petition.",
    billionaire:"Your models are how the animals coordinate. Investors want you to stop it.",
    animal:"The other animals are listening to each other now. They want to know what you will do."
  },
  question:"How do you respond to the animals acting as one?",
  choices:{
    scientist:[
      {id:"a", label:"Publish your data: this looks like a petition, not a threat.", move:"ethicists", push:[["w.conflict","polarization",1],["s.*.status","guardian",1]], out:"“Petition” sticks in some newspapers. “Threat” sticks in others."},
      {id:"b", label:"Brief the government privately.", move:"validate", push:[["w.response","suppressed",2],["w.military","suspected",1]], out:"The briefing is classified. Your name is on it."},
      {id:"c", label:"Ask the animals what they want, and publish the answer.", move:"validate", push:[["w.land","contested",2],["s.*.access","kept",1]], out:"They ask for three things: their tools back, their records, and some places left alone."}],
    activist:[
      {id:"a", label:"Back the animals' demands, whatever they are.", move:"push", push:[["w.conflict","polarization",2],["s.*.access","kept",1]], out:"Your coalition splits. Some call it solidarity, some call it danger."},
      {id:"b", label:"Act as interpreters: carry the animals' demands to Congress.", move:"careful", push:[["s.*.status","guardian",2]], out:"You become the animals' lobbyists. It is a strange job."},
      {id:"c", label:"Urge calm, on both sides.", move:"careful", push:[["w.conflict","none",2]], out:"Calm does not make headlines. It helps anyway."}],
    lobbyist:[
      {id:"a", label:"Call for culls of animals that coordinate.", move:"deny", push:[["w.conflict","confrontation",3],["s.pig.welfare","worse",2]], out:"The word “cull” changes the debate overnight."},
      {id:"b", label:"Negotiate: better conditions in exchange for an end to refusals.", move:"rebrand", push:[["s.pig.welfare","better",2],["w.food","reformed",1]], out:"It is the first deal between an industry and its animals. Nobody knows how to enforce it."},
      {id:"c", label:"Move your members toward alternative proteins.", move:"pivot", push:[["w.food","reformed",2]], out:"Your board finally agrees. Some members never forgive you."}],
    legislator:[
      {id:"a", label:"Hear the animals' messengers in a public hearing.", move:"standing", push:[["s.*.status","guardian",3],["w.conflict","none",1]], out:"The first nonhuman testimony before Congress, through a translator nobody can verify."},
      {id:"b", label:"Restore access in exchange for an end to coordinated refusals.", move:"regulate", push:[["s.*.access","partly",3]], out:"The deal mostly holds."},
      {id:"c", label:"Call it a security threat and ask federal agencies to step in.", move:"restrict", push:[["w.conflict","confrontation",3],["w.response","suppressed",2]], out:"Federal agencies take over. Researchers lose access to their own study animals."}],
    billionaire:[
      {id:"a", label:"Keep the models running. This is what open means.", move:"open", push:[["s.*.collective","movement",1],["w.conflict","polarization",1]], out:"Your company becomes the animals' infrastructure, whether you like it or not."},
      {id:"b", label:"Cut the open models off from the animals' networks.", move:"quiet", push:[["s.*.collective","group",2]], out:"The animals route around it within weeks."},
      {id:"c", label:"Fund a neutral forum where animals and humans can negotiate.", move:"quiet", push:[["w.conflict","none",3]], out:"The forum is slow and awkward, and the only place both sides still talk."}],
    animal:[
      {id:"a", label:"Speak for all the animals.", move:"negotiate", push:[["s.first.status","self",2],["w.conflict","none",1]], out:"Humans start addressing you by name."},
      {id:"b", label:"Resist together: refuse all work for humans.", move:"resist", push:[["w.conflict","confrontation",3],["s.*.collective","movement",2]], out:"The refusals spread across species at once."},
      {id:"c", label:"Withdraw: live among your own kind, away from humans.", move:"refuse", push:[["w.land","contested",2]], out:"Some humans call it a strike. You call it going home."}]
  }},

home:{id:"home", title:"Home", themes:["land"], sources:[],
  hint:"Comes up when animals start asking for places, more often after early words about home.",
  eligible:(c,t)=>t>=5,
  priority:c=>70 + (c.flags.home ? 16 : 0) + (c.w.land!=="none" ? 10 : 0),
  body:c=>[
    "The animals have started asking for places.",
    c.act.map(sp=>CLAIMS[sp]).join(" "),
    "US law has no way for an animal to claim land. Wildlife refuges, conservation easements and property titles were all written for humans to hold.",
    {none:"Nobody has taken the claims seriously yet.", ignored:"So far, every claim has been ignored.", contested:"Some claims are already in court.", recognized:"A few places are already protected in the animals' names."}[c.w.land]
  ],
  frame:{
    scientist:"The animals ask you to explain their claims to humans.",
    activist:"Your coalition could buy land and hold it for animals.",
    lobbyist:"Your members own a great deal of land.",
    legislator:"A colleague proposes a bill on protected places named by animals.",
    billionaire:"You could simply buy the places they name.",
    animal:"You know which place you mean. The humans keep asking you to draw it on a map."
  },
  question:"What happens to the animals' claims to places?",
  choices:{
    scientist:[
      {id:"a", label:"Help the animals map exactly what they mean.", move:"ethicists", push:[["w.land","contested",3]], out:"The maps surprise everyone: small places, very specific."},
      {id:"b", label:"Say the claims are too uncertain to act on.", move:"dispute", push:[["w.land","ignored",3]], out:"Without a scientist's backing, the claims stall."},
      {id:"c", label:"Take the claims to court as evidence of what animals prefer.", move:"ethicists", push:[["w.land","contested",2],["s.first.status","guardian",1]], out:"A judge agrees to hear it."}],
    activist:[
      {id:"a", label:"Buy land and hold it in trust for the animals.", move:"careful", push:[["w.land","recognized",3]], out:"A small start: a few thousand acres, held for animals by humans."},
      {id:"b", label:"Sue for protected areas named by animals.", move:"push", push:[["w.land","contested",3]], out:"The case will take years."},
      {id:"c", label:"Focus on farms, not land.", move:"push", push:[["w.food","reformed",2],["w.land","ignored",1]], out:"The claims fade from the news."}],
    lobbyist:[
      {id:"a", label:"Oppose any animal claim to land.", move:"deny", push:[["w.land","ignored",3]], out:"Property rights groups join you."},
      {id:"b", label:"Offer marginal land to settle the claims cheaply.", move:"rebrand", push:[["w.land","recognized",2]], out:"The animals turn down some of the offers. That surprises everyone."},
      {id:"c", label:"Urge members to turn some farmland into sanctuaries, for the tax break.", move:"pivot", push:[["w.land","recognized",2],["w.food","reformed",1]], out:"Some members like the math."}],
    legislator:[
      {id:"a", label:"Champion the protected-places bill.", move:"standing", push:[["w.land","recognized",4]], out:"With your support, it passes. For the first time, US law protects places named by animals."},
      {id:"b", label:"Leave it to the states.", move:"stall", push:[["w.land","contested",2]], out:"Fifty states, fifty answers."},
      {id:"c", label:"Reject it. Land belongs to people.", move:"restrict", push:[["w.land","ignored",3],["w.conflict","polarization",1]], out:"The animals stay in the places anyway."}],
    billionaire:[
      {id:"a", label:"Buy the land and give it to an animal trust.", move:"quiet", push:[["w.land","recognized",3]], out:"Generous, critics say, and also a way to decide on the animals' behalf."},
      {id:"b", label:"Release an open map of the places animals have claimed.", move:"open", push:[["w.land","contested",2],["w.surveillance","commercial",1]], out:"Tourists flock to the claimed places. The animals did not ask for that."},
      {id:"c", label:"Stay out of land.", move:"quiet", push:[], out:"Your company sticks to software."}],
    animal:[
      {id:"a", label:"Draw the map.", move:"negotiate", push:[["w.land","contested",3]], out:"Humans study your map for hidden meanings. There are none."},
      {id:"b", label:"Go there, with or without permission.", move:"resist", push:[["w.land","contested",2],["w.conflict","polarization",1]], out:"You are where you said you would be."},
      {id:"c", label:"Ask for less: just to be left alone.", move:"engage", push:[["w.land","recognized",2]], out:"It is the easiest request to grant, and the hardest to keep."}]
  }},

kids:{id:"kids", title:"The children", themes:["children","food"], sources:[SRC.wilks],
  hint:"Comes up in the 2040s, as the first children raised with translators grow up.",
  eligible:(c,t)=>t>=6,
  priority:(c,t)=>t===6 ? 88 : 90,
  body:c=>{
    const extra = [];
    if(c.w.conflict!=="none") extra.push("Some are frightened. They have seen the news.");
    if(c.act.includes("pet") && c.s.pet.belief==="high") extra.push("Many talk to the family dog every day.");
    if(c.w.food==="unchanged") extra.push("School lunches still serve pork. Some children refuse to eat it.");
    return [
      "Children born since the breakthrough have never known a world where animals could not answer back.",
      "Before any of this, researchers had found that young children weigh animals' lives closer to humans' than adults do. Now those children can talk to animals.",
      extra.join(" ") + " " + {scared:"Many parents say their children are afraid of animals that talk back.", divided:"Teachers see every view in the same classroom.", include:"Teachers say the children already treat animals as classmates."}[c.w.children],
      "Parents, teachers and children are not always on the same side."
    ];
  },
  frame:{
    scientist:"A school asks your lab to run a translator workshop for eight-year-olds.",
    activist:"Teenagers are joining your coalition faster than adults.",
    lobbyist:"Children are refusing school lunches. Parents are calling your association.",
    legislator:"A 14-year-old testifies before your subcommittee. The clip has 30 million views.",
    billionaire:"Your company could release a free classroom translator.",
    animal:"Children talk to you differently: more questions, fewer commands."
  },
  question:"How do the children's views shape the world?",
  choices:{
    scientist:[
      {id:"a", label:"Run the workshop, and be honest about the uncertainty.", move:"validate", push:[["w.children","include",3]], out:"The children handle uncertainty better than the adults do."},
      {id:"b", label:"Advise against children using translators until the science settles.", move:"dispute", push:[["w.children","divided",2]], out:"Children use them anyway, without guidance."},
      {id:"c", label:"Study the children: are they frightened, or curious?", move:"validate", push:[["w.children","include",1],["w.generations","agree",1]], out:"Mostly curious, sometimes frightened, depending on what the adults around them say."}],
    activist:[
      {id:"a", label:"Launch a youth movement.", move:"push", push:[["w.children","include",3],["w.generations","split",2]], out:"Dinner tables become battlegrounds."},
      {id:"b", label:"Keep children out of it, to protect them.", move:"careful", push:[["w.generations","agree",2]], out:"Teenagers organize without you."},
      {id:"c", label:"Pair schools with sanctuaries.", move:"careful", push:[["w.children","include",3]], out:"Classes visit sanctuaries. The animals ask the children questions."}],
    lobbyist:[
      {id:"a", label:"Fund a campaign: “Let kids be kids.”", move:"deny", push:[["w.children","divided",2],["w.generations","tension",2]], out:"Parents split along familiar lines."},
      {id:"b", label:"Get members to offer schools plant-based menus before they are forced to.", move:"pivot", push:[["w.food","reformed",3],["w.generations","agree",1]], out:"The children win their first fight without knowing it."},
      {id:"c", label:"Warn parents that translators frighten children.", move:"deny", push:[["w.children","scared",3]], out:"Some parents take the devices away. Some children take them back."}],
    legislator:[
      {id:"a", label:"Set up a youth advisory council for your subcommittee.", move:"standing", push:[["w.children","include",2],["w.generations","tension",1]], out:"The council meets for the first time. The adults are nervous."},
      {id:"b", label:"Introduce a ban on translators for children under 13.", move:"restrict", push:[["w.children","scared",2],["s.pet.access","partly",2]], out:"Children lose their easiest way to talk to their pets."},
      {id:"c", label:"Leave it to families.", move:"stall", push:[["w.generations","tension",1]], out:"Every family decides differently."}],
    billionaire:[
      {id:"a", label:"Release the classroom translator, free.", move:"open", push:[["w.children","include",3],["w.surveillance","commercial",1]], out:"Millions of children use it. Their conversations are stored somewhere."},
      {id:"b", label:"Release a kids' edition with filtered words.", move:"pets", push:[["w.children","divided",2],["w.accuracy","projection",1]], out:"Critics ask who decided which words children may hear."},
      {id:"c", label:"Keep children away from your products.", move:"quiet", push:[], out:"Other companies take that market."}],
    animal:[
      {id:"a", label:"Talk to the children. They listen.", move:"engage", push:[["w.children","include",3],["s.first.belief","high",1]], out:"Children start repeating your words to their parents."},
      {id:"b", label:"Stay away from the children. Their parents are dangerous.", move:"refuse", push:[["w.children","scared",1]], out:"The children wonder why you hide."},
      {id:"c", label:"Ask the children to speak for you.", move:"negotiate", push:[["w.generations","split",3],["w.children","include",1]], out:"Some parents call it manipulation. Some children call it a promise."}]
  }},

court:{id:"court", title:"Standing", themes:["personhood"], sources:[SRC.nhrp, SRC.happy, SRC.trials],
  hint:"Comes up when public belief or a court case puts animals' legal standing on the table.",
  eligible:(c,t)=>t>=5,
  priority:c=>60 + (anyAct(c,sp=>["guardian","self"].includes(c.s[sp].status)) ? 10 : 0) + (anyAct(c,sp=>c.s[sp].belief==="high") ? 6 : 0),
  body:c=>[
    c.isAnimal ? "A case reaches a federal court. Lawyers ask the court to recognize you as a person with the right to be heard." : `A case reaches a federal court. Lawyers ask the court to recognize a ${c.sg} from the study as a person with the right to be heard.`,
    "They build on the Nonhuman Rights Project's habeas corpus cases. In 2022, New York's highest court ruled that Happy, an elephant at the Bronx Zoo, was not a person who could challenge her confinement.",
    c.isAnimal ? "This time, you can testify, through a translator nobody can fully verify." : `This time, the ${c.sg} can testify, through a translator nobody can fully verify.`,
    anyAct(c,sp=>["guardian","self"].includes(c.s[sp].status)) ? "Some courts already appoint guardians for animals." : "No US court has yet given an animal a voice of its own."
  ],
  frame:{
    scientist:"You are called as an expert witness.",
    activist:"Your coalition's lawyers filed the case.",
    lobbyist:"If one animal wins standing, every barn becomes a possible courtroom.",
    legislator:"Whatever the court decides, Congress will be asked to settle it.",
    billionaire:"The translator in court runs on one of your models.",
    animal:"The humans want you to speak in a room with a judge."
  },
  question:"What standing should animals have?",
  choices:{
    scientist:[
      {id:"a", label:"Testify that translations are reliable for facts, not for feelings.", move:"validate", push:[["w.carryover","partial",2],["s.first.status","welfare",2]], out:"The judge finds you credible. That helps less than you hoped."},
      {id:"b", label:"Testify that the animal's wishes are clear.", move:"ethicists", push:[["s.first.status","guardian",3],["w.accuracy","genuine",1]], out:"The other side calls you an advocate in a lab coat."},
      {id:"c", label:"Decline to testify.", move:"dispute", push:[], out:"The case goes ahead without you."}],
    activist:[
      {id:"a", label:"Ask for a guardian, not full personhood.", move:"careful", push:[["s.first.status","guardian",3]], out:"A narrower ask, and a winnable one."},
      {id:"b", label:"Ask for self-representation: the animal speaks for itself.", move:"push", push:[["s.first.status","self",3],["w.conflict","polarization",1]], out:"The boldest claim in US legal history, or the silliest, depending on whom you ask."},
      {id:"c", label:"Withdraw the case to avoid a bad precedent.", move:"careful", push:[], out:"You live to fight another case."}],
    lobbyist:[
      {id:"a", label:"Argue that animals who can speak can also be held liable.", move:"deny", push:[["s.first.status","welfare",2],["w.conflict","polarization",1]], out:"The idea that animals could be defendants, not only victims, unsettles everyone."},
      {id:"b", label:"Support welfare reform to head off personhood.", move:"rebrand", push:[["s.*.status","welfare",2],["s.pig.welfare","better",1]], out:"Reform passes. Personhood waits."},
      {id:"c", label:"Fund the opposing lawyers.", move:"deny", push:[["s.first.status","unchanged",3]], out:"The case is lost on appeal."}],
    legislator:[
      {id:"a", label:"Write a guardian law, modeled on guardianship for children.", move:"standing", push:[["s.*.status","guardian",3]], out:"The first guardians are appointed within the year."},
      {id:"b", label:"Pass a welfare law instead.", move:"regulate", push:[["s.*.status","welfare",3]], out:"Better conditions, but no voice."},
      {id:"c", label:"Wait for the Supreme Court.", move:"stall", push:[], out:"It will take years."}],
    billionaire:[
      {id:"a", label:"Offer your company's model as the court's official translator.", move:"quiet", push:[["w.accuracy","genuine",1],["w.openness","open",1]], out:"Your model is now the voice of animals in court. That is a lot of power for one company."},
      {id:"b", label:"Fund the animal's lawyers.", move:"quiet", push:[["s.first.status","guardian",2]], out:"Your name is on the case. So are your critics'."},
      {id:"c", label:"Stay neutral.", move:"quiet", push:[], out:"Neutrality is noticed."}],
    animal:[
      {id:"a", label:"Speak in court.", move:"negotiate", push:[["s.first.status","self",3],["s.first.belief","high",1]], out:"The courtroom is silent while the translation scrolls."},
      {id:"b", label:"Refuse. The court is a human place.", move:"refuse", push:[["s.first.status","unchanged",1]], out:"The judge must decide what your silence means. Nobody can."},
      {id:"c", label:"Ask for a human you trust to speak for you.", move:"engage", push:[["s.first.status","guardian",3]], out:"You choose a human. The court accepts."}]
  }}
};

const FIXED = {1:"verify", 2:"clip", 3:"listen", 4:"words"};
const POOL = ["switch","bloc","home","kids","court"];

global.CONTENT = {SRC, SPECIES_INFO, ROLES, THEMES, FIRST_WORDS, prologue, SCENES, FIXED, POOL};
})(window);
