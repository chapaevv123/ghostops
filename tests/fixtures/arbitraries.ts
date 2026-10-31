import fc from 'fast-check';
import type {InputFile} from '../../src/types';
export const arbitraryTimestamp=()=>fc.option(fc.date({min:new Date('2025-01-01T00:00:00Z'),max:new Date('2027-01-01T00:00:00Z')}).map(d=>d.toISOString()),{nil:null});
export const arbitrarySourceType=()=>fc.constantFrom('log','ci','deployment','git' as const);
export const arbitraryEvidenceBundle=()=>fc.array(fc.tuple(fc.integer({min:0,max:100000}),fc.constantFrom('ERROR','memory usage 95%','INFO heartbeat','service=api ERROR')), {minLength:1,maxLength:30}).map(records=>[{name:'generated.log',text:records.map(([n,message],i)=>`2026-10-31T00:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}Z ${message} record=${i}`).join('\n')}] satisfies InputFile[]);
