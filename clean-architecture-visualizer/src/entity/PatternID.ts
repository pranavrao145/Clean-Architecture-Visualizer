export enum PatternID {
  Singleton = 'singleton',
}

export function isPatternID(value: unknown): value is PatternID {
  return Object.values(PatternID).includes(value as PatternID);
}
