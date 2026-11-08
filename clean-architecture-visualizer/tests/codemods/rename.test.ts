import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { applyRenames, rewriteSpecifier } from '../../codemods/rename.js';

describe('rewriteSpecifier', () => {
  it('points a relative .js import at the renamed file, keeping .js', () => {
    const renames = new Map([
      ['/r/src/types/cleanLayer.ts', '/r/src/types/clean-layer.ts'],
    ]);

    const result = rewriteSpecifier({
      importer: '/r/src/data_access/sessionDBAccess.ts',
      specifier: '../types/cleanLayer.js',
      renames,
    });

    expect(result).toBe('../types/clean-layer.js');
  });

  it('keeps an @/ alias import as an alias import', () => {
    const renames = new Map([
      [
        '/r/frontend/src/actions/useTemplate.ts',
        '/r/frontend/src/actions/use-template.ts',
      ],
    ]);

    const result = rewriteSpecifier({
      importer: '/r/frontend/tests/unit/pages/ProjectStarter.test.tsx',
      specifier: '@/actions/useTemplate',
      renames,
      aliases: [{ prefix: '@/', directory: '/r/frontend/src' }],
    });

    expect(result).toBe('@/actions/use-template');
  });

  it('fixes the relative imports of a file that moves to another folder', () => {
    const renames = new Map([
      ['/r/src/types/cleanLayer.ts', '/r/src/entity/types/clean-layer.ts'],
    ]);

    const result = rewriteSpecifier({
      importer: '/r/src/types/cleanLayer.ts',
      specifier: './cleanNode.js',
      renames,
    });

    expect(result).toBe('../../types/cleanNode.js');
  });

  it('leaves an import untouched when neither end moves', () => {
    const renames = new Map([
      ['/r/src/types/cleanLayer.ts', '/r/src/types/clean-layer.ts'],
    ]);

    const result = rewriteSpecifier({
      importer: '/r/src/types/sessionData.ts',
      specifier: './cleanNode.js',
      renames,
    });

    expect(result).toBeUndefined();
  });
});

describe('applyRenames', () => {
  let root: string;

  function write(file: string, text: string) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }

  function read(file: string) {
    return fs.readFileSync(path.join(root, file), 'utf8');
  }

  function git(...args: string[]) {
    return execFileSync(
      'git',
      ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args],
      {
        cwd: root,
        encoding: 'utf8',
      }
    );
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'rename-codemod-'));
    write(
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: { module: 'nodenext', strict: true },
        include: ['src/**/*'],
      })
    );
    write('src/types/cleanLayer.ts', "export type cleanLayer = 'entities';\n");
    write(
      'src/data/access.ts',
      "import type { cleanLayer } from '../types/cleanLayer.js';\nexport const layer: cleanLayer = 'entities';\n"
    );
    git('init', '-q');
    git('add', '.');
    git('commit', '-qm', 'fixture');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('moves a file with git and points its importers at the new name', () => {
    applyRenames(
      root,
      {
        files: [
          { from: 'src/types/cleanLayer.ts', to: 'src/types/clean-layer.ts' },
        ],
        identifiers: [],
      },
      [{ tsconfig: 'tsconfig.json' }]
    );

    expect(read('src/data/access.ts')).toContain(
      "from '../types/clean-layer.js'"
    );
    expect(git('status', '--porcelain')).toContain(
      'R  src/types/cleanLayer.ts -> src/types/clean-layer.ts'
    );
  });

  it('changes nothing when run a second time', () => {
    const table = {
      files: [
        { from: 'src/types/cleanLayer.ts', to: 'src/types/clean-layer.ts' },
      ],
      identifiers: [],
    };
    applyRenames(root, table, [{ tsconfig: 'tsconfig.json' }]);
    git('add', '-A');
    git('commit', '-qm', 'first run');

    applyRenames(root, table, [{ tsconfig: 'tsconfig.json' }]);

    expect(git('status', '--porcelain')).toBe('');
  });

  it('records a rename by case alone', () => {
    applyRenames(
      root,
      {
        files: [
          { from: 'src/types/cleanLayer.ts', to: 'src/types/CleanLayer.ts' },
        ],
        identifiers: [],
      },
      [{ tsconfig: 'tsconfig.json' }]
    );

    expect(read('src/data/access.ts')).toContain(
      "from '../types/CleanLayer.js'"
    );
    expect(git('status', '--porcelain')).toContain(
      'R  src/types/cleanLayer.ts -> src/types/CleanLayer.ts'
    );
  });

  it('updates the module path in a vi.mock call', () => {
    write(
      'src/data/access.test.ts',
      "vi.mock('../types/cleanLayer.js', () => ({}));\n"
    );
    git('add', '.');
    git('commit', '-qm', 'mock');

    applyRenames(
      root,
      {
        files: [
          { from: 'src/types/cleanLayer.ts', to: 'src/types/clean-layer.ts' },
        ],
        identifiers: [],
      },
      [{ tsconfig: 'tsconfig.json' }]
    );

    expect(read('src/data/access.test.ts')).toContain(
      "vi.mock('../types/clean-layer.js'"
    );
  });

  it('renames an identifier where it is declared and everywhere it is used', () => {
    applyRenames(
      root,
      {
        files: [],
        identifiers: [
          {
            file: 'src/types/cleanLayer.ts',
            from: 'cleanLayer',
            to: 'CleanLayer',
          },
        ],
      },
      [{ tsconfig: 'tsconfig.json' }]
    );

    expect(read('src/types/cleanLayer.ts')).toBe(
      "export type CleanLayer = 'entities';\n"
    );
    expect(read('src/data/access.ts')).toBe(
      "import type { CleanLayer } from '../types/cleanLayer.js';\nexport const layer: CleanLayer = 'entities';\n"
    );
  });

  it('finds an identifier in a file renamed by the same table', () => {
    applyRenames(
      root,
      {
        files: [
          { from: 'src/types/cleanLayer.ts', to: 'src/types/clean-layer.ts' },
        ],
        identifiers: [
          {
            file: 'src/types/clean-layer.ts',
            from: 'cleanLayer',
            to: 'CleanLayer',
          },
        ],
      },
      [{ tsconfig: 'tsconfig.json' }]
    );

    expect(read('src/data/access.ts')).toBe(
      "import type { CleanLayer } from '../types/clean-layer.js';\nexport const layer: CleanLayer = 'entities';\n"
    );
  });

  it('updates imports of the old name added after the rename, when run again', () => {
    const table = {
      files: [
        { from: 'src/types/cleanLayer.ts', to: 'src/types/clean-layer.ts' },
      ],
      identifiers: [],
    };
    applyRenames(root, table, [{ tsconfig: 'tsconfig.json' }]);
    write(
      'src/data/student.ts',
      "import type { cleanLayer } from '../types/cleanLayer.js';\n"
    );

    applyRenames(root, table, [{ tsconfig: 'tsconfig.json' }]);

    expect(read('src/data/student.ts')).toBe(
      "import type { cleanLayer } from '../types/clean-layer.js';\n"
    );
  });
});
