(function(){
'use strict';
const E=window.EAH;
const {DOWL,clone,addDays,daysBetween,fmtDate,fmtRange,S,dishList,r,forDinner,noOnes,eligibleDinner,cuisineList,labelsOf,allLabels,skipSet,okThisWeek,snap,disp,lastCooked,lastFor,weight,pickWeighted,getWeek,mutateWeek,people,weekShape,DEFAULT_CUISINES,variationsOf,dinnerTitle}=E;
/* ---------- generation ---------- */
// Everything Claude is told about the family comes from settings: people, cooking, cuisines, rules.
function cookTime(){return String((S.settings.cooking&&S.settings.cooking.cookTime)||'').trim();}
function rulesList(){return (S.settings.rules||[]).map(x=>String(x).trim()).filter(Boolean);}
function likedCuisines(){return (Array.isArray(S.settings.cuisines)?S.settings.cuisines:DEFAULT_CUISINES).filter(c=>c&&c.toLowerCase()!=='other');}
function household(){
  const ck=S.settings.cooking||{};const t=cookTime();const notes=String(ck.notes||'').trim();
  const lines=people().map(p=>'- '+p.name+' (id "'+p.id+'"'+(p.isCook?', the cook':'')+')'+(String(p.note||'').trim()?': '+String(p.note).trim():''));
  let h='Household:\n'+(lines.length?lines.join('\n'):'- (no one listed)')
    +'\nDinner is a real home-cooked family meal'+(t?', about '+t+' on weeknights':'')+'.'+(notes?' Cooking notes: '+notes:'');
  const cu=likedCuisines();if(cu.length)h+='\nCuisines they like: '+cu.join(', ')+'.';
  h+='\nThis is a reminder list, not a recipe book.';
  const rules=rulesList();if(rules.length)h+='\nStanding rules:\n'+rules.map(x=>'- '+x).join('\n');
  return h;
}
function suitLine(){const t=cookTime();return 'suit this household (see the notes'+(rulesList().length?' and rules':'')+' above)'+(t?', about '+t+' to cook':'');}
function libraryForAI(w){const ref=w.id;
  const lc=lastCooked();
  return dishList().filter(d=>okThisWeek(d,w)).map(d=>{const last=lastFor(d,lc);const o={id:d.id,name:d.name,labels:labelsOf(d),cuisine:d.cuisine||null,effort:d.effort||null,leftovers:d.leftovers||'none',becomes:d.becomes||[],ratings:Object.fromEntries(people().map(p=>[p.id,r(d,p.id)])),daysSinceCooked:last?daysBetween(last,ref):null};
    const vs=variationsOf(d);if(vs.length)o.variations=vs.map(v=>({id:v.id,name:v.name}));return o;});
}
function shape(){return JSON.stringify({day:0,libraryId:'id or null',variationId:'id or null',name:'Dish name',cuisine:cuisineList().join('|'),effort:'1 hr',leftovers:'asis|transform|none',becomes:['Next-day lunch'],labels:[]});}
function labelLines(w){const sk=(w.skipLabels||[]);const all=allLabels().map(l=>l.name);
  return (sk.length?'- Skipped this week: do not use any dish labeled '+sk.map(x=>JSON.stringify(x)).join(', ')+', and do not suggest new dishes that would need '+(sk.length>1?'any of those':'that')+'.\n':'')
    +'- Labels the cook uses: '+(all.length?JSON.stringify(all):'(none yet)')+'. For new dishes, put any that apply in "labels" (only from that list).';}
function fromAi(x,w){
  if(!x||typeof x!=='object')return null;
  let d=x.libraryId&&S.dishes[String(x.libraryId)];
  if(!d){const nm=String(x.name||'').trim().toLowerCase();if(nm)d=dishList().find(z=>z.name.toLowerCase()===nm);}
  if(d){if(!okThisWeek(d,w))return null;const o=Object.assign(snap(d),{isNew:false});
    // Only one of the dish's own versions (by id, or by exact name); anything else is ignored. Claude never adds versions.
    const vk=String(x.variationId||'').trim().toLowerCase();const v=vk&&variationsOf(d).find(z=>z.id.toLowerCase()===vk||z.name.toLowerCase()===vk);if(v)o.variationId=v.id;return o;}
  const name=String(x.name||'').trim();if(!name)return null;
  const known=allLabels();const labels=(Array.isArray(x.labels)?x.labels:[]).map(l=>{const k=known.find(z=>z.name.toLowerCase()===String(l).toLowerCase());return k&&k.name;}).filter(Boolean);
  const sk=skipSet(w);if(labels.some(l=>sk.has(l.toLowerCase())))return null;
  const cl=cuisineList();const cu=cl.find(c=>c.toLowerCase()===String(x.cuisine||'').toLowerCase());
  return {name:name.slice(0,80),cuisine:cu||(cl.includes('Other')?'Other':''),effort:String(x.effort||'').slice(0,20),leftovers:['asis','transform','none'].includes(x.leftovers)?x.leftovers:'none',becomes:Array.isArray(x.becomes)?x.becomes.map(v=>String(v).slice(0,60)).slice(0,3):[],labels,isNew:true};
}
function aiFail(e){
  const c=e&&e.code;
  if(c==='no_key')return S.ai.reason;
  if(c==='bad_key')return E.CLAUDE_MSG.rejected;
  if(c==='no_credits')return 'Your Claude Console account is out of API credits. Add credits on the Console’s Billing page.';
  if(c==='workspace')return 'Your API key isn’t tied to a workspace. Create a key scoped to a workspace, or set workspaceId in app/config.js.';
  if(c==='bad_model')return 'The model in app/config.js wasn’t accepted. Check the model name there.';
  if(c==='offline')return 'Can’t reach Claude. Check your internet connection.';
  if(c==='rate_limited')return 'Claude is busy or you’ve hit a usage limit.';
  if(c==='invalid_json'||c==='empty_completion')return 'Claude’s answer didn’t come back in a usable form.';
  return 'Couldn’t reach Claude.';
}
function usedSet(w,targets){const u=new Set();w.days.forEach((d,i)=>{if(!targets.includes(i)&&d.dinner.kind==='dish'&&d.dinner.dish&&d.dinner.dish.id)u.add(d.dinner.dish.id);});return u;}
function weightedPlan(w,targets,skip){
  const lc=lastCooked();const pool=dishList().filter(d=>okThisWeek(d,w));const used=usedSet(w,targets);const dinners={};
  let prev=null;
  for(let i=0;i<7;i++){
    if(!targets.includes(i)){const dn=w.days[i].dinner;prev=dn.kind==='dish'&&dn.dish?disp(dn.dish).cuisine:null;continue;}
    if(skip.includes(i)){prev=null;continue;}
    const d=pickWeighted(pool,used,prev,lc,w.id);if(d){used.add(d.id);dinners[i]=Object.assign(snap(d),{isNew:false});prev=d.cuisine;}
  }
  const rest=pool.filter(d=>!used.has(d.id)).sort((a,b)=>weight(b,lc,w.id)-weight(a,lc,w.id)).slice(0,5).map(d=>Object.assign(snap(d),{isNew:false}));
  return {dinners,ideas:rest};
}
async function aiPlan(w,targets,newDays,signal){
  const ref=w.id;const lib=libraryForAI(w);
  const excluded=dishList().filter(d=>forDinner(d)&&noOnes(d).length).map(d=>d.name+' ('+noOnes(d).map(p=>p.name).join(', ')+' won’t eat)');
  const fixed=w.days.map((d,i)=>{if(targets.includes(i))return null;const dn=d.dinner;const what=d.away?'away all day':dn.kind==='leftovers'?'leftovers night':dn.kind==='out'?'eating out':dn.kind==='dish'&&dn.dish?dinnerTitle(dn)+' (locked)':'nothing';return DOWL[i]+': '+what;}).filter(Boolean);
  const dayList=targets.map(i=>({day:i,label:DOWL[i]+' '+fmtDate(addDays(w.id,i)),mustBeNew:newDays.includes(i)}));
  const newRule=w.newMode==='all'?'Every day to fill must be a NEW dish that is not in the library.':w.newMode==='library'?'Use library dishes only, except days marked mustBeNew, which must be new dishes not in the library.':'Mostly use the library. Include 1 or 2 NEW dishes (not in the library) across the days to fill; days marked mustBeNew count toward that and must be new.';
  const prompt=`You are planning family dinners for the week of ${fmtRange(w.id)} for "Eat At Home", a meal plan whose goal is to never eat at restaurants.
${household()}

How to choose:
- Ratings per person are fav, fine, meh or null (null means unrated: treat it as fine). Pick dishes with favorites more often, use meh dishes only occasionally for variety.
- Avoid library dishes cooked in the last 10 days (daysSinceCooked) and never repeat a dish within the week.
- Vary cuisines across the week; avoid the same cuisine two nights in a row.
- Vary the kind of meal across the week too, not just the cuisine: avoid several "meat + potato + veg" plates, or several pasta dinners, in one week. Judge the kind of meal from dish and variation names.
- Favor dinners whose leftovers make a good lunch the next day.
- ${newRule}
- New dishes must ${suitLine()}. If the library is too small, suggest new dishes to fill the gaps.
- Never use these, someone won't eat them: ${excluded.length?excluded.join('; '):'(none)'}.
${labelLines(w)}

Notes from the cook for this week: ${w.notes?JSON.stringify(w.notes):'(none)'}

Already set this week (keep these, plan around them):
${fixed.length?fixed.join('\n'):'(nothing)'}

Days to fill:
${JSON.stringify(dayList)}

Library (only dishes the whole family eats):
${JSON.stringify(lib)}

Also suggest 6 alternates the cook could swap in ("ideas"): about half from the library and half new, none repeating the dinners.

Some library dishes list "variations": versions of that dish the family has made. For a library dinner you may set variationId to one of that dish's own variation ids, or null for no particular version. Never invent a variation; new dishes and ideas use null.
Field rules: for library dishes copy libraryId and name exactly. leftovers is "asis" when it reheats well as lunch as it is (soups, stews, chili, saucy dishes), "transform" when the leftovers become a different quick lunch (name 1 or 2 in "becomes", like grilled steak becoming steak tacos), or "none".
Reply with only JSON in this shape: {"dinners":[${shape()}],"ideas":[${shape()}]}`;
  const res=await S.sample.json(prompt,{signal});
  const dinners={};const used=usedSet(w,targets);const names=new Set();
  const arr=res&&Array.isArray(res.dinners)?res.dinners:[];
  targets.forEach(i=>{const x=arr.find(o=>Number(o&&o.day)===i);const d=fromAi(x,w);if(d&&!names.has(d.name.toLowerCase())&&!(d.id&&used.has(d.id))){dinners[i]=d;names.add(d.name.toLowerCase());if(d.id)used.add(d.id);}});
  const missing=targets.filter(i=>!dinners[i]);
  if(missing.length){
    // Fill the gaps against the week as it will be: Claude's picks in place, the days being replaced cleared.
    const after=clone(w);targets.forEach(i=>{after.days[i].dinner=dinners[i]?{kind:'dish',locked:false,dish:dinners[i]}:{kind:'empty',locked:false};});
    const fb=weightedPlan(after,missing,[]);missing.forEach(i=>{if(fb.dinners[i]&&!names.has(fb.dinners[i].name.toLowerCase())){dinners[i]=fb.dinners[i];names.add(fb.dinners[i].name.toLowerCase());}});}
  const ideas=[];(res&&Array.isArray(res.ideas)?res.ideas:[]).forEach(x=>{const d=fromAi(x,w);if(d&&!names.has(d.name.toLowerCase())){names.add(d.name.toLowerCase());ideas.push(d);}});
  return {dinners,ideas:ideas.slice(0,8)};
}
async function aiNewDishes(w,n,signal,avoid){
  const prompt=`Suggest ${n} NEW family dinner ideas for "Eat At Home", a meal plan to stop eating out.
${household()}

They must not be any of these existing dishes: ${JSON.stringify(dishList().map(d=>d.name).concat(avoid||[]))}.
They must ${suitLine()}. Mix cuisines.
${labelLines(w)}
Notes from the cook for this week: ${w.notes?JSON.stringify(w.notes):'(none)'}
leftovers is "asis" if it reheats well as lunch as it is, "transform" if leftovers become a different quick lunch (name it in "becomes"), or "none".
Reply with only a JSON array of ${n} objects like ${shape().replace('"day":0,','').replace('"libraryId":"id or null",','').replace('"variationId":"id or null",','')}`;
  const res=await S.sample.json(prompt,{signal});
  return (Array.isArray(res)?res:[]).map(x=>fromAi(x,w)).filter(d=>d&&d.isNew);
}
async function generate(){
  if(S.busy)return;
  const id=S.weekId;const w=clone(getWeek(id));const mode=S.settings.genMode;
  // Leftovers nights, eating out and locked dinners stay as they are; only dish and empty days are filled.
  const targets=[];w.days.forEach((d,i)=>{if(!d.away&&!d.dinner.locked&&(d.dinner.kind==='dish'||d.dinner.kind==='empty'))targets.push(i);});
  if(!targets.length){S.genMsg='Every dinner is locked or already set. Unlock a day or clear it to regenerate.';E.render();return;}
  const newDays=targets.filter(i=>w.newMode==='all'||w.days[i].tryNew);
  const ctl=new AbortController();S.busy={label:'Planning…',ctl};S.genMsg='';E.render();
  let result,note='';
  try{
    if(mode==='ai'&&S.sample){result=await aiPlan(w,targets,newDays,ctl.signal);}
    else{
      result=weightedPlan(w,targets,newDays);
      if(newDays.length){
        if(S.sample){S.busy.label='Finding new dishes…';E.render();
          try{const fresh=await aiNewDishes(w,newDays.length+3,ctl.signal,Object.values(result.dinners).map(d=>d.name));newDays.forEach((i,k)=>{if(fresh[k])result.dinners[i]=fresh[k];});result.ideas=fresh.slice(newDays.length).concat(result.ideas).slice(0,8);}
          catch(e){if(e&&e.code==='cancelled')throw e;note=aiFail(e)+' New-recipe nights were left open for you to fill.';}
        }else note='Claude is off, so new-recipe nights were left open for you to fill. '+S.ai.reason;
      }
      if(mode==='ai'&&!S.sample)note='Claude is off, so dinners were picked from your library by rating. '+S.ai.reason;
    }
  }catch(e){
    if(e&&e.code==='cancelled'){S.busy=null;S.genMsg='Stopped. Nothing changed.';E.render();return;}
    result=weightedPlan(w,targets,[]);note=aiFail(e)+' Filled the week from your library by rating instead.';
  }
  S.busy=null;S.genMsg=note;
  mutateWeek(id,ww=>{
    targets.forEach(i=>{const d=ww.days[i];if(d.dinner.locked||d.away||(d.dinner.kind!=='dish'&&d.dinner.kind!=='empty'))return;const x=result.dinners[i];d.dinner=x?{kind:'dish',locked:false,dish:x}:{kind:'empty',locked:false};if(x&&x.variationId){d.dinner.variationId=x.variationId;}if(x)delete x.variationId;});
    ww.ideas=result.ideas||[];ww.generatedAt=Date.now();
  });
  if(!Object.keys(result.dinners).length&&!dishList().some(eligibleDinner))S.genMsg=(note?note+' ':'')+'Your library has no family dinners yet. Add a few in the Library tab, or switch New recipes to “All new”.';
  E.render();
}
async function moreIdeas(){
  if(S.busy||!S.sample)return;const id=S.weekId;const w=getWeek(id);const ctl=new AbortController();S.busy={label:'Getting ideas…',ctl};S.genMsg='';E.render();
  try{
    const avoid=w.days.filter(d=>d.dinner.kind==='dish'&&d.dinner.dish).map(d=>disp(d.dinner.dish).name).concat((w.ideas||[]).map(x=>x.name));
    const fresh=await aiNewDishes(w,5,ctl.signal,avoid);
    S.busy=null;mutateWeek(id,ww=>{ww.ideas=(ww.ideas||[]).concat(fresh.filter(f=>!(ww.ideas||[]).some(x=>x.name.toLowerCase()===f.name.toLowerCase()))).slice(0,14);});
    if(!fresh.length){S.genMsg='Claude didn’t come back with new ideas. Try again in a moment.';E.render();}
  }catch(e){S.busy=null;S.genMsg=e&&e.code==='cancelled'?'':aiFail(e);E.render();}
}

Object.assign(E,{cookTime,rulesList,likedCuisines,suitLine,household,libraryForAI,shape,labelLines,fromAi,aiFail,usedSet,weightedPlan,aiPlan,aiNewDishes,generate,moreIdeas});
})();
