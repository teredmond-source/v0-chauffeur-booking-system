import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = resolve(process.cwd());

console.log("Project root:", projectRoot);

// Check tsconfig
const tsconfigPath = resolve(projectRoot, 'tsconfig.json');
console.log("tsconfig exists:", existsSync(tsconfigPath));
if (existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
  console.log("tsconfig paths:", JSON.stringify(tsconfig.compilerOptions?.paths));
  console.log("tsconfig baseUrl:", tsconfig.compilerOptions?.baseUrl);
}

// Check component files
const components = ['app-header', 'booking-form', 'stat-card', 'nta-info-panel'];
for (const c of components) {
  const p = resolve(projectRoot, 'components', `${c}.tsx`);
  console.log(`components/${c}.tsx exists:`, existsSync(p));
}

// Check what @ would resolve to
const atPath = resolve(projectRoot, '.');
console.log("@ resolves to:", atPath);
const testPath = resolve(atPath, 'components', 'app-header.tsx');
console.log("@/components/app-header.tsx resolves to:", testPath, "exists:", existsSync(testPath));
