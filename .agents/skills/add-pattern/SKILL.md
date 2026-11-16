---
name: add-pattern
description: "Add a new pattern to CAVE. Use when creating or registering a pattern, pattern detector, candidate topology, pattern metadata, or pattern verification rule in clean-architecture-visualizer/src."
argument-hint: "[pattern name, Java shape, and requested verification rules]"
---

# Add a CAVE Pattern

Create a complete, registered pattern from the user's requested pattern
elements. Do not only describe the changes: edit the repository and validate
the result.

## Inputs and inference

Extract these values from the request:

- `id`: lowercase kebab-free identifier used by `PatternId` and `patterns.json`.
- `name`: PascalCase display name used by `PatternName` and the concrete class.
- `type`: an existing `PatternType` value, normally `Design Pattern`.
- `description` and `learningInfo`: user-facing metadata.
- `topology`: required CodebaseASG nodes and edges.
- `verification`: semantic rules that topology matching alone cannot enforce.
- `tests`: positive and negative candidate cases, if the repository's test
  layout is discoverable.

Preserve user-specified names, modifiers, signatures, relationships, and
verification rules. Never silently weaken a requested rule into a wildcard.
Derive omitted descriptions, learning information, conventional names, and
standard design-pattern structure from established design-pattern knowledge.
State derived choices in the completion summary.

### Single clarification checkpoint

Before inferring any topology or semantic verification rules, ask exactly one
focused clarification question each for the user's direction on:

- the required topology: nodes, edges, names, signatures, modifiers, and
  relationships;
- the verification rules: semantic constraints that topology matching alone
  cannot enforce.

Combine these with any genuinely blocking choice between materially different
pattern variants in the same question. Do not ask another clarification after
the user answers or leaves fields blank. Blank topology or verification fields
mean “infer the safest conventional choice after this checkpoint,” not “skip
the checkpoint.” If the pattern is unfamiliar or cannot be mapped to the
CodebaseASG unions, derive metadata from the confirmed or inferred shape in the
required topology question.

After the checkpoint, preserve every user-specified element and never weaken a
requested rule into a wildcard. For omitted details, infer the conventional
design-pattern structure and state those derived choices in the completion
summary. Stop only when implementation would require inventing a user-specific
name, signature, modifier, or relationship that cannot be inferred.

## Deterministic workflow

1. After clarification, read [the pattern lifecycle](../../../docs/developers/Patterns.md)
   and the existing `SingletonDesignPattern` implementation. Read
   [the glossary](../../../GLOSSARY.md) only when the request uses CAVE-specific
   terminology whose meaning is ambiguous.
2. Inspect the node and edge unions in
   `clean-architecture-visualizer/src/types/`. Use only their exact property
   names and modifier literals.
   Inspect only the relevant unions and nearby tests after the pattern shape
   is known; do not repeat broad repository searches or reopen files already
   read to answer the same question.
3. Choose the smallest matching starter from
   [topology presets](./assets/pattern-topology-presets.json). Omitted
   properties are wildcards; empty strings and arrays are exact values.
   Use [the metadata starter](./assets/pattern-definition.template.json) for
   the JSON entry.
   If no preset matches, compose the topology directly from the clarified
   requirements; do not broaden a preset to make it fit.
4. Inspect the existing pattern tests and registration files in one focused
   read batch, then update all registration surfaces in one change:
   - `clean-architecture-visualizer/src/database/patterns.json`
   - `clean-architecture-visualizer/src/entity/PatternId.ts`
   - `clean-architecture-visualizer/src/entity/PatternName.ts`
   - `clean-architecture-visualizer/src/entity/PatternType.ts` only when the
     type is new
   - `clean-architecture-visualizer/src/entity/<Name>DesignPattern.ts`
   - `clean-architecture-visualizer/src/entity/CommonPatternFactory.ts`
