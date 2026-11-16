import type { PatternDefinition } from "../types/patternDefinition.js";
import type { ImplementsEdge } from "../types/codebaseASGEdges.js";
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
    const interfaces = nodes.filter(
      (node): node is InterfaceNode => node.type === "INTERFACE",
    );
    const classes = nodes.filter(
      (node): node is ClassNode => node.type === "CLASS",
    );
    const fields = nodes.filter(
      (node): node is FieldNode => node.type === "FIELD",
    );
    const methods = nodes.filter(
      (node): node is MethodNode => node.type === "METHOD",
    );

    if (
      interfaces.length !== 1 ||
      classes.length !== 2 ||
      fields.length !== 1 ||
      nodes.length !==
        interfaces.length + classes.length + fields.length + methods.length
    ) {
      return false;
    }

    const [target] = interfaces;
    const [field] = fields;
    const adaptee = classes.find((node) => node.fqn === field.typeFqn);
    const adapter = classes.find((node) => node.fqn !== field.typeFqn);

    const implementation = edges.find(
      (edge): edge is ImplementsEdge =>
        edge.type === "IMPLEMENTS" &&
        edge.interfaceFqn === target.fqn &&
        edge.implementingClassFqn === adapter?.fqn,
    );

    if (
      !adapter ||
      !adaptee ||
      adaptee.supertypeFqns.includes(target.fqn) ||
      !implementation ||
      !edges.some(
        (edge) =>
          edge.type === "HAS_FIELD" &&
          edge.ownerFqn === adapter.fqn &&
          edge.fieldFqn === field.fqn,
      )
    ) {
      return false;
    }

    const targetMethods = methods.filter(
      (method) =>
        !method.modifiers.includes("PRIVATE") &&
        !method.modifiers.includes("STATIC") &&
        edges.some((edge) => edge.type === "HAS_METHOD" &&
          edge.ownerFqn === target.fqn && edge.methodFqn === method.fqn),
    );
    if (targetMethods.length === 0) return false;

    // Collect target methods independently so a missing implementation or call
    // cannot disappear from the set of obligations being checked.
    return targetMethods.every(
      (targetMethod) =>
        implementation.methodImplementations.some(
          (mapping) =>
            mapping.interfaceMethodFqn === targetMethod.fqn &&
            methods.some(
              (method) =>
                method.fqn === mapping.implementationMethodFqn &&
                !method.modifiers.includes("ABSTRACT") &&
                !method.modifiers.includes("STATIC") &&
                edges.some((edge) => edge.type === "HAS_METHOD" &&
                  edge.ownerFqn === adapter.fqn && edge.methodFqn === method.fqn),
            ) &&
            edges.some(
              (call) =>
                call.type === "CALLS" &&
                call.callingMethodFqn ===
                  mapping.implementationMethodFqn &&
                call.targetObjectFqn === field.fqn &&
                !call.isConstructorCall &&
                call.isStaticCall === false,
            ),
        ),
    );
  }
}
