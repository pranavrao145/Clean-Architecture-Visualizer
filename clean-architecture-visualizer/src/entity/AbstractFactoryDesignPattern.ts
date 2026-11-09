import type {
  HasMethodEdge,
  ImplementsEdge,
} from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  InterfaceNode,
  MethodNode,
} from '../types/codebaseASGNodes.js';
import type { PatternDefinition } from '../types/patternDefinition.js';
import type { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternId } from './PatternId.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';

export class AbstractFactoryDesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternId.AbstractFactory) {
      throw new Error(
        `Invalid pattern ID for AbstractFactoryDesignPattern: ${data.id}`
      );
    }

    if (data.metadata.patternName !== PatternName.AbstractFactory) {
      throw new Error(
        `Invalid pattern name for AbstractFactoryDesignPattern: ${data.metadata.patternName}`
      );
    }

    if (data.metadata.patternType !== PatternType.DesignPattern) {
      throw new Error(
        `Invalid pattern type for AbstractFactoryDesignPattern: ${data.metadata.patternType}`
      );
    }

    super(data);
  }

  candidateVerification(candidateASG: CodebaseASG): boolean {
    const nodes = candidateASG.getNodes();
    const edges = candidateASG.getEdges();
    if (nodes.length !== 10 || edges.length !== 7) {
      return false;
    }

    const factoryInterface = this.findInterface(nodes, 'AbstractFactory');
    const productAInterface = this.findInterface(nodes, 'AbstractProductA');
    const productBInterface = this.findInterface(nodes, 'AbstractProductB');
    const concreteFactory = this.findClass(nodes, 'ConcreteFactory');
    const concreteProductA = this.findClass(nodes, 'ConcreteProductA');
    const concreteProductB = this.findClass(nodes, 'ConcreteProductB');
    const abstractCreateA = this.findMethod(nodes, 'createProductA', factoryInterface);
    const abstractCreateB = this.findMethod(nodes, 'createProductB', factoryInterface);
    const concreteCreateA = this.findMethod(nodes, 'createProductA', concreteFactory);
    const concreteCreateB = this.findMethod(nodes, 'createProductB', concreteFactory);

    if (
      !factoryInterface ||
      !productAInterface ||
      !productBInterface ||
      !concreteFactory ||
      !concreteProductA ||
      !concreteProductB ||
      !abstractCreateA ||
      !abstractCreateB ||
      !concreteCreateA ||
      !concreteCreateB
    ) {
      return false;
    }

    return (
      this.hasImplementation(edges, factoryInterface, concreteFactory) &&
      this.hasImplementation(edges, productAInterface, concreteProductA) &&
      this.hasImplementation(edges, productBInterface, concreteProductB) &&
      this.hasMethod(edges, factoryInterface, abstractCreateA) &&
      this.hasMethod(edges, factoryInterface, abstractCreateB) &&
      this.hasMethod(edges, concreteFactory, concreteCreateA) &&
      this.hasMethod(edges, concreteFactory, concreteCreateB) &&
      this.isFactoryMethod(abstractCreateA, productAInterface) &&
      this.isFactoryMethod(abstractCreateB, productBInterface) &&
      this.isFactoryMethod(concreteCreateA, productAInterface) &&
      this.isFactoryMethod(concreteCreateB, productBInterface)
    );
  }

  private findInterface(
    nodes: CodebaseASG['nodes'],
    name: string
  ): InterfaceNode | undefined {
    return nodes.find(
      (node): node is InterfaceNode =>
        node.type === 'INTERFACE' && node.name === name
    );
  }

  private findClass(
    nodes: CodebaseASG['nodes'],
    name: string
  ): ClassNode | undefined {
    return nodes.find(
      (node): node is ClassNode => node.type === 'CLASS' && node.name === name
    );
  }

  private findMethod(
    nodes: CodebaseASG['nodes'],
    name: string,
    owner: InterfaceNode | ClassNode | undefined
  ): MethodNode | undefined {
    if (!owner) {
      return undefined;
    }
    return nodes.find(
      (node): node is MethodNode =>
        node.type === 'METHOD' &&
        node.name === name &&
        node.fqn.startsWith(`${owner.fqn}.`) &&
        node.returnTypeFqn !== '' &&
        node.parameterFqns.length === 0
    );
  }

  private isFactoryMethod(method: MethodNode, product: InterfaceNode): boolean {
    return (
      this.hasExactlyModifiers(method.modifiers, ['PUBLIC']) &&
      method.returnTypeFqn === product.fqn
    );
  }

  private hasImplementation(
    edges: CodebaseASG['edges'],
    interfaceNode: InterfaceNode,
    classNode: ClassNode
  ): boolean {
    return edges.some(
      (edge): edge is ImplementsEdge =>
        edge.type === 'IMPLEMENTS' &&
        edge.interfaceFqn === interfaceNode.fqn &&
        edge.implementingClassFqn === classNode.fqn
    );
  }

  private hasMethod(
    edges: CodebaseASG['edges'],
    owner: InterfaceNode | ClassNode,
    method: MethodNode
  ): boolean {
    return edges.some(
      (edge): edge is HasMethodEdge =>
        edge.type === 'HAS_METHOD' &&
        edge.ownerFqn === owner.fqn &&
        edge.methodFqn === method.fqn
    );
  }
}
