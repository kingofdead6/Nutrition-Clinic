/**
 * The code shared by both apps (zod schemas, calculations, helpers) is written once, in
 * TypeScript, in apps/client/src/shared. The server is plain JavaScript, so this script
 * generates its copy in apps/server/src/shared: one .js file (comments kept) plus one
 * .d.ts file (for editor types) per source module. Tests are not copied.
 *
 *   npm run sync:shared            regenerate the server copy after editing the client one
 *   npm run sync:shared -- --check exit 1 if the server copy is out of date (run by npm test)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'apps/client/src/shared');
const OUT = path.join(ROOT, 'apps/server/src/shared');
const CHECK = process.argv.includes('--check');
const HEADER = '// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.\n';

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}

const sources = walk(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

/** Node ESM needs explicit extensions: './calc/health' → './calc/health.js'. */
const withJsExtensions = (code) =>
  code.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+?)\2/g, (m, lead, q, spec) =>
    spec.endsWith('.js') ? m : `${lead}${q}${spec}.js${q}`,
  );

const prettierOptions = {
  ...(await prettier.resolveConfig(path.join(ROOT, 'package.json'))),
  plugins: [],
};
const format = (code, filepath) => prettier.format(code, { ...prettierOptions, filepath });

/** @type {Map<string, string>} relative output path → contents */
const expected = new Map();

// JavaScript: per-file transpile (keeps comments, erases types and type-only imports).
for (const file of sources) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
      isolatedModules: true,
    },
    fileName: file,
  });
  const rel = path.relative(SRC, file).replace(/\.ts$/, '.js');
  expected.set(rel, HEADER + (await format(withJsExtensions(outputText), rel)));
}

// Declarations: one program over all sources.
const program = ts.createProgram(sources, {
  declaration: true,
  emitDeclarationOnly: true,
  strict: true,
  skipLibCheck: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  rootDir: SRC,
  outDir: OUT,
});
const pending = [];
const result = program.emit(undefined, (fileName, text) => {
  const rel = path.relative(OUT, fileName);
  pending.push(format(withJsExtensions(text), rel).then((out) => expected.set(rel, HEADER + out)));
});
await Promise.all(pending);
const diagnostics = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(
      diagnostics,
      ts.sys
        ? {
            getCanonicalFileName: (f) => f,
            getCurrentDirectory: () => ROOT,
            getNewLine: () => '\n',
          }
        : undefined,
    ),
  );
  process.exit(1);
}

const existing = existsSync(OUT) ? walk(OUT).map((f) => path.relative(OUT, f)) : [];

if (CHECK) {
  const stale = [
    ...[...expected]
      .filter(
        ([rel, text]) =>
          !existsSync(path.join(OUT, rel)) || readFileSync(path.join(OUT, rel), 'utf8') !== text,
      )
      .map(([rel]) => rel),
    ...existing.filter((rel) => !expected.has(rel)),
  ];
  if (stale.length) {
    console.error(
      `apps/server/src/shared is out of date (${stale.join(', ')}).\nRun: npm run sync:shared`,
    );
    process.exit(1);
  }
  console.log('apps/server/src/shared is up to date.');
} else {
  for (const rel of existing) if (!expected.has(rel)) rmSync(path.join(OUT, rel));
  for (const [rel, text] of expected) {
    mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
    writeFileSync(path.join(OUT, rel), text);
  }
  console.log(`Wrote ${expected.size} files to apps/server/src/shared.`);
}
