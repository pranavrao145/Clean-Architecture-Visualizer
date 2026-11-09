// The patterns a user can choose to analyse.
export const AVAILABLE_PATTERNS = [{ id: 'singleton', name: 'Singleton' }];

// ----- What the API sends (POST /design-patterns/analyze) -----

export type UmlMember = {
  fqn: string;
  kind: 'field' | 'method' | 'constant';
  umlText: string;
  codeText: string;
  patternInstanceIds: string[];
};

export type UmlClass = {
  fqn: string;
  name: string;
  kind: 'class' | 'interface' | 'enum';
  codeText: string;
  members: UmlMember[];
  patternInstanceIds: string[];
};

export type UmlRelationship = {
  id: string;
  kind: 'extends' | 'implements' | 'association';
  fromFqn: string;
  toFqn: string;
  patternInstanceIds: string[];
};

export type PatternInstance = {
  id: string;
  patternId: string;
  patternName: string;
  patternType: string;
  description: string;
  learningInfo: string;
  classFqns: string[];
  memberFqns: string[];
};

export type PatternAnalyzerResponse = {
  classes: UmlClass[];
  relationships: UmlRelationship[];
  patternInstances: PatternInstance[];
};

// ----- What the view draws -----

export type HighlightTone = 'none' | 'selected' | 'unselected' | 'antiPattern';

// The legend's colours: dark green, light green, and red.
export const HIGHLIGHT_COLORS: Record<HighlightTone, string> = {
  none: 'transparent',
  selected: '#b5f09a',
  unselected: '#e6f9dc',
  antiPattern: '#f2d7d7',
};

export type MemberRow = UmlMember & { tone: HighlightTone };

export type ClassBox = Omit<UmlClass, 'members'> & {
  tone: HighlightTone;
  members: MemberRow[];
  x: number;
  y: number;
  height: number;
};

export type RelationshipArrow = UmlRelationship & { tone: HighlightTone };

export type PatternAnalyzerViewModel = {
  classes: ClassBox[];
  arrows: RelationshipArrow[];
  patternInstances: PatternInstance[];
  selectedInstance?: PatternInstance;
  selectedClass?: ClassBox;
};

// ----- Diagram measurements, in pixels -----

export const CLASS_WIDTH = 280;
export const HEADER_HEIGHT = 36;
export const ROW_HEIGHT = 26;
const BOX_PADDING = 8;
const UNLINKED_COLUMN_COUNT = 4;
const GAP = 70;
const ORDERING_SWEEPS = 4;

type Link = Pick<UmlRelationship, 'fromFqn' | 'toFqn'>;

// Splits linked classes into layers, with each class one layer below the lowest
// class it depends on. A link that would close a cycle is ignored.
function groupIntoLayers(linkedFqns: Set<string>, links: Link[]): string[][] {
  const layerOf = new Map<string, number>();
  const inProgress = new Set<string>();

  const findLayer = (fqn: string): number => {
    const known = layerOf.get(fqn);
    if (known !== undefined) return known;
    if (inProgress.has(fqn)) return -1;

    inProgress.add(fqn);
    const dependencyLayers = links
      .filter((link) => link.fromFqn === fqn)
      .map((link) => findLayer(link.toFqn));
    const layer = Math.max(-1, ...dependencyLayers) + 1;
    inProgress.delete(fqn);

    layerOf.set(fqn, layer);
    return layer;
  };

  const layers: string[][] = [];
  for (const fqn of linkedFqns) {
    const layer = findLayer(fqn);
    layers[layer] = [...(layers[layer] ?? []), fqn];
  }
  return layers;
}

// A class's sideways place in its layer, where 0 is the middle of the layer.
function offsetsInLayers(layers: string[][]) {
  return new Map(
    layers.flatMap((layer) =>
      layer.map((fqn, index): [string, number] => [
        fqn,
        index - (layer.length - 1) / 2,
      ])
    )
  );
}

// Moves each class towards the average place of the classes it's linked to, so
// arrows stay short and cross less. Sweeps down and up the layers in turn, as
// each sweep lets the next one improve on it.
function orderLayers(layers: string[][], links: Link[]): string[][] {
  const ordered = layers.map((layer) => [...layer]);

  for (let sweep = 0; sweep < ORDERING_SWEEPS; sweep++) {
    const sweepOrder = sweep % 2 === 0 ? ordered : [...ordered].reverse();

    for (const layer of sweepOrder) {
      const offsets = offsetsInLayers(ordered);
      const averageOffset = (fqn: string) => {
        const linked = links.flatMap((link) => {
          if (link.fromFqn === fqn) return [offsets.get(link.toFqn) ?? 0];
          if (link.toFqn === fqn) return [offsets.get(link.fromFqn) ?? 0];
          return [];
        });
        return linked.reduce((sum, n) => sum + n, 0) / linked.length;
      };

      const averages = new Map(layer.map((fqn) => [fqn, averageOffset(fqn)]));
      layer.sort((a, b) => (averages.get(a) ?? 0) - (averages.get(b) ?? 0));
    }
  }
  return ordered;
}

