import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';

const directory='.kiro/hooks';
const expected=new Map([
  ['ts-strict-check',['PostFileSave','src/ui/App.ts','npm.cmd run typecheck']],
  ['integrity-property-tests',['PostFileSave','src/engine/AnalysisEngine.ts','npm.cmd run test:property']],
  ['scenario-validation',['PostFileSave','src/scenarios/scenario-deployment-outage.json','npm.cmd run test:integration']],
  ['security-lint',['PostFileSave','src/ui/App.ts','node scripts/check-ui-security.mjs']],
  ['full-test-suite-before-shell',['PreToolUse','execute_pwsh','npm.cmd test']]
]);
let errors=0,seen=0;
for(const file of (await readdir(directory)).filter(name=>name.endsWith('.json')).sort()){
  const document=JSON.parse(await readFile(join(directory,file),'utf8'));
  const hook=document?.hooks?.[0],contract=expected.get(hook?.name);
  const valid=document.version==='v1'&&document.hooks.length===1&&contract&&hook.trigger===contract[0]
    &&hook.action?.type==='command'&&hook.action.command===contract[2]
    &&hook.enabled!==false&&Number(hook.timeout??60)>=10
    &&typeof hook.matcher==='string'&&new RegExp(hook.matcher).test(contract[1]);
  console.log(`${valid?'CONFIG VALID':'CONFIG INVALID'} ${file}: ${hook?.name??'missing name'}; ${hook?.trigger??'missing trigger'}; ${hook?.action?.command??'missing command'}`);
  if(!valid)errors++;if(contract)seen++;
}
if(seen!==expected.size)errors++;
console.log(`${seen}/${expected.size} expected hooks found; ${errors} configuration errors; runtime execution is not tested here.`);
if(errors)process.exitCode=1;
