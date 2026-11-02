import type { CodebaseASGEdge } from '../types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../types/codebaseASGNodes.js';
import type { PatternDefinition } from '../types/patternDefinition.js';
import { CodebaseASG } from './CodebaseASG.js';

type Bindings = Map<string, string>;

export abstract class Pattern {
  readonly data: PatternDefinition;

  constructor(data: PatternDefinition) {
    this.data = data;
  }

  /**
   * Finds every subgraph matching the pattern topology by backtracking through
   * candidate nodes and then matching the corresponding edges.
   */
  candidateIdentification(fullCodebaseASG: CodebaseASG): CodebaseASG[] {
    const topology = this.data.candidateTopology;
    const matches: CodebaseASG[] = [];

    this.findNodeMatches(
      fullCodebaseASG,
      topology,
      matches,
      0,
      [],
      new Set(),
      new Map()
    );
    return matches;
  }

  /**
   * Recursively selects distinct ASG nodes and carries successful placeholder
   * bindings into the edge-matching phase.
   */
  private findNodeMatches(
    fullCodebaseASG: CodebaseASG,
    topology: PatternDefinition['candidateTopology'],
    matches: CodebaseASG[],
    patternIndex: number,
    selectedNodes: CodebaseASGNode[],
    usedNodeIndexes: Set<number>,
    bindings: Bindings
  ): void {
    if (patternIndex === topology.nodes.length) {
      this.findEdgeMatches(
        fullCodebaseASG,
        topology,
        matches,
        0,
        selectedNodes,
        [],
        new Set(),
        bindings
      );
      return;
    }

    const patternNode = topology.nodes[patternIndex];
    for (
      let candidateIndex = 0;
      candidateIndex < fullCodebaseASG.getNodes().length;
      candidateIndex += 1
    ) {
      if (usedNodeIndexes.has(candidateIndex)) {
        continue;
      }

      const nextBindings = this.matchValue(
        patternNode,
        fullCodebaseASG.getNodes()[candidateIndex],
        bindings
      );
      if (!nextBindings) {
        continue;
      }

      this.findNodeMatches(
        fullCodebaseASG,
        topology,
        matches,
        patternIndex + 1,
        [...selectedNodes, fullCodebaseASG.getNodes()[candidateIndex]],
        new Set([...usedNodeIndexes, candidateIndex]),
        nextBindings
      );
    }
  }

  /**
   * Recursively selects distinct ASG edges and records complete topology
   * matches as candidate subgraphs.
   */
  private findEdgeMatches(
    fullCodebaseASG: CodebaseASG,
    topology: PatternDefinition['candidateTopology'],
    matches: CodebaseASG[],
    patternIndex: number,
    selectedNodes: CodebaseASGNode[],
    selectedEdges: CodebaseASGEdge[],
    usedEdgeIndexes: Set<number>,
    bindings: Bindings
  ): void {
    if (patternIndex === topology.edges.length) {
      matches.push(new CodebaseASG(selectedNodes, selectedEdges));
      return;
    }

    const patternEdge = topology.edges[patternIndex];
    for (
      let candidateIndex = 0;
      candidateIndex < fullCodebaseASG.getEdges().length;
      candidateIndex += 1
    ) {
      if (usedEdgeIndexes.has(candidateIndex)) {
        continue;
      }

      const nextBindings = this.matchValue(
        patternEdge,
        fullCodebaseASG.getEdges()[candidateIndex],
        bindings
      );
      if (!nextBindings) {
        continue;
      }

      this.findEdgeMatches(
        fullCodebaseASG,
        topology,
        matches,
        patternIndex + 1,
        selectedNodes,
        [...selectedEdges, fullCodebaseASG.getEdges()[candidateIndex]],
        new Set([...usedEdgeIndexes, candidateIndex]),
        nextBindings
      );
    }
  }

  /**
   * Dispatches matching to a type-specific helper and compares primitive
   * values directly.
   */
  private matchValue(
    patternValue: unknown,
    candidateValue: unknown,
    bindings: Bindings
  ): Bindings | undefined {
    if (typeof patternValue === 'string') {
      return this.matchStringValue(patternValue, candidateValue, bindings);
    }

    if (Array.isArray(patternValue)) {
      return this.matchArrayValue(patternValue, candidateValue, bindings);
    }

    if (patternValue !== null && typeof patternValue === 'object') {
      return this.matchObjectValue(patternValue, candidateValue, bindings);
    }

    return patternValue === candidateValue ? bindings : undefined;
  }

  /** Matches string wildcards, placeholders, and exact string values. */
  private matchStringValue(
    patternValue: string,
    candidateValue: unknown,
    bindings: Bindings
  ): Bindings | undefined {
    if (patternValue === '') {
      return bindings;
    }

    if (!patternValue.startsWith('$')) {
      return patternValue === candidateValue ? bindings : undefined;
    }

    const boundValue = bindings.get(patternValue);
    if (boundValue !== undefined) {
      return boundValue === candidateValue ? bindings : undefined;
    }

    if (typeof candidateValue !== 'string') {
      return undefined;
    }

    return new Map(bindings).set(patternValue, candidateValue);
  }

  /** Matches array wildcards or recursively matches equal-length arrays. */
  private matchArrayValue(
    patternValue: unknown[],
    candidateValue: unknown,
    bindings: Bindings
  ): Bindings | undefined {
    if (patternValue.length === 0) {
      return bindings;
    }
    if (
      !Array.isArray(candidateValue) ||
      patternValue.length !== candidateValue.length
    ) {
      return undefined;
    }

    let nextBindings = bindings;
    for (let index = 0; index < patternValue.length; index += 1) {
      const matchedBindings = this.matchValue(
        patternValue[index],
        candidateValue[index],
        nextBindings
      );
      if (!matchedBindings) {
        return undefined;
      }
      nextBindings = matchedBindings;
    }
    return nextBindings;
  }

  /** Recursively matches each declared object property and its value. */
  private matchObjectValue(
    patternValue: object,
    candidateValue: unknown,
    bindings: Bindings
  ): Bindings | undefined {
    if (candidateValue === null || typeof candidateValue !== 'object') {
      return undefined;
    }

    let nextBindings = bindings;
    for (const [key, value] of Object.entries(patternValue)) {
      const matchedBindings = this.matchValue(
        value,
        (candidateValue as Record<string, unknown>)[key],
        nextBindings
      );
      if (!matchedBindings) {
        return undefined;
      }
      nextBindings = matchedBindings;
    }
    return nextBindings;
  }

  /** Checks that two modifier lists contain exactly the same modifiers. */
  protected hasExactlyModifiers(
    modifiers: string[],
    expectedModifiers: string[]
  ): boolean {
    return (
      modifiers.length === expectedModifiers.length &&
      expectedModifiers.every((modifier) => modifiers.includes(modifier))
    );
  }

  abstract candidateVerification(candidateASG: CodebaseASG): boolean;
}
