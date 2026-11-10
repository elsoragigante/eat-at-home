(function(){
'use strict';
const E=window.EAH;
const {RATE_LABEL,DOW,DOWL,THEMES,I,esc,addDays,today,fmtDate,defaultWeekId,fmtRange,dayLabel,S,main,dishList,r,forDinner,forLunch,noOnes,eligibleDinner,labelsOf,allLabels,okThisWeek,justMe,favCount,disp,lastCooked,lastFor,weight,bk,getWeek,resolveLunch,hasDinners,weekRel,people,cook,cookOnlyLunch,breakfastPeople,isFamilyFav,weekShape,variationsOf,dinnerVariation,dinnerTitle,ideaTitle,weekOf,lsGet}=E;
/* ---------- render ---------- */
function render(){
  const a=document.activeElement;const fid=a&&a.id&&main.contains(a)?a.id:null;
  let sel=null;try{if(fid&&a.selectionStart!=null)sel=[a.selectionStart,a.selectionEnd];}catch(e){}
  document.querySelectorAll('.nav button').forEach(b=>{const on=b.dataset.view===S.view;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false');});
  document.getElementById('settings-btn').classList.toggle('on',S.view==='settings');
  document.body.classList.toggle('wizard',S.view==='wizard');
  let html='';
  if(!S.ready){html+='<div class="panel empty-state"><h3>Loading your plan…</h3><p>Your library, weeks and family notes are on their way.</p></div>';}
  else html+=({plan:viewPlan,library:viewLibrary,family:viewFamily,history:viewHistory,settings:viewSettings,wizard:()=>E.viewWizard()}[S.view]||viewPlan)();
  main.innerHTML=html;
  E.updateStatus();
  if(fid){const el=document.getElementById(fid);if(el){el.focus({preventScroll:true});if(sel&&el.setSelectionRange){try{el.setSelectionRange(sel[0],sel[1]);}catch(e){}}}}
}
function refocus(layer,fn){const a=document.activeElement;const id=a&&a.id&&layer.contains(a)?a.id:null;fn();if(id){const el=document.getElementById(id);if(el)el.focus({preventScroll:true});}}

/* ---------- Plan view ---------- */
function daysText(ds){
  const a=ds.slice().sort((x,y)=>x-y);const out=[];let i=0;
  while(i<a.length){let j=i;while(j+1<a.length&&a[j+1]===a[j]+1)j++;out.push(j-i>=2?DOW[a[i]]+'–'+DOW[a[j]]:a.slice(i,j+1).map(k=>DOW[k]).join(', '));i=j+1;}
  return out.join(', ');
}
function rulesCount(){return S.settings.rules.length+dishList().filter(d=>forDinner(d)&&noOnes(d).length).length;}
function viewPlan(){
  const w=getWeek(S.weekId);const mode=S.settings.genMode;const t=today();const b=bk(w);const c=cook();
  let h=`<div class="wk-head"><div class="wk-left">
    <span class="eyebrow">${esc(weekRel(w.id))}${S.weeks[w.id]?'':' · not started'}</span>
    <div class="wk-title"><button class="ibtn" data-act="week" data-d="-7" aria-label="Previous week">${I.left}</button>
    <h1>Week of ${esc(fmtRange(w.id))}</h1>
    <button class="ibtn" data-act="week" data-d="7" aria-label="Next week">${I.right}</button>
    ${w.id!==weekOf(t)?`<button class="linkbtn" id="wk-today" data-act="weekReset" style="margin-left:8px;font-size:13px" aria-label="Go to this week">Today</button>`:''}</div></div>
    <div class="wk-right">
    ${(w.skipLabels||[]).length?`<button class="note-chip" id="skip-chip" data-act="planOptions" aria-label="Skipping this week: ${esc(w.skipLabels.join(', '))}. Click to change."><span>Skipping ${esc(w.skipLabels.join(', '))}</span>${I.pencil}</button>`:''}
    ${(()=>{const hasNotes=!!(w.notes&&w.notes.trim());return `<button class="btn-ghost po-btn" id="po-btn" data-act="planOptions" aria-haspopup="dialog"${hasNotes?' aria-label="Plan options (this week has notes)"':''}>Plan options ${I.chev}${hasNotes?'<span class="po-dot" aria-hidden="true"></span>':''}</button>`;})()}
    ${mode==='manual'?'':(S.busy?`<button class="btn-primary" disabled>${I.spin} ${esc(S.busy.label)}</button><button class="btn-ghost" data-act="stop">Stop</button>`:`<button class="btn-primary" data-act="generate">${I.refresh} ${hasDinners(w)?'Regenerate':'Generate week'}</button>`)}
    </div></div>`;
  if(S.genMsg)h+=`<div class="gen-msg" role="status"><span>${esc(S.genMsg)}${S.genMsg.includes('app/config.js')?` <a href="${E.KEY_GUIDE}" target="_blank" rel="noopener">How to get a key</a>`:''}</span><button class="ibtn" data-act="dismissMsg" aria-label="Dismiss message">${I.x}</button></div>`;
  const lp=w.lunchPrep;
  h+=`<div class="thisweek">
    ${breakfastPeople().map((p,k)=>{const isC=c&&p.id===c.id;return `<div class="tw-field"><label for="bk-${k}">${isC?'My breakfast':esc(p.name)}</label><input id="bk-${k}" data-input="bk" data-p="${esc(p.id)}" value="${esc(b[p.id]||'')}" placeholder="${isC?'Your breakfast this week':'Breakfast this week'}" autocomplete="off"></div>`;}).join('')}
    <div class="tw-field"><span class="lab">Lunch prep</span>${lp?`<span class="tw-val">${esc(lp.name)} <span class="muted">· ${esc(daysText(lp.days))}</span></span><button class="linkbtn" id="prep-btn" data-act="prepOpen">Change</button>`:`<button class="linkbtn" id="prep-btn" data-act="prepOpen">Add</button>`}</div>
  </div>`;
  h+=`<div class="scroll"><div class="wgrid">`;
  for(let i=0;i<7;i++){
    const d=w.days[i];const dt=addDays(w.id,i);const L=resolveLunch(w,i);
    // Each day's header, lunch and dinner are placed in rows 1–3 of its column, so the rows line up
    // across the week and every dinner card is the same height (plain grid placement; no subgrid).
    const at=row=>`style="grid-column:${i+1};grid-row:${row}"`;
    h+=`<div class="dh d${i} ${dt===t?'today':''}" ${at(1)}><span class="disp">${dayLabel(w.id,i)}</span><span class="dh-r">${d.away?'<span class="awaychip">Away</span>':d.tryNew?'<span class="newb">New night</span>':''}<button class="ibtn dm" id="dm-${i}" data-act="dayMenu" data-i="${i}" aria-label="${DOWL[i]} options">${I.dots}</button></span></div>
      <button ${at(2)} class="lunch d${i} ${L.kind==='empty'?'empty':''} ${L.kind==='out'?'out':''}" id="lb-${i}" data-act="lunchPick" data-i="${i}" aria-label="${DOWL[i]} lunch: ${esc(L.label||'not set')}">${esc(L.label||'+ Add lunch')}</button>
      <div class="dcell d${i}" ${at(3)} data-drop="${i}">${dinnerCard(w,i)}</div>`;
  }
  h+=`</div></div>`;
  h+=tray(w,mode);
  return h;
}
function leftoversStepper(w){const n=E.leftoversDays(w).length;
  return `<div class="tw-field"><span class="lab" id="lo-lab">Leftovers nights</span><span class="stepper" role="group" aria-labelledby="lo-lab">
    <button class="ibtn" id="lo-minus" data-act="loMinus" aria-label="Fewer leftovers nights" ${n?'':'disabled'}>−</button>
    <span class="step-n" aria-live="polite">${n}</span>
    <button class="ibtn" id="lo-plus" data-act="loPlus" aria-label="More leftovers nights" ${E.canAddLeftovers(w)?'':'disabled'}>+</button></span></div>`;}
function countOptions(cur){return [0,1,2,3].map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n}</option>`).join('');}
function weekdayOptions(cur){return DOWL.map((d,i)=>`<option value="${i}" ${cur===i?'selected':''}>${d}</option>`).join('');}
function dinnerCard(w,i){
  const day=w.days[i];const dn=day.dinner;
  const menu=`<button class="ibtn" id="cm-${i}" data-act="cardMenu" data-i="${i}" aria-label="${DOWL[i]} dinner options">${I.dots}</button>`;
  if(day.away)return `<div class="dish out"><div class="dn"><span>Eating out</span></div><div class="meta">Away all day</div></div>`;
  if(dn.kind==='out')return `<div class="dish out" draggable="true" data-drag-day="${i}"><div class="acts">${menu}</div><div class="dn"><span>Eating out</span></div><div class="meta">No cooking tonight</div></div>`;
  if(dn.kind==='leftovers')return `<div class="dish valve" draggable="true" data-drag-day="${i}"><div class="acts">${menu}</div><div class="dn"><span>Leftovers night</span></div><div class="lo none">Clear out the fridge</div></div>`;
  if(dn.kind!=='dish'||!dn.dish)return `<button class="add-dinner" id="din-pick-${i}" data-act="dinnerPick" data-i="${i}" aria-label="Add ${DOWL[i]} dinner"><span>+ Add dinner</span>${day.tryNew?'<small>New dish night</small>':''}</button>`;
  const d=disp(dn.dish);const name=dinnerTitle(dn);const rl=recipeShort(E.sourcesOf(d));
  return `<div class="dish meal ${d.isNew?'new':''} ${dn.locked?'locked':''}" draggable="true" data-drag-day="${i}" data-act="mealOpen" data-i="${i}">
    <div class="acts"><button class="ibtn ${dn.locked?'on':''}" data-act="lock" data-i="${i}" aria-pressed="${!!dn.locked}" aria-label="${dn.locked?'Unlock':'Lock'} ${esc(name)}">${dn.locked?I.lock:I.unlock}</button><button class="ibtn" id="sw-${i}" data-act="dinnerPick" data-i="${i}" aria-label="Swap ${esc(name)}">${I.swap}</button>${menu}</div>
    ${d.isNew?'<span class="newb">New</span>':''}
    <div class="dn"><span class="dn-t" id="mo-${i}" role="button" tabindex="0" data-act="mealOpen" data-i="${i}" aria-haspopup="dialog" aria-label="${esc(name)}${d.effort?', '+esc(d.effort):''}. Show details.">${esc(name)}</span>${dn.locked?`<span class="lk" role="img" aria-label="Locked">${I.lock}</span>`:''}</div>
    ${d.effort?`<div class="meta">${esc(d.effort)}</div>`:''}
    ${rl?`<div class="src" title="${esc(rl)}">${esc(rl)}</div>`:''}</div>`;
}
// The card's recipe line: "Book · page", "Meal kit", "Internet recipe"; several are the distinct short forms
// joined with " · " (labels, kit names and links stay in the details view).
function recipeShort(list){const out=[];(list||[]).forEach(s=>{const t=s.type==='book'?[s.book,s.where].filter(Boolean).join(' · '):s.type==='kit'?'Meal kit':'Internet recipe';if(t&&!out.includes(t))out.push(t);});return out.join(' · ');}
// Library rows: where the recipes live. One: muted "Book · where" / "Meal kit · kit · where", or a small outbound link.
// Several: one line joined with " · ", each with its "Label: ", every link its own (new tab). Ellipsis + tooltip.
function srcLink(name,s){return `<a class="src-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" draggable="false" aria-label="Open ${s.label?esc(s.label)+' ':''}recipe for ${esc(name)} in a new tab">Link${I.ext}</a>`;}
function srcLine(name,list,cls){if(!list||!list.length)return '';
  if(list.length===1){const src=list[0];
    if(src.type==='book'||src.type==='kit'){const t=E.sourceText(src);return `<div class="${cls} src-${src.type}" title="${esc(t)}">${esc(t)}</div>`;}
    return `<div class="${cls}">${srcLink(name,src)}</div>`;}
  const parts=list.map(s=>(s.label?esc(s.label)+': ':'')+(s.type==='url'?srcLink(name,s):esc(E.sourcePart(s))));
  return `<div class="${cls} src-multi" title="${esc(E.sourcesText(list))}">${parts.join(' · ')}</div>`;}
function chip(name,isNew,drag,btn,title){return `<span class="ichip ${isNew?'new':''}" draggable="true" ${drag} title="${esc(title||name)}"><span>${esc(name)}</span>${btn}</span>`;}
// Other ideas starts collapsed; this browser remembers it open or closed.
function ideasOpen(){return lsGet('eah-ideas-open')==='1';}
function tray(w,mode){
  if(mode!=='manual'&&!(w.ideas||[]).length)return '';   // no Other ideas row when there are none
  const lc=lastCooked();let h=`<div class="tray">`;
  if(mode==='manual'){
    const q=S.sideQ.trim().toLowerCase();
    const pool=dishList().filter(d=>okThisWeek(d,w)).filter(d=>!q||d.name.toLowerCase().includes(q)).sort((a,b)=>weight(b,lc,w.id)-weight(a,lc,w.id)).slice(0,12);
    h+=`<span class="eyebrow">From your library</span><label class="sr" for="side-q">Search library</label><input class="input tray-q" id="side-q" data-input="sideQ" placeholder="Search" value="${esc(S.sideQ)}" autocomplete="off">`;
    if(!pool.length)h+=`<p class="tray-note">${q?'Nothing matches that search.':'Add dishes in the Library and they’ll show up here.'}</p>`;
    pool.forEach(d=>{const last=lastFor(d,lc);h+=chip(d.name,false,`data-drag-lib="${esc(d.id)}"`,`<button class="ichip-add" id="lp-${esc(d.id)}" data-act="libPlace" data-id="${esc(d.id)}" aria-label="Put ${esc(d.name)} on a day">${I.plus}</button>`,[d.name,d.cuisine,last?'last made '+fmtDate(last):'not made yet'].filter(Boolean).join(' · '));});
  }else{
    const ideas=w.ideas||[];const open=ideasOpen();
    h+=`<button class="ideas-tog" id="ideas-tog" data-act="ideasToggle" aria-expanded="${open}" aria-controls="ideas-list"><span class="eyebrow">Other ideas</span><span class="count">${ideas.length}</span>${I.chev}</button>`;
    if(open){h+=`<span class="ideas-list" id="ideas-list">`;
      ideas.forEach((x0,k)=>{const x=disp(x0);const nm=ideaTitle(x0);const last=x.id&&S.dishes[x.id]?lastFor(S.dishes[x.id],lc):null;
        h+=chip(nm,x.isNew,`data-drag-idea="${k}"`,`<button class="ichip-add" id="ip-${k}" data-act="ideaPlace" data-k="${k}" aria-label="Put ${esc(nm)} on a day">${I.plus}</button>`,[nm,x.isNew?'new':'',x.cuisine,x.isNew?x.effort:(last?'last made '+fmtDate(last):'not made yet')].filter(Boolean).join(' · '));});
      if(S.sample&&!S.busy)h+=`<button class="linkbtn" data-act="moreIdeas" style="font-size:13px;margin-left:4px">More ideas</button>`;
      h+=`</span>`;}
  }
  h+=`</div>`;
  return h;
}

/* ---------- Library view ---------- */
function rateCell(d,p){const v=r(d,p.id);return `<button class="pr ${v||'none'}" id="cr-${esc(d.id)}-${p.id}" data-act="cycleRate" data-id="${esc(d.id)}" data-p="${p.id}" aria-label="${esc(p.name)}: ${v?RATE_LABEL[v]:'not rated'}. Click to change."><small>${esc(p.name)}</small><b>${v?RATE_LABEL[v]:'Rate'}</b></button>`;}
function triedLately(){
  const t=today();const names=new Set(dishList().map(d=>d.name.toLowerCase()));const out=[];const seen=new Set();
  Object.values(S.weeks).sort((a,b)=>b.id.localeCompare(a.id)).forEach(w=>{(w.days||[]).forEach((day,i)=>{if(addDays(w.id,i)>t||day.away)return;const dn=day.dinner;if(dn&&dn.kind==='dish'&&dn.dish&&dn.dish.isNew&&!dn.dish.id){const k=dn.dish.name.toLowerCase();if(!names.has(k)&&!seen.has(k)){seen.add(k);out.push({dish:dn.dish,week:w.id,day:i});}}});});
  return out.slice(0,8);
}
// "3 versions", muted; hover for the names, click to list them (open while a search matches one).
function libVars(d,q){const vs=variationsOf(d);if(!vs.length)return '';const names=vs.map(v=>v.name).join(' · ');
  const open=q&&vs.some(v=>v.name.toLowerCase().includes(q));
  return `<details class="lib-vars" ${open?'open':''}><summary title="${esc(names)}">${vs.length} version${vs.length===1?'':'s'}</summary><span>${esc(names)}</span></details>`;}
function viewLibrary(){
  const q=S.libQ.trim().toLowerCase();const f=S.libFilter;const lc=lastCooked();
  let list=dishList().filter(d=>!q||d.name.toLowerCase().includes(q)||(d.cuisine||'').toLowerCase().includes(q)||E.sourceSearch(d).toLowerCase().includes(q)||labelsOf(d).some(l=>l.toLowerCase().includes(q))||variationsOf(d).some(v=>v.name.toLowerCase().includes(q)));
  if(f==='dinner')list=list.filter(eligibleDinner);else if(f==='lunch')list=list.filter(forLunch);else if(f==='me')list=list.filter(justMe);else if(f==='unrated')list=list.filter(d=>people().some(p=>!r(d,p.id)));
  const labs=allLabels();if(S.libLabel&&!labs.some(l=>l.name===S.libLabel))S.libLabel='';
  if(S.libLabel)list=list.filter(d=>labelsOf(d).some(l=>l.toLowerCase()===S.libLabel.toLowerCase()));
  let h=`<div class="page-head"><div><h1>Library</h1><p>Every dish the family eats, with what each person thinks of it. Favorites come up more often. Anyone marked “Won’t eat” keeps a dish off family dinners, but it can still be ${cookOnlyLunch()?'your lunch':'a lunch'}.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-ghost" data-act="listsOpen">Cuisines, labels &amp; cookbooks</button><button class="btn-primary" data-act="dishNew">${I.plus} Add dish</button></div></div>`;
  const tried=triedLately();
  if(tried.length)h+=`<section class="panel"><div class="tried"><span class="eyebrow">Tried lately</span>${tried.map((o,k)=>`<button class="btn-ghost" data-act="triedAdd" data-k="${k}">${I.plus} ${esc(o.dish.name)}</button>`).join('')}<span class="muted" style="font-size:13px">New dishes you cooked. Add the keepers whenever you like.</span></div></section>`;
  h+=`<div class="toolbar"><label class="sr" for="lib-q">Search library</label><input class="input" id="lib-q" data-input="libQ" placeholder="Search dishes" value="${esc(S.libQ)}"><div class="seg" role="group" aria-label="Filter">${[['all','All'],['dinner','Family dinners'],['lunch','Lunches'],['me',cookOnlyLunch()?'Just me':'Lunch only'],['unrated','Needs ratings']].map(([v,l])=>`<button data-act="libFilter" data-v="${v}" class="${f===v?'on':''}" aria-pressed="${f===v}">${l}</button>`).join('')}</div>${labs.length?`<label class="sr" for="lib-label">Filter by label</label><select class="input" id="lib-label" data-change="libLabel" style="width:auto;min-width:150px"><option value="">All labels</option>${labs.map(l=>`<option ${S.libLabel===l.name?'selected':''}>${esc(l.name)}</option>`).join('')}</select>`:''}</div>`;
  h+=`<section class="panel lib-list">`;
  if(!Object.keys(S.dishes).length)h+=`<div class="empty-state"><h3>Your library is empty</h3><p>Add the dishes you make, then rate them for each person. It takes a few seconds each and you never have to do it all at once.</p><button class="btn-primary" data-act="dishNew">${I.plus} Add your first dish</button></div>`;
  else if(!list.length)h+=`<div class="empty-state"><p>No dishes match.</p></div>`;
  list.forEach(d=>{
    const last=lastFor(d,lc);const lo=d.leftovers==='asis'?'Reheats as-is':d.leftovers==='transform'?'Becomes '+((d.becomes||[]).join(', ')||'a different lunch'):'No planned leftovers';
    const uses=[forDinner(d)?'Dinner':'',forLunch(d)?'Lunch':''].filter(Boolean).join(' + ');
    h+=`<div class="lib-row"><div class="lib-name"><span class="dish-name">${esc(d.name)}</span>${libVars(d,q)}${srcLine(d.name,E.sourcesOf(d),'lib-src')}<div class="lib-meta">${d.cuisine?`<span class="tag">${esc(d.cuisine)}</span>`:''}${d.effort?`<span class="tag">${esc(d.effort)}</span>`:''}${uses?`<span class="tag">${uses}</span>`:''}${justMe(d)?`<span class="tag me">${cookOnlyLunch()?'Just me':'Lunch only'}</span>`:''}${labelsOf(d).map(l=>`<span class="tag lbl-t">${esc(l)}</span>`).join('')}</div>${d.notes?`<span class="lib-lo">${esc(d.notes)}</span>`:''}</div>
    <div class="lib-lo">${esc(lo)}<br>${last?'Last made '+esc(fmtDate(last)):'Not made yet'}</div>
    <div class="people-rates">${people().map(p=>rateCell(d,p)).join('')}</div>
    <div class="lib-acts"><button class="btn-ghost" data-act="dishEdit" data-id="${esc(d.id)}">Edit</button><button class="linkbtn muted-link" id="mg-${esc(d.id)}" data-act="mergeOpen" data-id="${esc(d.id)}" aria-label="Merge ${esc(d.name)} into another dish">Merge into…</button></div></div>`;
  });
  h+=`</section><p class="muted" style="margin:0;font-size:12px">Tip: click a person’s rating to cycle Favorite → Fine → Meh → Won’t eat → not rated.</p>`;
  return h;
}

/* ---------- Family view ---------- */
function dayOptions(cur){return `<option value="" ${cur==null?'selected':''}>None</option>`+DOWL.map((d,i)=>`<option value="${i}" ${cur===i?'selected':''}>${d}</option>`).join('');}
function peopleCard(){
  const ps=people();const ds=dishList();
  const rows=ps.map((p,k)=>{
    if(S.famConfirm===p.id){const n=ds.filter(d=>r(d,p.id)).length;
      return `<div class="rule"><span>Remove ${esc(p.name)}? ${n?`Their ratings on ${n} dish${n===1?'':'es'} go too.`:'They haven’t rated anything yet.'}</span><button class="btn-danger" id="pdel-yes" data-act="personDel" data-pid="${esc(p.id)}">Remove</button><button class="btn-ghost" data-act="personCancel">Keep</button></div>`;}
    return `<div class="person"><div class="field"><label for="pn-${k}">Name</label><input class="input" id="pn-${k}" data-pinput="name" data-pid="${esc(p.id)}" value="${esc(p.name)}" autocomplete="off"></div>
    <div class="field"><label for="pnote-${k}">Note for Claude</label><input class="input" id="pnote-${k}" data-pinput="note" data-pid="${esc(p.id)}" value="${esc(p.note||'')}" placeholder="e.g. vegetarian, or 6 and likes plain food" autocomplete="off"></div>
    <div class="checks"><label><input type="radio" name="p-cook" id="pc-${k}" data-pchange="cook" data-pid="${esc(p.id)}" ${p.isCook?'checked':''}> Cook</label><label><input type="checkbox" id="pl-${k}" data-pchange="lunch" data-pid="${esc(p.id)}" ${p.lunch?'checked':''}> Planned lunch</label><label><input type="checkbox" id="pb-${k}" data-pchange="breakfast" data-pid="${esc(p.id)}" ${p.breakfast?'checked':''}> Breakfast line</label></div>
    ${ps.length>1?`<button class="ibtn" id="px-${k}" data-act="personAsk" data-pid="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">${I.x}</button>`:'<span></span>'}</div>`;}).join('');
  return `<section class="panel card"><h2>People</h2><p>Everyone who eats dinner. Notes go to Claude, so write them the way you’d describe someone to a friend who’s cooking. The planned lunch is one line a day for the people who get it.</p><div class="people">${rows}</div>
  <form class="addrow" data-form="person"><label class="sr" for="person-in">New person’s name</label><input class="input" id="person-in" placeholder="Add a person" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form></section>`;
}
function cookingCard(){
  const ck=S.settings.cooking||{};const ws=weekShape();
  return `<section class="panel card"><h2>Cooking</h2>
  <div class="frow"><div class="field"><label for="ck-time">Typical weeknight cook time</label><input class="input" id="ck-time" data-sinput="cookTime" value="${esc(ck.cookTime||'')}" placeholder="e.g. 45 minutes" autocomplete="off"></div>
  <div class="field"><label for="ck-dinner">Dinner time</label><div class="addrow"><input class="input" id="ck-dinner" type="time" step="300" data-sinput="dinnerTime" value="${esc(ck.dinnerTime||'')}">${ck.dinnerTime?`<button type="button" class="btn-ghost" id="ck-dinner-clear" data-act="dinnerTimeClear" aria-label="Clear dinner time">Clear</button>`:''}</div></div>
  <div class="field"><label for="wk-lo">Leftovers nights per week</label><select class="input" id="wk-lo" data-change="loCount">${countOptions(ws.leftovers.count)}</select></div>
  <div class="field"><label for="wk-lod">Usually on</label><select class="input" id="wk-lod" data-change="loDay">${weekdayOptions(ws.leftovers.day)}</select></div>
  <div class="field"><label for="wk-co">Clear-out lunch</label><select class="input" id="wk-co" data-change="clearoutLunch">${dayOptions(ws.clearoutLunch)}</select></div></div>
  <div class="field"><label for="ck-notes">Cooking notes for Claude</label><input class="input" id="ck-notes" data-sinput="cookNotes" value="${esc(ck.notes||'')}" placeholder="e.g. Mostly one-pan dinners. The slow cooker on busy days." autocomplete="off"></div>
  <p>Leftovers nights and the clear-out lunch apply to weeks you haven’t started yet. “Usually on” is the day for the first one. Change a week’s count in Plan options on the Plan page. Dinner time is optional and only used on the fridge sheet, to show when to start cooking.</p></section>`;
}
function viewFamily(){
  const ds=dishList();
  let h=`<div class="page-head"><div><h1>Family</h1><p>Standing rules go to the planner every week. Ratings live on each dish in the Library; here’s the summary.</p></div></div>`;
  h+=peopleCard()+cookingCard();
  h+=`<section class="panel card"><h2>Standing rules</h2><p>Short, plain sentences work best, like “No shellfish.”</p><div class="rules">${S.settings.rules.map((x,k)=>`<div class="rule"><span>${esc(x)}</span><button class="ibtn" data-act="ruleDel" data-k="${k}" aria-label="Remove rule: ${esc(x)}">${I.x}</button></div>`).join('')||'<p>No rules yet.</p>'}</div>
  <form class="addrow" data-form="rule"><label class="sr" for="rule-in">New rule</label><input class="input" id="rule-in" placeholder="Add a rule" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form></section>`;
  h+=`<div class="cols">`;
  people().forEach(p=>{
    const favs=ds.filter(d=>r(d,p.id)==='fav'),nos=ds.filter(d=>r(d,p.id)==='no'),mehs=ds.filter(d=>r(d,p.id)==='meh');
    h+=`<section class="panel card"><h2>${esc(p.isCook?p.name+' (the cook)':p.name)}</h2>
    <h3>Favorites</h3>${favs.length?`<ul>${favs.map(d=>`<li>${esc(d.name)}</li>`).join('')}</ul>`:'<p>None yet.</p>'}
    <h3>Meh</h3>${mehs.length?`<ul>${mehs.map(d=>`<li>${esc(d.name)}</li>`).join('')}</ul>`:'<p>None yet.</p>'}
    <h3>Won’t eat</h3>${nos.length?`<ul>${nos.map(d=>`<li>${esc(d.name)}${d.notes?` <span class="muted">(${esc(d.notes)})</span>`:''}</li>`).join('')}</ul>`:'<p>Nothing so far.</p>'}</section>`;
  });
  h+=`</div>`;
  return h;
}

/* ---------- History view ---------- */
function mealStatus(w,i,m){
  const day=w.days[i];const o=(day.eaten||{})[m];
  let derived='home';if(day.away)derived='out';else if(m==='l'&&day.lunch&&day.lunch.kind==='out')derived='out';else if(m==='d'&&day.dinner&&day.dinner.kind==='out')derived='out';
  return {v:o||derived,set:!!o};
}
function stats(days){
  const t=today();const from=addDays(t,-(days-1));const c={b:[0,0],l:[0,0],d:[0,0]};let tried=0;
  Object.values(S.weeks).forEach(w=>{(w.days||[]).forEach((day,i)=>{const dt=addDays(w.id,i);if(dt<from||dt>t)return;['b','l','d'].forEach(m=>{const s=mealStatus(w,i,m);c[m][1]++;if(s.v==='home')c[m][0]++;});if(!day.away&&day.dinner&&day.dinner.kind==='dish'&&day.dinner.dish&&day.dinner.dish.isNew)tried++;});});
  const home=c.b[0]+c.l[0]+c.d[0],tot=c.b[1]+c.l[1]+c.d[1];return {c,home,tot,tried};
}
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
function viewHistory(){
  const t=today();const s=stats(30);
  let h=`<div class="page-head"><div><h1>History</h1><p>Every meal counts as eaten at home unless you mark it otherwise. Fix the exceptions whenever you get around to it: click a meal to switch it between home and out.</p></div></div>`;
  h+=`<div class="tiles"><div class="panel tile"><b>${pct(s.home,s.tot)}</b><span>Meals at home, last 30 days${s.tot?` (${s.home} of ${s.tot})`:''}</span></div><div class="panel tile"><b>${pct(s.c.b[0],s.c.b[1])}</b><span>Breakfasts at home</span></div><div class="panel tile"><b>${pct(s.c.l[0],s.c.l[1])}</b><span>Lunches at home</span></div><div class="panel tile"><b>${pct(s.c.d[0],s.c.d[1])}</b><span>Dinners at home</span></div><div class="panel tile"><b>${s.tried}</b><span>New dishes tried, last 30 days</span></div></div>`;
  const weeks=Object.values(S.weeks).filter(w=>w.id<=t).sort((a,b)=>b.id.localeCompare(a.id));
  if(!weeks.length)h+=`<section class="panel empty-state"><h3>Nothing to show yet</h3><p>Once a planned week starts, its meals appear here.</p></section>`;
  weeks.forEach(w=>{
    h+=`<section class="panel hweek"><h2>Week of ${esc(fmtRange(w.id))}</h2><div class="scroll"><div class="hgrid"><div></div>${DOW.map((d,i)=>`<div class="hd">${dayLabel(w.id,i)}</div>`).join('')}`;
    [['b','Breakfast'],['l','Lunch'],['d','Dinner']].forEach(([m,lab])=>{
      h+=`<div class="rl">${lab}</div>`;
      for(let i=0;i<7;i++){const dt=addDays(w.id,i);
        if(dt>t){h+=`<div class="hcell na" aria-hidden="true">·</div>`;continue;}
        const st=mealStatus(w,i,m);const dn=w.days[i].dinner;const what=m==='d'&&!w.days[i].away&&dn&&dn.kind==='dish'&&dn.dish?dinnerTitle(dn):'';
        h+=`<button class="hcell ${st.v} ${st.set?'set':''}" data-act="histToggle" data-w="${w.id}" data-i="${i}" data-m="${m}" ${what?`title="${esc(what)}"`:''} aria-label="${DOWL[i]} ${lab}${what?' ('+esc(what)+')':''}: ${st.v==='home'?'at home':'ate out'}${st.set?' (marked)':''}. Click to switch.">${st.v==='home'?I.home+'Home':I.out+'Out'}</button>`;}
    });
    h+=`</div></div></section>`;
  });
  return h;
}

/* ---------- Settings view ---------- */
function keyStatus(m){
  const a=S.ai;const guide=`<a href="${E.KEY_GUIDE}" target="_blank" rel="noopener">Anthropic’s guide</a>`;
  if(a.status==='found')return `<p>Claude key: found in app/config.js. Using ${esc(a.model)}.</p>${a.warn?`<p class="err">${esc(a.warn)}</p>`:''}`;
  return `<p class="err">${m!=='manual'?'Claude is off, so planning falls back to picking by rating. ':''}${esc(a.reason)} See ${guide}.</p><p>Claude key: ${a.status==='rejected'?'rejected':a.status==='broken'?'app/config.js can’t be read':'missing'}. Model: ${esc(a.model)}.</p>`;
}
function dataCard(){
  const fm=E.fileMeta();const n=Object.keys(S.dishes).length,wk=Object.keys(S.weeks).length;
  const st=!fm.downloadedAt?'Not downloaded yet.':'Last downloaded '+fmtDate(fm.downloadedAt)+(fm.dirty?', with changes since.':'.');
  return `<section class="panel card"><h2>Your data</h2><p>${n} dish${n===1?'':'es'} and ${wk} week${wk===1?'':'s'}. ${esc(st)}</p>
  <p>Your data lives in this browser and saves as you go. Download a copy now and then: it’s your backup, and it’s how you move your data to another browser or computer. Ctrl/Cmd+S downloads too.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-ghost" data-act="fileOpen">Open data file…</button><button class="btn-ghost" data-act="fileDownload">Download data file</button></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-ghost" data-act="wzRerun">Run setup again</button><button class="btn-ghost" data-act="startOverAsk" style="color:var(--danger)">Start over</button></div></section>`;
}
function viewSettings(){
  const m=S.settings.genMode;
  const modes=[['ai','Claude plans it','Sends your library, ratings, last-cooked dates, family rules and weekly notes to Claude through your API key, which drafts the dinners and alternates.'],['weighted','Pick by rating','The app picks dinners from your library at random, with favorites more likely and recent dishes held back. Claude only fills new-recipe nights.'],['manual','Manual','No generating. You add dinners yourself from the library.']];
  let h=`<div class="page-head"><div><h1>Settings</h1></div></div>`;
  h+=`<section class="panel card"><h2>How weeks get planned</h2><div style="display:flex;flex-direction:column;gap:8px">${modes.map(([v,t,dsc])=>`<label class="mode ${m===v?'on':''}"><input type="radio" name="gm" data-change="genMode" value="${v}" ${m===v?'checked':''}><div><b>${t}</b><span>${dsc}</span></div></label>`).join('')}</div>
  ${keyStatus(m)}</section>`;
  h+=`<section class="panel card"><h2>Theme</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${THEMES.map(t=>`<button class="btn-ghost" data-act="theme" data-id="${t.id}" aria-pressed="${S.settings.theme===t.id}" style="${S.settings.theme===t.id?'border-color:var(--accent);background:var(--soft)':''}"><span class="chip"><span style="flex:1;background:${t.c1}"></span><span style="flex:1;background:${t.c2}"></span></span>${esc(t.name)}</button>`).join('')}</div></section>`;
  h+=dataCard();
  return h;
}

Object.assign(E,{dayOptions,countOptions,weekdayOptions,render,refocus,daysText,rulesCount,viewPlan,dinnerCard,recipeShort,leftoversStepper,ideasOpen,chip,tray,rateCell,triedLately,viewLibrary,viewFamily,mealStatus,stats,pct,viewHistory,viewSettings});
})();
