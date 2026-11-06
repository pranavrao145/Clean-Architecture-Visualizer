/**
 * UML data (plus embedded pattern metadata) needed to visualize the detected
 * patterns on the frontend.
 */

export type UmlMemberData = {
  id: string;
  signature: string;
};

export type UmlClassData = {
  id: string;
  name: string;
  filePath?: string;
  attributes: UmlMemberData[];
  methods: UmlMemberData[];
};

export type UmlRelationshipKind =
  | 'DEPENDENCY'
  | 'ASSOCIATION'
  | 'IMPLEMENTS'
  | 'INHERITANCE';

export type UmlRelationshipData = {
  id: string;
  source: string;
  target: string;
  kind: UmlRelationshipKind;
};

export type CodeSnippetData = {
  filePath: string;
  startLine: number;
  content: string;
  highlightedLines: number[];
};

export type PatternLearnData = {
  title: string;
  summary: string;
  details: string[];
  imageUrl?: string;
};

/** Static information about a kind of pattern (shared by all its instances). */
export type PatternDefinitionData = {
  kind: string;
  name: string;
  isAntiPattern: boolean;
  learn: PatternLearnData;
};

/** A single occurrence of a pattern found in the user's codebase. */
export type PatternInstanceData = {
  id: string;
  kind: string;
  classIds: string[];
  memberIds: string[];
  relationshipIds: string[];
  codeSnippets: CodeSnippetData[];
};

export type PatternAnalyzerOutputDataFields = {
  requestedPatterns: string[];
  patterns: PatternDefinitionData[];
  classes: UmlClassData[];
  relationships: UmlRelationshipData[];
  patternInstances: PatternInstanceData[];
};

export class PatternAnalyzerOutputData {
  constructor(private readonly fields: PatternAnalyzerOutputDataFields) {}

  getRequestedPatterns(): string[] {
    return this.fields.requestedPatterns;
  }

  getPatterns(): PatternDefinitionData[] {
    return this.fields.patterns;
  }

  getClasses(): UmlClassData[] {
    return this.fields.classes;
  }

  getRelationships(): UmlRelationshipData[] {
    return this.fields.relationships;
  }

  getPatternInstances(): PatternInstanceData[] {
    return this.fields.patternInstances;
  }
}
