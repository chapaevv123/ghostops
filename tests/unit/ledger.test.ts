import {describe,it,expect} from 'vitest';
import {EvidenceLedger} from '../../src/ledger/EvidenceLedger';
import type {EvidenceItem} from '../../src/types';
const item=(id:string,timestamp:string|null):EvidenceItem=>({id,timestamp,timestampQuality:timestamp?'EXACT':'UNRESOLVED',sourceType:'log',source:{fileName:'x.log',lineNumber:Number(id),byteOffset:Number(id)-1},rawExcerpt:id,fields:{}});
describe('ledger',()=>{it('sorts, queries and freezes evidence',()=>{const l=new EvidenceLedger([item('2',null),item('1','2026-10-31T00:00:00.000Z')]);expect(l.itemCount).toBe(2);expect(l.nullTimestampCount).toBe(1);expect(l.getBySourceType('log')[0]?.id).toBe('1');expect(l.getByTimeRange('2026-10-31T00:00:00.000Z','2026-10-31T00:00:00.000Z')).toHaveLength(1);expect(l.getById('2')?.id).toBe('2');expect(()=>{(l.items[0] as {rawExcerpt:string}).rawExcerpt='tampered';}).toThrow();});});
