export const el=<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text=''):HTMLElementTagNameMap[K]=>{const node=document.createElement(tag);if(className)node.className=className;node.textContent=text;return node;};
export const append=(parent:Element,...children:Node[])=>children.forEach(x=>parent.append(x));
export const button=(label:string,className:string,onClick:()=>void)=>{const node=el('button',className,label);node.type='button';node.addEventListener('click',onClick);return node;};
export function download(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
