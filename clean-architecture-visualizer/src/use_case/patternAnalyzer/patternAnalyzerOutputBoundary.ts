import type { PatternAnalyzerOutputData } from './patternAnalyzerOutputData.js';

export interface PatternAnalyzerOutputBoundary {
  prepareSuccessView(outputData: PatternAnalyzerOutputData): void;
  prepareFailView(errorMessage: string): void;
}
