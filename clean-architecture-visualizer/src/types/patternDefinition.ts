import type { PatternId } from '../entity/PatternId.js';
import type { PatternName } from '../entity/PatternName.js';
import type { PatternType } from '../entity/PatternType.js';
import type { CodebaseASGEdge } from './codebaseASGEdges.js';
import type { CodebaseASGNode } from './codebaseASGNodes.js';

export type PatternDefinition = {
  id: PatternId;
  metadata: {
    patternName: PatternName;
    patternType: PatternType;
    description: string;
    learningInfo: string;
  };
  candidateTopology: {
    nodes: CodebaseASGNode[];
    edges: CodebaseASGEdge[];
  };
};
