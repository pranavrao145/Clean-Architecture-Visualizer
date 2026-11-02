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
`AppBuilder.buildPatterns(patternIDs)`. The request follows this flow:

```text
User action
    ↓
AppBuilder.buildPatterns([PatternID.Singleton, ...])
    ↓
PatternsAccess.buildPatterns(...)
    ↓
Select requested definitions from patterns.json
    ↓
Validate pattern ID, name, and type
    ↓
PatternFactory.create(patternID, definition)
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
