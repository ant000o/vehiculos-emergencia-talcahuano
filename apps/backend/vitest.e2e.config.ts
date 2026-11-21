import { defineConfig } from 'vitest/config';
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const backendDir = path.resolve(process.cwd(), 'apps/backend');
const envPath = path.join(backendDir, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const tsconfig = JSON.parse(fs.readFileSync(path.join(backendDir, 'tsconfig.json'), 'utf8'));

export default defineConfig({
  root: backendDir,
  plugins: [
    {
      name: 'nest-tsc-decorators',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('.ts') || id.includes('node_modules')) return null;
        const out = ts.transpileModule(code, {
          compilerOptions: {
            ...tsconfig.compilerOptions,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            sourceMap: true,
            inlineSources: true,
          },
          fileName: id,
        });
        return { code: out.outputText, map: out.sourceMapText };
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/rbac-suite.e2e-spec.ts', 'test/negocio-crud.e2e-spec.ts', 'test/seguridad-funcional.e2e-spec.ts', 'test/integracion-rendimiento.e2e-spec.ts',
      'test/seguridad-critica.e2e-spec.ts'],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
