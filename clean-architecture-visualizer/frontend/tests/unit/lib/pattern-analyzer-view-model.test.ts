import { describe, expect, it } from 'vitest';
import {
  arrowEndpoints,
  buildPatternAnalyzerViewModel,
  type PatternAnalyzerResponse,
} from '@/lib/pattern-analyzer-view-model';
import { mockPatternAnalyzerResponse } from '@/mocks/data/pattern-analyzer';

const instance = mockPatternAnalyzerResponse.patternInstances[0];

// Two singletons in one class, so one can be selected and the other not.
const twoInstances: PatternAnalyzerResponse = {
  classes: [
    {
      ...mockPatternAnalyzerResponse.classes[0],
      patternInstanceIds: ['a'],
      members: [],
    },
    {
      ...mockPatternAnalyzerResponse.classes[1],
      patternInstanceIds: ['b'],
      members: [],
    },
  ],
  relationships: [],
  patternInstances: [
    { ...instance, id: 'a', classFqns: ['app.Logger'] },
    { ...instance, id: 'b', classFqns: ['app.Report'] },
  ],
};

describe('buildPatternAnalyzerViewModel', () => {
  it('selects the first instance and its first class by default', () => {
    const viewModel = buildPatternAnalyzerViewModel(twoInstances);

    expect(viewModel.selectedInstance?.id).toBe('a');
    expect(viewModel.selectedClass?.fqn).toBe('app.Logger');
  });

  it('colours the selected instance dark and the others light', () => {
    const { classes } = buildPatternAnalyzerViewModel(twoInstances, 'b');

    expect(classes.map((box) => box.tone)).toEqual(['unselected', 'selected']);
  });

  it('leaves elements outside any pattern uncoloured', () => {
    const { classes, arrows } = buildPatternAnalyzerViewModel(
      mockPatternAnalyzerResponse
    );

    expect(classes[0].members.map((member) => member.tone)).toEqual([
      'selected',
      'selected',
      'none',
    ]);
    expect(classes[1].tone).toBe('none');
    expect(arrows[0].tone).toBe('none');
  });

  it('colours an anti-pattern red even when it is selected', () => {
    const { classes } = buildPatternAnalyzerViewModel({
      ...twoInstances,
      patternInstances: [
        { ...twoInstances.patternInstances[0], patternType: 'Anti-Pattern' },
        twoInstances.patternInstances[1],
      ],
    });

    expect(classes[0].tone).toBe('antiPattern');
  });

  it('falls back to the defaults when a selection no longer exists', () => {
    const viewModel = buildPatternAnalyzerViewModel(
      twoInstances,
      'gone',
      'app.Gone'
    );

    expect(viewModel.selectedInstance?.id).toBe('a');
    expect(viewModel.selectedClass?.fqn).toBe('app.Logger');
  });

  it('keeps a selected class that is outside the selected pattern', () => {
    const viewModel = buildPatternAnalyzerViewModel(
      twoInstances,
      'a',
      'app.Report'
    );

    expect(viewModel.selectedClass?.fqn).toBe('app.Report');
  });

  it('handles an empty codebase', () => {
    const viewModel = buildPatternAnalyzerViewModel({
      classes: [],
      relationships: [],
      patternInstances: [],
    });

    expect(viewModel.classes).toEqual([]);
    expect(viewModel.selectedInstance).toBeUndefined();
    expect(viewModel.selectedClass).toBeUndefined();
  });

  it('gives no two classes the same place in the diagram', () => {
    const umlClass = mockPatternAnalyzerResponse.classes[0];
    const { classes } = buildPatternAnalyzerViewModel({
      classes: ['A', 'B', 'C', 'D', 'E'].map((fqn) => ({ ...umlClass, fqn })),
      relationships: [],
      patternInstances: [],
    });
    const places = classes.map((box) => `${box.x},${box.y}`);

    expect(new Set(places).size).toBe(classes.length);
  });

  it('places a class above the classes that depend on it', () => {
    const { classes } = buildPatternAnalyzerViewModel(
      mockPatternAnalyzerResponse
    );
    const [logger, report] = classes;

    expect(logger.y + logger.height).toBeLessThan(report.y);
  });

  it('lays out classes that depend on each other in a cycle', () => {
    const [a, b] = mockPatternAnalyzerResponse.classes;
    const link = (fromFqn: string, toFqn: string) => ({
      id: `${fromFqn}->${toFqn}`,
      kind: 'association' as const,
      fromFqn,
      toFqn,
      patternInstanceIds: [],
    });
    const { classes } = buildPatternAnalyzerViewModel({
      classes: [a, b],
      relationships: [link(a.fqn, b.fqn), link(b.fqn, a.fqn)],
      patternInstances: [],
    });

    expect(classes[0].y).not.toBe(classes[1].y);
  });

  it('places a class beside the class it is linked to, reducing crossings', () => {
    const umlClass = mockPatternAnalyzerResponse.classes[1];
    const toClass = (fqn: string) => ({ ...umlClass, fqn });
    const link = (fromFqn: string, toFqn: string) => ({
      id: `${fromFqn}->${toFqn}`,
      kind: 'association' as const,
      fromFqn,
      toFqn,
      patternInstanceIds: [],
    });
    // Listed so that keeping this order would make the two arrows cross.
    const { classes } = buildPatternAnalyzerViewModel({
      classes: ['Top1', 'Top2', 'Low1', 'Low2'].map(toClass),
      relationships: [link('Low1', 'Top2'), link('Low2', 'Top1')],
      patternInstances: [],
    });
    const xOf = (fqn: string) => classes.find((c) => c.fqn === fqn)?.x;

    expect(xOf('Low1')).toBe(xOf('Top2'));
    expect(xOf('Low2')).toBe(xOf('Top1'));
  });

  it('places unlinked classes below linked ones, in rows not one long layer', () => {
    const umlClass = mockPatternAnalyzerResponse.classes[1];
    const unlinked = Array.from({ length: 12 }, (_, index) => ({
      ...umlClass,
      fqn: `app.Unlinked${index}`,
    }));
    const { classes } = buildPatternAnalyzerViewModel({
      ...mockPatternAnalyzerResponse,
      classes: [...mockPatternAnalyzerResponse.classes, ...unlinked],
    });
    const [, report, ...others] = classes;

    for (const box of others) expect(box.y).toBeGreaterThan(report.y);
    expect(new Set(others.map((box) => box.x)).size).toBe(4);
  });

  it('drops arrows to classes that are not on the diagram', () => {
    const { arrows } = buildPatternAnalyzerViewModel({
      ...mockPatternAnalyzerResponse,
      classes: [mockPatternAnalyzerResponse.classes[0]],
    });

    expect(arrows).toEqual([]);
  });
});

describe('arrowEndpoints', () => {
  const size = { width: 100, height: 50 };

  it('runs from the bottom of the upper box to the top of the lower box', () => {
    expect(
      arrowEndpoints({ x: 0, y: 0, ...size }, { x: 0, y: 200, ...size })
    ).toEqual({ x1: 50, y1: 50, x2: 50, y2: 200 });
  });

  it('runs between the facing sides of boxes in a row', () => {
    expect(
      arrowEndpoints({ x: 300, y: 0, ...size }, { x: 0, y: 0, ...size })
    ).toEqual({ x1: 300, y1: 25, x2: 100, y2: 25 });
  });

  it('does not break when two boxes are dragged onto the same spot', () => {
    expect(
      arrowEndpoints({ x: 0, y: 0, ...size }, { x: 0, y: 0, ...size })
    ).toEqual({ x1: 50, y1: 25, x2: 50, y2: 25 });
  });
});
