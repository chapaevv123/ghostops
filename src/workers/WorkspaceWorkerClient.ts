import type {AnalysisResult,EvidenceItem,InputFile} from '../types';
import type {Hypothesis} from '../hypotheses/HypothesisEngine';
import type {IntegrityReport} from '../integrity/IntegrityCheck';
import type {Investigation} from '../workspace/model';

export type WorkspaceSnapshot=Readonly<{investigation:Investigation;items:readonly EvidenceItem[];analysis:AnalysisResult;hypotheses:readonly Hypothesis[];replayPass:boolean}>;
export type WorkspaceRequest=
  |{kind:'open';id:string}
  |{kind:'addFiles';investigation:Investigation;files:InputFile[]}
  |{kind:'createWithFiles';title:string;files:InputFile[]}
  |{kind:'importPackage';text:string}
  |{kind:'importSession';title:string;text:string}
  |{kind:'integrity';investigation:Investigation}
  |{kind:'exportPackage';investigation:Investigation};
type ResponseValue=WorkspaceSnapshot|string|IntegrityReport;

export function runWorkspaceWorker<T extends ResponseValue>(request:WorkspaceRequest,onProgress:(stage:string)=>void,signal?:AbortSignal):Promise<T>{
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('Operation cancelled','AbortError'));return;}
    const worker=new Worker(new URL('./workspace.worker.ts',import.meta.url),{type:'module'});
    let settled=false;
    const finish=(value:unknown,error=false)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',onAbort);worker.terminate();if(error)reject(value);else resolve(value as T);};
    const onAbort=()=>finish(new DOMException('Operation cancelled','AbortError'),true);
    signal?.addEventListener('abort',onAbort,{once:true});
    worker.onerror=event=>finish(new Error(event.message||'Analysis worker failed'),true);
    worker.onmessage=(event:MessageEvent<{kind:'progress';stage:string}|{kind:'success';value:T}|{kind:'failure';message:string}>)=>{
      const response=event.data;
      if(response.kind==='progress')onProgress(response.stage);
      else if(response.kind==='success')finish(response.value);
      else finish(new Error(response.message),true);
    };
    worker.postMessage(request);
  });
}
