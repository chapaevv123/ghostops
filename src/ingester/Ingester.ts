import {EvidenceLedger} from '../ledger/EvidenceLedger';
import type {EvidenceItem,IngestionError,IngestionSummary,InputFile,Result,SkippedRecord,SourceType} from '../types';

const MAX_SIZE=50*1024*1024;
const MAX_RECORD_SIZE=1024*1024;
const MAX_RECORDS=100_000;
const encoder=new TextEncoder();
const badKeys=new Set(['__proto__','constructor','prototype']);
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export function safeJson(text:string):unknown {
  const value:unknown=JSON.parse(text);
  const pending:unknown[]=[value];
  while(pending.length){const item=pending.pop();if(Array.isArray(item)){for(const child of item)pending.push(child);}else if(object(item))for(const [key,child] of Object.entries(item)){if(badKeys.has(key))throw new Error(`Unsafe JSON key: ${key}`);pending.push(child);}}
  return value;
}
function timestamp(value:unknown):string|null {
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) return null;
  const n=Date.parse(value);return Number.isFinite(n)?new Date(n).toISOString():null;
}
function segments(text:string):{raw:string;line:number;offset:number}[]{
  const result: {raw:string;line:number;offset:number}[]=[];let start=0,line=1,offset=0;
  for(let i=0;i<=text.length;i++) if(i===text.length||text[i]==='\n'){
    const end=i>start&&text[i-1]==='\r'?i-1:i;
    result.push({raw:text.slice(start,end),line,offset});offset+=encoder.encode(text.slice(start,Math.min(i+1,text.length))).length;start=i+1;line++;
  }
  return result;
}
function jsonObjects(text:string):{raw:string;line:number;offset:number}[] {
  const out:{raw:string;line:number;offset:number}[]=[];let depth=0,start=-1,quoted=false,escape=false,lastStart=0,lastOffset=0,lastLine=1;
  for(let i=0;i<text.length;i++){
    const c=text[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;continue;}if(c==='{'){if(depth===0)start=i;depth++;}else if(c==='}'){depth--;if(depth===0&&start>=0){const before=text.slice(lastStart,start);lastOffset+=encoder.encode(before).length;lastLine+=(before.match(/\n/g)??[]).length;out.push({raw:text.slice(start,i+1),line:lastLine,offset:lastOffset});lastStart=start;start=-1;}}
  }
  return out;
}
const stableId=(name:string,offset:number,raw:string):string=>{
  let h=2166136261;for(const b of encoder.encode(`${name}\u0000${offset}\u0000${raw}`)){h^=b;h=Math.imul(h,16777619);}
  return `ev-${(h>>>0).toString(16).padStart(8,'0')}-${offset}`;
};
function sourceType(v:Record<string,unknown>):SourceType|null {
  if(typeof v.step==='string'&&typeof v.status==='string')return 'ci';
  if(typeof v.service==='string'&&typeof v.event==='string'&&typeof v.version==='string')return 'deployment';
  if(typeof v.commit==='string'&&/^[0-9a-f]{40}$/i.test(v.commit))return 'git';
  return null;
}
export class EvidenceIngester {
  private files:InputFile[]=[];
  private items:EvidenceItem[]=[];
  getLedger(){return new EvidenceLedger(this.items);}
  getFiles(){return Object.freeze([...this.files]);}
  async ingest(file:File|InputFile):Promise<Result<IngestionSummary,IngestionError>>{
    const name=file.name;const size=file.size??encoder.encode(typeof file.text==='string'?file.text:'').length;
    if(size>MAX_SIZE)return {ok:false,error:{kind:'size',fileName:name,message:`${name}: exceeds 50 MB limit`}};
    const text=typeof file.text==='string'?file.text:await file.text();
    return this.ingestText({name,text,size});
  }
  ingestText(file:InputFile):Result<IngestionSummary,IngestionError>{
    const {name,text}=file;const size=file.size??encoder.encode(text).length;
    if(size>MAX_SIZE)return {ok:false,error:{kind:'size',fileName:name,message:`${name}: exceeds 50 MB limit`}};
    if(!text.trim())return {ok:false,error:{kind:'format',fileName:name,message:`${name}: empty file`}};
    let records:{raw:string;line:number;offset:number}[];let structured=false;let lines:{raw:string;line:number;offset:number}[]|null=null;
    const getLines=()=>lines??=segments(text);
    const trimmed=text.trimStart();
    if(trimmed.startsWith('[')||trimmed.startsWith('{')){
      try{
        const root=safeJson(text);
        if(Array.isArray(root)){if(!root.every(object))throw new Error('Expected array of objects');records=jsonObjects(text);structured=true;}
        else if(object(root)){records=jsonObjects(text);structured=true;}
        else throw new Error('Expected object or array');
      }catch(e){
        const message=e instanceof Error?e.message:String(e);
        const nonblank=getLines().filter(x=>x.raw.trim());
        if(!message.startsWith('Unsafe')&&nonblank.length>1&&nonblank.every(x=>x.raw.trimStart().startsWith('{'))){records=getLines();structured=true;}
        else return {ok:false,error:{kind:message.startsWith('Unsafe')?'unsafe-json':'invalid-json',fileName:name,message:`${name}: ${message}`}};
      }
    }else if(getLines().filter(x=>x.raw.trim()).every(x=>x.raw.trimStart().startsWith('{'))){records=getLines();structured=true;}
    else records=getLines();
    if(records.length>MAX_RECORDS)return {ok:false,error:{kind:'size',fileName:name,message:`${name}: exceeds ${MAX_RECORDS} records per file`}};
    if(records.some(x=>encoder.encode(x.raw).length>MAX_RECORD_SIZE))return {ok:false,error:{kind:'size',fileName:name,message:`${name}: a record exceeds 1 MB`}};
    const produced:EvidenceItem[]=[];const skipped:SkippedRecord[]=[];
    for(const record of records){if(!record.raw.trim())continue;
      let type:SourceType;let ts:string|null;let fields:Record<string,string|number|boolean|null>={};
      if(structured){
        let value:unknown;try{value=safeJson(record.raw);}catch(e){const message=e instanceof Error?e.message:String(e);if(message.startsWith('Unsafe'))return {ok:false,error:{kind:'unsafe-json',fileName:name,message:`${name}: ${message}`}};skipped.push({fileName:name,rawText:record.raw,parseError:message});continue;}
        if(!object(value)){skipped.push({fileName:name,rawText:record.raw,parseError:'Record is not an object'});continue;}
        // Preserve unfamiliar structured exports as source evidence without claiming a specialized parser.
        type=sourceType(value)??'log';ts=timestamp(value.timestamp);
        for(const [k,v] of Object.entries(value))if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)fields[k]=v;
      }else if(/^commit [0-9a-f]{40}\b/i.test(record.raw)){type='git';ts=timestamp(record.raw.match(/\d{4}-\d\d-\d\dT\S+/)?.[0]);}
      else {type='log';ts=timestamp(record.raw.match(/\d{4}-\d\d-\d\dT\S+/)?.[0]);}
      produced.push({id:stableId(name,record.offset,record.raw),timestamp:ts,timestampQuality:ts===null?'UNRESOLVED':'EXACT',sourceType:type,source:{fileName:name,lineNumber:record.line,byteOffset:record.offset},rawExcerpt:record.raw,fields});
    }
    if(!produced.length&&skipped.length===0)return {ok:false,error:{kind:'format',fileName:name,message:`${name}: no records`}};
    this.files.push({name,text,size});this.items.push(...produced);
    return {ok:true,value:{fileName:name,itemsProduced:produced.length,skippedRecords:skipped}};
  }
}
