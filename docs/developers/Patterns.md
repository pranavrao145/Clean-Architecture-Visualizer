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
- `PatternDefinition` uses the shared CodebaseASG node and edge types for
  candidate topology data.
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
provided ASG whose topology matches the pattern's `candidateTopology`. It
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

- A string beginning with `$` is a placeholder. Its value is bound on first
  use and must be equal at every later use. This expresses relationships
  between node and edge properties.
- An empty string is a wildcard.
- An empty array is a wildcard. A non-empty array must have the same length and
  values as the candidate, including placeholder bindings.
- Other scalar values, including booleans, and object properties are matched
  exactly unless one of the wildcard rules applies.
- Extra ASG nodes and edges are allowed. Each returned `CodebaseASG` contains
  only the nodes and edges assigned to the topology; additional edges between
  selected nodes do not invalidate a match.

For example, the singleton topology binds its class FQN through
`$singletonClass`, then requires the field's `typeFqn` and the method's
`returnTypeFqn` to reference that same FQN. Names and modifiers that are not
part of the required topology are represented by wildcards.
