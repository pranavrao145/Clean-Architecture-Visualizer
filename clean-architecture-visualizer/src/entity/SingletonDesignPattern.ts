import type { PatternDefinition } from '../types/patternDefinition.js';
import type { CodebaseASG } from './CodebaseASG.js';
import { Pattern } from './Pattern.js';
import { PatternID } from './PatternID.js';
import { PatternName } from './PatternName.js';
import { PatternType } from './PatternType.js';

export class SingletonDesignPattern extends Pattern {
  constructor(data: PatternDefinition) {
    if (data.id !== PatternID.Singleton) {
      throw new Error(
        `Invalid pattern ID for SingletonDesignPattern: ${data.id}`
      );
    }

    if (data.metadata.patternName !== PatternName.Singleton) {
      throw new Error(
        `Invalid pattern name for SingletonDesignPattern: ${data.metadata.patternName}`
      );
    }

    if (data.metadata.patternType !== PatternType.DesignPattern) {
      throw new Error(
        `Invalid pattern type for SingletonDesignPattern: ${data.metadata.patternType}`
      );
    }

    super(data);
  }

  candidateVerification(_codebaseASG: CodebaseASG): boolean {
    return true;
  }
}
