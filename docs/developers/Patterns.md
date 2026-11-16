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
- Other scalar values, including booleans, and declared object properties are
  matched exactly.
- Extra ASG nodes and edges are allowed. Each returned `CodebaseASG` contains
  only the nodes and edges assigned to the topology; additional edges between
  selected nodes do not invalidate a match.

For example, the singleton topology binds its class FQN as `singletonClass`,
then requires the field's `typeFqn` and the method's
`returnTypeFqn` to reference that same FQN. Names and modifiers that are not
part of the required topology are omitted.

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

For example, after binding an adapter method as `implementation`, a collection
can require an `IMPLEMENTS` edge whose mapping includes that method:

```json
{
  "type": "IMPLEMENTS",
  "methodImplementations": {
    "contains": {
      "implementationMethodFqn": { "equalsBinding": "implementation" }
    }
  }
}
```

Adapter collects target methods independently of these mappings, so a missing
implementation remains visible to verification. Its target-method query uses
`"modifiers": { "excludes": ["PRIVATE", "STATIC"] }`. It collects mapped
adapter methods together with their delegation calls, and separately collects
called-method nodes when available for highlighting.

The array of topologies still expresses alternatives. General negative
subgraph queries, transitive paths, and inspecting data absent from the ASG
are not supported.

## Adapter and the JavaParser CLI contract

The Adapter detector currently looks for a class with a direct `IMPLEMENTS`
edge to a target interface and a directly owned field whose type is a different
class. The field type must not implement the target, directly or indirectly.
It collects all target instance methods independently of their implementations
and calls, then verifies that each has a concrete resolved implementation that
calls a non-static method directly on that same field. At least one target
method is required. Names, constructor injection, argument transformations,
return-value flow, and whether a call is reached on every execution path are
not checked. An adapter with an inherited field or only an inherited
`IMPLEMENTS` relationship is not currently identified.

The bundled JAR must be updated before Adapter analysis can run. In addition
to the existing `{ "nodes": [...], "edges": [...] }`, it must emit:

1. `supertypeFqns: string[]` on every `CLASS` node: all transitive superclass
   and interface FQNs, including interfaces inherited via a superclass. Use
   `[]` when there are none. These FQNs must match the graph's class and
   interface FQNs.
2. Use `HAS_METHOD` edges for declared methods of classes and interfaces as
   before. Also emit `HAS_METHOD` edges with `"isInherited": true` for
   effective inherited public instance methods of interfaces and implementing
   classes, excluding methods overridden by a more specific declaration.
   The owner is the type on which the method is available; `methodFqn` is the
   actual declaring method. Each referenced method needs a `METHOD` node.
   Include signatures in method FQNs so overloads remain distinct. The UML
   displays only declared members; inherited edges are used for analysis.

   ```json
   { "type": "HAS_METHOD", "ownerFqn": "MediaPlayer", "methodFqn": "MediaPlayer.play(java.lang.String)" }
   { "type": "HAS_METHOD", "ownerFqn": "MediaPlayer", "methodFqn": "Parent.pause()", "isInherited": true }
   ```

3. Add `methodImplementations` to each `IMPLEMENTS` edge. Each entry maps an
   interface instance method to its resolved concrete implementation in that
   class. Include inherited and default implementations where applicable;
   both methods must have `METHOD` nodes and matching `HAS_METHOD` edges.
   Resolve Java overriding, including overloads, generics and covariant
   returns, rather than pairing methods by name alone. Use an empty array
   when no methods have implementations.

   ```json
   {
     "type": "IMPLEMENTS",
     "interfaceFqn": "MediaPlayer",
     "implementingClassFqn": "AudioPlayerAdapter",
     "methodImplementations": [
       {
         "interfaceMethodFqn": "MediaPlayer.play(java.lang.String)",
         "implementationMethodFqn": "AudioPlayerAdapter.play(java.lang.String)"
       }
     ]
   }
   ```

4. On every `CALLS` edge, provide `isStaticCall: boolean` and resolve
   `targetObjectFqn` to the direct receiver's FQN. When the receiver is a
   field, use the field declaration's FQN, not its type. For example, the
   `CALLS` edge for `legacy.playFile(...)` contains:

   ```json
   { "targetObjectFqn": "AudioPlayerAdapter.legacy", "isStaticCall": false }
   ```

The detector compares `targetObjectFqn` with the adapter field's FQN. It
distinguishes different field declarations of the same type, but cannot
distinguish the same field accessed on different instances.

The existing `callingMethodFqn`, `calledMethodFqn`, `isConstructorCall`,
`IMPLEMENTS`, and `HAS_FIELD` facts must also be resolved consistently.
Called external methods need not have `METHOD` nodes, but the call must have
its resolved, nonempty `calledMethodFqn`. This contract provides
structural evidence of calls, not proof of argument or
return-value data flow.

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
