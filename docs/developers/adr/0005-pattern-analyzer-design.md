# Pattern Analyzer design

The Pattern Analyzer finds design patterns, such as Singleton, in a student's Java project
and highlights them on a UML class diagram. This ADR records the main design choices behind
it and what each one costs. For how the feature works, see the
[Pattern Analyzer guide](../Pattern-Analyzer.md).

Recorded: 2026-11-23. Status: Pending Acceptance.

## Summary

| # | Decision | Main benefit | Main cost |
| --- | --- | --- | --- |
| 1 | Find patterns in two passes: a JSON shape query, then a TypeScript check | Simple data for the common part, full code for the hard part | A new pattern needs both JSON and a class |
| 2 | Keep pattern definitions in `patterns.json`, behind a data access interface | The use case doesn't know the data is a JSON file | One more layer to read through |
| 3 | Write our own subgraph matcher and query language | Fits our ASG exactly, no new dependency | We have to maintain and document it |
| 4 | Parse Java with a bundled JavaParser CLI JAR | Accurate parsing of real Java | Users must have Java installed |
| 5 | Build only the patterns the user asked for, on each request | Unused patterns cost nothing | Small repeated work per request |
| 6 | Re-parse the project on every request | Results are always up to date | Slow on large projects |
| 7 | Turn the ASG into UML in an entity (`CodebaseInfoUML`); lay it out in the frontend | The backend sends plain data; the frontend controls the drawing | The response includes every class |
| 8 | Put the View Model in the frontend, not the backend | Clicks and selections update instantly, with no server call | The Presenter no longer updates the View Model directly |

## 1. Two passes: shape query, then code check

**Decision.** Detection has two passes:

1. **Candidate identification.** One generic method, `Pattern.candidateIdentification`,

   finds every subgraph shaped like the pattern's topology from `patterns.json`.
2. **Candidate verification.** Each pattern subclass (`SingletonDesignPattern`) implements

   `candidateVerification` in TypeScript to accept or reject each candidate.

**Why.** The shape ("a class with a field and a method that both refer back to it") is the
same kind of rule for every pattern, so it's written as data and matched by shared code.
The detailed rules ("the field is named `instance` and is exactly `private static`") are
easier to write, read, and debug in code.

**Tradeoffs.**

- ✅ The matcher is written and tested once.
- ✅ Verification can use any TypeScript logic.
- ❌ Each new pattern needs JSON *and* a new class, plus enum and factory entries.
- ❌ A rule could go in either pass, so contributors must choose. The guide's rule: the shape  
goes in JSON, everything else goes in code.

## 2. Pattern data in `patterns.json`, behind `PatternsAccessInterface`

**Decision.** Pattern metadata and topologies are stored in `src/database/patterns.json`.
Only `PatternsAccess` reads the file. It checks the name, type, and topology shape, then asks
a `PatternFactory` to create the right `Pattern` subclass. The Interactor sees only
`PatternsAccessInterface`.

**Why.** Following Clean Architecture, the use case shouldn't know where pattern data comes
from. The factory keeps "which class handles which ID" in one place.

**Tradeoffs.**

- ✅ The storage can change, for example to a database or user-supplied files, without
touching the Interactor or the entities.
- ✅ Tests can pass in their own JSON (`tests/backend/fixtures/patterns.custom.json`).
- ❌ Adding a pattern touches six places: JSON, three enums, the factory registry, and the
frontend's `AVAILABLE_PATTERNS`.
- ❌ The JSON is checked only at a high level. A typo in a topology property shows up as
"no matches", not as an error.

## 3. Our own subgraph matcher and query language

**Decision.** `CodebaseASG` is two plain arrays, one of nodes and one of edges.
`Pattern.ts` contains a backtracking matcher and a small query language: `bind`,
`equalsBinding`, `contains`, `excludes`, `oneOf`, several topologies, and `collectMatches`.

**Why.** The ASG is small and has a fixed set of node and edge types. A purpose-built
matcher can be typed against those exact shapes, so `PatternDefinition` gets compile-time
checks, and it adds no dependency.

**Tradeoffs.**

