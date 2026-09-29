/**
 * Empaqueta el script de migracion para correrlo bajo Node.
 * Los modulos del frontend (Vite) se resuelven aqui: esbuild aplica
 * `--define` sobre import.meta.env, que en Vite es inyectado por el bundler
 * y no existe al ejecutar en Node puro.
 *
 *   node scripts/_build-migrate.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outfile = path.join(root, 'node_modules', '.cache', 'migrate-frontend-to-db.mjs');

await build({
  entryPoints: [path.join(root, 'scripts', 'migrate-frontend-to-db.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  tsconfig: path.join(root, 'tsconfig.json'),
  jsx: 'automatic',
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  define: {
    'import.meta.env': JSON.stringify({
      MODE: 'development',
      DEV: true,
      PROD: false,
      VITE_API_URL: 'http://localhost:3000',
    }),
  },
  logLevel: 'info',
  banner: {
    js: [
      "import { createRequire as __cr } from 'node:module';",
      'const require = __cr(import.meta.url);',
    ].join('\n'),
  },
});

console.log(`\nBundle: ${outfile}`);
