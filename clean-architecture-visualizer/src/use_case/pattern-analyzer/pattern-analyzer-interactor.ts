import type { JavaParserCliAccessInterface } from '../../data_access/JavaParserCliAccessInterface.js';
import type { PatternsAccessInterface } from '../../data_access/PatternsAccessInterface.js';
import type { CodebaseASG } from '../../entity/CodebaseASG.js';
import {
  CodebaseInfoUML,
  type PatternMatch,
} from '../../entity/codebase-info-uml.js';
import type { Pattern } from '../../entity/Pattern.js';
import { isPatternId } from '../../entity/PatternId.js';
import type { PatternAnalyzerInputBoundary } from './pattern-analyzer-input-boundary.js';
import type { PatternAnalyzerInputData } from './pattern-analyzer-input-data.js';
import type { PatternAnalyzerOutputBoundary } from './pattern-analyzer-output-boundary.js';
import { PatternAnalyzerOutputData } from './pattern-analyzer-output-data.js';

export class PatternAnalyzerInteractor implements PatternAnalyzerInputBoundary {
  constructor(
    private readonly patternsAccess: PatternsAccessInterface,
    private readonly javaParserCliAccess: JavaParserCliAccessInterface,
    private readonly outputBoundary: PatternAnalyzerOutputBoundary
  ) {}

  async execute(inputData: PatternAnalyzerInputData): Promise<void> {
    // 1. Get the pattern IDs from the input data.
    const patternIds = inputData.getPatternIds();
    const unknownId = patternIds.find((id) => !isPatternId(id));
    if (unknownId !== undefined) {
      this.outputBoundary.prepareInvalidInputView(
        `Unknown pattern ID: ${unknownId}`
      );
      return;
    }

    try {
      // 2. Build the patterns.
      const patterns = await this.patternsAccess.buildPatterns(
        patternIds.filter(isPatternId)
      );

      // 3. Build the codebase ASG.
      const codebaseAsg = await this.javaParserCliAccess.buildCodebaseASG();

      // 4. Find the matches.
      const patternMatches = patterns.flatMap((pattern) =>
        this.findMatches(pattern, codebaseAsg)
      );

      // 5. Build the codebase info UML.
      const codebaseInfoUml = new CodebaseInfoUML(codebaseAsg, patternMatches);

      // 6. Prepare the output data.
      this.outputBoundary.prepareSuccessView(
        new PatternAnalyzerOutputData(
          codebaseInfoUml.getClasses(),
          codebaseInfoUml.getRelationships(),
          codebaseInfoUml.getPatternInstances()
        )
      );
    } catch (error) {
      this.outputBoundary.prepareFailView((error as Error).message);
    }
  }

  /**
   * Pass 1 finds subgraphs shaped like the pattern's topology.
   * Pass 2 keeps only the ones that meet the pattern's own rules.
   */
  private findMatches(
    pattern: Pattern,
    codebaseAsg: CodebaseASG
  ): PatternMatch[] {
    return pattern
      // 1. Find the candidates.
      .candidateIdentification(codebaseAsg)
      // 2. Filter the candidates.
      .filter((candidateAsg) => pattern.candidateVerification(candidateAsg))
      // 3. Build the pattern matches.
      .map((candidateAsg) => ({ pattern, candidateAsg }));
  }
}
