# Eat At Home: user guide

New here? Start with the [README](../README.md) for setup. This guide covers everything else.

Plan the family's week of home-cooked meals: dinner drives the week, leftovers become lunch on purpose, and the plan learns what everyone likes.

Eat At Home is a portable app. It's a folder of plain HTML, CSS and JavaScript that runs in your browser. There's no server, nothing to install and no build step.

## Open it

Double-click **`Eat At Home.html`** in the Eat At Home folder. It opens `app/index.html` in your browser. You can also open `app/index.html` directly or bookmark it.

The first time, a short setup runs:

1. **Welcome.** Set up a new household, or open the data file you already have (this skips the rest of setup).
2. **Family.** Everyone who eats dinner, with an optional note about each person for Claude ("vegetarian", "6, likes plain food"). Pick who cooks, who gets a planned lunch and who gets a breakfast line. Both default to just the cook.
3. **Cooking.** Cuisines you like, your typical weeknight cook time, cooking notes, how many leftovers nights a week (0–3) and the day they usually start on, and the clear-out lunch day (or none).
4. **Family rules.** Anything the planner should always follow, like "No shellfish". Optional.
5. **Starting dishes.** Type the dinners you already make and star the favorites. Fill in the details later in the Library. Optional.
6. **Claude key.** See below. Optional.
7. **Download a copy of your data.** Optional: your data lives in this browser, and the download is your backup (see below).

You can change all of this later on the **Family** page, or run setup again from **Settings** (your current answers are filled in, and nothing changes until you finish).

## The Plan page

The Plan page opens on this week (weeks start Sunday). The arrows move a week at a time; **Today** (shown only when you're on another week) jumps back.

- **Dinner cards are a glance:** the meal's name (a picked version's name, if there is one), the cook time, a short recipe line ("*Book* · *page*", "Meal kit" or "Internet recipe"; several recipes share the line) and a **New** badge for dishes you haven't made yet. Leftovers nights and eating-out cards are unchanged.
- **Click a dinner card** (anywhere but its buttons) for the meal's details: cuisine, cook time, labels, everyone's ratings, leftovers and what they become, notes, every version (the planned one marked) and every recipe in full, with links that open in a new tab. **Edit** opens the dish form and comes back to the details when you save. A new dish that isn't in your Library yet shows what's known, and Edit saves it there. Opening and closing the details changes nothing. Close with ×, Esc or a click outside.
- **Plan options** holds this week's notes for the planner, **Leftovers nights − / +**, new-recipe mode, labels to skip this week and the count of family rules applied (click it for the Family page). A dot on the button means this week has notes.
- **Other ideas** starts folded to one row with a count; click it to show the ideas and **More ideas**. This browser remembers whether you left it open.

## The fridge sheet

**Print** (top right) shows the week as it will print: one landscape page in black and white, meant to be read at a glance from across the kitchen.

- One column per day, Sunday to Saturday, with a **Lunch** row and a **Dinner** row.
- Lunch is just what lunch is: "Steak tacos", "Eat up the leftovers", "Lunch prep: …", or "Out".
- Dinner is the meal's name (a picked version's name, if there is one), its cook time, and the same short recipe line as the Plan card ("Family Cookbook · 150", "Meal kit", "Internet recipe"). Leftovers nights and nights out just say so.
- If you set a **Dinner time** (Family → Cooking), each dinner also says when to start: "1 hr · start by 5:00" for a 6:00 dinner ("2+ hr" counts as 2 hours; slow cooker and Instant Pot have no start time). Leave it empty for just the cook time. It's used only on the sheet; the planner never sees it.
- Under each dinner there's about 1.5 inches of blank space for notes, swaps or a gold star.
- Breakfasts and Sunday lunch prep are small bullets underneath. Nothing else is printed: no cuisines, labels, ratings, recipe labels, kit details, week notes or other ideas.

## Leftovers nights

A leftovers night is a night off from cooking to eat up what's in the fridge. New weeks start with the number you chose in setup (Family → Cooking), the first one on your usual day.

To change a week's count, use **Leftovers nights − / +** in **Plan options** on the Plan page:

