# Eat At Home

A weekly family dinner planner that runs in your browser. Tell it who eats, how you cook and the dinners you already make; it plans the week's dinners (and the lunches that come from the leftovers) and prints a one-page sheet for the fridge. Rate dishes as you go and the plan leans toward what everyone likes.

Claude is optional. With a Claude API key, Claude plans your weeks and suggests new dishes. Without one, Eat At Home picks dinners from your own library, favoring favorites and holding back dishes you've had recently.

It's a folder of plain HTML, CSS and JavaScript that you open from your computer. There's no server, no account, nothing to install and no build step.

## What you need

- A web browser: Safari or Chrome (the browsers it's tested in).
- Optional: a Claude API key from Anthropic, for AI planning.

## Set it up

1. Get the files: click **Code → Download ZIP** and unzip it somewhere you'll keep it (not your Downloads folder), or clone the repository.
2. Optional, for Claude:
   1. Get a key by following [Anthropic's guide](https://platform.claude.com/docs/en/get-api-key). The Claude Console shows a key only once, so paste it in right away.
   2. In the `app` folder, copy `config.example.js` and name the copy `config.js`.
   3. Open `app/config.js` in a plain-text editor and paste your key between the straight quotes after `anthropicApiKey:`. Curly quotes (“ ”) break the file: in TextEdit, choose **Format → Make Plain Text** first; on Windows, use Notepad.
   4. Save it.
3. Double-click **`Eat At Home.html`**. A short setup asks about your family, how you cook and the dinners you already make.

If `app/config.js` is missing, has a mistake in it, or has a key Claude turns down, the app says what to fix and keeps planning without Claude. **Settings** shows whether your key was found.

## Your data

- Everything you enter is saved **in your browser** as you go. Closing the tab loses nothing.
- **Download data file** (in the app bar, Settings, or Ctrl/Cmd+S) saves a copy, `eat-at-home-YYYY-MM-DD.json`. That's your backup, and how you move to another browser or computer (**Open data file…** in Settings). Download one regularly.
- Clearing your browser's site data, or switching browsers, starts you from scratch until you open your latest download. The `data` folder is a good place to keep downloads; git ignores everything in it.

## Updating to a new version

1. In the app, **download your data file** first.
2. Keep your `app/config.js` (copy it somewhere safe if you're replacing the folder).
3. Get the new version: `git pull` if you cloned it, or download the new ZIP and replace the old folder.
4. Put `app/config.js` back in the new `app` folder and open **`Eat At Home.html`**. If it opens to setup instead of your plan (for example, the folder moved), choose **Open my data file** and pick the file you just downloaded.

## Cost

Eat At Home is free. Claude is billed by Anthropic to your API account, prepaid on the Claude Console's Billing page and separate from any claude.ai subscription. Planning a week is one request of a few thousand tokens; see [Anthropic's pricing](https://platform.claude.com/docs/en/about-claude/pricing). In our testing, each Generate or Regenerate cost about 2–3 cents.

## Keep your key private

Your key lives only in `app/config.js` on your computer. It is never put in your data file or your browser's storage, and Eat At Home sends it only to Anthropic's API. Never share `app/config.js` or commit it: `.gitignore` leaves it out, so don't force-add it. If you give someone a copy of your folder, remove your key first.

## More

Inside the app, the **?** button (top right) opens the help. The [user guide](docs/README.md) covers the Plan page, the fridge sheet, leftovers nights, recipes, dish variations, undo and how it's built.

## License

[MIT](LICENSE)
