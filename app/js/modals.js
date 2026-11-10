(function(){
'use strict';
const E=window.EAH;
const {RATE,EFFORTS,DOWL,I,esc,uid,clone,addDays,fmtDate,fmtRange,S,modalLayer,toast,dishList,r,cuisineList,cookbookList,sourcesOf,kitList,labelsOf,allLabels,canonLabel,snap,disp,bk,getWeek,mutateWeek,saveSettings,saveDish,resolveLunch,render,daysText,changed,people,cook,cookOnlyLunch,breakfastPeople,weekShape,exampleName,variationsOf,cleanVarName,dinnerVariation,dinnerTitle,MAX_VARIATIONS,VARIATION_MAX,RATE_LABEL}=E;
/* ---------- modal: dish form ---------- */
// Recipe: where each recipe lives (a cookbook and page/section, a meal kit, or a web link). Pointers, never recipes.
// The draft keeps one row per recipe; each row remembers what was typed under every kind until save.
const SRC_KINDS=[['book','Cookbook'],['kit','Meal kit'],['url','Link']];
function srcRow(s,first){const t=s&&s.type;return {type:t||'none',book:t==='book'?s.book:(first?(cookbookList()[0]||''):''),where:t==='book'?s.where:'',kit:t==='kit'?s.kit:'',kitWhere:t==='kit'?s.where:'',url:t==='url'?s.url:'',label:(s&&s.label)||'',addBook:false};}
const sfx=k=>k?'-'+k:'';
function recipeRow(m,k){
  const rows=m.draft.srcRows;const row=rows[k];const t=row.type;const x=sfx(k);const books=cookbookList();const multi=rows.length>1;
  const err=m.srcErr&&m.srcErrK===k?m.srcErr:'';const errId='df-src-err'+x;
  const kinds=k?SRC_KINDS:[['none','None']].concat(SRC_KINDS);
  let h=`<div class="src-row" data-row="${k}"><div class="src-top"><div class="seg src-seg" role="group" aria-label="${multi?'Recipe '+(k+1):'Recipe'}">${kinds.map(([v,l])=>`<button type="button" id="dfs-${v}${x}" data-act="dfSrcType" data-k="${k}" data-v="${v}" class="${t===v?'on':''}" aria-pressed="${t===v}">${l}</button>`).join('')}</div>${k?`<button type="button" class="ibtn" id="dfs-del${x}" data-act="dfSrcDel" data-k="${k}" aria-label="Remove recipe ${k+1}${row.label?' ('+esc(row.label)+')':''}">${I.x}</button>`:''}</div>`;
  if(multi)h+=`<div class="field src-lab"><label for="df-slabel${x}">Label</label><input class="input" id="df-slabel${x}" data-rinput="label" data-k="${k}" value="${esc(row.label)}" placeholder="e.g. Rice" maxlength="${E.SOURCE_LABEL_MAX}" autocomplete="off"></div>`;
  if(t==='book'){
    const addNow=row.addBook||!books.length;
    h+=`<div class="frow"><div class="field"><label for="df-book${x}">Cookbook</label>${books.length?`<select class="input" id="df-book${x}" data-rinput="book" data-k="${k}">${!row.book?'<option value="" selected>Choose a cookbook…</option>':''}${books.map(c=>`<option ${row.book===c?'selected':''}>${esc(c)}</option>`).join('')}<option value="__add" ${row.addBook?'selected':''}>Add a cookbook…</option></select>`:''}${addNow?`<div class="addrow"><label class="sr" for="df-newbook${x}">New cookbook</label><input class="input" id="df-newbook${x}" data-k="${k}" placeholder="e.g. Salt Fat Acid Heat" autocomplete="off"><button type="button" class="btn-ghost" data-act="dfAddBook" data-k="${k}">Add</button></div>`:''}</div>
      <div class="field"><label for="df-where${x}">Page or section</label><input class="input" id="df-where${x}" data-rinput="where" data-k="${k}" value="${esc(row.where)}" placeholder="e.g. 112 or Entrees section" autocomplete="off"></div></div>`;
  }else if(t==='kit'){
    h+=`<div class="frow"><div class="field"><label for="df-kit${x}">Kit</label><input class="input" id="df-kit${x}" data-rinput="kit" data-k="${k}" list="df-kit-opts" value="${esc(row.kit)}" placeholder="e.g. HelloFresh" autocomplete="off"></div>
      <div class="field"><label for="df-kitwhere${x}">Notes</label><input class="input" id="df-kitwhere${x}" data-rinput="kitWhere" data-k="${k}" value="${esc(row.kitWhere)}" placeholder="e.g. recipe card in the drawer, no longer sold" autocomplete="off"></div></div>`;
  }else if(t==='url'){
    h+=`<div class="field"><label for="df-url${x}">Link</label><input class="input" id="df-url${x}" type="url" inputmode="url" data-rinput="url" data-k="${k}" value="${esc(row.url)}" placeholder="e.g. https://example.com/beef-stew" autocomplete="off" autocapitalize="off" spellcheck="false" ${err?`aria-invalid="true" aria-describedby="${errId}"`:''}></div>`;
  }
  if(err)h+=`<p class="err" id="${errId}" role="alert">${esc(err)}</p>`;
  return h+`</div>`;
}
function recipeField(m){
  const rows=m.draft.srcRows;
  let h=`<div class="field src-field"><span class="lab">Recipe</span>${rows.map((r,k)=>recipeRow(m,k)).join('')}`;
  if(rows[0].type!=='none'&&rows.length<E.MAX_SOURCES)h+=`<button type="button" class="linkbtn src-add" id="df-src-add" data-act="dfSrcAdd">${I.plus} Add another recipe</button>`;
  h+=`<datalist id="df-kit-opts">${kitList().map(k=>`<option value="${esc(k)}"></option>`).join('')}</datalist>`;
  return h+`<span class="hint">Where the recipe lives. Only the pointer is kept, never the recipe.</span></div>`;
}
// Variations: one text box per version with a remove ×. Empty ones aren't saved.
function variationsField(d){const rows=d.varRows||[];
  return `<div class="field"><span class="lab">Variations</span>${rows.map((v,k)=>`<div class="var-row"><label class="sr" for="df-var-${k}">Variation ${k+1}</label><input class="input" id="df-var-${k}" data-vinput data-k="${k}" value="${esc(v.name)}" maxlength="${VARIATION_MAX}" placeholder="e.g. Chicken curry with cauliflower + peas" autocomplete="off"><button type="button" class="ibtn" id="df-vdel-${k}" data-act="dfVarDel" data-k="${k}" aria-label="Remove variation ${k+1}${v.name.trim()?' ('+esc(v.name.trim())+')':''}">${I.x}</button></div>`).join('')}
  ${rows.length<MAX_VARIATIONS?`<button type="button" class="linkbtn src-add" id="df-var-add" data-act="dfVarAdd">${I.plus} Add a variation</button>`:`<span class="hint">${MAX_VARIATIONS} is the most a dish can have.</span>`}
  <span class="hint">Versions you’ve made, each named as the whole meal, like “Chicken curry with cauliflower + peas”. A planned dinner shows the version’s name. Ratings, notes and recipes stay on the dish.</span></div>`;}
function draftVariations(d){const out=[];(d.varRows||[]).forEach(v=>{const n=cleanVarName(v.name);if(n&&!out.some(x=>x.name.toLowerCase()===n.toLowerCase()))out.push({id:v.id||uid(),name:n});});return out.slice(0,MAX_VARIATIONS);}
// Trim; add https:// when there's no scheme; accept only http and https. Returns {url} or {err}.
function normalizeUrl(raw){
  let v=String(raw||'').trim();if(!v)return {err:'Paste the recipe’s web address, or choose None.'};
  if(!/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(v))v='https://'+v.replace(/^\/+/,'');
  let u;try{u=new URL(v);}catch(e){return {err:'That doesn’t look like a web address.'};}
  if(u.protocol!=='http:'&&u.protocol!=='https:')return {err:'Only http:// and https:// links work here.'};
  if(!u.hostname||!/[a-z0-9]/i.test(u.hostname))return {err:'That doesn’t look like a web address.'};
  return {url:u.href};
}
// Adds what's typed in a row's "Add a cookbook…" (also on save, so a typed name isn't lost).
function addPendingBook(m,k){
  k=k||0;const el=document.getElementById('df-newbook'+sfx(k));const v=el?el.value.trim().replace(/\s+/g,' ').slice(0,60):'';if(!v)return false;
  const ex=cookbookList().find(c=>c.toLowerCase()===v.toLowerCase());
  if(!ex){S.settings.cookbooks=cookbookList().concat(v);saveSettings();}
  const row=m.draft.srcRows[k];row.book=ex||v;row.addBook=false;m.srcErr='';return true;
}
// The rows as saved: only each row's chosen kind; with several rows, completely empty ones are dropped.
// Returns {sources} or {err, k}.
function draftSources(m){
  const rows=m.draft.srcRows;const multi=rows.length>1;const out=[];
  const clean=v=>String(v||'').trim().replace(/\s+/g,' ');
  for(let k=0;k<rows.length;k++){
    const r=rows[k];if(r.type==='none')continue;
    const label=clean(r.label).slice(0,E.SOURCE_LABEL_MAX);const book=r.book==='__add'?'':clean(r.book);
    const empty=r.type==='book'?!book&&!clean(r.where):r.type==='kit'?!clean(r.kit)&&!clean(r.kitWhere):!clean(r.url);
    if(multi&&empty&&!label)continue;
    const or=multi?'remove this recipe':'choose None';let s;
    if(r.type==='book'){if(!book)return {err:'Choose a cookbook, or '+or+'.',k};
      s={type:'book',book:cookbookList().find(c=>c.toLowerCase()===book.toLowerCase())||book,where:clean(r.where).slice(0,80)};}
    else if(r.type==='kit'){const kit=clean(r.kit).slice(0,60);s={type:'kit',kit:kitList().find(x=>x.toLowerCase()===kit.toLowerCase())||kit,where:clean(r.kitWhere).slice(0,160)};}
    else{const n=normalizeUrl(r.url);if(n.err)return {err:multi&&!clean(r.url)?'Paste the recipe’s web address, or remove this recipe.':n.err,k};s={type:'url',url:n.url};}
    if(label)s.label=label;out.push(s);
  }
  return {sources:out.slice(0,E.MAX_SOURCES)};
}
// back: the modal to return to after Save or Cancel (the meal details view).
function openDishForm(d,link,back){
  const base=d?clone(d):{id:null,name:'',cuisine:cuisineList()[0]||'',effort:'1 hr',useFor:['dinner'],leftovers:'none',becomes:[],ratings:{},notes:'',labels:[]};
  base.labels=labelsOf(base).slice();
  base.becomesText=(base.becomes||[]).join(', ');
  const list=sourcesOf(base);delete base.source;delete base.sources;
  base.srcRows=list.length?list.map((s,k)=>srcRow(s,k===0)):[srcRow(null,true)];
  base.varRows=variationsOf(base).map(v=>({id:v.id,name:v.name}));delete base.variations;
  S.modal={type:'dish',draft:base,isNew:!d||!d.id||!S.dishes[d.id],link:link||null,back:back||null,err:'',confirmDel:false};renderModal(true);
}
function renderModal(first){
  const m=S.modal;if(!m){modalLayer.classList.remove('open');modalLayer.innerHTML='';return;}
  modalLayer.classList.add('open');
  if(m.type==='dish'){
    const d=m.draft;
    modalLayer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><h2 id="mh">${m.isNew?'Add dish':'Edit dish'}</h2><button class="ibtn" data-act="modalClose" aria-label="Close">${I.x}</button></div>
    <form class="modal-b" data-form="dish">
      <div class="field"><label for="df-name">Name</label><input class="input" id="df-name" data-dinput="name" value="${esc(d.name)}" placeholder="e.g. Beef stew" autocomplete="off"></div>
      <div class="frow"><div class="field"><label for="df-cui">Cuisine</label><select class="input" id="df-cui" data-dinput="cuisine"><option value="" ${!d.cuisine?'selected':''}>—</option>${cuisineList().map(c=>`<option ${d.cuisine===c?'selected':''}>${esc(c)}</option>`).join('')}<option value="__add">Add a cuisine…</option></select>${m.addCuisine?`<div class="addrow"><label class="sr" for="df-newcui">New cuisine</label><input class="input" id="df-newcui" placeholder="e.g. Italian" autocomplete="off"><button type="button" class="btn-ghost" data-act="dfAddCuisine">Add</button></div>`:''}</div>
      <div class="field"><label for="df-eff">Effort</label><select class="input" id="df-eff" data-dinput="effort"><option value="">—</option>${EFFORTS.map(c=>`<option ${d.effort===c?'selected':''}>${c}</option>`).join('')}</select></div></div>
      <div class="field"><span class="lab">Good for</span><div class="checks"><label><input type="checkbox" data-dcheck="dinner" ${(d.useFor||[]).includes('dinner')?'checked':''}> Family dinner</label><label><input type="checkbox" data-dcheck="lunch" ${(d.useFor||[]).includes('lunch')?'checked':''}> ${cookOnlyLunch()?'My lunch':'Lunch'}</label></div></div>
      <div class="field"><span class="lab">Leftovers</span><div class="checks">${[['asis','Reheat as-is'],['transform','Turn into another lunch'],['none','No planned leftovers']].map(([v,l])=>`<label><input type="radio" name="df-lo" data-dradio="leftovers" value="${v}" ${d.leftovers===v?'checked':''}> ${l}</label>`).join('')}</div></div>
      ${d.leftovers==='transform'?`<div class="field"><label for="df-bec">Turns into (comma separated)</label><input class="input" id="df-bec" data-dinput="becomesText" value="${esc(d.becomesText)}" placeholder="e.g. Fried rice, Wraps"></div>`:''}
      <div class="field"><label for="df-label">Labels</label><div class="lblbox">${(d.labels||[]).map((l,k)=>`<span class="lbl">${esc(l)}<button type="button" data-act="dfLabelDel" data-k="${k}" aria-label="Remove label ${esc(l)}">${I.x}</button></span>`).join('')}<input id="df-label" list="df-label-opts" placeholder="${(d.labels||[]).length?'Add another':'e.g. grill, slow cooker'}" autocomplete="off"></div><datalist id="df-label-opts">${allLabels().filter(l=>!(d.labels||[]).some(x=>x.toLowerCase()===l.name.toLowerCase())).map(l=>`<option value="${esc(l.name)}"></option>`).join('')}</datalist><span class="hint">Press Enter to add. Then you can write things like “no grilling this week” in your notes, or skip a label in Plan options.</span></div>
      ${variationsField(d)}
      ${recipeField(m)}
      <div class="field"><span class="lab">Who likes it</span>${people().map(p=>`<div class="prate"><b>${esc(p.name)}</b><span class="rate" role="group" aria-label="${esc(p.name)}">${RATE.map(([v,l])=>`<button type="button" id="dfr-${p.id}-${v}" class="${v} ${(d.ratings||{})[p.id]===v?'on':''}" data-act="dfRate" data-p="${p.id}" data-v="${v}" aria-pressed="${(d.ratings||{})[p.id]===v}">${l}</button>`).join('')}</span></div>`).join('')}</div>
      <div class="field"><label for="df-notes">Notes</label><input class="input" id="df-notes" data-dinput="notes" value="${esc(d.notes||'')}" placeholder="${esc(exampleName()?'e.g. '+exampleName()+' won’t eat it because of the mushrooms':'e.g. Only good fresh')}"></div>
      ${m.err?`<p class="err" role="alert">${esc(m.err)}</p>`:''}
      <button type="submit" hidden></button>
    </form>
    <div class="modal-f"><div>${!m.isNew?(m.confirmDel?`<span style="display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="err">Delete ${esc(d.name)} for good?</span><button class="btn-danger" data-act="dfDelete">Delete</button><button class="btn-ghost" data-act="dfDelCancel">Keep it</button></span>`:`<button class="btn-ghost" data-act="dfDelAsk" style="color:var(--danger)">Delete</button>`):''}</div><div class="r"><button class="btn-ghost" data-act="modalClose">Cancel</button><button class="btn-primary" data-act="dfSave">Save dish</button></div></div></div>`;
    if(first){const el=document.getElementById('df-name');el&&el.focus();}
  }else if(m.type==='lists'){
    modalLayer.innerHTML=renderLists(m);
    if(first){const b=modalLayer.querySelector('#new-cui');b&&b.focus();}
    else if(m.edit){const e=modalLayer.querySelector('[data-edit]');if(e){e.focus();try{e.setSelectionRange(e.value.length,e.value.length);}catch(x){}}}
  }else if(m.type==='confirm'){
    modalLayer.innerHTML=`<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="mh" aria-describedby="mb"><div class="modal-h"><h2 id="mh">${esc(m.title)}</h2><button class="ibtn" data-act="modalClose" aria-label="Close">${I.x}</button></div>
    <div class="modal-b"><p id="mb" style="margin:0">${esc(m.body)}</p></div>
    <div class="modal-f"><span></span><div class="r">${m.no?`<button class="btn-ghost" id="cf-no" data-act="modalClose">${esc(m.no)}</button>`:''}<button class="${m.danger?'btn-danger':'btn-primary'}" id="cf-yes" data-act="confirmYes">${esc(m.yes)}</button></div></div></div>`;
    if(first){const b=document.getElementById('cf-no')||document.getElementById('cf-yes');b&&b.focus();}
  }else if(m.type==='merge'){
    modalLayer.innerHTML=mergeHtml(m);
    if(first||m.focus){const f=document.getElementById(m.focus||(m.toId?'mg-name':'mg-q'));m.focus=null;if(f){f.focus();if(f.id==='mg-name')try{f.select();}catch(x){}}}
  }else if(m.type==='meal'){
    const h=mealHtml(m);if(!h){S.modal=null;renderModal();return;}
    modalLayer.innerHTML=h;
    if(first){const b=document.getElementById('meal-x');b&&b.focus();}
  }else if(m.type==='help'){
    modalLayer.innerHTML=E.helpHtml();
    if(first){const b=document.getElementById('help-x');b&&b.focus();}
  }else if(m.type==='fridge'){
    const w=getWeek(S.weekId);
    modalLayer.innerHTML=`<div class="modal wide sheet-modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><h2 id="mh">Fridge sheet</h2><button class="ibtn" data-act="modalClose" aria-label="Close">${I.x}</button></div>
    <div class="modal-b"><p class="muted" style="margin:0">One landscape page in black and white, with room under each dinner to write.</p><div class="sheet-wrap">${sheetBody(w)}</div>${m.err?`<p class="err" role="alert">${esc(m.err)}</p>`:''}</div>
    <div class="modal-f"><span></span><div class="r"><button class="btn-ghost" data-act="modalClose">Close</button><button class="btn-primary" data-act="printSheet">Print</button></div></div></div>`;
    if(first){const b=modalLayer.querySelector('.btn-primary,.ibtn');b&&b.focus();}
  }
}
function closeModal(){const m=S.modal;S.modal=null;
  // The dish form opened from a meal's details goes back to them (Cancel, ×, Esc, Save).
  if(m&&m.back&&!m.noBack){S.modal=m.back;renderModal(true);return;}
  renderModal();if(m&&m.type==='confirm'&&!m.done&&m.onNo)m.onNo();
  if(m&&m.type==='help'){const b=document.getElementById('help-btn');b&&b.focus({preventScroll:true});}
  if(m&&m.type==='meal'&&S.view==='plan'&&S.weekId===m.week){const c=document.getElementById('mo-'+m.i);c&&c.focus({preventScroll:true});}}

/* ---------- meal details (a planned dinner) ----------
   View-only: opening and closing it changes nothing. Edit opens the dish form and comes back here. */
function openMeal(i){const w=getWeek(S.weekId);const dn=w.days[i]&&w.days[i].dinner;if(!dn||dn.kind!=='dish'||!dn.dish)return;
  E.closePop();S.modal={type:'meal',week:S.weekId,i};renderModal(true);}
function mealRecipe(s){const lab=s.label?`<b>${esc(s.label)}:</b> `:'';
  if(s.type==='book')return lab+esc(s.book)+(s.where?` <span class="muted">· ${esc(s.where)}</span>`:'');
  if(s.type==='kit')return lab+'Meal kit'+(s.kit?' · '+esc(s.kit):'')+(s.where?` <span class="muted">· ${esc(s.where)}</span>`:'');
  return lab+`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url.replace(/^https?:\/\//i,'').replace(/\/$/,''))}${I.ext}</a>`;}
function mealHtml(m){
  const w=S.weeks[m.week]||S.drafts[m.week];const day=w&&w.days[m.i];const dn=day&&day.dinner;if(!dn||dn.kind!=='dish'||!dn.dish)return '';
  const d=disp(dn.dish);const lib=d.id&&S.dishes[d.id];const v=dinnerVariation(dn);const title=dinnerTitle(dn);
  const row=(lab,body)=>body?`<div class="md-row"><span class="md-lab">${lab}</span><div class="md-val">${body}</div></div>`:'';
  const lo=d.leftovers==='asis'?'Reheats as-is':d.leftovers==='transform'?'Turns into '+((d.becomes||[]).join(', ')||'a different lunch'):'No planned leftovers';
  const tonight=d.leftovers==='asis'?'Leftovers become lunch tomorrow':d.leftovers==='transform'?'→ '+((d.becomes&&d.becomes[0])||'Leftover lunch'):'';
  const labs=labelsOf(d);const srcs=sourcesOf(d);const vs=lib?variationsOf(lib):[];
  let b='';
  if(!lib)b+=`<p class="muted" style="margin:0">Not in your Library yet. Edit to save it there with ratings.</p>`;
  b+=row('Cuisine',esc(d.cuisine||''))+row('Cook time',esc(d.effort||''));
  b+=row('Labels',labs.map(l=>`<span class="tag lbl-t">${esc(l)}</span>`).join(' '));
  if(lib)b+=row('Ratings',`<div class="md-rates">${people().map(p=>{const x=r(lib,p.id);return `<span class="pr ${x||'none'}"><small>${esc(p.name)}</small><b>${x?RATE_LABEL[x]:'Not rated'}</b></span>`;}).join('')}</div>`);
  b+=row('Leftovers',esc(lo)+(tonight?`<div class="md-tonight">${esc(tonight)}</div>`:''));
  b+=row('Notes',esc((lib&&lib.notes)||''));
  if(vs.length)b+=row('Versions',`<ul class="md-list">${vs.map(x=>`<li${v&&v.id===x.id?' class="on"':''}>${esc(x.name)}${v&&v.id===x.id?' <span class="tag">Planned</span>':''}</li>`).join('')}</ul>`);
  b+=row(srcs.length>1?'Recipes':'Recipe',srcs.length?`<ul class="md-list">${srcs.map(s=>`<li>${mealRecipe(s)}</li>`).join('')}</ul>`:'<span class="muted">None saved</span>');
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><div class="md-head"><span class="eyebrow">${esc(DOWL[m.i])} dinner${d.isNew?' · <span class="newb">New</span>':''}</span><h2 id="mh">${esc(title)}</h2>${v?`<span class="md-sub">Version of ${esc(d.name)}</span>`:''}</div><button class="ibtn" id="meal-x" data-act="modalClose" aria-label="Close">${I.x}</button></div>
  <div class="modal-b md">${b}</div>
  <div class="modal-f"><span></span><div class="r"><button class="btn-ghost" data-act="modalClose">Close</button><button class="btn-primary" id="meal-edit" data-act="mealEdit">Edit</button></div></div></div>`;
}
function mealEdit(){const m=S.modal;if(!m||m.type!=='meal')return;const w=getWeek(m.week);const dn=w.days[m.i].dinner;if(dn.kind!=='dish'||!dn.dish)return;
  const back={type:'meal',week:m.week,i:m.i};const d=disp(dn.dish);const lib=d.id&&S.dishes[d.id];
  if(lib)openDishForm(lib,null,back);
  else openDishForm({name:d.name,cuisine:d.cuisine||cuisineList()[0]||'',effort:d.effort,useFor:['dinner'],leftovers:d.leftovers||'none',becomes:d.becomes||[],labels:d.labels||[],ratings:{},notes:''},{week:m.week,day:m.i,name:d.name},back);}
// In-page confirm: {title, body, yes, no, danger, onYes, onNo}.
function confirmBox(o){S.modal=Object.assign({type:'confirm',no:'Cancel'},o);renderModal(true);}
function addPendingLabels(rerender){
  const el=document.getElementById('df-label');if(!el||!S.modal||S.modal.type!=='dish')return;
  const d=S.modal.draft;d.labels=d.labels||[];
  el.value.split(',').map(canonLabel).filter(Boolean).forEach(l=>{if(!d.labels.some(x=>x.toLowerCase()===l.toLowerCase()))d.labels.push(l);});
  el.value='';
  if(rerender){renderModal();const n=document.getElementById('df-label');n&&n.focus();}
}
function renderLists(m){
  const cnt=c=>Object.values(S.dishes).filter(d=>(d.cuisine||'').toLowerCase()===c.toLowerCase()).length;
  const row=(kind,name,count,k)=>{
    if(m.edit&&m.edit.kind===kind&&m.edit.name===name)return `<form class="rule" data-form="listEdit"><label class="sr" for="ed-${kind}-${k}">Rename ${esc(name)}</label><input class="input" id="ed-${kind}-${k}" data-edit value="${esc(m.edit.value)}" style="flex:1" autocomplete="off"><button class="btn-primary" type="submit" style="min-height:36px;padding:6px 14px;font-size:14px">Save</button><button type="button" class="btn-ghost" data-act="listCancel">Cancel</button></form>`;
    if(m.confirm&&m.confirm.kind===kind&&m.confirm.name===name)return `<div class="rule"><span>Remove “${esc(name)}” from ${count} dish${count===1?'':'es'}?</span><button class="btn-danger" data-act="listDelete">Remove</button><button class="btn-ghost" data-act="listCancel">Keep</button></div>`;
    const del=(kind==='cuisine'||kind==='book')&&count?`<span class="muted" style="font-size:12px;padding:0 6px">In use</span>`:`<button class="ibtn" data-act="listAskDel" data-kind="${kind}" data-name="${esc(name)}" aria-label="Delete ${esc(name)}">${I.x}</button>`;
    return `<div class="rule"><span>${esc(name)} <span class="muted" style="font-size:12px">· ${count} dish${count===1?'':'es'}</span></span><button class="btn-ghost" data-act="listEdit" data-kind="${kind}" data-name="${esc(name)}">Rename</button>${del}</div>`;};
  const labs=allLabels();
  const bcnt=b=>Object.values(S.dishes).filter(d=>E.usesBook(d,b)).length;const books=cookbookList();
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><h2 id="mh">Cuisines, labels &amp; cookbooks</h2><button class="ibtn" data-act="modalClose" aria-label="Close">${I.x}</button></div>
  <div class="modal-b">
    <section class="field"><span class="lab">Cuisines</span><p class="hint" style="margin:0">Every dish has one cuisine. The planner uses it to vary the week. Renaming one updates every dish that uses it, and renaming it to an existing cuisine merges the two.</p>
      <div class="lists">${cuisineList().map((c,k)=>row('cuisine',c,cnt(c),k)).join('')}</div>
      <form class="addrow" data-form="cuisine"><label class="sr" for="new-cui">New cuisine</label><input class="input" id="new-cui" placeholder="Add a cuisine, e.g. Italian" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form></section>
    <section class="field"><span class="lab">Labels</span><p class="hint" style="margin:0">Labels come from your dishes. Add them in a dish’s edit form. Renaming a label to one that already exists merges them.</p>
      <div class="lists">${labs.length?labs.map((l,k)=>row('label',l.name,l.count,k)).join(''):'<p class="muted" style="margin:0">No labels yet.</p>'}</div></section>
    <section class="field"><span class="lab">Cookbooks</span><p class="hint" style="margin:0">Cookbooks you can point a dish’s recipe to. Renaming one updates every dish that uses it, and renaming it to an existing cookbook merges the two.</p>
      <div class="lists">${books.length?books.map((b,k)=>row('book',b,bcnt(b),k)).join(''):'<p class="muted" style="margin:0">No cookbooks yet.</p>'}</div>
      <form class="addrow" data-form="cookbook"><label class="sr" for="new-book">New cookbook</label><input class="input" id="new-book" placeholder="Add a cookbook, e.g. Salt Fat Acid Heat" autocomplete="off"><button class="btn-ghost" type="submit">Add</button></form></section>
    ${m.err?`<p class="err" role="alert">${esc(m.err)}</p>`:''}
  </div><div class="modal-f"><span></span><div class="r"><button class="btn-primary" data-act="modalClose">Done</button></div></div></div>`;
}
function eachWeekSkip(fn){Object.values(S.weeks).forEach(w=>{if(!(w.skipLabels||[]).length)return;const next=fn(w.skipLabels.slice());if(JSON.stringify(next)!==JSON.stringify(w.skipLabels)){w.skipLabels=next;changed();}});}
function renameIn(arr,from,to){const out=[];arr.forEach(x=>{const v=x.toLowerCase()===from.toLowerCase()?to:x;if(!out.some(y=>y.toLowerCase()===v.toLowerCase()))out.push(v);});return out;}
function listSave(){
  const m=S.modal;if(!m||!m.edit)return;const {kind,name}=m.edit;const v=String(m.edit.value||'').trim().replace(/\s+/g,' ').slice(0,kind==='book'?60:40);
  if(!v){m.err='Names can’t be empty.';renderModal();return;}
  if(kind==='cuisine'){
    const target=cuisineList().find(c=>c.toLowerCase()===v.toLowerCase()&&c!==name)||v;
    S.settings.cuisines=renameIn(cuisineList(),name,target);saveSettings();
    Object.values(S.dishes).forEach(d=>{if((d.cuisine||'').toLowerCase()===name.toLowerCase()){const nd=clone(d);nd.cuisine=target;nd.updated=Date.now();saveDish(nd);}});
  }else if(kind==='book'){
    const target=cookbookList().find(c=>c.toLowerCase()===v.toLowerCase()&&c!==name)||v;
    S.settings.cookbooks=renameIn(cookbookList(),name,target);saveSettings();
    Object.values(S.dishes).forEach(d=>{if(E.usesBook(d,name)){const nd=clone(d);delete nd.source;nd.sources=sourcesOf(d).map(s=>s.type==='book'&&s.book.toLowerCase()===name.toLowerCase()?Object.assign({},s,{book:target}):s);nd.updated=Date.now();saveDish(nd);}});
  }else{
    const target=(allLabels().find(l=>l.name.toLowerCase()===v.toLowerCase()&&l.name!==name)||{name:v}).name;
    Object.values(S.dishes).forEach(d=>{if(labelsOf(d).some(l=>l.toLowerCase()===name.toLowerCase())){const nd=clone(d);nd.labels=renameIn(labelsOf(d),name,target);nd.updated=Date.now();saveDish(nd);}});
    eachWeekSkip(sk=>renameIn(sk,name,target));
  }
  m.edit=null;m.err='';renderModal();render();toast('Renamed to '+v);
}
function saveDishForm(){
  const m=S.modal;const d=m.draft;addPendingLabels(false);const name=String(d.name||'').trim();
  if(!name){m.err='Give the dish a name.';renderModal();return;}
  const dup=dishList().find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==d.id);
  if(dup){m.err='There’s already a dish called '+dup.name+'.';renderModal();return;}
  if(!(d.useFor||[]).length){m.err='Pick at least one: family dinner or '+(cookOnlyLunch()?'my lunch':'lunch')+'.';renderModal();return;}
  d.srcRows.forEach((r,k)=>{if(r.type==='book')addPendingBook(m,k);});
  const ds=draftSources(m);if(ds.err){m.srcErr=ds.err;m.srcErrK=ds.k;m.err='';renderModal();const x=sfx(ds.k);const t=d.srcRows[ds.k].type;const f=document.getElementById((t==='url'?'df-url':t==='kit'?'df-kit':'df-book')+x)||document.getElementById('df-newbook'+x);f&&f.focus();return;}
  m.srcErr='';
  const out={id:d.id||uid(),name,cuisine:d.cuisine||'',effort:d.effort||'',useFor:d.useFor,labels:(d.labels||[]).slice(0,12),leftovers:d.leftovers||'none',becomes:d.leftovers==='transform'?String(d.becomesText||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,4):[],ratings:d.ratings||{},notes:String(d.notes||'').trim(),sources:ds.sources,variations:draftVariations(d),created:d.created||Date.now(),updated:Date.now()};
  saveDish(out);
  if(m.link){const L=m.link;mutateWeek(L.week,w=>{const dn=w.days[L.day].dinner;if(dn.kind==='dish'&&dn.dish&&dn.dish.name.toLowerCase()===String(L.name).toLowerCase()){dn.dish=Object.assign(snap(out),{isNew:true});}});}
  closeModal();toast((m.isNew?'Added ':'Saved ')+out.name);render();
}

/* ---------- merge a dish into another ----------
   Step 1: pick the dish it's a version of (searchable). Step 2: one plain-words confirm with the version name. */
function openMerge(id){if(!S.dishes[id])return;S.modal={type:'merge',fromId:id,toId:null,q:'',vname:''};renderModal(true);}
function mergeItems(m){const q=String(m.q||'').trim().toLowerCase();
  const list=dishList().filter(d=>d.id!==m.fromId).filter(d=>!q||d.name.toLowerCase().includes(q)||variationsOf(d).some(v=>v.name.toLowerCase().includes(q)));
  if(!list.length)return `<div class="empty-state" style="padding:16px"><p style="margin:0">${q?'No other dish matches.':'There are no other dishes to merge into.'}</p></div>`;
  return list.map(d=>{const n=variationsOf(d).length;const sub=[d.cuisine,n?n+' version'+(n===1?'':'s'):''].filter(Boolean).join(' · ');
    return `<button type="button" class="mg-item" data-act="mergePick" data-id="${esc(d.id)}">${esc(d.name)}${sub?`<small>${esc(sub)}</small>`:''}</button>`;}).join('');}
function recipeName(s){return (s.label?s.label+': ':'')+(s.type==='url'?s.url:E.sourcePart(s));}
function mergeInfo(m){const p=E.mergePlan(m.fromId,m.toId,m.vname);if(!p)return '';const out=[];
  if(p.vname)out.push(`<p style="margin:0">Planned and past meals will show the version’s name, <b>${esc(p.vname)}</b>. You can change it above.</p>`);
  const extra=[];const fv=variationsOf(p.from).filter(v=>p.idMap[v.id]===v.id);
  if(fv.length)extra.push('Its own versions come along too: '+fv.map(v=>v.name).join(', ')+'.');
  if(p.dropped.length)extra.push('A dish can have '+MAX_VARIATIONS+' versions, so these won’t fit: '+p.dropped.join(', ')+'.');
  if(p.skipped.length)extra.push('A dish can have '+E.MAX_SOURCES+' recipes, so '+(p.skipped.length===1?'this one won’t fit: ':'these won’t fit: ')+p.skipped.map(recipeName).join('; ')+'.');
  extra.push(p.to.name+' keeps its ratings, cuisine, effort and leftovers; anyone who hasn’t rated it takes their rating of '+p.from.name+'. Labels, notes and recipes are combined. Undo brings both dishes back.');
  out.push(`<ul class="hint" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${extra.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`);
  if(p.err)out.push(`<p class="err" role="alert" style="margin:0">${esc(p.err)}</p>`);
  return out.join('');}
function mergeHtml(m){const from=S.dishes[m.fromId];const to=m.toId&&S.dishes[m.toId];if(!from)return '';
  const head=t=>`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><h2 id="mh">${esc(t)}</h2><button class="ibtn" data-act="modalClose" aria-label="Close">${I.x}</button></div>`;
  if(!to)return head('Merge '+from.name+' into…')+`<div class="modal-b"><p class="muted" style="margin:0">Pick the dish ${esc(from.name)} is really a version of.</p>
    <label class="sr" for="mg-q">Search dishes</label><input class="input" id="mg-q" data-mgq placeholder="Search dishes" value="${esc(m.q)}" autocomplete="off">
    <div class="mg-list" id="mg-list" role="group" aria-label="Dishes">${mergeItems(m)}</div></div>
    <div class="modal-f"><span></span><div class="r"><button class="btn-ghost" data-act="modalClose">Cancel</button></div></div></div>`;
  const p=E.mergePlan(m.fromId,m.toId,m.vname);
  return head('Merge into '+to.name)+`<form class="modal-b" data-form="merge">
    <p class="mg-say"><b>${esc(from.name)}</b> becomes a version of <b>${esc(to.name)}</b>, named <label class="sr" for="mg-name">Version name</label><input class="input" id="mg-name" data-mgname value="${esc(m.vname)}" maxlength="${VARIATION_MAX}" size="${Math.min(40,Math.max(16,m.vname.length+2))}" autocomplete="off">.</p>
    <div id="mg-info" style="display:flex;flex-direction:column;gap:10px">${mergeInfo(m)}</div><button type="submit" hidden></button></form>
    <div class="modal-f"><span></span><div class="r"><button class="btn-ghost" id="mg-back" data-act="mergeBack">Back</button><button class="btn-primary" id="mg-do" data-act="mergeDo" ${p&&p.err?'disabled':''}>Merge</button></div></div></div>`;}
// Live updates while typing (the input itself isn't redrawn).
function mergeRefresh(){const m=S.modal;if(!m||m.type!=='merge')return;
  if(!m.toId){const l=document.getElementById('mg-list');if(l)l.innerHTML=mergeItems(m);return;}
  const i=document.getElementById('mg-info');if(i)i.innerHTML=mergeInfo(m);const p=E.mergePlan(m.fromId,m.toId,m.vname);const b=document.getElementById('mg-do');if(b)b.disabled=!!(p&&p.err);}
function mergeDo(){const m=S.modal;if(!m||m.type!=='merge'||!m.toId)return;
  const p=E.mergePlan(m.fromId,m.toId,m.vname);if(!p||p.err){mergeRefresh();return;}
  const fromName=p.from.name,toName=p.to.name;S.modal=null;renderModal();
  E.mergeDishes(m.fromId,m.toId,m.vname);render();toast('Merged '+fromName+' into '+toName);
  const b=document.getElementById('mg-'+m.toId);if(b)b.focus({preventScroll:true});}

/* ---------- fridge sheet ----------
   One landscape page, read at a glance from across the kitchen: per day, what lunch is and tonight's
   dinner (name, cook time and "start by", where the recipe is), with blank space under each dinner for
   handwritten notes. Breakfasts and lunch prep go in small bullets underneath. Nothing else. */
// Cook time in minutes from a dish's effort ("45 min", "1.5 hr", "2+ hr" = 2 hours), or null (slow cooker etc.).
function effortMinutes(e){const m=/^(\d+(?:\.\d+)?)\+?\s*(min|hr)\b/i.exec(String(e||'').trim());if(!m)return null;return Math.round(Number(m[1])*(m[2].toLowerCase()==='hr'?60:1));}
// settings.cooking.dinnerTime ("18:00", from a time input) in minutes after midnight, or null when not set.
function dinnerMinutes(){const v=String((S.settings.cooking&&S.settings.cooking.dinnerTime)||'');const m=/^(\d{1,2}):(\d{2})/.exec(v);if(!m)return null;const h=+m[1],mi=+m[2];return h<24&&mi<60?h*60+mi:null;}
// "5:00" (12-hour clock, no am/pm: it's on the fridge).
function clockText(min){min=((min%1440)+1440)%1440;const h=Math.floor(min/60)%12||12;return h+':'+String(min%60).padStart(2,'0');}
// "1 hr · start by 5:00", or just "1 hr" without a dinner time.
function timeLine(effort){const e=String(effort||'').trim();if(!e)return '';const c=effortMinutes(e);const dt=dinnerMinutes();
  return c!=null&&dt!=null?e+' · start by '+clockText(dt-c):e;}
function sheetRows(w){
  return w.days.map((d,i)=>{const L=resolveLunch(w,i);const dn=d.dinner;let din={name:''};
    if(d.away||dn.kind==='out')din={name:'Eating out'};
    else if(dn.kind==='leftovers')din={name:'Leftovers night',note:'Clear out the fridge'};
    else if(dn.kind==='dish'&&dn.dish){const x=disp(dn.dish);din={name:dinnerTitle(dn),time:timeLine(x.effort),src:E.recipeShort(sourcesOf(x)),dish:true};}
    const lunch=d.away||L.kind==='out'?'Out':L.kind==='prep'?'Lunch prep: '+L.label:(L.label||'');
    return {day:DOWL[i],date:fmtDate(addDays(w.id,i)),lunch,din};});
}
function sheetBody(w){
  const rows=sheetRows(w);const lp=w.lunchPrep;const b=bk(w);const c=cook();
  const items=[];breakfastPeople().forEach(p=>{if(b[p.id])items.push(`<li><b>${c&&p.id===c.id?'My breakfast':esc(p.name)+'’s breakfast'}:</b> ${esc(b[p.id])}</li>`);});
  if(lp)items.push(`<li><b>Sunday lunch prep:</b> ${esc(lp.name)} (${esc(daysText(lp.days))})</li>`);
  return `<div class="sheet"><div class="sh-head"><div class="sh-title">Week of ${esc(fmtRange(w.id))}</div><div class="sh-app">Eat At Home</div></div>
  <div class="sh-grid"><div class="sh-c sh-lab"></div>${rows.map(r=>`<div class="sh-c sh-day">${esc(r.day)}<span>${esc(r.date)}</span></div>`).join('')}
  <div class="sh-c sh-lab">Lunch</div>${rows.map(r=>`<div class="sh-c sh-lunch">${esc(r.lunch)}</div>`).join('')}
  <div class="sh-c sh-lab">Dinner</div>${rows.map(r=>`<div class="sh-c sh-din${r.din.dish?'':' sh-plain'}">${r.din.name?`<div class="sh-name">${esc(r.din.name)}</div>`:''}${r.din.time?`<div class="sh-time">${esc(r.din.time)}</div>`:''}${r.din.src?`<div class="sh-src">${esc(r.din.src)}</div>`:''}${r.din.note?`<div class="sh-time">${esc(r.din.note)}</div>`:''}</div>`).join('')}</div>
  ${items.length?`<ul class="sh-notes">${items.join('')}</ul>`:''}</div>`;
}
Object.assign(E,{variationsField,draftVariations,openMerge,mergeItems,mergeInfo,mergeHtml,mergeRefresh,mergeDo,SRC_KINDS,srcRow,recipeRow,addPendingBook,recipeField,normalizeUrl,draftSources,openDishForm,renderModal,closeModal,confirmBox,addPendingLabels,renderLists,eachWeekSkip,renameIn,listSave,saveDishForm,effortMinutes,dinnerMinutes,clockText,timeLine,sheetRows,sheetBody,openMeal,mealHtml,mealEdit});
})();
