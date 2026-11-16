export enum PatternName {
  Singleton = 'Singleton',
  LongConditional = 'Long Conditional Statements',
}

export function isPatternName(value: unknown): value is PatternName {
  return Object.values(PatternName).includes(value as PatternName);
}
