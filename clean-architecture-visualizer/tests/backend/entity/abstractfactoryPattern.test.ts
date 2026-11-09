import { describe, expect, it } from '@jest/globals';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { AbstractFactoryDesignPattern } from '../../../src/entity/AbstractFactoryDesignPattern.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';

const nodes: PatternDefinition['candidateTopology']['nodes'] = [
  { type: 'INTERFACE', fqn: 'example.AbstractFactory', name: 'AbstractFactory', packageName: 'example', modifiers: [] },
  { type: 'INTERFACE', fqn: 'example.AbstractProductA', name: 'AbstractProductA', packageName: 'example', modifiers: [] },
  { type: 'INTERFACE', fqn: 'example.AbstractProductB', name: 'AbstractProductB', packageName: 'example', modifiers: [] },
  { type: 'CLASS', fqn: 'example.ConcreteFactory', name: 'ConcreteFactory', packageName: 'example', modifiers: [] },
  { type: 'CLASS', fqn: 'example.ConcreteProductA', name: 'ConcreteProductA', packageName: 'example', modifiers: [] },
  { type: 'CLASS', fqn: 'example.ConcreteProductB', name: 'ConcreteProductB', packageName: 'example', modifiers: [] },
  { type: 'METHOD', fqn: 'example.AbstractFactory.createProductA', name: 'createProductA', parameterFqns: [], returnTypeFqn: 'example.AbstractProductA', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'example.AbstractFactory.createProductB', name: 'createProductB', parameterFqns: [], returnTypeFqn: 'example.AbstractProductB', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'example.ConcreteFactory.createProductA', name: 'createProductA', parameterFqns: [], returnTypeFqn: 'example.AbstractProductA', modifiers: ['PUBLIC'] },
  { type: 'METHOD', fqn: 'example.ConcreteFactory.createProductB', name: 'createProductB', parameterFqns: [], returnTypeFqn: 'example.AbstractProductB', modifiers: ['PUBLIC'] },
];

const edges: PatternDefinition['candidateTopology']['edges'] = [
  { type: 'IMPLEMENTS', interfaceFqn: 'example.AbstractFactory', implementingClassFqn: 'example.ConcreteFactory' },
  { type: 'IMPLEMENTS', interfaceFqn: 'example.AbstractProductA', implementingClassFqn: 'example.ConcreteProductA' },
  { type: 'IMPLEMENTS', interfaceFqn: 'example.AbstractProductB', implementingClassFqn: 'example.ConcreteProductB' },
  { type: 'HAS_METHOD', ownerFqn: 'example.AbstractFactory', methodFqn: 'example.AbstractFactory.createProductA' },
  { type: 'HAS_METHOD', ownerFqn: 'example.AbstractFactory', methodFqn: 'example.AbstractFactory.createProductB' },
  { type: 'HAS_METHOD', ownerFqn: 'example.ConcreteFactory', methodFqn: 'example.ConcreteFactory.createProductA' },
  { type: 'HAS_METHOD', ownerFqn: 'example.ConcreteFactory', methodFqn: 'example.ConcreteFactory.createProductB' },
];

const definition: PatternDefinition = {
  id: PatternId.AbstractFactory,
  metadata: {
    patternName: PatternName.AbstractFactory,
    patternType: PatternType.DesignPattern,
    description: 'description',
    learningInfo: 'learning info',
  },
  candidateTopology: { nodes: [], edges: [] },
};

const pattern = new AbstractFactoryDesignPattern({
  ...definition,
  candidateTopology: { nodes, edges },
});

describe('AbstractFactoryDesignPattern', () => {
  it('identifies and verifies an abstract factory candidate', () => {
    const asg = new CodebaseASG(nodes, edges);
    const matches = pattern.candidateIdentification(asg);

    expect(matches).toHaveLength(1);
    expect(pattern.candidateVerification(matches[0])).toBe(true);
  });

  it('rejects a candidate with a non-public creation method', () => {
    const invalidNodes = nodes.map((node) =>
      node.type === 'METHOD' && node.fqn === 'example.ConcreteFactory.createProductA'
        ? { ...node, modifiers: ['PRIVATE'] as const }
        : node
    );

    expect(pattern.candidateVerification(new CodebaseASG(invalidNodes, edges))).toBe(false);
  });

  it('rejects a candidate whose creation method returns a concrete product', () => {
    const invalidNodes = nodes.map((node) =>
      node.type === 'METHOD' && node.fqn === 'example.ConcreteFactory.createProductA'
        ? { ...node, returnTypeFqn: 'example.ConcreteProductA' }
        : node
    );

    expect(pattern.candidateVerification(new CodebaseASG(invalidNodes, edges))).toBe(false);
  });
});
