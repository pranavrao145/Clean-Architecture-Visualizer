import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type {
  CodebaseASGNode,
  FieldModifier,
  MethodModifier,
} from '../../../src/types/codebaseASGNodes.js';

const graph = (
  fieldModifiers: FieldModifier[],
  methodModifiers: MethodModifier[]
): CodebaseASG => {
  const nodes: CodebaseASGNode[] = [
    { type: 'CLASS', fqn: 'S', name: 'S', packageName: '', modifiers: [], supertypeFqns: [] },
    { type: 'FIELD', fqn: 'S.instance', name: 'instance', typeFqn: 'S', modifiers: fieldModifiers },
    { type: 'METHOD', fqn: 'S.getInstance()', name: 'getInstance', parameterFqns: [], returnTypeFqn: 'S', modifiers: methodModifiers },
  ];
  const edges: CodebaseASGEdge[] = [
    { type: 'HAS_FIELD', ownerFqn: 'S', fieldFqn: 'S.instance' },
    { type: 'HAS_METHOD', ownerFqn: 'S', methodFqn: 'S.getInstance()' },
  ];
  return new CodebaseASG(nodes, edges);
};

async function verifiedCount(asg: CodebaseASG): Promise<number> {
  const [singleton] = await new PatternsAccess(new CommonPatternFactory()).buildPatterns([PatternId.Singleton]);
  return singleton.candidateIdentification(asg).filter((candidate) => singleton.candidateVerification(candidate)).length;
}

describe('Singleton identification through the registered JSON topology', () => {
  it.each<[string, FieldModifier[], MethodModifier[]]>([
    ['canonical modifier order', ['PRIVATE', 'STATIC'], ['PUBLIC', 'STATIC']],
    ['static written before the access modifier', ['STATIC', 'PRIVATE'], ['STATIC', 'PUBLIC']],
  ])('finds a singleton with %s', async (_description, field, method) => {
    expect(await verifiedCount(graph(field, method))).toBe(1);
  });

  it.each<[string, FieldModifier[], MethodModifier[]]>([
    ['a public field', ['PUBLIC', 'STATIC'], ['PUBLIC', 'STATIC']],
    ['a non-static field', ['PRIVATE'], ['PUBLIC', 'STATIC']],
    ['a non-static accessor', ['PRIVATE', 'STATIC'], ['PUBLIC']],
    ['an extra field modifier', ['PRIVATE', 'STATIC', 'FINAL'], ['PUBLIC', 'STATIC']],
  ])('does not identify %s', async (_description, field, method) => {
    expect(await verifiedCount(graph(field, method))).toBe(0);
  });
});
