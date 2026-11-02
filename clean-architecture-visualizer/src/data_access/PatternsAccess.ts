import defaultPatternData from '../database/patterns.json' with { type: 'json' };
import type { Pattern } from '../entity/Pattern.js';
import type { PatternFactory } from '../entity/PatternFactory.js';
import { isPatternID, type PatternID } from '../entity/PatternID.js';
import { isPatternName } from '../entity/PatternName.js';
import { isPatternType } from '../entity/PatternType.js';
import type { PatternDefinition } from '../types/patternDefinition.js';
import type { PatternsAccessInterface } from './PatternsAccessInterface.js';

type PatternDataDefinition = {
  metadata: {
    patternName: string;
    patternType: string;
    description: string;
    learningInfo: string;
  };
  candidateTopology: unknown;
};

export type PatternData = Record<string, PatternDataDefinition>;

export class PatternsAccess implements PatternsAccessInterface {
  private readonly patternFactory: PatternFactory;
  private readonly patternData: PatternData;

  constructor(
    patternFactory: PatternFactory,
    patternData: PatternData = defaultPatternData
  ) {
    this.patternFactory = patternFactory;
    this.patternData = patternData;
  }

  async buildPatterns(patternIDs: PatternID[]): Promise<Pattern[]> {
    for (const patternID of patternIDs) {
      if (!isPatternID(patternID)) {
        throw new Error(`Unknown pattern ID: ${patternID}`);
      }
    }

    const requestedPatternIDs = new Set(patternIDs);
    const patterns = await Promise.all(
      Object.keys(this.patternData)
        .filter((patternDataKey) =>
          requestedPatternIDs.has(patternDataKey as PatternID)
        )
        .map((patternDataKey) => {
          const patternId = this.getPatternID(patternDataKey);
          const validatedDefinition = this.parseDefinition(
            patternId,
            this.patternData[patternDataKey]
          );
          return this.patternFactory.create(patternId, validatedDefinition);
        })
    );

    return patterns;
  }

  private getPatternID(patternDataKey: string): PatternID {
    if (!isPatternID(patternDataKey)) {
      throw new Error(`Unknown pattern ID: ${patternDataKey}`);
    }

    return patternDataKey;
  }

  private parseDefinition(
    patternID: PatternID,
    definition: PatternDataDefinition
  ): PatternDefinition {
    if (!isPatternName(definition.metadata.patternName)) {
      throw new Error(
        `Unknown pattern name: ${definition.metadata.patternName}`
      );
    }

    if (!isPatternType(definition.metadata.patternType)) {
      throw new Error(
        `Unknown pattern type: ${definition.metadata.patternType}`
      );
    }

    return {
      id: patternID,
      metadata: {
        patternName: definition.metadata.patternName,
        patternType: definition.metadata.patternType,
        description: definition.metadata.description,
        learningInfo: definition.metadata.learningInfo,
      },
      candidateTopology:
        definition.candidateTopology as PatternDefinition['candidateTopology'],
    };
  }
}
