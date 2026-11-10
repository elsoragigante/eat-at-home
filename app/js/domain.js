(function(){
'use strict';
const E=window.EAH;
const {DOW,clone,uid,addDays,today,weekOf,daysBetween,S,changed,changedSoon,DEFAULT_CUISINES,MAX_VARIATIONS,VARIATION_MAX}=E;
/* ---------- domain ---------- */
function dishList(){return Object.values(S.dishes).sort((a,b)=>a.name.localeCompare(b.name));}
function r(d,p){return (d.ratings||{})[p]||null;}
function forDinner(d){return (d.useFor||['dinner']).includes('dinner');}
function forLunch(d){return (d.useFor||[]).includes('lunch');}
/* people: settings.people = [{id,name,isCook,note,lunch,breakfast}] */
function people(){return Array.isArray(S.settings.people)?S.settings.people:[];}
function cook(){const ps=people();return ps.find(p=>p.isCook)||ps[0]||null;}
// Who gets the planned lunch (one lunch line per day). Falls back to the cook.
function lunchGroup(){const l=people().filter(p=>p.lunch);if(l.length)return l;const c=cook();return c?[c]:[];}
function cookOnlyLunch(){const l=lunchGroup();const c=cook();return l.length<=1&&(!l.length||!c||l[0].id===c.id);}
// A name for example placeholders: the first person who isn't the cook.
function exampleName(){const p=people().find(x=>!x.isCook);return p?p.name:'';}
// A new person: id from the name (unique), the cook only when they're the first one.
function newPerson(name,existing){const base=String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'person';let id=base,n=2;while(existing.some(p=>p.id===id))id=base+'-'+(n++);
  return {id,name,isCook:!existing.length,note:'',lunch:!existing.length,breakfast:!existing.length};}
function breakfastPeople(){return people().filter(p=>p.breakfast);}
function personById(id){return people().find(p=>p.id===id)||null;}
function lunchScore(d){const l=lunchGroup();if(!l.length)return 2;return l.reduce((s,p)=>s+(SC[r(d,p.id)]||2),0)/l.length;}
function weekShape(){const w=S.settings.week||{};const ok=v=>Number.isInteger(v)&&v>=0&&v<=6?v:null;const lo=w.leftovers||{};
  const n=Number.isInteger(lo.count)?Math.max(0,Math.min(MAX_LEFTOVERS,lo.count)):1;const day=ok(lo.day);
  return {leftovers:{count:n,day:day==null?3:day},clearoutLunch:ok(w.clearoutLunch)};}
/* leftovers nights: the count is the week's leftovers tiles, never stored */
const MAX_LEFTOVERS=3;
function leftoversDays(w){const o=[];w.days.forEach((d,i)=>{if(d.dinner.kind==='leftovers')o.push(i);});return o;}
function leftoversEligible(w,i){const d=w.days[i];return !d.away&&!d.dinner.locked&&d.dinner.kind!=='out'&&d.dinner.kind!=='leftovers';}
// Where the next leftovers night goes, or null. The usual day when the week has none yet;
// otherwise empty days before planned ones, then the day farthest from the other leftovers
// nights, then the later day. Sunday (nothing cooked yet) and clear-out lunch days (nothing
// left) are used only when no other day is eligible.
function pickLeftoversDay(w){
  const el=[0,1,2,3,4,5,6].filter(i=>leftoversEligible(w,i));if(!el.length)return null;
  const avoid=i=>i===0||(w.days[i].lunch&&w.days[i].lunch.kind==='clearout');
  let pool=el.filter(i=>!avoid(i));if(!pool.length)pool=el;
  const have=leftoversDays(w);
  if(!have.length){const L=weekShape().leftovers.day;if(el.includes(L))return L;return pool.slice().sort((a,b)=>Math.abs(a-L)-Math.abs(b-L)||b-a)[0];}
  const dist=i=>Math.min(...have.map(h=>Math.abs(h-i)));
  const planned=i=>w.days[i].dinner.kind==='dish'&&w.days[i].dinner.dish?1:0;
  return pool.slice().sort((a,b)=>planned(a)-planned(b)||dist(b)-dist(a)||b-a)[0];
}
function canAddLeftovers(w){return leftoversDays(w).length<MAX_LEFTOVERS&&pickLeftoversDay(w)!=null;}
function noOnes(d){return people().filter(p=>r(d,p.id)==='no');}
function eligibleDinner(d){return forDinner(d)&&noOnes(d).length===0;}
function cuisineList(){const base=(Array.isArray(S.settings.cuisines)?S.settings.cuisines:DEFAULT_CUISINES).slice();Object.values(S.dishes).forEach(d=>{if(d.cuisine&&!base.some(c=>c.toLowerCase()===d.cuisine.toLowerCase()))base.push(d.cuisine);});return base;}
function cookbookList(){const base=(Array.isArray(S.settings.cookbooks)?S.settings.cookbooks:[]).slice();Object.values(S.dishes).forEach(d=>{booksOf(d).forEach(b=>{if(!base.some(c=>c.toLowerCase()===b.toLowerCase()))base.push(b);});});return base;}
// A dish's recipes: pointers to where each recipe lives, never the recipe itself. Up to MAX_SOURCES,
// each a cookbook {book, where}, a meal kit {kit, where} or a link {url}, with an optional short label.
const MAX_SOURCES=5,SOURCE_LABEL_MAX=30;
function normSource(s){if(!s||typeof s!=='object')return null;let o=null;
  if(s.type==='book'&&s.book)o={type:'book',book:String(s.book),where:String(s.where||'')};
  else if(s.type==='kit')o={type:'kit',kit:String(s.kit||''),where:String(s.where||'')};
  else if(s.type==='url'&&/^https?:\/\//i.test(String(s.url||'')))o={type:'url',url:String(s.url)};
  if(!o)return null;const lab=String(s.label||'').trim().replace(/\s+/g,' ').slice(0,SOURCE_LABEL_MAX);if(lab)o.label=lab;return o;}
// Reads dish.sources, or the single dish.source older data had.
function sourcesOf(d){if(!d)return [];const arr=Array.isArray(d.sources)?d.sources:d.source?[d.source]:[];return arr.map(normSource).filter(Boolean).slice(0,MAX_SOURCES);}
function booksOf(d){return sourcesOf(d).filter(s=>s.type==='book').map(s=>s.book);}
function usesBook(d,name){const n=String(name).toLowerCase();return booksOf(d).some(b=>b.toLowerCase()===n);}
// One recipe on its own: "Book · where", "Meal kit · kit · where" (empty parts dropped).
function sourceText(s){if(!s)return '';if(s.type==='book')return [s.book,s.where].filter(Boolean).join(' · ');if(s.type==='kit')return ['Meal kit',s.kit,s.where].filter(Boolean).join(' · ');return '';}
// One recipe inside a list of several (the list is joined with " · ", so its own parts use ", ").
function sourcePart(s){if(s.type==='book')return [s.book,s.where].filter(Boolean).join(', ');if(s.type==='kit')return ['Meal kit',s.kit,s.where].filter(Boolean).join(', ');return 'Link';}
// Plain text of a dish's recipe line (the tooltip): one recipe as before; several with "Label: " prefixes.
function sourcesText(list){if(!list.length)return '';if(list.length===1)return list[0].type==='url'?'Link':sourceText(list[0]);
  return list.map(s=>(s.label?s.label+': ':'')+sourcePart(s)).join(' · ');}
// What Library search matches: every recipe's label and fields ("Meal kit" for kits).
function sourceSearch(d){return sourcesOf(d).map(s=>[s.label,s.type==='kit'?'Meal kit':'',s.book,s.kit,s.where,s.url].filter(Boolean).join(' ')).join(' ');}
// Meal kit names used on dishes (not a managed list), first spelling wins.
function kitList(){const out=[];Object.values(S.dishes).forEach(d=>sourcesOf(d).forEach(s=>{const k=s.type==='kit'?s.kit.trim():'';if(k&&!out.some(x=>x.toLowerCase()===k.toLowerCase()))out.push(k);}));return out.sort((a,b)=>a.localeCompare(b));}
function labelsOf(d){return Array.isArray(d&&d.labels)?d.labels:[];}
function allLabels(){const m=new Map();Object.values(S.dishes).forEach(d=>labelsOf(d).forEach(l=>{const k=l.toLowerCase();const e=m.get(k);if(e)e.count++;else m.set(k,{name:l,count:1});}));return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name));}
function skipSet(w){return new Set(((w&&w.skipLabels)||[]).map(x=>x.toLowerCase()));}
function skippedBy(d,w){const st=skipSet(w);return labelsOf(d).filter(l=>st.has(l.toLowerCase()));}
function okThisWeek(d,w){return eligibleDinner(d)&&!skippedBy(d,w).length;}
function canonLabel(l){const t=String(l).trim().replace(/\s+/g,' ').slice(0,40);if(!t)return '';const ex=allLabels().find(x=>x.name.toLowerCase()===t.toLowerCase());return ex?ex.name:t;}
function lunchable(d){return lunchGroup().every(p=>r(d,p.id)!=='no');}
function justMe(d){const l=new Set(lunchGroup().map(p=>p.id));return lunchable(d)&&people().some(p=>!l.has(p.id)&&r(d,p.id)==='no');}
function favCount(d){return people().filter(p=>r(d,p.id)==='fav').length;}
// The family-favorite star: 2 or more favorites (or everyone, in a household smaller than that).
function isFamilyFav(d){const n=people().length;return n>0&&favCount(d)>=Math.min(2,n);}
const SC={fav:3,fine:2,meh:1};
function snap(d){const o={id:d.id,name:d.name,cuisine:d.cuisine||'',effort:d.effort||'',leftovers:d.leftovers||'none',becomes:(d.becomes||[]).slice(),labels:labelsOf(d).slice()};const src=sourcesOf(d);if(src.length)o.sources=src;return o;}
function disp(x){if(!x)return null;if(x.id&&S.dishes[x.id])return Object.assign(snap(S.dishes[x.id]),{isNew:!!x.isNew});return x;}
function lastCooked(){
  const m={};const t=today();
  Object.values(S.weeks).forEach(w=>{(w.days||[]).forEach((day,i)=>{const dt=addDays(w.id,i);if(dt>t||day.away)return;const dn=day.dinner;if(!dn||dn.kind!=='dish'||!dn.dish)return;
    const keys=[];if(dn.dish.id)keys.push(dn.dish.id);if(dn.dish.name)keys.push('n:'+dn.dish.name.toLowerCase());
    keys.forEach(k=>{if(!m[k]||m[k]<dt)m[k]=dt;});});});
  return m;
}
function lastFor(d,lc){return lc[d.id]||lc['n:'+d.name.toLowerCase()]||null;}
function weight(d,lc,ref){
  const ps=people();let sum=0;ps.forEach(p=>{sum+=SC[r(d,p.id)]||2;});const m=ps.length?sum/ps.length:2;let w=m*m;
  const last=lastFor(d,lc);if(last){const ago=daysBetween(last,ref);if(ago<7)w*=0.05;else if(ago<14)w*=0.35;else if(ago<21)w*=0.7;}
  return w;
}
function pickWeighted(pool,used,prevCuisine,lc,ref){
  const cands=pool.filter(d=>!used.has(d.id));if(!cands.length)return null;
  const ws=cands.map(d=>weight(d,lc,ref)*(prevCuisine&&d.cuisine===prevCuisine?0.5:1));
  const tot=ws.reduce((a,b)=>a+b,0);let x=Math.random()*tot;
  for(let i=0;i<cands.length;i++){x-=ws[i];if(x<=0)return cands[i];}
  return cands[cands.length-1];
}
function latestWeekBefore(id){const ks=Object.keys(S.weeks).filter(k=>k<id).sort();return ks.length?S.weeks[ks[ks.length-1]]:null;}
function newWeek(id){
  const prev=latestWeekBefore(id);
  const ws=weekShape();
  const days=Array.from({length:7},(_,i)=>({tryNew:false,away:false,lunch:{kind:i===ws.clearoutLunch?'clearout':'auto'},dinner:{kind:'empty',locked:false},eaten:{}}));
  const pb=prev?bk(prev):{};const breakfast={};breakfastPeople().forEach(p=>{breakfast[p.id]=pb[p.id]||'';});
  const w={id,notes:'',newMode:'mix',ideas:[],lunchPrep:null,breakfast,days};
  for(let k=0;k<ws.leftovers.count;k++){const i=pickLeftoversDay(w);if(i==null)break;days[i].dinner={kind:'leftovers',locked:false};}
  return w;
}
// Breakfast lines keyed by person id. Older weeks used breakfast.me / breakfast.batch for the cook.
function bk(w){const b=(w&&w.breakfast)||{};const c=cook();const out={};
  people().forEach(p=>{let v=b[p.id];if(v==null&&c&&p.id===c.id)v=b.me!=null?b.me:b.batch;out[p.id]=v||'';});return out;}
function setBreakfast(w,pid,v){const c=cook();const o=Object.assign({},w.breakfast||{});delete o.batch;if(c&&c.id!=='me'&&!personById('me'))delete o.me;Object.assign(o,bk(w));o[pid]=v;w.breakfast=o;}
function getWeek(id){return S.weeks[id]||(S.drafts[id]||(S.drafts[id]=newWeek(id)));}
function mutateWeek(id,fn){const w=clone(getWeek(id));fn(w);w.updated=Date.now();S.weeks[id]=w;delete S.drafts[id];changed();E.render();}
function quietWeek(id,fn){if(!S.weeks[id]){S.weeks[id]=clone(getWeek(id));delete S.drafts[id];}const w=S.weeks[id];fn(w);w.updated=Date.now();changedSoon();}
function saveSettings(){changed();}
function saveDish(d){S.dishes[d.id]=d;changed();}
function deleteDish(id){delete S.dishes[id];changed();}

function prevDinner(w,i){
  if(i>0){const d=w.days[i-1];return {day:DOW[i-1],away:d.away,dn:d.dinner};}
  const pw=S.weeks[addDays(w.id,-7)];if(!pw)return null;const d=pw.days[6];return {day:'Sat',away:d.away,dn:d.dinner};
}
function resolveLunch(w,i){
  const day=w.days[i];if(day.away)return {label:'Eating out',src:'away all day',kind:'out'};
  const L=day.lunch||{kind:'auto'};
  if(L.kind==='clearout')return {label:'Eat up the leftovers',src:i===weekShape().clearoutLunch?'whole family':'clear out the fridge',kind:'clearout'};
  if(L.kind==='out')return {label:'Eating out',src:'',kind:'out'};
  if(L.kind==='pick'||L.kind==='prep')return {label:L.label,src:L.src||'',kind:L.kind};
  const p=prevDinner(w,i);
  if(!p||p.away||!p.dn||p.dn.kind!=='dish'||!p.dn.dish)return {label:'',src:'pick a quick lunch',kind:'empty'};
  const d=disp(p.dn.dish);
  const t=dinnerTitle(p.dn);
  if(d.leftovers==='asis')return {label:t,src:p.day+' dinner, as-is',kind:'auto'};
  if(d.leftovers==='transform')return {label:(d.becomes&&d.becomes[0])||('Leftover '+t),src:'from '+p.day+' dinner',kind:'auto'};
  return {label:'',src:'pick a quick lunch',kind:'empty'};
}
function hasDinners(w){return w.days.some(d=>d.dinner.kind==='dish');}
function weekRel(id){const cur=weekOf(today());if(id===cur)return 'This week';if(id===addDays(cur,7))return 'Next week';if(id<cur)return 'Past week';return 'Upcoming';}
/* ---------- variations ----------
   A dish's versions ("penne", "roasted potatoes + asparagus"): just names with ids, on the library dish.
   A planned dinner may carry variationId; one that no longer exists shows just the dish. */
function variationsOf(d){return Array.isArray(d&&d.variations)?d.variations:[];}
function cleanVarName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,VARIATION_MAX);}
function variationIn(d,vid){return vid?variationsOf(d).find(v=>v.id===vid)||null:null;}
// The variation of a planned dinner (or idea): {id,name} or null.
function dishVariation(dish,vid){if(!dish||!dish.id||!vid)return null;return variationIn(S.dishes[dish.id],vid);}
function dinnerVariation(dn){if(!dn||dn.kind!=='dish'||!dn.dish)return null;return dishVariation(dn.dish,dn.variationId);}
// A planned meal's name: a picked version is a complete meal name, so it's shown instead of the dish name.
function dinnerTitle(dn){if(!dn||!dn.dish)return '';const v=dinnerVariation(dn);return v?v.name:disp(dn.dish).name;}
// The same for an idea (a dish snapshot that may carry variationId).
function ideaTitle(x){if(!x)return '';const v=dishVariation(x,x.variationId);return v?v.name:disp(x).name;}
function setVariation(i,vid){mutateWeek(S.weekId,w=>{const dn=w.days[i].dinner;if(dn.kind!=='dish'||!dn.dish)return;if(vid)dn.variationId=vid;else delete dn.variationId;});}
// Adds a version to the dish (or finds one with that name) and picks it for day i. One undo step.
function addVariationAndPick(i,name){
  const w=getWeek(S.weekId);const dn=w.days[i].dinner;const d=dn.kind==='dish'&&dn.dish&&dn.dish.id&&S.dishes[dn.dish.id];const n=cleanVarName(name);
  if(!d||!n)return {err:'Type a name for this version.'};
  let v=variationsOf(d).find(x=>x.name.toLowerCase()===n.toLowerCase());
  if(!v){if(variationsOf(d).length>=MAX_VARIATIONS)return {err:'A dish can have up to '+MAX_VARIATIONS+' versions.'};
    const nd=clone(d);v={id:uid(),name:n};nd.variations=variationsOf(d).concat(v);nd.updated=Date.now();saveDish(nd);}
  setVariation(i,v.id);return {v};
}

