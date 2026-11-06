export enum PatternType {
  DesignPattern = 'Design Pattern',
}

export function isPatternType(value: unknown): value is PatternType {
  return Object.values(PatternType).includes(value as PatternType);
}
