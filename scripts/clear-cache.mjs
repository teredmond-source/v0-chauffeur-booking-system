import { rmSync, existsSync } from "fs";
import { resolve } from "path";

const nextDir = resolve(process.cwd(), ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleared .next cache directory");
} else {
  console.log(".next directory not found, nothing to clear");
}

// Also check if tsconfig.json exists and has correct paths
import { readFileSync } from "fs";
const tsconfigPath = resolve(process.cwd(), "tsconfig.json");
if (existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
  console.log("tsconfig.json paths:", JSON.stringify(tsconfig.compilerOptions?.paths));
  console.log("tsconfig.json baseUrl:", tsconfig.compilerOptions?.baseUrl);
} else {
  console.log("WARNING: tsconfig.json not found!");
}

// Check if component files exist
const files = ["components/app-header.tsx", "components/booking-form.tsx", "components/stat-card.tsx", "components/nta-info-panel.tsx"];
for (const f of files) {
  const p = resolve(process.cwd(), f);
  console.log(`${f}: ${existsSync(p) ? "EXISTS" : "MISSING"}`);
}