// Works out where each class starts; the user can drag them from there.
// Linked classes go in layers, with every arrow pointing up at what it depends
// on. That keeps related classes close, so few arrows have to pass another box.
// Classes with no arrows would all share one very wide layer, so they go in
// columns underneath instead.
function layOutClasses(
  classes: Omit<ClassBox, 'x' | 'y' | 'height'>[],
  relationships: UmlRelationship[]
): ClassBox[] {
  const heights = new Map(
    classes.map((umlClass) => [
      umlClass.fqn,
      HEADER_HEIGHT +
        Math.max(umlClass.members.length, 1) * ROW_HEIGHT +
        BOX_PADDING,
    ])
  );
  const heightOf = (fqn: string) => heights.get(fqn) ?? 0;

  const links = relationships.filter(
    ({ fromFqn, toFqn }) => heights.has(fromFqn) && heights.has(toFqn)
  );
  const linkedFqns = new Set(links.flatMap((l) => [l.fromFqn, l.toFqn]));
  const layers = orderLayers(groupIntoLayers(linkedFqns, links), links);

  // Centres every layer on the widest one, with each layer as tall as its
  // tallest class.
  const offsets = offsetsInLayers(layers);
  const widestLayer = Math.max(0, ...layers.map((layer) => layer.length));
  const positions = new Map<string, { x: number; y: number }>();
  let nextLayerTop = 0;
  for (const layer of layers) {
    for (const fqn of layer) {
      const column = (offsets.get(fqn) ?? 0) + (widestLayer - 1) / 2;
      positions.set(fqn, { x: column * (CLASS_WIDTH + GAP), y: nextLayerTop });
    }
    nextLayerTop += Math.max(...layer.map(heightOf)) + GAP;
  }

  const columnBottoms: number[] = Array(UNLINKED_COLUMN_COUNT).fill(
    nextLayerTop
  );

  return classes.map((umlClass) => {
    const height = heightOf(umlClass.fqn);
    const position = positions.get(umlClass.fqn);
    if (position) return { ...umlClass, height, ...position };

    // Each unlinked class goes in the currently shortest column.
    const column = columnBottoms.indexOf(Math.min(...columnBottoms));
    const y = columnBottoms[column];
    columnBottoms[column] = y + height + GAP;
    return { ...umlClass, height, x: column * (CLASS_WIDTH + GAP), y };
  });
}

export type Rectangle = { x: number; y: number; width: number; height: number };

// Where a line from the centre of a box to a point crosses the box's border.
function borderPoint(box: Rectangle, towards: { x: number; y: number }) {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const dx = towards.x - centerX;
  const dy = towards.y - centerY;
  if (dx === 0 && dy === 0) return { x: centerX, y: centerY };

  const scale = Math.min(
    box.width / 2 / Math.abs(dx),
    box.height / 2 / Math.abs(dy)
  );
  return { x: centerX + dx * scale, y: centerY + dy * scale };
}

// Runs an arrow straight between two boxes, from border to border. The diagram
// calls this as boxes are dragged, so an arrow always takes the shortest way.
export function arrowEndpoints(from: Rectangle, to: Rectangle) {
  const start = borderPoint(from, {
    x: to.x + to.width / 2,
    y: to.y + to.height / 2,
  });
  const end = borderPoint(to, {
    x: from.x + from.width / 2,
    y: from.y + from.height / 2,
  });
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

// Prepares an analysis for the view: picks what's selected, colours every
// element, and works out where it goes.
// A selection can disappear after a re-analyze, so each one falls back to a
// sensible default: the first detected instance, then its first class.
export function buildPatternAnalyzerViewModel(
  response: PatternAnalyzerResponse,
  selectedInstanceId?: string,
  selectedClassFqn?: string
): PatternAnalyzerViewModel {
  const { classes, relationships, patternInstances } = response;
  const selectedInstance =
    patternInstances.find((instance) => instance.id === selectedInstanceId) ??
    patternInstances[0];

  const toneOf = (instanceIds: string[]): HighlightTone => {
    const instances = patternInstances.filter((instance) =>
      instanceIds.includes(instance.id)
    );
    if (instances.length === 0) return 'none';
    if (instances.some((instance) => instance.patternType === 'Anti-Pattern')) {
      return 'antiPattern';
    }
    return selectedInstance && instanceIds.includes(selectedInstance.id)
      ? 'selected'
      : 'unselected';
  };

  const boxes = layOutClasses(
    classes.map((umlClass) => ({
      ...umlClass,
      tone: toneOf(umlClass.patternInstanceIds),
      members: umlClass.members.map((member) => ({
        ...member,
        tone: toneOf(member.patternInstanceIds),
      })),
    })),
    relationships
  );
  const boxesByFqn = new Map(boxes.map((box) => [box.fqn, box]));

  const arrows = relationships
    .filter(
      ({ fromFqn, toFqn }) => boxesByFqn.has(fromFqn) && boxesByFqn.has(toFqn)
    )
    .map((relationship) => ({
      ...relationship,
      tone: toneOf(relationship.patternInstanceIds),
    }));

  const selectedClassFqnOrDefault =
    (selectedClassFqn && boxesByFqn.has(selectedClassFqn)
      ? selectedClassFqn
      : selectedInstance?.classFqns[0]) ?? boxes[0]?.fqn;

  return {
    classes: boxes,
    arrows,
    patternInstances,
    selectedInstance,
    selectedClass: boxesByFqn.get(selectedClassFqnOrDefault),
  };
}
