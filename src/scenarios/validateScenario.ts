import deployment from './scenario-deployment-outage.json';
import dependency from './scenario-dependency-conflict.json';
import resource from './scenario-resource-exhaustion.json';
import {EvidenceIngester} from '../ingester/Ingester';
import {runFullAnalysis} from '../engine/pipeline';
export const scenarios=[deployment,dependency,resource] as const;
export type Scenario=(typeof scenarios)[number];
export function loadScenario(s:Scenario){const ingester=new EvidenceIngester();const summaries=s.evidenceBundle.map(f=>ingester.ingestText(f));const ledger=ingester.getLedger();const analysis=runFullAnalysis(ledger);return {ingester,summaries,ledger,analysis};}
export function validateScenario(s:Scenario):{ok:boolean;differences:string[]}{
  const {analysis}=loadScenario(s);if(!analysis.ok)return {ok:false,differences:[analysis.error.message]};
  const a=analysis.value;const differences:string[]=[];
  if(JSON.stringify(a.claims)!==JSON.stringify(s.expectedClaims))differences.push('claims differ from expected full records');
  if(JSON.stringify(a.timeline)!==JSON.stringify(s.expectedTimeline))differences.push('timeline differs from expected full entries');
  if(JSON.stringify(a.gaps)!==JSON.stringify(s.expectedGaps))differences.push('gaps differ from expected full records');
  if(JSON.stringify(a.rootCauseNotice)!==JSON.stringify(s.expectedRootCauseNotice))differences.push('root cause notice differs');
  return {ok:differences.length===0,differences};
}
