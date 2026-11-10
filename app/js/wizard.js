(function(){
'use strict';
const E=window.EAH;
const {S,DOWL,I,esc,uid,clone,defaultWeekId,lsGet,newPerson,people,weekShape,dishList}=E;
/* ---------- setup wizard ----------
   Seven steps. Answers live in S.wiz and are kept in localStorage on every change, so a
   reload comes back to the same step. Nothing touches the household until the last step. */
const KEY='eah-wizard',STEPS=7;
const SUGGEST=['American','Tex-Mex','Mexican','Italian','Asian-American','Chinese','Japanese','Korean','Thai','Vietnamese','Indian','Mediterranean','Greek','Middle Eastern','Southern','Cajun','BBQ','French'];
const RULE_EXAMPLES=['e.g. No shellfish','e.g. Nothing too spicy for the kids','e.g. Fish no more than once a week'];

function keep(){try{localStorage.setItem(KEY,JSON.stringify(S.wiz));}catch(e){}}
function drop(){try{localStorage.removeItem(KEY);}catch(e){}}
function saved(){try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):null;}catch(e){return null;}}

function fresh(){return {step:1,rerun:false,people:[],cuisines:[],cookTime:'',cookNotes:'',leftoversCount:1,leftoversDay:3,clearoutLunch:6,rules:[],dishes:[],err:''};}
function fromCurrent(){
  const ck=S.settings.cooking||{};const ws=weekShape();
  return {step:1,rerun:true,people:clone(people()),cuisines:(Array.isArray(S.settings.cuisines)?S.settings.cuisines:E.DEFAULT_CUISINES).slice(),
    cookTime:ck.cookTime||'',cookNotes:ck.notes||'',leftoversCount:ws.leftovers.count,leftoversDay:ws.leftovers.day,clearoutLunch:ws.clearoutLunch,rules:(S.settings.rules||[]).slice(),dishes:[],err:''};
}
function start(rerun){E.closePop&&S.pop&&E.closePop();S.modal=null;E.renderModal();S.wiz=rerun?fromCurrent():fresh();S.view='wizard';keep();E.render();window.scrollTo(0,0);}
function resume(){const w=saved();if(!w)return false;S.wiz=Object.assign(fresh(),w);S.view='wizard';return true;}
function finish(){drop();S.wiz=null;S.view='plan';S.weekId=defaultWeekId();S.genMsg='';E.render();window.scrollTo(0,0);}
function cancel(){drop();S.wiz=null;S.view='settings';E.render();}
function go(step){S.wiz.step=Math.max(1,Math.min(STEPS,step));S.wiz.err='';keep();E.render();window.scrollTo(0,0);const h=document.getElementById('wz-h');h&&h.focus({preventScroll:true});}

// Build the household from the answers. A fresh setup replaces everything; a re-run keeps
// dishes and weeks, drops ratings of people who were removed, and adds any new dishes.
function apply(){
  const w=S.wiz;const ps=w.people.filter(p=>String(p.name).trim());
  if(!ps.some(p=>p.isCook))ps[0].isCook=true;
  const settings={people:ps.map(p=>({id:p.id,name:String(p.name).trim(),isCook:!!p.isCook,note:String(p.note||'').trim(),lunch:!!p.lunch,breakfast:!!p.breakfast})),
    cooking:Object.assign({},w.rerun?S.settings.cooking:null,{cookTime:String(w.cookTime||'').trim(),notes:String(w.cookNotes||'').trim()}),   // a re-run keeps dinner time
    cuisines:w.cuisines.slice(),rules:w.rules.slice(),week:{leftovers:{count:w.leftoversCount==null?1:w.leftoversCount,day:w.leftoversDay==null?3:w.leftoversDay},clearoutLunch:w.clearoutLunch}};
  const mkDish=d=>({id:uid(),name:d.name,cuisine:'',effort:'',useFor:['dinner'],labels:[],sources:[],leftovers:'none',becomes:[],
    ratings:d.fav?Object.fromEntries(settings.people.map(p=>[p.id,'fav'])):{},notes:'',created:Date.now()});
  if(!w.rerun){
    E.load({settings:Object.assign({theme:S.settings.theme||'denim',genMode:'ai'},settings),dishes:w.dishes.map(mkDish),weeks:[]});
  }else{
    Object.assign(S.settings,settings);
    const ids=new Set(settings.people.map(p=>p.id));
    Object.values(S.dishes).forEach(d=>{if(d.ratings&&Object.keys(d.ratings).some(k=>!ids.has(k))){const nd=clone(d);Object.keys(nd.ratings).forEach(k=>{if(!ids.has(k))delete nd.ratings[k];});S.dishes[nd.id]=nd;}});
    const have=new Set(dishList().map(d=>d.name.toLowerCase()));
    w.dishes.forEach(d=>{if(!have.has(d.name.toLowerCase())){const nd=mkDish(d);S.dishes[nd.id]=nd;have.add(d.name.toLowerCase());}});
    S.drafts={};
  }
  E.changed();E.clearHistory();
}

