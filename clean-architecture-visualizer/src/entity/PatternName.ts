export enum PatternName {
  Singleton = 'Singleton',
}

export function isPatternName(value: unknown): value is PatternName {
  return Object.values(PatternName).includes(value as PatternName);
}
