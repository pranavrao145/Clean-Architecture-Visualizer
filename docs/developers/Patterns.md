---
sidebar_position: 5
---

# Pattern Lifecycle

Pattern definitions are stored as external data and concrete pattern entities
are created only when an application flow requests them. The application
composition root creates the pattern infrastructure once, while pattern
objects are built on demand.

## Composition at Startup

The CLI composition root in `clean-architecture-visualizer/src/app/index.ts`
creates and injects the pattern dependencies:

```text
CommonPatternFactory
        ↓
PatternsAccess
        ↓
AppBuilder
```

`AppBuilder` receives `PatternsAccess` through
`PatternsAccessInterface`. This keeps the application layer dependent on the
data-access abstraction rather than on the concrete JSON-backed implementation.

The startup composition creates the accessor and factory once. It does not
construct any `Pattern` objects and does not parse individual pattern
definitions at startup.

## On-Demand Construction

An application action requests the pattern IDs it needs through
`AppBuilder.buildPatterns(patternIds)`. The request follows this flow:

```text
User action
    ↓
AppBuilder.buildPatterns([PatternId.Singleton, ...])
    ↓
PatternsAccess.buildPatterns(...)
    ↓
Select requested definitions from patterns.json
    ↓
Validate pattern ID, name, and type
    ↓
PatternFactory.create(patternId, definition)
    ↓
Concrete Pattern entity
```

`PatternsAccess` returns only the patterns requested by the caller. An empty
ID list returns an empty list, and an unknown ID produces an explicit error.
The same `PatternsAccess` instance can serve multiple user actions.

## Data and Dependency Boundaries

- `patterns.json` is an external data representation and is read only by
  `PatternsAccess`.
- `PatternsAccess` translates the JSON metadata into a
  `PatternDefinition`.
- `PatternDefinition` uses typed query shapes derived from the CodebaseASG
  node and edge types for candidate topology data. Query properties may be
  omitted when they do not constrain a match.
- ASG node and edge rules belong to the CodebaseASG domain; `PatternsAccess`
  does not duplicate their validation.
- `PatternFactory` is the construction boundary for concrete pattern
  entities.
- `Pattern` and concrete pattern classes do not depend on JSON or
  `PatternsAccess`.

This arrangement allows future user flows to request different subsets of
patterns without changing application composition or constructing unused
entities.

## Candidate identification

`Pattern.candidateIdentification(codebaseASG)` finds every subgraph in the
provided ASG whose topology matches any of the pattern's
`candidateTopologies`. It
returns an array of `CodebaseASG` objects. Each object represents one matching
subgraph and can be inspected with `getNodes()` and `getEdges()`:

```ts
CodebaseASG[]
```

The matcher is generic and operates on the properties of any node or edge
shape. It uses backtracking to assign distinct ASG nodes to topology nodes,
then assigns distinct ASG edges to topology edges. Edge properties are matched
after node assignment, so references such as `ownerFqn` and `fieldFqn` must
connect the selected nodes in the declared direction.

Pattern values follow these rules:

- Each entry in `candidateTopologies` is an alternative topology. Matches are
  combined, and matches selecting the same input nodes and edges are returned
  only once, regardless of topology or selection order. The first matching
  topology determines the order of nodes and edges in that candidate.
- Omit a property to leave it unconstrained. Literal values match exactly:
  `""` matches only an empty string, and `[]` matches only an empty array.
  Strings beginning with `$` are also literal. Arrays are matched in order and
  must have equal lengths.
- `{ "bind": "name" }` introduces a binding for a value, including an entire
  array or an array element. `{ "equalsBinding": "name" }` compares against
  that binding. A name cannot be bound twice, and a reference must be bound
  earlier in the same topology or collection. Invalid bindings are
  reported before matching, even when the input graph is empty. Bindings are
  local to a match and do not carry across topologies. Query properties are
  evaluated in declaration order, nodes before edges.
- `{ "contains": value }` matches an array containing an element that matches
  `value`. For object elements, specify the properties to match; all specified
  properties must match the same element. `contains` may reference existing
  bindings but cannot introduce new ones.
- `{ "excludes": [values...] }` matches an array containing none of the
  listed literal values. An empty array of exclusions matches any array.
- `{ "oneOf": [values...] }` matches a value that matches at least one of the
  alternatives. It works anywhere a value can appear, including a node or
  edge's `type`, and each alternative can be a literal, an
  `equalsBinding`, an array or an object of properties. It requires a
  non-empty array. Like `contains`, it may reference existing bindings but
  cannot introduce new ones. For example, `"type": { "oneOf": ["CLASS",
  "INTERFACE"] }` matches either node type.
