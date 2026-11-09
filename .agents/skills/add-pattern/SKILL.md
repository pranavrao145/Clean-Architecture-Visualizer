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

Ask at most one focused clarification question before editing. Combine all
genuinely blocking choices into that one question; never ask another
clarification after the user answers or leaves fields blank.

Use this decision order:

1. If the requested pattern and a conventional topology are recognizable,
   infer the standard structure and proceed. Blank fields mean “figure it out
   based off what you know about the design pattern and/or use the conventional choice,” not “ask again.”
2. If the pattern has multiple materially different conventions, present one
   recommended default and the alternatives in the single question. If the
   user leaves the choice blank, use the recommendation.
3. If the pattern is unfamiliar or cannot be mapped to the CodebaseASG unions,
   ask once for general shape advice. Do not ask for metadata separately;
   derive it from the confirmed shape. Do the same for the verification rules.
4. If the answer remains incomplete, make the safest conventional choice,
   state the assumption, and continue. Stop only when implementation would
   require inventing a user-specific name, signature, modifier, or
   relationship that cannot be inferred.

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
   [topology presets](./assets/pattern-topology-presets.json). Treat preset
   empty strings and empty arrays as intentional wildcards; replace them only
   when the user requests an exact value.
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
7. Run the smallest relevant checks from `clean-architecture-visualizer`:
   `npm test -- --runInBand <relevant-test-file>` when tests exist, then
   `npm run type-check`. Report commands and outcomes explicitly.

Do not pause for optional metadata. Fill it from the confirmed pattern shape,
and do not create a second clarification round to refine an answer that was
blank or accepted.

## Topology rules

- A string beginning with `$` is a binding placeholder. Reusing it enforces
  equality across nodes and edges.
- `""` is a string wildcard and `[]` is an array wildcard.
- Non-empty arrays must match in length and value/order.
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
      contains constructor identity checks and complete candidate verification.
- [ ] `clean-architecture-visualizer/src/entity/CommonPatternFactory.ts`
      registers the new `PatternId` with the concrete entity.
- [ ] `clean-architecture-visualizer/tests/backend/entity/<name>Pattern.test.ts`
      covers typed definition setup, topology identification, positive
      verification, and at least one negative near-miss; if the repository has
      no analogous test location, the summary explains why.
- [ ] `clean-architecture-visualizer/tests/backend/entity/patternFactory.test.ts`
      covers factory construction when that shared registry test exists.
- [ ] Every requested topology element and verification rule is represented.
- [ ] Type-check and targeted tests pass, or failures are reported without
      hiding them, including the exact commands and outcomes.
- [ ] The final summary links every changed file, including all files listed
      above that were touched for this pattern.
