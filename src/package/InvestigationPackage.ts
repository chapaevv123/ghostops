import {safeJson} from '../ingester/Ingester';
import {EvidenceIngester} from '../ingester/Ingester';
import {runFullAnalysis} from '../engine/pipeline';
import {generateHypotheses} from '../hypotheses/HypothesisEngine';
import {buildGraph} from '../graph/InvestigationGraph';
import {checkIntegrity} from '../integrity/IntegrityCheck';
import {canonicalJson} from '../integrity/canonicalJson';
import {payloadDigest,sha256,type Investigation,type InvestigationHead,type InvestigationPayload} from '../workspace/model';
import type {Result} from '../types';

export type PackageError=Readonly<{kind:'invalid-json'|'invalid-schema'|'tampered'|'incomplete';message:string}>;
const fail=(kind:PackageError['kind'],message:string):Result<never,PackageError>=>({ok:false,error:{kind,message}});
export async function exportInvestigationPackage(investigation:Investigation):Promise<string>{
  const ingester=new EvidenceIngester();for(const file of investigation.payload.files){const r=ingester.ingestText(file);if(!r.ok)throw new Error(r.error.message);}
  const ledger=ingester.getLedger(),analysis=runFullAnalysis(ledger);if(!analysis.ok)throw new Error(analysis.error.message);const hypotheses=generateHypotheses(ledger),graph=buildGraph(ledger,analysis.value,hypotheses);
  const body={format:'ghostops-investigation' as const,packageVersion:2 as const,metadata:investigation.head,payload:investigation.payload,analysis,hypotheses,graph};
  return JSON.stringify({...body,packageHash:await sha256(canonicalJson(body))});
}
export async function inspectInvestigationPackage(text:string):Promise<Result<Investigation,PackageError>>{
  if(new TextEncoder().encode(text).length>120*1024*1024)return fail('invalid-schema','Package exceeds 120 MB limit');
  let raw:unknown;try{raw=safeJson(text);}catch(e){return fail('invalid-json',e instanceof Error?e.message:String(e));}
  if(typeof raw!=='object'||raw===null||Array.isArray(raw))return fail('invalid-schema','Package root is not an object');const p=raw as Record<string,unknown>;
  if(p.format!=='ghostops-investigation'||p.packageVersion!==2||typeof p.packageHash!=='string'||typeof p.metadata!=='object'||p.metadata===null||typeof p.payload!=='object'||p.payload===null)return fail('invalid-schema','Unsupported or incomplete package version');
  const body={format:p.format,packageVersion:p.packageVersion,metadata:p.metadata,payload:p.payload,analysis:p.analysis,hypotheses:p.hypotheses,graph:p.graph};
  let canonicalHash:string,legacyHash:string;
  try{canonicalHash=await sha256(canonicalJson(body));legacyHash=await sha256(JSON.stringify(body));}catch{return fail('invalid-schema','Package structure exceeds safe JSON depth');}
  if(p.packageHash!==canonicalHash&&p.packageHash!==legacyHash)return fail('tampered','Package hash does not match its contents');
  const metadata=p.metadata as InvestigationHead,payload=p.payload as InvestigationPayload;
  if(metadata.schemaVersion!==2||payload.schemaVersion!==2||!Array.isArray(payload.files)||!Array.isArray(payload.entries)||!Array.isArray(payload.history)||!Array.isArray(payload.summaries))return fail('invalid-schema','Invalid investigation schema');
  if(typeof metadata.id!=='string'||typeof metadata.title!=='string'||typeof metadata.evidenceCount!=='number'||typeof metadata.claimCount!=='number'||typeof metadata.unknownCount!=='number'||payload.files.some(f=>typeof f!=='object'||f===null||typeof f.name!=='string'||typeof f.text!=='string'||typeof f.sha256!=='string'||typeof f.sourceId!=='string'||typeof f.itemsProduced!=='number'))return fail('invalid-schema','Invalid metadata or source-file manifest');
  if(payload.files.some(f=>new TextEncoder().encode(f.text).length>50*1024*1024))return fail('invalid-schema','Source file exceeds 50 MB');
  if(await payloadDigest(payload)!==metadata.digest&&await sha256(JSON.stringify(payload))!==metadata.digest)return fail('tampered','Payload digest mismatch');
  const investigation={head:metadata,payload};let report;try{report=await checkIntegrity(investigation);}catch{return fail('invalid-schema','Package could not be replayed');}if(report.status==='FAIL')return fail('tampered',report.findings.filter(x=>x.status==='FAIL').map(x=>x.check).join(', '));
  const ingester=new EvidenceIngester();for(const file of payload.files){const r=ingester.ingestText(file);if(!r.ok)return fail('invalid-schema',r.error.message);}const ledger=ingester.getLedger(),analysis=runFullAnalysis(ledger);if(!analysis.ok)return fail('invalid-schema',analysis.error.message);const hypotheses=generateHypotheses(ledger),graph=buildGraph(ledger,analysis.value,hypotheses);
  try{if(canonicalJson(analysis)!==canonicalJson(p.analysis)||canonicalJson(hypotheses)!==canonicalJson(p.hypotheses)||canonicalJson(graph)!==canonicalJson(p.graph))return fail('tampered','Analysis, hypotheses, or graph differ from deterministic replay');}catch{return fail('invalid-schema','Package analysis has an invalid JSON structure');}
  return {ok:true,value:investigation};
}
