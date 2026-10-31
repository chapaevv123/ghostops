import {EvidenceLedger} from '../ledger/EvidenceLedger';
import type {AnalysisResult} from '../types';
import type {Hypothesis} from '../hypotheses/HypothesisEngine';
import {claimTitle,evidenceTitle} from '../ui/TimelineTitles';
export type GraphNodeType='EVIDENCE'|'OBSERVED'|'INFERRED'|'HYPOTHESIS'|'UNKNOWN';
export type GraphEdgeType='SUPPORTED_BY'|'TEMPORALLY_PRECEDES'|'CORRELATED_WITH'|'CONTRADICTS'|'REQUIRES_EVIDENCE'|'POSSIBLE_EXPLANATION';
export type GraphNode=Readonly<{id:string;type:GraphNodeType;label:string;evidenceId:string|null;x:number;y:number}>;
export type GraphEdge=Readonly<{id:string;from:string;to:string;type:GraphEdgeType;explanation:string}>;
export type InvestigationGraph=Readonly<{nodes:readonly GraphNode[];edges:readonly GraphEdge[];truncated:boolean}>;
const LIMIT_NODES=400,LIMIT_EDGES=1000;
// Keep enough context for the selected-node detail. The canvas wraps a shorter preview.
const short=(s:string,n=240)=>s.length>n?`${s.slice(0,n-1)}…`:s;
export function buildGraph(ledger:EvidenceLedger,result:AnalysisResult,hypotheses:readonly Hypothesis[]):InvestigationGraph{
  const nodes:GraphNode[]=[],edges:GraphEdge[]=[];let truncated=false;
  const addNode=(id:string,type:GraphNodeType,label:string,evidenceId:string|null,x:number,y:number)=>{if(nodes.length>=LIMIT_NODES){truncated=true;return false;}nodes.push({id,type,label:short(label),evidenceId,x,y});return true;};
  const addEdge=(from:string,to:string,type:GraphEdgeType,explanation:string)=>{if(edges.length>=LIMIT_EDGES){truncated=true;return;}if(nodes.some(n=>n.id===from)&&nodes.some(n=>n.id===to))edges.push({id:`edge-${edges.length}-${type}`,from,to,type,explanation});};
  ledger.items.slice(0,160).forEach((item,i)=>addNode(`e:${item.id}`,'EVIDENCE',`${item.source.fileName}:${item.source.lineNumber} ${evidenceTitle(item)}`,item.id,70,70+i*65));if(ledger.items.length>160)truncated=true;
  result.claims.filter(c=>c.classification!=='HYPOTHESIS').slice(0,100).forEach((claim,i)=>{const rollback=claim.ruleId==='R-06'?ledger.getByReference(claim.sources[0]!):null;const label=rollback?`Rollback record: ${evidenceTitle(rollback)}`:claimTitle(claim,ledger);if(!addNode(`c:${claim.id}`,claim.classification,label,null,420,70+i*80))return;const support=claim.sources.map(ref=>ledger.getByReference(ref)).filter((x):x is NonNullable<typeof x>=>x!==undefined);for(const item of support)addEdge(`c:${claim.id}`,`e:${item.id}`,'SUPPORTED_BY',`${claim.ruleId}: claim references ${item.source.fileName}:${item.source.lineNumber} at byte ${item.source.byteOffset}.`);if(claim.classification==='INFERRED'&&support.length>=2)addEdge(`e:${support[0]!.id}`,`e:${support[1]!.id}`,'CORRELATED_WITH',`${claim.ruleId}: these records match the documented correlation rule; this does not establish causation.`);});
  hypotheses.slice(0,70).forEach((hyp,i)=>{if(!addNode(`h:${hyp.id}`,'HYPOTHESIS',hyp.title,null,800,70+i*110))return;for(const evidenceId of hyp.supportingEvidenceIds){addEdge(`h:${hyp.id}`,`e:${evidenceId}`,'SUPPORTED_BY','This source matches the documented hypothesis pattern.');addEdge(`e:${evidenceId}`,`h:${hyp.id}`,'POSSIBLE_EXPLANATION','The source is consistent with this possible explanation; causation is not established.');}for(const evidenceId of hyp.contradictingEvidenceIds)addEdge(`h:${hyp.id}`,`e:${evidenceId}`,'CONTRADICTS','This source conflicts with the proposed explanation.');
    hyp.missingEvidence.forEach((missing,j)=>{const nodeId=`u:${hyp.id}:${j}`;if(addNode(nodeId,'UNKNOWN',missing,null,1160,70+i*110+j*48))addEdge(`h:${hyp.id}`,nodeId,'REQUIRES_EVIDENCE','This evidence is needed to evaluate the hypothesis.');});});
  const timed=ledger.items.filter(x=>x.timestamp!==null).slice(0,160).sort((a,b)=>a.timestamp!.localeCompare(b.timestamp!)||a.id.localeCompare(b.id));for(let i=1;i<timed.length;i++){const a=timed[i-1],b=timed[i];if(a&&b&&a.timestamp!<b.timestamp!)addEdge(`e:${a.id}`,`e:${b.id}`,'TEMPORALLY_PRECEDES',`${a.timestamp} precedes ${b.timestamp}; timing alone does not establish causation.`);}
  if(result.claims.length>100||hypotheses.length>70)truncated=true;
  return {nodes,edges,truncated};
}
