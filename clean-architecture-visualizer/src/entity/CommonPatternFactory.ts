import type { PatternDefinition } from '../types/patternDefinition.js';
import type { Pattern } from './Pattern.js';
import type { PatternFactory } from './PatternFactory.js';
import { PatternId } from './PatternId.js';
import { SingletonDesignPattern } from './SingletonDesignPattern.js';

type PatternConstructor = new (data: PatternDefinition) => Pattern;

const patternRegistry: Record<PatternId, PatternConstructor> = {
  [PatternId.Singleton]: SingletonDesignPattern,
};

export class CommonPatternFactory implements PatternFactory {
  async create(
    patternId: PatternId,
    data: PatternDefinition
  ): Promise<Pattern> {
    if (!Object.values(PatternId).includes(patternId)) {
      throw new Error(`Unknown pattern ID: ${patternId}`);
    }

    const PatternClass = patternRegistry[patternId];
    if (!PatternClass) {
      throw new Error(`No pattern registered for ID: ${patternId}`);
    }

    return new PatternClass(data);
  }
}
