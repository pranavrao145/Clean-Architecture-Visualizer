export enum PatternId {
  Singleton = 'singleton',
  LongConditional = 'long-conditional',
}

export function isPatternId(value: unknown): value is PatternId {
  return Object.values(PatternId).includes(value as PatternId);
}
