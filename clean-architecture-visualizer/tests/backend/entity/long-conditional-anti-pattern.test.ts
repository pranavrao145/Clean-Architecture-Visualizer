import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import {
  LongConditionalAntiPattern,
  MIN_CONDITIONAL_CALLS,
} from '../../../src/entity/long-conditional-anti-pattern.js';
import type { Pattern } from '../../../src/entity/Pattern.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type {
  ClassNode,
  MethodNode,
} from '../../../src/types/codebaseASGNodes.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';
import { makeLongConditionalAsg } from '../fixtures/long-conditional-asg.js';

// Builds the pattern from the real patterns.json topology.
async function buildPattern(): Promise<Pattern> {
  const [pattern] = await new PatternsAccess(
    new CommonPatternFactory()
  ).buildPatterns([PatternId.LongConditional]);
  return pattern;
}

const methodFqnOf = (candidate: CodebaseASG) =>
  candidate.getNodes().find((node) => node.type === 'METHOD')?.fqn;

describe('Long conditional candidate identification', () => {
  it('merges every conditional call of a method into one candidate', async () => {
    const pattern = await buildPattern();
    const candidates = pattern.candidateIdentification(
      makeLongConditionalAsg()
    );

    expect(candidates.map(methodFqnOf)).toEqual([
      'app.Payment.pay(java.lang.String, int)',
      'app.Payment.ship(int)',
    ]);
    const [pay, ship] = candidates;
    expect(pay.getNodes().map((node) => node.fqn)).toEqual([
      'app.Payment',
      'app.Payment.pay(java.lang.String, int)',
    ]);
    // One HAS_METHOD edge plus all seven conditional calls.
    expect(pay.getEdges()).toHaveLength(8);
    // The call to `d()` sits outside the switch, so it is left out.
    expect(
      ship
        .getEdges()
        .filter((edge) => edge.type === 'CALLS')
        .map((edge) => edge.type === 'CALLS' && edge.calledMethodFqn)
    ).toEqual(['app.Card.a()', 'app.Card.b()', 'app.Card.c()']);
  });

  it('finds nothing in a codebase without conditional calls', async () => {
    const pattern = await buildPattern();
    const asg = makeLongConditionalAsg();
    const unconditional = new CodebaseASG(
      asg.getNodes(),
      asg
        .getEdges()
        .map((edge) =>
          edge.type === 'CALLS' ? { ...edge, insideConditional: false } : edge
        )
    );

    expect(pattern.candidateIdentification(unconditional)).toEqual([]);
  });

  it('keeps only the method with a long conditional after verification', async () => {
    const pattern = await buildPattern();
    const matches = pattern
      .candidateIdentification(makeLongConditionalAsg())
      .filter((candidate) => pattern.candidateVerification(candidate));

    expect(matches.map(methodFqnOf)).toEqual([
      'app.Payment.pay(java.lang.String, int)',
    ]);
  });
});

