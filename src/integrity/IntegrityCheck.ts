import {EvidenceIngester} from '../ingester/Ingester';
import {runFullAnalysis} from '../engine/pipeline';
import {payloadDigest,sha256,type Investigation} from '../workspace/model';

export type IntegrityFinding=Readonly<{check:string;status:'PASS'|'FAIL'|'INCOMPLETE';detail:string}>;
export type IntegrityReport=Readonly<{status:'PASS'|'FAIL'|'INCOMPLETE';findings:readonly IntegrityFinding[]}>;
const finding=(check:string,status:IntegrityFinding['status'],detail:string):IntegrityFinding=>({check,status,detail});
export async function checkIntegrity(investigation:Investigation):Promise<IntegrityReport>{
  const findings:IntegrityFinding[]=[];
  const canonical=await payloadDigest(investigation.payload),legacy=await sha256(JSON.stringify(investigation.payload));
  findings.push(finding('workspace digest',canonical===investigation.head.digest||legacy===investigation.head.digest?'PASS':'FAIL',canonical===investigation.head.digest?'Canonical SHA-256 of the stored payload matches local metadata.':'Legacy JSON SHA-256 checked for compatibility; reopen migrates this record.'));
  if(!investigation.payload.files.length)findings.push(finding('source files','INCOMPLETE','No source files have been imported.'));
  const ingester=new EvidenceIngester();const names=new Set<string>();
  for(const file of investigation.payload.files){
    if(names.has(file.name)){findings.push(finding(`source ${file.name}`,'FAIL','Duplicate source name makes references ambiguous.'));continue;}names.add(file.name);
    const hash=await sha256(file.text);findings.push(finding(`source hash ${file.name}`,hash===file.sha256?'PASS':'FAIL','SHA-256 of original UTF-8 source text.'));
    const parsed=ingester.ingestText(file);findings.push(finding(`source parse ${file.name}`,parsed.ok&&parsed.value.itemsProduced===file.itemsProduced?'PASS':'FAIL',parsed.ok?`${parsed.value.itemsProduced} records parsed.`:parsed.error.message));
  }
  let ledger;try{ledger=ingester.getLedger();}catch(e){findings.push(finding('ledger','FAIL',e instanceof Error?e.message:String(e)));return summarize(findings);}
  if(investigation.head.normalizedDigest)findings.push(finding('normalized evidence digest',await sha256(JSON.stringify(ledger.items))===investigation.head.normalizedDigest?'PASS':'FAIL','Re-ingested records compared with the saved normalized ledger digest.'));
  else findings.push(finding('normalized evidence digest','INCOMPLETE','No normalized digest was stored by this package version.'));
  const sourceBytes=new Map(investigation.payload.files.map(file=>[file.name,new TextEncoder().encode(file.text)]));
  for(const item of ledger.items){const bytes=sourceBytes.get(item.source.fileName);if(!bytes){findings.push(finding(`reference ${item.id}`,'FAIL','Source file is missing.'));continue;}
    const raw=new TextEncoder().encode(item.rawExcerpt);const match=item.source.byteOffset>=0&&item.source.byteOffset+raw.length<=bytes.length&&raw.every((b,i)=>bytes[item.source.byteOffset+i]===b);
    if(!match)findings.push(finding(`reference ${item.id}`,'FAIL','Excerpt does not match source bytes at recorded offset.'));
  }
  if(!findings.some(f=>f.check.startsWith('reference ')&&f.status==='FAIL'))findings.push(finding('source references','PASS',`${ledger.itemCount} record references resolve to source bytes.`));
  const missingLinks=investigation.payload.entries.flatMap(entry=>entry.evidenceIds.filter(id=>!ledger.getById(id)).map(id=>`${entry.id}:${id}`));
  findings.push(finding('analyst entry references',missingLinks.length?'FAIL':'PASS',missingLinks.length?`${missingLinks.length} linked evidence ID(s) do not resolve: ${missingLinks.slice(0,5).join(', ')}`:`${investigation.payload.entries.length} analyst entries checked.`));
  const replay=runFullAnalysis(ledger);findings.push(finding('deterministic replay',replay.ok&&replay.value.claims.length===investigation.head.claimCount&&replay.value.gaps.length===investigation.head.unknownCount&&ledger.itemCount===investigation.head.evidenceCount?'PASS':'FAIL',replay.ok?'Analysis and stored counts agree.':replay.error.message));
  return summarize(findings);
}
const summarize=(findings:IntegrityFinding[]):IntegrityReport=>({status:findings.some(x=>x.status==='FAIL')?'FAIL':findings.some(x=>x.status==='INCOMPLETE')?'INCOMPLETE':'PASS',findings});
