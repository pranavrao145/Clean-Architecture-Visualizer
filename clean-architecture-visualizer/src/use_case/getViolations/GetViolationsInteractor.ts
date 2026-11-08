import type { FileAccessInterface } from '../../data_access/fileAccessInterface.js';
import type { SessionDBAccessInterface } from '../../data_access/sessionDBAccessInterface.js';
import { useCaseGraph } from '../../entity/useCaseGraph.js';
import type { cleanNode } from '../../types/cleanNode.js';
import type { GetViolationsInputBoundary } from './GetViolationsInputBoundary.js';
import type { GetViolationsInputData } from './GetViolationsInputData.js';
import type {
  FileContext,
  GetViolationsOutputData,
  ViolationEntry,
} from './GetViolationsOutputData.js';

export class GetViolationsInteractor implements GetViolationsInputBoundary {
  constructor(
    private readonly db: SessionDBAccessInterface,
    private readonly fileAccess: FileAccessInterface,
    private readonly outputData: GetViolationsOutputData
  ) {}

  async execute(inputData: GetViolationsInputData): Promise<void> {
    const useCaseId = inputData.getUseCaseId();

    const useCase = this.db.getUseCaseById(useCaseId);
    if (!useCase) return undefined;
    const violations: ViolationEntry[] = await Promise.all(
      useCase.violationEdges.map(async ([from, to], index) => {
        const edgeId = `${from}->${to}`;
        const relatedNodeIds = this.resolveRelatedNodeIds(
          from,
          to,
          useCase.fileKeys,
          useCase.name
        );
        const fileContext = await this.resolveFileContext(
          from,
          to,
          useCase.fileKeys,
          useCase.name
        );

        return {
          id: `v-${index}`,
          type: 'INCORRECT_DEPENDENCY',
          message: '',
          suggestion: '',
          related_node_ids: relatedNodeIds,
          related_edge_id: edgeId,
          file_context: fileContext,
        };
      })
    );
    this.outputData.setOutputData(violations);
  }

  /**
   * Find node ids in the DB that match the source or target of the violation
   * and belong to this use case's file keys.
   */
  private resolveRelatedNodeIds(
    from: cleanNode,
    to: cleanNode,
    fileKeys: string[],
    useCaseName: string
  ): string[] {
    const fileKeySet = new Set(fileKeys);

    return this.db
      .getAllNodes()
      .filter(
        (n) =>
          (n.type === from || n.type === to) &&
          n.filePath !== undefined &&
          ((n.filePath.split('/').length > 0
            ? fileKeySet.has(n.filePath.split('/').at(-1) as string) &&
              this.findNodeContainsUseCase(n.id, useCaseName)
            : false) ||
            (fileKeySet.has(n.filePath) &&
              this.findNodeContainsUseCase(n.id, useCaseName)))
      )
      .map((n) => n.id);
  }

  /**
   * Reads the source file of the violation's origin node to populate file_context.
   * Returns undefined if no matching file is found in this use case's file keys.
   */
  private async resolveFileContext(
    from: cleanNode,
    to: cleanNode,
    fileKeys: string[],
    useCaseName: string
  ): Promise<FileContext | undefined> {
    const fileKeySet = new Set(fileKeys);
    // It is possible for multiple files to have the desired clean node and have the same file structure
    const matchingNodes = this.db
      .getAllNodes()
      .filter(
        (n) =>
          n.type === from &&
          n.filePath !== undefined &&
          ((n.filePath.split('/').length > 0
            ? fileKeySet.has(n.filePath.split('/').at(-1) as string) &&
              this.findNodeContainsUseCase(n.id, useCaseName)
            : false) ||
            (fileKeySet.has(n.filePath) &&
              this.findNodeContainsUseCase(n.id, useCaseName)))
      );

    if (!matchingNodes) return undefined;
    for (const matchingNode of matchingNodes) {
      const fileName = matchingNode.filePath?.split('/').at(-1);
      if (!fileName) return undefined;
      const [snippet, line_number] = await Promise.all([
        this.fileAccess.getFileSnippet(matchingNode.filePath as string, to),
        this.fileAccess.getLineNumber(matchingNode.filePath as string, to),
      ]);

      if (snippet && line_number) {
        return {
          file: fileName,
          ...(snippet && { snippet }),
          ...(line_number && { line_number }),
        };
      }
    }
    // This SHOULD never run
    return undefined;
  }

  /*
  Determines if the nodeId if part of the use case graph.
  */
  private findNodeContainsUseCase(
    nodeId: string,
    useCaseName: string
  ): boolean {
    if (nodeId.length < useCaseName.length) {
      return false;
    }
    return nodeId
      .slice(nodeId.length - useCaseName.length)
      .includes(useCaseName);
  }
}
