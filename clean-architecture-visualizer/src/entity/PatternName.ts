export enum PatternName {
  Singleton = 'Singleton',
  AbstractFactory = 'AbstractFactory',
}

export function isPatternName(value: unknown): value is PatternName {
  return Object.values(PatternName).includes(value as PatternName);
}
