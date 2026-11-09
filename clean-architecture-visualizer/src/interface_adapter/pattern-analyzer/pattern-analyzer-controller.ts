import type { PatternAnalyzerInputBoundary } from '../../use_case/pattern-analyzer/pattern-analyzer-input-boundary.js';
import { PatternAnalyzerInputData } from '../../use_case/pattern-analyzer/pattern-analyzer-input-data.js';

export class PatternAnalyzerController {
  constructor(private readonly inputBoundary: PatternAnalyzerInputBoundary) {}

  async execute(rawPatternIds: unknown): Promise<void> {
    // Convert the request to a list of strings.
    const patternIds = [rawPatternIds].flat().map(String);

    // Execute the use case.
    await this.inputBoundary.execute(new PatternAnalyzerInputData(patternIds));
  }
}
