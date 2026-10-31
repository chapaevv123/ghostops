import {readdir,readFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
const root=process.cwd(),ignored=new Set(['.git','node_modules','dist','coverage','.npm-cache']);
const patterns=[/AKIA[0-9A-Z]{16}/,/ghp_[A-Za-z0-9]{20,}/,/sk-[A-Za-z0-9]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
let checked=0,failed=0;
async function scan(directory){for(const entry of await readdir(directory,{withFileTypes:true})){if(ignored.has(entry.name))continue;const path=join(directory,entry.name);if(entry.isDirectory()){await scan(path);continue;}if(!entry.isFile())continue;const rel=relative(root,path);if(rel==='scripts\\secret-scan.mjs'||rel==='scripts/secret-scan.mjs')continue;if(entry.name.startsWith('.env')&&entry.name!=='.env.example'){console.error(`Sensitive environment file: ${rel}`);failed++;continue;}if(!/\.(?:ts|js|mjs|json|md|html|css|txt|log)$/.test(entry.name))continue;const text=await readFile(path,'utf8');checked++;for(const pattern of patterns)if(pattern.test(text)){console.error(`Potential secret in ${rel}: ${pattern}`);failed++;}}}
await scan(root);console.log(`Secret scan: ${checked} text files checked, ${failed} findings`);if(failed)process.exitCode=1;
