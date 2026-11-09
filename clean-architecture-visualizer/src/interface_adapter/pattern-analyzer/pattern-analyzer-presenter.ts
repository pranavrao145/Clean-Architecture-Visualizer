import type { PatternAnalyzerOutputBoundary } from '../../use_case/pattern-analyzer/pattern-analyzer-output-boundary.js';
import type { PatternAnalyzerOutputData } from '../../use_case/pattern-analyzer/pattern-analyzer-output-data.js';

export type PatternAnalyzerResponse = {
  status: number;
  body: object;
};

// Turns the Interactor's result into the response the API sends.
export class PatternAnalyzerPresenter implements PatternAnalyzerOutputBoundary {
  private response: PatternAnalyzerResponse = {
    status: 500,
    body: { error: 'Pattern analysis did not run.' },
  };

  prepareSuccessView(outputData: PatternAnalyzerOutputData): void {
    this.response = {
      status: 200,
      body: {
        classes: outputData.getClasses(),
        relationships: outputData.getRelationships(),
        patternInstances: outputData.getPatternInstances(),
      },
    };
  }

  prepareInvalidInputView(error: string): void {
    this.response = { status: 400, body: { error } };
  }

  prepareFailView(error: string): void {
    this.response = { status: 500, body: { error } };
  }

  getResponse(): PatternAnalyzerResponse {
    return this.response;
  }
}