/* ---------- views ---------- */
function nav(back,next,opts){
  opts=opts||{};
  return `<div class="wz-nav"><div>${back?`<button class="btn-ghost" data-act="wzBack">Back</button>`:''}${S.wiz.rerun?` <button class="linkbtn muted-link" data-act="wzCancel" style="margin-left:8px">Cancel setup</button>`:''}</div>
  <div class="wz-r">${opts.skip?`<button class="btn-ghost" data-act="wzNext">${esc(opts.skip)}</button>`:''}${next?`<button class="btn-primary" id="wz-next" data-act="wzNext">${esc(next)}</button>`:''}</div></div>`;
}
function stepWelcome(){
  if(S.wiz.rerun)return `<h1 id="wz-h" tabindex="-1">Run setup again</h1><p class="wz-lead">Your answers are filled in. Change what you like; nothing changes until you finish the last step. Your dishes and weeks stay as they are.</p>${nav(false,'Start')}`;
  return `<h1 id="wz-h" tabindex="-1">Welcome to Eat At Home</h1><p class="wz-lead">Plan the family’s week of home-cooked meals: dinner drives the week, leftovers become lunch on purpose, and the plan learns what everyone likes.</p>
  <div class="wz-choices"><button class="wz-choice" id="wz-new" data-act="wzNext"><b>Set up a new household</b><span>A few quick questions about who eats and how you cook. About two minutes.</span></button>
  <button class="wz-choice" id="wz-open" data-act="wzOpen"><b>Open my data file</b><span>Already use Eat At Home? Open your data file and pick up where you left off.</span></button></div>`;
}
function stepFamily(){
  const w=S.wiz;
  const rows=w.people.map((p,k)=>`<div class="person"><div class="field"><label for="wp-n-${k}">Name</label><input class="input" id="wp-n-${k}" data-wp="name" data-k="${k}" value="${esc(p.name)}" autocomplete="off"></div>
    <div class="field"><label for="wp-t-${k}">Note for Claude (optional)</label><input class="input" id="wp-t-${k}" data-wp="note" data-k="${k}" value="${esc(p.note||'')}" placeholder="${k?'e.g. vegetarian, or 6 and likes plain food':'e.g. eats anything, loves spicy food'}" autocomplete="off"></div>
    <div class="checks"><label><input type="radio" name="wp-cook" data-wpc="isCook" data-k="${k}" ${p.isCook?'checked':''}> Cook</label><label><input type="checkbox" data-wpc="lunch" data-k="${k}" ${p.lunch?'checked':''}> Planned lunch</label><label><input type="checkbox" data-wpc="breakfast" data-k="${k}" ${p.breakfast?'checked':''}> Breakfast line</label></div>
    <button class="ibtn" data-act="wzPersonDel" data-k="${k}" aria-label="Remove ${esc(p.name)}">${I.x}</button></div>`).join('');
  return `<h1 id="wz-h" tabindex="-1">Who eats at home?</h1><p class="wz-lead">Add everyone who eats dinner, starting with whoever cooks. Notes go to Claude, so describe each person the way you would to a friend who’s cooking for you.</p>
  <div class="people">${rows||'<p class="muted" style="margin:0">No one yet.</p>'}</div>
  <form class="addrow" data-form="wzPerson"><label class="sr" for="wz-person">Name</label><input class="input" id="wz-person" placeholder="${w.people.length?'Add another person':'Your name, e.g. Me'}" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form>
  <p class="hint" style="margin:0">The cook gets “My breakfast” on the plan. A planned lunch is one lunch line a day for the people who get it, usually just the cook.</p>
  ${w.err?`<p class="err" role="alert">${esc(w.err)}</p>`:''}${nav(true,'Next')}`;
}
function stepCooking(){
  const w=S.wiz;const all=SUGGEST.concat(w.cuisines.filter(c=>!SUGGEST.some(s=>s.toLowerCase()===c.toLowerCase())));
  return `<h1 id="wz-h" tabindex="-1">How do you cook?</h1>
  <div class="field"><span class="lab">Cuisines you like</span><div class="skipchips wz-chips" role="group" aria-label="Cuisines">${all.map((c,k)=>{const on=w.cuisines.some(x=>x.toLowerCase()===c.toLowerCase());return `<button class="wzchip ${on?'on':''}" id="wc-${k}" data-act="wzCuisine" data-c="${esc(c)}" aria-pressed="${on}">${esc(c)}</button>`;}).join('')}</div>
  <form class="addrow" data-form="wzCuisine"><label class="sr" for="wz-cui">Add a cuisine</label><input class="input" id="wz-cui" placeholder="Add your own, e.g. Cuban" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form>
  <span class="hint">Optional. The planner uses cuisines to vary the week.</span></div>
  <div class="frow"><div class="field"><label for="wz-time">Typical weeknight cook time</label><input class="input" id="wz-time" data-wf="cookTime" value="${esc(w.cookTime)}" placeholder="e.g. 45 minutes" autocomplete="off"></div>
  <div class="field"><label for="wz-lo">Leftovers nights per week</label><select class="input" id="wz-lo" data-wsel="leftoversCount">${E.countOptions(w.leftoversCount)}</select></div>
  <div class="field"><label for="wz-lod">Usually on</label><select class="input" id="wz-lod" data-wsel="leftoversDay">${E.weekdayOptions(w.leftoversDay)}</select></div>
  <div class="field"><label for="wz-co">Clear-out lunch</label><select class="input" id="wz-co" data-wsel="clearoutLunch">${E.dayOptions(w.clearoutLunch)}</select></div></div>
  <div class="field"><label for="wz-notes">Cooking notes for Claude (optional)</label><input class="input" id="wz-notes" data-wf="cookNotes" value="${esc(w.cookNotes)}" placeholder="e.g. Mostly one-pan dinners. The slow cooker on busy days." autocomplete="off"></div>
  <p class="hint" style="margin:0">A leftovers night is a night off from cooking to eat up what’s in the fridge; “Usually on” is the day for the first one. The clear-out lunch is the same idea at lunch.</p>
  ${nav(true,'Next')}`;
}
function stepRules(){
  const w=S.wiz;
  return `<h1 id="wz-h" tabindex="-1">Family rules</h1><p class="wz-lead">Anything the planner should always follow. Short, plain sentences work best. You can skip this and add rules later on the Family page.</p>
  <div class="rules">${w.rules.map((x,k)=>`<div class="rule"><span>${esc(x)}</span><button class="ibtn" data-act="wzRuleDel" data-k="${k}" aria-label="Remove rule: ${esc(x)}">${I.x}</button></div>`).join('')}</div>
  <form class="addrow" data-form="wzRule"><label class="sr" for="wz-rule">New rule</label><input class="input" id="wz-rule" placeholder="${esc(RULE_EXAMPLES[w.rules.length%RULE_EXAMPLES.length])}" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form>
  ${nav(true,w.rules.length?'Next':'',{skip:w.rules.length?'':'Skip for now'})}`;
}
function stepDishes(){
  const w=S.wiz;
  return `<h1 id="wz-h" tabindex="-1">Starting dishes</h1><p class="wz-lead">Type the dinners you already make. Star the family favorites. Cuisine, leftovers and who likes what can wait: you can fill those in later in the Library.${w.rerun?' Dishes you already have stay as they are.':''}</p>
  <div class="lblbox wz-dishes">${w.dishes.map((d,k)=>`<span class="lbl"><button type="button" class="wz-star ${d.fav?'on':''}" data-act="wzDishFav" data-k="${k}" aria-pressed="${!!d.fav}" aria-label="${d.fav?'Favorite':'Mark as favorite'}: ${esc(d.name)}">${I.star}</button>${esc(d.name)}<button type="button" data-act="wzDishDel" data-k="${k}" aria-label="Remove ${esc(d.name)}">${I.x}</button></span>`).join('')}<label class="sr" for="wz-dish">Dish name</label><input id="wz-dish" placeholder="${w.dishes.length?'Add another':'e.g. Tacos'}" autocomplete="off"></div>
  <span class="hint">Press Enter after each dish. A starred dish is rated Favorite for everyone.</span>
  ${nav(true,w.dishes.length?'Next':'',{skip:w.dishes.length?'':'Skip for now'})}`;
}
function stepKey(){
  const a=S.ai;const guide=`<a href="${E.KEY_GUIDE}" target="_blank" rel="noopener">Anthropic’s guide to getting a key</a>`;
  const st=a.status==='found'?`<p class="wz-ok">${I.check} Claude key found. Using ${esc(a.model)}.</p>${a.warn?`<p class="err">${esc(a.warn)}</p>`:''}`:`<p class="err">${esc(a.reason)}</p>`;
  return `<h1 id="wz-h" tabindex="-1">Claude key</h1><p class="wz-lead">With a Claude API key, Claude plans your weeks and suggests new dishes. Without one, Eat At Home picks dinners from your library by rating, and you can add a key any time.</p>
  ${st}
  <ol class="wz-steps"><li>Get a key from Anthropic: ${guide}. The Console shows a key only once, so paste it into the file right away.</li>
  <li>In the Eat At Home folder, open the <b>app</b> folder.${a.file?'':' Copy <b>config.example.js</b> and name the copy <b>config.js</b>.'}</li>
  <li>Open <b>app/config.js</b> in a plain-text editor (in TextEdit, choose Format → Make Plain Text first), paste your key between the straight quotes after <code>anthropicApiKey:</code>, and save it.</li>
  <li>Click Check again.</li></ol>
  <p class="hint" style="margin:0">The key stays in app/config.js on this computer. It’s never put in your data file.</p>
  <div><button class="btn-ghost" data-act="wzRecheck">${I.refresh} Check again</button></div>
  ${nav(true,a.status==='found'?'Next':'',{skip:a.status==='found'?'':'Skip for now'})}`;
}
function stepSave(){
  return `<h1 id="wz-h" tabindex="-1">Download a copy of your data</h1><p class="wz-lead">Your data lives in this browser and saves as you go. A downloaded copy is your backup, and it’s how you move your data to another browser or computer.</p>
  <div><button class="btn-primary" id="wz-save" data-act="wzSave">Download data file</button></div>
  <p class="hint" style="margin:0">Your browser puts it in Downloads. Download a fresh copy now and then from the app bar or Settings.</p>
  ${nav(true,'',{skip:'Skip for now'})}`;
}
function viewWizard(){
  const w=S.wiz;if(!w)return '';
  const body=[null,stepWelcome,stepFamily,stepCooking,stepRules,stepDishes,stepKey,stepSave][w.step]();
  return `<div class="wz"><div class="wz-top"><div class="brand"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" style="fill:var(--bar)"></rect><path d="M8 17l8-7 8 7v7a1 1 0 0 1-1 1h-4v-5h-6v5H9a1 1 0 0 1-1-1z" style="fill:var(--barText)"></path></svg><span>Eat At Home</span></div><span class="eyebrow">Step ${w.step} of ${STEPS}</span></div>
  <section class="panel wz-card">${body}</section></div>`;
}

