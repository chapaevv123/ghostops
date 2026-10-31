import {compareTime,sourceKey,sourcePriority,EvidenceLedger} from '../ledger/EvidenceLedger';
import type {Claim,Gap,TimelineEntry} from '../types';
export function reconstruct(claims:readonly Claim[],gaps:readonly Gap[],ledger:EvidenceLedger):TimelineEntry[]{
  const claimEntries:TimelineEntry[]=claims.map(claim=>{const items=claim.sources.map(x=>ledger.getByReference(x)).filter((x):x is NonNullable<typeof x>=>x!==undefined);const times=items.map(x=>x.timestamp).sort(compareTime);return {kind:'claim',claim,timestamp:times[0]??null};});
  const priority=(e:TimelineEntry)=>e.kind==='gap-marker'?4:sourcePriority[ledger.getByReference(e.claim.sources[0]!)?.sourceType??'log'];
  const comparator=(a:TimelineEntry,b:TimelineEntry)=>compareTime(a.kind==='claim'?a.timestamp:a.at,b.kind==='claim'?b.timestamp:b.at)||priority(a)-priority(b)||(a.kind==='claim'?a.claim.id:a.gap.id).localeCompare(b.kind==='claim'?b.claim.id:b.gap.id);
  const primary=claimEntries.filter(x=>x.kind==='claim'&&x.claim.classification!=='HYPOTHESIS');
  const markers:TimelineEntry[]=gaps.map(g=>({kind:'gap-marker',gap:g,at:g.timeWindow.start}));
  const hypotheses=claimEntries.filter(x=>x.kind==='claim'&&x.claim.classification==='HYPOTHESIS');
  return [...primary,...markers].sort(comparator).concat(hypotheses.sort(comparator));
}
