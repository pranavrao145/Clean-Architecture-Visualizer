import type {
  CallsEdge,
  CodebaseASGEdge,
  HasMethodEdge,
} from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  CodebaseASGNode,
  MethodNode,
} from '../types/codebaseASGNodes.js';
import type { PatternDefinition } from '../types/patternDefinition.js';
import { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternId } from './PatternId.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';

/**
 * The fewest distinct methods a method must call from inside its conditionals
 * before its conditional logic counts as long.
 */
export const MIN_CONDITIONAL_CALLS = 4;

export class LongConditionalAntiPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternId.LongConditional) {
      throw new Error(
        `Invalid pattern ID for LongConditionalAntiPattern: ${data.id}`
      );
    }

    if (data.metadata.patternName !== PatternName.LongConditional) {
      throw new Error(
        `Invalid pattern name for LongConditionalAntiPattern: ${data.metadata.patternName}`
      );
    }

    if (data.metadata.patternType !== PatternType.AntiPattern) {
      throw new Error(
        `Invalid pattern type for LongConditionalAntiPattern: ${data.metadata.patternType}`
      );
    }

    super(data);
  }

  /**
   * The topology matches one conditional call at a time, so a method with many
   * branches would show up once per call. This merges those matches into one
   * candidate per method, holding every conditional call it makes.
   */
  override candidateIdentification(
    fullCodebaseAsg: CodebaseASG
  ): CodebaseASG[] {
    const merged = new Map<
      string,
      { nodes: CodebaseASGNode[]; edges: CodebaseASGEdge[] }
    >();

    for (const candidate of super.candidateIdentification(fullCodebaseAsg)) {
      const nodes = candidate.getNodes();
      const edges = candidate.getEdges();
      const key = nodes.map((node) => node.fqn).join('|');
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { nodes: [...nodes], edges: [...edges] });
        continue;
      }
      for (const edge of edges) {
        if (!existing.edges.includes(edge)) {
          existing.edges.push(edge);
        }
      }
    }

    return [...merged.values()].map(
      ({ nodes, edges }) => new CodebaseASG(nodes, edges)
    );
  }

  /**
   * Accepts a class method whose conditionals call at least
   * MIN_CONDITIONAL_CALLS distinct methods, ignoring constructor calls.
   */
  candidateVerification(candidateAsg: CodebaseASG): boolean {
    const nodes = candidateAsg.getNodes();
    const edges = candidateAsg.getEdges();
    if (nodes.length !== 2) {
      return false;
    }

    const classNode = nodes.find(
      (node): node is ClassNode => node.type === 'CLASS'
    );
    const methodNode = nodes.find(
      (node): node is MethodNode => node.type === 'METHOD'
    );
    if (!classNode || !methodNode) {
      return false;
    }

    return (
      this.hasOwnershipEdge(edges, classNode, methodNode) &&
      this.countConditionalCalls(edges, methodNode) >= MIN_CONDITIONAL_CALLS
    );
  }

  /** Confirms that the class owns the method. */
  private hasOwnershipEdge(
    edges: CodebaseASGEdge[],
    classNode: ClassNode,
    methodNode: MethodNode
  ): boolean {
    return edges.some(
      (edge): edge is HasMethodEdge =>
        edge.type === 'HAS_METHOD' &&
        edge.ownerFqn === classNode.fqn &&
        edge.methodFqn === methodNode.fqn
    );
  }

  /**
   * Counts the distinct methods called from inside the method's conditionals.
   * Calling the same method in several branches counts once, as those
   * branches don't behave differently.
   */
  private countConditionalCalls(
    edges: CodebaseASGEdge[],
    methodNode: MethodNode
  ): number {
    const calledMethodFqns = edges
      .filter(
        (edge): edge is CallsEdge =>
          edge.type === 'CALLS' &&
          edge.callingMethodFqn === methodNode.fqn &&
          edge.insideConditional &&
          !edge.isConstructorCall
      )
      .map((edge) => edge.calledMethodFqn);

    return new Set(calledMethodFqns).size;
  }
}