/* ---------- merging two dishes ----------
   The merged dish ("from") becomes a version of "to": its own versions come along, every planned and past
   reference points to "to" with that version, ratings/labels/notes/recipes combine as below. */
const sameSource=(a,b)=>a.type===b.type&&(a.book||'')===(b.book||'')&&(a.kit||'')===(b.kit||'')&&(a.where||'')===(b.where||'')&&(a.url||'')===(b.url||'');
function mergePlan(fromId,toId,versionName){
  const from=S.dishes[fromId],to=S.dishes[toId];if(!from||!to||fromId===toId)return null;
  const vname=cleanVarName(versionName);const vars=variationsOf(to).map(v=>({id:v.id,name:v.name}));const idMap={};const dropped=[];
  let main=vname?vars.find(v=>v.name.toLowerCase()===vname.toLowerCase()):null;let err='';
  if(!vname)err='Give this version a name.';
  else if(!main){if(vars.length>=MAX_VARIATIONS)err=to.name+' already has '+MAX_VARIATIONS+' versions, the most a dish can have. Remove one first.';else{main={id:uid(),name:vname};vars.push(main);}}
  variationsOf(from).forEach(v=>{const ex=vars.find(x=>x.name.toLowerCase()===v.name.toLowerCase());
    if(ex)idMap[v.id]=ex.id;else if(vars.length<MAX_VARIATIONS){vars.push({id:v.id,name:v.name});idMap[v.id]=v.id;}else{dropped.push(v.name);if(main)idMap[v.id]=main.id;}});
  const srcs=sourcesOf(to);const skipped=[];
  sourcesOf(from).forEach(s=>{if(srcs.some(x=>sameSource(x,s)))return;const o=Object.assign({},s);if(!o.label&&vname)o.label=vname.slice(0,SOURCE_LABEL_MAX);
    if(srcs.length<MAX_SOURCES)srcs.push(o);else skipped.push(o);});
  const ratings={};people().forEach(p=>{const v=r(to,p.id)||r(from,p.id);if(v)ratings[p.id]=v;});
  const labels=labelsOf(to).slice();labelsOf(from).forEach(l=>{if(!labels.some(x=>x.toLowerCase()===l.toLowerCase()))labels.push(l);});
  const tn=String(to.notes||'').trim(),fn=String(from.notes||'').trim();
  const notes=fn&&fn.toLowerCase()!==tn.toLowerCase()?(tn?tn+' · '+fn:fn):tn;
  const dish=Object.assign(clone(to),{ratings,labels:labels.slice(0,12),notes,sources:srcs,variations:vars,updated:Date.now()});delete dish.source;
  return {from,to,vname,main,err,dish,idMap,dropped,skipped};
}
function mergeDishes(fromId,toId,versionName){
  const m=mergePlan(fromId,toId,versionName);if(!m||m.err)return m;
  const {from,to,dish,main,idMap}=m;const fromName=from.name.toLowerCase();
  const isFrom=x=>x&&(x.id===from.id||(!x.id&&String(x.name||'').toLowerCase()===fromName));
  const vidFor=old=>old&&idMap[old]?idMap[old]:main.id;
  const label=main.name;
  const relabel=L=>{if(String(L.label||'').toLowerCase()===fromName)L.label=label;};
  const fix=w=>{let hit=false;
    (w.days||[]).forEach(day=>{const dn=day.dinner;
      if(dn&&dn.kind==='dish'&&isFrom(dn.dish)){const nw=Object.assign(snap(dish),dn.dish.isNew?{isNew:true}:{});dn.variationId=vidFor(dn.dish.id===from.id&&dn.variationId);dn.dish=nw;hit=true;}
      const L=day.lunch;if(L&&L.dishId===from.id){L.dishId=dish.id;L.variationId=vidFor(L.variationId);relabel(L);hit=true;}
      if(L&&L.kind==='prep'&&w.lunchPrep&&w.lunchPrep.dishId===from.id){relabel(L);hit=true;}});
    if(w.lunchPrep&&w.lunchPrep.dishId===from.id){const lp=w.lunchPrep;lp.dishId=dish.id;lp.variationId=vidFor(lp.variationId);if(String(lp.name||'').toLowerCase()===fromName)lp.name=label;hit=true;}
    if(Array.isArray(w.ideas)&&w.ideas.some(isFrom)){const seen=new Set();
      w.ideas=w.ideas.map(x=>isFrom(x)?Object.assign(snap(dish),{isNew:false,variationId:vidFor(x.id===from.id&&x.variationId)}):x)
        .filter(x=>{const k=(x.id||x.name.toLowerCase())+'|'+(x.variationId||'');if(seen.has(k))return false;seen.add(k);return true;});hit=true;}
    if(hit)w.updated=Date.now();};
  Object.values(S.weeks).forEach(fix);Object.values(S.drafts).forEach(fix);
  delete S.dishes[from.id];S.dishes[dish.id]=dish;changed();
  return m;
}
/* ---------- plan mutations ---------- */
function setLunch(i,L){E.closePop();mutateWeek(S.weekId,w=>{w.days[i].lunch=L;});}
function setDinner(i,dn){mutateWeek(S.weekId,w=>{const old=w.days[i].dinner;if(old.kind==='dish'&&old.dish&&dn.kind!=='dish')pushIdea(w,old.dish,old.variationId);if(old.kind==='dish'&&old.dish&&dn.kind==='dish'&&old.dish.name!==dn.dish.name)pushIdea(w,old.dish,old.variationId);w.days[i].dinner=Object.assign({locked:false},dn);});}
function pushIdea(w,dish,vid){w.ideas=w.ideas||[];if(!w.ideas.some(x=>x.name.toLowerCase()===dish.name.toLowerCase())){const x=clone(dish);if(vid)x.variationId=vid;else delete x.variationId;w.ideas.unshift(x);}w.ideas=w.ideas.slice(0,12);}
function placeIdea(k,i){mutateWeek(S.weekId,w=>{const it=w.ideas[k];if(!it)return;w.ideas.splice(k,1);const old=w.days[i].dinner;if(old.kind==='dish'&&old.dish)pushIdea(w,old.dish,old.variationId);const vid=it.variationId;delete it.variationId;w.days[i].dinner={kind:'dish',locked:false,dish:it};if(vid)w.days[i].dinner.variationId=vid;w.days[i].away=false;});}
function placeLib(id,i){const d=S.dishes[id];if(!d)return;setDinner(i,{kind:'dish',dish:snap(d)});}
function swapDays(a,b){if(a===b)return;mutateWeek(S.weekId,w=>{const t=w.days[a].dinner;w.days[a].dinner=w.days[b].dinner;w.days[b].dinner=t;});}
// + places one leftovers night (a planned dish there moves to Other ideas); − removes the latest one.
function addLeftovers(){const w=getWeek(S.weekId);if(!canAddLeftovers(w))return;const i=pickLeftoversDay(w);const dn=w.days[i].dinner;
  if(dn.kind==='dish'&&dn.dish)S.genMsg='Moved '+dinnerTitle(dn)+' to Other ideas to make room for a leftovers night.';
  setDinner(i,{kind:'leftovers'});}
