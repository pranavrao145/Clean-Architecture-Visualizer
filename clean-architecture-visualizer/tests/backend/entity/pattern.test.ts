import { describe, expect, it } from '@jest/globals';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { Pattern } from '../../../src/entity/Pattern.js';
import { PatternID } from '../../../src/entity/PatternID.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import { SingletonDesignPattern } from '../../../src/entity/SingletonDesignPattern.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';

class TestPattern extends Pattern {
  candidateVerification(): boolean {
    return true;
  }
}

const definition = (
  nodes: PatternDefinition['candidateTopology']['nodes'],
  edges: PatternDefinition['candidateTopology']['edges']
): PatternDefinition => ({
  id: PatternID.Singleton,
  metadata: {
    patternName: PatternName.Singleton,
    patternType: PatternType.DesignPattern,
    description: '',
    learningInfo: '',
  },
  candidateTopology: { nodes, edges },
});

describe('Pattern candidate identification', () => {
  it('finds generic topology matches and preserves placeholder bindings', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'CLASS',
            fqn: '$class',
            name: '',
            packageName: '',
            modifiers: [],
          },
          {
            type: 'FIELD',
            fqn: '$field',
            name: '',
            typeFqn: '$class',
            modifiers: [],
          },
        ],
        [{ type: 'HAS_FIELD', ownerFqn: '$class', fieldFqn: '$field' }]
      )
    );
    const classNode = {
      type: 'CLASS' as const,
      fqn: 'example.Service',
      name: 'Service',
      packageName: 'example',
      modifiers: ['PUBLIC' as const],
    };
    const fieldNode = {
      type: 'FIELD' as const,
      fqn: 'example.Service.instance',
      name: 'instance',
      typeFqn: classNode.fqn,
      modifiers: ['PRIVATE' as const],
    };
    const edge = {
      type: 'HAS_FIELD' as const,
      ownerFqn: classNode.fqn,
      fieldFqn: fieldNode.fqn,
    };

    const matches = pattern.candidateIdentification(
      new CodebaseASG([classNode, fieldNode], [edge])
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toBeInstanceOf(CodebaseASG);
    expect(matches[0].getNodes()).toEqual([classNode, fieldNode]);
    expect(matches[0].getEdges()).toEqual([edge]);
  });

  it('allows extra nodes and edges while requiring declared edge direction', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'CLASS',
            fqn: '$class',
            name: '',
            packageName: '',
            modifiers: [],
          },
          {
            type: 'METHOD',
            fqn: '$method',
            name: '',
            parameterFqns: [],
            returnTypeFqn: '',
            modifiers: [],
          },
        ],
        [{ type: 'HAS_METHOD', ownerFqn: '$class', methodFqn: '$method' }]
      )
    );
    const classNode = {
      type: 'CLASS' as const,
      fqn: 'example.Service',
      name: 'Service',
      packageName: 'example',
      modifiers: [],
    };
    const methodNode = {
      type: 'METHOD' as const,
      fqn: 'example.Service.run',
      name: 'run',
      parameterFqns: [],
      returnTypeFqn: 'void',
      modifiers: [],
    };
    const edge = {
      type: 'HAS_METHOD' as const,
      ownerFqn: classNode.fqn,
      methodFqn: methodNode.fqn,
    };
    const unrelatedEdge = {
      type: 'CALLS' as const,
      callingMethodFqn: methodNode.fqn,
      calledMethodFqn: methodNode.fqn,
      targetObjectFqn: classNode.fqn,
      insideLoop: false,
      insideConditional: false,
      isConstructorCall: false,
    };

    expect(
      pattern.candidateIdentification(
        new CodebaseASG([classNode, methodNode], [edge, unrelatedEdge])
      )
    ).toHaveLength(1);
    expect(
      pattern.candidateIdentification(
        new CodebaseASG(
          [classNode, methodNode],
          [{ ...edge, ownerFqn: methodNode.fqn }]
        )
      )
    ).toHaveLength(0);
  });

  it('finds every independent match in the same ASG', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'CLASS',
            fqn: '$class',
            name: '',
            packageName: '',
            modifiers: [],
          },
        ],
        []
      )
    );
    const firstClass = {
      type: 'CLASS' as const,
      fqn: 'example.First',
      name: 'First',
      packageName: 'example',
      modifiers: [],
    };
    const secondClass = {
      type: 'CLASS' as const,
      fqn: 'example.Second',
      name: 'Second',
      packageName: 'example',
      modifiers: [],
    };

    const matches = pattern.candidateIdentification(
      new CodebaseASG([firstClass, secondClass], [])
    );

    expect(matches).toHaveLength(2);
    expect(matches.map((match) => match.getNodes())).toEqual([
      [firstClass],
      [secondClass],
    ]);
  });

  it('matches exact scalar values and non-empty arrays', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'METHOD',
            fqn: '$method',
            name: 'run',
            parameterFqns: ['java.lang.String'],
            returnTypeFqn: 'void',
            modifiers: ['PUBLIC'],
          },
        ],
        []
      )
    );
    const matchingMethod = {
      type: 'METHOD' as const,
      fqn: 'example.Service.run(java.lang.String)',
      name: 'run',
      parameterFqns: ['java.lang.String'],
      returnTypeFqn: 'void',
      modifiers: ['PUBLIC' as const],
    };
    const wrongParameterMethod = {
      ...matchingMethod,
      fqn: 'example.Service.run(int)',
      parameterFqns: ['int'],
    };
    const wrongReturnTypeMethod = {
      ...matchingMethod,
      fqn: 'example.Service.run2(java.lang.String)',
      returnTypeFqn: 'int',
    };

    expect(
      pattern.candidateIdentification(
        new CodebaseASG(
          [matchingMethod, wrongParameterMethod, wrongReturnTypeMethod],
          []
        )
      )
    ).toHaveLength(1);
  });

  it('binds placeholders through arrays and edge properties', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'METHOD',
            fqn: '$caller',
            name: '',
            parameterFqns: ['$parameter'],
            returnTypeFqn: '',
            modifiers: [],
          },
          {
            type: 'METHOD',
            fqn: '$called',
            name: '',
            parameterFqns: [],
            returnTypeFqn: '',
            modifiers: [],
          },
        ],
        [
          {
            type: 'CALLS',
            callingMethodFqn: '$caller',
            calledMethodFqn: '$called',
            targetObjectFqn: '',
            insideLoop: false,
            insideConditional: false,
            isConstructorCall: false,
          },
        ]
      )
    );
    const caller = {
      type: 'METHOD' as const,
      fqn: 'example.Caller.run(java.lang.String)',
      name: 'run',
      parameterFqns: ['java.lang.String'],
      returnTypeFqn: 'void',
      modifiers: [],
    };
    const called = {
      type: 'METHOD' as const,
      fqn: 'example.Callee.run()',
      name: 'run',
      parameterFqns: [],
      returnTypeFqn: 'void',
      modifiers: [],
    };
    const validCall = {
      type: 'CALLS' as const,
      callingMethodFqn: caller.fqn,
      calledMethodFqn: called.fqn,
      targetObjectFqn: 'example.Callee',
      insideLoop: false,
      insideConditional: false,
      isConstructorCall: false,
    };
    const invalidCall = { ...validCall, insideConditional: true };

    expect(
      pattern.candidateIdentification(
        new CodebaseASG([caller, called], [validCall, invalidCall])
      )
    ).toHaveLength(1);
  });
});