5. Implement the concrete class from
   [the class starter](./assets/pattern-class.template.ts). Its constructor
   must reject mismatched ID, name, and type. Its
   `candidateVerification` must check candidate cardinality, node kinds,
   semantic values, exact modifiers where required, and required typed edges.
   Add concise comments before each major verification phase so the code
   explains which pattern invariant is being checked (for example:
   cardinality, role identification, inheritance/implementation structure,
   method signatures, allocation behavior, and client isolation). Comments
   should explain domain intent, not restate individual boolean expressions.
   Keep JSON and data-access concerns out of the entity.
6. Add focused tests beside the repository's existing tests. In this
   repository, create
   `clean-architecture-visualizer/tests/backend/entity/<name>Pattern.test.ts`
   using the existing `pattern.test.ts` style. The test file must:
   - construct a typed `PatternDefinition` for the new pattern;
   - build a minimal positive `CodebaseASG` with every topology node and edge;
   - verify `candidateIdentification` returns the expected candidate;
   - verify `candidateVerification` accepts the positive candidate; and
   - verify at least one near-miss is rejected (wrong semantic value,
     modifier, node kind, cardinality, or edge direction).
   Also add a factory construction test to
   `clean-architecture-visualizer/tests/backend/entity/patternFactory.test.ts`
   when that shared registry test exists. If the repository uses a different
   test layout, locate its analogous pattern and factory tests and follow
   their naming/style instead of inventing a parallel structure.