- Other scalar values, including booleans, and declared object properties are
  matched exactly.
- Extra ASG nodes and edges are allowed. Each returned `CodebaseASG` contains
  only the nodes and edges assigned to the topology; additional edges between
  selected nodes do not invalidate a match.

For example, the singleton topology binds its class FQN as `singletonClass`,
then requires the field's `typeFqn` and the method's
`returnTypeFqn` to reference that same FQN. Names and modifiers that are not
part of the required topology are omitted. Its modifier lists use `oneOf`
because arrays match in order and the parser keeps source order: `private
static` and `static private` produce `["PRIVATE", "STATIC"]` and
`["STATIC", "PRIVATE"]`, and both should match.

For example, the following topology matches two methods with the same complete
parameter list, whether it is empty or not:

```json
{
  "nodes": [
    { "type": "METHOD", "parameterFqns": { "bind": "parameters" } },
    { "type": "METHOD", "parameterFqns": { "equalsBinding": "parameters" } }
  ],
  "edges": []
}
```

### Collecting multiple matches

Each topology can optionally have a `collectMatches` array. After a base topology
matches, each collection independently searches the full ASG using the base
match's bindings. All nodes and edges from its matches are added to that
candidate. For example, this collects every zero-parameter method owned by
each matched class, together with the ownership edges:

```json
{
  "nodes": [
    { "type": "CLASS", "fqn": { "bind": "owner" } }
  ],
  "edges": [],
  "collectMatches": [
    {
      "nodes": [
        {
          "type": "METHOD",
          "fqn": { "bind": "method" },
          "parameterFqns": []
        }
      ],
      "edges": [
        {
          "type": "HAS_METHOD",
          "ownerFqn": { "equalsBinding": "owner" },
          "methodFqn": { "equalsBinding": "method" }
        }
      ],
      "minMatches": 1
    }
  ]
}
```

- A collection must contain `nodes` and `edges` arrays, with at least one
  query between them. Queries follow the same matching rules as a topology.
  Nodes and edges selected in the base match can also match a collection;
  repeated input nodes and edges are included only once.
- `minMatches` is a non-negative integer, defaulting to `0`. If fewer distinct
  collection subgraphs match, the whole candidate is discarded. Distinctness
  is based on the input node and edge indexes, not bindings or query order.
  For example, two ownership edges to one method count as two subgraphs.
- Bindings introduced inside a collection are local to each of its matches:
  they cannot be referenced by other collections or escape into the candidate.
  Collections may independently reuse the same local names.
- Results from all collections are merged into one `CodebaseASG`; the graph
  does not record which collection or match contributed each node or edge.
  Identical final candidate subgraphs are deduplicated.

The array of topologies still expresses alternatives of a whole topology; use
`oneOf` for alternatives within a single value. General negative
subgraph queries, transitive paths, and inspecting data absent from the ASG
are not supported.

## Adding a New Pattern

Adding a pattern requires a data definition, a concrete entity, and registration
in the pattern type system and factory:

Use the singleton design pattern as the example when following these steps:
compare its JSON definition, enum values, concrete entity, and factory
registration with the new pattern you are adding.

1. Add the pattern's metadata and `candidateTopologies` to
   `clean-architecture-visualizer/src/database/patterns.json`. The topology
   describes the CodebaseASG nodes and edges used to identify candidates.
2. Add the pattern's ID, name, and type to the corresponding enums in
   `clean-architecture-visualizer/src/entity/PatternId.ts`,
   `PatternName.ts`, and `PatternType.ts`.
3. Create
   `clean-architecture-visualizer/src/entity/<PatternName>Pattern.ts` by
   extending `Pattern`. Implement `candidateVerification` to validate each
   candidate identified from the topology.
4. Register the new concrete class in
   `clean-architecture-visualizer/src/entity/CommonPatternFactory.ts` so the
   runtime factory can construct it for its `PatternId`.
5. Add the pattern to `AVAILABLE_PATTERNS` in
   `clean-architecture-visualizer/frontend/src/lib/pattern-analyzer-view-model.ts`
   so users can choose it on the Design Pattern Checker page.
6. Add or update tests and run the relevant backend test suite. Verify both
   candidate identification from the JSON topology and candidate verification
   behavior.

Keep JSON parsing and metadata validation in `PatternsAccess`; pattern entities
should implement domain validation rather than depend directly on the JSON
source.
