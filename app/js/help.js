(function(){
'use strict';
const E=window.EAH;
const {S,I,esc}=E;
/* ---------- in-app help ----------
   The whole guide lives here as HTML, so it works offline from file:// (no fetch, no iframe).
   It's a modal like the others: opening and closing it changes no data.
   When a feature changes, update this and docs/README.md together. */
const KEY_URL='https://platform.claude.com/docs/en/get-api-key';
const PRICE_URL='https://platform.claude.com/docs/en/about-claude/pricing';
const ext=(href,text)=>`<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

const SECTIONS=[
['start','Getting started',`
<p>The first time you open Eat At Home, a short setup asks who eats at home, how you cook, any family rules and the dinners you already make. Everything is optional except at least one person, and you can change it all later on the <b>Family</b> page or with <b>Run setup again</b> in <b>Settings</b>.</p>
<h4>Adding a Claude key</h4>
<p>With a Claude API key, Claude plans your weeks and suggests new dishes. To add one:</p>
<ol>
<li>Get a key from Anthropic (it starts with <code>sk-ant-</code>). The Claude Console shows it only once, so paste it in right away.</li>
<li>In the Eat At Home folder, open the <b>app</b> folder. Copy <code>config.example.js</code> and name the copy <code>config.js</code>.</li>
<li>Open <code>app/config.js</code> in a <b>plain-text editor</b> and paste your key between the <b>straight quotes</b> after <code>anthropicApiKey:</code>. Curly quotes (“ ”) break the file: in TextEdit, choose <b>Format → Make Plain Text</b> first; on Windows, use Notepad.</li>
<li>Save the file and reload Eat At Home. <b>Settings</b> says whether the key was found.</li>
</ol>
<p>Your key stays in <code>app/config.js</code> on this computer. It’s never put in your data file, and it’s only sent to Anthropic. Don’t share that file.</p>
<h4>Without a key</h4>
<p>Everything works except Claude. <b>Generate week</b> picks dinners from your library at random, favoring favorites and holding back dishes you’ve had recently. You can also plan by hand: in <b>Settings → How weeks get planned</b>, choose <b>Claude plans it</b>, <b>Pick by rating</b> or <b>Manual</b>.</p>
<h4>Cost</h4>
<p>Eat At Home is free. Claude is billed by Anthropic to your API account (prepaid, separate from a claude.ai subscription). Each <b>Generate</b> or <b>Regenerate</b> costs about 2–3 cents.</p>
<p class="help-extra">Online extras: ${ext(KEY_URL,'Anthropic’s guide to getting a key')} · ${ext(PRICE_URL,'Claude pricing')}</p>`],

['plan','Planning a week',`
<p>The <b>Plan</b> page shows one week, Sunday to Saturday, with a lunch row over a dinner row. The arrows beside the title move a week at a time; <b>Today</b> (shown when you’re on another week) jumps back.</p>
<h4>Generate and Regenerate</h4>
<p><b>Generate week</b> fills the empty dinners. Once a week has dinners, the button says <b>Regenerate</b> and replaces them. Locked dinners, leftovers nights, eating-out nights and days marked away always stay put. <b>Stop</b> cancels a plan that’s still coming.</p>
<h4>Changing one dinner</h4>
<ul>
<li><b>+ Add dinner</b> on an empty day opens a list: ideas for this week, your library, or type a name to add a new dish. Leftovers night and Eating out are there too.</li>
<li>On a planned dinner, the <b>lock</b> keeps it through Regenerate, and the <b>swap</b> button opens the same list to pick something else.</li>
<li>The card’s <b>⋯</b> menu has <b>Rate this dish</b> (or <b>Add to library</b> for a new dish), <b>Make this the leftovers night</b>, <b>Eating out</b>, <b>Remove from this week</b> (it moves to Other ideas) and <b>Which version?</b> to pick a version of the dish or add a <b>+ New version…</b>.</li>
<li>The <b>⋯</b> beside a day’s name has <b>Away all day</b>, <b>Try a new recipe tonight</b> and <b>Clear this day</b>.</li>
<li><b>Drag</b> a dinner onto another day to swap the two days.</li>
</ul>
<h4>Meal details</h4>
<p>Click a dinner card (anywhere but its buttons) to see the meal: cuisine, cook time, labels, everyone’s ratings, leftovers, notes, versions and every recipe. <b>Edit</b> opens the dish. Looking changes nothing.</p>
<h4>Plan options</h4>
<p><b>Plan options</b> holds this week’s settings:</p>
<ul>
<li><b>Notes for this week</b> go to the planner (“something soupy, Thursday is busy”). A dot on the button means the week has notes.</li>
<li><b>Leftovers nights − / +</b>: a leftovers night is a night off to eat up what’s in the fridge. <b>+</b> puts one on the best open day; <b>−</b> removes the latest one.</li>
<li><b>New recipes</b>: <b>Library only</b>, <b>1–2 new</b> or <b>All new</b> (with Claude).</li>
<li><b>Skip this week</b>: leave out dishes with a label, like “grill”.</li>
<li>The count of <b>family rules applied</b> opens the <b>Family</b> page.</li>
</ul>
<h4>Other ideas</h4>
<p>Under the week, <b>Other ideas</b> holds dishes that didn’t make it onto a day. Click it to open the list; drag an idea onto a day or use its <b>+</b>. With Claude, <b>More ideas</b> asks for a few more. In <b>Manual</b> mode this row is your library instead, with a search box.</p>`],

['lunch','Lunches and breakfasts',`
<p>Lunch follows dinner: each day’s lunch is filled in from last night’s leftovers, as they are or turned into something else (set on each dish). The clear-out lunch day says “Eat up the leftovers”.</p>
<ul>
<li>Click a lunch, or <b>+ Add lunch</b>, to pick something else: last night’s leftovers, the lunch prep, quick favorites, or type anything. <b>Eat up the leftovers</b>, <b>Eating out</b> and <b>Back to automatic</b> are at the bottom.</li>
<li><b>Lunch prep</b> (above the week) is one dish made on Sunday for several lunches. Click <b>Add</b> or <b>Change</b>, choose the dish, pick the days and click <b>Apply</b>.</li>
<li><b>Breakfasts</b> are free-text lines above the week for each person with a breakfast line (set on the <b>Family</b> page). The cook’s says <b>My breakfast</b>.</li>
</ul>`],

['library','Library',`
<p>The <b>Library</b> is every dish your family eats. Dishes are reminders, not recipes: a name and a few details.</p>
<h4>Adding and editing</h4>
<p><b>Add dish</b> opens the dish form; <b>Edit</b> on a row changes one. The form has:</p>
<ul>
<li><b>Name</b>, <b>Cuisine</b> and <b>Effort</b> (the cook time).</li>
<li><b>Good for</b>: family dinner, lunch, or both.</li>
<li><b>Leftovers</b>: <b>Reheat as-is</b>, <b>Turn into another lunch</b> (say what it becomes) or <b>No planned leftovers</b>.</li>
<li><b>Labels</b>, like “grill” or “slow cooker”, so you can skip them some weeks. Press Enter after each.</li>
<li><b>Who likes it</b> and <b>Notes</b>.</li>
</ul>
<h4>Ratings</h4>
<p>Ratings are never required. <b>Favorite</b> dishes come up more often, <b>Meh</b> ones now and then, and anyone marked <b>Won’t eat</b> keeps a dish off family dinners (it can still be a lunch). In the list, click a person’s rating to cycle through them.</p>
<h4>Recipes</h4>
<p>A dish can say where its recipe lives: a <b>Cookbook</b> and page, a <b>Meal kit</b>, or a <b>Link</b>. Click <b>+ Add another recipe</b> for dinners made from more than one (up to five), and give each a short label. Manage cookbook names in <b>Cuisines, labels &amp; cookbooks</b>.</p>
<h4>Versions and Merge into…</h4>
<p>Versions are ways you’ve made a dish, named as the whole meal (“Chicken curry with cauliflower + peas”). Add them in the dish form under <b>Variations</b>, or from a dinner’s <b>⋯ → Which version?</b>. A picked version’s name shows on the plan and the fridge sheet; ratings stay on the dish.</p>
<p><b>Merge into…</b> (under <b>Edit</b>) turns a near-duplicate into a version of another dish. Every planned and past meal moves with it, and <b>Undo</b> brings both back.</p>
<h4>Finding dishes</h4>
<p>Search matches names, cuisines, labels, recipes and versions. The filters show <b>Family dinners</b>, <b>Lunches</b>, lunch-only dishes and dishes that <b>Need ratings</b>. <b>Tried lately</b> lists new dishes you’ve cooked so you can add the keepers.</p>`],

['family','Family',`
<p>The <b>Family</b> page holds what the planner knows about you.</p>
<ul>
<li><b>People</b>: everyone who eats dinner. The note for Claude is how you’d describe them to a friend cooking for you. Pick one <b>Cook</b>, and who gets a <b>Planned lunch</b> and a <b>Breakfast line</b>.</li>
<li><b>Cooking</b>: your typical weeknight cook time, cooking notes for Claude, how many leftovers nights new weeks start with and the day they usually fall on, and the clear-out lunch day.</li>
<li><b>Dinner time</b> (optional) is only used on the fridge sheet: each dinner says when to start, like “1 hr · start by 5:00” for a 6:00 dinner. Slow cooker and Instant Pot dishes don’t get a start time. Leave it empty to show just the cook time.</li>
<li><b>Standing rules</b> go to the planner every week (“No shellfish”).</li>
<li>Below that, each person’s favorites, meh dishes and won’t-eats.</li>
</ul>`],

['history','History',`
<p><b>History</b> shows past weeks and how many meals you ate at home in the last 30 days. Every meal counts as eaten at home unless you say otherwise: click a meal to switch it between <b>Home</b> and <b>Out</b>. Days you marked away count as out.</p>`],

['print','Printing the fridge sheet',`
<p><b>Print</b> (top right) shows the week as it will print: one landscape page in black and white, made to be read from across the kitchen. Click <b>Print</b> in the preview to print it.</p>
<ul>
<li>One column per day, with a <b>Lunch</b> row and a <b>Dinner</b> row.</li>
<li>Each dinner shows its name, cook time (and start time, if you set a dinner time) and where the recipe lives, with blank space underneath for notes.</li>
<li>Breakfasts and Sunday lunch prep are small lines at the bottom.</li>
</ul>
<p>If the gray cells print white, turn on <b>Print backgrounds</b> in the print dialog (Safari: click <b>Show Details</b>; Chrome: <b>More settings → Background graphics</b>).</p>`],

['data','Your data',`
<p>Everything you enter is saved <b>in this browser</b> as you go. Closing the tab or quitting loses nothing.</p>
<ul>
<li><b>Download data file</b> (in the app bar, <b>Settings</b>, or <b>⌘S</b> / <b>Ctrl+S</b>) saves a copy named with today’s date. That’s your backup: download one regularly. The app bar says when you have changes since your last download.</li>
<li><b>Open data file…</b> (in <b>Settings</b>, or the first step of setup) replaces what’s in this browser with a file. Use it to restore a backup or move to another browser or computer.</li>
<li><b>Before updating to a new version</b> of Eat At Home, download your data file and keep your <code>app/config.js</code>.</li>
<li><b>Start over</b> (Settings) clears this browser and runs setup again. Downloaded files aren’t touched.</li>
</ul>`],

['undo','Undo and redo',`
<p>The curved-arrow buttons in the app bar undo and redo changes to plans, the library and the Family page. Keyboard: <b>⌘Z</b> to undo and <b>⇧⌘Z</b> to redo (on Windows, <b>Ctrl+Z</b> and <b>Ctrl+Y</b>).</p>
<p>While you’re typing in a field, those keys undo your typing; click outside the field to undo the whole edit. The last 50 steps are kept until you reload. Theme changes aren’t undone.</p>`],

['faq','Questions',`
<h4>Generate isn’t using Claude</h4>
<p>Look at <b>Settings → How weeks get planned</b>: it says whether your key was found. The usual causes:</p>
<ul>
<li>No key yet: copy <code>app/config.example.js</code> to <code>app/config.js</code> and paste your key in (see Getting started).</li>
<li>Curly quotes: <code>app/config.js</code> was saved by TextEdit or Word. Open it in a plain-text editor, use straight quotes, save and reload.</li>
<li>The key was rejected (wrong, revoked or expired): paste a working key.</li>
<li>Your Anthropic account is out of credits: add credits on the Claude Console’s Billing page.</li>
<li><b>Pick by rating</b> or <b>Manual</b> is chosen in Settings.</li>
</ul>
<h4>Where did my data go?</h4>
<p>Your data lives in the browser, so clearing site data, using a different browser, or moving the Eat At Home folder can start you from scratch. Click <b>Open data file…</b> (Settings, or the first step of setup) and choose your latest download.</p>
<h4>A button is missing in Safari</h4>
<p>A content blocker may be hiding it. Turn it off for this page (Safari: <b>View → Reload Without Content Blockers</b>, or in the content blocker’s own settings) and reload.</p>
<h4>Gray cells print white</h4>
<p>Turn on <b>Print backgrounds</b> in the print dialog (in Chrome, <b>Background graphics</b>).</p>
<h4>My old file won’t open</h4>
<p>Files from the very first version of Eat At Home (the one that ran on a server) can’t be opened. A file saved by a newer version needs that newer version of the app.</p>`]
];

function helpHtml(){
  const toc=SECTIONS.map(([id,t],k)=>`<li><a href="#hs-${id}" data-act="helpGo" data-s="${id}">${k+1}. ${esc(t)}</a></li>`).join('');
  const body=SECTIONS.map(([id,t,h],k)=>`<section class="help-sec" aria-labelledby="hs-${id}"><h3 id="hs-${id}" tabindex="-1">${k+1}. ${esc(t)}</h3>${h}</section>`).join('');
  return `<div class="modal wide help-modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="modal-h"><h2 id="mh">Help</h2><button class="ibtn" id="help-x" data-act="modalClose" aria-label="Close help">${I.x}</button></div>
  <div class="help-body"><nav class="help-toc" aria-label="Help sections"><span class="eyebrow">Contents</span><ol>${toc}</ol></nav>
  <div class="help-main" id="help-main" tabindex="-1">${body}</div></div></div>`;
}
function openHelp(){E.closePop&&E.closePop();S.modal={type:'help'};E.renderModal(true);}
// Table of contents: scroll the section into view inside the panel and move focus to its heading.
function helpGo(el){const h=document.getElementById('hs-'+el.dataset.s);if(!h)return;
  h.scrollIntoView({block:'start'});h.focus({preventScroll:true});}

Object.assign(E,{helpHtml,openHelp,helpGo,HELP_SECTIONS:SECTIONS.map(s=>s[0])});
})();