- **+** adds one on the best open day: your usual day if the week has none yet; otherwise an empty day before one with a dinner planned, as far as possible from the other leftovers nights, preferring the later day. Sunday (nothing's been cooked yet) and the clear-out lunch day (the fridge is already empty) are used only when nothing else is free. If it lands on a planned dinner, that dish moves to Other ideas.
- **−** removes the latest one in the week; that night becomes an empty dinner that Generate fills.

Dragging a leftovers tile, or using a card's menu, changes the count too. Generate and Regenerate keep leftovers nights where they are.

## Where a recipe lives

A dish can point to its recipe: in a dish's **Recipe** field (Add or Edit dish), choose **Cookbook** and a page or section ("112", "Entrees section", or leave it blank), **Meal kit** for dishes that came in a meal-kit box (the kit's name, like "HelloFresh", and any notes, like "recipe card in the drawer" or "no longer sold"; both optional, and the name suggests kits you've used before), or **Link** and paste the web address (`https://` is added if you leave it off; only web links are accepted). Eat At Home keeps only the pointer, never the recipe.

A dish can have up to five recipes, for dinners made from more than one (say, orange chicken from one recipe and the fried rice from another). After you pick the first one, click **+ Add another recipe**. Each extra recipe can be a cookbook, meal kit or link, and has a remove **×**. With two or more, give each a short **Label** ("Chicken", "Rice") so you know which is which. Choosing **None** on the first recipe removes it and the next one moves up. Recipes you leave empty aren't saved.

- On the Plan page, a dinner card shows a short line: the book and page, "Meal kit" or "Internet recipe" (several recipes share the line: "Recipe binder · Entrees · Internet recipe"). Click the card for every recipe in full, with its label, kit notes and links that open in a new tab. Changing a dish's recipe in the Library updates every week that has it.
- The Library shows the same line under each dish name.
- The fridge sheet prints the same short line as the card.
- Manage cookbooks in **Library → Cuisines, labels & cookbooks**: add, rename (renaming to an existing cookbook merges the two) and delete ones no dish uses. Library search matches every recipe's label, cookbook, page, meal kit and notes (search "meal kit" to list them all).
- Claude never sees or invents recipe sources; dishes it suggests start with none.

## Variations: versions of a dish

A dish is the meal the family recognizes ("Chicken curry", "Tacos"). The versions you've made go under it as **variations**, so the Library doesn't fill up with near-duplicates. A variation is just a name, written as the whole meal ("Chicken curry with cauliflower + peas", "Fish tacos with mango salsa"), because wherever a planned dinner has a version picked, the version's name is shown instead of the dish's. Ratings, labels, notes and recipes stay on the dish.

- **Add, rename or remove** them in a dish's **Variations** section (Add or Edit dish): **+ Add a variation**, one box each, **×** to remove. Up to 12; empty boxes aren't saved. A dish with none works exactly as before.
- **Pick one for a dinner** from the card's **⋯** menu, under **Which version?**: *No particular version*, each variation, or **+ New version…** (type a name; it's added to the dish and picked). The card, the details view, the fridge sheet, History's tooltip and the lunch that comes from those leftovers all use the version's name; the details view also says which dish it's a version of. Deleting a variation that's planned just leaves the dish.
- **Claude** sees each dish's variation names and may pick one for a dinner (never invents one). It's also told to vary the kind of meal across the week, not just the cuisine. Picking by rating and manual planning don't pick versions. A dish counts as one dish for "recently had", favorites and repeats, whichever version you made.
- **Library**: a dish with variations shows "3 versions"; hover to see them or click to list them. Search matches variation names.
- **Merge into…** (under Edit on each Library row) turns a near-duplicate into a version of another dish. Pick the dish to merge into, then check the one sentence it shows: the version is named with the merged dish's full name (you can change it), and that's the name planned and past meals show. Merging moves every planned and past meal to the other dish with that version; the merged dish's own versions come along; the target keeps its ratings (people who hadn't rated it take the merged dish's rating), cuisine, effort and leftovers; labels, notes and recipes are combined (recipes up to five; it tells you which won't fit). Undo brings both dishes back.

## Claude key (optional)

With a Claude API key, Claude plans your weeks and suggests new dishes. Without one, Eat At Home still works: it picks dinners from your library at random, favoring favorites and holding back recent dishes.

