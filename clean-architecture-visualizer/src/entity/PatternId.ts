export enum PatternId {
  Singleton = 'singleton',
  AbstractFactory = 'abstractfactory',
}

export function isPatternId(value: unknown): value is PatternId {
  return Object.values(PatternId).includes(value as PatternId);
}
