/**
 * Patterns the analyzer currently knows how to detect.
 *
 * TODO: once the PatternKind entity enum exists, derive this list from it
 * instead of keeping it in the use case layer.
 */
export const SUPPORTED_PATTERNS = ['singleton'] as const;
export type SupportedPattern = (typeof SUPPORTED_PATTERNS)[number];

export function isSupportedPattern(
  pattern: string
): pattern is SupportedPattern {
  return (SUPPORTED_PATTERNS as readonly string[]).includes(pattern);
}

/**
 * The list of patterns / anti-patterns the user would like to visualize.
 */
export class PatternAnalyzerInputData {
  constructor(private readonly patterns: string[]) {}

  getPatterns(): string[] {
    return [...this.patterns];
  }
}
