import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

const ROOT = "/vercel/share/v0-project";
const SKIP = ["node_modules", ".next", ".git", ".vercel", "pnpm-lock.yaml", "scripts"];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk(ROOT);
const bundle = {};

for (const f of files) {
  const rel = relative(ROOT, f);
  try {
    bundle[rel] = readFileSync(f, "utf-8");
  } catch {
    // skip binary files
  }
}

console.log("=== PROJECT FILES ===");
console.log(`Total files: ${Object.keys(bundle).length}`);
console.log("");

for (const [path, content] of Object.entries(bundle)) {
  console.log(`\n========== FILE: ${path} ==========`);
  console.log(content);
}

console.log("\n=== END OF PROJECT FILES ===");