1. Get a key by following **[Anthropic's guide](https://platform.claude.com/docs/en/get-api-key)**. The Claude Console shows a key **only once**, so paste it into `app/config.js` right away and keep it there. API use is prepaid on the Console's Billing page, separately from a claude.ai subscription.
2. In the Eat At Home folder, open the `app` folder. Copy `config.example.js` and name the copy `config.js`.
3. Open `app/config.js` in a plain-text editor and paste your key between the straight quotes (in TextEdit, choose Format → Make Plain Text first; on Windows, use Notepad):

   ```js
   window.EAH_CONFIG = {
     anthropicApiKey: "sk-ant-…",
     model: "claude-sonnet-5-5",
     workspaceId: ""   // only if your key isn't scoped to a workspace
   };
   ```

4. Save the file and reload Eat At Home.

**Settings** shows whether the key was found (or was rejected) and which model is in use. It never shows the key itself. If Claude turns a key down, the file or key is missing, or `app/config.js` has a mistake in it (curly quotes are the usual one), the app tells you what to fix in `app/config.js` and keeps planning by rating.

The key lives only in `app/config.js` on your computer. It is never put in your data file or the browser's storage. `app/config.js` is ignored by git.

Cost: a week's plan is one request of a few thousand tokens. See [pricing](https://platform.claude.com/docs/en/about-claude/pricing).

## Your data

Everything you enter is saved in **this browser** as you go (its local storage). That's the live copy: closing the tab or quitting the browser loses nothing.

A **data file** is a `.json` copy you download. It's your backup, and it's how you move your data to another browser or computer.

- **Download data file** (Settings → Your data, the app bar, or Ctrl/Cmd+S) saves `eat-at-home-YYYY-MM-DD.json` with today's date. Your browser puts it in Downloads; move it wherever you keep backups. The `data` folder next to the app is a good place (anything in there is ignored by git).
- **Open data file…** (Settings → Your data, or the first step of setup) replaces what's in this browser with the file. If you have changes you haven't downloaded, it asks first.
- The app bar shows "Last downloaded *date*", "Changes since your last download" (with a Download button) or "Not downloaded yet".

If you clear the browser's site data (or use a different browser), the browser copy is gone: open your latest download to get it back.

Data files from this version (with dish variations) can't be opened by an older copy of Eat At Home; it says the file is from a newer version rather than dropping them. This version opens older files.

### Undo and redo

The curved-arrow buttons in the app bar undo and redo changes to your data: plans (Generate, More ideas, leftovers nights, moves, locks, lunches, picking a version), the Library (dishes, variations, ratings, labels, cuisines and cookbooks, merging) and the Family page. Keyboard: Cmd+Z (Ctrl+Z) to undo, Cmd+Shift+Z (Ctrl+Shift+Z or Ctrl+Y) to redo. While you're typing in a field those keys undo your typing as usual; click outside the field first to undo the whole edit. Typing in one field counts as one step until you leave the field or pause for a second.

The last 50 steps are kept until you reload the page. Opening a data file, Start over and finishing setup clear them. Theme changes aren't undone.

**Start over** (Settings) clears what this browser keeps and runs setup again. It doesn't touch files you've downloaded.

## Browser support

- **Safari** (primary) and **Chrome** are the browsers it's tested in, and they work the same way: the data lives in the browser, with Open and Download for files.

Open it from disk (`file://`). Fonts load from Google Fonts when you're online and fall back to system fonts offline.

## Sharing with someone else

Download a data file and give it to them (for example, in a synced folder); they open it in their own copy of the app. Each browser keeps its own copy, so changes don't merge: pass the latest download back and forth, and only one person should make changes at a time.

Whoever has the app folder has the key in `app/config.js`. If you give someone your copy of the folder, either remove your key from `app/config.js` first or be happy for them to use it.

## How it's built

```
Eat At Home.html      launcher: redirects to app/index.html
app/
  index.html          the page; loads the scripts below in order
  config.example.js   template for config.js
  config.js           your Claude key (not in git)
  css/app.css
  js/*.js             classic scripts sharing one global, window.EAH
data/                 optional place for downloaded data files (ignored by git)
docs/                 this guide
README.md             getting started
LICENSE               MIT
```

Claude is called directly from the browser (Messages API, `anthropic-version: 2026-10-21`, with the `anthropic-dangerous-direct-browser-access` header), asking for JSON-only replies and parsing them leniently.
