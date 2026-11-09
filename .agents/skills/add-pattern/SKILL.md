---
name: add-pattern
description: "Add a new pattern to CAVE. Use when creating or registering a pattern, pattern detector, candidate topology, pattern metadata, or pattern verification rule in clean-architecture-visualizer/src."
argument-hint: "[pattern name, Java shape, and requested verification rules]"
---

# Add a CAVE Pattern

Create a complete, registered pattern from the user's requested pattern
elements. Do not only describe the changes: edit the repository and validate
the result.

## Required inputs

Extract these values from the request. If a value is missing and cannot be
derived safely, ask for it before editing:

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

## Deterministic workflow

1. Read [the pattern lifecycle](../../../docs/developers/Patterns.md),
   [the glossary](../../../GLOSSARY.md), and the existing
   `SingletonDesignPattern` implementation before editing.
2. Inspect the node and edge unions in
   `clean-architecture-visualizer/src/types/`. Use only their exact property
   names and modifier literals.
3. Choose the smallest matching starter from
   [topology presets](./assets/pattern-topology-presets.json). Treat preset
   empty strings and empty arrays as intentional wildcards; replace them only
   when the user requests an exact value.
   Use [the metadata starter](./assets/pattern-definition.template.json) for
   the JSON entry.
4. Update all registration surfaces in one change:
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
6. Add focused tests beside the repository's existing tests when a test
   location is found. Cover candidate identification from the topology and
   candidate verification, including at least one near-miss that must fail.
7. Run the smallest relevant checks from `clean-architecture-visualizer`:
   `npm test -- --runInBand <relevant-test-file>` when tests exist, then
   `npm run type-check`. Report commands and outcomes explicitly.

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

- [ ] Metadata, topology, enums, concrete entity, and factory registration are
      all present and consistent.
- [ ] Every requested topology element and verification rule is represented.
- [ ] Positive and negative verification behavior is tested where possible.
- [ ] Type-check and targeted tests pass, or failures are reported without
      hiding them.
- [ ] The user-facing summary links every changed file.
