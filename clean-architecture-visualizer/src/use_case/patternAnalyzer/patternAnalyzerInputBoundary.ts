import type { PatternAnalyzerInputData } from './patternAnalyzerInputData.js';

export interface PatternAnalyzerInputBoundary {
  execute(inputData: PatternAnalyzerInputData): Promise<void>;
}
