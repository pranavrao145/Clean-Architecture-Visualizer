import { isDeepStrictEqual } from "node:util";
import type {
  CandidateTopology,
  PatternDefinition,
} from "../types/patternDefinition.js";
import { CodebaseASG } from "./CodebaseASG.js";
import {
  type CodebaseASGIndex,
  type IndexedKind,
  isIndexable,
} from "./CodebaseASGIndex.js";

type Bindings = Map<string, unknown>;

const QUERY_OPERATORS = new Set([
  "bind",
  "equalsBinding",
  "contains",
  "excludes",
  "oneOf",
]);

// Validates a value nested in contains or oneOf: either a query operator or an
// object whose properties are each queries. These cannot introduce bindings.
function validateNestedValue(value: unknown, names: Set<string>): void {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = Object.entries(value);

    if (properties.length !== 1 || !QUERY_OPERATORS.has(properties[0][0])) {
      for (const [, property] of properties) {
        validateQueryValue(property, names, true);
      }

      return;
    }
  }

  validateQueryValue(value, names, true);
}

// Check binding names before matching; actual values are stored separately.
function validateQueryValue(
  value: unknown,
  names: Set<string>,
  insideContains = false,
): Set<string> {
  if (Array.isArray(value)) {
    return value.reduce<Set<string>>(
      (current, item) => validateQueryValue(item, current, insideContains),
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

  if (operator === "contains") {
    validateNestedValue(argument, names);
    return names;
  }

  if (operator === "oneOf") {
    if (!Array.isArray(argument) || argument.length === 0) {
      throw new Error("The oneOf operator requires a non-empty array");
    }

    for (const alternative of argument) {
      validateNestedValue(alternative, names);
    }

    return names;
  }

  if (operator === "excludes") {
    if (!Array.isArray(argument)) {
      throw new Error("The excludes operator requires an array");
    }

    return names;
  }

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

    if (insideContains) {
      throw new Error("Cannot introduce a binding inside contains or oneOf");
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

function matchKey(nodeIndexes: Set<number>, edgeIndexes: Set<number>): string {
  return JSON.stringify([
    [...nodeIndexes].sort((a, b) => a - b),
    [...edgeIndexes].sort((a, b) => a - b),
  ]);
}

type QueryItem = {
  kind: IndexedKind;
  // Position among the topology's nodes or edges, used to keep output order.
  position: number;
  shape: Record<string, unknown>;
  // Names that must already be bound before this item can be matched: those
  // referenced inside contains/oneOf, where a binding cannot be introduced.
  requiredNames: Set<string>;
};

type Solution = {
  nodes: number[];
  edges: number[];
  bindings: Bindings;
};

function collectRequiredNames(
  value: unknown,
  nested: boolean,
  names: Set<string>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectRequiredNames(item, nested, names);
    return;
  }

  if (value === null || typeof value !== "object") return;

  const entries = Object.entries(value);

  if (entries.length === 1) {
    const [operator, argument] = entries[0];

    if (operator === "equalsBinding") {
      if (nested && typeof argument === "string") names.add(argument);
      return;
    }

    if (operator === "bind" || operator === "excludes") return;

    if (operator === "contains" || operator === "oneOf") {
      collectRequiredNames(argument, true, names);
      return;
    }
  }

  for (const [, property] of entries) {
    collectRequiredNames(property, nested, names);
  }
}

function buildItems(query: { nodes: object[]; edges: object[] }): QueryItem[] {
  const toItems = (shapes: object[], kind: IndexedKind): QueryItem[] =>
    shapes.map((shape, position) => {
      const requiredNames = new Set<string>();
      collectRequiredNames(shape, false, requiredNames);
      return {
        kind,
        position,
        shape: shape as Record<string, unknown>,
        requiredNames,
      };
    });

  return [...toItems(query.nodes, "node"), ...toItems(query.edges, "edge")];
}

export abstract class Pattern {
  readonly data: PatternDefinition;

  constructor(data: PatternDefinition) {
    this.data = data;
  }

  /**
   * Finds every subgraph matching any topology. Matching is a join over hash
   * indexes: at each step the most selective unmatched node or edge query is
   * matched next, and names it shares with earlier steps are looked up
   * instead of scanned for.
   */
  candidateIdentification(fullCodebaseASG: CodebaseASG): CodebaseASG[] {
    for (const topology of this.data.candidateTopologies) {
      validateTopology(topology);
    }

    const matches: CodebaseASG[] = [];
    const seen = new Set<string>();

    for (const topology of this.data.candidateTopologies) {
      const items = buildItems(topology);

      for (const solution of this.solve(fullCodebaseASG, items, new Map())) {
        this.collectCandidate(
          fullCodebaseASG,
          topology,
          new Set(solution.nodes),
          new Set(solution.edges),
          solution.bindings,
          matches,
          seen,
        );
      }
    }
    return matches;
  }

  /**
   * Returns every assignment of distinct nodes and distinct edges to the
   * query's items, in the order a declaration-order search would find them.
   */
  private solve(
    graph: CodebaseASG,
    items: QueryItem[],
    initialBindings: Bindings,
  ): Solution[] {
    const index = graph.getIndex();
    const elements = { node: graph.getNodes(), edge: graph.getEdges() };
    const used = { node: new Set<number>(), edge: new Set<number>() };
    const assigned = new Array<number>(items.length).fill(-1);
    const matched = new Array<boolean>(items.length).fill(false);
    const solutions: Solution[] = [];

    const step = (remaining: number, bindings: Bindings): void => {
      if (remaining === 0) {
        const byKind = (kind: IndexedKind) =>
          items
            .map((item, itemIndex) => ({ item, itemIndex }))
            .filter(({ item }) => item.kind === kind)
            .sort((a, b) => a.item.position - b.item.position)
            .map(({ itemIndex }) => assigned[itemIndex]);

        solutions.push({
          nodes: byKind("node"),
          edges: byKind("edge"),
          bindings,
        });
        return;
      }

      let best = -1;
      let bestCandidates: readonly number[] | undefined;
      let bestSize = Number.POSITIVE_INFINITY;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];

        if (
          matched[i] ||
          ![...item.requiredNames].every((n) => bindings.has(n))
        ) {
          continue;
        }

        const candidates = this.candidatesFor(index, item, bindings);
        const size = candidates ? candidates.length : index.size(item.kind);

        if (size === 0) return;

        if (size < bestSize) {
          best = i;
          bestCandidates = candidates;
          bestSize = size;
        }
      }

      const item = items[best];
      const pool = used[item.kind];
      const total = bestCandidates ? bestCandidates.length : bestSize;

      matched[best] = true;

      for (let c = 0; c < total; c += 1) {
        const position = bestCandidates ? bestCandidates[c] : c;

        if (pool.has(position)) continue;

        const next = this.matchValue(
          item.shape,
          elements[item.kind][position],
          bindings,
        );

        if (!next) continue;

        pool.add(position);
        assigned[best] = position;
        step(remaining - 1, next);
        pool.delete(position);
      }

      matched[best] = false;
      assigned[best] = -1;
    };

    step(items.length, initialBindings);

    // Search order is by selectivity; sort back to declaration order so
    // results are stable and identical to a node-by-node scan.
    return solutions.sort((a, b) => {
      const left = [...a.nodes, ...a.edges];
      const right = [...b.nodes, ...b.edges];

      for (let i = 0; i < left.length; i += 1) {
        if (left[i] !== right[i]) return left[i] - right[i];
      }

      return 0;
    });
  }

  /**
   * Narrows an item to the positions that can possibly match using the
   * smallest index bucket that its literal values, or values already bound
   * by earlier steps, point at. Returns undefined when nothing narrows it.
   * The result is only a prefilter; matchValue still decides every match.
   */
  private candidatesFor(
    index: CodebaseASGIndex,
    item: QueryItem,
    bindings: Bindings,
  ): readonly number[] | undefined {
    let best: readonly number[] | undefined;

    for (const [field, value] of Object.entries(item.shape)) {
      const bucket = this.lookupBucket(
        index,
        item.kind,
        field,
        value,
        bindings,
      );

      if (!bucket) continue;
      if (bucket.length === 0) return bucket;
      if (!best || bucket.length < best.length) best = bucket;
    }

    return best;
  }

  private lookupBucket(
    index: CodebaseASGIndex,
    kind: IndexedKind,
    field: string,
    value: unknown,
    bindings: Bindings,
  ): readonly number[] | undefined {
    if (isIndexable(value)) return index.lookup(kind, field, value);

    if (value === null || typeof value !== "object") return undefined;

    const entries = Object.entries(value);

    if (entries.length !== 1) return undefined;

    const [operator, argument] = entries[0];

    if (
      (operator === "equalsBinding" || operator === "bind") &&
      typeof argument === "string" &&
      bindings.has(argument)
    ) {
      const bound = bindings.get(argument);
      return isIndexable(bound) ? index.lookup(kind, field, bound) : undefined;
    }

    if (
      operator === "oneOf" &&
      Array.isArray(argument) &&
      argument.every(isIndexable)
    ) {
      const union = new Set<number>();

      for (const alternative of argument) {
        for (const position of index.lookup(kind, field, alternative)) {
          union.add(position);
        }
      }

      return [...union];
    }

    return undefined;
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
    const collections = topology.collectMatches ?? [];
    const results = new Map<number, Solution[]>();

    // Cheap rejection first: collections that must match something run
    // before optional ones, so a candidate that cannot satisfy them is
    // dropped before any optional collection is searched.
    const order = collections
      .map((collection, position) => ({ collection, position }))
      .sort(
        (a, b) =>
          Number((b.collection.minMatches ?? 0) > 0) -
          Number((a.collection.minMatches ?? 0) > 0),
      );

    for (const { collection, position } of order) {
      const unique = new Map<string, Solution>();

      for (const solution of this.solve(
        fullCodebaseASG,
        buildItems(collection),
        bindings,
      )) {
        const key = matchKey(new Set(solution.nodes), new Set(solution.edges));
        if (!unique.has(key)) unique.set(key, solution);
      }

      if (unique.size < (collection.minMatches ?? 0)) {
        return;
      }

      results.set(position, [...unique.values()]);
    }

    const nodes = new Set(baseNodes);
    const edges = new Set(baseEdges);

    for (let position = 0; position < collections.length; position += 1) {
      for (const solution of results.get(position) ?? []) {
        for (const index of solution.nodes) nodes.add(index);
        for (const index of solution.edges) edges.add(index);
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

    // Matching order is chosen by selectivity, so the first occurrence of a
    // name to be matched binds it and any later occurrence checks equality.
    if (bindings.has(name)) {
      return isDeepStrictEqual(bindings.get(name), value)
        ? bindings
        : undefined;
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

      if (operator === "contains") {
        return Array.isArray(candidateValue) &&
          candidateValue.some(
            (item) => this.matchValue(value, item, bindings) !== undefined,
          )
          ? bindings
          : undefined;
      }

      if (operator === "oneOf") {
        return Array.isArray(value) &&
          value.some(
            (alternative) =>
              this.matchValue(alternative, candidateValue, bindings) !==
              undefined,
          )
          ? bindings
          : undefined;
      }

      if (operator === "excludes") {
        return Array.isArray(candidateValue) &&
          Array.isArray(value) &&
          value.every((excluded) =>
            candidateValue.every((item) => !isDeepStrictEqual(item, excluded)),
          )
          ? bindings
          : undefined;
      }

      if (operator === "bind" || operator === "equalsBinding") {
        if (typeof value !== "string" || value.length === 0) {
          throw new Error(`Invalid ${operator} binding name`);
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
