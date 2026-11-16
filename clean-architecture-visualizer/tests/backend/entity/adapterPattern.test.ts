import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { AdapterDesignPattern } from '../../../src/entity/AdapterDesignPattern.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import type { CodebaseASGNode } from '../../../src/types/codebaseASGNodes.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';

const nodes: CodebaseASGNode[] = [
  { type: 'INTERFACE', fqn: 'MediaPlayer', name: 'MediaPlayer', packageName: '', modifiers: [] },
  { type: 'CLASS', fqn: 'Adapter', name: 'Adapter', packageName: '', modifiers: [], supertypeFqns: ['MediaPlayer'] },
  { type: 'CLASS', fqn: 'Legacy', name: 'Legacy', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'FIELD', fqn: 'Adapter.legacy', name: 'legacy', typeFqn: 'Legacy', modifiers: ['PRIVATE'] },
  { type: 'METHOD', fqn: 'MediaPlayer.play(String)', name: 'play', parameterFqns: ['String'], returnTypeFqn: 'void', modifiers: [] },
  { type: 'METHOD', fqn: 'MediaPlayer.pause()', name: 'pause', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
  { type: 'METHOD', fqn: 'Adapter.play(String)', name: 'play', parameterFqns: ['String'], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'Adapter.pause()', name: 'pause', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'Legacy.playFile(String,int)', name: 'playFile', parameterFqns: ['String', 'int'], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'Legacy.pause()', name: 'pause', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
];

const edges: CodebaseASGEdge[] = [
  { type: 'IMPLEMENTS', interfaceFqn: 'MediaPlayer', implementingClassFqn: 'Adapter', methodImplementations: [
    { interfaceMethodFqn: 'MediaPlayer.play(String)', implementationMethodFqn: 'Adapter.play(String)' },
    { interfaceMethodFqn: 'MediaPlayer.pause()', implementationMethodFqn: 'Adapter.pause()' },
  ] },
  { type: 'HAS_FIELD', ownerFqn: 'Adapter', fieldFqn: 'Adapter.legacy' },
  { type: 'HAS_METHOD', ownerFqn: 'MediaPlayer', methodFqn: 'MediaPlayer.play(String)' },
  { type: 'HAS_METHOD', ownerFqn: 'MediaPlayer', methodFqn: 'MediaPlayer.pause()' },
  { type: 'HAS_METHOD', ownerFqn: 'Adapter', methodFqn: 'Adapter.play(String)' },
  { type: 'HAS_METHOD', ownerFqn: 'Adapter', methodFqn: 'Adapter.pause()' },
  { type: 'CALLS', callingMethodFqn: 'Adapter.play(String)', calledMethodFqn: 'Legacy.playFile(String,int)', targetObjectFqn: 'Adapter.legacy', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'Adapter.pause()', calledMethodFqn: 'Legacy.pause()', targetObjectFqn: 'Adapter.legacy', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
];

const graph = (graphNodes = nodes, graphEdges = edges) =>
  new CodebaseASG(graphNodes, graphEdges);

async function pattern(): Promise<AdapterDesignPattern> {
  const [loaded] = await new PatternsAccess(new CommonPatternFactory()).buildPatterns([PatternId.Adapter]);
  const definition: PatternDefinition = loaded.data;
  return new AdapterDesignPattern(definition);
}

describe('Adapter design pattern', () => {
  it('rejects definitions with the wrong identity', async () => {
    const definition = (await pattern()).data;
    expect(() => new AdapterDesignPattern({ ...definition, id: PatternId.Singleton })).toThrow('Invalid pattern ID');
    expect(() => new AdapterDesignPattern({
      ...definition, metadata: { ...definition.metadata, patternName: PatternName.Singleton },
    })).toThrow('Invalid pattern name');
    expect(() => new AdapterDesignPattern({
      ...definition, metadata: { ...definition.metadata, patternType: 'Invalid' as PatternType },
    })).toThrow('Invalid pattern type');
  });

  it('identifies and verifies the example through the registered JSON topology', async () => {
    const adapter = await pattern();
    const candidates = adapter.candidateIdentification(graph());

    expect(candidates).toHaveLength(1);
    expect(candidates[0].getNodes()).toEqual(nodes);
    expect(adapter.candidateVerification(candidates[0])).toBe(true);
  });

  it('rejects a missing delegation without losing the target method', async () => {
    const adapter = await pattern();
    const candidates = adapter.candidateIdentification(graph(nodes, edges.slice(0, -1)));

    expect(candidates).toHaveLength(1);
    expect(candidates[0].getNodes().some((node) => node.fqn === 'MediaPlayer.pause()')).toBe(true);
    expect(candidates[0].getNodes().some((node) => node.fqn === 'Adapter.pause()')).toBe(false);
    expect(adapter.candidateVerification(candidates[0])).toBe(false);
  });

  it('requires all methods to call through the same field, not another field of the same type', async () => {
    const adapter = await pattern();
    const changed = edges.map((edge): CodebaseASGEdge =>
      edge.type === 'CALLS' && edge.callingMethodFqn === 'Adapter.pause()'
        ? { ...edge, targetObjectFqn: 'Adapter.otherLegacy' }
        : edge
    );
    const otherField: CodebaseASGNode = {
      type: 'FIELD', fqn: 'Adapter.otherLegacy', name: 'otherLegacy', typeFqn: 'Legacy', modifiers: ['PRIVATE'],
    };
    const candidates = adapter.candidateIdentification(graph(
      [...nodes, otherField],
      [...changed, { type: 'HAS_FIELD', ownerFqn: 'Adapter', fieldFqn: otherField.fqn }]
    ));
    expect(candidates).toHaveLength(2);
    expect(candidates.every((candidate) => !adapter.candidateVerification(candidate))).toBe(true);
  });

  it('requires the parser-resolved implementation for every target method', async () => {
    const adapter = await pattern();
    const changed = edges.map((edge): CodebaseASGEdge =>
      edge.type === 'IMPLEMENTS'
        ? { ...edge, methodImplementations: edge.methodImplementations.filter(
          (mapping) => mapping.interfaceMethodFqn !== 'MediaPlayer.pause()'
        ) }
        : edge
    );
    const [candidate] = adapter.candidateIdentification(graph(nodes, changed));
    expect(adapter.candidateVerification(candidate)).toBe(false);
  });

  it('does not identify a target with no instance methods', async () => {
    const adapter = await pattern();
    const changed = edges.filter((edge) => edge.type !== 'HAS_METHOD' || edge.ownerFqn !== 'MediaPlayer');
    expect(adapter.candidateIdentification(graph(nodes, changed))).toHaveLength(0);
  });

  it('does not count a static method call as delegation', async () => {
    const adapter = await pattern();
    const changed = edges.map((edge): CodebaseASGEdge =>
      edge.type === 'CALLS' && edge.callingMethodFqn === 'Adapter.pause()'
        ? { ...edge, isStaticCall: true }
        : edge
    );
    const [candidate] = adapter.candidateIdentification(graph(nodes, changed));
    expect(adapter.candidateVerification(candidate)).toBe(false);
  });

  it('ignores static and private interface methods', async () => {
    const adapter = await pattern();
    const extraNodes: CodebaseASGNode[] = [
      { type: 'METHOD', fqn: 'MediaPlayer.helper()', name: 'helper', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['STATIC'] },
      { type: 'METHOD', fqn: 'MediaPlayer.internal()', name: 'internal', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PRIVATE'] },
    ];
    const extraEdges: CodebaseASGEdge[] = [
      { type: 'HAS_METHOD', ownerFqn: 'MediaPlayer', methodFqn: 'MediaPlayer.helper()' },
      { type: 'HAS_METHOD', ownerFqn: 'MediaPlayer', methodFqn: 'MediaPlayer.internal()' },
    ];
    const [candidate] = adapter.candidateIdentification(graph([...nodes, ...extraNodes], [...edges, ...extraEdges]));
    expect(adapter.candidateVerification(candidate)).toBe(true);
    expect(candidate.getNodes()).not.toContainEqual(extraNodes[0]);
    expect(candidate.getNodes()).not.toContainEqual(extraNodes[1]);
  });

  it('does not include unrelated adapter methods or their calls in the candidate', async () => {
    const adapter = await pattern();
    const helper: CodebaseASGNode = {
      type: 'METHOD', fqn: 'Adapter.helper()', name: 'helper', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PRIVATE'],
    };
    const extraEdges: CodebaseASGEdge[] = [
      { type: 'HAS_METHOD', ownerFqn: 'Adapter', methodFqn: helper.fqn },
      { type: 'CALLS', callingMethodFqn: helper.fqn, calledMethodFqn: 'Legacy.pause()', targetObjectFqn: 'Adapter.legacy', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
    ];
    const [candidate] = adapter.candidateIdentification(graph([...nodes, helper], [...edges, ...extraEdges]));
    expect(adapter.candidateVerification(candidate)).toBe(true);
    expect(candidate.getNodes()).not.toContainEqual(helper);
    expect(candidate.getEdges()).not.toContainEqual(extraEdges[1]);
  });

  it('rejects an adaptee that implements the target through a supertype', async () => {
    const adapter = await pattern();
    const changed = nodes.map((node): CodebaseASGNode =>
      node.type === 'CLASS' && node.fqn === 'Legacy'
        ? { ...node, supertypeFqns: ['Base', 'MediaPlayer'] }
        : node
    );
    const [candidate] = adapter.candidateIdentification(graph(changed));
    expect(adapter.candidateVerification(candidate)).toBe(false);
  });

  it('checks inherited target methods', async () => {
    const adapter = await pattern();
    const changedNodes = nodes.map((node): CodebaseASGNode =>
      node.type === 'METHOD' && node.fqn === 'MediaPlayer.pause()'
        ? { ...node, fqn: 'Parent.pause()' }
        : node
    );
    const changedEdges = edges.map((edge): CodebaseASGEdge => {
      if (edge.type === 'HAS_METHOD' && edge.ownerFqn === 'MediaPlayer' && edge.methodFqn === 'MediaPlayer.pause()')
        return { ...edge, methodFqn: 'Parent.pause()', isInherited: true };
      if (edge.type === 'IMPLEMENTS')
        return { ...edge, methodImplementations: edge.methodImplementations.map((mapping) =>
          mapping.interfaceMethodFqn === 'MediaPlayer.pause()'
            ? { ...mapping, interfaceMethodFqn: 'Parent.pause()' }
            : mapping
        ) };
      return edge;
    });
    const [candidate] = adapter.candidateIdentification(graph(changedNodes, changedEdges));
    expect(adapter.candidateVerification(candidate)).toBe(true);
  });

  it('does not require a node for a called external method', async () => {
    const adapter = await pattern();
    const changed = nodes.filter((node) => node.fqn !== 'Legacy.playFile(String,int)');
    const [candidate] = adapter.candidateIdentification(graph(changed));
    expect(adapter.candidateVerification(candidate)).toBe(true);
  });

});
