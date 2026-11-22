import type { CodebaseASGEdge } from '../types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../types/codebaseASGNodes.js';

export type IndexedKind = 'node' | 'edge';

const EMPTY: readonly number[] = [];

function isIndexable(value: unknown): value is string | boolean {
  return typeof value === 'string' || typeof value === 'boolean';
}

function indexKey(field: string, value: string | boolean): string {
  return `${field}\u0000${typeof value}:${value}`;
}

/**
 * Hash indexes over a graph's nodes and edges, built in a single pass. Every
 * top-level string or boolean property (type, fqn, ownerFqn, calledMethodFqn,
 * ...) maps its value to the ascending positions of the nodes or edges that
 * have it, so a lookup replaces a linear scan.
 */
export class CodebaseASGIndex {
  private readonly nodeEntries = new Map<string, number[]>();
  private readonly edgeEntries = new Map<string, number[]>();
  readonly nodeCount: number;
  readonly edgeCount: number;

  constructor(nodes: CodebaseASGNode[], edges: CodebaseASGEdge[]) {
    this.nodeCount = nodes.length;
    this.edgeCount = edges.length;
    CodebaseASGIndex.build(nodes, this.nodeEntries);
    CodebaseASGIndex.build(edges, this.edgeEntries);
  }

  private static build(
    elements: readonly object[],
    entries: Map<string, number[]>
  ): void {
    elements.forEach((element, position) => {
      for (const [field, value] of Object.entries(element)) {
        if (!isIndexable(value)) continue;

        const key = indexKey(field, value);
        const bucket = entries.get(key);

        if (bucket) bucket.push(position);
        else entries.set(key, [position]);
      }
    });
  }

  /** Positions whose `field` strictly equals `value`, in ascending order. */
  lookup(
    kind: IndexedKind,
    field: string,
    value: string | boolean
  ): readonly number[] {
    const entries = kind === 'node' ? this.nodeEntries : this.edgeEntries;
    return entries.get(indexKey(field, value)) ?? EMPTY;
  }

  size(kind: IndexedKind): number {
    return kind === 'node' ? this.nodeCount : this.edgeCount;
  }
}

export { isIndexable };
