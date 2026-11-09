// The patterns the user wants to detect and see on the diagram.
export class PatternAnalyzerInputData {
  constructor(private readonly patternIds: string[]) {}

  getPatternIds(): string[] {
    return this.patternIds;
  }
}
