import type { PatternAnalyzerInputData } from './pattern-analyzer-input-data.js';

export interface PatternAnalyzerInputBoundary {
  execute(inputData: PatternAnalyzerInputData): Promise<void>;
}
