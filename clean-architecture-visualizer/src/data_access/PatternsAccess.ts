import defaultPatternData from "../database/patterns.json" with { type: "json" };
import type { Pattern } from "../entity/Pattern.js";
import type { PatternFactory } from "../entity/PatternFactory.js";
import { isPatternId, type PatternId } from "../entity/PatternId.js";
import { isPatternName } from "../entity/PatternName.js";
import { isPatternType } from "../entity/PatternType.js";
import type { PatternDefinition } from "../types/patternDefinition.js";
import type { PatternsAccessInterface } from "./PatternsAccessInterface.js";

type PatternDataDefinition = {
  metadata: {
    patternName: string;
    patternType: string;
    description: string;
    learningInfo: string;
  };
  candidateTopologies: unknown;
};

export type PatternData = Record<string, PatternDataDefinition>;

export class PatternsAccess implements PatternsAccessInterface {
  private readonly patternFactory: PatternFactory;
  private readonly patternData: PatternData;

  constructor(
    patternFactory: PatternFactory,
    patternData: PatternData = defaultPatternData,
  ) {
    this.patternFactory = patternFactory;
    this.patternData = patternData;
  }

  async buildPatterns(patternIds: PatternId[]): Promise<Pattern[]> {
    for (const patternId of patternIds) {
      if (!isPatternId(patternId)) {
        throw new Error(`Unknown pattern ID: ${patternId}`);
      }
    }

    const requestedPatternIds = new Set(patternIds);
    const patterns = await Promise.all(
      Object.keys(this.patternData)
        .filter((patternDataKey) =>
          requestedPatternIds.has(patternDataKey as PatternId),
        )
        .map((patternDataKey) => {
          const patternId = this.getPatternId(patternDataKey);
          const validatedDefinition = this.parseDefinition(
            patternId,
            this.patternData[patternDataKey],
          );
          return this.patternFactory.create(patternId, validatedDefinition);
        }),
    );

    return patterns;
  }

  private getPatternId(patternDataKey: string): PatternId {
    if (!isPatternId(patternDataKey)) {
      throw new Error(`Unknown pattern ID: ${patternDataKey}`);
    }

    return patternDataKey;
  }

  private parseDefinition(
    patternId: PatternId,
    definition: PatternDataDefinition,
  ): PatternDefinition {
    if (!isPatternName(definition.metadata.patternName)) {
      throw new Error(
        `Unknown pattern name: ${definition.metadata.patternName}`,
      );
    }

    if (!isPatternType(definition.metadata.patternType)) {
      throw new Error(
        `Unknown pattern type: ${definition.metadata.patternType}`,
      );
    }

    if (
      !Array.isArray(definition.candidateTopologies) ||
      !definition.candidateTopologies.every(
        (topology: unknown) =>
          topology !== null &&
          typeof topology === "object" &&
          "nodes" in topology &&
          Array.isArray(topology.nodes) &&
          "edges" in topology &&
          Array.isArray(topology.edges) &&
          (!("collectMatches" in topology) ||
            (Array.isArray(topology.collectMatches) &&
              topology.collectMatches.every(
                (collection: unknown) =>
                  collection !== null &&
                  typeof collection === "object" &&
                  "nodes" in collection &&
                  Array.isArray(collection.nodes) &&
                  "edges" in collection &&
                  Array.isArray(collection.edges),
              ))),
      )
    ) {
      throw new Error(`Invalid candidate topologies for pattern: ${patternId}`);
    }

    return {
      id: patternId,
      metadata: {
        patternName: definition.metadata.patternName,
        patternType: definition.metadata.patternType,
        description: definition.metadata.description,
        learningInfo: definition.metadata.learningInfo,
      },
      candidateTopologies:
        definition.candidateTopologies as PatternDefinition["candidateTopologies"],
    };
  }
}
