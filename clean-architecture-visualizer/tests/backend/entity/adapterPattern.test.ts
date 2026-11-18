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

// A controller: no target interface, so its own public API is the target, and
// it adapts view input to the input boundary it wraps.
const controllerNodes: CodebaseASGNode[] = [
  { type: 'CLASS', fqn: 'Controller', name: 'Controller', packageName: '', modifiers: ['PUBLIC'], supertypeFqns: ['java.lang.Object'] },
  { type: 'INTERFACE', fqn: 'InputBoundary', name: 'InputBoundary', packageName: '', modifiers: ['PUBLIC'] },
  { type: 'FIELD', fqn: 'Controller.useCase', name: 'useCase', typeFqn: 'InputBoundary', modifiers: ['PRIVATE', 'FINAL'] },
  { type: 'METHOD', fqn: 'Controller.execute(String)', name: 'execute', parameterFqns: ['String'], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'InputBoundary.execute(InputData)', name: 'execute', parameterFqns: ['InputData'], returnTypeFqn: 'void', modifiers: [] },
];

const controllerEdges: CodebaseASGEdge[] = [
  { type: 'HAS_FIELD', ownerFqn: 'Controller', fieldFqn: 'Controller.useCase' },
  { type: 'HAS_METHOD', ownerFqn: 'Controller', methodFqn: 'Controller.execute(String)', isInherited: false },
  { type: 'HAS_METHOD', ownerFqn: 'InputBoundary', methodFqn: 'InputBoundary.execute(InputData)', isInherited: false },
  { type: 'CALLS', callingMethodFqn: 'Controller.execute(String)', calledMethodFqn: 'InputData.InputData(String)', targetObjectFqn: null as unknown as string, insideLoop: false, insideConditional: false, isConstructorCall: true, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'Controller.execute(String)', calledMethodFqn: 'InputBoundary.execute(InputData)', targetObjectFqn: 'Controller.useCase', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
];

const call = (from: string, to: string, through: string): CodebaseASGEdge => ({
  type: 'CALLS', callingMethodFqn: from, calledMethodFqn: to, targetObjectFqn: through,
  insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false,
});

const verified = async (graphNodes: CodebaseASGNode[], graphEdges: CodebaseASGEdge[]) => {
  const adapter = await pattern();
  return adapter.candidateIdentification(graph(graphNodes, graphEdges))
    .filter((candidate) => adapter.candidateVerification(candidate));
};

describe('Adapter design pattern without a target interface', () => {
  it('identifies and verifies a controller wrapping an input boundary', async () => {
    const matches = await verified(controllerNodes, controllerEdges);

    expect(matches).toHaveLength(1);
    expect(matches[0].getNodes()).toEqual(expect.arrayContaining(controllerNodes));
    expect(matches[0].getEdges()).not.toContainEqual(controllerEdges[3]);
  });

  it('accepts an adapter whose parser reports no supertypes at all', async () => {
    const changed = controllerNodes.map((node): CodebaseASGNode =>
      node.type === 'CLASS' ? { ...node, supertypeFqns: [] } : node
    );
    expect(await verified(changed, controllerEdges)).toHaveLength(1);
  });

  it('rejects a class that implements an interface, such as an interactor', async () => {
    const changed = controllerNodes.map((node): CodebaseASGNode =>
      node.type === 'CLASS' ? { ...node, supertypeFqns: ['java.lang.Object', 'OtherBoundary'] } : node
    );
    expect(await verified(changed, controllerEdges)).toHaveLength(0);
  });

  it('accepts a controller that wraps a concrete class instead of an interface', async () => {
    const changed = controllerNodes.map((node): CodebaseASGNode =>
      node.type === 'INTERFACE'
        ? { type: 'CLASS', fqn: node.fqn, name: node.name, packageName: '', modifiers: [], supertypeFqns: ['java.lang.Object'] }
        : node
    );
    expect(await verified(changed, controllerEdges)).toHaveLength(1);
  });

  it('rejects a class that extends a base class', async () => {
    const changed = controllerNodes.map((node): CodebaseASGNode =>
      node.type === 'CLASS' && node.fqn === 'Controller'
        ? { ...node, supertypeFqns: ['java.lang.Object', 'Base'] }
        : node
    );
    expect(await verified(changed, controllerEdges)).toHaveLength(0);
  });

  it('requires every instance method to delegate through the field', async () => {
    const other: CodebaseASGNode = {
      type: 'METHOD', fqn: 'Controller.reset()', name: 'reset', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'],
    };
    const extraEdges: CodebaseASGEdge[] = [
      { type: 'HAS_METHOD', ownerFqn: 'Controller', methodFqn: other.fqn, isInherited: false },
    ];
    expect(await verified([...controllerNodes, other], [...controllerEdges, ...extraEdges])).toHaveLength(0);
  });

  it('rejects a builder whose methods delegate through different fields', async () => {
    const builderNodes: CodebaseASGNode[] = [
      ...controllerNodes,
      { type: 'INTERFACE', fqn: 'Repository', name: 'Repository', packageName: '', modifiers: [] },
      { type: 'FIELD', fqn: 'Controller.repository', name: 'repository', typeFqn: 'Repository', modifiers: ['PRIVATE'] },
      { type: 'METHOD', fqn: 'Controller.save()', name: 'save', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
      { type: 'METHOD', fqn: 'Repository.save()', name: 'save', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
    ];
    const builderEdges: CodebaseASGEdge[] = [
      ...controllerEdges,
      { type: 'HAS_FIELD', ownerFqn: 'Controller', fieldFqn: 'Controller.repository' },
      { type: 'HAS_METHOD', ownerFqn: 'Controller', methodFqn: 'Controller.save()', isInherited: false },
      { type: 'HAS_METHOD', ownerFqn: 'Repository', methodFqn: 'Repository.save()', isInherited: false },
      call('Controller.save()', 'Repository.save()', 'Controller.repository'),
    ];
    expect(await verified(builderNodes, builderEdges)).toHaveLength(0);
  });

  it('ignores inherited and private methods', async () => {
    const extraNodes: CodebaseASGNode[] = [
      { type: 'METHOD', fqn: 'java.lang.Object.toString()', name: 'toString', parameterFqns: [], returnTypeFqn: 'java.lang.String', modifiers: ['PUBLIC'] },
      { type: 'METHOD', fqn: 'Controller.helper()', name: 'helper', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PRIVATE'] },
    ];
    const extraEdges: CodebaseASGEdge[] = [
      { type: 'HAS_METHOD', ownerFqn: 'Controller', methodFqn: 'java.lang.Object.toString()', isInherited: true },
      { type: 'HAS_METHOD', ownerFqn: 'Controller', methodFqn: 'Controller.helper()', isInherited: false },
    ];
    const matches = await verified([...controllerNodes, ...extraNodes], [...controllerEdges, ...extraEdges]);

    expect(matches).toHaveLength(1);
    expect(matches[0].getNodes()).not.toContainEqual(extraNodes[0]);
    expect(matches[0].getNodes()).not.toContainEqual(extraNodes[1]);
  });

  it('does not count a static call as delegation', async () => {
    const changed = controllerEdges.map((edge): CodebaseASGEdge =>
      edge.type === 'CALLS' && edge.targetObjectFqn === 'Controller.useCase' ? { ...edge, isStaticCall: true } : edge
    );
    expect(await verified(controllerNodes, changed)).toHaveLength(0);
  });

  it('still verifies the interface-target example exactly once', async () => {
    expect(await verified(nodes, edges)).toHaveLength(1);
  });
});