describe('Singleton candidate verification', () => {
  const singleton = new SingletonDesignPattern(definition([], []));

  const classNode = {
    type: 'CLASS' as const,
    fqn: 'example.Singleton',
    name: 'Singleton',
    packageName: 'example',
    modifiers: [],
  };
  const fieldNode = {
    type: 'FIELD' as const,
    fqn: 'example.Singleton.instance',
    name: 'instance',
    typeFqn: classNode.fqn,
    modifiers: ['PRIVATE' as const, 'STATIC' as const],
  };
  const methodNode = {
    type: 'METHOD' as const,
    fqn: 'example.Singleton.getInstance()',
    name: 'getInstance',
    parameterFqns: [],
    returnTypeFqn: classNode.fqn,
    modifiers: ['PUBLIC' as const, 'STATIC' as const],
  };
  const edges = [
    {
      type: 'HAS_FIELD' as const,
      ownerFqn: classNode.fqn,
      fieldFqn: fieldNode.fqn,
    },
    {
      type: 'HAS_METHOD' as const,
      ownerFqn: classNode.fqn,
      methodFqn: methodNode.fqn,
    },
  ];

  it('accepts a semantically valid singleton candidate', () => {
    expect(
      singleton.candidateVerification(
        new CodebaseASG([classNode, fieldNode, methodNode], edges)
      )
    ).toBe(true);
  });

  it.each([
    ['a non-singleton field name', { field: { name: 'other' } }],
    ['a non-private field', { field: { modifiers: ['PUBLIC'] } }],
    ['a field of another type', { field: { typeFqn: 'example.Other' } }],
    ['a non-singleton accessor name', { method: { name: 'instance' } }],
    ['an accessor with parameters', { method: { parameterFqns: ['int'] } }],
    [
      'an accessor returning another type',
      { method: { returnTypeFqn: 'void' } },
    ],
    [
      'an accessor with the wrong modifiers',
      { method: { modifiers: ['PRIVATE'] } },
    ],
    [
      'an instance field with the wrong modifiers',
      { field: { modifiers: ['PRIVATE'] } },
    ],
  ])('rejects %s', (_description, changes) => {
    const changedField = { ...fieldNode, ...changes.field };
    const changedMethod = { ...methodNode, ...changes.method };
    expect(
      singleton.candidateVerification(
        new CodebaseASG(
          [classNode, changedField, changedMethod],
          [
            {
              ...edges[0],
              fieldFqn: changedField.fqn,
            },
            {
              ...edges[1],
              methodFqn: changedMethod.fqn,
            },
          ]
        )
      )
    ).toBe(false);
  });

  it.each([
    ['an incomplete candidate', [classNode, fieldNode], edges],
    [
      'a candidate with an extra node',
      [
        classNode,
        fieldNode,
        methodNode,
        { ...classNode, fqn: 'example.Other' },
      ],
      edges,
    ],
    [
      'a candidate missing the field edge',
      [classNode, fieldNode, methodNode],
      [edges[1]],
    ],
    [
      'a candidate with an incorrectly directed field edge',
      [classNode, fieldNode, methodNode],
      [{ ...edges[0], ownerFqn: fieldNode.fqn }, edges[1]],
    ],
  ])('rejects %s', (_description, candidateNodes, candidateEdges) => {
    expect(
      singleton.candidateVerification(
        new CodebaseASG(candidateNodes, candidateEdges)
      )
    ).toBe(false);
  });
});
