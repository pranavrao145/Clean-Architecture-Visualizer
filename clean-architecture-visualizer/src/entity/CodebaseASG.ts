import type { CodebaseASGEdge } from "../types/codebaseASGEdges.js";
import type { CodebaseASGNode } from "../types/codebaseASGNodes.js";

export class CodebaseASG {
  private readonly nodes: CodebaseASGNode[];
  private readonly edges: CodebaseASGEdge[];

  constructor(nodes: CodebaseASGNode[], edges: CodebaseASGEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  getNodes(): CodebaseASGNode[] {
    return this.nodes;
  }

  getEdges(): CodebaseASGEdge[] {
    return this.edges;
  }
}