7. Make the required frontend catalog/test expectation updates described in
   [Frontend pattern checklist](#frontend-pattern-checklist). These are
   mechanical updates for every new pattern; do not skip them because the
   detector itself is implemented in the backend.
8. Run relevant checks from the `clean-architecture-visualizer`
   package directory, not the repository root:
   `cd clean-architecture-visualizer && npm test -- --runInBand
   tests/backend/entity/<name>Pattern.test.ts` when tests exist, then
   `cd clean-architecture-visualizer && npm run type-check`. Run these
   sequentially so a failing or hanging topology test is diagnosed before
   the type-check starts. Report the exact commands and outcomes explicitly.

   Before running them, inspect the package scripts and dependency state. If
   the selected command fails because a declared dependency is missing, restore
   dependencies with the package manager and rerun the same check; do not
   change dependency manifests for this recovery. If the test hangs or
   backtracks excessively, stop it safely and inspect the topology for broad
   unconstrained node queries. Prefer binding roles through typed edges and
   collecting the bound nodes, while preserving the requested relationships,
   before retrying.

Do not pause for optional metadata. Fill it from the confirmed pattern shape,
and do not create a second clarification round to refine an answer that was
blank or accepted.

## Topology rules

- `{ "bind": "name" }` introduces a binding once and
  `{ "equalsBinding": "name" }` compares against it. Duplicate bindings and
  references not bound earlier are errors.
- Array queries can use `{ "contains": value }` to match one element, including
  an object with properties compared to existing bindings, or
  `{ "excludes": [values...] }` to rule out literal elements. `contains`
  cannot introduce bindings.
- Omitted properties are wildcards. Strings and arrays, including empty
  values, match exactly; arrays match in length and value/order.
- Literal strings, including strings beginning with `$`, have no special
  meaning.
- `candidateTopologies` is an array of alternative topologies.
- An optional `collectMatches` array gathers each collection's matching `nodes`
  and `edges` for a base candidate. `minMatches` defaults to zero. Collection
  bindings are local; use base bindings to constrain their matches.
- Use typed edges to connect selected nodes; do not rely on names alone.
- Extra nodes and edges in the full ASG are allowed, but the entity must
  validate the exact candidate subgraph it receives.

## Naming and registration rules

- `id` must be lowercase and match the JSON key and `PatternId` value.
- The enum member should be the PascalCase name without punctuation.
- The concrete class should be `<Name>DesignPattern`, unless an existing
  repository convention for the requested name requires another exact class
  name.
- Add the factory registry entry keyed by the new `PatternId`.
- Keep enum and metadata values type-safe; do not use casts to bypass
  `PatternDefinition`.

## Frontend pattern checklist

For every new pattern, make these two small synchronized edits:

1. In
   `clean-architecture-visualizer/frontend/src/lib/pattern-analyzer-view-model.ts`,
   append `{ id: '<id>', name: '<Name>' }` to `AVAILABLE_PATTERNS`. Use the
   exact lowercase backend `PatternId` for `id` and the exact PascalCase
   display name for `name`. Preserve the existing array order unless the
   request specifies another order.
2. In
   `clean-architecture-visualizer/frontend/tests/unit/pages/DesignPatternChecker.test.tsx`,
   update the initial analyze-request expectation to include the new lowercase
   ID in the same order as `AVAILABLE_PATTERNS` (the
   `analyzes as soon as the page opens` test). If the test explicitly asserts
   the complete selected-pattern list or a re-analysis request list, add the
   new ID to those expected arrays as well; do not change unrelated assertions.

These updates are required even when no new frontend component or behavior is
needed. The shared mock response already supplies the response shape for the
page; only add new mock classes, members, relationships, or Learn-tab
assertions when the new pattern's UI behavior is specifically being tested.
The frontend catalog entry and the request expectation must use the same ID,
so verify both before running tests.

## Completion checklist

- [ ] `clean-architecture-visualizer/src/database/patterns.json` contains the
      metadata and candidate topology.
- [ ] `clean-architecture-visualizer/src/entity/PatternId.ts` contains the
      matching lowercase ID.
- [ ] `clean-architecture-visualizer/src/entity/PatternName.ts` contains the
      matching PascalCase name.
- [ ] `clean-architecture-visualizer/src/entity/PatternType.ts` is updated
      only when the requested type is new.
- [ ] `clean-architecture-visualizer/src/entity/<Name>DesignPattern.ts`
      contains constructor identity checks, complete candidate verification,
      and concise comments describing each major verification phase.
- [ ] `clean-architecture-visualizer/src/entity/CommonPatternFactory.ts`
      registers the new `PatternId` with the concrete entity.
- [ ] `clean-architecture-visualizer/tests/backend/entity/<name>Pattern.test.ts`
      covers typed definition setup, topology identification, positive
      verification, and at least one negative near-miss; if the repository has
      no analogous test location, the summary explains why.
- [ ] `clean-architecture-visualizer/tests/backend/entity/patternFactory.test.ts`
      covers factory construction when that shared registry test exists.
- [ ] `clean-architecture-visualizer/frontend/src/lib/pattern-analyzer-view-model.ts`
      adds `{ id: '<id>', name: '<Name>' }` to `AVAILABLE_PATTERNS`.
- [ ] `clean-architecture-visualizer/frontend/tests/unit/pages/DesignPatternChecker.test.tsx`
      includes the new ID in the initial analyze-request expectation and in
      any other complete request arrays affected by the new catalog entry.
- [ ] Copy the new backend `PatternId` value character-for-character into the
      frontend catalog `id` and every affected request expectation. For
      example, a backend ID of `observer` requires
      `{ id: 'observer', name: 'Observer' }` and an expected request array
      containing `'observer'`; do not change case, spelling, punctuation, or
      use the display name in place of the ID.
- [ ] For the initial page-load expectation, make the expected array exactly
      `AVAILABLE_PATTERNS.map(({ id }) => id)` in both value and order. For
      later re-analysis expectations, preserve the order produced by the
      existing request-building behavior and add the new ID wherever that
      behavior places it; do not assume every request uses catalog order.
- [ ] Every requested topology element and verification rule is represented.
- [ ] Verification comments explain the domain invariant checked by each
      major phase without changing runtime behavior.
- [ ] Validation commands were run from `clean-architecture-visualizer`;
      topology tests completed before type-checking, and missing declared
      dependencies were restored only when validation demonstrated they were
      needed.
- [ ] Type-check and targeted tests pass, or failures are reported without
      hiding them, including the exact commands and outcomes.
- [ ] The final summary links every changed file, including all files listed
      above that were touched for this pattern.
