import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { AbstractFactoryDesignPattern } from '../../../src/entity/AbstractFactoryDesignPattern.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../../../src/types/codebaseASGNodes.js';

const nodes: CodebaseASGNode[] = [
  { type: 'INTERFACE', fqn: 'AbstractFactory', name: 'AbstractFactory', packageName: '', modifiers: [] },
  { type: 'INTERFACE', fqn: 'ProductA', name: 'ProductA', packageName: '', modifiers: [] },
  { type: 'INTERFACE', fqn: 'ProductB', name: 'ProductB', packageName: '', modifiers: [] },
  { type: 'CLASS', fqn: 'FactoryOne', name: 'FactoryOne', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'FactoryTwo', name: 'FactoryTwo', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'ProductAOne', name: 'ProductAOne', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'ProductBOne', name: 'ProductBOne', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'ProductATwo', name: 'ProductATwo', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'ProductBTwo', name: 'ProductBTwo', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'CLASS', fqn: 'Client', name: 'Client', packageName: '', modifiers: [], supertypeFqns: [] },
  { type: 'FIELD', fqn: 'Client.factory', name: 'factory', typeFqn: 'AbstractFactory', modifiers: ['PRIVATE'] },
  { type: 'METHOD', fqn: 'AbstractFactory.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: 'ProductA', modifiers: [] },
  { type: 'METHOD', fqn: 'AbstractFactory.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'ProductB', modifiers: [] },
  { type: 'METHOD', fqn: 'FactoryOne.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: 'ProductA', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'FactoryOne.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'ProductB', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'FactoryTwo.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: 'ProductA', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'FactoryTwo.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'ProductB', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'Client.use()', name: 'use', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
];

const edges: CodebaseASGEdge[] = [
  {
    type: 'IMPLEMENTS',
    interfaceFqn: 'AbstractFactory',
    implementingClassFqn: 'FactoryOne',
    methodImplementations: [
      { interfaceMethodFqn: 'AbstractFactory.createA()', implementationMethodFqn: 'FactoryOne.createA()' },
      { interfaceMethodFqn: 'AbstractFactory.createB()', implementationMethodFqn: 'FactoryOne.createB()' },
    ],
  },
  {
    type: 'IMPLEMENTS',
    interfaceFqn: 'AbstractFactory',
    implementingClassFqn: 'FactoryTwo',
    methodImplementations: [
      { interfaceMethodFqn: 'AbstractFactory.createA()', implementationMethodFqn: 'FactoryTwo.createA()' },
      { interfaceMethodFqn: 'AbstractFactory.createB()', implementationMethodFqn: 'FactoryTwo.createB()' },
    ],
  },
  { type: 'IMPLEMENTS', interfaceFqn: 'ProductA', implementingClassFqn: 'ProductAOne', methodImplementations: [] },
  { type: 'IMPLEMENTS', interfaceFqn: 'ProductB', implementingClassFqn: 'ProductBOne', methodImplementations: [] },
  { type: 'IMPLEMENTS', interfaceFqn: 'ProductA', implementingClassFqn: 'ProductATwo', methodImplementations: [] },
  { type: 'IMPLEMENTS', interfaceFqn: 'ProductB', implementingClassFqn: 'ProductBTwo', methodImplementations: [] },
  { type: 'HAS_FIELD', ownerFqn: 'Client', fieldFqn: 'Client.factory' },
  { type: 'HAS_METHOD', ownerFqn: 'AbstractFactory', methodFqn: 'AbstractFactory.createA()' },
  { type: 'HAS_METHOD', ownerFqn: 'AbstractFactory', methodFqn: 'AbstractFactory.createB()' },
  { type: 'HAS_METHOD', ownerFqn: 'FactoryOne', methodFqn: 'FactoryOne.createA()' },
  { type: 'HAS_METHOD', ownerFqn: 'FactoryOne', methodFqn: 'FactoryOne.createB()' },
  { type: 'HAS_METHOD', ownerFqn: 'FactoryTwo', methodFqn: 'FactoryTwo.createA()' },
  { type: 'HAS_METHOD', ownerFqn: 'FactoryTwo', methodFqn: 'FactoryTwo.createB()' },
  { type: 'HAS_METHOD', ownerFqn: 'Client', methodFqn: 'Client.use()' },
  { type: 'CALLS', callingMethodFqn: 'FactoryOne.createA()', calledMethodFqn: 'ProductAOne.ProductAOne()', targetObjectFqn: 'ProductAOne', insideLoop: false, insideConditional: false, isConstructorCall: true, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'FactoryOne.createB()', calledMethodFqn: 'ProductBOne.ProductBOne()', targetObjectFqn: 'ProductBOne', insideLoop: false, insideConditional: false, isConstructorCall: true, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'FactoryTwo.createA()', calledMethodFqn: 'ProductATwo.ProductATwo()', targetObjectFqn: 'ProductATwo', insideLoop: false, insideConditional: false, isConstructorCall: true, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'FactoryTwo.createB()', calledMethodFqn: 'ProductBTwo.ProductBTwo()', targetObjectFqn: 'ProductBTwo', insideLoop: false, insideConditional: false, isConstructorCall: true, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'Client.use()', calledMethodFqn: 'AbstractFactory.createA()', targetObjectFqn: 'Client.factory', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
  { type: 'CALLS', callingMethodFqn: 'Client.use()', calledMethodFqn: 'AbstractFactory.createB()', targetObjectFqn: 'Client.factory', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
];

const graph = (graphNodes = nodes, graphEdges = edges) =>
  new CodebaseASG(graphNodes, graphEdges);

async function pattern(): Promise<AbstractFactoryDesignPattern> {
  const [loaded] = await new PatternsAccess(new CommonPatternFactory()).buildPatterns([
    PatternId.AbstractFactory,
  ]);
  return loaded as AbstractFactoryDesignPattern;
}

describe('Abstract Factory design pattern', () => {
  it('identifies and verifies parallel product families', async () => {
    const abstractFactory = await pattern();
    const candidates = abstractFactory.candidateIdentification(graph());

    expect(candidates).toHaveLength(1);
    expect(abstractFactory.candidateVerification(candidates[0])).toBe(true);
  });

  it('rejects a factory that leaks a concrete product return type', async () => {
    const abstractFactory = await pattern();
    const changedNodes = nodes.map((node) =>
      node.type === 'METHOD' && node.fqn === 'FactoryOne.createA()'
        ? { ...node, returnTypeFqn: 'ProductAOne' }
        : node,
    );
    const [candidate] = abstractFactory.candidateIdentification(
      graph(changedNodes, edges),
    );

    expect(abstractFactory.candidateVerification(candidate)).toBe(false);
  });
});
