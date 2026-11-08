import { SessionDB } from '../database/sessionDb.js';
import type { useCaseGraph } from '../entity/useCaseGraph.js';
import type { cleanLayer } from '../types/clean-layer.js';
import type { cleanNode } from '../types/cleanNode.js';
import type {
  EdgeStorage,
  FileStorage,
  NodeStorage,
  SessionData,
} from '../types/sessionData.js';
import type { SessionDBAccessInterface } from './sessionDBAccessInterface.js';

export class SessionDBAccess implements SessionDBAccessInterface {
  private readonly db: SessionDB<SessionData>;

  constructor() {
    this.db = new SessionDB<SessionData>();
    this.db.load();
  }

  // Setters

  setProjectName(name: string): void {
    this.db.set('projectName', name);
  }

  setNumUseCases(count: number): void {
    this.db.set('numUseCases', count);
  }

  setNumViolations(count: number): void {
    this.db.set('numViolations', count);
  }

  // Setters - useCases

  setUseCases(useCaseList: useCaseGraph[], files: FileStorage[]): void {
    const existingFiles = this.db.get('files') ?? [];
    const existingFilePaths = new Set(existingFiles.map((f) => f.filePath));

    const newFiles = files.filter((f) => !existingFilePaths.has(f.filePath));
    this.db.set('files', [...existingFiles, ...newFiles]);

    this.db.set(
      'useCases',
      useCaseList.map((useCase, index) => ({
        id: `uc-${index}`,
        name: useCase.getName(),
        outNeighbours: useCase.getNeighbourMap(),
        fileKeys: [...useCase.getFiles().keys()],
        violationEdges: useCase.getViolationEdges(),
        missingNodes: useCase.getMissingNodes(),
      }))
    );
  }

  /** Append or overwrite a single use-case entry (matched by id). */
  upsertUseCase(entry: SessionData['useCases'][number]): void {
    const existing = this.db.get('useCases') ?? [];
    const idx = existing.findIndex((uc) => uc.id === entry.id);

    const updated =
      idx === -1
        ? [...existing, entry]
        : existing.map((uc) => (uc.id === entry.id ? entry : uc));

    this.db.set('useCases', updated);
  }

  removeUseCase(id: string): void {
    const existing = this.db.get('useCases') ?? [];
    this.db.set(
      'useCases',
      existing.filter((uc) => uc.id !== id)
    );
  }

  // Setters — files

  /** Replace the entire files array. */
  setFiles(files: FileStorage[]): void {
    this.db.set('files', files);
  }

  /** Insert or overwrite a single file entry matched by filePath. */
  upsertFile(file: FileStorage): void {
    const existing = this.db.get('files') ?? [];
    const idx = existing.findIndex((f) => f.filePath === file.filePath);

    const updated =
      idx === -1
        ? [...existing, file]
        : existing.map((f) => (f.filePath === file.filePath ? file : f));

    this.db.set('files', updated);
  }

  removeFile(filePath: string): void {
    const existing = this.db.get('files') ?? [];
    this.db.set(
      'files',
      existing.filter((f) => f.filePath !== filePath)
    );
  }

  // Setters — edges

  /** Replace the entire edges array. */
  setEdges(edges: EdgeStorage[]): void {
    this.db.set('edges', edges);
  }

  /** Insert or overwrite a single edge entry matched by id. */
  upsertEdge(edge: EdgeStorage): void {
    const existing = this.db.get('edges') ?? [];
    const idx = existing.findIndex((e) => e.id === edge.id);

    const updated =
      idx === -1
        ? [...existing, edge]
        : existing.map((e) => (e.id === edge.id ? edge : e));

    this.db.set('edges', updated);
  }

  removeEdge(id: string): void {
    const existing = this.db.get('edges') ?? [];
    this.db.set(
      'edges',
      existing.filter((e) => e.id !== id)
    );
  }

  // Setters — nodes

  /** Replace the entire nodes array. */
  setNodes(nodes: NodeStorage[]): void {
    this.db.set('nodes', nodes);
  }

