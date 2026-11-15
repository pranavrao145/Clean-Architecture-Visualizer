import { isDeepStrictEqual } from "node:util";
import type {
  CandidateTopology,
  PatternDefinition,
} from "../types/patternDefinition.js";
import { CodebaseASG } from "./CodebaseASG.js";

type Bindings = Map<string, unknown>;

// Check binding names before matching; actual values are stored separately.
function validateQueryValue(value: unknown, names: Set<string>): Set<string> {
  if (Array.isArray(value)) {
    return value.reduce<Set<string>>(
      (current, item) => validateQueryValue(item, current),
      names,
    );
  }

  if (value === null || typeof value !== "object") {
    return names;
  }

  const entries = Object.entries(value);

  if (entries.length !== 1) {
    throw new Error("A query operator must contain exactly one property");
  }

  const [operator, argument] = entries[0];

  if (operator === "bind" || operator === "equalsBinding") {
    if (typeof argument !== "string" || argument.length === 0) {
      throw new Error(`Invalid ${operator} binding name`);
    }

    if (operator === "equalsBinding") {
      if (!names.has(argument)) {
        throw new Error(`Unbound query reference: ${argument}`);
      }

      return names;
    }

    if (names.has(argument)) {
      throw new Error(`Duplicate query binding: ${argument}`);
    }

    return new Set([...names, argument]);
  }

  throw new Error(`Unknown query operator: ${operator}`);
}

function validateTopology(topology: CandidateTopology): void {
  let names = new Set<string>();

  for (const shape of [...topology.nodes, ...topology.edges]) {
    for (const value of Object.values(shape)) {
      names = validateQueryValue(value, names);
    }
  }

  if (
    topology.collectMatches !== undefined &&
    !Array.isArray(topology.collectMatches)
  ) {
    throw new Error("Topology collectMatches must be an array");
  }

  for (const collection of topology.collectMatches ?? []) {
    if (
      !collection ||
      !Array.isArray(collection.nodes) ||
      !Array.isArray(collection.edges) ||
      collection.nodes.length + collection.edges.length === 0
    ) {
      throw new Error(
        "A collection must contain at least one node or edge query",
      );
    }

    if (
      collection.minMatches !== undefined &&
      (!Number.isSafeInteger(collection.minMatches) ||
        collection.minMatches < 0)
    ) {
      throw new Error("Collection minMatches must be a non-negative integer");
    }

    let localNames = names;

    for (const shape of [...collection.nodes, ...collection.edges]) {
      for (const value of Object.values(shape)) {
        localNames = validateQueryValue(value, localNames);
      }
    }
  }
}

type MatchHandler = (
  nodeIndexes: Set<number>,
  edgeIndexes: Set<number>,
  bindings: Bindings,
) => void;

function matchKey(nodeIndexes: Set<number>, edgeIndexes: Set<number>): string {
  return JSON.stringify([
    [...nodeIndexes].sort((a, b) => a - b),
    [...edgeIndexes].sort((a, b) => a - b),
  ]);
}

export abstract class Pattern {
  readonly data: PatternDefinition;

  constructor(data: PatternDefinition) {
    this.data = data;
  }

  /**
   * Finds every subgraph matching any topology by backtracking through
   * candidate nodes and then matching the corresponding edges.
   */
  candidateIdentification(fullCodebaseASG: CodebaseASG): CodebaseASG[] {
    for (const topology of this.data.candidateTopologies) {
      validateTopology(topology);
    }

    const matches: CodebaseASG[] = [];
    const seen = new Set<string>();

    for (const topology of this.data.candidateTopologies) {
      this.findNodeMatches(
        fullCodebaseASG,
        topology,
        0,
        new Set(),
        new Map(),
        (nodeIndexes, edgeIndexes, bindings) =>
          this.collectCandidate(
            fullCodebaseASG,
            topology,
            nodeIndexes,
            edgeIndexes,
            bindings,
            matches,
            seen,
          ),
      );
    }
    return matches;
  }

  /**
   * Recursively selects distinct ASG nodes and carries successful
   * bindings into the edge-matching phase.
   */
  private findNodeMatches(
    fullCodebaseASG: CodebaseASG,
    topology: CandidateTopology,
    patternIndex: number,
    usedNodeIndexes: Set<number>,
    bindings: Bindings,
    onMatch: MatchHandler,
  ): void {
    if (patternIndex === topology.nodes.length) {
      this.findEdgeMatches(
        fullCodebaseASG,
        topology,
        0,
        usedNodeIndexes,
        new Set(),
        bindings,
        onMatch,
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
        bindings,
      );
      if (nextBindings) {
        this.findNodeMatches(
          fullCodebaseASG,
          topology,
          patternIndex + 1,
          new Set([...usedNodeIndexes, candidateIndex]),
          nextBindings,
          onMatch,
        );
      }
    }
  }

