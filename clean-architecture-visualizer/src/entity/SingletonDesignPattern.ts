import type { HasFieldEdge, HasMethodEdge } from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  FieldNode,
  MethodNode,
} from '../types/codebaseASGNodes.js';
import type { PatternDefinition } from '../types/patternDefinition.js';
import type { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternID } from './PatternID.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';

export class SingletonDesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternID.Singleton) {
      throw new Error(
        `Invalid pattern ID for SingletonDesignPattern: ${data.id}`
      );
    }

    if (data.metadata.patternName !== PatternName.Singleton) {
      throw new Error(
        `Invalid pattern name for SingletonDesignPattern: ${data.metadata.patternName}`
      );
    }

    if (data.metadata.patternType !== PatternType.DesignPattern) {
      throw new Error(
        `Invalid pattern type for SingletonDesignPattern: ${data.metadata.patternType}`
      );
    }

    super(data);
  }

  /**
   * Verifies the singleton structure by checking its shape, members, and
   * ownership edges.
   */
  candidateVerification(candidateASG: CodebaseASG): boolean {
    const nodes = candidateASG.getNodes();
    const edges = candidateASG.getEdges();
    if (nodes.length !== 3 || edges.length !== 2) {
      return false;
    }

    const singletonNodes = this.getSingletonNodes(nodes);
    if (!singletonNodes) {
      return false;
    }

    const { classNode, fieldNode, methodNode } = singletonNodes;
    // Verify member semantics first, then confirm both ownership relationships.
    return (
      this.isValidInstanceField(fieldNode, classNode) &&
      this.isValidAccessorMethod(methodNode, classNode) &&
      this.hasRequiredEdges(edges, classNode, fieldNode, methodNode)
    );
  }

  /** Extracts the unique class, field, and method required by a singleton. */
  private getSingletonNodes(nodes: CodebaseASG['nodes']): {
    classNode: ClassNode;
    fieldNode: FieldNode;
    methodNode: MethodNode;
  } | undefined {
    const classNodes = nodes.filter(
      (node): node is ClassNode => node.type === 'CLASS'
    );
    const fieldNodes = nodes.filter(
      (node): node is FieldNode => node.type === 'FIELD'
    );
    const methodNodes = nodes.filter(
      (node): node is MethodNode => node.type === 'METHOD'
    );
    if (
      classNodes.length !== 1 ||
      fieldNodes.length !== 1 ||
      methodNodes.length !== 1
    ) {
      return undefined;
    }

    const [classNode] = classNodes;
    const [fieldNode] = fieldNodes;
    const [methodNode] = methodNodes;
    return { classNode, fieldNode, methodNode };
  }

  /** Checks that the instance field has the required name, type, and modifiers. */
  private isValidInstanceField(
    fieldNode: FieldNode,
    classNode: ClassNode
  ): boolean {
    return (
      fieldNode.name === 'instance' &&
      this.hasExactlyModifiers(fieldNode.modifiers, ['PRIVATE', 'STATIC']) &&
      fieldNode.typeFqn === classNode.fqn
    );
  }

  /** Checks that the accessor has the required name, signature, and modifiers. */
  private isValidAccessorMethod(
    methodNode: MethodNode,
    classNode: ClassNode
  ): boolean {
    return (
      methodNode.name === 'getInstance' &&
      this.hasExactlyModifiers(methodNode.modifiers, ['PUBLIC', 'STATIC']) &&
      methodNode.parameterFqns.length === 0 &&
      methodNode.returnTypeFqn === classNode.fqn
    );
  }

  /** Confirms that the class owns the required field and accessor edges. */
  private hasRequiredEdges(
    edges: CodebaseASG['edges'],
    classNode: ClassNode,
    fieldNode: FieldNode,
    methodNode: MethodNode
  ): boolean {
    const hasFieldEdge = edges.some(
      (edge): edge is HasFieldEdge =>
        edge.type === 'HAS_FIELD' &&
        edge.ownerFqn === classNode.fqn &&
        edge.fieldFqn === fieldNode.fqn
    );
    const hasMethodEdge = edges.some(
      (edge): edge is HasMethodEdge =>
        edge.type === 'HAS_METHOD' &&
        edge.ownerFqn === classNode.fqn &&
        edge.methodFqn === methodNode.fqn
    );

    return hasFieldEdge && hasMethodEdge;
  }
}
