import type {InputFile,IngestionSummary} from '../types';
import {canonicalJson} from '../integrity/canonicalJson';

export type InvestigationStatus='OPEN'|'INVESTIGATING'|'WAITING_FOR_EVIDENCE'|'RESOLVED'|'ARCHIVED';
export type AnalystEntry=Readonly<{id:string;kind:'NOTE'|'FINDING';text:string;evidenceIds:readonly string[];createdAt:string;updatedAt:string}>;
export type ActionEntry=Readonly<{id:string;at:string;action:string;detail:string}>;
export type SourceFile=InputFile & Readonly<{sourceId:string;originalName:string;sha256:string;importedAt:string;format:string;itemsProduced:number;skippedRecords:number}>;
export type InvestigationPayload=Readonly<{schemaVersion:2;files:readonly SourceFile[];summaries:readonly IngestionSummary[];entries:readonly AnalystEntry[];history:readonly ActionEntry[]}>;
export type InvestigationHead=Readonly<{id:string;schemaVersion:2;title:string;description:string;status:InvestigationStatus;createdAt:string;updatedAt:string;evidenceCount:number;claimCount:number;unknownCount:number;normalizedDigest?:string;digest:string}>;
export type Investigation=Readonly<{head:InvestigationHead;payload:InvestigationPayload}>;
export type WorkspaceError=Readonly<{kind:'unavailable'|'quota'|'corrupt'|'missing'|'invalid'|'storage';message:string}>;
export type LegacyPayload=Readonly<{schemaVersion:1;files:readonly SourceFile[];summaries?:readonly IngestionSummary[];notes?:readonly AnalystEntry[]}>;

export function migratePayload(value:unknown):InvestigationPayload {
  if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('Invalid investigation payload');
  const v=value as Record<string,unknown>;
  if(v.schemaVersion===2&&Array.isArray(v.files)&&Array.isArray(v.summaries)&&Array.isArray(v.entries)&&Array.isArray(v.history))return v as InvestigationPayload;
  if(v.schemaVersion===1&&Array.isArray(v.files))return {schemaVersion:2,files:v.files as SourceFile[],summaries:Array.isArray(v.summaries)?v.summaries as IngestionSummary[]:[],entries:Array.isArray(v.notes)?v.notes as AnalystEntry[]:[],history:[]};
  throw new Error('Unsupported investigation schema');
}
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export async function sha256(text:string):Promise<string>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function payloadDigest(payload:InvestigationPayload):Promise<string>{return sha256(canonicalJson(payload));}
