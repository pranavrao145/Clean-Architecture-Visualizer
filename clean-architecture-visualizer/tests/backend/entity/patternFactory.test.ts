import { describe, expect, it } from '@jest/globals';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { PatternId } from '../../../src/entity/PatternId.js';
import { PatternName } from '../../../src/entity/PatternName.js';
import { PatternType } from '../../../src/entity/PatternType.js';
import { SingletonDesignPattern } from '../../../src/entity/SingletonDesignPattern.js';
import type { PatternDefinition } from '../../../src/types/patternDefinition.js';

const singletonDefinition: PatternDefinition = {
  id: PatternId.Singleton,
  metadata: {
    patternName: PatternName.Singleton,
    patternType: PatternType.DesignPattern,
    description: 'description',
    learningInfo: 'learning info',
  },
  candidateTopology: {
    nodes: [],
    edges: [],
  },
};

describe('CommonPatternFactory', () => {
  it('creates the Singleton design pattern', async () => {
    const pattern = await new CommonPatternFactory().create(
      PatternId.Singleton,
      singletonDefinition
    );

    expect(pattern).toBeInstanceOf(SingletonDesignPattern);
    expect(pattern.data.metadata.patternName).toBe(PatternName.Singleton);
    expect(pattern.data.metadata.patternType).toBe(PatternType.DesignPattern);
    expect(pattern.candidateVerification(new CodebaseASG([], []))).toBe(false);
  });

  it('rejects unknown pattern IDs', async () => {
    const factory = new CommonPatternFactory();

    await expect(
      factory.create('unknown' as PatternId, singletonDefinition)
    ).rejects.toThrow('Unknown pattern ID');
  });

  it('rejects data that does not match the Singleton identity', async () => {
    const invalidDefinition = {
      ...singletonDefinition,
      metadata: {
        ...singletonDefinition.metadata,
        patternName: 'Invalid' as PatternName,
      },
    };

    expect(() => new SingletonDesignPattern(invalidDefinition)).toThrow(
      'Invalid pattern name'
    );

    expect(
      () =>
        new SingletonDesignPattern({
          ...singletonDefinition,
          id: 'invalid' as PatternId,
        })
    ).toThrow('Invalid pattern ID');
  });
});
