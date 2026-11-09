export enum PatternName {
  Singleton = 'Singleton',
  AbstractFactory = 'Abstract Factory',
}

export function isPatternName(value: unknown): value is PatternName {
  return Object.values(PatternName).includes(value as PatternName);
}
