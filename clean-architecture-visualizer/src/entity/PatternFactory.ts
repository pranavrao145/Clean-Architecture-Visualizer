import type { PatternDefinition } from '../types/patternDefinition.js';
import type { Pattern } from './Pattern.js';
import type { PatternId } from './PatternId.js';

export interface PatternFactory {
  create(patternId: PatternId, data: PatternDefinition): Promise<Pattern>;
}
