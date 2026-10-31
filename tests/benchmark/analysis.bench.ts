import {bench} from 'vitest';
import {EvidenceIngester} from '../../src/ingester/Ingester';
import {runFullAnalysis} from '../../src/engine/pipeline';
const text=Array.from({length:1000},(_,i)=>`${new Date(Date.UTC(2026,9,31,10,0,0)+i*1000).toISOString()} service=api ${i===999?'ERROR timeout':'INFO heartbeat'} record=${i}`).join('\n');
bench('ingest and analyze 1000 UTF-8 log records',()=>{const ingester=new EvidenceIngester();const result=ingester.ingestText({name:'benchmark.log',text});if(!result.ok)throw new Error(result.error.message);const analysis=runFullAnalysis(ingester.getLedger());if(!analysis.ok)throw new Error(analysis.error.message);});
