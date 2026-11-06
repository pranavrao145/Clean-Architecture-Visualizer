import type { PatternAnalyzerOutputBoundary } from '../../use_case/patternAnalyzer/patternAnalyzerOutputBoundary.js';
import type { PatternAnalyzerOutputData } from '../../use_case/patternAnalyzer/patternAnalyzerOutputData.js';

/** JSON shape served by POST /api/pattern-analyzer. */
export type PatternAnalyzerResponse = {
  requested_patterns: string[];
  patterns: {
    kind: string;
    name: string;
    is_anti_pattern: boolean;
    learn: {
      title: string;
      summary: string;
      details: string[];
      image_url?: string;
    };
  }[];
  classes: {
    id: string;
    name: string;
    file_path?: string;
    attributes: { id: string; signature: string }[];
    methods: { id: string; signature: string }[];
  }[];
  relationships: {
    id: string;
    source: string;
    target: string;
    kind: string;
  }[];
  pattern_instances: {
    id: string;
    kind: string;
    class_ids: string[];
    member_ids: string[];
    relationship_ids: string[];
    code_snippets: {
      file_path: string;
      start_line: number;
      content: string;
      highlighted_lines: number[];
    }[];
  }[];
};

/**
 * Turns the use case's output data into the JSON response for the API.
 */
export class PatternAnalyzerPresenter implements PatternAnalyzerOutputBoundary {
  private response?: PatternAnalyzerResponse;
  private error?: string;

  prepareSuccessView(outputData: PatternAnalyzerOutputData): void {
    this.error = undefined;
    this.response = {
      requested_patterns: outputData.getRequestedPatterns(),
      patterns: outputData.getPatterns().map((p) => ({
        kind: p.kind,
        name: p.name,
        is_anti_pattern: p.isAntiPattern,
        learn: {
          title: p.learn.title,
          summary: p.learn.summary,
          details: p.learn.details,
          ...(p.learn.imageUrl && { image_url: p.learn.imageUrl }),
        },
      })),
      classes: outputData.getClasses().map((c) => ({
        id: c.id,
        name: c.name,
        ...(c.filePath && { file_path: c.filePath }),
        attributes: c.attributes,
        methods: c.methods,
      })),
      relationships: outputData.getRelationships().map((r) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        kind: r.kind,
      })),
      pattern_instances: outputData.getPatternInstances().map((i) => ({
        id: i.id,
        kind: i.kind,
        class_ids: i.classIds,
        member_ids: i.memberIds,
        relationship_ids: i.relationshipIds,
        code_snippets: i.codeSnippets.map((s) => ({
          file_path: s.filePath,
          start_line: s.startLine,
          content: s.content,
          highlighted_lines: s.highlightedLines,
        })),
      })),
    };
  }

  prepareFailView(errorMessage: string): void {
    this.response = undefined;
    this.error = errorMessage;
  }

  getResponse(): PatternAnalyzerResponse | undefined {
    return this.response;
  }

  getError(): string | undefined {
    return this.error;
  }
}
