import type { PatternAnalyzerOutputData } from './pattern-analyzer-output-data.js';

export interface PatternAnalyzerOutputBoundary {
  prepareSuccessView(outputData: PatternAnalyzerOutputData): void;
  // The request itself was wrong, such as an unknown pattern ID.
  prepareInvalidInputView(error: string): void;
  // The request was fine but the analysis failed, such as Java not running.
  prepareFailView(error: string): void;
}
