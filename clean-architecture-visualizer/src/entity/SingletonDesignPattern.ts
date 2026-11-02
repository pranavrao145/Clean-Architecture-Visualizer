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

  candidateVerification(candidateASG: CodebaseASG): boolean {
    // A verified candidate must contain exactly the class, field, and method
    // described by the singleton topology, with no ambiguous alternatives.
    const nodes = candidateASG.getNodes();
    const edges = candidateASG.getEdges();
    if (nodes.length !== 3 || edges.length !== 2) {
      return false;
    }

    // Identify each required node by its ASG type before applying semantics.
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
      return false;
    }

    const [classNode] = classNodes;
    const [fieldNode] = fieldNodes;
    const [methodNode] = methodNodes;

    // The state field must be private, static, and hold this class's instance.
    if (
      fieldNode.name !== 'instance' ||
      !this.hasExactlyModifiers(fieldNode.modifiers, ['PRIVATE', 'STATIC']) ||
      fieldNode.typeFqn !== classNode.fqn
    ) {
      return false;
    }

    // The accessor must be public, static, parameterless, and return this class.
    if (
      methodNode.name !== 'getInstance' ||
      !this.hasExactlyModifiers(methodNode.modifiers, ['PUBLIC', 'STATIC']) ||
      methodNode.parameterFqns.length !== 0 ||
      methodNode.returnTypeFqn !== classNode.fqn
    ) {
      return false;
    }

    // Both ownership edges must connect the class to the corresponding member.
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
