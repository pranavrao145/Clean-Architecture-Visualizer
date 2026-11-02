import type { PatternDefinition } from '../types/patternDefinition.js';
import type { Pattern } from './Pattern.js';
import type { PatternID } from './PatternID.js';

export interface PatternFactory {
  create(patternId: PatternID, data: PatternDefinition): Promise<Pattern>;
}
