import type {GraphEdge,GraphNode,GraphNodeType} from './InvestigationGraph';

export type GraphPosition=Readonly<{x:number;y:number}>;
export type GraphLayout=Readonly<{positions:ReadonlyMap<string,GraphPosition>;width:number;height:number;nodeWidth:number;nodeHeight:number}>;

/** Stable layered layout. Claims follow their source rows; hypotheses follow supporting records. */
export function layoutGraph(nodes:readonly GraphNode[],edges:readonly GraphEdge[],compact=false):GraphLayout{
  const nodeWidth=compact?194:224,nodeHeight=compact?70:76,rowGap=compact?16:24;
  const xByType:Record<GraphNodeType,number>=compact?{EVIDENCE:16,OBSERVED:238,INFERRED:238,HYPOTHESIS:460,UNKNOWN:460}:{EVIDENCE:20,OBSERVED:292,INFERRED:292,HYPOTHESIS:564,UNKNOWN:836};
  const columns=compact?[16,238,460]:[20,292,564,836];
  const positions=new Map<string,GraphPosition>();
  const nodeOrder=new Map(nodes.map((node,index)=>[node.id,index]));
  const incident=new Map<string,string[]>();
  for(const edge of edges){if(edge.type==='TEMPORALLY_PRECEDES'||edge.type==='CORRELATED_WITH')continue;for(const [a,b] of [[edge.from,edge.to],[edge.to,edge.from]] as const){const list=incident.get(a)??[];list.push(b);incident.set(a,list);}}
  for(const x of columns){
    const group=nodes.filter(node=>xByType[node.type]===x);
    const desired=(node:GraphNode)=>{const linked=(incident.get(node.id)??[]).map(id=>positions.get(id)?.y).filter((y):y is number=>y!==undefined);return linked.length?linked.reduce((sum,y)=>sum+y,0)/linked.length:((nodeOrder.get(node.id)??0)*.01);};
    group.sort((a,b)=>desired(a)-desired(b)||(nodeOrder.get(a.id)??0)-(nodeOrder.get(b.id)??0));
    let bottom=16;
    for(const node of group){const y=Math.max(bottom,Math.round(desired(node)));positions.set(node.id,{x,y});bottom=y+nodeHeight+rowGap;}
  }
  const height=Math.max(470,...[...positions.values()].map(p=>p.y+nodeHeight+20));
  return {positions,width:compact?674:1080,height,nodeWidth,nodeHeight};
}