  /** Insert or overwrite a single node entry matched by id. */
  upsertNode(node: NodeStorage): void {
    const existing = this.db.get('nodes') ?? [];
    const idx = existing.findIndex((n) => n.id === node.id);

    const updated =
      idx === -1
        ? [...existing, node]
        : existing.map((n) => (n.id === node.id ? node : n));

    this.db.set('nodes', updated);
  }

  removeNode(id: string): void {
    const existing = this.db.get('nodes') ?? [];
    this.db.set(
      'nodes',
      existing.filter((n) => n.id !== id)
    );
  }

  // Getters

  getProjectName(): string {
    return this.db.get('projectName') ?? '';
  }

  getNumUseCases(): number {
    return this.db.get('numUseCases') ?? 0;
  }

  getNumViolations(): number {
    return this.db.get('numViolations') ?? 0;
  }

  // Getters — useCases

  getAllUseCases(): SessionData['useCases'] {
    return this.db.get('useCases') ?? [];
  }

  getUseCaseById(id: string): SessionData['useCases'][number] | undefined {
    return this.db.get('useCases')?.find((uc) => uc.id === id);
  }

  getUseCaseNeighbours(
    id: string
  ): SessionData['useCases'][number]['outNeighbours'] | undefined {
    return this.getUseCaseById(id)?.outNeighbours;
  }

  getUseCaseFileKeys(id: string): string[] | undefined {
    return this.getUseCaseById(id)?.fileKeys;
  }

  getUseCaseViolationEdges(
    id: string
  ): SessionData['useCases'][number]['violationEdges'] | undefined {
    return this.getUseCaseById(id)?.violationEdges;
  }

  getUseCaseMissingNodes(id: string): cleanNode[] | undefined {
    return this.getUseCaseById(id)?.missingNodes;
  }

  // Getters — files

  getAllFiles(): FileStorage[] {
    return this.db.get('files') ?? [];
  }

  getFileByPath(filePath: string): FileStorage | undefined {
    return this.db.get('files')?.find((f) => f.filePath === filePath);
  }

  getFilesByLayer(layer: cleanLayer): FileStorage[] {
    return this.getAllFiles().filter((f) => f.layer === layer);
  }

  getFilesByType(fileType: FileStorage['fileType']): FileStorage[] {
    return this.getAllFiles().filter((f) => f.fileType === fileType);
  }

  getFilesByNode(node: cleanNode): FileStorage[] {
    return this.getAllFiles().filter((f) => f.node === node);
  }

  // Getters — edges

  getAllEdges(): EdgeStorage[] {
    return this.db.get('edges') ?? [];
  }

  getEdgeById(id: string): EdgeStorage | undefined {
    return this.db.get('edges')?.find((e) => e.id === id);
  }

  getEdgesBySource(source: string): EdgeStorage[] {
    return this.getAllEdges().filter((e) => e.source === source);
  }

  getEdgesByTarget(target: string): EdgeStorage[] {
    return this.getAllEdges().filter((e) => e.target === target);
  }

  getEdgesByStatus(status: EdgeStorage['status']): EdgeStorage[] {
    return this.getAllEdges().filter((e) => e.status === status);
  }

  // Getters — nodes

  getAllNodes(): NodeStorage[] {
    return this.db.get('nodes') ?? [];
  }

  getNodeById(id: string): NodeStorage | undefined {
    return this.db.get('nodes')?.find((n) => n.id === id);
  }

  getNodesByType(type: cleanNode): NodeStorage[] {
    return this.getAllNodes().filter((n) => n.type === type);
  }

  getNodesByLayer(layer: cleanLayer): NodeStorage[] {
    return this.getAllNodes().filter((n) => n.layer === layer);
  }

  getNodesByStatus(status: NodeStorage['status']): NodeStorage[] {
    return this.getAllNodes().filter((n) => n.status === status);
  }

  getNodeByFilePath(filePath: string): NodeStorage | undefined {
    return this.getAllNodes().find((n) => n.filePath === filePath);
  }

  getNodeByName(name: string): NodeStorage | undefined {
    return this.getAllNodes().find((n) => n.name === name);
  }

  resetDB(): undefined {
    this.db.clear();
  }
}
