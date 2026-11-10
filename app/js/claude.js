(function(){
'use strict';
const E=window.EAH;
const {S}=E;
/* ---------- Claude (called straight from the browser) ---------- */
const API_VERSION='2026-10-21';
const KEY_GUIDE='https://platform.claude.com/docs/en/get-api-key';
const SYSTEM='You are the planning assistant inside a family meal-planning app. A program parses your reply: answer with only the JSON value requested, no prose and no code fences.';
const MSG={
  noFile:'No Claude key found. Copy app/config.example.js to app/config.js in the Eat At Home folder, open app/config.js, paste your key between the quotes, save it, and reload.',
  noKey:'No Claude key found. Open app/config.js in the Eat At Home folder, paste your key between the quotes, save it, and reload.',
  rejected:'Your Claude key was rejected (wrong, revoked or expired). Open app/config.js in the Eat At Home folder, paste a working key between the quotes, save it, and reload.',
  broken:'app/config.js has a mistake in it, so Eat At Home can’t read your Claude key. The usual cause is curly quotes (“ ”) around the key, which TextEdit and Word put in. Open app/config.js in a plain-text editor (in TextEdit, choose Format → Make Plain Text; on Windows, use Notepad), make sure the key is between straight quotes like "sk-ant-…", save it, and reload. Or copy app/config.example.js to app/config.js again and paste your key into the new copy.',
  odd:'The key in app/config.js doesn’t look like a Claude API key (they start with sk-ant-).'
};
// The key stays inside this closure: it is never put in S, the data file, the working copy or the console.
const cfg=(()=>{const c=window.EAH_CONFIG;const broken=!!c&&typeof c==='object'&&'broken' in c;const ok=!!c&&typeof c==='object'&&!broken;
  return {file:ok,broken,detail:broken&&c.broken!=='Script error.'?String(c.broken||''):'',key:ok?String(c.anthropicApiKey||'').trim():'',model:(ok&&String(c.model||'').trim())||'claude-sonnet-5-5',workspaceId:ok?String(c.workspaceId||'').trim():''};})();
S.ai={enabled:!!cfg.key,status:cfg.key?'found':cfg.broken?'broken':'missing',model:cfg.model,file:cfg.file||cfg.broken,
  reason:cfg.key?'':cfg.broken?MSG.broken+(cfg.detail?' (The browser said: '+cfg.detail+')':''):(cfg.file?MSG.noKey:MSG.noFile),warn:cfg.key&&!cfg.key.startsWith('sk-ant-')?MSG.odd:''};

function fail(code,message){return {code,message:message||''};}
function parseJsonLoose(text){
  const t=text.trim();
  try{return JSON.parse(t);}catch(e){}
  const fence=t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(fence){try{return JSON.parse(fence[1]);}catch(e){}}
  const a=t.search(/[[{]/),b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));
  if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
  throw fail('invalid_json','Claude’s reply wasn’t valid JSON.');
}
async function askClaude(prompt,signal){
  if(!cfg.key)throw fail('no_key',S.ai.reason);
  let res;
  try{
    res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal,headers:Object.assign({
      authorization:'Bearer '+cfg.key,
      'anthropic-version':API_VERSION,
      'content-type':'application/json',
      'anthropic-dangerous-direct-browser-access':'true'},cfg.workspaceId?{'anthropic-workspace-id':cfg.workspaceId}:{}),
      body:JSON.stringify({model:cfg.model,max_tokens:4096,system:SYSTEM,messages:[{role:'user',content:prompt}]})});
  }catch(e){
    if(e&&e.name==='AbortError')throw fail('cancelled','Cancelled.');
    throw fail('offline','Couldn’t reach the Claude API.');
  }
  if(!res.ok){
    const body=await res.json().catch(()=>({}));
    const msg=(body&&body.error&&body.error.message)||res.statusText;
    if(res.status===401||res.status===403){S.ai.status='rejected';S.ai.reason=MSG.rejected;throw fail('bad_key',msg);}
    if(/credit balance/i.test(msg))throw fail('no_credits',msg);
    if(/workspace/i.test(msg))throw fail('workspace',msg);
    if(res.status===404||(res.status===400&&/model/i.test(msg)))throw fail('bad_model',msg);
    if(res.status===429)throw fail('rate_limited',msg);
    throw fail('upstream_error',msg);
  }
  const data=await res.json().catch(()=>({}));
  const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
  if(!text.trim())throw fail('empty_completion','Claude returned no text.');
  return parseJsonLoose(text);
}
S.sample=cfg.key?{json:(p,o)=>askClaude(p,o&&o.signal)}:null;

Object.assign(E,{KEY_GUIDE,CLAUDE_MSG:MSG,askClaude});
})();
