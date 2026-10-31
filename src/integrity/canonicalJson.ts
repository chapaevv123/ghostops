// Sort object keys at every level. Array order remains meaningful.
export function canonicalJson(value:unknown):string {
  const encoded=JSON.stringify(value,(_key,item:unknown)=>{
    if(item===null||typeof item!=='object'||Array.isArray(item))return item;
    const sorted:Record<string,unknown>=Object.create(null);
    for(const key of Object.keys(item).sort())sorted[key]=(item as Record<string,unknown>)[key];
    return sorted;
  });
  if(encoded===undefined)throw new Error('Value cannot be serialized as JSON');
  return encoded;
}
