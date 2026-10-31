import type { CodebaseASGEdge } from "../types/codebaseASGEdges.js";
import type { CodebaseASGNode } from "../types/codebaseASGNodes.js";
import { CodebaseASG } from "./CodebaseASG.js";
import type { CodebaseASGFactory } from "./CodebaseASGFactory.js";

class CommonCodebaseASGFactory implements CodebaseASGFactory {
  async create(
    nodes: CodebaseASGNode[],
    edges: CodebaseASGEdge[],
  ): Promise<CodebaseASG> {
    return new CodebaseASG(nodes, edges);
  }
}
