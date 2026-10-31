import type {Claim} from '../types';
import type {EvidenceLedger} from '../ledger/EvidenceLedger';

/** Keep every source behind a selected claim; a direct record has one source. */
export function linkedEvidenceIds(ledger:EvidenceLedger,claim:Claim|null,evidenceId:string|null):string[]{
  const ids=claim?.sources.map(source=>ledger.getByReference(source)?.id).filter((id):id is string=>Boolean(id))??(evidenceId?[evidenceId]:[]);
  return [...new Set(ids)];
}
