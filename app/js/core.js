(function(){
'use strict';
const E=window.EAH={};
/* ---------- constants ---------- */
const RATE=[['fav','Favorite'],['fine','Fine'],['meh','Meh'],['no',"Won't eat"]];
const RATE_LABEL={fav:'Favorite',fine:'Fine',meh:'Meh',no:"Won't eat"};
const DEFAULT_CUISINES=['American','Tex-Mex','Asian-American','Other'];
const EFFORTS=['15 min','30 min','45 min','1 hr','1.5 hr','2+ hr','Slow cooker','Instant Pot'];
// Variations: versions of a dish the family has made, each just a name.
const MAX_VARIATIONS=12,VARIATION_MAX=60;
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DARK_BAR={barText:'#FFFFFF',barBtnBorder:'rgba(255,255,255,.45)',barHover:'rgba(255,255,255,.12)',logoBg:'#FFFFFF',surface:'#FFFFFF',onPrimary:'#FFFFFF'};
const THEMES=[
 {id:'denim',name:'Denim',c1:'#3B5B8C',c2:'#E0C46F',v:Object.assign({},DARK_BAR,{ground:'#F3F5F9',bar:'#3B5B8C',barBorder:'#3B5B8C',barMuted:'#DCE4F0',pillBg:'#F2E3B3',pillText:'#4A3B12',logoFg:'#3B5B8C',line:'#D8DEE8',ink:'#1E2A3D',muted:'#4E5A6E',tagBg:'#EBEFF5',tagText:'#3D4A5E',accent:'#3B5B8C',newBg:'#F6EBC8',newText:'#5E4A14',newBorder:'#E0C46F',primary:'#3B5B8C',fav:'#B8862B',soft:'#EEF1F6',dash:'#A9B3C2'})},
 {id:'slate',name:'Slate & Wheat',c1:'#46566E',c2:'#D8BE7C',v:Object.assign({},DARK_BAR,{ground:'#F3F4F6',bar:'#46566E',barBorder:'#46566E',barMuted:'#DDE2E9',pillBg:'#EADFC0',pillText:'#4A3F22',logoFg:'#46566E',line:'#D9DDE3',ink:'#222A36',muted:'#4F5866',tagBg:'#ECEEF1',tagText:'#454E5C',accent:'#46566E',newBg:'#F2E7C9',newText:'#584516',newBorder:'#D8BE7C',primary:'#46566E',fav:'#A9822F',soft:'#EDEFF2',dash:'#AAB1BB'})},
 {id:'cobalt',name:'Cobalt',c1:'#2251CC',c2:'#F5C400',v:{ground:'#F5F7FC',surface:'#FFFFFF',bar:'#FFFFFF',barText:'#0E1B3D',barBorder:'#D9DFEE',barMuted:'#3A4566',barBtnBorder:'#C9D1E6',barHover:'#EEF1F8',pillBg:'#E4EBFB',pillText:'#2251CC',logoBg:'#2251CC',logoFg:'#FFFFFF',line:'#D9DFEE',ink:'#0E1B3D',muted:'#4A5470',tagBg:'#EEF1F8',tagText:'#3A4566',accent:'#2251CC',newBg:'#FFF3B0',newText:'#5C4A00',newBorder:'#F5C400',primary:'#2251CC',onPrimary:'#FFFFFF',fav:'#B88A00',soft:'#EEF1F8',dash:'#A8B2CC'}},
 {id:'plum',name:'Dusty Plum',c1:'#6E4A7E',c2:'#E2C774',v:Object.assign({},DARK_BAR,{ground:'#F7F4F8',bar:'#6E4A7E',barBorder:'#6E4A7E',barMuted:'#EADFEF',pillBg:'#F3DB8C',pillText:'#4A2E57',logoFg:'#6E4A7E',line:'#E6DCE9',ink:'#33213D',muted:'#5E4E68',tagBg:'#F1EBF3',tagText:'#5A4766',accent:'#6E4A7E',newBg:'#F8EBC0',newText:'#5C4A10',newBorder:'#E2C774',primary:'#6E4A7E',fav:'#B98A2A',soft:'#F1ECF3',dash:'#B9A9C0'})},
 {id:'indigo',name:'Indigo & Lilac',c1:'#3F3D8F',c2:'#EBCF5E',v:Object.assign({},DARK_BAR,{ground:'#F4F2FB',bar:'#3F3D8F',barBorder:'#3F3D8F',barMuted:'#DCDAF2',pillBg:'#E9E4FB',pillText:'#3F3D8F',logoFg:'#3F3D8F',line:'#E0DCF1',ink:'#24223F',muted:'#504D6E',tagBg:'#EEEBF8',tagText:'#4A4766',accent:'#5A4FB0',newBg:'#FFF1B8',newText:'#5C4A00',newBorder:'#EBCF5E',primary:'#3F3D8F',fav:'#B8901E',soft:'#EEEBF8',dash:'#ADA8CF'})},
 {id:'blackberry',name:'Blackberry & Honey',c1:'#4A3354',c2:'#E0B955',v:Object.assign({},DARK_BAR,{ground:'#F6F3F5',bar:'#4A3354',barBorder:'#4A3354',barMuted:'#E6DCE8',pillBg:'#E9C46A',pillText:'#3A2442',logoFg:'#4A3354',line:'#E3DAE1',ink:'#2B1E31',muted:'#5A4A60',tagBg:'#F0EAEE',tagText:'#54445A',accent:'#7A4E7E',newBg:'#F7E6B5',newText:'#5A4310',newBorder:'#E0B955',primary:'#4A3354',fav:'#B5872A',soft:'#F0EBEE',dash:'#B6A8B5'})}
];
const I={
 pencil:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
 grip:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/></svg>',
 star:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
 swap:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
 dots:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
 lock:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 unlock:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
 chev:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
 left:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
 right:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
 plus:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
 refresh:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>',
 spin:'<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
 home:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
 ext:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16L17 7M9 7h8v8"/></svg>',
 out:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6s1 4 3 4v8"/></svg>'
};

/* ---------- utils ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2]);};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d);};
const today=()=>ymd(new Date());
const weekOf=s=>{const d=parse(s);d.setDate(d.getDate()-d.getDay());return ymd(d);};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const fmtDate=s=>{const d=parse(s);return MON[d.getMonth()]+' '+d.getDate();};
// The Plan page opens on the current week (weeks start Sunday).
function defaultWeekId(){return weekOf(today());}
function fmtRange(id){const a=parse(id),b=parse(addDays(id,6));return a.getMonth()===b.getMonth()?MON[a.getMonth()]+' '+a.getDate()+' – '+b.getDate():MON[a.getMonth()]+' '+a.getDate()+' – '+MON[b.getMonth()]+' '+b.getDate();}
function dayLabel(id,i){return DOW[i]+' '+parse(addDays(id,i)).getDate();}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}

/* ---------- state ---------- */
const S={ai:null,sample:null,ready:false,
 dishes:{},weeks:{},drafts:{},settings:{theme:lsGet('eah-theme')||'denim',genMode:'ai',rules:[]},
 view:'plan',weekId:defaultWeekId(),sideQ:'',libQ:'',libFilter:'all',libLabel:'',
 busy:null,genMsg:'',pop:null,popQ:'',popItems:[],modal:null,drag:null};
const main=document.getElementById('main');
const popLayer=document.getElementById('pop-layer');
const modalLayer=document.getElementById('modal-layer');
/* ---------- theme ---------- */
function applyTheme(id){const t=THEMES.find(x=>x.id===id)||THEMES[0];const root=document.documentElement;Object.keys(t.v).forEach(k=>root.style.setProperty('--'+k,t.v[k]));}
/* ---------- toast ---------- */
let toastT;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},2600);}
Object.assign(E,{RATE,RATE_LABEL,DEFAULT_CUISINES,EFFORTS,MAX_VARIATIONS,VARIATION_MAX,DOW,DOWL,MON,DARK_BAR,THEMES,I,esc,uid,clone,pad,ymd,parse,addDays,today,weekOf,daysBetween,fmtDate,defaultWeekId,fmtRange,dayLabel,lsGet,lsSet,S,main,popLayer,modalLayer,applyTheme,toast});
})();
