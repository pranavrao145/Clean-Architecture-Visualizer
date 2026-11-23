import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../../../src/types/codebaseASGNodes.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';

const abstractFactoryDefinition: PatternDefinition = {
  id: PatternId.AbstractFactory,
  metadata: {
    patternName: PatternName.AbstractFactory,
    patternType: PatternType.DesignPattern,
    description: 'description',
    learningInfo: 'learning info',
  },
  candidateTopologies: [],
};

function graph(concreteAMethodAReturn = 'P.ProductA'): CodebaseASG {
  const nodes: CodebaseASGNode[] = [
    { type: 'INTERFACE', fqn: 'F.AbstractFactory', name: 'AbstractFactory', packageName: 'F', modifiers: ['PUBLIC'] },
    { type: 'METHOD', fqn: 'F.AbstractFactory.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: 'P.ProductA', modifiers: ['PUBLIC', 'ABSTRACT'] },
    { type: 'METHOD', fqn: 'F.AbstractFactory.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'P.ProductB', modifiers: ['PUBLIC', 'ABSTRACT'] },
    { type: 'CLASS', fqn: 'F.FactoryA', name: 'FactoryA', packageName: 'F', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'F.FactoryB', name: 'FactoryB', packageName: 'F', modifiers: ['PUBLIC'] },
    { type: 'INTERFACE', fqn: 'P.ProductA', name: 'ProductA', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'INTERFACE', fqn: 'P.ProductB', name: 'ProductB', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'P.ProductA1', name: 'ProductA1', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'P.ProductA2', name: 'ProductA2', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'P.ProductB1', name: 'ProductB1', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'P.ProductB2', name: 'ProductB2', packageName: 'P', modifiers: ['PUBLIC'] },
    { type: 'CLASS', fqn: 'C.Client', name: 'Client', packageName: 'C', modifiers: ['PUBLIC'] },
    { type: 'FIELD', fqn: 'C.Client.factory', name: 'factory', typeFqn: 'F.AbstractFactory', modifiers: ['PRIVATE'] },
    { type: 'METHOD', fqn: 'C.Client.run()', name: 'run', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
    { type: 'METHOD', fqn: 'F.FactoryA.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: concreteAMethodAReturn, modifiers: ['PUBLIC'] },
    { type: 'METHOD', fqn: 'F.FactoryA.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'P.ProductB', modifiers: ['PUBLIC'] },
    { type: 'METHOD', fqn: 'F.FactoryB.createA()', name: 'createA', parameterFqns: [], returnTypeFqn: 'P.ProductA', modifiers: ['PUBLIC'] },
    { type: 'METHOD', fqn: 'F.FactoryB.createB()', name: 'createB', parameterFqns: [], returnTypeFqn: 'P.ProductB', modifiers: ['PUBLIC'] },
  ];

  const edges: CodebaseASGEdge[] = [
    { type: 'HAS_METHOD', ownerFqn: 'F.AbstractFactory', methodFqn: 'F.AbstractFactory.createA()' },
    { type: 'HAS_METHOD', ownerFqn: 'F.AbstractFactory', methodFqn: 'F.AbstractFactory.createB()' },
    { type: 'IMPLEMENTS', interfaceFqn: 'F.AbstractFactory', implementingClassFqn: 'F.FactoryA' },
    { type: 'IMPLEMENTS', interfaceFqn: 'F.AbstractFactory', implementingClassFqn: 'F.FactoryB' },
    { type: 'IMPLEMENTS', interfaceFqn: 'P.ProductA', implementingClassFqn: 'P.ProductA1' },
    { type: 'IMPLEMENTS', interfaceFqn: 'P.ProductA', implementingClassFqn: 'P.ProductA2' },
    { type: 'IMPLEMENTS', interfaceFqn: 'P.ProductB', implementingClassFqn: 'P.ProductB1' },
    { type: 'IMPLEMENTS', interfaceFqn: 'P.ProductB', implementingClassFqn: 'P.ProductB2' },
    { type: 'HAS_METHOD', ownerFqn: 'F.FactoryA', methodFqn: 'F.FactoryA.createA()' },
    { type: 'HAS_METHOD', ownerFqn: 'F.FactoryA', methodFqn: 'F.FactoryA.createB()' },
    { type: 'HAS_METHOD', ownerFqn: 'F.FactoryB', methodFqn: 'F.FactoryB.createA()' },
    { type: 'HAS_METHOD', ownerFqn: 'F.FactoryB', methodFqn: 'F.FactoryB.createB()' },
    { type: 'HAS_FIELD', ownerFqn: 'C.Client', fieldFqn: 'C.Client.factory' },
    { type: 'HAS_METHOD', ownerFqn: 'C.Client', methodFqn: 'C.Client.run()' },
    { type: 'CALLS', callingMethodFqn: 'C.Client.run()', calledMethodFqn: 'F.AbstractFactory.createA()', targetObjectFqn: 'C.Client.factory', insideLoop: false, insideConditional: false, isConstructorCall: false },
    { type: 'CALLS', callingMethodFqn: 'C.Client.run()', calledMethodFqn: 'F.AbstractFactory.createB()', targetObjectFqn: 'C.Client.factory', insideLoop: false, insideConditional: false, isConstructorCall: false },
    { type: 'CALLS', callingMethodFqn: 'F.FactoryA.createA()', calledMethodFqn: 'P.ProductA1.new()', targetObjectFqn: 'P.ProductA1', insideLoop: false, insideConditional: false, isConstructorCall: true },
    { type: 'CALLS', callingMethodFqn: 'F.FactoryA.createB()', calledMethodFqn: 'P.ProductB1.new()', targetObjectFqn: 'P.ProductB1', insideLoop: false, insideConditional: false, isConstructorCall: true },
    { type: 'CALLS', callingMethodFqn: 'F.FactoryB.createA()', calledMethodFqn: 'P.ProductA2.new()', targetObjectFqn: 'P.ProductA2', insideLoop: false, insideConditional: false, isConstructorCall: true },
    { type: 'CALLS', callingMethodFqn: 'F.FactoryB.createB()', calledMethodFqn: 'P.ProductB2.new()', targetObjectFqn: 'P.ProductB2', insideLoop: false, insideConditional: false, isConstructorCall: true },
  ];
  return new CodebaseASG(nodes, edges);
}

describe('Abstract Factory identification and verification', () => {
  it('identifies and accepts a valid two-family Abstract Factory', async () => {
    const [pattern] = await new PatternsAccess(new CommonPatternFactory()).buildPatterns([
      PatternId.AbstractFactory,
    ]);
    const candidates = pattern.candidateIdentification(graph());
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((candidate) => pattern.candidateVerification(candidate))).toBe(true);
  });

  it('rejects a concrete factory method with the wrong abstract return type', async () => {
    const [pattern] = await new PatternsAccess(new CommonPatternFactory()).buildPatterns([
      PatternId.AbstractFactory,
    ]);
    const candidates = pattern.candidateIdentification(graph('P.WrongProduct'));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => !pattern.candidateVerification(candidate))).toBe(true);
  });

  it('constructs the registered Abstract Factory entity', async () => {
    const pattern = await new CommonPatternFactory().create(
      PatternId.AbstractFactory,
      abstractFactoryDefinition
    );
    expect(pattern.data.metadata.patternName).toBe(PatternName.AbstractFactory);
  });
});
