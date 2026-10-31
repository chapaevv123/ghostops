import {readFileSync,readdirSync,existsSync} from 'node:fs';
const files=['src/main.ts'];
if(existsSync('src/ui'))for(const name of readdirSync('src/ui',{withFileTypes:true}))if(name.isFile()&&name.name.endsWith('.ts'))files.push(`src/ui/${name.name}`);
const forbidden=[/\.innerHTML\b/,/\.outerHTML\b/,/\.insertAdjacentHTML\b/,/\beval\s*\(/,/\bnew\s+Function\s*\(/];
let failed=false;for(const file of files){const content=readFileSync(file,'utf8');for(const pattern of forbidden)if(pattern.test(content)){console.error(`${file}: forbidden browser sink ${pattern}`);failed=true;}}
if(failed)process.exitCode=1;else console.log(`Checked ${files.length} UI source file(s)`);
