import {EvidenceLedger} from '../ledger/EvidenceLedger';
import type {CandidateClaim,Claim,Gap,Result,SourceType,UnsupportedRootCauseNotice,VerifierError,VerifierOutput} from '../types';

const types:SourceType[]=['git','deployment','ci','log'];
const gap=(id:string,description:string,missingSourceType:Gap['missingSourceType'],start:string|null=null,affectedClaimId:string|null=null):Gap=>({id,description,missingSourceType,timeWindow:{start,end:start},affectedClaimId});
export function verify(candidates:readonly CandidateClaim[],ledger:EvidenceLedger):Result<VerifierOutput,VerifierError>{
  const gaps:Gap[]=[];const claims:Claim[]=[];let notice:UnsupportedRootCauseNotice|null=null;let rootSeen=false;
  for(const type of types)if(ledger.getBySourceType(type).length===0)gaps.push(gap(`missing-${type}`,`No ${type} source records were loaded.`,type));
  for(const item of ledger.items)if(item.timestamp===null)gaps.push(gap(`time-${item.id}`,`Timestamp could not be resolved for ${item.source.fileName}:${item.source.lineNumber}.`,'any',null,item.id));
  for(let i=0;i<candidates.length;i++){
    const c=candidates[i];if(!c)continue;
    if(c.candidateSources.length===0)return {ok:false,error:{kind:'unsupported-claim',message:`${c.ruleId}: no supporting source`}};
    const items=c.candidateSources.map(ref=>ledger.getByReference(ref));
    if(items.some(x=>!x))return {ok:false,error:{kind:'invalid-reference',message:`${c.ruleId}: source reference is absent from ledger`}};
    const support=items.filter((x):x is NonNullable<typeof x>=>x!==undefined);
    const id=`claim-${c.ruleId}-${support.map(x=>x.id).join('-')}`;
    const missing=c.missing?gap(`gap-${id}`,c.missing,'any',support[0]?.timestamp??null,id):null;
    if(missing)gaps.push(missing);
    const classification=c.kind==='observed'?'OBSERVED':c.kind==='inferred'&&support.length>=2?'INFERRED':'HYPOTHESIS';
    if(classification==='OBSERVED'&&!support.some(x=>c.text.includes(x.rawExcerpt)))return {ok:false,error:{kind:'unsupported-claim',message:`${c.ruleId}: direct text match absent`}};
    const confidenceScore=classification==='OBSERVED'?1:classification==='HYPOTHESIS'?Math.min(0.5,support.length/(support.length+gaps.length+1)):support.length/(support.length+gaps.length);
    const sources=[c.candidateSources[0]!,...c.candidateSources.slice(1)] as [typeof c.candidateSources[number],...typeof c.candidateSources[number][]];
    const claim:Claim={id,ruleId:c.ruleId,text:c.text,classification,confidenceScore,sources,isRootCause:c.isRootCause};
    if(c.isRootCause){
      if(rootSeen){claims.push({...claim,isRootCause:false,classification:'HYPOTHESIS',confidenceScore:Math.min(0.5,confidenceScore)});continue;}rootSeen=true;
      const distinct=new Set(support.map(x=>x.sourceType)).size;
      // Corroboration must include a causal diagnostic, not just temporal proximity.
      const causal=support.some(x=>/caused by|root cause|due to|triggered by/i.test(x.rawExcerpt));
      if(distinct<2||support.length<2||classification==='HYPOTHESIS'||!causal||missing){notice={candidateText:c.text,foundEvidence:sources,missingGaps:missing?[missing]:[gap(`causal-${id}`,'Independent causal diagnostic is missing.','any',support[0]?.timestamp??null,id)]};continue;}
    }
    claims.push(claim);
  }
  return {ok:true,value:{claims,rootCauseNotice:notice,gaps}};
}
