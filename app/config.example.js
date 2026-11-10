// Eat At Home settings for Claude. This file is optional: without a key, Eat At Home
// still works and picks dinners from your library by rating.
//
// To turn on Claude:
// 1. Get a Claude API key from Anthropic (it starts with sk-ant-):
//      https://platform.claude.com/docs/en/get-api-key
//    API use is billed by Anthropic, separately from a claude.ai subscription.
// 2. Copy this file and name the copy config.js, in this same app folder.
// 3. Open config.js in a plain-text editor and paste your key between the straight
//    quotes below. Use straight quotes ("), not curly ones (“ ”): in TextEdit, choose
//    Format → Make Plain Text first; on Windows, use Notepad.
// 4. Save the file and reload Eat At Home.
//
// Keep your key private. config.js stays on your computer and is never put in your
// data file. Don't share config.js or commit it to git (.gitignore already leaves it out).
window.EAH_CONFIG = {
  anthropicApiKey: "",
  model: "claude-sonnet-5-5",
  // Only needed if your key isn't scoped to a workspace (the Console calls these wrkspc_...).
  workspaceId: ""
};
