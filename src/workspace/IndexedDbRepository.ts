import {migratePayload,payloadDigest,sha256,type Investigation,type InvestigationHead,type InvestigationPayload,type WorkspaceError} from './model';
import type {Result} from '../types';

const DB_NAME='ghostops-investigations';const DB_VERSION=2;
const fail=(kind:WorkspaceError['kind'],message:string):Result<never,WorkspaceError>=>({ok:false,error:{kind,message}});
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('IndexedDB request failed'));});
const done=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('IndexedDB transaction aborted'));tx.onerror=()=>reject(tx.error??new Error('IndexedDB transaction failed'));});
function error(e:unknown):WorkspaceError{const x=e instanceof Error?e:new Error(String(e));return {kind:x.name==='QuotaExceededError'?'quota':x.name==='NotFoundError'?'missing':'storage',message:x.name==='QuotaExceededError'?'Browser storage quota was exceeded. Export a backup or free browser storage.':x.message};}
export class IndexedDbRepository {
  private dbPromise:Promise<IDBDatabase>|null=null;
  private open():Promise<IDBDatabase>{if(!('indexedDB' in globalThis))return Promise.reject(new Error('IndexedDB is unavailable'));if(this.dbPromise)return this.dbPromise;
    this.dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('heads'))db.createObjectStore('heads',{keyPath:'id'});if(!db.objectStoreNames.contains('payloads'))db.createObjectStore('payloads',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Could not open IndexedDB'));r.onblocked=()=>reject(new Error('Storage upgrade is blocked by another GhostOps tab'));});
    return this.dbPromise;
  }
  async list():Promise<Result<InvestigationHead[],WorkspaceError>>{try{const db=await this.open();const tx=db.transaction('heads','readonly');const finished=done(tx);const heads=await request(tx.objectStore('heads').getAll()) as InvestigationHead[];await finished;return {ok:true,value:heads.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id))};}catch(e){return {ok:false,error:error(e)};}}
  async get(id:string):Promise<Result<Investigation,WorkspaceError>>{try{const db=await this.open();const tx=db.transaction(['heads','payloads'],'readonly');const finished=done(tx);const [head,raw]=await Promise.all([request(tx.objectStore('heads').get(id)),request(tx.objectStore('payloads').get(id))]);await finished;if(!head||!raw)return fail('missing',`Investigation ${id} is absent or incomplete`);const record=raw as {id:string;data:unknown};const typedHead=head as InvestigationHead;
    const version=(head as {schemaVersion:number}).schemaVersion;
    if(version===1){const expected=await sha256(JSON.stringify(record.data));if(expected!==typedHead.digest)return fail('corrupt',`Legacy investigation ${id} failed its digest check`);const migrated=migratePayload(record.data);return this.put({...typedHead,schemaVersion:2},migrated);}
    if(version!==2)return fail('invalid',`Investigation ${id} has an unsupported metadata version`);const payload=migratePayload(record.data);
    if(await payloadDigest(payload)!==typedHead.digest){
      if(await sha256(JSON.stringify(payload))!==typedHead.digest)return fail('corrupt',`Investigation ${id} failed its local integrity check`);
      return this.put(typedHead,payload);
    }
    return {ok:true,value:{head:typedHead,payload}};}catch(e){return {ok:false,error:error(e)};}}
  async put(head:Omit<InvestigationHead,'digest'>,payload:InvestigationPayload):Promise<Result<Investigation,WorkspaceError>>{try{const digest=await payloadDigest(payload);const finalHead:InvestigationHead={...head,digest};const db=await this.open();const tx=db.transaction(['heads','payloads'],'readwrite');const finished=done(tx);tx.objectStore('heads').put(finalHead);tx.objectStore('payloads').put({id:head.id,data:payload});await finished;return {ok:true,value:{head:finalHead,payload}};}catch(e){return {ok:false,error:error(e)};}}
  async delete(id:string):Promise<Result<void,WorkspaceError>>{try{const db=await this.open();const tx=db.transaction(['heads','payloads'],'readwrite');const finished=done(tx);tx.objectStore('heads').delete(id);tx.objectStore('payloads').delete(id);await finished;return {ok:true,value:undefined};}catch(e){return {ok:false,error:error(e)};}}
}