/* ---------- actions & inputs ---------- */
function addPerson(name){const w=S.wiz;const p=newPerson(name,w.people);w.people.push(p);w.err='';keep();E.render();const n=document.getElementById('wz-person');n&&n.focus();}
function addDish(){const el=document.getElementById('wz-dish');if(!el)return;const w=S.wiz;
  el.value.split(',').map(s=>s.trim().replace(/\s+/g,' ').slice(0,80)).filter(Boolean).forEach(n=>{if(!w.dishes.some(d=>d.name.toLowerCase()===n.toLowerCase()))w.dishes.push({name:n,fav:false});});
  el.value='';keep();E.render();const n=document.getElementById('wz-dish');n&&n.focus();}
const actions={
  wzNext:()=>{const w=S.wiz;
    if(w.step===2){addPendingPerson();if(!w.people.some(p=>String(p.name).trim())){w.err='Add at least one person.';keep();E.render();return;}}
    if(w.step===5)addPendingDish();
    go(w.step+1);},
  wzBack:()=>go(S.wiz.step-1),
  wzCancel:()=>cancel(),
  wzOpen:()=>E.openFile(),
  wzPersonDel:el=>{const w=S.wiz;const k=+el.dataset.k;const was=w.people[k];w.people.splice(k,1);if(was&&was.isCook&&w.people[0])w.people[0].isCook=true;keep();E.render();},
  wzCuisine:el=>{const w=S.wiz;const c=el.dataset.c;const i=w.cuisines.findIndex(x=>x.toLowerCase()===c.toLowerCase());if(i>=0)w.cuisines.splice(i,1);else w.cuisines.push(c);keep();E.refocus(E.main,()=>E.render());},
  wzRuleDel:el=>{S.wiz.rules.splice(+el.dataset.k,1);keep();E.render();},
  wzDishFav:el=>{const d=S.wiz.dishes[+el.dataset.k];if(d){d.fav=!d.fav;keep();E.render();const b=document.querySelector(`[data-act=wzDishFav][data-k="${el.dataset.k}"]`);b&&b.focus();}},
  wzDishDel:el=>{S.wiz.dishes.splice(+el.dataset.k,1);keep();E.render();const n=document.getElementById('wz-dish');n&&n.focus();},
  wzRecheck:()=>{keep();location.reload();},
  wzSave:()=>{apply();finish();E.download();},
};
// Skip on the last step finishes without a file.
const baseNext=actions.wzNext;
actions.wzNext=el=>{if(S.wiz&&S.wiz.step===STEPS){apply();finish();return;}baseNext(el);};
function addPendingPerson(){const el=document.getElementById('wz-person');if(el&&el.value.trim()){const w=S.wiz;w.people.push(newPerson(el.value.trim().slice(0,40),w.people));keep();}}
function addPendingDish(){const el=document.getElementById('wz-dish');if(el&&el.value.trim()){const w=S.wiz;el.value.split(',').map(s=>s.trim()).filter(Boolean).forEach(n=>{if(!w.dishes.some(d=>d.name.toLowerCase()===n.toLowerCase()))w.dishes.push({name:n.slice(0,80),fav:false});});keep();}}

