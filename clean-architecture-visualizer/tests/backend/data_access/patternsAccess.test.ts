import { describe, expect, it } from '@jest/globals';
import customPatternData from '../fixtures/patterns.custom.json' with {
  type: 'json',
};
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternID } from '../../../src/entity/PatternID.js';
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
      PatternID.Singleton,
    ]);

    expect(pattern.data).toEqual({
      id: PatternID.Singleton,
      metadata: {
        patternName: PatternName.Singleton,
        patternType: PatternType.DesignPattern,
        description: 'Fixture singleton description',
        learningInfo: 'Fixture singleton learning information',
      },
      candidateTopology: {
        nodes: [
          {
            type: 'CLASS',
            fqn: '$fixtureSingletonClass',
            name: '$fixtureSingletonClass',
            packageName: 'fixture',
            modifiers: ['PUBLIC'],
          },
        ],
        edges: [],
      },
    });
  });

  it('does not ingest definitions that are not requested', async () => {
    const patterns = await customPatternsAccess.buildPatterns([]);

    expect(patterns).toEqual([]);
  });

  it('creates a pattern for each definition in patterns.json', async () => {
    const patterns = await new PatternsAccess(
      new CommonPatternFactory()
    ).buildPatterns([PatternID.Singleton]);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toBeInstanceOf(SingletonDesignPattern);
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
        'unknown' as PatternID,
      ])
    ).rejects.toThrow('Unknown pattern ID');
  });
});
