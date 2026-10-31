import {it,expect} from 'vitest';
import {EvidenceIngester} from '../../src/ingester/Ingester';
import {runFullAnalysis} from '../../src/engine/pipeline';
import {linkedEvidenceIds} from '../../src/ui/evidenceSelection';

it('links every distinct source behind a correlated claim instead of its first source only',()=>{const i=new EvidenceIngester();i.ingestText({name:'ci.jsonl',text:'{"step":"build","status":"failed","timestamp":"2026-10-31T09:59:00Z"}'});i.ingestText({name:'deploy.jsonl',text:'{"service":"api","version":"2","event":"deploy","timestamp":"2026-10-31T10:00:00Z"}'});const ledger=i.getLedger(),result=runFullAnalysis(ledger);expect(result.ok).toBe(true);if(!result.ok)return;const claim=result.value.claims.find(c=>c.ruleId==='R-02')!;expect(linkedEvidenceIds(ledger,claim,null)).toEqual(claim.sources.map(x=>ledger.getByReference(x)!.id));expect(linkedEvidenceIds(ledger,null,ledger.items[0]!.id)).toEqual([ledger.items[0]!.id]);});
