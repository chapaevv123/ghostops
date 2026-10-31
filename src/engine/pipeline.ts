import {EvidenceLedger} from '../ledger/EvidenceLedger';
import {analyze} from './AnalysisEngine';
import {verify} from '../verifier/ClaimVerifier';
import {reconstruct} from '../reconstructor/TimelineReconstructor';
import type {AnalysisResult,Result,VerifierError} from '../types';
export function runFullAnalysis(ledger:EvidenceLedger):Result<AnalysisResult,VerifierError>{
  const checked=verify(analyze(ledger),ledger);if(!checked.ok)return checked;
  const {claims,gaps,rootCauseNotice}=checked.value;
  return {ok:true,value:{claims,gaps,rootCauseNotice,timeline:reconstruct(claims,gaps,ledger),ledgerHash:''}};
}
export function determinismCheck(ledger:EvidenceLedger):boolean{return JSON.stringify(runFullAnalysis(ledger))===JSON.stringify(runFullAnalysis(ledger));}
