import { describe, expect, it } from '@jest/globals';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { Pattern } from '../../../src/entity/Pattern.js';
import { PatternId } from '../../../src/entity/PatternId.js';
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
  nodes: PatternDefinition['candidateTopologies'][number]['nodes'],
  edges: PatternDefinition['candidateTopologies'][number]['edges']
): PatternDefinition => ({
  id: PatternId.Singleton,
  metadata: {
    patternName: PatternName.Singleton,
    patternType: PatternType.DesignPattern,
    description: '',
    learningInfo: '',
  },
  candidateTopologies: [{ nodes, edges }],
});

describe('Pattern candidate identification', () => {
  const collectionTopology: PatternDefinition['candidateTopologies'][number] = {
    nodes: [{ type: 'CLASS', fqn: { bind: 'owner' } }],
    edges: [],
    collectMatches: [
      {
        nodes: [
          {
            type: 'METHOD',
            fqn: { bind: 'method' },
            parameterFqns: [],
          },
        ],
        edges: [
          {
            type: 'HAS_METHOD',
            ownerFqn: { equalsBinding: 'owner' },
            methodFqn: { equalsBinding: 'method' },
          },
        ],
      },
    ],
  };

  const collectionGraph = new CodebaseASG(
    [
      { type: 'CLASS', fqn: 'A', name: 'A', packageName: '', modifiers: [] },
      { type: 'CLASS', fqn: 'B', name: 'B', packageName: '', modifiers: [] },
      { type: 'CLASS', fqn: 'C', name: 'C', packageName: '', modifiers: [] },
      { type: 'METHOD', fqn: 'A.first', name: 'first', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
      { type: 'METHOD', fqn: 'A.second', name: 'second', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
      { type: 'METHOD', fqn: 'A.withArg', name: 'withArg', parameterFqns: ['int'], returnTypeFqn: 'void', modifiers: [] },
      { type: 'METHOD', fqn: 'B.only', name: 'only', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
      { type: 'METHOD', fqn: 'unowned', name: 'unowned', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
    ],
    [
      { type: 'HAS_METHOD', ownerFqn: 'A', methodFqn: 'A.first' },
      { type: 'HAS_METHOD', ownerFqn: 'A', methodFqn: 'A.second' },
      { type: 'HAS_METHOD', ownerFqn: 'A', methodFqn: 'A.withArg' },
      { type: 'HAS_METHOD', ownerFqn: 'B', methodFqn: 'B.only' },
    ]
  );

  it('collects all matching owned methods and edges per base candidate', () => {
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [collectionTopology],
    });

    const matches = pattern.candidateIdentification(collectionGraph);

    expect(matches.map((candidate) => candidate.getNodes().map((node) => node.fqn))).toEqual([
      ['A', 'A.first', 'A.second'],
      ['B', 'B.only'],
      ['C'],
    ]);

    expect(matches.map((candidate) => candidate.getEdges())).toEqual([
      [collectionGraph.getEdges()[0], collectionGraph.getEdges()[1]],
      [collectionGraph.getEdges()[3]],
      [],
    ]);
  });

    it('collects methods whose bindings occur together in an array element', () => {
      const topology: PatternDefinition['candidateTopologies'][number] = {
        nodes: [{ type: 'CLASS', fqn: { bind: 'owner' } }],
        edges: [],
        collectMatches: [{
          nodes: [{ type: 'METHOD', fqn: { bind: 'method' } }],
          edges: [
            { type: 'HAS_METHOD', ownerFqn: { equalsBinding: 'owner' }, methodFqn: { equalsBinding: 'method' } },
            {
              type: 'IMPLEMENTS',
              implementingClassFqn: { equalsBinding: 'owner' },
              methodImplementations: {
                contains: {
                  interfaceMethodFqn: 'Target.first',
                  implementationMethodFqn: { equalsBinding: 'method' },
                },
              },
            },
          ],
        }],
      };

      const graph = new CodebaseASG(collectionGraph.getNodes(), [
        ...collectionGraph.getEdges(),
        {
          type: 'IMPLEMENTS',
          interfaceFqn: 'Target',
          implementingClassFqn: 'A',
          methodImplementations: [
            { interfaceMethodFqn: 'Target.first', implementationMethodFqn: 'A.first' },
            { interfaceMethodFqn: 'Target.second', implementationMethodFqn: 'A.second' },
          ],
        },
        { type: 'IMPLEMENTS', interfaceFqn: 'Target', implementingClassFqn: 'B', methodImplementations: [] },
      ]);
      const pattern = new TestPattern({ ...definition([], []), candidateTopologies: [topology] });

      expect(pattern.candidateIdentification(graph).map((candidate) =>
        candidate.getNodes().map((node) => node.fqn)
      )).toEqual([['A', 'A.first'], ['B'], ['C']]);
    });

    it('excludes methods with any forbidden modifier while allowing empty modifiers', () => {
      const pattern = new TestPattern(definition([
        { type: 'METHOD', modifiers: { excludes: ['PRIVATE', 'STATIC'] } },
      ], []));
      const method = {
        type: 'METHOD' as const,
        fqn: 'm',
        name: 'm',
        parameterFqns: [],
        returnTypeFqn: 'void',
      };
      const graph = new CodebaseASG([
        { ...method, fqn: 'empty', modifiers: [] },
        { ...method, fqn: 'public', modifiers: ['PUBLIC'] },
        { ...method, fqn: 'private', modifiers: ['PRIVATE'] },
        { ...method, fqn: 'static', modifiers: ['PUBLIC', 'STATIC'] },
      ], []);
      expect(pattern.candidateIdentification(graph).map((candidate) => candidate.getNodes()[0].fqn))
        .toEqual(['empty', 'public']);
    });

    it('matches a scalar array element with contains', () => {
      const pattern = new TestPattern(definition([
        { type: 'METHOD', modifiers: { contains: 'PUBLIC' } },
      ], []));
      const method = {
        type: 'METHOD' as const,
        name: 'm',
        parameterFqns: [],
        returnTypeFqn: 'void',
      };
      const graph = new CodebaseASG([
        { ...method, fqn: 'public', modifiers: ['PUBLIC', 'STATIC'] },
        { ...method, fqn: 'private', modifiers: ['PRIVATE'] },
        { ...method, fqn: 'empty', modifiers: [] },
      ], []);
      expect(pattern.candidateIdentification(graph).map((candidate) => candidate.getNodes()[0].fqn))
        .toEqual(['public']);
    });

    it('validates contains bindings and excludes operands before matching', () => {
      const badContains = definition([], [{
        type: 'IMPLEMENTS',
        methodImplementations: { contains: { implementationMethodFqn: { equalsBinding: 'missing' } } },
      }]);
      const bindsInsideContains = definition([], [{
        type: 'IMPLEMENTS',
        methodImplementations: { contains: { implementationMethodFqn: { bind: 'local' } } },
      }] as never);
      const badExcludes = definition([
        { type: 'METHOD', modifiers: { excludes: 'PRIVATE' } },
      ] as never, []);
      expect(() => new TestPattern(badContains).candidateIdentification(new CodebaseASG([], [])))
        .toThrow('Unbound query reference: missing');
      expect(() => new TestPattern(bindsInsideContains).candidateIdentification(new CodebaseASG([], [])))
        .toThrow('Cannot introduce a binding inside contains');
      expect(() => new TestPattern(badExcludes).candidateIdentification(new CodebaseASG([], [])))
        .toThrow('The excludes operator requires an array');
    });

    it('matches either of several node types with oneOf', () => {
      const pattern = new TestPattern(definition([
        { type: { oneOf: ['CLASS', 'INTERFACE'] }, fqn: { bind: 'type' } },
      ], []));
      const graph = new CodebaseASG([
        { type: 'CLASS', fqn: 'C', name: 'C', packageName: '', modifiers: [], supertypeFqns: [] },
        { type: 'INTERFACE', fqn: 'I', name: 'I', packageName: '', modifiers: [] },
        { type: 'ENUM', fqn: 'E', name: 'E', packageName: '', constants: [] },
      ], []);
      expect(pattern.candidateIdentification(graph).map((candidate) => candidate.getNodes()[0].fqn))
        .toEqual(['C', 'I']);
    });

    it('matches scalar, binding and object alternatives with oneOf', () => {
      const pattern = new TestPattern(definition([
        { type: 'CLASS', fqn: { bind: 'owner' } },
        {
          type: 'FIELD',
          typeFqn: { oneOf: ['String', { equalsBinding: 'owner' }] },
        },
      ], []));
      const field = { type: 'FIELD' as const, name: 'f', modifiers: [] };
      const graph = new CodebaseASG([
        { type: 'CLASS', fqn: 'A', name: 'A', packageName: '', modifiers: [], supertypeFqns: [] },
        { ...field, fqn: 'string', typeFqn: 'String' },
        { ...field, fqn: 'self', typeFqn: 'A' },
        { ...field, fqn: 'other', typeFqn: 'B' },
      ], []);
      expect(pattern.candidateIdentification(graph).map((candidate) =>
        candidate.getNodes().map((node) => node.fqn)
      )).toEqual([['A', 'string'], ['A', 'self']]);
    });

    it('matches an unmatched value with no oneOf alternative', () => {
      const pattern = new TestPattern(definition([
        { type: { oneOf: ['CLASS', 'INTERFACE'] } },
      ], []));
      const graph = new CodebaseASG([
        { type: 'ENUM', fqn: 'E', name: 'E', packageName: '', constants: [] },
      ], []);
      expect(pattern.candidateIdentification(graph)).toHaveLength(0);
    });

    it('validates oneOf operands before matching', () => {
      const empty = definition([{ type: { oneOf: [] } }] as never, []);
      const notArray = definition([{ type: { oneOf: 'CLASS' } }] as never, []);
      const binds = definition([
        { type: 'CLASS', fqn: { oneOf: [{ bind: 'local' }] } },
      ] as never, []);
      const unbound = definition([
        { type: 'CLASS', fqn: { oneOf: [{ equalsBinding: 'missing' }] } },
      ] as never, []);
      const identify = (pattern: PatternDefinition) =>
        new TestPattern(pattern).candidateIdentification(new CodebaseASG([], []));
      expect(() => identify(empty)).toThrow('The oneOf operator requires a non-empty array');
      expect(() => identify(notArray)).toThrow('The oneOf operator requires a non-empty array');
      expect(() => identify(binds)).toThrow('Cannot introduce a binding inside contains or oneOf');
      expect(() => identify(unbound)).toThrow('Unbound query reference: missing');
    });

  it('requires the requested number of distinct collection matches', () => {
    const collection = collectionTopology.collectMatches![0];
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        {
          ...collectionTopology,
          collectMatches: [
            {
              ...collection,
              minMatches: 2,
            },
          ],
        },
      ],
    });

    const matches = pattern.candidateIdentification(collectionGraph);

    expect(matches).toHaveLength(1);
    expect(matches[0].getNodes().map((node) => node.fqn)).toEqual([
      'A',
      'A.first',
      'A.second',
    ]);
  });

  it('keeps collection bindings independent while merging their results', () => {
    const collection = collectionTopology.collectMatches![0];
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        {
          ...collectionTopology,
          collectMatches: [
            collection,
            {
              ...collection,
              nodes: [
                {
                  type: 'METHOD',
                  fqn: { bind: 'method' },
                  parameterFqns: ['int'],
                },
              ],
            },
          ],
        },
      ],
    });

    const [candidate] = pattern.candidateIdentification(collectionGraph);

    expect(candidate.getNodes().map((node) => node.fqn)).toEqual([
      'A',
      'A.first',
      'A.second',
      'A.withArg',
    ]);

    expect(candidate.getEdges()).toHaveLength(3);
  });

  it('collects separately for different bindings of the same base subgraph', () => {
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        {
          nodes: [
            { type: 'CLASS', fqn: { bind: 'owner' } },
            { type: 'CLASS' },
          ],
          edges: [],
          collectMatches: collectionTopology.collectMatches,
        },
      ],
    });

    const graph = new CodebaseASG(
      [
        { type: 'CLASS', fqn: 'A', name: 'A', packageName: '', modifiers: [] },
        { type: 'CLASS', fqn: 'B', name: 'B', packageName: '', modifiers: [] },
        { type: 'METHOD', fqn: 'A.m', name: 'm', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
        { type: 'METHOD', fqn: 'B.m', name: 'm', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
      ],
      [
        { type: 'HAS_METHOD', ownerFqn: 'A', methodFqn: 'A.m' },
        { type: 'HAS_METHOD', ownerFqn: 'B', methodFqn: 'B.m' },
      ]
    );

    const matches = pattern.candidateIdentification(graph);

    expect(matches).toHaveLength(2);
    expect(matches.map((candidate) => candidate.getNodes().map((node) => node.fqn))).toEqual([
      ['A', 'B', 'A.m'],
      ['B', 'A', 'B.m'],
    ]);
  });

  it('can collect a base node without duplicating it in the candidate', () => {
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        {
          nodes: [{ type: 'CLASS', fqn: { bind: 'owner' } }],
          edges: [],
          collectMatches: [
            {
              nodes: [{ type: 'CLASS', fqn: { equalsBinding: 'owner' } }],
              edges: [],
              minMatches: 1,
            },
          ],
        },
      ],
    });

    const candidates = pattern.candidateIdentification(collectionGraph);

    expect(candidates.map((candidate) => candidate.getNodes().length)).toEqual([
      1, 1, 1,
    ]);
  });

  it('rejects invalid collection minima and leaked local bindings before matching', () => {
    const collection = collectionTopology.collectMatches![0];
    const makePattern = (
      collectMatches: NonNullable<typeof collectionTopology.collectMatches>
    ) =>
      new TestPattern({
        ...definition([], []),
        candidateTopologies: [{ ...collectionTopology, collectMatches }],
      });

    expect(() =>
      makePattern([{ ...collection, minMatches: -1 }]).candidateIdentification(
        new CodebaseASG([], [])
      )
    ).toThrow('Collection minMatches must be a non-negative integer');
    expect(() =>
      makePattern([{ nodes: [], edges: [] }]).candidateIdentification(
        new CodebaseASG([], [])
      )
    ).toThrow('A collection must contain at least one node or edge query');
    expect(() =>
      makePattern([
        collection,
        { nodes: [{ type: 'METHOD', fqn: { equalsBinding: 'method' } }], edges: [] },
      ]).candidateIdentification(new CodebaseASG([], []))
    ).toThrow('Unbound query reference: method');
  });

  it('combines alternative topologies and deduplicates identical subgraphs', () => {
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        { nodes: [{ type: 'CLASS' }], edges: [] },
        { nodes: [{ type: 'CLASS', name: 'First' }], edges: [] },
        { nodes: [{ type: 'INTERFACE' }], edges: [] },
      ],
    });

    const first = {
      type: 'CLASS' as const,
      fqn: 'example.First',
      name: 'First',
      packageName: 'example',
      modifiers: [],
    };

    const target = {
      type: 'INTERFACE' as const,
      fqn: 'example.Target',
      name: 'Target',
      packageName: 'example',
      modifiers: [],
    };

    const matches = pattern.candidateIdentification(
      new CodebaseASG([first, target], [])
    );

    expect(matches.map((match) => match.getNodes())).toEqual([
      [first],
      [target],
    ]);
  });

  it('deduplicates matches with the same nodes in different topology orders', () => {
    const pattern = new TestPattern({
      ...definition([], []),
      candidateTopologies: [
        { nodes: [{ type: 'CLASS' }, { type: 'FIELD' }], edges: [] },
        { nodes: [{ type: 'FIELD' }, { type: 'CLASS' }], edges: [] },
      ],
    });

    const graph = new CodebaseASG(
      [
        {
          type: 'CLASS',
          fqn: 'example.A',
          name: 'A',
          packageName: 'example',
          modifiers: [],
        },
        {
          type: 'FIELD',
          fqn: 'example.A.field',
          name: 'field',
          typeFqn: 'int',
          modifiers: [],
        },
      ],
      []
    );

    expect(pattern.candidateIdentification(graph)).toHaveLength(1);
  });

  it('treats omitted values as unconstrained and empty values as exact', () => {
    const methods = [
      {
        type: 'METHOD' as const,
        fqn: 'example.empty',
        name: '',
        parameterFqns: [],
        returnTypeFqn: 'void',
        modifiers: [],
      },
      {
        type: 'METHOD' as const,
        fqn: 'example.run',
        name: 'run',
        parameterFqns: ['int'],
        returnTypeFqn: 'void',
        modifiers: [],
      },
    ];

    const graph = new CodebaseASG(methods, []);

    expect(
      new TestPattern(definition([{ type: 'METHOD' }], [])).candidateIdentification(
        graph
      )
    ).toHaveLength(2);
    expect(
      new TestPattern(
        definition([{ type: 'METHOD', name: '', parameterFqns: [] }], [])
      ).candidateIdentification(graph)[0].getNodes()
    ).toEqual([methods[0]]);
  });

  it('binds and compares complete parameter arrays including empty arrays', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'METHOD',
            name: 'target',
            parameterFqns: { bind: 'parameters' },
          },
          {
            type: 'METHOD',
            name: 'adapter',
            parameterFqns: { equalsBinding: 'parameters' },
          },
        ],
        []
      )
    );

    const method = (fqn: string, name: string, parameterFqns: string[]) => ({
      type: 'METHOD' as const,
      fqn,
      name,
      parameterFqns,
      returnTypeFqn: 'void',
      modifiers: [],
    });

    const graph = new CodebaseASG(
      [
        method('target1', 'target', ['String', 'int']),
        method('adapter1', 'adapter', ['String', 'int']),
        method('adapter2', 'adapter', ['int', 'String']),
        method('target3', 'target', []),
        method('adapter3', 'adapter', []),
      ],
      []
    );
    expect(
      pattern.candidateIdentification(graph).map((match) =>
        match.getNodes().map((node) => node.fqn)
      )
    ).toEqual([['target1', 'adapter1'], ['target3', 'adapter3']]);
  });

  it('reports an unbound value reference', () => {
    const pattern = new TestPattern(
      definition(
        [{ type: 'METHOD', parameterFqns: { equalsBinding: 'missing' } }],
        []
      )
    );

    expect(() =>
      pattern.candidateIdentification(new CodebaseASG([], []))
    ).toThrow('Unbound query reference: missing');
  });

  it('rejects duplicate bindings even when there are no candidate nodes', () => {
    const pattern = new TestPattern(
      definition(
        [
          { type: 'CLASS', fqn: { bind: 'same' } },
          { type: 'FIELD', fqn: { bind: 'same' } },
        ],
        []
      )
    );
    expect(() =>
      pattern.candidateIdentification(new CodebaseASG([], []))
    ).toThrow('Duplicate query binding: same');
  });

  it('binds and compares boolean edge properties', () => {
    const pattern = new TestPattern(
      definition(
        [],
        [
          { type: 'CALLS', insideLoop: { bind: 'inLoop' } },
          { type: 'CALLS', insideLoop: { equalsBinding: 'inLoop' } },
        ]
      )
    );

    const call = (callingMethodFqn: string, insideLoop: boolean) => ({
      type: 'CALLS' as const,
      callingMethodFqn,
      calledMethodFqn: 'target',
      targetObjectFqn: '',
      insideLoop,
      insideConditional: false,
      isConstructorCall: false,
    });

    const edges = [
      call('first', true),
      call('second', true),
      call('third', false),
    ];
    const matches = pattern.candidateIdentification(new CodebaseASG([], edges));
    expect(matches).toHaveLength(1);
    expect(matches[0].getEdges()).toEqual([edges[0], edges[1]]);
  });

  it('finds generic topology matches and preserves bindings', () => {
    const pattern = new TestPattern(
      definition(
        [
          {
            type: 'CLASS',
            fqn: { bind: 'class' },
          },
          {
            type: 'FIELD',
            fqn: { bind: 'field' },
            typeFqn: { equalsBinding: 'class' },
          },
        ],
        [
          {
            type: 'HAS_FIELD',
            ownerFqn: { equalsBinding: 'class' },
            fieldFqn: { equalsBinding: 'field' },
          },
        ]
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
            fqn: { bind: 'class' },
          },
          {
            type: 'METHOD',
            fqn: { bind: 'method' },
          },
        ],
        [
          {
            type: 'HAS_METHOD',
            ownerFqn: { equalsBinding: 'class' },
            methodFqn: { equalsBinding: 'method' },
          },
        ]
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
            fqn: { bind: 'class' },
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
            fqn: { bind: 'method' },
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
            fqn: { bind: 'caller' },
            parameterFqns: [{ bind: 'parameter' }],
          },
          {
            type: 'METHOD',
            fqn: { bind: 'called' },
          },
        ],
        [
          {
            type: 'CALLS',
            callingMethodFqn: { equalsBinding: 'caller' },
            calledMethodFqn: { equalsBinding: 'called' },
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
