import { execSync } from "child_process";

try {
  const nodeModulesSize = execSync("du -sh /vercel/share/v0-project/node_modules 2>/dev/null || echo 'no node_modules'").toString().trim();
  console.log("node_modules size:", nodeModulesSize);
  
  const gitSize = execSync("du -sh /vercel/share/v0-project/.git 2>/dev/null || echo 'no .git'").toString().trim();
  console.log(".git size:", gitSize);
  
  const totalSize = execSync("du -sh /vercel/share/v0-project 2>/dev/null || echo 'unknown'").toString().trim();
  console.log("total project size:", totalSize);

  // Check if googleapis exists in node_modules
  const hasGoogleapis = execSync("ls -la /vercel/share/v0-project/node_modules/googleapis 2>/dev/null || echo 'NOT FOUND'").toString().trim();
  console.log("googleapis in node_modules:", hasGoogleapis);

  // Check free memory
  const memInfo = execSync("free -m 2>/dev/null || echo 'free not available'").toString().trim();
  console.log("Memory:", memInfo);

  // Check disk space
  const diskSpace = execSync("df -h /vercel/share 2>/dev/null || echo 'df not available'").toString().trim();
  console.log("Disk:", diskSpace);
} catch (e) {
  console.log("Error:", e.message);
}
