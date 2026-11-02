import type { PatternDefinition } from '../types/patternDefinition.js';
import type { CodebaseASG } from './CodebaseASG.js';

export abstract class Pattern {
  readonly data: PatternDefinition;

  constructor(data: PatternDefinition) {
    this.data = data;
  }

  candidateIdentification(_codebaseASG: CodebaseASG): boolean {
    return true;
  }

  abstract candidateVerification(_codebaseASG: CodebaseASG): boolean;
}
