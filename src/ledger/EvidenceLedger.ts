import type {EvidenceItem,Gap,SourceReference,SourceType} from '../types';

export const sourceKey = (s:SourceReference):string => `${s.fileName}\u0000${s.lineNumber}\u0000${s.byteOffset}`;
export const compareTime = (a:string|null,b:string|null):number => a===b?0:a===null?1:b===null?-1:a<b?-1:1;
export const sourcePriority:Record<SourceType,number>={git:0,deployment:1,ci:2,log:3};
export class EvidenceLedger {
  readonly items:readonly EvidenceItem[];
  readonly gaps:readonly Gap[];
  private readonly byId:ReadonlyMap<string,EvidenceItem>;
  private readonly bySource:ReadonlyMap<string,EvidenceItem>;
  constructor(items:readonly EvidenceItem[],gaps:readonly Gap[]=[]){
    const seen=new Set<string>();
    const frozen=items.map(item=>{
      if(seen.has(item.id)||!Number.isInteger(item.source.lineNumber)||item.source.lineNumber<1||!Number.isInteger(item.source.byteOffset)||item.source.byteOffset<0) throw new Error('Invalid evidence identity or source reference');
      seen.add(item.id);
      return Object.freeze({...item,source:Object.freeze({...item.source}),fields:Object.freeze({...item.fields})});
    });
    this.items=Object.freeze(frozen.sort((a,b)=>compareTime(a.timestamp,b.timestamp)||sourcePriority[a.sourceType]-sourcePriority[b.sourceType]||sourceKey(a.source).localeCompare(sourceKey(b.source))));
    this.gaps=Object.freeze([...gaps]);
    this.byId=new Map(this.items.map(x=>[x.id,x]));
    this.bySource=new Map(this.items.map(x=>[sourceKey(x.source),x]));
  }
  get itemCount(){return this.items.length;}
  get nullTimestampCount(){return this.items.filter(x=>x.timestamp===null).length;}
  getById(id:string){return this.byId.get(id);}
  getByReference(ref:SourceReference){return this.bySource.get(sourceKey(ref));}
  getBySourceType(type:SourceType){return this.items.filter(x=>x.sourceType===type);}
  getByTimeRange(start:string,end:string){return this.items.filter(x=>x.timestamp!==null&&x.timestamp>=start&&x.timestamp<=end);}
  withGaps(gaps:readonly Gap[]){return new EvidenceLedger(this.items,gaps);}
}
