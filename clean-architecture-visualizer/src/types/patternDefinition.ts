import type { PatternId } from "../entity/PatternId.js";
import type { PatternName } from "../entity/PatternName.js";
import type { PatternType } from "../entity/PatternType.js";
import type { CodebaseASGEdge } from "./codebaseASGEdges.js";
import type { CodebaseASGNode } from "./codebaseASGNodes.js";

type ContainsValue<T> = T extends object
  ? { [K in keyof T]?: T[K] | { equalsBinding: string } }
  : T | { equalsBinding: string };

export type QueryValue<T> =
  | (T extends (infer Element)[]
      ? QueryValue<Element>[] | { contains: ContainsValue<Element> } | { excludes: Element[] }
      : T)
  | { bind: string }
  | { equalsBinding: string };

type QueryShape<T extends { type: string }> = T extends unknown
  ? { type: T["type"] } & {
      [K in Exclude<keyof T, "type">]?: QueryValue<T[K]>;
    }
  : never;

export type CandidateCollection = {
  nodes: QueryShape<CodebaseASGNode>[];
  edges: QueryShape<CodebaseASGEdge>[];
  minMatches?: number;
};

export type CandidateTopology = {
  nodes: QueryShape<CodebaseASGNode>[];
  edges: QueryShape<CodebaseASGEdge>[];
  collectMatches?: CandidateCollection[];
};

export type PatternDefinition = {
  id: PatternId;
  metadata: {
    patternName: PatternName;
    patternType: PatternType;
    description: string;
    learningInfo: string;
  };
  candidateTopologies: CandidateTopology[];
};
