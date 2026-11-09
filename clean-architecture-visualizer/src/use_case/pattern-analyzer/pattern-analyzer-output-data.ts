import type {
  PatternInstance,
  UmlClass,
  UmlRelationship,
} from '../../types/codebase-info-uml.js';

// The UML class diagram, and the pattern instances to highlight on it.
export class PatternAnalyzerOutputData {
  constructor(
    private readonly classes: UmlClass[],
    private readonly relationships: UmlRelationship[],
    private readonly patternInstances: PatternInstance[]
  ) {}

  getClasses(): UmlClass[] {
    return this.classes;
  }

  getRelationships(): UmlRelationship[] {
    return this.relationships;
  }

  getPatternInstances(): PatternInstance[] {
    return this.patternInstances;
  }
}
