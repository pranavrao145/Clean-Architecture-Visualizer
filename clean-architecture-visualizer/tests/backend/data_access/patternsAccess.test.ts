import { describe, expect, it } from '@jest/globals';
import customPatternData from '../fixtures/patterns.custom.json' with {
  type: 'json',
};
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import { SingletonDesignPattern } from '../../../src/entity/SingletonDesignPattern.js';

describe('PatternsAccess', () => {
  const customPatternsAccess = new PatternsAccess(
    new CommonPatternFactory(),
    customPatternData
  );

  it('ingests metadata and candidate topology from a custom JSON fixture', async () => {
    const [pattern] = await customPatternsAccess.buildPatterns([
      PatternId.Singleton,
    ]);

    expect(pattern.data).toEqual({
      id: PatternId.Singleton,
      metadata: {
        patternName: PatternName.Singleton,
        patternType: PatternType.DesignPattern,
        description: 'Fixture singleton description',
        learningInfo: 'Fixture singleton learning information',
      },
      candidateTopologies: [
        {
          nodes: [
            {
              type: 'CLASS',
              fqn: { bind: 'fixtureSingletonClass' },
              name: { equalsBinding: 'fixtureSingletonClass' },
              packageName: 'fixture',
              modifiers: ['PUBLIC'],
            },
          ],
          edges: [],
        },
      ],
    });
  });

  it('does not ingest definitions that are not requested', async () => {
    const patterns = await customPatternsAccess.buildPatterns([]);

    expect(patterns).toEqual([]);
  });

  it('creates a pattern for each definition in patterns.json', async () => {
    const patterns = await new PatternsAccess(
      new CommonPatternFactory()
    ).buildPatterns([PatternId.Singleton]);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toBeInstanceOf(SingletonDesignPattern);
  });

  it('preserves singleton identification and verification with the migrated topology', async () => {
    const [pattern] = await new PatternsAccess(
      new CommonPatternFactory()
    ).buildPatterns([PatternId.Singleton]);
    const graph = new CodebaseASG(
      [
        {
          type: 'CLASS',
          fqn: 'example.Service',
          name: 'Service',
          packageName: 'example',
          modifiers: ['PUBLIC'],
          supertypeFqns: [],
        },
        {
          type: 'FIELD',
          fqn: 'example.Service.instance',
          name: 'instance',
          typeFqn: 'example.Service',
          modifiers: ['PRIVATE', 'STATIC'],
        },
        {
          type: 'METHOD',
          fqn: 'example.Service.getInstance()',
          name: 'getInstance',
          parameterFqns: [],
          returnTypeFqn: 'example.Service',
          modifiers: ['PUBLIC', 'STATIC'],
        },
      ],
      [
        {
          type: 'HAS_FIELD',
          ownerFqn: 'example.Service',
          fieldFqn: 'example.Service.instance',
        },
        {
          type: 'HAS_METHOD',
          ownerFqn: 'example.Service',
          methodFqn: 'example.Service.getInstance()',
        },
      ]
    );
    const candidates = pattern.candidateIdentification(graph);
    expect(candidates).toHaveLength(1);
    expect(pattern.candidateVerification(candidates[0])).toBe(true);
  });

  it('only creates patterns requested by ID', async () => {
    const patterns = await new PatternsAccess(
      new CommonPatternFactory()
    ).buildPatterns([]);

    expect(patterns).toEqual([]);
  });

  it('rejects unknown requested IDs', async () => {
    await expect(
      new PatternsAccess(new CommonPatternFactory()).buildPatterns([
        'unknown' as PatternId,
      ])
    ).rejects.toThrow('Unknown pattern ID');
  });

  it('rejects invalid topology arrays instead of silently constructing a pattern', async () => {
    const patternsAccess = new PatternsAccess(new CommonPatternFactory(), {
      singleton: {
        ...customPatternData.singleton,
        candidateTopologies: [{ nodes: [], edges: null }],
      },
    });
    await expect(
      patternsAccess.buildPatterns([PatternId.Singleton])
    ).rejects.toThrow('Invalid candidate topologies for pattern: singleton');
  });

  it('loads collection queries and rejects malformed collections', async () => {
    const valid = {
      ...customPatternData.singleton,
      candidateTopologies: [
        {
          nodes: [{ type: 'CLASS' }],
          edges: [],
          collectMatches: [{ nodes: [{ type: 'METHOD' }], edges: [], minMatches: 1 }],
        },
      ],
    };
    const [pattern] = await new PatternsAccess(new CommonPatternFactory(), {
      singleton: valid,
    }).buildPatterns([PatternId.Singleton]);
    expect(pattern.data.candidateTopologies[0].collectMatches).toEqual(
      valid.candidateTopologies[0].collectMatches
    );

    const invalid = {
      ...valid,
      candidateTopologies: [{ nodes: [], edges: [], collectMatches: [{ nodes: [] }] }],
    };
    await expect(
      new PatternsAccess(new CommonPatternFactory(), {
        singleton: invalid,
      }).buildPatterns([PatternId.Singleton])
    ).rejects.toThrow('Invalid candidate topologies for pattern: singleton');
  });

  it('rejects the removed oneOf operator when identifying candidates', async () => {
    const data = {
      ...customPatternData.singleton,
      candidateTopologies: [
        {
          nodes: [{ type: 'CLASS', name: { oneOf: ['First', 'Second'] } }],
          edges: [],
        },
      ],
    };
    const [pattern] = await new PatternsAccess(new CommonPatternFactory(), {
      singleton: data,
    }).buildPatterns([PatternId.Singleton]);
    expect(() => pattern.candidateIdentification(new CodebaseASG([], []))).toThrow(
      'Unknown query operator: oneOf'
    );
  });
});
