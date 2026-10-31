import {it,expect} from 'vitest';
import {EvidenceIngester} from '../../src/ingester/Ingester';
import {runFullAnalysis} from '../../src/engine/pipeline';
import {generateHypotheses} from '../../src/hypotheses/HypothesisEngine';
import {buildGraph} from '../../src/graph/InvestigationGraph';
import edge from '../fixtures/demo-incident/edge.log?raw';
import ci from '../fixtures/demo-incident/ci.jsonl?raw';
import deployment from '../fixtures/demo-incident/deployment.jsonl?raw';

it('reconstructs the synthetic incident without declaring the deployment a root cause',()=>{const ingester=new EvidenceIngester();for(const [name,text] of [['edge.log',edge],['ci.jsonl',ci],['deployment.jsonl',deployment]] as const)expect(ingester.ingestText({name,text}).ok).toBe(true);const ledger=ingester.getLedger(),result=runFullAnalysis(ledger);expect(result.ok).toBe(true);if(!result.ok)return;expect(ledger.itemCount).toBe(10);expect(result.value.claims.some(x=>x.classification==='OBSERVED')).toBe(true);expect(result.value.claims.some(x=>x.ruleId==='R-02'&&x.classification==='INFERRED'&&x.sources.length===2)).toBe(true);expect(result.value.claims.some(x=>x.isRootCause)).toBe(false);const hypotheses=generateHypotheses(ledger);const regression=hypotheses.find(x=>x.id==='hyp-deployment-regression');expect(regression?.status).toBe('CONTRADICTED');expect(regression?.contradictingEvidenceIds).toHaveLength(1);expect(result.value.claims.some(x=>x.ruleId==='R-06'&&x.classification==='OBSERVED')).toBe(true);const graph=buildGraph(ledger,result.value,hypotheses);expect(graph.edges.some(x=>x.type==='CONTRADICTS')).toBe(true);});
