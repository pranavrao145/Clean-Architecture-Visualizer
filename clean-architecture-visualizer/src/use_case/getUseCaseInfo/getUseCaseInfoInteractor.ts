import type { SessionDBAccessInterface } from '../../data_access/sessionDBAccessInterface.js';
import type { EdgeStorage, NodeStorage } from '../../types/sessionData.js';
import type { GetUseCaseInfoInputBoundary } from './getUseCaseInfoInputBoundary.js';
import type { GetUseCaseInfoInputData } from './getUseCaseInfoInputData.js';
import type {
  GetUseCaseInfoOutputData,
  UseCaseEdgeResponse,
  UseCaseInfoResponse,
  UseCaseNodeResponse,
} from './getUseCaseInfoOutputData.js';

export class GetUseCaseInfoInteractor implements GetUseCaseInfoInputBoundary {
  constructor(
    private readonly db: SessionDBAccessInterface,
    private readonly outputData: GetUseCaseInfoOutputData
  ) {}

  async execute(inputData: GetUseCaseInfoInputData): Promise<void> {
    const id = inputData.getUseCaseId();
    const useCase = this.db.getUseCaseById(id);

    if (!useCase) return;

    const nodes = this.buildNodes(useCase);
    const edges = this.buildEdges(useCase);

    const result: UseCaseInfoResponse = {
      interaction_name: useCase.name,
      nodes: nodes,
      edges: edges,
      decoupling: false,
    };

    // const allNodes = this.db.getAllNodes();

    /**
     * Checking for sub use case.
     * If an edge points to another node that is a use case interactor, then that edge represents a subuse case.
     */

    const hasSubCase = edges.some(
      (edge) =>
        edge.source !== edge.target && edge.target === 'useCaseInteractor'
    );

    if (hasSubCase) {
      result.decoupling = true;
    }

    this.outputData.setOutputData(result);
  }

  /**
   * Build the node list for a use case.
   * - VALID / VIOLATION nodes come from NodeStorage entries whose filePath
   *   is referenced by the use case's fileKeys.
   * - MISSING nodes come from the use case's missingNodes list.
   */
  private buildNodes(
    useCase: ReturnType<SessionDBAccessInterface['getUseCaseById']> & {}
  ): UseCaseNodeResponse[] {
    const result: UseCaseNodeResponse[] = [];

    // useCase file keys that correspond to actual files in the DB
    const fileNodes: NodeStorage[] = [];
    const allNodes = this.db.getAllNodes();

    for (const fileKey of useCase.fileKeys) {
      const nodeFromDB = allNodes.find(
        (n) => n.filePath && n.filePath.includes(fileKey)
      );

      if (nodeFromDB !== undefined) fileNodes.push(nodeFromDB);
    }

    for (const node of fileNodes) {
      result.push(this.formatNode(node));
    }

    // Missing nodes — one entry per missing cleanNode type
    for (const missingType of useCase.missingNodes) {
      const existing = this.db
        .getNodesByStatus('MISSING')
        .find((n) => n.type === missingType);

      if (existing) {
        result.push(this.formatNode(existing));
      }
    }

    return result;
  }

  /**
   * Build the edge list for a use case by collecting all source→target
   * pairs present in the use case's outNeighbours map, then looking them
   * up in EdgeStorage for status information.
   */
  private buildEdges(
    useCase: ReturnType<SessionDBAccessInterface['getUseCaseById']> & {}
  ): UseCaseEdgeResponse[] {
    const result: UseCaseEdgeResponse[] = [];

    for (const [source, targets] of Object.entries(useCase.outNeighbours)) {
      for (const target of targets) {
        const edgeId = `${source}->${target}`;
        const edge = this.db.getEdgeById(edgeId);
        if (!edge) continue;

        result.push(this.formatEdge(edge));
      }
    }

    return result;
  }

  private formatNodeName(node: NodeStorage): string {
    // convert from camelCase to PascalCase and add spaces between words
    // e.g. "dataAccessInterface" -> "Data Access Interface"
    const nodeNamePascalCase =
      node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const words: string[] = [];

    for (let i = 0; i < nodeNamePascalCase.length; i++) {
      const char = nodeNamePascalCase[i];
      if (char === char.toUpperCase()) {
        words.push(char);
      } else {
        words[words.length - 1] += char;
      }
    }

    const nodeName = words.join(' ');

    if (node.status === 'MISSING') {
      return nodeName + ' (Missing)';
    } else {
      return nodeName;
    }
  }

  private formatNode(node: NodeStorage): UseCaseNodeResponse {
    return {
      id: node.type,
      name: node.name ?? this.formatNodeName(node),
      type: node.type,
      layer: node.layer,
      ...(node.filePath && { file_path: node.filePath }),
      status: node.status,
    };
  }

  private formatEdge(edge: EdgeStorage): UseCaseEdgeResponse {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      status: edge.status,
    };
  }
}
