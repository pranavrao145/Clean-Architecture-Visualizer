import type { codebaseASGEdge } from "../types/codebaseASGEdges.js";
import type { codebaseASGNode } from "../types/codebaseASGNodes.js";

export class codebaseASG {
  private readonly nodes: codebaseASGNode[];
  private readonly edges: codebaseASGEdge[];

  constructor(nodes: codebaseASGNode[], edges: codebaseASGEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }
}
