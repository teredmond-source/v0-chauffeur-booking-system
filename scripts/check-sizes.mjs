import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

function getDirSize(dir) {
  if (!existsSync(dir)) return 0;
  let size = 0;
  try {
    const files = readdirSync(dir, { recursive: true });
    for (const file of files) {
      try {
        const stat = statSync(join(dir, file));
        if (stat.isFile()) size += stat.size;
      } catch {}
    }
  } catch {}
  return size;
}

const dirs = ['.git', 'node_modules', '.next', 'app', 'components', 'lib'];
for (const d of dirs) {
  const size = getDirSize(d);
  console.log(`${d}: ${(size / 1024 / 1024).toFixed(2)} MB`);
}
