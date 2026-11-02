import type { Pattern } from '../entity/Pattern.js';
import type { PatternID } from '../entity/PatternID.js';

export interface PatternsAccessInterface {
  buildPatterns(patternIDs: PatternID[]): Promise<Pattern[]>;
}
