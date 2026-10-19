import patternData from '../database/patterns.json' with {
  type: 'json',
};

type PatternName = keyof typeof patternData;
type PatternDefinition = (typeof patternData)[PatternName];

export abstract class pattern {
  readonly data: PatternDefinition;

  constructor(patternName: PatternName) {
    this.data = patternData[patternName];
  }

  candidateIdentification(codebaseASG: object): boolean {
    return true;
  }

  abstract candidateVerification(codebaseASG: object): boolean;
}
