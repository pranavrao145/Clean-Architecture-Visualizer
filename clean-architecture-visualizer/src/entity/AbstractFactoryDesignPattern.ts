import type {
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
    // Identify interfaces, creation methods, and which interfaces represent
    //  the abstract factory versus its abstract products.
    const interfaces = nodes.filter(
      (node): node is InterfaceNode => node.type === 'INTERFACE'
    );
    const factoryMethods = nodes.filter(
      (node): node is MethodNode =>
        node.type === 'METHOD' && node.name.startsWith('create')
    );
    const factoryInterfaces = interfaces.filter((factory) =>
      factoryMethods.some((method) => method.fqn.startsWith(`${factory.fqn}.`))
    );
    const productInterfaces = interfaces.filter(
      (product) => !factoryInterfaces.includes(product)
    );
    const abstractFactoryMethods = factoryMethods.filter((method) =>
      factoryInterfaces.some((factory) =>
        method.fqn.startsWith(`${factory.fqn}.`)
      )
    );

    // A factory must expose creation methods and return abstract products.
    if (factoryMethods.length === 0 || productInterfaces.length === 0) {
      return false;
    }

    // Every abstract factory method must have a concrete factory counterpart
    //  that creates the same product family member.
    return factoryMethods.every((method) => this.isFactoryMethod(method, productInterfaces)) &&
      abstractFactoryMethods.every((method) =>
        factoryMethods.some(
          (concreteMethod) =>
            concreteMethod !== method &&
            concreteMethod.name === method.name &&
            concreteMethod.returnTypeFqn === method.returnTypeFqn &&
            concreteMethod.fqn !== method.fqn
        )
      );
  }

  private isFactoryMethod(
    method: MethodNode,
    productInterfaces: InterfaceNode[]
  ): boolean {
    // Creation methods are public, parameterless, non-static API methods whose
    //  return types are abstract product interfaces.
    return (
      method.parameterFqns.length === 0 &&
      method.modifiers.includes('PUBLIC') &&
      !method.modifiers.some((modifier) =>
        ['PRIVATE', 'PROTECTED', 'STATIC', 'FINAL'].includes(modifier)
      ) &&
      productInterfaces.some((product) => product.fqn === method.returnTypeFqn)
    );
  }
}
