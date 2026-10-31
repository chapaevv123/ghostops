import type {CandidateClaim,EvidenceItem} from '../types';
import {EvidenceLedger} from '../ledger/EvidenceLedger';
import {hypothesisCandidates} from '../hypotheses/HypothesisEngine';

const ms=(x:EvidenceItem)=>x.timestamp===null?NaN:Date.parse(x.timestamp);
const within=(a:EvidenceItem,b:EvidenceItem,minutes:number)=>Number.isFinite(ms(a))&&Number.isFinite(ms(b))&&ms(b)>=ms(a)&&ms(b)-ms(a)<=minutes*60_000;
const has=(x:EvidenceItem,re:RegExp)=>re.test(x.rawExcerpt);
const make=(ruleId:string,text:string,kind:CandidateClaim['kind'],sources:EvidenceItem[],isRootCause=false,missing?:string):CandidateClaim=>({ruleId,text,kind,isRootCause,candidateSources:sources.map(x=>x.source),missing});
const one=(a:readonly EvidenceItem[],b:readonly EvidenceItem[],minutes:number)=>{let j=0;for(const x of a){const xTime=ms(x);if(!Number.isFinite(xTime))continue;while(j<b.length&&ms(b[j]!)<xTime)j++;const y=b[j];if(y&&within(x,y,minutes))return [x,y] as const;}return null;};

// R-01: a deployment followed by an error is temporal evidence only; causal confirmation remains gated.
export function deploymentPrecedesOutage(l:EvidenceLedger):CandidateClaim[]{const pair=one(l.getBySourceType('deployment').filter(x=>has(x,/deploy/i)),l.getBySourceType('log').filter(x=>has(x,/error|outage|5\d\d/i)),15);if(!pair)return [];const causal=pair.some(x=>has(x,/caused by|root cause|due to|triggered by/i));return [make('R-01',causal?'An error followed a deployment, with a source diagnostic asserting a causal link.':'An error followed a deployment within 15 minutes; causality is unconfirmed.','inferred',[...pair],true,causal?undefined:'A rollback, config diff, or diagnostic trace linking the deployment to the error is missing.')];}
// R-02: failed CI followed by deployment within one hour is a two-source correlation.
export function ciFailurePrecedesDeployment(l:EvidenceLedger):CandidateClaim[]{const pair=one(l.getBySourceType('ci').filter(x=>has(x,/fail|error/i)),l.getBySourceType('deployment').filter(x=>has(x,/deploy/i)),60);return pair?[make('R-02','A failed CI step preceded a deployment within 60 minutes.','inferred',[...pair])]:[];}
// R-03: CI records naming the same dependency at different versions establish a version disagreement.
export function dependencyVersionConflict(l:EvidenceLedger):CandidateClaim[]{const seen=new Map<string,EvidenceItem>();for(const item of l.getBySourceType('ci')){const dep=item.fields.dependency,version=item.fields.version;if(typeof dep!=='string'||typeof version!=='string')continue;const first=seen.get(dep);if(first&&first.fields.version!==version)return [make('R-03',`CI records disagree on ${dep} versions (${first.fields.version} vs ${version}).`,'inferred',[first,item])];if(!first)seen.set(dep,item);}return [];}
// R-04: resource threshold before an error suggests a possible relation, never confirmed causation.
export function resourceExhaustionPattern(l:EvidenceLedger):CandidateClaim[]{const logs=l.getBySourceType('log');const high=logs.filter(x=>/(?:memory|disk)(?: usage)?\s*(?:=|:|at)?\s*(9\d|100)%/i.test(x.rawExcerpt));const pair=one(high,logs.filter(x=>has(x,/error|failed|outage/i)),15);return pair?[make('R-04','Resource usage exceeded 90% before an error; the causal link is unconfirmed.','inferred',[...pair],true,'Continuous resource telemetry and error diagnostics are missing.')]:[];}
// R-05: three service-labelled errors inside five minutes imply a cluster, not a proven cascade.
export function cascadingFailure(l:EvidenceLedger):CandidateClaim[]{const errors=l.getBySourceType('log').filter(x=>has(x,/error|failed/i));const queue:{item:EvidenceItem;service:string;time:number}[]=[];const counts=new Map<string,number>();let start=0;for(const item of errors){const time=ms(item),service=item.rawExcerpt.match(/service[=:]([\w-]+)/i)?.[1];if(!Number.isFinite(time)||!service)continue;while(start<queue.length&&time-queue[start]!.time>5*60_000){const old=queue[start++]!;const count=(counts.get(old.service)??1)-1;if(count)counts.set(old.service,count);else counts.delete(old.service);}queue.push({item,service,time});counts.set(service,(counts.get(service)??0)+1);if(counts.size>=3){const picked:EvidenceItem[]=[],distinct=new Set<string>();for(let i=start;i<queue.length&&picked.length<3;i++){const candidate=queue[i]!;if(!distinct.has(candidate.service)){distinct.add(candidate.service);picked.push(candidate.item);}}return [make('R-05','Errors occurred across three services within five minutes.','inferred',picked,false,'Distributed traces are missing, so propagation is unconfirmed.')];}if(start>1024&&start*2>queue.length){queue.splice(0,start);start=0;}}return [];}
// R-06: rollback is directly present in the deployment record.
export function rollbackDetected(l:EvidenceLedger):CandidateClaim[]{const d=l.getBySourceType('deployment');const rollback=d.find(x=>x.fields.event==='rollback');return rollback?[make('R-06',`Rollback recorded: ${rollback.rawExcerpt}`,'observed',[rollback])]:[];}
// R-07: commit before CI is a relation of two sources, therefore INFERRED despite design table.
export function gitCommitPrecedesCI(l:EvidenceLedger):CandidateClaim[]{const pair=one(l.getBySourceType('git'),l.getBySourceType('ci'),10);return pair?[make('R-07','A Git commit preceded a CI record by less than ten minutes.','inferred',[...pair])]:[];}
export const rules=[deploymentPrecedesOutage,ciFailurePrecedesDeployment,dependencyVersionConflict,resourceExhaustionPattern,cascadingFailure,rollbackDetected,gitCommitPrecedesCI] as const;
export function analyze(l:EvidenceLedger):CandidateClaim[]{
  const observed=l.items.map(x=>make('DIRECT',`Source record: ${x.rawExcerpt}`,'observed',[x]));
  return [...observed,...rules.flatMap(rule=>rule(l)),...hypothesisCandidates(l)];
}
