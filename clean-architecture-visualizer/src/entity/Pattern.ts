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

  candidateIdentification(fullCodebaseASG: CodebaseASG): CodebaseASG[] {
    // Read the topology once and collect each complete node-and-edge match.
    const topology = this.data.candidateTopology;
    const matches: CodebaseASG[] = [];

    // Recursively assign distinct codebase nodes to each topology node.
    const findNodeMatches = (
      patternIndex: number,
      selectedNodes: CodebaseASGNode[],
      usedNodeIndexes: Set<number>,
      bindings: Bindings
    ): void => {
      // Once all nodes are assigned, match the topology's edges.
      if (patternIndex === topology.nodes.length) {
        findEdgeMatches(0, selectedNodes, [], new Set(), bindings);
        return;
      }

      const patternNode = topology.nodes[patternIndex];
      // Try every unused ASG node as the next possible topology-node match.
      for (
        let candidateIndex = 0;
        candidateIndex < fullCodebaseASG.getNodes().length;
        candidateIndex += 1
      ) {
        if (usedNodeIndexes.has(candidateIndex)) {
          continue;
        }

        // Match node properties and carry any new placeholder bindings forward.
        const nextBindings = this.matchValue(
          patternNode,
          fullCodebaseASG.getNodes()[candidateIndex],
          bindings
        );
        if (!nextBindings) {
          continue;
        }

        findNodeMatches(
          patternIndex + 1,
          [...selectedNodes, fullCodebaseASG.getNodes()[candidateIndex]],
          new Set([...usedNodeIndexes, candidateIndex]),
          nextBindings
        );
      }
    };

    const findEdgeMatches = (
      patternIndex: number,
      selectedNodes: CodebaseASGNode[],
      selectedEdges: CodebaseASGEdge[],
      usedEdgeIndexes: Set<number>,
      bindings: Bindings
    ): void => {
      // A complete topology match becomes a CodebaseASG subgraph object.
      if (patternIndex === topology.edges.length) {
        matches.push(new CodebaseASG(selectedNodes, selectedEdges));
        return;
      }

      const patternEdge = topology.edges[patternIndex];
      // Try every unused ASG edge while preserving topology direction and values.
      for (
        let candidateIndex = 0;
        candidateIndex < fullCodebaseASG.getEdges().length;
        candidateIndex += 1
      ) {
        if (usedEdgeIndexes.has(candidateIndex)) {
          continue;
        }

        // Match edge properties against the bindings established by the nodes.
        const nextBindings = this.matchValue(
          patternEdge,
          fullCodebaseASG.getEdges()[candidateIndex],
          bindings
        );
        if (!nextBindings) {
          continue;
        }

        findEdgeMatches(
          patternIndex + 1,
          selectedNodes,
          [...selectedEdges, fullCodebaseASG.getEdges()[candidateIndex]],
          new Set([...usedEdgeIndexes, candidateIndex]),
          nextBindings
        );
      }
    };

    // Start the backtracking search with no selected elements or bindings.
    findNodeMatches(0, [], new Set(), new Map());
    return matches;
  }

  private matchValue(
    patternValue: unknown,
    candidateValue: unknown,
    bindings: Bindings
  ): Bindings | undefined {
    // Empty strings are topology wildcards; placeholders bind one string value.
    if (typeof patternValue === 'string') {
      if (patternValue === '') {
        return bindings;
      }

      if (patternValue.startsWith('$')) {
        const boundValue = bindings.get(patternValue);
        if (boundValue !== undefined) {
          return boundValue === candidateValue ? bindings : undefined;
        }

        if (typeof candidateValue !== 'string') {
          return undefined;
        }

        return new Map(bindings).set(patternValue, candidateValue);
      }

      return patternValue === candidateValue ? bindings : undefined;
    }

    // Empty arrays are wildcards; populated arrays require equal length and values.
    if (Array.isArray(patternValue)) {
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

    // Recursively compare object properties so every ASG shape is supported.
    if (patternValue !== null && typeof patternValue === 'object') {
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

    // Booleans, numbers, null, and exact strings must compare directly.
    return patternValue === candidateValue ? bindings : undefined;
  }

  protected hasExactlyModifiers(
    modifiers: string[],
    expectedModifiers: string[]
  ): boolean {
    // Compare modifier sets without allowing unrelated modifiers to weaken
    // the access or storage guarantees required by a concrete pattern.
    return (
      modifiers.length === expectedModifiers.length &&
      expectedModifiers.every((modifier) => modifiers.includes(modifier))
    );
  }

  abstract candidateVerification(candidateASG: CodebaseASG): boolean;
}