- ✅ No external dependency. Easy to step through in a debugger.
- ✅ Query types come from the ASG node and edge types.
- ❌ Backtracking can be slow (combinatorial) for large topologies on large projects.
- ❌ We have to maintain, test, and document the query language ourselves.
- ❌ It can't express "must not exist" queries or transitive paths ("A eventually calls B").

## 4. Parse Java with a bundled JavaParser CLI

**Decision.** `JavaParserCliAccess` runs `lib/javaparser-cli-1.0-SNAPSHOT-all.jar` with
`java -jar`, on the current working directory, and turns its JSON output into a
`CodebaseASG` with `CodebaseASGFactory`.

**Why.** JavaParser is a mature parser for Java, written in Java. Running it as a separate
process lets us use it from TypeScript and keeps the Java code out of this codebase.

**Tradeoffs.**

- ✅ Accurate parsing of real student code.
- ✅ The parser can be swapped by implementing `JavaParserCliAccessInterface`.
- ❌ Users must have Java installed. Without it, every analysis returns `500`.
- ❌ The JAR is committed as a binary and has to be rebuilt when the parser changes.

## 5. Build only the patterns that were asked for

**Decision.** At startup, `Main` creates `PatternsAccess` and the factory once, but no
`Pattern` objects. Each request builds only the patterns the user selected. An unknown ID
returns `400`.

**Tradeoffs.**

- ✅ Unused or broken pattern definitions don't slow down or break other analyses.
- ✅ New user flows can ask for any subset of patterns.
- ❌ Requested patterns are rebuilt on every request.

## 6. Re-parse the project on every request

**Decision.** Each analysis runs the JavaParser CLI again. Nothing is cached.

**Tradeoffs.**

- ✅ Always reflects the student's latest code, with no stale cache to clear.
- ✅ Simple: no cache invalidation logic.
- ❌ Each analysis pays the full parse time, which grows with project size.

**Revisit when** analyses on real student projects feel slow. Caching by file timestamps
would be the obvious next step.

## 7. UML is built in an entity; layout happens in the frontend

**Decision.** The Interactor builds a `CodebaseInfoUML` entity from the full ASG and the
pattern instances. Output Data holds only plain data: UML classes, relationships, and
pattern instances. Every element lists the `patternInstanceIds` it belongs to. The frontend
ViewModel decides positions and highlight colors.

**Tradeoffs.**

- ✅ Output Data contains no entities, as Clean Architecture requires.
- ✅ The frontend can change layout and colors without backend changes.
- ❌ The response includes every class in the project, which can be large.
- ❌ The response types are written twice, in `src/types/codebase-info-uml.ts` and
`frontend/src/lib/pattern-analyzer-view-model.ts`, and must be kept in sync by hand.

## 8. The View Model lives in the frontend

**Decision.** The Pattern Analyzer's View Model is in the frontend, in
`frontend/src/lib/pattern-analyzer-view-model.ts`. The backend Presenter only turns Output
Data into a JSON response. In the browser, `buildPatternAnalyzerViewModel` takes that
response plus what the user has selected and works out:

- where each class box goes
- the highlight color of each class, member, and arrow
- which pattern instance and class are selected, with a fallback when a selection
disappears after re-analyzing

**Why.** Most of what the View Model holds is screen state: positions, colors, and the
current selection. These change every time the user clicks a pattern instance or a class.
In the browser, a click just rebuilds the View Model from the response it already has.
On the backend, every click would need a request to the server, and the server would have
to remember each user's selection.

**Tradeoffs.**

- ✅ Selecting an instance or a class updates the diagram instantly, without calling the
server or running JavaParser again.
- ✅ The backend stays stateless: it returns the same data whatever the user has selected.
- ✅ `buildPatternAnalyzerViewModel` is a pure function, so it is easy to unit test
(`frontend/tests/unit/lib/pattern-analyzer-view-model.test.ts`).
- ✅ Layout and color changes don't touch the backend.
- ❌ This is not the textbook CA Engine. In Clean Architecture, the Presenter updates the  
View Model directly. Here, a JSON response sits between them, so students reading the code  
see the Presenter and the View Model in different programs.
