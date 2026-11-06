import type { Pattern } from '../entity/Pattern.js';
import type { PatternId } from '../entity/PatternId.js';

export interface PatternsAccessInterface {
  buildPatterns(patternIds: PatternId[]): Promise<Pattern[]>;
}
