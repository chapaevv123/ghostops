import {describe,expect,it} from 'vitest';
import {readLocalFiles} from '../../src/ui/readLocalFiles';

describe('bounded local file reader',()=>{
  it('preserves UTF-8 across chunk boundaries and reports byte progress',async()=>{
    const source='x'.repeat(1024*1024-1)+'é\nlast';
    const file=new File([source],'unicode.log',{type:'text/plain'});
    const progress:number[]=[];
    const result=await readLocalFiles([file],new AbortController().signal,(done)=>progress.push(done));
    expect(result[0]?.text).toBe(source);
    expect(progress.at(-1)).toBe(file.size);
    expect(progress.length).toBeGreaterThan(1);
  });
  it('cancels before a later chunk without returning partial evidence',async()=>{
    const file=new File(['x'.repeat(2*1024*1024)],'large.log');
    const controller=new AbortController();
    await expect(readLocalFiles([file],controller.signal,()=>controller.abort())).rejects.toMatchObject({name:'AbortError'});
  });
  it('rejects invalid UTF-8 with an explicit error',async()=>{
    const file=new File([new Uint8Array([0xff])],'bad.log');
    await expect(readLocalFiles([file],new AbortController().signal,()=>{})).rejects.toThrow('bad.log: invalid UTF-8 text');
  });
});
