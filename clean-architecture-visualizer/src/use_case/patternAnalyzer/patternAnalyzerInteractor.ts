import type { PatternAnalyzerInputBoundary } from './patternAnalyzerInputBoundary.js';
import {
  isSupportedPattern,
  type PatternAnalyzerInputData,
} from './patternAnalyzerInputData.js';
import type { PatternAnalyzerOutputBoundary } from './patternAnalyzerOutputBoundary.js';
import { PatternAnalyzerOutputData } from './patternAnalyzerOutputData.js';

/**
 * Detects the requested design patterns / anti-patterns in the user's codebase
 * and produces the UML needed to visualize them.
 *
 * TODO: inject the Pattern Data Access Interface (gives Pattern entities via a
 * factory) and the JavaParser Data Access Interface (gives the CodebaseASG
 * entity) once they exist.
 */
export class PatternAnalyzerInteractor implements PatternAnalyzerInputBoundary {
  constructor(private readonly outputBoundary: PatternAnalyzerOutputBoundary) {}

  async execute(inputData: PatternAnalyzerInputData): Promise<void> {
    const requestedPatterns = inputData.getPatterns();

    if (requestedPatterns.length === 0) {
      this.outputBoundary.prepareFailView(
        'At least one pattern must be requested.'
      );
      return;
    }

    const unsupported = requestedPatterns.filter((p) => !isSupportedPattern(p));
    if (unsupported.length > 0) {
      this.outputBoundary.prepareFailView(
        `Unsupported pattern(s): ${unsupported.join(', ')}.`
      );
      return;
    }

    // TODO 1. Pattern candidate identification: find candidates by matching
    //    known pattern topologies against the CodebaseASG (Graphology queries),
    //    by calling every requested Pattern entity's pass-1 method.

    // TODO 2. Pattern candidate verification: query metadata / code info from
    //    the JavaParser JSON to confirm candidates, by calling each candidate
    //    Pattern entity's pass-2 method.

    // TODO 3. Build the UML from the ASG and verified candidates, and put it
    //    into a CodebaseInfoUML entity; map that entity into the output data.

    this.outputBoundary.prepareSuccessView(
      new PatternAnalyzerOutputData({
        requestedPatterns,
        patterns: [],
        classes: [],
        relationships: [],
        patternInstances: [],
      })
    );
  }
}
