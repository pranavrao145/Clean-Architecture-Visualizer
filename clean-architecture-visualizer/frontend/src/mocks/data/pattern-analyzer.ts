import type { PatternAnalyzerResponse } from '../../lib/pattern-analyzer-view-model';

// A singleton `Logger`, plus a `Report` class that holds one.
export const mockPatternAnalyzerResponse: PatternAnalyzerResponse = {
  classes: [
    {
      fqn: 'app.Logger',
      name: 'Logger',
      kind: 'class',
      codeText: 'public class Logger {',
      patternInstanceIds: ['singleton-0'],
      members: [
        {
          fqn: 'app.Logger.instance',
          kind: 'field',
          umlText: '- instance: Logger {static}',
          codeText: 'private static Logger instance;',
          patternInstanceIds: ['singleton-0'],
        },
        {
          fqn: 'app.Logger.getInstance()',
          kind: 'method',
          umlText: '+ getInstance(): Logger {static}',
          codeText: 'public static Logger getInstance();',
          patternInstanceIds: ['singleton-0'],
        },
        {
          fqn: 'app.Logger.log(java.lang.String)',
          kind: 'method',
          umlText: '+ log(String): void',
          codeText: 'public void log(String);',
          patternInstanceIds: [],
        },
      ],
    },
    {
      fqn: 'app.Report',
      name: 'Report',
      kind: 'class',
      codeText: 'public class Report {',
      patternInstanceIds: [],
      members: [
        {
          fqn: 'app.Report.logger',
          kind: 'field',
          umlText: '- logger: Logger',
          codeText: 'private Logger logger;',
          patternInstanceIds: [],
        },
      ],
    },
  ],
  relationships: [
    {
      id: 'association:app.Report->app.Logger',
      kind: 'association',
      fromFqn: 'app.Report',
      toFqn: 'app.Logger',
      patternInstanceIds: [],
    },
  ],
  patternInstances: [
    {
      id: 'singleton-0',
      patternId: 'singleton',
      patternName: 'Singleton',
      patternType: 'Design Pattern',
      description: 'Ensures a class has only one instance.',
      learningInfo: 'Use it when exactly one object must coordinate the rest.',
      classFqns: ['app.Logger'],
      memberFqns: ['app.Logger.instance', 'app.Logger.getInstance()'],
    },
  ],
};
