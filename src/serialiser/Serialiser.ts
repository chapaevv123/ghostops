import {EvidenceLedger} from '../ledger/EvidenceLedger';
import {safeJson} from '../ingester/Ingester';
import {runFullAnalysis} from '../engine/pipeline';
import type {AnalysisResult,DeserialiseError,InputFile,Result} from '../types';
type Session={schemaVersion:1;files:readonly InputFile[];ledger:readonly import('../types').EvidenceItem[];result:AnalysisResult;ledgerHash:string};
const digest=async(value:string):Promise<string>=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const invalid=(kind:DeserialiseError['kind'],message:string):Result<never,DeserialiseError>=>({ok:false,error:{kind,message}});
export async function serialise(ledger:EvidenceLedger,result:AnalysisResult,files:readonly InputFile[]):Promise<string>{
  const body={schemaVersion:1 as const,files,ledger:ledger.items,result};
  const ledgerHash=await digest(JSON.stringify({files,ledger:ledger.items}));
  return JSON.stringify({...body,ledgerHash});
}
export async function deserialise(json:string):Promise<Result<{ledger:EvidenceLedger;result:AnalysisResult;files:readonly InputFile[]},DeserialiseError>>{
  let parsed:unknown;try{parsed=safeJson(json);}catch(e){return invalid('invalid-json',e instanceof Error?e.message:String(e));}
  if(typeof parsed!=='object'||parsed===null||Array.isArray(parsed))return invalid('invalid-schema','Session root must be an object');
  const p=parsed as Record<string,unknown>;
  if(p.schemaVersion!==1||!Array.isArray(p.files)||!Array.isArray(p.ledger)||typeof p.ledgerHash!=='string'||typeof p.result!=='object'||p.result===null)return invalid('invalid-schema','Unsupported or incomplete session schema');
  const hash=await digest(JSON.stringify({files:p.files,ledger:p.ledger}));if(hash!==p.ledgerHash)return invalid('tampered','Evidence or source files differ from the recorded SHA-256 digest');
  const files=p.files as unknown[];const items=p.ledger as unknown[];
  if(!files.every(f=>typeof f==='object'&&f!==null&&typeof (f as InputFile).name==='string'&&typeof (f as InputFile).text==='string')||!items.every(x=>typeof x==='object'&&x!==null&&typeof (x as import('../types').EvidenceItem).id==='string'&&typeof (x as import('../types').EvidenceItem).rawExcerpt==='string'))return invalid('invalid-schema','Invalid file or evidence item');
  const typedFiles=files as InputFile[];const typedItems=items as import('../types').EvidenceItem[];
  for(const f of typedFiles)if(new TextEncoder().encode(f.text).length>50*1024*1024)return invalid('invalid-schema','Source file exceeds 50 MB');
  for(const item of typedItems){const file=typedFiles.find(f=>f.name===item.source?.fileName);if(!file||!Number.isInteger(item.source.lineNumber)||item.source.lineNumber<1||!Number.isInteger(item.source.byteOffset)||item.source.byteOffset<0)return invalid('invalid-schema','Invalid source reference');const bytes=new TextEncoder().encode(file.text),excerpt=new TextEncoder().encode(item.rawExcerpt);if(item.source.byteOffset+excerpt.length>bytes.length||!excerpt.every((b,i)=>bytes[item.source.byteOffset+i]===b))return invalid('invalid-schema','Evidence excerpt does not match the source offset');}
  let ledger:EvidenceLedger;try{ledger=new EvidenceLedger(typedItems);}catch{return invalid('invalid-schema','Invalid ledger identity');}
  const result=p.result as AnalysisResult;
  if(!Array.isArray(result.claims)||!Array.isArray(result.gaps)||!Array.isArray(result.timeline)||result.claims.some((c:import('../types').Claim)=>!Array.isArray(c.sources)||c.sources.some((s:import('../types').SourceReference)=>!ledger.getByReference(s))))return invalid('invalid-schema','Invalid analysis references');
  const replay=runFullAnalysis(ledger);if(!replay.ok||JSON.stringify(replay.value)!==JSON.stringify(result))return invalid('tampered','Analysis differs from deterministic replay');
  return {ok:true,value:{ledger,result,files:typedFiles}};
}
export function toMarkdown(ledger:EvidenceLedger,result:AnalysisResult):string{
  const lines=['# GhostOps incident report','','## Findings'];
  for(const c of result.claims){lines.push(`- **${c.classification}** ${c.text} (confidence ${c.confidenceScore.toFixed(2)})`);for(const s of c.sources)lines.push(`  - ${s.fileName}:${s.lineNumber} (byte ${s.byteOffset})`);}
  lines.push('','## What we do not know');for(const g of result.gaps)lines.push(`- ${g.description}`);
  lines.push('','## Evidence ledger');for(const e of ledger.items)lines.push(`- ${e.id} | ${e.source.fileName}:${e.source.lineNumber} | ${e.rawExcerpt.replaceAll('\n','\\n')}`);
  return lines.join('\n');
}
