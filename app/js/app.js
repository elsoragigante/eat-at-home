(function(){
'use strict';
const E=window.EAH;
const {DOWL,clone,addDays,defaultWeekId,lsSet,S,popLayer,modalLayer,applyTheme,toast,cuisineList,labelsOf,disp,bk,getWeek,mutateWeek,quietWeek,saveSettings,saveDish,deleteDish,setDinner,pushIdea,placeIdea,placeLib,swapDays,generate,moreIdeas,render,refocus,triedLately,mealStatus,openPop,closePop,dropPop,renderPop,popList,openDishForm,renderModal,closeModal,addPendingLabels,eachWeekSkip,listSave,saveDishForm,sheetBody,weekShape,setBreakfast,people,personById,changedSoon,changed,newPerson}=E;
/* ---------- actions ---------- */
function setTheme(id){S.settings.theme=id;applyTheme(id);lsSet('eah-theme',id);changed({undo:false});render();}
const A={
  nav:el=>{S.view=el.dataset.view;closePop();render();window.scrollTo(0,0);},
  week:el=>{S.weekId=addDays(S.weekId,Number(el.dataset.d));S.genMsg='';render();},
  weekReset:()=>{S.weekId=defaultWeekId();S.genMsg='';render();},
  newModePop:el=>{mutateWeek(S.weekId,w=>{w.newMode=el.dataset.v;});refocus(popLayer,()=>renderPop());},
  planOptions:el=>{const a=document.getElementById('po-btn')||el;openPop(a,'options',{});},
  dismissMsg:()=>{S.genMsg='';render();},
  // Leftovers nights − / + live in Plan options: redraw it, keep focus on the button.
  loPlus:()=>{E.addLeftovers();if(S.pop&&S.pop.type==='options')renderPop();const b=document.getElementById('lo-plus');if(b&&!b.disabled)b.focus();else{const m=document.getElementById('lo-minus');m&&m.focus();}},
  loMinus:()=>{E.removeLeftovers();if(S.pop&&S.pop.type==='options')renderPop();const b=document.getElementById('lo-minus');if(b&&!b.disabled)b.focus();else{const p=document.getElementById('lo-plus');p&&p.focus();}},
  skipToggle:el=>{const l=el.dataset.l;mutateWeek(S.weekId,w=>{const st=(w.skipLabels||[]).slice();const k=st.findIndex(x=>x.toLowerCase()===l.toLowerCase());if(k>=0)st.splice(k,1);else st.push(l);w.skipLabels=st;});refocus(popLayer,()=>renderPop());},
  dfLabelDel:el=>{const d=S.modal.draft;d.labels.splice(+el.dataset.k,1);renderModal();const n=document.getElementById('df-label');n&&n.focus();},
  dfAddCuisine:()=>{const el=document.getElementById('df-newcui');const v=el?el.value.trim().replace(/\s+/g,' ').slice(0,40):'';if(!v)return;const m=S.modal;const ex=cuisineList().find(c=>c.toLowerCase()===v.toLowerCase());if(!ex){S.settings.cuisines=cuisineList().concat(v);saveSettings();}m.draft.cuisine=ex||v;m.addCuisine=false;renderModal();const c=document.getElementById('df-cui');c&&c.focus();},
  // Recipe rows. Row 0 has None: choosing it clears that row, or drops it when there are others (the next moves up).
  dfSrcType:el=>{const m=S.modal;const rows=m.draft.srcRows;const k=+el.dataset.k||0;const v=el.dataset.v;m.srcErr='';
    if(v==='none'){if(rows.length>1)rows.splice(0,1);else rows[0].type='none';rows[0].addBook=false;renderModal();const f=document.getElementById('dfs-'+rows[0].type);f&&f.focus();return;}
    rows[k].type=v;rows[k].addBook=false;renderModal();const x=k?'-'+k:'';
    const f=document.getElementById((v==='url'?'df-url':v==='kit'?'df-kit':document.getElementById('df-book'+x)?'df-book':'df-newbook')+x);f&&f.focus();},
  dfSrcAdd:()=>{const m=S.modal;const rows=m.draft.srcRows;if(rows.length>=E.MAX_SOURCES||rows[0].type==='none')return;
    rows.push(E.srcRow(null,false));rows[rows.length-1].type=rows[rows.length-2].type;m.srcErr='';renderModal();
    const k=rows.length-1;const f=document.getElementById('df-slabel-'+k);f&&f.focus();},
  dfSrcDel:el=>{const m=S.modal;const rows=m.draft.srcRows;const k=+el.dataset.k;if(!k||k>=rows.length)return;rows.splice(k,1);m.srcErr='';renderModal();
    const n=k<rows.length?document.getElementById('dfs-del-'+k):document.getElementById('df-src-add')||document.getElementById('dfs-'+rows[k-1].type+(k-1?'-'+(k-1):''));n&&n.focus();},
  dfAddBook:el=>{const m=S.modal;const k=+(el&&el.dataset.k)||0;if(!E.addPendingBook(m,k))return;renderModal();const c=document.getElementById('df-where'+(k?'-'+k:''));c&&c.focus();},
  listsOpen:()=>{closePop();S.modal={type:'lists',edit:null,confirm:null,err:''};renderModal(true);},
  listEdit:el=>{const m=S.modal;m.edit={kind:el.dataset.kind,name:el.dataset.name,value:el.dataset.name};m.confirm=null;m.err='';renderModal();},
  listCancel:()=>{const m=S.modal;m.edit=null;m.confirm=null;m.err='';renderModal();},
  listAskDel:el=>{const m=S.modal;const kind=el.dataset.kind,name=el.dataset.name;
    if(kind==='cuisine'){S.settings.cuisines=cuisineList().filter(c=>c!==name);saveSettings();renderModal();toast('Removed '+name);return;}
    if(kind==='book'){if(Object.values(S.dishes).some(d=>E.usesBook(d,name)))return;S.settings.cookbooks=E.cookbookList().filter(c=>c!==name);saveSettings();renderModal();toast('Removed '+name);return;}
    m.confirm={kind,name};m.edit=null;renderModal();},
  listDelete:()=>{const m=S.modal;const name=m.confirm.name;
    Object.values(S.dishes).forEach(d=>{if(labelsOf(d).some(l=>l.toLowerCase()===name.toLowerCase())){const nd=clone(d);nd.labels=labelsOf(d).filter(l=>l.toLowerCase()!==name.toLowerCase());nd.updated=Date.now();saveDish(nd);}});
    eachWeekSkip(sk=>sk.filter(x=>x.toLowerCase()!==name.toLowerCase()));
    m.confirm=null;renderModal();render();toast('Removed label '+name);},
  generate:()=>generate(),
  stop:()=>{S.busy&&S.busy.ctl.abort();},
  moreIdeas:()=>moreIdeas(),
  lock:el=>mutateWeek(S.weekId,w=>{const dn=w.days[+el.dataset.i].dinner;dn.locked=!dn.locked;}),
  lunchPick:el=>openPop(el,'lunch',{i:+el.dataset.i}),
  dinnerPick:el=>openPop(el,'dinner',{i:+el.dataset.i}),
  ideaPlace:el=>{const k=+el.dataset.k;const w=getWeek(S.weekId);const it=w.ideas[k];if(!it)return;openPop(el,'place',{item:Object.assign({},disp(it),{name:E.ideaTitle(it)}),place:i=>placeIdea(k,i)});},
  ideasToggle:()=>{const open=!E.ideasOpen();lsSet('eah-ideas-open',open?'1':'0');render();},
  // A dinner card opens its details (not right after a drag, not from the card's buttons).
  mealOpen:el=>{if(Date.now()-dragEndAt<350)return;E.openMeal(+el.dataset.i);},
  mealEdit:()=>E.mealEdit(),
  libPlace:el=>{const d=S.dishes[el.dataset.id];if(!d)return;openPop(el,'place',{item:d,place:i=>placeLib(d.id,i)});},
  dayMenu:el=>{const i=+el.dataset.i;const w=getWeek(S.weekId);const d=w.days[i];
    openPop(el,'menu',{items:[
      {label:d.away?'Back home this day':'Away all day',sub:d.away?'restore this day’s plan':'everyone eats out; the plan is kept',fn:()=>{closePop();mutateWeek(S.weekId,ww=>{ww.days[i].away=!ww.days[i].away;});}},
      {label:d.tryNew?'Don’t try new tonight':'Try a new recipe tonight',fn:()=>{closePop();mutateWeek(S.weekId,ww=>{ww.days[i].tryNew=!ww.days[i].tryNew;});}},
      {label:'Clear this day',sub:'empty dinner, automatic lunch',cls:'danger',fn:()=>{closePop();mutateWeek(S.weekId,ww=>{const dd=ww.days[i];if(dd.dinner.kind==='dish'&&dd.dinner.dish)pushIdea(ww,dd.dinner.dish);dd.dinner={kind:'empty',locked:false};dd.lunch={kind:i===weekShape().clearoutLunch?'clearout':'auto'};dd.away=false;});}}]});},
  cardMenu:el=>{const i=+el.dataset.i;const w=getWeek(S.weekId);const dn=w.days[i].dinner;const items=[];
    if(dn.kind==='dish'&&dn.dish){const d=disp(dn.dish);
      if(d.id&&S.dishes[d.id])items.push({label:'Rate this dish',sub:'what each person thinks',fn:()=>{const a=document.getElementById('cm-'+i);S.pop=null;openPop(a||el,'rate',{id:d.id});}});
      else items.push({label:'Add to library',sub:'save it with ratings',fn:()=>{closePop();openDishForm({name:d.name,cuisine:d.cuisine||cuisineList()[0]||'',effort:d.effort,useFor:['dinner'],leftovers:d.leftovers||'none',becomes:d.becomes||[],labels:d.labels||[],ratings:{},notes:''},{week:S.weekId,day:i,name:d.name});}});
      items.push({label:'Make this the leftovers night',fn:()=>{closePop();setDinner(i,{kind:'leftovers'});}});
      items.push({label:'Eating out',fn:()=>{closePop();setDinner(i,{kind:'out'});}});
      items.push({label:'Remove from this week',sub:'moves it to Other ideas',cls:'danger',fn:()=>{closePop();setDinner(i,{kind:'empty'});}});
      // Which version: only for library dishes. With none yet, just "+ New version…".
      const lib=d.id&&S.dishes[d.id];
      if(lib){const vs=E.variationsOf(lib);const cur=E.dinnerVariation(dn);const vi=[];
        const newVer={label:'+ New version…',fn:()=>{const a=document.getElementById('cm-'+i);S.pop=null;openPop(a||el,'newver',{i,id:lib.id});}};
        if(vs.length){vi.push({label:'No particular version',cls:cur?'':'cur',fn:()=>{closePop();E.setVariation(i,null);}});
          vs.forEach(v=>vi.push({label:v.name,cls:cur&&cur.id===v.id?'cur':'',fn:()=>{closePop();E.setVariation(i,v.id);}}));
          if(vs.length<E.MAX_VARIATIONS)vi.push(newVer);
          return openPop(el,'menu',{groups:[E.group('',items),E.group('Which version?',vi)]});}
        items.push(newVer);}
    }else{
      items.push({label:'Choose a dinner',fn:()=>{const a=document.getElementById('cm-'+i);S.pop=null;openPop(a||el,'dinner',{i});}});
      items.push({label:'Clear',cls:'danger',fn:()=>{closePop();setDinner(i,{kind:'empty'});}});
    }
    openPop(el,'menu',{items});},
  setRate:el=>{const d=S.dishes[el.dataset.id];if(!d)return;const nd=clone(d);nd.ratings=nd.ratings||{};const v=el.dataset.v;nd.ratings[el.dataset.p]=nd.ratings[el.dataset.p]===v?null:v;nd.updated=Date.now();saveDish(nd);refocus(popLayer,()=>renderPop());render();},
  popClose:()=>closePop(),
  prepOpen:el=>{const w=getWeek(S.weekId);openPop(el,'prep',{pick:null,days:(w.lunchPrep&&w.lunchPrep.days)||[1,2,3,4,5]});},
  prepDay:el=>{const p=S.pop;const i=+el.dataset.i;const ds=p.data.days;p.data.days=ds.includes(i)?ds.filter(x=>x!==i):ds.concat(i).sort();refocus(popLayer,()=>renderPop());},
  prepBack:()=>{S.pop.data.pick=null;renderPop(true);},
  prepApply:()=>{const p=S.pop.data;const pick=p.pick;const days=p.days.slice().sort();closePop();
    mutateWeek(S.weekId,w=>{w.days.forEach(d=>{if(d.lunch&&d.lunch.kind==='prep')d.lunch={kind:'auto'};});w.lunchPrep=days.length?{name:pick.name,dishId:pick.dishId||null,days}:null;days.forEach(i=>{w.days[i].lunch={kind:'prep',label:pick.name,src:'Sunday lunch prep'};});});},
  themeMenu:el=>openPop(el,'theme',{}),
  theme:el=>setTheme(el.dataset.id),
  help:()=>E.openHelp(),
  helpGo:el=>E.helpGo(el),
  fridge:()=>{closePop();S.modal={type:'fridge',err:''};renderModal(true);},
  printSheet:()=>{const w=getWeek(S.weekId);document.getElementById('print-area').innerHTML=sheetBody(w);window.print();},
  modalClose:()=>closeModal(),
  confirmYes:()=>{const m=S.modal;if(!m)return;m.done=true;closeModal();m.onYes&&m.onYes();},
  fileOpen:()=>E.openFile(),
  wzRerun:()=>E.startWizard(true),
  startOverAsk:()=>E.confirmBox({title:'Start over?',body:'This clears everything Eat At Home keeps in this browser and runs setup again. Files you’ve downloaded aren’t touched: you can open one again from the first step of setup.',yes:'Start over',danger:true,onYes:async()=>{await E.reset();E.startWizard(false);}}),
  fileDownload:()=>E.download(),
  undo:()=>E.undo(),
  redo:()=>E.redo(),
  dishNew:()=>openDishForm(null),
  dishEdit:el=>{const d=S.dishes[el.dataset.id];if(d)openDishForm(d);},
  mergeOpen:el=>{closePop();E.openMerge(el.dataset.id);},
  mergePick:el=>{const m=S.modal;const d=S.dishes[el.dataset.id];if(!m||!d)return;m.toId=d.id;m.vname=E.cleanVarName(S.dishes[m.fromId].name);renderModal(true);},
  mergeBack:()=>{const m=S.modal;if(!m)return;m.toId=null;m.focus='mg-q';renderModal();},
  mergeDo:()=>E.mergeDo(),
  dfVarAdd:()=>{const d=S.modal.draft;d.varRows=d.varRows||[];if(d.varRows.length>=E.MAX_VARIATIONS)return;d.varRows.push({id:null,name:''});renderModal();const f=document.getElementById('df-var-'+(d.varRows.length-1));f&&f.focus();},
  dfVarDel:el=>{const d=S.modal.draft;const k=+el.dataset.k;d.varRows.splice(k,1);renderModal();const n=document.getElementById('df-vdel-'+Math.min(k,d.varRows.length-1))||document.getElementById('df-var-add');n&&n.focus();},
  triedAdd:el=>{const o=triedLately()[+el.dataset.k];if(!o)return;const d=o.dish;openDishForm({name:d.name,cuisine:d.cuisine||cuisineList()[0]||'',effort:d.effort||'',useFor:['dinner'],leftovers:d.leftovers||'none',becomes:d.becomes||[],labels:d.labels||[],ratings:{},notes:''},{week:o.week,day:o.day,name:d.name});},
  cycleRate:el=>{const d=S.dishes[el.dataset.id];if(!d)return;const order=[null,'fav','fine','meh','no'];const nd=clone(d);nd.ratings=nd.ratings||{};const cur=nd.ratings[el.dataset.p]||null;nd.ratings[el.dataset.p]=order[(order.indexOf(cur)+1)%order.length];nd.updated=Date.now();saveDish(nd);render();},
  libFilter:el=>{S.libFilter=el.dataset.v;render();},
  personAsk:el=>{S.famConfirm=el.dataset.pid;render();const b=document.getElementById('pdel-yes');b&&b.focus();},
  personCancel:()=>{S.famConfirm=null;render();},
  personDel:el=>{const pid=el.dataset.pid;const ps=people().filter(p=>p.id!==pid);if(!ps.length)return;const gone=personById(pid);
    if(gone&&gone.isCook)ps[0].isCook=true;S.settings.people=ps;S.famConfirm=null;
    Object.values(S.dishes).forEach(d=>{if(d.ratings&&pid in d.ratings){const nd=clone(d);delete nd.ratings[pid];nd.updated=Date.now();S.dishes[nd.id]=nd;}});
    S.drafts={};saveSettings();render();toast('Removed '+(gone?gone.name:''));},
  // Dinner time (fridge sheet "start by") — Safari's time field has no clear button of its own.
  dinnerTimeClear:()=>{S.settings.cooking=Object.assign({},S.settings.cooking||{},{dinnerTime:''});saveSettings();render();const f=document.getElementById('ck-dinner');f&&f.focus();},
  ruleDel:el=>{S.settings.rules.splice(+el.dataset.k,1);saveSettings();render();},
  histToggle:el=>{const id=el.dataset.w,i=+el.dataset.i,m=el.dataset.m;const w=S.weeks[id];if(!w)return;const st=mealStatus(w,i,m);const next=st.v==='home'?'out':'home';
    mutateWeek(id,ww=>{const d=ww.days[i];d.eaten=d.eaten||{};d.eaten[m]=next;let derived='home';if(d.away)derived='out';else if(m==='l'&&d.lunch&&d.lunch.kind==='out')derived='out';else if(m==='d'&&d.dinner&&d.dinner.kind==='out')derived='out';if(next===derived)delete d.eaten[m];});},
  dfRate:el=>{const d=S.modal.draft;d.ratings=d.ratings||{};const v=el.dataset.v;d.ratings[el.dataset.p]=d.ratings[el.dataset.p]===v?null:v;refocus(modalLayer,()=>renderModal());},
  dfSave:()=>saveDishForm(),
  dfDelAsk:()=>{S.modal.confirmDel=true;renderModal();},
  dfDelCancel:()=>{S.modal.confirmDel=false;renderModal();},
  dfDelete:()=>{S.modal.noBack=true;const d=S.modal.draft;if(d.id)deleteDish(d.id);const n=d.name;closeModal();toast('Deleted '+n);render();}
};

document.addEventListener('click',e=>{
  const pi=e.target.closest('[data-pi]');
  if(pi&&popLayer.contains(pi)){const it=S.popItems[+pi.dataset.pi];if(it&&it.fn)it.fn();return;}
  // A button outside an open popover closes it first, then does its own thing (which may open another popover).
  const rerender=S.pop&&!popLayer.contains(e.target)&&e.target.closest('button,[data-act]')?dropPop():false;
  const el=e.target.closest('[data-act]');
  if(el&&A[el.dataset.act]){e.preventDefault();A[el.dataset.act](el,e);}
  else if(e.target===modalLayer)closeModal();
  if(rerender)render();
});
document.addEventListener('mousedown',e=>{if(S.pop&&!popLayer.contains(e.target)&&!e.target.closest('button,[data-act]'))closePop();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(S.pop){closePop();e.preventDefault();}else if(S.modal){closeModal();e.preventDefault();}}});
window.addEventListener('resize',()=>{if(S.pop)closePop();});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-popq]')){S.popQ=t.value;const l=document.getElementById('pop-list');if(l)l.innerHTML=popList();return;}
  const k=t.dataset.input;
  if(k==='notes')quietWeek(S.weekId,w=>{w.notes=t.value;});
  else if(k==='bk')quietWeek(S.weekId,w=>{setBreakfast(w,t.dataset.p,t.value);});
  else if(t.dataset.pinput){const p=personById(t.dataset.pid);if(p&&(t.dataset.pinput!=='name'||t.value.trim())){p[t.dataset.pinput]=t.dataset.pinput==='name'?t.value.trim().slice(0,40):t.value;changedSoon();}}
  else if(t.dataset.sinput){S.settings.cooking=Object.assign({cookTime:'',notes:''},S.settings.cooking||{});const sk=t.dataset.sinput;const key=sk==='cookTime'||sk==='dinnerTime'?sk:'notes';S.settings.cooking[key]=t.value;changedSoon();}
  else if(k==='sideQ'){S.sideQ=t.value;render();}
  else if(k==='libQ'){S.libQ=t.value;render();}
  const dk=t.dataset.dinput;if(dk&&S.modal&&t.value!=='__add'){S.modal.draft[dk]=t.value;}
  const rk=t.dataset.rinput;if(rk&&S.modal&&S.modal.draft&&S.modal.draft.srcRows&&t.value!=='__add'){const row=S.modal.draft.srcRows[+t.dataset.k];if(row)row[rk]=t.value;}
  if(t.id==='df-label'&&e.inputType==='insertReplacementText'){addPendingLabels(true);return;}
  if(t.matches('[data-edit]')&&S.modal&&S.modal.edit){S.modal.edit.value=t.value;}
  if(t.matches('[data-vinput]')&&S.modal&&S.modal.draft&&S.modal.draft.varRows){const v=S.modal.draft.varRows[+t.dataset.k];if(v)v.name=t.value;}
  if(t.matches('[data-mgq]')&&S.modal&&S.modal.type==='merge'){S.modal.q=t.value;E.mergeRefresh();}
  if(t.matches('[data-mgname]')&&S.modal&&S.modal.type==='merge'){S.modal.vname=t.value;t.size=Math.min(44,Math.max(16,t.value.length+2));E.mergeRefresh();}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.change==='genMode'){S.settings.genMode=t.value;saveSettings();render();return;}
  if(t.dataset.pchange){const p=personById(t.dataset.pid);if(!p)return;const k=t.dataset.pchange;
    if(k==='cook')people().forEach(x=>{x.isCook=x.id===p.id;});else p[k]=t.checked;
    S.drafts={};saveSettings();render();return;}
  if(t.dataset.pinput){render();return;}
  if(t.dataset.sinput==='dinnerTime'){render();return;}   // shows or hides Clear
  if(t.dataset.change==='loCount'||t.dataset.change==='loDay'){const ws=weekShape();S.settings.week=Object.assign({},S.settings.week||{},{leftovers:Object.assign({},ws.leftovers,{[t.dataset.change==='loCount'?'count':'day']:Number(t.value)})});S.drafts={};saveSettings();render();return;}
  if(t.dataset.change==='clearoutLunch'){S.settings.week=Object.assign({},S.settings.week||{},{clearoutLunch:t.value===''?null:Number(t.value)});S.drafts={};saveSettings();render();return;}
  if(t.dataset.change==='libLabel'){S.libLabel=t.value;render();return;}
  if(t.dataset.rinput==='book'&&t.value==='__add'&&S.modal){const k=+t.dataset.k||0;S.modal.draft.srcRows[k].addBook=true;renderModal();const n=document.getElementById('df-newbook'+(k?'-'+k:''));n&&n.focus();return;}
  if(t.id==='df-cui'&&t.value==='__add'&&S.modal){S.modal.addCuisine=true;renderModal();const n=document.getElementById('df-newcui');n&&n.focus();return;}
  if(S.modal&&S.modal.type==='dish'){const d=S.modal.draft;
    if(t.dataset.dinput&&t.value!=='__add'){d[t.dataset.dinput]=t.value;}
    if(t.dataset.rinput&&t.value!=='__add'&&d.srcRows&&d.srcRows[+t.dataset.k]){d.srcRows[+t.dataset.k][t.dataset.rinput]=t.value;}
    if(t.dataset.dcheck){const s=new Set(d.useFor||[]);t.checked?s.add(t.dataset.dcheck):s.delete(t.dataset.dcheck);d.useFor=['dinner','lunch'].filter(x=>s.has(x));}
    if(t.dataset.dradio){d.leftovers=t.value;renderModal();const f=document.getElementById(t.value==='transform'?'df-bec':'df-name');if(t.value==='transform'&&f)f.focus();}
  }
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button][data-act]')){e.preventDefault();e.target.click();return;}
  if(e.target.id==='df-label'){
    if(e.key==='Enter'||e.key===','){e.preventDefault();addPendingLabels(true);return;}
    if(e.key==='Backspace'&&!e.target.value&&S.modal&&S.modal.draft.labels&&S.modal.draft.labels.length){e.preventDefault();S.modal.draft.labels.pop();renderModal();const n=document.getElementById('df-label');n&&n.focus();return;}
  }
  if(e.target.id==='df-newcui'&&e.key==='Enter'){e.preventDefault();A.dfAddCuisine();return;}
  if(/^df-newbook(-\d+)?$/.test(e.target.id)&&e.key==='Enter'){e.preventDefault();A.dfAddBook(e.target);return;}
  if(e.key==='Enter'&&e.target.matches('[data-mgq]')){const first=document.querySelector('#mg-list [data-act=mergePick]');if(first){e.preventDefault();first.click();}return;}
  if(e.key==='Enter'&&e.target.matches('[data-popq]')){const first=popLayer.querySelector('[data-pi]');if(first){e.preventDefault();first.click();}}
});
document.addEventListener('submit',e=>{
  const f=e.target;e.preventDefault();
  if(f.dataset.form==='rule'){const inp=f.querySelector('input');const v=inp.value.trim();if(!v)return;S.settings.rules.push(v);saveSettings();inp.value='';render();const n=document.getElementById('rule-in');n&&n.focus();}
  if(f.dataset.form==='person'){const inp=f.querySelector('input');const v=inp.value.trim().replace(/\s+/g,' ').slice(0,40);if(!v)return;S.settings.people=people().concat(newPerson(v,people()));saveSettings();inp.value='';render();const n=document.getElementById('person-in');n&&n.focus();}
  if(f.dataset.form==='dish')saveDishForm();
  if(f.dataset.form==='listEdit')listSave();
  if(f.dataset.form==='merge')E.mergeDo();
  if(f.dataset.form==='newVer'&&S.pop&&S.pop.type==='newver'){const p=S.pop.data;const inp=f.querySelector('input');const v=E.cleanVarName(inp.value);
    const lib=S.dishes[p.id];const exists=lib&&E.variationsOf(lib).some(x=>x.name.toLowerCase()===v.toLowerCase());
    const err=!v?'Type a name for this version.':!exists&&lib&&E.variationsOf(lib).length>=E.MAX_VARIATIONS?'A dish can have up to '+E.MAX_VARIATIONS+' versions.':'';
    if(err){p.err=err;p.value=inp.value;renderPop(true);return;}
    closePop();E.addVariationAndPick(p.i,v);}
  if(f.dataset.form==='cookbook'){const inp=f.querySelector('input');const v=inp.value.trim().replace(/\s+/g,' ').slice(0,60);if(!v)return;if(E.cookbookList().some(c=>c.toLowerCase()===v.toLowerCase())){S.modal.err=v+' is already on the list.';renderModal();return;}S.settings.cookbooks=E.cookbookList().concat(v);saveSettings();S.modal.err='';renderModal();const n=document.getElementById('new-book');n&&n.focus();toast('Added '+v);}
  if(f.dataset.form==='cuisine'){const inp=f.querySelector('input');const v=inp.value.trim().replace(/\s+/g,' ').slice(0,40);if(!v)return;if(cuisineList().some(c=>c.toLowerCase()===v.toLowerCase())){S.modal.err=v+' is already on the list.';renderModal();return;}S.settings.cuisines=cuisineList().concat(v);saveSettings();S.modal.err='';renderModal();const n=document.getElementById('new-cui');n&&n.focus();toast('Added '+v);}
});

