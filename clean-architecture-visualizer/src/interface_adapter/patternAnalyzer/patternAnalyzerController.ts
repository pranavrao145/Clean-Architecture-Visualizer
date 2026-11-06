import type { PatternAnalyzerInputBoundary } from '../../use_case/patternAnalyzer/patternAnalyzerInputBoundary.js';
import { PatternAnalyzerInputData } from '../../use_case/patternAnalyzer/patternAnalyzerInputData.js';

/**
 * Converts raw user input (e.g. a request body field) into PatternAnalyzerInputData
 * and invokes the use case. Non-string entries are dropped, and names are
 * trimmed, lower-cased and de-duplicated.
 */
export class PatternAnalyzerController {
  constructor(private readonly inputBoundary: PatternAnalyzerInputBoundary) {}

  async execute(rawPatterns: unknown): Promise<void> {
    const inputData = new PatternAnalyzerInputData(
      normalizePatterns(rawPatterns)
    );
    await this.inputBoundary.execute(inputData);
  }
}

function normalizePatterns(rawPatterns: unknown): string[] {
  if (!Array.isArray(rawPatterns)) return [];

  const normalized = rawPatterns
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);

  return [...new Set(normalized)];
}
