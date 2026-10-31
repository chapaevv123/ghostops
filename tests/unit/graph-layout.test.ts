import {it,expect} from 'vitest';
import {loadScenario,scenarios} from '../../src/scenarios/validateScenario';
import {generateHypotheses} from '../../src/hypotheses/HypothesisEngine';
import {buildGraph} from '../../src/graph/InvestigationGraph';
import {layoutGraph} from '../../src/graph/layoutGraph';

it('lays out source-linked nodes deterministically without overlapping cards',()=>{
  for(const scenario of scenarios){const loaded=loadScenario(scenario);if(!loaded.analysis.ok)throw new Error(loaded.analysis.error.message);const graph=buildGraph(loaded.ledger,loaded.analysis.value,generateHypotheses(loaded.ledger));for(const compact of [false,true]){const a=layoutGraph(graph.nodes,graph.edges,compact),b=layoutGraph(graph.nodes,graph.edges,compact);expect([...a.positions]).toEqual([...b.positions]);for(const [id,p] of a.positions){expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);for(const [otherId,q] of a.positions){if(id===otherId||p.x!==q.x)continue;expect(Math.abs(p.y-q.y)).toBeGreaterThanOrEqual(a.nodeHeight);}}}}
});
