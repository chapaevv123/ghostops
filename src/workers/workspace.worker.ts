import {InvestigationService} from '../workspace/InvestigationService';
import {checkIntegrity} from '../integrity/IntegrityCheck';
import {exportInvestigationPackage} from '../package/InvestigationPackage';
import {deserialise} from '../serialiser/Serialiser';
import {generateHypotheses} from '../hypotheses/HypothesisEngine';
import {determinismCheck} from '../engine/pipeline';
import type {InputFile} from '../types';
import type {Investigation} from '../workspace/model';

type Request=
  |{kind:'open';id:string}
  |{kind:'addFiles';investigation:Investigation;files:InputFile[]}
  |{kind:'createWithFiles';title:string;files:InputFile[]}
  |{kind:'importPackage';text:string}
  |{kind:'importSession';title:string;text:string}
  |{kind:'integrity';investigation:Investigation}
  |{kind:'exportPackage';investigation:Investigation};

const service=new InvestigationService();
const progress=(stage:string)=>postMessage({kind:'progress',stage});
self.onmessage=async(event:MessageEvent<Request>)=>{
  try{
    const request=event.data;
    if(request.kind==='open'){
      progress('Verifying source files and replaying analysis');
      const opened=await service.open(request.id);
      if(!opened.ok)throw new Error(opened.error.message);
      const ledger=opened.value.ingester.getLedger();
      postMessage({kind:'success',value:{investigation:opened.value.investigation,items:ledger.items,analysis:opened.value.analysis,hypotheses:generateHypotheses(ledger),replayPass:determinismCheck(ledger)}});
      return;
    }
    if(request.kind==='addFiles'||request.kind==='createWithFiles'){
      progress('Parsing and checking source records');
      const saved=request.kind==='addFiles'
        ?await service.addFiles(request.investigation,request.files)
        :await service.createWithFiles(request.title,'',request.files);
      if(!saved.ok)throw new Error(saved.error.message);
      postMessage({kind:'success',value:saved.value.head.id});return;
    }
    if(request.kind==='importPackage'){
      progress('Checking package schema, hashes and replay');
      const saved=await service.importPackage(request.text);
      if(!saved.ok)throw new Error(saved.error.message);
      postMessage({kind:'success',value:saved.value.head.id});return;
    }
    if(request.kind==='importSession'){
      progress('Checking legacy session and source records');
      const restored=await deserialise(request.text);
      if(!restored.ok)throw new Error(restored.error.message);
      const saved=await service.createWithFiles(request.title,'Imported legacy GhostOps session',restored.value.files);
      if(!saved.ok)throw new Error(saved.error.message);
      postMessage({kind:'success',value:saved.value.head.id});return;
    }
    if(request.kind==='integrity'){
      progress('Checking file hashes, offsets and deterministic replay');
      postMessage({kind:'success',value:await checkIntegrity(request.investigation)});return;
    }
    progress('Building portable package');
    postMessage({kind:'success',value:await exportInvestigationPackage(request.investigation)});
  }catch(error){postMessage({kind:'failure',message:error instanceof Error?error.message:String(error)});}
};
