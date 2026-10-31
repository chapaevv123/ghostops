import type {InputFile} from '../types';

const CHUNK_BYTES=1024*1024;

/** Read bounded chunks so cancellation and progress work before analysis starts. */
export async function readLocalFiles(files:readonly File[],signal:AbortSignal,onProgress:(read:number,total:number)=>void):Promise<InputFile[]>{
  const total=files.reduce((sum,file)=>sum+file.size,0);
  const result:InputFile[]=[];
  let read=0;
  for(const file of files){
    const decoder=new TextDecoder('utf-8',{fatal:true});
    const chunks:string[]=[];
    for(let offset=0;offset<file.size;offset+=CHUNK_BYTES){
      if(signal.aborted)throw new DOMException('Import cancelled','AbortError');
      const end=Math.min(offset+CHUNK_BYTES,file.size);
      try{chunks.push(decoder.decode(await file.slice(offset,end).arrayBuffer(),{stream:true}));}
      catch{throw new Error(`${file.name}: invalid UTF-8 text`);}
      read+=end-offset;
      onProgress(read,total);
      // Give the browser a turn for painting and the Cancel button.
      await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    if(signal.aborted)throw new DOMException('Import cancelled','AbortError');
    try{chunks.push(decoder.decode());}
    catch{throw new Error(`${file.name}: invalid UTF-8 text`);}
    result.push({name:file.name,text:chunks.join(''),size:file.size});
  }
  return result;
}
