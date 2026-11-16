import type { PatternDefinition } from "../types/patternDefinition.js";
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

  candidateVerification(candidate: CodebaseASG): boolean {
    const nodes = candidate.getNodes();
    const edges = candidate.getEdges();
    const target = nodes.find(
      (node): node is InterfaceNode => node.type === "INTERFACE",
    );
    const field = nodes.find(
      (node): node is FieldNode => node.type === "FIELD",
    );
    const implementation = edges.find((edge) => edge.type === "IMPLEMENTS");
    const methods = nodes.filter(
      (node): node is MethodNode => node.type === "METHOD",
    );

    if (!target || !field || !implementation) {
      return false;
    }

    const adaptee = nodes.find(
      (node): node is ClassNode =>
        node.type === "CLASS" && node.fqn === field.typeFqn,
    );

    // Check 1: the adaptee must differ from the adapter and not implement the
    // target
    if (
      !adaptee ||
      adaptee.fqn === implementation.implementingClassFqn ||
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
            call.callingMethodFqn === mapping.implementationMethodFqn,
        );

        return concreteImplementation && delegates;
      }),
    );
  }
}