document.addEventListener('input',e=>{const t=e.target;if(!S.wiz||S.view!=='wizard')return;
  if(t.dataset.wp){const p=S.wiz.people[+t.dataset.k];if(p){p[t.dataset.wp]=t.dataset.wp==='name'?t.value.slice(0,40):t.value;keep();}}
  else if(t.dataset.wf){S.wiz[t.dataset.wf]=t.value;keep();}});
document.addEventListener('change',e=>{const t=e.target;if(!S.wiz||S.view!=='wizard')return;
  if(t.dataset.wpc){const k=+t.dataset.k;const f=t.dataset.wpc;if(f==='isCook')S.wiz.people.forEach((p,i)=>{p.isCook=i===k;});else S.wiz.people[k][f]=t.checked;keep();}
  else if(t.dataset.wsel){S.wiz[t.dataset.wsel]=t.value===''?null:Number(t.value);keep();}});
document.addEventListener('submit',e=>{const f=e.target;if(!S.wiz||S.view!=='wizard')return;const inp=f.querySelector('input');const v=inp?inp.value.trim().replace(/\s+/g,' '):'';
  if(f.dataset.form==='wzPerson'){e.preventDefault();if(v)addPerson(v.slice(0,40));}
  else if(f.dataset.form==='wzCuisine'){e.preventDefault();if(!v)return;const w=S.wiz;const c=v.slice(0,40);if(!w.cuisines.some(x=>x.toLowerCase()===c.toLowerCase()))w.cuisines.push(c);keep();E.render();const n=document.getElementById('wz-cui');n&&n.focus();}
  else if(f.dataset.form==='wzRule'){e.preventDefault();if(!v)return;S.wiz.rules.push(v);keep();E.render();const n=document.getElementById('wz-rule');n&&n.focus();}},true);
document.addEventListener('keydown',e=>{if(!S.wiz||S.view!=='wizard'||e.target.id!=='wz-dish')return;
  if(e.key==='Enter'||e.key===','){e.preventDefault();addDish();}
  else if(e.key==='Backspace'&&!e.target.value&&S.wiz.dishes.length){e.preventDefault();S.wiz.dishes.pop();keep();E.render();const n=document.getElementById('wz-dish');n&&n.focus();}});

// Opening a data file from the wizard skips the rest of it.
E.afterDataLoaded=()=>{if(S.view==='wizard'){drop();S.wiz=null;S.view='plan';S.weekId=defaultWeekId();}};
Object.assign(E,{viewWizard,startWizard:start,resumeWizard:resume,wizardActions:actions});
})();
