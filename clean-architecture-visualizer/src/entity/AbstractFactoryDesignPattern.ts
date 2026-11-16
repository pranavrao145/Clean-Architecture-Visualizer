import type {
  CallsEdge,
  HasFieldEdge,
  ImplementsEdge,
} from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  FieldNode,
  InterfaceNode,
  MethodNode,
} from '../types/codebaseASGNodes.js';
import type { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternId } from './PatternId.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';
import type { PatternDefinition } from '../types/patternDefinition.js';

export class AbstractFactoryDesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternId.AbstractFactory) {
      throw new Error(
        `Invalid pattern ID for AbstractFactoryDesignPattern: ${data.id}`,
      );
    }

    if (data.metadata.patternName !== PatternName.AbstractFactory) {
      throw new Error(
        `Invalid pattern name for AbstractFactoryDesignPattern: ${data.metadata.patternName}`,
      );
    }

    if (data.metadata.patternType !== PatternType.DesignPattern) {
      throw new Error(
        `Invalid pattern type for AbstractFactoryDesignPattern: ${data.metadata.patternType}`,
      );
    }

    super(data);
  }

  candidateVerification(candidate: CodebaseASG): boolean {
    const nodes = candidate.getNodes();
    const edges = candidate.getEdges();
    if (nodes.length !== 18) {
      return false;
    }

    const interfaces = nodes.filter(
      (node): node is InterfaceNode => node.type === 'INTERFACE',
    );
    const classes = nodes.filter(
      (node): node is ClassNode => node.type === 'CLASS',
    );
    const fields = nodes.filter(
      (node): node is FieldNode => node.type === 'FIELD',
    );
    const methods = nodes.filter(
      (node): node is MethodNode => node.type === 'METHOD',
    );
    if (
      interfaces.length !== 3 ||
      classes.length !== 7 ||
      fields.length !== 1 ||
      methods.length !== 7
    ) {
      return false;
    }

    const factoryField = fields[0];
    const abstractFactory = interfaces.find(
      (interfaceNode) => interfaceNode.fqn === factoryField.typeFqn,
    );
    if (!abstractFactory) {
      return false;
    }

    const productInterfaces = interfaces.filter(
      (interfaceNode) => interfaceNode.fqn !== abstractFactory.fqn,
    );
    const factoryImplementations = this.implementationsOf(
      edges,
      abstractFactory.fqn,
    );
    if (
      factoryImplementations.length !== 2 ||
      new Set(factoryImplementations.map((edge) => edge.implementingClassFqn))
        .size !== 2
    ) {
      return false;
    }

    const factoryClasses = classes.filter((classNode) =>
      factoryImplementations.some(
        (edge) => edge.implementingClassFqn === classNode.fqn,
      ),
    );
    const clientOwner = edges.find(
      (edge): edge is HasFieldEdge =>
        edge.type === 'HAS_FIELD' && edge.fieldFqn === factoryField.fqn,
    )?.ownerFqn;
    const client = classes.find(
      (classNode) => classNode.fqn === clientOwner,
    );
    if (!client) {
      return false;
    }

    const abstractFactoryMethods = methods.filter((method) =>
      edges.some(
        (edge) =>
          edge.type === 'HAS_METHOD' &&
          edge.ownerFqn === abstractFactory.fqn &&
          edge.methodFqn === method.fqn,
      ),
    );
    if (
      abstractFactoryMethods.length !== 2 ||
      abstractFactoryMethods.some(
        (method) =>
          !productInterfaces.some(
            (productInterface) =>
              productInterface.fqn === method.returnTypeFqn,
          ),
      )
    ) {
      return false;
    }

    if (
      !this.hasFactoryMethods(
        methods,
        edges,
        factoryImplementations,
        abstractFactoryMethods,
      )
    ) {
      return false;
    }

    const productImplementations = edges.filter(
      (edge): edge is ImplementsEdge =>
        edge.type === 'IMPLEMENTS' &&
        productInterfaces.some(
          (productInterface) => productInterface.fqn === edge.interfaceFqn,
        ),
    );
    if (
      productImplementations.length !== 4 ||
      productImplementations.some(
        (edge) =>
          !classes.some(
            (classNode) => classNode.fqn === edge.implementingClassFqn,
          ),
      )
    ) {
      return false;
    }

    const clientMethod = methods.find((method) =>
      edges.some(
        (edge) =>
          edge.type === 'HAS_METHOD' &&
          edge.ownerFqn === client.fqn &&
          edge.methodFqn === method.fqn,
      ),
    );
    if (!clientMethod) {
      return false;
    }

    const calls = edges.filter((edge): edge is CallsEdge => edge.type === 'CALLS');
    const factoryMethods = factoryImplementations.flatMap((implementation) =>
      implementation.methodImplementations.map(
        (mapping) => mapping.implementationMethodFqn,
      ),
    );
    const factoryCalls = calls.filter((call) =>
      factoryMethods.includes(call.callingMethodFqn),
    );
    if (
      factoryCalls.length !== 4 ||
      factoryCalls.some(
        (call) =>
          !call.isConstructorCall ||
          call.isStaticCall ||
          call.insideLoop ||
          call.insideConditional ||
          !call.calledMethodFqn ||
          !classes.some(
            (classNode) => classNode.fqn === call.targetObjectFqn,
          ) ||
          !productImplementations.some(
            (implementation) =>
              implementation.implementingClassFqn === call.targetObjectFqn,
          ),
      )
    ) {
      return false;
    }

    if (
      edges.some((edge) => edge.type === 'MUTATES_FIELD') ||
      !factoryImplementations.every((implementation) =>
        implementation.methodImplementations.every((mapping) => {
          const abstractMethod = abstractFactoryMethods.find(
            (method) => method.fqn === mapping.interfaceMethodFqn,
          );
          const call = factoryCalls.find(
            (candidate) =>
              candidate.callingMethodFqn ===
              mapping.implementationMethodFqn,
          );
          if (!abstractMethod || !call) {
            return false;
          }

          return productImplementations.some(
            (productImplementation) =>
              productImplementation.implementingClassFqn ===
                call.targetObjectFqn &&
              productImplementation.interfaceFqn ===
                abstractMethod.returnTypeFqn,
          );
        }),
      )
    ) {
      return false;
    }

    const clientCalls = calls.filter(
      (call) => call.callingMethodFqn === clientMethod.fqn,
    );
    return (
      clientCalls.length === 2 &&
      clientCalls.every(
        (call) =>
          call.targetObjectFqn === factoryField.fqn &&
          !call.isConstructorCall &&
          !call.isStaticCall &&
          !call.insideLoop &&
          !call.insideConditional &&
          abstractFactoryMethods.some(
            (method) => method.fqn === call.calledMethodFqn,
          ),
      )
    );
  }

  private implementationsOf(
    edges: CodebaseASG['edges'],
    interfaceFqn: string,
  ): ImplementsEdge[] {
    return edges.filter(
      (edge): edge is ImplementsEdge =>
        edge.type === 'IMPLEMENTS' && edge.interfaceFqn === interfaceFqn,
    );
  }

  private hasFactoryMethods(
    methods: MethodNode[],
    edges: CodebaseASG['edges'],
    implementations: ImplementsEdge[],
    abstractMethods: MethodNode[],
  ): boolean {
    return implementations.every((implementation) => {
      if (implementation.methodImplementations.length !== 2) {
        return false;
      }

      return abstractMethods.every((abstractMethod) => {
        const mapping = implementation.methodImplementations.find(
          (candidate) =>
            candidate.interfaceMethodFqn === abstractMethod.fqn,
        );
        if (!mapping) {
          return false;
        }

        const concreteMethod = methods.find(
          (method) => method.fqn === mapping.implementationMethodFqn,
        );
        return (
          concreteMethod !== undefined &&
          concreteMethod.returnTypeFqn === abstractMethod.returnTypeFqn &&
          !concreteMethod.modifiers.includes('ABSTRACT') &&
          !concreteMethod.modifiers.includes('STATIC') &&
          edges.some(
            (edge) =>
              edge.type === 'HAS_METHOD' &&
              edge.ownerFqn === implementation.implementingClassFqn &&
              edge.methodFqn === concreteMethod.fqn,
          )
        );
      });
    });
  }
}
