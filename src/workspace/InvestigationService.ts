import {EvidenceIngester} from '../ingester/Ingester';
import {runFullAnalysis} from '../engine/pipeline';
import type {AnalysisResult,InputFile,Result} from '../types';
import {IndexedDbRepository} from './IndexedDbRepository';
import {id,now,sha256,payloadDigest,type AnalystEntry,type Investigation,type InvestigationHead,type InvestigationPayload,type InvestigationStatus,type SourceFile,type WorkspaceError} from './model';
import {inspectInvestigationPackage} from '../package/InvestigationPackage';

const fail=(kind:WorkspaceError['kind'],message:string):Result<never,WorkspaceError>=>({ok:false,error:{kind,message}});
export class InvestigationService {
  constructor(readonly repository=new IndexedDbRepository()){}
  list(){return this.repository.list();}
  async open(idValue:string):Promise<Result<{investigation:Investigation;ingester:EvidenceIngester;analysis:AnalysisResult},WorkspaceError>>{
    const got=await this.repository.get(idValue);if(!got.ok)return got;
    const ingester=new EvidenceIngester();for(const file of got.value.payload.files){if(await sha256(file.text)!==file.sha256)return fail('corrupt',`${file.originalName}: source hash mismatch`);const loaded=ingester.ingestText(file);if(!loaded.ok)return fail('corrupt',`${file.originalName}: ${loaded.error.message}`);}
    const ledger=ingester.getLedger(),analysis=runFullAnalysis(ledger);if(!analysis.ok)return fail('corrupt',analysis.error.message);
    if(got.value.head.normalizedDigest&&await sha256(JSON.stringify(ledger.items))!==got.value.head.normalizedDigest)return fail('corrupt','Normalized evidence differs from its saved digest');
    if(ingester.getLedger().itemCount!==got.value.head.evidenceCount||analysis.value.claims.length!==got.value.head.claimCount||analysis.value.gaps.length!==got.value.head.unknownCount)return fail('corrupt','Stored investigation counts differ from deterministic replay');
    return {ok:true,value:{investigation:got.value,ingester,analysis:analysis.value}};
  }
  async create(title:string,description=''):Promise<Result<Investigation,WorkspaceError>>{const clean=title.trim();if(!clean||clean.length>160)return fail('invalid','Investigation title must contain 1–160 characters');const stamp=now(),newId=id();const payload:InvestigationPayload={schemaVersion:2,files:[],summaries:[],entries:[],history:[{id:id(),at:stamp,action:'CREATED',detail:'Investigation created'}]};const empty=runFullAnalysis(new EvidenceIngester().getLedger());const head:Omit<InvestigationHead,'digest'>={id:newId,schemaVersion:2,title:clean,description:description.slice(0,4000),status:'OPEN',createdAt:stamp,updatedAt:stamp,evidenceCount:0,claimCount:empty.ok?empty.value.claims.length:0,unknownCount:empty.ok?empty.value.gaps.length:0,normalizedDigest:await sha256('[]')};return this.repository.put(head,payload);}
  async createWithFiles(title:string,description:string,files:readonly InputFile[]):Promise<Result<Investigation,WorkspaceError>>{
    const clean=title.trim();if(!clean||clean.length>160)return fail('invalid','Investigation title must contain 1–160 characters');
    const stamp=now(),payload:InvestigationPayload={schemaVersion:2,files:[],summaries:[],entries:[],history:[{id:id(),at:stamp,action:'CREATED',detail:'Investigation created'}]};
    const empty=runFullAnalysis(new EvidenceIngester().getLedger());if(!empty.ok)return fail('invalid',empty.error.message);
    const head:InvestigationHead={id:id(),schemaVersion:2,title:clean,description:description.slice(0,4000),status:'OPEN',createdAt:stamp,updatedAt:stamp,evidenceCount:0,claimCount:empty.value.claims.length,unknownCount:empty.value.gaps.length,normalizedDigest:await sha256('[]'),digest:await payloadDigest(payload)};
    return this.addFiles({head,payload},files);
  }
  private async save(current:Investigation,change:Partial<Omit<InvestigationHead,'id'|'schemaVersion'|'createdAt'|'digest'>>,payload:InvestigationPayload,action:string,detail:string){const stamp=now();const nextPayload:InvestigationPayload={...payload,history:[...payload.history,{id:id(),at:stamp,action,detail}]};const head={...current.head,...change,updatedAt:stamp};return this.repository.put(head,nextPayload);}
  async rename(current:Investigation,title:string,description=current.head.description){const clean=title.trim();if(!clean||clean.length>160)return fail('invalid','Investigation title must contain 1–160 characters');return this.save(current,{title:clean,description:description.slice(0,4000)},current.payload,'RENAMED',clean);}
  async setStatus(current:Investigation,status:InvestigationStatus){return this.save(current,{status},current.payload,'STATUS_CHANGED',status);}
  async duplicate(current:Investigation):Promise<Result<Investigation,WorkspaceError>>{const stamp=now(),newId=id();const payload:InvestigationPayload={...current.payload,history:[{id:id(),at:stamp,action:'DUPLICATED',detail:`Copied from ${current.head.id}`}]};const head:Omit<InvestigationHead,'digest'>={...current.head,id:newId,title:`${current.head.title} (copy)`,status:'OPEN',createdAt:stamp,updatedAt:stamp};return this.repository.put(head,payload);}
  async remove(current:Investigation){return this.repository.delete(current.head.id);}
  async importPackage(text:string):Promise<Result<Investigation,WorkspaceError>>{const parsed=await inspectInvestigationPackage(text);if(!parsed.ok)return fail('invalid',parsed.error.message);const stamp=now();const existing=await this.repository.get(parsed.value.head.id);const collision=existing.ok;const payload:InvestigationPayload={...parsed.value.payload,history:[...parsed.value.payload.history,{id:id(),at:stamp,action:'PACKAGE_IMPORTED',detail:'Portable package restored'}]};const head:Omit<InvestigationHead,'digest'>={...parsed.value.head,id:collision?id():parsed.value.head.id,title:collision?`${parsed.value.head.title} (imported)`:parsed.value.head.title,updatedAt:stamp};return this.repository.put(head,payload);}
  async addEntry(current:Investigation,kind:AnalystEntry['kind'],text:string,evidenceIds:readonly string[]=[]):Promise<Result<Investigation,WorkspaceError>>{const clean=text.trim();if(!clean||clean.length>20000)return fail('invalid','Entry must contain 1–20,000 characters');const stamp=now();const entry:AnalystEntry={id:id(),kind,text:clean,evidenceIds:[...evidenceIds],createdAt:stamp,updatedAt:stamp};return this.save(current,{}, {...current.payload,entries:[...current.payload.entries,entry]},'ENTRY_ADDED',kind);}
  async addFiles(current:Investigation,files:readonly InputFile[]):Promise<Result<Investigation,WorkspaceError>>{
    if(!files.length)return fail('invalid','No files were selected');if(files.length>20)return fail('quota','Select at most 20 files per import');const total=files.reduce((n,f)=>n+new TextEncoder().encode(f.text).length,0)+current.payload.files.reduce((n,f)=>n+new TextEncoder().encode(f.text).length,0);if(total>100*1024*1024)return fail('quota','Investigation source data exceeds the 100 MB working limit');
    const ingester=new EvidenceIngester();for(const existing of current.payload.files){const x=ingester.ingestText(existing);if(!x.ok)return fail('corrupt',x.error.message);}
    const added:SourceFile[]=[];const summaries=[...current.payload.summaries];let recordCount=current.head.evidenceCount;
    for(const file of files){if([...current.payload.files,...added].some(x=>x.name===file.name))return fail('invalid',`${file.name}: a source with this file name already exists; rename the new file before import`);const imported=ingester.ingestText(file);if(!imported.ok)return fail('invalid',imported.error.message);recordCount+=imported.value.itemsProduced;if(recordCount>100_000)return fail('quota','Investigation exceeds the 100,000 evidence record limit');const size=new TextEncoder().encode(file.text).length;added.push({...file,size,sourceId:id(),originalName:file.name,sha256:await sha256(file.text),importedAt:now(),format:detectFormat(file.text),itemsProduced:imported.value.itemsProduced,skippedRecords:imported.value.skippedRecords.length});summaries.push(imported.value);}
    const analysis=runFullAnalysis(ingester.getLedger());if(!analysis.ok)return fail('invalid',analysis.error.message);
    const payload:InvestigationPayload={...current.payload,files:[...current.payload.files,...added],summaries};
    return this.save(current,{evidenceCount:ingester.getLedger().itemCount,claimCount:analysis.value.claims.length,unknownCount:analysis.value.gaps.length,normalizedDigest:await sha256(JSON.stringify(ingester.getLedger().items))},payload,'FILES_IMPORTED',added.map(x=>x.originalName).join(', '));
  }
}
export function detectFormat(text:string):string{const s=text.trimStart();if(s.startsWith('['))return 'JSON array';if(s.startsWith('{'))return text.trim().split(/\r?\n/).length>1?'JSONL':'JSON object';if(/^commit [0-9a-f]{40}/im.test(text))return 'Git log text';return 'plain text log';}
