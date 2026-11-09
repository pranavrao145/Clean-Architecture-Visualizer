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
Do not infer a concrete topology from a broad pattern label. Names such as
"Factory", "Adapter", or "Observer" can refer to multiple variants.

## Clarification gate

Before reading broad repository context, determine whether the request supplies
all required inputs. If the pattern name has multiple common variants, ask a
focused structured question that:

1. offers the likely variants;
2. asks for the required nodes, edges, names/signatures/modifiers, and semantic
   verification rules; and
3. proposes a repository-compatible default only when it can be stated
   completely.

If the user's answers conflict (for example, one variant is selected but rules
describe another), ask one follow-up choice and stop until the conflict is
resolved. Selecting a variant does not confirm an invented topology: explicitly
confirm any proposed topology and verification defaults before editing.

## Deterministic workflow

1. After clarification, read [the pattern lifecycle](../../../docs/developers/Patterns.md)
   and the existing `SingletonDesignPattern` implementation. Read
   [the glossary](../../../GLOSSARY.md) only when the request uses CAVE-specific
   terminology whose meaning is ambiguous.
2. Inspect the node and edge unions in
   `clean-architecture-visualizer/src/types/`. Use only their exact property
   names and modifier literals.
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
6. Add focused tests beside the repository's existing tests when a test
   location is found. Cover candidate identification from the topology and
   candidate verification, including at least one near-miss that must fail.
7. Run the smallest relevant checks from `clean-architecture-visualizer`:
   `npm test -- --runInBand <relevant-test-file>` when tests exist, then
   `npm run type-check`. Report commands and outcomes explicitly.
   Run commands from the `clean-architecture-visualizer` directory. If the
   full type-check exposes unrelated baseline errors, run a source-only
   TypeScript check when available and report both results; do not edit
   unrelated tests just to make validation green.

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