describe('Long conditional candidate verification', () => {
  const pattern = new LongConditionalAntiPattern({
    id: PatternId.LongConditional,
    metadata: {
      patternName: PatternName.LongConditional,
      patternType: PatternType.AntiPattern,
      description: 'description',
      learningInfo: 'learning info',
    },
    candidateTopology: { nodes: [], edges: [] },
  });

  const classNode: ClassNode = {
    type: 'CLASS',
    fqn: 'example.Router',
    name: 'Router',
    packageName: 'example',
    modifiers: ['PUBLIC'],
  };
  const methodNode: MethodNode = {
    type: 'METHOD',
    fqn: 'example.Router.route(int)',
    name: 'route',
    parameterFqns: ['int'],
    returnTypeFqn: 'void',
    modifiers: ['PUBLIC'],
  };
  const hasMethod: CodebaseASGEdge = {
    type: 'HAS_METHOD',
    ownerFqn: classNode.fqn,
    methodFqn: methodNode.fqn,
  };
  const call = (
    calledMethodFqn: string,
    overrides: Partial<Extract<CodebaseASGEdge, { type: 'CALLS' }>> = {}
  ): CodebaseASGEdge => ({
    type: 'CALLS',
    callingMethodFqn: methodNode.fqn,
    calledMethodFqn,
    targetObjectFqn: 'example.Handler',
    insideLoop: false,
    insideConditional: true,
    isConstructorCall: false,
    ...overrides,
  });
  const branchCalls = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      call(`example.Handler.handle${index}()`)
    );
  const verify = (edges: CodebaseASGEdge[], nodes = [classNode, methodNode]) =>
    pattern.candidateVerification(new CodebaseASG(nodes, edges));

  it(`accepts a method with ${MIN_CONDITIONAL_CALLS} distinct conditional calls`, () => {
    expect(verify([hasMethod, ...branchCalls(MIN_CONDITIONAL_CALLS)])).toBe(
      true
    );
  });

  it.each([
    [
      'too few conditional calls',
      [hasMethod, ...branchCalls(MIN_CONDITIONAL_CALLS - 1)],
    ],
    [
      'the same method called in every branch',
      [
        hasMethod,
        ...Array(MIN_CONDITIONAL_CALLS).fill(call('example.Log.log()')),
      ],
    ],
    [
      'constructor calls counted as branches',
      [
        hasMethod,
        ...branchCalls(MIN_CONDITIONAL_CALLS - 1),
        call('example.Shape.<init>()', { isConstructorCall: true }),
      ],
    ],
    [
      'calls outside any conditional',
      [
        hasMethod,
        ...branchCalls(MIN_CONDITIONAL_CALLS - 1),
        call('example.Handler.after()', { insideConditional: false }),
      ],
    ],
    [
      'calls made by another method',
      [
        hasMethod,
        ...branchCalls(MIN_CONDITIONAL_CALLS - 1),
        call('example.Handler.other()', {
          callingMethodFqn: 'example.Other.x()',
        }),
      ],
    ],
    ['a missing ownership edge', branchCalls(MIN_CONDITIONAL_CALLS)],
  ])('rejects %s', (_name, edges) => {
    expect(verify(edges)).toBe(false);
  });

  it('rejects candidates without exactly one class and one method', () => {
    const edges = [hasMethod, ...branchCalls(MIN_CONDITIONAL_CALLS)];

    expect(verify(edges, [methodNode])).toBe(false);
    expect(verify(edges, [methodNode, methodNode])).toBe(false);
    expect(verify(edges, [classNode, methodNode, methodNode])).toBe(false);
  });
});

describe('LongConditionalAntiPattern identity', () => {
  const definition: PatternDefinition = {
    id: PatternId.LongConditional,
    metadata: {
      patternName: PatternName.LongConditional,
      patternType: PatternType.AntiPattern,
      description: 'description',
      learningInfo: 'learning info',
    },
    candidateTopology: { nodes: [], edges: [] },
  };

  it('is built by the factory for its ID', async () => {
    const pattern = await new CommonPatternFactory().create(
      PatternId.LongConditional,
      definition
    );

    expect(pattern).toBeInstanceOf(LongConditionalAntiPattern);
  });

  it.each([
    ['ID', { ...definition, id: PatternId.Singleton }],
    [
      'name',
      {
        ...definition,
        metadata: {
          ...definition.metadata,
          patternName: PatternName.Singleton,
        },
      },
    ],
    [
      'type',
      {
        ...definition,
        metadata: {
          ...definition.metadata,
          patternType: PatternType.DesignPattern,
        },
      },
    ],
  ])('rejects data with the wrong pattern %s', (field, data) => {
    expect(() => new LongConditionalAntiPattern(data)).toThrow(
      `Invalid pattern ${field}`
    );
  });

  it('tells the user to use the Strategy Pattern', async () => {
    const pattern = await buildPattern();

    expect(pattern.data.metadata.patternType).toBe(PatternType.AntiPattern);
    expect(pattern.data.metadata.learningInfo).toContain('Strategy Pattern');
  });
});
