import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  Node,
  Project,
  type SourceFile,
  type StringLiteral,
  SyntaxKind,
} from 'ts-morph';

const SOURCE_EXTENSION = /\.(ts|tsx)$/;
const IMPORT_EXTENSION = /\.(js|jsx|ts|tsx)$/;
const MOCK_CALL =
  /^(vi|jest)\.(mock|doMock|unmock|unstable_mockModule|importActual|requireActual)$/;

/** A path alias such as `@/` for `frontend/src`, from a tsconfig's `paths`. */
export interface Alias {
  prefix: string;
  directory: string;
}

export interface RenameTable {
  files: Array<{ from: string; to: string }>;
  identifiers: Array<{ file: string; from: string; to: string }>;
}

/** A TypeScript project to update, with any sources its tsconfig leaves out. */
export interface ProjectConfig {
  tsconfig: string;
  extraSources?: string[];
}

export interface SpecifierContext {
  importer: string;
  specifier: string;
  renames: ReadonlyMap<string, string>;
  aliases?: readonly Alias[];
}

/**
 * Returns the specifier that `importer` should use after the renames, or
 * undefined if it can stay as it is. Keeps the specifier's extension style,
 * and keeps an alias specifier as an alias.
 */
export function rewriteSpecifier({
  importer,
  specifier,
  renames,
  aliases = [],
}: SpecifierContext): string | undefined {
  const extension = specifier.match(IMPORT_EXTENSION)?.[0] ?? '';
  const withoutExtension = specifier.slice(
    0,
    specifier.length - extension.length
  );
  const alias = aliases.find((candidate) =>
    withoutExtension.startsWith(candidate.prefix)
  );
  let target: string;
  if (alias) {
    target = path.join(
      alias.directory,
      withoutExtension.slice(alias.prefix.length)
    );
  } else if (withoutExtension.startsWith('.')) {
    target = path.resolve(path.dirname(importer), withoutExtension);
  } else {
    return undefined;
  }

  const renamedTarget = [...renames].find(
    ([from]) => from.replace(SOURCE_EXTENSION, '') === target
  )?.[1];
  const newTarget = renamedTarget?.replace(SOURCE_EXTENSION, '') ?? target;
  const newImporter = renames.get(importer) ?? importer;
  if (newTarget === target && (alias || newImporter === importer)) {
    return undefined;
  }

  if (alias) {
    return `${alias.prefix}${path.relative(alias.directory, newTarget)}${extension}`;
  }
  const relative = path.relative(path.dirname(newImporter), newTarget);
  return `${relative.startsWith('.') ? relative : `./${relative}`}${extension}`;
}

/**
 * The projects the codemod updates. The frontend's tsconfig leaves out its
 * tests, so they're added here.
 */
const CAVE_PROJECTS: ProjectConfig[] = [
  { tsconfig: 'tsconfig.test.json' },
  {
    tsconfig: 'frontend/tsconfig.json',
    extraSources: ['frontend/tests/**/*.{ts,tsx}'],
  },
];

/**
 * Applies the rename table under `root`. Paths in the table and the project
 * configs are relative to `root`. Files move first, so an identifier's `file`
 * is its path after the renames. Entries already applied are skipped, so a
 * second run changes nothing.
 */
export function applyRenames(
  root: string,
  table: RenameTable,
  projects: readonly ProjectConfig[]
): void {
  const realRoot = fs.realpathSync(root);
  renameFiles(realRoot, table.files, projects);
  renameIdentifiers(realRoot, table.identifiers, projects);
}

/**
 * Renames each identifier at its declaration and every use. The projects can
 * share files (the frontend imports backend types), so the rename locations
 * from every project are gathered before any file changes.
 */
function renameIdentifiers(
  root: string,
  identifiers: RenameTable['identifiers'],
  projects: readonly ProjectConfig[]
): void {
  if (identifiers.length === 0) {
    return;
  }
  const edits = new EditSet();
  for (const config of projects) {
    const project = loadProject(root, config);
    for (const { file, from, to } of identifiers) {
      const declaration = project
        .getSourceFile(path.join(root, file))
        ?.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(
          (identifier) =>
            identifier.getText() === from && isDeclarationName(identifier)
        );
      if (!declaration) {
        continue;
      }
      for (const location of project
        .getLanguageService()
        .findRenameLocations(declaration)) {
        const span = location.getTextSpan();
        edits.add(location.getSourceFile().getFilePath(), span.getStart(), {
          length: span.getLength(),
          text: to,
        });
      }
    }
  }
  edits.apply();
}

