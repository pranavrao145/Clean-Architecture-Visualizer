import { CodebaseASGIndex } from './CodebaseASGIndex.js';
import type { CodebaseASGEdge } from '../types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../types/codebaseASGNodes.js';

export class CodebaseASG {
  private readonly nodes: CodebaseASGNode[];
  private readonly edges: CodebaseASGEdge[];

  constructor(nodes: CodebaseASGNode[], edges: CodebaseASGEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private index?: CodebaseASGIndex;

  /** Hash indexes over this graph, built on first use and then shared. */
  getIndex(): CodebaseASGIndex {
    this.index ??= new CodebaseASGIndex(this.nodes, this.edges);
    return this.index;
  }

  getNodes(): CodebaseASGNode[] {
    return this.nodes;
  }

  getEdges(): CodebaseASGEdge[] {
    return this.edges;
  }
}
