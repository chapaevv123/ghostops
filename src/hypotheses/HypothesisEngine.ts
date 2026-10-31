import {EvidenceLedger} from '../ledger/EvidenceLedger';
import type {CandidateClaim,EvidenceItem} from '../types';

export type HypothesisStatus='OPEN'|'SUPPORTED'|'CONTRADICTED'|'INSUFFICIENT_EVIDENCE';
export type ConfidenceCategory='LOW'|'MODERATE'|'HIGH';
export type Hypothesis=Readonly<{id:string;title:string;explanation:string;supportingEvidenceIds:readonly string[];contradictingEvidenceIds:readonly string[];missingEvidence:readonly string[];verificationSteps:readonly string[];confidenceCategory:ConfidenceCategory;status:HypothesisStatus}>;
const match=(x:EvidenceItem,re:RegExp)=>re.test(x.rawExcerpt);
const unique=(xs:readonly EvidenceItem[])=>[...new Map(xs.map(x=>[x.id,x])).values()];
const make=(id:string,title:string,explanation:string,support:readonly EvidenceItem[],contradict:readonly EvidenceItem[],missing:readonly string[],steps:readonly string[]):Hypothesis=>{
  const s=unique(support),c=unique(contradict);
  const status:HypothesisStatus=c.length?'CONTRADICTED':s.length>=2&&missing.length===0?'SUPPORTED':s.length?'INSUFFICIENT_EVIDENCE':'OPEN';
  return {id,title,explanation,supportingEvidenceIds:s.map(x=>x.id),contradictingEvidenceIds:c.map(x=>x.id),missingEvidence:missing,verificationSteps:steps,confidenceCategory:status==='SUPPORTED'?'MODERATE':'LOW',status};
};
export function generateHypotheses(ledger:EvidenceLedger):Hypothesis[]{
  const out:Hypothesis[]=[];const logs=ledger.getBySourceType('log'),ci=ledger.getBySourceType('ci'),deploy=ledger.getBySourceType('deployment');
  const errors=logs.filter(x=>match(x,/error|5\d\d|failed|timeout/i));const deployed=deploy.find(x=>x.fields.event==='deploy');
  const error=deployed?.timestamp?errors.find(x=>x.timestamp&&x.timestamp>=deployed.timestamp!):undefined;
  if(deployed&&error){const prior=logs.filter(x=>x.timestamp&&deployed.timestamp&&x.timestamp<deployed.timestamp&&match(x,/error|failed|outage/i));out.push(make('hyp-deployment-regression','Regression after deployment','A deployment preceded a reported failure. This is a temporal clue, not a proven cause.',[deployed,error],prior,['Diagnostic trace linking the release to the failure','Pre/post deployment comparison'],['Compare error rate before and after deployment','Inspect changed configuration and rollback outcome']));
    if(match(error,/upstream|gateway|network/i))out.push(make('hyp-upstream-outage','Independent upstream outage','The error record mentions an upstream or network component that may have failed independently.',[error],logs.filter(x=>match(x,/upstream (?:healthy|available)|network healthy/i)),['Upstream service health and request traces'],['Check upstream incident window','Compare other clients of the upstream service']));
    if(deploy.some(x=>match(x,/config|environment|env var/i)))out.push(make('hyp-environment-config','Configuration or environment issue','Deployment metadata mentions configuration or environment changes.',deploy.filter(x=>match(x,/config|environment|env var/i)),[],['Configuration diff and runtime environment snapshot'],['Compare effective configuration before and after deployment']));
  }
  const versions=ci.filter(x=>typeof x.fields.dependency==='string'&&typeof x.fields.version==='string');
  const firstVersion=new Map<string,EvidenceItem>(),reported=new Set<string>();
  for(const item of versions){const dependency=String(item.fields.dependency);const first=firstVersion.get(dependency);if(!first){firstVersion.set(dependency,item);continue;}if(first.fields.version===item.fields.version||reported.has(dependency))continue;reported.add(dependency);out.push(make(`hyp-dependency-${dependency}`,'Incompatible dependency versions',`CI records disagree on ${dependency} versions.`,[first,item],[],['Resolved dependency tree and lockfile diff'],['Compare lockfile across CI jobs','Reproduce installation with the same toolchain']));}
  const lock=ci.find(x=>match(x,/lockfile|npm ci|yarn install|pnpm install/i));if(lock&&versions.length)out.push(make('hyp-install-variance','Inconsistent installation or lockfile','CI records mention an install or lockfile step alongside versioned dependencies.',[lock,...versions.slice(0,1)],[],['Lockfile hash and package manager version'],['Compare install commands and lockfile hashes between jobs']));
  const ciFailure=ci.find(x=>match(x,/fail|error/i));if(ciFailure&&versions.length===0)out.push(make('hyp-unrelated-ci','Unrelated CI failure','A CI step failed without dependency-version evidence in the imported records.',[ciFailure],[],['Full CI step output'],['Inspect the first failing command and its stderr']));
  const pressure=logs.find(x=>match(x,/(?:memory|disk)(?: usage)?\s*(?:=|:|at)?\s*(9\d|100)%/i));const pressureError=pressure?.timestamp?errors.find(x=>x.timestamp&&x.timestamp>=pressure.timestamp!):undefined;if(pressure&&pressureError)out.push(make('hyp-resource-pressure','Resource pressure','A high resource reading preceded a failure record.',[pressure,pressureError],[],['Continuous resource metrics and process-level diagnostics'],['Correlate pressure with process OOM or disk errors','Check recovery after resource relief']));
  const external=logs.find(x=>match(x,/upstream|external service|gateway/i));if(external&&pressure)out.push(make('hyp-external-degradation','External service degradation','An upstream-related record and resource pressure occur in the imported evidence; their relationship is unknown.',[external],[],['External service health and distributed traces'],['Compare failure rates from another client of the external service']));
  const queue=logs.find(x=>match(x,/queue|backlog|workload spike/i));if(queue&&pressure)out.push(make('hyp-workload-spike','Workload or queue accumulation','A queue or backlog record accompanies resource pressure.',[queue,pressure],[],['Request volume and queue depth time series'],['Compare ingress rate with worker capacity','Inspect retry amplification']));
  return out;
}
export function hypothesisCandidates(ledger:EvidenceLedger):CandidateClaim[]{return generateHypotheses(ledger).map(h=>({ruleId:h.id,text:`Possible explanation: ${h.title}. ${h.explanation}`,kind:'hypothesis',isRootCause:false,candidateSources:h.supportingEvidenceIds.map(id=>ledger.getById(id)!.source),missing:h.missingEvidence.join('; ')}));}
