import type {
  CallsEdge,
  HasFieldEdge,
  HasMethodEdge,
  ImplementsEdge,
  MutatesFieldEdge,
} from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  FieldNode,
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

    const interfaces = nodes.filter(
      (node): node is InterfaceNode => node.type === 'INTERFACE'
    );
    const classes = nodes.filter(
      (node): node is ClassNode => node.type === 'CLASS'
    );
    const fields = nodes.filter(
      (node): node is FieldNode => node.type === 'FIELD'
    );
    const methods = nodes.filter(
      (node): node is MethodNode => node.type === 'METHOD'
    );

    if (
      nodes.length !== 18 ||
      interfaces.length !== 3 ||
      classes.length !== 7 ||
      fields.length !== 1 ||
      methods.length !== 7
    ) {
      return false;
    }

    const abstractFactory = interfaces.find((node) =>
      edges.some(
        (edge): edge is HasMethodEdge =>
          edge.type === 'HAS_METHOD' &&
          edge.ownerFqn === node.fqn &&
          methods.some((method) => method.fqn === edge.methodFqn)
      )
    );
    if (!abstractFactory) {
      return false;
    }

    const abstractMethods = edges
      .filter(
        (edge): edge is HasMethodEdge =>
          edge.type === 'HAS_METHOD' &&
          edge.ownerFqn === abstractFactory.fqn
      )
      .map((edge) => methods.find((method) => method.fqn === edge.methodFqn))
      .filter((method): method is MethodNode => method !== undefined);

    const productInterfaces = interfaces.filter(
      (node) => node.fqn !== abstractFactory.fqn
    );
    if (
      abstractMethods.length !== 2 ||
      productInterfaces.length !== 2 ||
      new Set(abstractMethods.map((method) => method.fqn)).size !== 2 ||
      new Set(abstractMethods.map((method) => method.returnTypeFqn)).size !== 2
    ) {
      return false;
    }

    if (
      !abstractMethods.every(
        (method) =>
          method.parameterFqns.length === 0 &&
          this.hasExactlyModifiers(method.modifiers, ['PUBLIC', 'ABSTRACT']) &&
          productInterfaces.some(
            (product) => product.fqn === method.returnTypeFqn
          )
      )
    ) {
      return false;
    }

    const factoryImplementationEdges = edges.filter(
      (edge): edge is ImplementsEdge =>
        edge.type === 'IMPLEMENTS' &&
        edge.interfaceFqn === abstractFactory.fqn
    );
    if (factoryImplementationEdges.length !== 2) {
      return false;
    }

    const concreteFactories = factoryImplementationEdges.map((edge) =>
      classes.find((node) => node.fqn === edge.implementingClassFqn)
    );
    if (
      concreteFactories.length !== 2 ||
      concreteFactories.some((factory) => factory === undefined) ||
      new Set(concreteFactories.map((factory) => factory?.fqn)).size !== 2
    ) {
      return false;
    }

    const concreteMethods = edges
      .filter(
        (edge): edge is HasMethodEdge =>
          edge.type === 'HAS_METHOD' &&
          concreteFactories.some(
            (factory) => factory?.fqn === edge.ownerFqn
          )
      )
      .map((edge) => methods.find((method) => method.fqn === edge.methodFqn))
      .filter((method): method is MethodNode => method !== undefined);
    if (
      concreteMethods.length !== 4 ||
      new Set(concreteMethods.map((method) => method.fqn)).size !== 4
    ) {
      return false;
    }

    for (const concreteMethod of concreteMethods) {
      const abstractMethod = abstractMethods.find(
        (method) =>
          method.name === concreteMethod.name &&
          method.parameterFqns.length === concreteMethod.parameterFqns.length &&
          method.parameterFqns.every(
            (parameter, index) =>
              concreteMethod.parameterFqns[index] === parameter
          )
      );
      if (
        !abstractMethod ||
        concreteMethod.returnTypeFqn !== abstractMethod.returnTypeFqn ||
        !this.hasExactlyModifiers(concreteMethod.modifiers, ['PUBLIC'])
      ) {
        return false;
      }
    }

    for (const factory of concreteFactories) {
      if (!factory) return false;
      const implementedMethods = edges
        .filter(
          (edge): edge is HasMethodEdge =>
            edge.type === 'HAS_METHOD' &&
            edge.ownerFqn === factory.fqn
        )
        .map((edge) =>
          methods.find((method) => method.fqn === edge.methodFqn)
        )
        .filter((method): method is MethodNode => method !== undefined);
      if (
        implementedMethods.length !== 2 ||
        new Set(implementedMethods.map((method) => method.name)).size !== 2
      ) {
        return false;
      }
    }

    const productImplementationEdges = edges.filter(
      (edge): edge is ImplementsEdge =>
        edge.type === 'IMPLEMENTS' &&
        productInterfaces.some((product) => product.fqn === edge.interfaceFqn)
    );
    if (productImplementationEdges.length !== 4) {
      return false;
    }
    for (const productInterface of productInterfaces) {
      const products = productImplementationEdges
        .filter((edge) => edge.interfaceFqn === productInterface.fqn)
        .map((edge) =>
          classes.find((node) => node.fqn === edge.implementingClassFqn)
        )
        .filter((node): node is ClassNode => node !== undefined);
      if (products.length !== 2) {
        return false;
      }
    }

    const mutates = edges.filter(
      (edge): edge is MutatesFieldEdge => edge.type === 'MUTATES_FIELD'
    );
    if (mutates.length !== 0) {
      return false;
    }

    const callEdges = edges.filter(
      (edge): edge is CallsEdge => edge.type === 'CALLS'
    );
    const concreteCalls = callEdges.filter(
      (edge) =>
        edge.isConstructorCall &&
        concreteMethods.some((method) => method.fqn === edge.callingMethodFqn)
    );
    if (
      callEdges.length !== 6 ||
      concreteCalls.length !== 4 ||
      concreteCalls.some(
        (edge) =>
          edge.insideLoop ||
          edge.insideConditional ||
          !classes.some((node) => node.fqn === edge.targetObjectFqn)
      )
    ) {
      return false;
    }

    for (const concreteMethod of concreteMethods) {
      const methodCalls = concreteCalls.filter(
        (edge) => edge.callingMethodFqn === concreteMethod.fqn
      );
      if (methodCalls.length !== 1) {
        return false;
      }
      const constructedProduct = classes.find(
        (node) => node.fqn === methodCalls[0].targetObjectFqn
      );
      if (
        !constructedProduct ||
        !productImplementationEdges.some(
          (edge) =>
            edge.implementingClassFqn === constructedProduct.fqn &&
            edge.interfaceFqn === concreteMethod.returnTypeFqn
        )
      ) {
        return false;
      }
    }

    const clientField = fields[0];
    if (clientField.typeFqn !== abstractFactory.fqn) {
      return false;
    }
    const clientFieldOwner = edges.find(
      (edge): edge is HasFieldEdge =>
        edge.type === 'HAS_FIELD' && edge.fieldFqn === clientField.fqn
    );
    if (!clientFieldOwner) {
      return false;
    }
    const clientClass = classes.find(
      (node) => node.fqn === clientFieldOwner.ownerFqn
    );
    if (!clientClass) {
      return false;
    }
    const clientMethod = methods.find((method) =>
      edges.some(
        (edge): edge is HasMethodEdge =>
          edge.type === 'HAS_METHOD' &&
          edge.ownerFqn === clientClass.fqn &&
          edge.methodFqn === method.fqn
      )
    );
    if (!clientMethod) {
      return false;
    }

    const clientCalls = callEdges.filter(
      (edge) =>
        edge.callingMethodFqn === clientMethod.fqn &&
        !edge.isConstructorCall
    );
    if (
      clientCalls.length !== 2 ||
      clientCalls.some(
        (edge) =>
          edge.targetObjectFqn !== clientField.fqn ||
          edge.insideLoop ||
          edge.insideConditional ||
          !abstractMethods.some(
            (method) => method.fqn === edge.calledMethodFqn
          )
      )
    ) {
      return false;
    }

    return new Set(clientCalls.map((edge) => edge.calledMethodFqn)).size === 2;
  }
}
