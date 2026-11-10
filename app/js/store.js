(function(){
'use strict';
const E=window.EAH;
const {S,lsGet,lsSet,applyTheme,DEFAULT_CUISINES,MAX_VARIATIONS,VARIATION_MAX}=E;
/* ---------- data: browser working copy + downloaded data files ----------
   Every change goes to localStorage at once (the working copy): that's the live data.
   "Open data file…" reads a file with <input type=file>; "Download data file" saves a copy.
   Works the same in every browser (no File System Access API: Safari doesn't have it). */
const KEY='eah-working-copy',META='eah-file-meta';

function readJson(k){try{const s=localStorage.getItem(k);return s?JSON.parse(s):null;}catch(e){return null;}}
function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function removeKey(k){try{localStorage.removeItem(k);}catch(e){}}

// meta: rev counts changes; fileRev is the rev last downloaded (or opened from a file);
// downloadedAt is that date (YYYY-MM-DD).
const meta=(()=>{const m=readJson(META)||{};
  let at=typeof m.downloadedAt==='string'?m.downloadedAt:null;
  if(!at&&typeof m.lastModified==='number')at=E.ymd(new Date(m.lastModified));
  return {rev:Number(m.rev)||0,fileRev:Number(m.fileRev)||0,downloadedAt:at};})();
const saveMeta=()=>writeJson(META,meta);
const dirty=()=>meta.rev!==meta.fileRev;
function hasWorkingCopy(){return !!readJson(KEY);}

function dataObj(){
  return {settings:S.settings,
    dishes:Object.values(S.dishes).sort((a,b)=>a.name.localeCompare(b.name)),
    weeks:Object.values(S.weeks).sort((a,b)=>a.id.localeCompare(b.id))};
}
const FILE_VERSION=4;
function fileObj(){const d=dataObj();return {app:'eat-at-home',version:FILE_VERSION,savedAt:new Date().toISOString(),settings:d.settings,dishes:d.dishes,weeks:d.weeks};}
function fileText(){return JSON.stringify(fileObj(),null,2)+'\n';}

/* ---------- working copy ---------- */
let timer=null,warned=false;
function writeNow(){
  clearTimeout(timer);timer=null;
  if(writeJson(KEY,dataObj()))warned=false;
  else if(!warned){warned=true;E.toast('Couldn’t save to this browser’s storage. Download your data file to keep your changes.');}
}
function bump(){meta.rev++;saveMeta();updateStatus();}
// opts.undo===false: not an undo step (theme changes).
function changed(opts){record(opts&&opts.undo===false?'skip':'step');writeNow();bump();}
// Typing: written a moment later, and grouped into one undo step per field edit.
function changedSoon(){record('typing');clearTimeout(timer);timer=setTimeout(writeNow,700);bump();}

/* ---------- undo / redo ----------
   Snapshots, not inverses: base is the data (as JSON) after the last change. The first change
   in a turn of the event loop pushes base onto the undo stack, so an action that writes several
   times is still one step. Typing in the same field is one step until it loses focus or rests 1s.
   In memory only; Open, Start over and finishing setup clear both stacks. */
const UNDO_MAX=50,TYPE_GAP=1000;
let undoStack=[],redoStack=[],base=null,inTurn=false,typing=null;
const snapshot=()=>JSON.stringify(dataObj());
function settle(){inTurn=false;base=snapshot();}
function record(kind){
  if(base!==null&&!inTurn&&kind!=='skip'){
    const el=document.activeElement,now=Date.now();
    const same=kind==='typing'&&typing&&typing.el===el&&now-typing.at<TYPE_GAP;
    if(!same){undoStack.push(base);if(undoStack.length>UNDO_MAX)undoStack.shift();redoStack=[];}
  }
  typing=kind==='typing'?{el:document.activeElement,at:Date.now()}:null;
  if(!inTurn){inTurn=true;Promise.resolve().then(settle);}
}
document.addEventListener('focusout',()=>{typing=null;});
function clearHistory(){undoStack=[];redoStack=[];typing=null;inTurn=false;base=snapshot();updateUndo();}
const canUndo=()=>undoStack.length>0,canRedo=()=>redoStack.length>0;
// Something to focus again after the view is redrawn: its id, or its data-* attributes.
function focusKey(){
  const a=document.activeElement;if(!a||a===document.body||!document.body.contains(a))return null;
  if(a.id)return '#'+CSS.escape(a.id);
  const ds=Object.keys(a.dataset);if(!ds.length)return null;
  return a.tagName.toLowerCase()+ds.map(k=>'[data-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+'="'+CSS.escape(a.dataset[k])+'"]').join('');
}
function restore(json){
  const d=JSON.parse(json);d.settings.theme=S.settings.theme;   // theme isn't undoable
  load(d);writeNow();typing=null;base=snapshot();bump();
}
function step(from,to,msg){
  if(!from.length||!S.ready||S.view==='wizard'||S.modal)return false;
  const key=focusKey();
  if(timer)writeNow();
  to.push(snapshot());restore(from.pop());
  if(E.closePop&&S.pop)E.closePop();S.famConfirm=null;S.genMsg='';
  E.render();updateUndo();
  const el=key&&document.querySelector(key);
  if(el&&!el.disabled)el.focus({preventScroll:true});
  else if(key&&/^#(undo|redo)-btn$/.test(key)){const o=document.getElementById(key==='#undo-btn'?'redo-btn':'undo-btn');o&&!o.disabled&&o.focus();}
  E.toast(msg);return true;
}
function undo(){return step(undoStack,redoStack,'Undone');}
function redo(){return step(redoStack,undoStack,'Redone');}
function updateUndo(){
  const u=document.getElementById('undo-btn'),r=document.getElementById('redo-btn');if(!u||!r)return;
  u.disabled=!canUndo();r.disabled=!canRedo();
}
const NOT_TEXT=/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/;
function isTextField(t){if(!t||!t.closest)return false;
  if(t.closest('textarea,[contenteditable]:not([contenteditable="false"])'))return true;
  return t.tagName==='INPUT'&&!NOT_TEXT.test(t.type);}
const MAC=/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent||'');
function labelUndo(){
  const u=document.getElementById('undo-btn'),r=document.getElementById('redo-btn');if(!u||!r)return;
  const ul=MAC?'Undo (⌘Z)':'Undo (Ctrl+Z)',rl=MAC?'Redo (⇧⌘Z)':'Redo (Ctrl+Y)';
  u.title=ul;u.setAttribute('aria-label',ul);r.title=rl;r.setAttribute('aria-label',rl);
}
labelUndo();
document.addEventListener('keydown',e=>{
  if(!(e.metaKey||e.ctrlKey)||e.altKey)return;
  const k=e.key.toLowerCase();
  const isUndo=k==='z'&&!e.shiftKey,isRedo=(k==='z'&&e.shiftKey)||(k==='y'&&e.ctrlKey&&!e.metaKey&&!e.shiftKey);
  if(!isUndo&&!isRedo)return;
  if(isTextField(e.target))return;   // the field's own text undo
  if(!S.ready||S.view==='wizard'||S.modal)return;
  e.preventDefault();
  if(isUndo)undo();else redo();
});
window.addEventListener('pagehide',()=>{if(timer)writeNow();});

// settings.week.leftoversNight (a day or null) became leftovers {count 0–3, day 0–6}.
function migrateWeekShape(settings){
  const w=Object.assign({},settings.week||{});
  if(!w.leftovers||typeof w.leftovers!=='object'){const ln=w.leftoversNight;
    w.leftovers=ln===null?{count:0,day:3}:Number.isInteger(ln)&&ln>=0&&ln<=6?{count:1,day:ln}:{count:1,day:3};}
  delete w.leftoversNight;if(w.clearoutLunch===undefined)w.clearoutLunch=null;
  settings.week=w;
}
// dish.source (one recipe, before v3) became dish.sources (a list). Library dishes always have the list.
function migrateSources(o,always){if(!o||typeof o!=='object')return;
  if(!Array.isArray(o.sources)){if(o.source&&typeof o.source==='object')o.sources=[o.source];else if(always)o.sources=[];}
  delete o.source;}
// dish.variations (v4): library dishes always have the list; names trimmed, at most MAX_VARIATIONS.
function migrateVariations(d){const out=[];(Array.isArray(d.variations)?d.variations:[]).forEach(v=>{if(!v||typeof v!=='object')return;const n=String(v.name||'').trim().replace(/\s+/g,' ').slice(0,VARIATION_MAX);if(n&&out.length<MAX_VARIATIONS&&!out.some(x=>x.name.toLowerCase()===n.toLowerCase()))out.push({id:String(v.id||E.uid()),name:n});});d.variations=out;}
function load(data){
  S.settings=Object.assign({theme:'denim',genMode:'ai',rules:[]},data.settings||{});
  migrateWeekShape(S.settings);
  if(!Array.isArray(S.settings.cookbooks))S.settings.cookbooks=[];
  S.dishes={};(data.dishes||[]).forEach(d=>{if(d&&d.id){migrateSources(d,true);migrateVariations(d);S.dishes[d.id]=d;}});
  S.weeks={};(data.weeks||[]).forEach(w=>{if(w&&w.id){(w.days||[]).forEach(day=>{if(day&&day.dinner&&day.dinner.dish)migrateSources(day.dinner.dish,false);});(w.ideas||[]).forEach(x=>migrateSources(x,false));S.weeks[w.id]=w;}});
  S.drafts={};
  applyTheme(S.settings.theme);lsSet('eah-theme',S.settings.theme);
}

/* ---------- file format ---------- */
// v4: {app:"eat-at-home",version:4,savedAt,settings,dishes,weeks}. v4 dishes have variations[] and planned
// dinners may have a variationId (an older copy would drop both, so it refuses v4). v3 dishes have sources[]
// where v2 had one source (converted in load).
function migrate(raw){
  const settings=Object.assign({},raw.settings||{});
  if(!Array.isArray(settings.people)||!settings.people.length)throw new Error('That file is from an old version of Eat At Home that this version can’t open.');
  if(settings.cuisines===undefined)settings.cuisines=DEFAULT_CUISINES.slice();
  return {settings,dishes:raw.dishes,weeks:raw.weeks};
}
function parseFile(text){
  let raw;try{raw=JSON.parse(String(text).replace(/^﻿/,''));}catch(e){throw new Error('That file isn’t valid JSON.');}
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.dishes)||!Array.isArray(raw.weeks))throw new Error('That file isn’t an Eat At Home data file.');
  if(raw.app==='eat-at-home'&&Number(raw.version)>FILE_VERSION)throw new Error('That file was saved by a newer version of Eat At Home.');
  return migrate(raw);
}
// Replace everything with the file's contents; this browser now matches that file.
function adopt(data,lastModified){
  load(data);writeNow();
  meta.rev++;meta.fileRev=meta.rev;meta.downloadedAt=E.ymd(lastModified?new Date(lastModified):new Date());saveMeta();
  E.afterDataLoaded&&E.afterDataLoaded();clearHistory();
  updateStatus();E.render();
}