/** Moves each file with git, and updates every module path that points at it. */
function renameFiles(
  root: string,
  files: RenameTable['files'],
  projects: readonly ProjectConfig[]
): void {
  // Entries already applied stay in the map, so imports of the old name that a
  // merged branch brings in are still updated.
  const renames = new Map(
    files
      .map(
        ({ from, to }) => [path.join(root, from), path.join(root, to)] as const
      )
      .filter(([from, to]) => existsExactly(from) || existsExactly(to))
  );
  if (renames.size === 0) {
    return;
  }

  const edits = new EditSet();
  for (const config of projects) {
    const project = loadProject(root, config);
    const aliases = aliasesOf(project);
    for (const sourceFile of ownSourceFiles(project, root)) {
      const importer = sourceFile.getFilePath();
      for (const literal of moduleSpecifiers(sourceFile)) {
        const specifier = literal.getLiteralText();
        const rewritten = rewriteSpecifier({
          importer,
          specifier,
          renames,
          aliases,
        });
        if (rewritten !== undefined) {
          edits.add(importer, literal.getStart() + 1, {
            length: specifier.length,
            text: rewritten,
          });
        }
      }
    }
  }

  edits.apply();
  for (const [from, to] of renames) {
    if (existsExactly(from)) {
      gitMove(root, from, to);
    }
  }
}

function isDeclarationName(identifier: Node): boolean {
  const parent = identifier.getParent();
  return (
    parent !== undefined &&
    Node.hasName(parent) &&
    parent.getNameNode() === identifier
  );
}

interface Edit {
  length: number;
  text: string;
}

function loadProject(root: string, config: ProjectConfig): Project {
  const project = new Project({
    tsConfigFilePath: path.join(root, config.tsconfig),
  });
  for (const pattern of config.extraSources ?? []) {
    project.addSourceFilesAtPaths(path.join(root, pattern));
  }
  return project;
}

function aliasesOf(project: Project): Alias[] {
  const options = project.getCompilerOptions();
  const base = options.baseUrl ?? path.dirname(String(options.configFilePath));
  return Object.entries(options.paths ?? {}).flatMap(([key, [target]]) =>
    key.endsWith('/*') && target?.endsWith('/*')
      ? [
          {
            prefix: key.slice(0, -1),
            directory: path.resolve(base, target.slice(0, -2)),
          },
        ]
      : []
  );
}

function ownSourceFiles(project: Project, root: string): SourceFile[] {
  return project
    .getSourceFiles()
    .filter(
      (file) =>
        file.getFilePath().startsWith(`${root}/`) &&
        !file.getFilePath().includes('/node_modules/')
    );
}

function moduleSpecifiers(sourceFile: SourceFile): StringLiteral[] {
  const literals: StringLiteral[] = [];
  for (const declaration of [
    ...sourceFile.getImportDeclarations(),
    ...sourceFile.getExportDeclarations(),
  ]) {
    const specifier = declaration.getModuleSpecifier();
    if (specifier && Node.isStringLiteral(specifier)) {
      literals.push(specifier);
    }
  }
  // Module paths in mock calls, such as vi.mock('../x.js'), aren't imports.
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression
  )) {
    const [first] = call.getArguments();
    if (
      MOCK_CALL.test(call.getExpression().getText()) &&
      first &&
      Node.isStringLiteral(first)
    ) {
      literals.push(first);
    }
  }
  return literals;
}

/** Text edits per file, keyed by start offset so the same edit seen twice counts once. */
class EditSet {
  private readonly byFile = new Map<string, Map<number, Edit>>();

  add(file: string, start: number, edit: Edit): void {
    const fileEdits = this.byFile.get(file) ?? new Map<number, Edit>();
    fileEdits.set(start, edit);
    this.byFile.set(file, fileEdits);
  }

  /** Writes the edits, from the end of each file backwards so offsets stay valid. */
  apply(): void {
    for (const [file, fileEdits] of this.byFile) {
      let text = fs.readFileSync(file, 'utf8');
      for (const [start, edit] of [...fileEdits].sort(([a], [b]) => b - a)) {
        text =
          text.slice(0, start) + edit.text + text.slice(start + edit.length);
      }
      fs.writeFileSync(file, text);
    }
  }
}

/**
 * Moves a file with git, so git records the rename. A rename by case alone
 * goes through a temporary name, because macOS file systems ignore case.
 */
function gitMove(root: string, from: string, to: string): void {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (from.toLowerCase() === to.toLowerCase()) {
    const temporary = `${to}.rename-tmp`;
    execFileSync('git', ['mv', from, temporary], { cwd: root });
    execFileSync('git', ['mv', temporary, to], { cwd: root });
  } else {
    execFileSync('git', ['mv', from, to], { cwd: root });
  }
}

/** Like fs.existsSync, but case-sensitive even on macOS. */
function existsExactly(file: string): boolean {
  const directory = path.dirname(file);
  return (
    fs.existsSync(directory) &&
    fs.readdirSync(directory).includes(path.basename(file))
  );
}

if (import.meta.main) {
  const root = path.resolve(import.meta.dirname, '..');
  const table: RenameTable = JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, 'rename-table.json'), 'utf8')
  );
  applyRenames(root, table, CAVE_PROJECTS);
}
