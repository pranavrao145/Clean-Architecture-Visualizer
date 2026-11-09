import { describe, expect, it } from '@jest/globals';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CodebaseInfoUML } from '../../../src/entity/codebase-info-uml.js';
import { Pattern } from '../../../src/entity/Pattern.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import { makeSingletonASG } from '../fixtures/singleton-asg.js';

class TestPattern extends Pattern {
  candidateVerification(): boolean {
    return true;
  }
}

const pattern = new TestPattern({
  id: PatternId.Singleton,
  metadata: {
    patternName: PatternName.Singleton,
    patternType: PatternType.DesignPattern,
    description: 'What it is',
    learningInfo: 'When to use it',
  },
  candidateTopology: { nodes: [], edges: [] },
});

// The nodes and edges of the singleton in the fixture.
const singletonCandidate = () => {
  const asg = makeSingletonASG();
  return new CodebaseASG(
    asg.getNodes().slice(0, 3),
    asg.getEdges().slice(0, 2)
  );
};

const classNamed = (uml: CodebaseInfoUML, name: string) => {
  const umlClass = uml.getClasses().find((c) => c.name === name);
  if (!umlClass) throw new Error(`No class named ${name}`);
  return umlClass;
};

describe('CodebaseInfoUML', () => {
  it('builds a box for every class, interface, and enum', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), []);

    expect(uml.getClasses().map((c) => [c.name, c.kind])).toEqual([
      ['Logger', 'class'],
      ['Report', 'class'],
      ['Printable', 'interface'],
      ['Level', 'enum'],
    ]);
  });

  it('writes members in UML notation and as Java declarations', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), []);
    const logger = classNamed(uml, 'Logger');

    expect(logger.codeText).toBe('public class Logger {');
    expect(logger.members.map((m) => m.umlText)).toEqual([
      '- instance: Logger {static}',
      '+ getInstance(): Logger {static}',
      '+ log(String, int, List<String>): void',
    ]);
    expect(logger.members.map((m) => m.codeText)).toEqual([
      'private static Logger instance;',
      'public static Logger getInstance();',
      'public void log(String, int, List<String>);',
    ]);
  });

  it('treats interface members with no modifier as public', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), []);

    expect(classNamed(uml, 'Printable').members[0].umlText).toBe(
      '+ print(): void'
    );
  });

  it('lists enum constants as members', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), []);

    expect(classNamed(uml, 'Level').members.map((m) => m.umlText)).toEqual([
      'LOW',
      'HIGH',
    ]);
  });

  it('accepts parameters sent as an array, as the ASG type declares', () => {
    const asg = new CodebaseASG(
      [
        {
          type: 'CLASS',
          fqn: 'a.A',
          name: 'A',
          packageName: 'a',
          modifiers: [],
        },
        {
          type: 'METHOD',
          fqn: 'a.A.m()',
          name: 'm',
          returnTypeFqn: 'void',
          parameterFqns: ['java.lang.String', 'int'],
          modifiers: ['PUBLIC'],
        },
      ],
      [{ type: 'HAS_METHOD', ownerFqn: 'a.A', methodFqn: 'a.A.m()' }]
    );

    expect(
      new CodebaseInfoUML(asg, []).getClasses()[0].members[0].umlText
    ).toBe('+ m(String, int): void');
  });

  it('resolves simple names into arrows and skips outside types', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), []);

    expect(uml.getRelationships().map((r) => r.id)).toEqual([
      'association:app.Report->app.Logger',
      'implements:app.Report->app.Printable',
    ]);
  });

  it('draws no arrow for a simple name that two classes share', () => {
    const asg = new CodebaseASG(
      [
        {
          type: 'CLASS',
          fqn: 'a.Same',
          name: 'Same',
          packageName: 'a',
          modifiers: [],
        },
        {
          type: 'CLASS',
          fqn: 'b.Same',
          name: 'Same',
          packageName: 'b',
          modifiers: [],
        },
        {
          type: 'CLASS',
          fqn: 'a.Child',
          name: 'Child',
          packageName: 'a',
          modifiers: [],
        },
      ],
      [{ type: 'EXTENDS', parentClassFqn: 'Same', childClassFqn: 'a.Child' }]
    );

    expect(new CodebaseInfoUML(asg, []).getRelationships()).toEqual([]);
  });

  it('marks exactly the elements a pattern match covers', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), [
      { pattern, candidateAsg: singletonCandidate() },
    ]);
    const logger = classNamed(uml, 'Logger');

    expect(logger.patternInstanceIds).toEqual(['singleton-0']);
    expect(logger.members.map((m) => m.patternInstanceIds)).toEqual([
      ['singleton-0'],
      ['singleton-0'],
      [],
    ]);
    expect(classNamed(uml, 'Report').patternInstanceIds).toEqual([]);
  });

  it('marks an arrow that a pattern match covers', () => {
    const asg = makeSingletonASG();
    const implementsEdge = asg
      .getEdges()
      .filter((edge) => edge.type === 'IMPLEMENTS');
    const uml = new CodebaseInfoUML(asg, [
      { pattern, candidateAsg: new CodebaseASG([], implementsEdge) },
    ]);

    expect(
      uml.getRelationships().map((r) => [r.kind, r.patternInstanceIds])
    ).toEqual([
      ['association', []],
      ['implements', ['singleton-0']],
    ]);
  });

  it('summarizes each pattern instance with its learning information', () => {
    const uml = new CodebaseInfoUML(makeSingletonASG(), [
      { pattern, candidateAsg: singletonCandidate() },
    ]);

    expect(uml.getPatternInstances()).toEqual([
      {
        id: 'singleton-0',
        patternId: 'singleton',
        patternName: 'Singleton',
        patternType: 'Design Pattern',
        description: 'What it is',
        learningInfo: 'When to use it',
        classFqns: ['app.Logger'],
        memberFqns: ['app.Logger.instance', 'app.Logger.getInstance()'],
      },
    ]);
  });
});