  /**
   * Recursively selects distinct ASG edges and reports complete matches.
   */
  private findEdgeMatches(
    fullCodebaseASG: CodebaseASG,
    topology: CandidateTopology,
    patternIndex: number,
    usedNodeIndexes: Set<number>,
    usedEdgeIndexes: Set<number>,
    bindings: Bindings,
    onMatch: MatchHandler,
  ): void {
    if (patternIndex === topology.edges.length) {
      onMatch(usedNodeIndexes, usedEdgeIndexes, bindings);
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
        bindings,
      );

      if (nextBindings) {
        this.findEdgeMatches(
          fullCodebaseASG,
          topology,
          patternIndex + 1,
          usedNodeIndexes,
          new Set([...usedEdgeIndexes, candidateIndex]),
          nextBindings,
          onMatch,
        );
      }
    }
  }

  private collectCandidate(
    fullCodebaseASG: CodebaseASG,
    topology: CandidateTopology,
    baseNodes: Set<number>,
    baseEdges: Set<number>,
    bindings: Bindings,
    matches: CodebaseASG[],
    seen: Set<string>,
  ): void {
    const nodes = new Set(baseNodes);
    const edges = new Set(baseEdges);

    for (const collection of topology.collectMatches ?? []) {
      const collectionMatches = new Set<string>();

      this.findNodeMatches(
        fullCodebaseASG,
        collection,
        0,
        new Set(),
        bindings,
        (nodeIndexes, edgeIndexes) => {
          const key = matchKey(nodeIndexes, edgeIndexes);

          if (!collectionMatches.has(key)) {
            collectionMatches.add(key);

            for (const index of nodeIndexes) nodes.add(index);
            for (const index of edgeIndexes) edges.add(index);
          }
        },
      );

      if (collectionMatches.size < (collection.minMatches ?? 0)) {
        return;
      }
    }

    const key = matchKey(nodes, edges);

    if (!seen.has(key)) {
      seen.add(key);
      matches.push(
        new CodebaseASG(
          [...nodes].map((index) => fullCodebaseASG.getNodes()[index]),
          [...edges].map((index) => fullCodebaseASG.getEdges()[index]),
        ),
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
    bindings: Bindings,
  ): Bindings | undefined {
    if (Array.isArray(patternValue)) {
      return this.matchArrayValue(patternValue, candidateValue, bindings);
    }

    if (patternValue !== null && typeof patternValue === "object") {
      return this.matchObjectValue(patternValue, candidateValue, bindings);
    }

    return patternValue === candidateValue ? bindings : undefined;
  }

  private bindValue(
    name: string,
    value: unknown,
    bindings: Bindings,
  ): Bindings | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (bindings.has(name)) {
      throw new Error(`Duplicate query binding: ${name}`);
    }

    return new Map(bindings).set(name, value);
  }

  /** Recursively matches equal-length arrays. */
  private matchArrayValue(
    patternValue: unknown[],
    candidateValue: unknown,
    bindings: Bindings,
  ): Bindings | undefined {
    if (
      !Array.isArray(candidateValue) ||
      patternValue.length !== candidateValue.length
    ) {
      return undefined;
    }

    let nextBindings = bindings;

    for (let index = 0; index < patternValue.length; index += 1) {
      const matched = this.matchValue(
        patternValue[index],
        candidateValue[index],
        nextBindings,
      );
      if (!matched) return undefined;
      nextBindings = matched;
    }
    return nextBindings;
  }

  /** Matches query operators or recursively matches declared properties. */
  private matchObjectValue(
    patternValue: object,
    candidateValue: unknown,
    bindings: Bindings,
  ): Bindings | undefined {
    const entries = Object.entries(patternValue);

    if (entries.length === 1) {
      const [operator, value] = entries[0];

      if (operator === "bind" || operator === "equalsBinding") {
        if (typeof value !== "string" || value.length === 0) {
          throw new Error(`Invalid ${operator} binding name`);
        }

        if (operator === "equalsBinding") {
          if (!bindings.has(value)) {
            throw new Error(`Unbound query reference: ${value}`);
          }

          return isDeepStrictEqual(bindings.get(value), candidateValue)
            ? bindings
            : undefined;
        }

        return this.bindValue(value, candidateValue, bindings);
      }
    }
    if (candidateValue === null || typeof candidateValue !== "object") {
      return undefined;
    }

    let nextBindings = bindings;
    for (const [key, value] of entries) {
      const matched = this.matchValue(
        value,
        (candidateValue as Record<string, unknown>)[key],
        nextBindings,
      );
      if (!matched) return undefined;
      nextBindings = matched;
    }
    return nextBindings;
  }

  /** Checks that two modifier lists contain exactly the same modifiers. */
  protected hasExactlyModifiers(
    modifiers: string[],
    expectedModifiers: string[],
  ): boolean {
    return (
      modifiers.length === expectedModifiers.length &&
      expectedModifiers.every((modifier) => modifiers.includes(modifier))
    );
  }

  abstract candidateVerification(candidateASG: CodebaseASG): boolean;
}
