import type {EvidenceItem,Claim} from '../types';
import type {EvidenceLedger} from '../ledger/EvidenceLedger';
const short=(text:string,n=100)=>text.length>n?`${text.slice(0,n-1)}…`:text;
export function evidenceTitle(item:EvidenceItem):string{
  if(item.sourceType==='deployment'){const service=typeof item.fields.service==='string'?item.fields.service:'service',version=typeof item.fields.version==='string'?item.fields.version:'unknown';const event=item.fields.event;return event==='rollback'?`Rollback to ${version} recorded for ${service}.`:`Deployment ${version} ${String(event??'event')} recorded for ${service}.`;}
  if(item.sourceType==='ci'){const step=String(item.fields.step??'CI step'),status=String(item.fields.status??'reported');const dep=item.fields.dependency,version=item.fields.version;return `${step} ${status}${typeof dep==='string'?` · ${dep}@${String(version??'?')}`:''}.`;}
  if(item.sourceType==='git'){const commit=String(item.fields.commit??item.rawExcerpt.match(/commit ([0-9a-f]{40})/i)?.[1]??'unknown');return `Git commit ${commit.slice(0,10)} recorded.`;}
  const raw=item.rawExcerpt;if(/memory(?: usage)?\s*(?:=|:|at)?\s*(\d+)%/i.test(raw))return `Memory usage reached ${raw.match(/memory(?: usage)?\s*(?:=|:|at)?\s*(\d+)%/i)?.[1]}%.`;
  if(/\b503\b/.test(raw))return `HTTP 503 detected${service(raw)}.`;
  if(/\b(error|failed|timeout)\b/i.test(raw))return `${raw.match(/\b(error|failed|timeout)\b/i)?.[1]?.toUpperCase()} detected${service(raw)}: ${short(raw.replace(/^\S+\s*/,''),70)}.`;
  return short(raw.replace(/^\S+\s*/,''),90)||'Log record';
}
const service=(raw:string)=>{const name=raw.match(/service[=:]([\w-]+)/i)?.[1];return name?` in ${name}`:'';};
export function claimTitle(claim:Claim,ledger:EvidenceLedger):string{if(claim.ruleId==='DIRECT'){const item=ledger.getByReference(claim.sources[0]!);return item?evidenceTitle(item):'Source record unavailable';}return claim.text;}
