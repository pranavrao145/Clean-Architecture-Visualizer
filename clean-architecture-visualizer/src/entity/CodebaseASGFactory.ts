import type { CodebaseASGEdge } from "../types/codebaseASGEdges.js";
import type { CodebaseASGNode } from "../types/codebaseASGNodes.js";
import type { CodebaseASG } from "./CodebaseASG.js";

export interface CodebaseASGFactory {
  create(
    nodes: CodebaseASGNode[],
    edges: CodebaseASGEdge[],
  ): Promise<CodebaseASG>;
}