/* ---------- open / download ---------- */
function confirmReplace(go){
  if(hasWorkingCopy()&&dirty()&&Object.keys(S.dishes).length+Object.keys(S.weeks).length){
    E.confirmBox({title:'Open a data file?',body:'Opening a file replaces what’s in this browser, and some of your changes haven’t been downloaded yet.',yes:'Open anyway',danger:true,onYes:go});
  }else go();
}
function openFile(){confirmReplace(openInput);}
function openInput(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.style.display='none';document.body.appendChild(inp);
  inp.addEventListener('change',async()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f)return;
    try{const data=parseFile(await f.text());adopt(data,f.lastModified);E.toast('Opened '+f.name);}
    catch(e){E.toast(e.message||'Couldn’t open that file.');}});
  inp.click();
}
function fileName(){return 'eat-at-home-'+E.today()+'.json';}
function download(){
  if(timer)writeNow();
  const name=fileName();
  const url=URL.createObjectURL(new Blob([fileText()],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  meta.fileRev=meta.rev;meta.downloadedAt=E.today();saveMeta();updateStatus();E.toast('Downloaded '+name);
}

/* ---------- status in the app bar ---------- */
function statusInfo(){
  if(!meta.downloadedAt)return {text:'Not downloaded yet',btn:'Download',state:'none'};
  if(dirty())return {text:'Changes since your last download',btn:'Download',state:'dirty'};
  return {text:'Last downloaded '+E.fmtDate(meta.downloadedAt),btn:'',state:'saved'};
}
function updateStatus(){
  const el=document.getElementById('file-status');if(!el)return;
  const ub=document.getElementById('undo-btns');if(ub)ub.hidden=!S.ready||S.view==='wizard';
  updateUndo();
  if(!S.ready||S.view==='wizard'){el.hidden=true;return;}
  const s=statusInfo();el.hidden=false;
  el.innerHTML=`<span class="fs-text" role="status">${E.esc(s.text)}</span>${s.btn?`<button class="barbtn fs-btn" data-act="fileDownload">${s.btn}</button>`:''}`;
}

/* ---------- start / reset ---------- */
async function init(){
  const d=readJson(KEY);if(d)load(d);
  clearHistory();
  // Older versions kept a Chrome file handle here; it's no longer used.
  try{if(window.indexedDB)indexedDB.deleteDatabase('eat-at-home');}catch(e){}
}
async function reset(){
  clearTimeout(timer);removeKey(KEY);
  meta.rev=0;meta.fileRev=0;meta.downloadedAt=null;saveMeta();
  load({settings:{theme:S.settings.theme},dishes:[],weeks:[]});
  clearHistory();
}

document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(e.key==='s'||e.key==='S')){e.preventDefault();if(S.ready&&S.view!=='wizard'&&hasWorkingCopy())download();}});

Object.assign(E,{undo,redo,canUndo,canRedo,clearHistory,undoDepth:()=>[undoStack.length,redoStack.length],dataObj,fileObj,changed,changedSoon,load,init,reset,parseFile,adopt,openFile,download,updateStatus,statusInfo,hasWorkingCopy,
  fileMeta:()=>Object.assign({},meta,{dirty:dirty()})});
})();
