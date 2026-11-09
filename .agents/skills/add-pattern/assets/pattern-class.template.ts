import type { PatternDefinition } from '../types/patternDefinition.js';
import type { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternId } from './PatternId.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';

export class <NAME>DesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternId.<ENUM_MEMBER>) {
      throw new Error(
        `Invalid pattern ID for <NAME>DesignPattern: ${data.id}`
      );
    }

    if (data.metadata.patternName !== PatternName.<ENUM_MEMBER>) {
      throw new Error(
        `Invalid pattern name for <NAME>DesignPattern: ${data.metadata.patternName}`
      );
    }

    if (data.metadata.patternType !== PatternType.<TYPE_MEMBER>) {
      throw new Error(
        `Invalid pattern type for <NAME>DesignPattern: ${data.metadata.patternType}`
      );
    }

    super(data);
  }

  candidateVerification(candidateASG: CodebaseASG): boolean {
    const nodes = candidateASG.getNodes();
    const edges = candidateASG.getEdges();

    // Keep verification specific to the candidate subgraph. Topology
    // matching selected the nodes and edges; semantic rules such as names,
    // modifiers, signatures, and typed relationships belong here.
    return nodes.length === <NODE_COUNT> && edges.length === <EDGE_COUNT>;
  }
}