/* drag and drop */
// A recipe link inside a draggable card opens its page; pressing on it never starts a drag.
let linkDown=false,dragEndAt=0;
document.addEventListener('mousedown',e=>{linkDown=!!(e.target.closest&&e.target.closest('.src-link'));},true);
document.addEventListener('mouseup',()=>{linkDown=false;},true);
document.addEventListener('dragstart',e=>{
  if(linkDown||(e.target.closest&&e.target.closest('.src-link'))){e.preventDefault();linkDown=false;return;}
  const t=e.target.closest&&e.target.closest('[data-drag-day],[data-drag-idea],[data-drag-lib]');if(!t)return;
  if(t.dataset.dragDay!=null)S.drag={type:'day',i:+t.dataset.dragDay};else if(t.dataset.dragIdea!=null)S.drag={type:'idea',k:+t.dataset.dragIdea};else S.drag={type:'lib',id:t.dataset.dragLib};
  try{e.dataTransfer.setData('text/plain','dish');e.dataTransfer.effectAllowed='move';}catch(x){}
});
document.addEventListener('dragover',e=>{const c=e.target.closest&&e.target.closest('[data-drop]');if(!c||!S.drag)return;e.preventDefault();document.querySelectorAll('.dcell.over').forEach(x=>{if(x!==c)x.classList.remove('over');});c.classList.add('over');});
document.addEventListener('dragleave',e=>{const c=e.target.closest&&e.target.closest('[data-drop]');if(c&&!c.contains(e.relatedTarget))c.classList.remove('over');});
document.addEventListener('drop',e=>{dragEndAt=Date.now();const c=e.target.closest&&e.target.closest('[data-drop]');document.querySelectorAll('.dcell.over').forEach(x=>x.classList.remove('over'));if(!c||!S.drag)return;e.preventDefault();const i=+c.dataset.drop;const d=S.drag;S.drag=null;
  const w=getWeek(S.weekId);if(w.days[i].away){toast(DOWL[i]+' is marked away. Bring it back home first.');return;}
  if(d.type==='day')swapDays(d.i,i);else if(d.type==='idea')placeIdea(d.k,i);else placeLib(d.id,i);});
document.addEventListener('dragend',()=>{S.drag=null;dragEndAt=Date.now();document.querySelectorAll('.dcell.over').forEach(x=>x.classList.remove('over'));});

/* ---------- boot ---------- */
applyTheme(S.settings.theme);
render();
E.setTheme=setTheme;
Object.assign(A,E.wizardActions);
E.init().then(()=>{S.ready=true;if(!E.resumeWizard()&&!E.hasWorkingCopy())E.startWizard(false);else render();
  if(S.ai.status==='broken')E.confirmBox({title:'Can’t read app/config.js',body:S.ai.reason,yes:'OK',no:''});});
})();
