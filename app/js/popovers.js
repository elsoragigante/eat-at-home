(function(){
'use strict';
const E=window.EAH;
const {RATE,DOW,DOWL,THEMES,I,esc,parse,addDays,fmtDate,S,popLayer,dishList,r,forLunch,eligibleDinner,allLabels,skipSet,skippedBy,lunchable,justMe,SC,snap,disp,lastCooked,lastFor,weight,getWeek,prevDinner,setLunch,setDinner,placeIdea,clearPrep,render,people,cook,cookOnlyLunch,lunchScore,exampleName}=E;
/* ---------- popovers ---------- */
function openPop(anchor,type,data){
  S.pop={type,data:data||{},anchorId:anchor&&anchor.id||null,rect:anchor.getBoundingClientRect()};S.popQ='';renderPop(true);
}
function closePop(){if(!S.pop)return;const id=S.pop.anchorId;const wasOpts=S.pop.type==='options';S.pop=null;popLayer.innerHTML='';if(wasOpts)render();if(id){const el=document.getElementById(id)||(wasOpts&&document.getElementById('po-btn'));if(el)el.focus({preventScroll:true});}}
function dropPop(){if(!S.pop)return false;const wasOpts=S.pop.type==='options';S.pop=null;popLayer.innerHTML='';return wasOpts;}
function popTitle(){const p=S.pop;return {lunch:'Choose lunch',dinner:'Choose dinner',menu:'Options',prep:'Lunch prep',theme:'Theme',place:'Choose a day',rate:'Rate dish',options:'Plan options',newver:'New version'}[p.type]||'Options';}
function renderPop(first){
  const p=S.pop;if(!p)return;let body='';
  if(p.type==='lunch'||p.type==='dinner'||(p.type==='prep'&&!p.data.pick)){
    body=`<label class="sr" for="pop-q">Search</label><input class="pop-q" id="pop-q" data-popq placeholder="${p.type==='dinner'?'Search or type a new dish':'Search or type a lunch'}" autocomplete="off" value="${esc(S.popQ)}"><div id="pop-list">${popList()}</div>`;
  }else if(p.type==='newver'){const d=S.dishes[p.data.id];
    body=`<form class="po-sec" data-form="newVer"><label class="po-lab" for="nv-name">New version of ${esc(d?d.name:'this dish')}</label><input class="pop-q" id="nv-name" maxlength="${E.VARIATION_MAX}" placeholder="e.g. Chicken curry with cauliflower + peas" value="${esc(p.data.value||'')}" autocomplete="off">${p.data.err?`<span class="po-help" role="alert" style="color:#A3352A">${esc(p.data.err)}</span>`:''}<div class="popfoot"><button type="button" class="btn-ghost" data-act="popClose">Cancel</button><button type="submit" class="btn-primary" style="font-size:14px;padding:8px 14px;min-height:38px">Add</button></div></form>`;
  }else body=`<div id="pop-list">${popList()}</div>`;
  popLayer.innerHTML=`<div class="pop ${p.type==='options'?'wide':''}" role="dialog" aria-label="${popTitle()}">${body}</div>`;
  const el=popLayer.firstChild;const rc=p.rect;const vw=document.documentElement.clientWidth;
  let left=rc.left+window.scrollX;const wpx=Math.min(el.offsetWidth||300,vw-24);if(left+wpx>window.scrollX+vw-12)left=window.scrollX+vw-12-wpx;if(left<window.scrollX+12)left=window.scrollX+12;
  el.style.left=left+'px';el.style.top=(rc.bottom+window.scrollY+6)+'px';
  if(first){const q=el.querySelector('#pop-q,#po-notes,#nv-name');(q||el.querySelector('button'))&&(q||el.querySelector('button')).focus({preventScroll:true});}
}
function group(title,items){return {title,items};}
function listHtml(groups){
  S.popItems=[];let h='';
  groups.forEach(g=>{if(!g.items.length)return;if(g.title)h+=`<div class="pg">${esc(g.title)}</div>`;
    g.items.forEach(it=>{const k=S.popItems.push(it)-1;h+=`<button class="pi ${it.cls||''}" data-pi="${k}">${it.html||esc(it.label)}${it.sub?`<small>${esc(it.sub)}</small>`:''}</button>`;});});
  return h||'<div class="empty">Nothing matches.</div>';
}
function popList(){
  const p=S.pop;const w=getWeek(S.weekId);const q=S.popQ.trim();const ql=q.toLowerCase();const mt=s=>!ql||String(s).toLowerCase().includes(ql);
  if(p.type==='lunch')return listHtml(lunchGroups(w,p.data.i,q,ql,mt));
  if(p.type==='dinner')return listHtml(dinnerGroups(w,p.data.i,q,ql,mt));
  if(p.type==='menu')return listHtml(p.data.groups||[group('',p.data.items)]);
  if(p.type==='options'){S.popItems=[];const mode=S.settings.genMode;
    return `<div class="po-sec"><label class="po-lab" for="po-notes">Notes for this week</label><textarea id="po-notes" data-input="notes" rows="3" placeholder="${esc(exampleName()?'e.g. '+exampleName()+' wants something soupy, skip pork, Thursday is busy':'e.g. something soupy, skip pork, Thursday is busy')}">${esc(w.notes)}</textarea></div>
    <div class="po-sec po-row">${E.leftoversStepper(w)}</div>
    ${mode==='manual'?'':`<div class="po-sec"><span class="po-lab">New recipes</span><div class="seg" role="group" aria-label="New recipes">${[['library','Library only'],['mix','1–2 new'],['all','All new']].map(([v,l])=>`<button id="nm-${v}" data-act="newModePop" data-v="${v}" class="${w.newMode===v?'on':''}" aria-pressed="${w.newMode===v}">${l}</button>`).join('')}</div><span class="po-help">Flag a specific night from its day menu.</span></div>`}
    <div class="po-sec"><span class="po-lab">Skip this week</span>${(()=>{const labs=allLabels();const sk=skipSet(w);return labs.length?`<div class="skipchips" role="group" aria-label="Skip labels this week">${labs.map((l,k)=>`<button id="sk-${k}" class="skipchip ${sk.has(l.name.toLowerCase())?'on':''}" data-act="skipToggle" data-l="${esc(l.name)}" aria-pressed="${sk.has(l.name.toLowerCase())}">${esc(l.name)}</button>`).join('')}</div><span class="po-help">Dishes with a crossed-out label stay out of this week.</span>`:`<span class="po-help">Add labels like “grill” to dishes in the Library, then skip them here on weeks you need to.</span>`;})()}</div>
    <div class="po-sec">${(()=>{const n=E.rulesCount();return `<button class="linkbtn po-rules" data-act="nav" data-view="family">${n} family rule${n===1?'':'s'} applied</button>`;})()}</div>
    <div class="po-foot"><span>Planner: ${{ai:'Claude',weighted:'By rating',manual:'Manual'}[mode]}</span><button data-act="nav" data-view="settings">Change</button></div>`;}
  if(p.type==='theme')return listHtml([group('Theme',THEMES.map(t=>({html:`<span class="pi-in" style="display:flex;align-items:center;gap:10px;width:100%"><span class="chip"><span style="flex:1;background:${t.c1}"></span><span style="flex:1;background:${t.c2}"></span></span><span style="flex:1">${esc(t.name)}</span>${S.settings.theme===t.id?I.check:''}</span>`,cls:S.settings.theme===t.id?'cur':'',fn:()=>{E.setTheme(t.id);closePop();}})))]);
  if(p.type==='place'){const item=p.data.item;return listHtml([group('Put '+item.name+' on…',w.days.map((d,i)=>{const cur=d.away?'away':d.dinner.kind==='dish'&&d.dinner.dish?E.dinnerTitle(d.dinner):d.dinner.kind==='leftovers'?'leftovers night':d.dinner.kind==='out'?'eating out':'open';return {label:DOWL[i]+' '+parse(addDays(w.id,i)).getDate(),sub:'now: '+cur,fn:()=>{closePop();p.data.place(i);}};}))]);}
  if(p.type==='rate'){const d=S.dishes[p.data.id];if(!d)return '<div class="empty">This dish isn’t in the library.</div>';
    S.popItems=[];return `<div class="pg">${esc(d.name)}</div>${people().map(pp=>`<div class="rrow"><span>${esc(pp.name)}</span><span class="rate" role="group" aria-label="${esc(pp.name)}">${RATE.map(([v,l])=>`<button id="pr-${pp.id}-${v}" class="${v} ${r(d,pp.id)===v?'on':''}" data-act="setRate" data-id="${esc(d.id)}" data-p="${pp.id}" data-v="${v}" aria-pressed="${r(d,pp.id)===v}">${l}</button>`).join('')}</span></div>`).join('')}<div class="popfoot"><button class="btn-ghost" data-act="popClose">Done</button></div>`;}
  if(p.type==='prep'){
    if(!p.data.pick){const items=dishList().filter(lunchable).filter(d=>mt(d.name)).sort((a,b)=>(justMe(b)-justMe(a))||(lunchScore(b)-lunchScore(a))).slice(0,ql?20:10).map(d=>({label:d.name,sub:justMe(d)?(cookOnlyLunch()?'just me':'lunch only'):(d.cuisine||''),fn:()=>{p.data.pick={name:d.name,dishId:d.id};p.data.days=(w.lunchPrep&&w.lunchPrep.days)||[1,2,3,4,5];renderPop(true);}}));
      const g=[group(ql?'Library':'Good for lunch prep',items)];
      if(q&&!dishList().some(d=>d.name.toLowerCase()===ql))g.push(group('',[{label:'Use “'+q+'”',fn:()=>{p.data.pick={name:q};p.data.days=[1,2,3,4,5];renderPop(true);}}]));
      if(w.lunchPrep)g.push(group('',[{label:'Remove lunch prep',cls:'danger',fn:()=>{clearPrep();closePop();}}]));
      return listHtml(g);}
    S.popItems=[];
    return `<div class="pg">${esc(p.data.pick.name)} for lunch on…</div><div class="daygrid" role="group" aria-label="Days">${DOW.map((d,i)=>`<button id="pd-${i}" data-act="prepDay" data-i="${i}" class="${p.data.days.includes(i)?'on':''}" aria-pressed="${p.data.days.includes(i)}">${d}</button>`).join('')}</div><div class="popfoot"><button class="btn-ghost" data-act="prepBack">Back</button><button class="btn-primary" data-act="prepApply" style="font-size:14px;padding:8px 14px;min-height:38px">Apply</button></div>`;
  }
  return '';
}
function lunchGroups(w,i,q,ql,mt){
  const g=[];const p=prevDinner(w,i);
  if(p&&!p.away&&p.dn&&p.dn.kind==='dish'&&p.dn.dish){const d=disp(p.dn.dish);const it=[];
    const t=E.dinnerTitle(p.dn);
    if(d.leftovers==='asis')it.push({label:t,sub:p.day+' dinner, as-is',fn:()=>setLunch(i,{kind:'pick',label:t,src:p.day+' dinner, as-is'})});
    (d.becomes||[]).forEach(b=>it.push({label:b,sub:'from '+p.day+' dinner',fn:()=>setLunch(i,{kind:'pick',label:b,src:'from '+p.day+' dinner'})}));
    if(d.leftovers!=='asis'&&!(d.becomes||[]).length)it.push({label:'Leftover '+t,sub:'from '+p.day+' dinner',fn:()=>setLunch(i,{kind:'pick',label:'Leftover '+t,src:'from '+p.day+' dinner'})});
    g.push(group('From last night',it.filter(x=>mt(x.label))));}
  if(w.lunchPrep&&mt(w.lunchPrep.name))g.push(group('Lunch prep',[{label:w.lunchPrep.name,sub:'Sunday lunch prep',fn:()=>setLunch(i,{kind:'prep',label:w.lunchPrep.name,src:'Sunday lunch prep'})}]));
  const byMe=(a,b)=>(lunchScore(b)-lunchScore(a))||a.name.localeCompare(b.name);
  const quick=dishList().filter(d=>forLunch(d)&&lunchable(d)&&mt(d.name)).sort(byMe);
  g.push(group(ql?'Lunches':'Quick favorites',quick.slice(0,ql?20:6).map(d=>({label:d.name,sub:lunchScore(d)===3?'a favorite':(d.effort||'quick lunch'),fn:()=>setLunch(i,{kind:'pick',label:d.name,dishId:d.id,src:'quick lunch'})}))));
  const mine=dishList().filter(d=>!forLunch(d)&&justMe(d)&&mt(d.name));
  if(mine.length){const co=cookOnlyLunch();g.push(group(co?'Just for me':'Lunch only',mine.slice(0,ql?10:3).map(d=>({label:d.name,sub:co?'only you eat this':'not a family dinner',fn:()=>setLunch(i,{kind:'pick',label:d.name,dishId:d.id,src:co?'just for me':'lunch only'})}))));}
  if(ql){const other=dishList().filter(d=>!forLunch(d)&&!justMe(d)&&lunchable(d)&&mt(d.name)).slice(0,10);g.push(group('From the library',other.map(d=>({label:d.name,fn:()=>setLunch(i,{kind:'pick',label:d.name,dishId:d.id,src:'quick lunch'})}))));
    if(!dishList().some(d=>d.name.toLowerCase()===ql))g.push(group('',[{label:'Use “'+q+'”',fn:()=>setLunch(i,{kind:'pick',label:q,src:'quick lunch'})}]));}
  const oth=[{label:'Eat up the leftovers',sub:'clear out the fridge',fn:()=>setLunch(i,{kind:'clearout'})},{label:'Eating out',fn:()=>setLunch(i,{kind:'out'})}];
  if((w.days[i].lunch||{}).kind!=='auto')oth.push({label:'Back to automatic',sub:'follow last night’s dinner',fn:()=>setLunch(i,{kind:'auto'})});
  g.push(group('Other',oth.filter(x=>mt(x.label))));
  return g;
}
function dinnerGroups(w,i,q,ql,mt){
  const g=[];const lc=lastCooked();
  const ideas=(w.ideas||[]).map((x,k)=>({x:disp(x),t:E.ideaTitle(x),k})).filter(o=>mt(o.t));
  if(ideas.length)g.push(group('Ideas this week',ideas.map(o=>({label:o.t,sub:(o.x.isNew?'new · ':'')+(o.x.cuisine||''),fn:()=>{closePop();placeIdea(o.k,i);}}))));
  const lib=dishList().filter(eligibleDinner).filter(d=>mt(d.name)).filter(d=>ql||!skippedBy(d,w).length).sort((a,b)=>weight(b,lc,w.id)-weight(a,lc,w.id));
  g.push(group('Library',lib.slice(0,ql?25:8).map(d=>{const last=lastFor(d,lc);const sk=skippedBy(d,w);return {label:d.name,sub:[sk.length?'labeled '+sk.join(', ')+', skipped this week':'',d.cuisine,last?'last made '+fmtDate(last):'not made yet'].filter(Boolean).join(' · '),fn:()=>{closePop();setDinner(i,{kind:'dish',dish:snap(d)});}};})));
  if(q&&!dishList().some(d=>d.name.toLowerCase()===ql))g.push(group('',[{label:'Add “'+q+'” as a new dish',fn:()=>{closePop();setDinner(i,{kind:'dish',dish:{name:q,cuisine:'',effort:'',leftovers:'none',becomes:[],isNew:true}});}}]));
  const cur=w.days[i].dinner.kind;const oth=[];
  if(cur!=='leftovers')oth.push({label:'Leftovers night',fn:()=>{closePop();setDinner(i,{kind:'leftovers'});}});
  if(cur!=='out')oth.push({label:'Eating out',fn:()=>{closePop();setDinner(i,{kind:'out'});}});
  if(cur!=='empty')oth.push({label:'Clear this dinner',fn:()=>{closePop();setDinner(i,{kind:'empty'});}});
  g.push(group('Other',oth.filter(x=>mt(x.label))));
  return g;
}

Object.assign(E,{openPop,closePop,dropPop,popTitle,renderPop,group,listHtml,popList,lunchGroups,dinnerGroups});
})();
