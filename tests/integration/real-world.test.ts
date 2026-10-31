import {describe,expect,it} from 'vitest';
import {EvidenceIngester} from '../../src/ingester/Ingester';
import {runFullAnalysis} from '../../src/engine/pipeline';
import mixed from '../fixtures/real-world/mixed-incident.log?raw';
import ciDeploy from '../fixtures/real-world/ci-deploy.jsonl?raw';
import corrupt from '../fixtures/real-world/corrupt.json?raw';

describe('heterogeneous exported evidence',()=>{
  it('keeps generic text and unknown JSON records with exact source offsets',()=>{
    const ingester=new EvidenceIngester();
    const log=mixed,jsonl=ciDeploy;
    const a=ingester.ingestText({name:'mixed-incident.log',text:log});
    const b=ingester.ingestText({name:'ci-deploy.jsonl',text:jsonl});
    expect(a.ok).toBe(true);expect(b.ok).toBe(true);
    if(!b.ok)return;
    expect(b.value.skippedRecords).toHaveLength(1);
    const ledger=ingester.getLedger();
    expect(ledger.getBySourceType('log').some(x=>x.rawExcerpt.includes('unrecognized_provider_field'))).toBe(true);
    expect(ledger.getBySourceType('ci')).toHaveLength(2);
    expect(ledger.getBySourceType('deployment')).toHaveLength(2);
    expect(ledger.nullTimestampCount).toBeGreaterThan(0);
    const encoder=new TextEncoder();
    for(const item of ledger.items){const bytes=encoder.encode(item.source.fileName==='mixed-incident.log'?log:jsonl);const raw=encoder.encode(item.rawExcerpt);expect(bytes.slice(item.source.byteOffset,item.source.byteOffset+raw.length)).toEqual(raw);}
    const analysis=runFullAnalysis(ledger);expect(analysis.ok).toBe(true);
    if(analysis.ok)expect(analysis.value.claims.some(x=>x.isRootCause)).toBe(false);
  });
  it('rejects malformed standalone JSON without changing prior evidence',()=>{
    const ingester=new EvidenceIngester();
    expect(ingester.ingestText({name:'good.log',text:'2026-10-31T06:00:00Z ERROR'}).ok).toBe(true);
    const before=ingester.getLedger().itemCount;
    expect(ingester.ingestText({name:'corrupt.json',text:corrupt}).ok).toBe(false);
    expect(ingester.getLedger().itemCount).toBe(before);
  });
});
