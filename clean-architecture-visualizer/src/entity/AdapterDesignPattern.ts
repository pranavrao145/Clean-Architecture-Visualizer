import type { PatternDefinition } from "../types/patternDefinition.js";
import type {
  HasFieldEdge,
  ImplementsEdge,
} from "../types/codebaseASGEdges.js";
import type {
  ClassNode,
  FieldNode,
  InterfaceNode,
  MethodNode,
} from "../types/codebaseASGNodes.js";
import type { CodebaseASG } from "./CodebaseASG.js";
import { Pattern } from "./Pattern.js";
import { PatternId } from "./PatternId.js";
import { PatternName } from "./PatternName.js";
import { PatternType } from "./PatternType.js";

export class AdapterDesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternId.Adapter) {
      throw new Error(
        `Invalid pattern ID for AdapterDesignPattern: ${data.id}`,
      );
    }

    if (data.metadata.patternName !== PatternName.Adapter) {
      throw new Error(
        `Invalid pattern name for AdapterDesignPattern: ${data.metadata.patternName}`,
      );
    }

    if (data.metadata.patternType !== PatternType.DesignPattern) {
      throw new Error(
        `Invalid pattern type for AdapterDesignPattern: ${data.metadata.patternType}`,
      );
    }

    super(data);
  }

  /**
   * Verifies either form of object adapter. With an IMPLEMENTS edge, the
   * target is that interface (e.g. a presenter adapting an output boundary).
   * Without one, the target is the adapter's own public API (e.g. a
   * controller adapting view input to an input boundary).
   */
  candidateVerification(candidate: CodebaseASG): boolean {
    const nodes = candidate.getNodes();
    const edges = candidate.getEdges();
    const field = nodes.find(
      (node): node is FieldNode => node.type === "FIELD",
    );
    const hasField = edges.find(
      (edge): edge is HasFieldEdge =>
        edge.type === "HAS_FIELD" && edge.fieldFqn === field?.fqn,
    );
    const adapter = nodes.find(
      (node): node is ClassNode =>
        node.type === "CLASS" && node.fqn === hasField?.ownerFqn,
    );
    const adaptee = nodes.find(
      (node): node is ClassNode | InterfaceNode =>
        (node.type === "CLASS" || node.type === "INTERFACE") &&
        node.fqn === field?.typeFqn,
    );

    if (!field || !adapter || !adaptee || adaptee.fqn === adapter.fqn) {
      return false;
    }

    const implementation = edges.find(
      (edge): edge is ImplementsEdge =>
        edge.type === "IMPLEMENTS" &&
        edge.implementingClassFqn === adapter.fqn,
    );

    return implementation
      ? this.verifyExplicitTarget(candidate, field, adaptee, implementation)
      : this.verifyImplicitTarget(candidate, field, adapter);
  }

  /**
   * Verifies an adapter with no target interface. The topology already
   * guarantees that the adapter has no supertype besides Object (which
   * excludes e.g. interactors implementing an input boundary) and wraps a
   * class or interface held in a field.
   */
  private verifyImplicitTarget(
    candidate: CodebaseASG,
    field: FieldNode,
    adapter: ClassNode,
  ): boolean {
    const edges = candidate.getEdges();

    // Check 1: the adapter's own instance methods form the target API.
    const targetMethods = candidate
      .getNodes()
      .filter(
        (node): node is MethodNode =>
          node.type === "METHOD" &&
          !node.modifiers.includes("PRIVATE") &&
          !node.modifiers.includes("STATIC") &&
          edges.some(
            (edge) =>
              edge.type === "HAS_METHOD" &&
              edge.ownerFqn === adapter.fqn &&
              edge.methodFqn === node.fqn &&
              edge.isInherited !== true,
          ),
      );

    // Check 2: every one of them delegates through the adaptee field (this
    // excludes e.g. builders whose methods use several different fields).
    return (
      targetMethods.length > 0 &&
      targetMethods.every((method) =>
        edges.some(
          (edge) =>
            edge.type === "CALLS" &&
            edge.callingMethodFqn === method.fqn &&
            edge.targetObjectFqn === field.fqn &&
            !edge.isConstructorCall &&
            !edge.isStaticCall,
        ),
      )
    );
  }

  private verifyExplicitTarget(
    candidate: CodebaseASG,
    field: FieldNode,
    adaptee: ClassNode | InterfaceNode,
    implementation: ImplementsEdge,
  ): boolean {
    const nodes = candidate.getNodes();
    const edges = candidate.getEdges();
    const target = nodes.find(
      (node): node is InterfaceNode =>
        node.type === "INTERFACE" && node.fqn === implementation.interfaceFqn,
    );
    const methods = nodes.filter(
      (node): node is MethodNode => node.type === "METHOD",
    );

    // Check 1: the adaptee must be a class other than the adapter that does
    // not implement the target
    if (
      !target ||
      adaptee.type !== "CLASS" ||
      adaptee.supertypeFqns.includes(target.fqn)
    ) {
      return false;
    }

    // identify target instance methods in the merged candidate graph
    const targetMethods = methods.filter(
      (method) =>
        !method.modifiers.includes("PRIVATE") &&
        !method.modifiers.includes("STATIC") &&
        edges.some(
          (edge) =>
            edge.type === "HAS_METHOD" &&
            edge.ownerFqn === target.fqn &&
            edge.methodFqn === method.fqn,
        ),
    );

    // Check 2: every target method needs a non-abstract, non-static mapped
    // implementation.
    return targetMethods.every((targetMethod) =>
      implementation.methodImplementations.some((mapping) => {
        if (mapping.interfaceMethodFqn !== targetMethod.fqn) return false;

        const concreteImplementation = methods.some(
          (method) =>
            method.fqn === mapping.implementationMethodFqn &&
            !method.modifiers.includes("ABSTRACT") &&
            !method.modifiers.includes("STATIC"),
        );

        // Check 3: calls collected inside the adapter are non-static,
        // non-constructor calls through the class field containing the
        // adaptee.
        const delegates = edges.some(
          (call) =>
            call.type === "CALLS" &&
            call.callingMethodFqn === mapping.implementationMethodFqn &&
            call.targetObjectFqn === field.fqn,
        );

        return concreteImplementation && delegates;
      }),
    );
  }
}
