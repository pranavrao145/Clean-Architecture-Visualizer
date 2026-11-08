# Codemods

Scripts that make large renames across the backend, its tests, and the frontend.
Each one can be re-run: entries already applied are skipped, so a second run
changes nothing.

## Rename

`rename.ts` applies `rename-table.json`. Paths in the table are relative to
`clean-architecture-visualizer/`.

```json
{
  "files": [{ "from": "src/types/cleanLayer.ts", "to": "src/types/clean-layer.ts" }],
  "identifiers": [{ "file": "src/types/clean-layer.ts", "from": "cleanLayer", "to": "CleanLayer" }]
}
```

- **Files** move with `git mv`, so git records the rename. A rename by case
  alone goes through a temporary name, because macOS ignores case.
- **Imports** of a moved file are updated, along with its own imports and the
  module paths in `vi.mock` and `jest.mock` calls. Backend imports keep their
  `.js` extensions, and frontend `@/` imports stay `@/`.
- **Identifiers** are renamed at their declaration and every use, in the
  backend and the frontend. `file` is the file that declares the identifier,
  at its path after the file renames.

To run it (needs Node 24.2 or later, which runs TypeScript directly):

```sh
cd clean-architecture-visualizer
npm run codemod:rename
npm run verify --prefix ..
```

`npm run verify` at the repository root runs both type checks, Jest, Vitest,
and `biome ci`. Commit each kind of rename on its own, so it can be reviewed
and reverted on its own.

After merging `main` into a branch that predates a rename, run the codemod
again to update the branch's new imports.
