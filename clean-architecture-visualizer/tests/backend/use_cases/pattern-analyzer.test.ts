import { describe, expect, it } from '@jest/globals';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import { PatternAnalyzerController } from '../../../src/interface_adapter/pattern-analyzer/pattern-analyzer-controller.js';
import { PatternAnalyzerPresenter } from '../../../src/interface_adapter/pattern-analyzer/pattern-analyzer-presenter.js';
import { PatternAnalyzerInteractor } from '../../../src/use_case/pattern-analyzer/pattern-analyzer-interactor.js';
import { makeSingletonASG } from '../fixtures/singleton-asg.js';

type Body = {
  classes?: { name: string }[];
  patternInstances?: { id: string; classFqns: string[] }[];
  error?: string;
};

// Runs the whole use case with the real patterns.json and a fake parser.
async function analyze(
  rawPatternIds: unknown,
  buildCodebaseAsg = async () => makeSingletonASG()
) {
  const presenter = new PatternAnalyzerPresenter();
  const interactor = new PatternAnalyzerInteractor(
    new PatternsAccess(new CommonPatternFactory()),
    { buildCodebaseASG: buildCodebaseAsg },
    presenter
  );

  await new PatternAnalyzerController(interactor).execute(rawPatternIds);

  const { status, body } = presenter.getResponse();
  return { status, body: body as Body };
}

describe('Pattern Analyzer use case', () => {
  it('detects a singleton and returns the UML around it', async () => {
    const { status, body } = await analyze(['singleton']);

    expect(status).toBe(200);
    expect(body.classes?.map((c) => c.name)).toEqual([
      'Logger',
      'Report',
      'Printable',
      'Level',
    ]);
    expect(body.patternInstances?.map((p) => [p.id, p.classFqns])).toEqual([
      ['singleton-0', ['app.Logger']],
    ]);
  });

  it('detects an Adapter using parser-provided evidence', async () => {
    const graph = new CodebaseASG(
      [
        { type: 'INTERFACE', fqn: 'Target', name: 'Target', packageName: '', modifiers: [] },
        { type: 'CLASS', fqn: 'Adapter', name: 'Adapter', packageName: '', modifiers: [], supertypeFqns: ['Target'] },
        { type: 'CLASS', fqn: 'Adaptee', name: 'Adaptee', packageName: '', modifiers: [], supertypeFqns: [] },
        { type: 'FIELD', fqn: 'Adapter.delegate', name: 'delegate', typeFqn: 'Adaptee', modifiers: [] },
        { type: 'METHOD', fqn: 'Target.play()', name: 'play', parameterFqns: [], returnTypeFqn: 'void', modifiers: [] },
        { type: 'METHOD', fqn: 'Adapter.play()', name: 'play', parameterFqns: [], returnTypeFqn: 'void', modifiers: ['PUBLIC'] },
      ],
      [
        { type: 'IMPLEMENTS', interfaceFqn: 'Target', implementingClassFqn: 'Adapter', methodImplementations: [
          { interfaceMethodFqn: 'Target.play()', implementationMethodFqn: 'Adapter.play()' },
        ] },
        { type: 'HAS_FIELD', ownerFqn: 'Adapter', fieldFqn: 'Adapter.delegate' },
        { type: 'HAS_METHOD', ownerFqn: 'Target', methodFqn: 'Target.play()' },
        { type: 'HAS_METHOD', ownerFqn: 'Adapter', methodFqn: 'Adapter.play()' },
        { type: 'CALLS', callingMethodFqn: 'Adapter.play()', calledMethodFqn: 'Adaptee.execute()', targetObjectFqn: 'Adapter.delegate', insideLoop: false, insideConditional: false, isConstructorCall: false, isStaticCall: false },
      ]
    );
    const { status, body } = await analyze(['adapter'], async () => graph);
    expect(status).toBe(200);
    expect(body.patternInstances?.map((p) => [p.id, p.classFqns])).toEqual([
      ['adapter-0', ['Target', 'Adapter', 'Adaptee']],
    ]);
  });

  it('returns the UML without highlights when no pattern is chosen', async () => {
    const { status, body } = await analyze([]);

    expect(status).toBe(200);
    expect(body.classes).toHaveLength(4);
    expect(body.patternInstances).toEqual([]);
  });

  it.each([
    ['an unknown ID', ['strategy'], 'Unknown pattern ID: strategy'],
    ['a missing list', undefined, 'Unknown pattern ID: undefined'],
  ])('rejects %s as invalid input', async (_name, rawIds, error) => {
    expect(await analyze(rawIds)).toEqual({ status: 400, body: { error } });
  });

  it('never starts the parser for invalid input', async () => {
    let parserRuns = 0;
    await analyze(['strategy'], async () => {
      parserRuns += 1;
      return makeSingletonASG();
    });

    expect(parserRuns).toBe(0);
  });

  it('reports a parser failure', async () => {
    const result = await analyze(['singleton'], async () => {
      throw new Error('JavaParser CLI failed: java not found');
    });

    expect(result).toEqual({
      status: 500,
      body: { error: 'JavaParser CLI failed: java not found' },
    });
  });
});