function removeLeftovers(){const ds=leftoversDays(getWeek(S.weekId));if(!ds.length)return;setDinner(ds[ds.length-1],{kind:'empty'});}
function clearPrep(){mutateWeek(S.weekId,w=>{w.days.forEach(d=>{if(d.lunch&&d.lunch.kind==='prep')d.lunch={kind:'auto'};});w.lunchPrep=null;});}
Object.assign(E,{variationsOf,cleanVarName,variationIn,dishVariation,dinnerVariation,dinnerTitle,ideaTitle,setVariation,addVariationAndPick,mergePlan,mergeDishes,MAX_LEFTOVERS,leftoversDays,leftoversEligible,pickLeftoversDay,canAddLeftovers,addLeftovers,removeLeftovers,newPerson,exampleName,people,cook,lunchGroup,cookOnlyLunch,breakfastPeople,personById,lunchScore,weekShape,isFamilyFav,setBreakfast,dishList,r,forDinner,forLunch,noOnes,eligibleDinner,cuisineList,cookbookList,MAX_SOURCES,SOURCE_LABEL_MAX,normSource,sourcesOf,booksOf,usesBook,sourceText,sourcePart,sourcesText,sourceSearch,kitList,labelsOf,allLabels,skipSet,skippedBy,okThisWeek,canonLabel,lunchable,justMe,favCount,SC,snap,disp,lastCooked,lastFor,weight,pickWeighted,latestWeekBefore,newWeek,bk,getWeek,mutateWeek,quietWeek,saveSettings,saveDish,deleteDish,prevDinner,resolveLunch,hasDinners,weekRel,setLunch,setDinner,pushIdea,placeIdea,placeLib,swapDays,clearPrep});
})();
