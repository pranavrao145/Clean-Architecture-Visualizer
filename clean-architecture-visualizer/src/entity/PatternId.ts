export enum PatternId {
  Singleton = 'singleton',
  Adapter = 'adapter',
}

export function isPatternId(value: unknown): value is PatternId {
  return Object.values(PatternId).includes(value as PatternId);
}
