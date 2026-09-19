/* 統一測試執行器 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testScripts = [
  "verify-colors.js",
  "verify-export.js",
  "verify-i18n.js"
];

async function runTest(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n\x1b[36m>>> Running ${script} ...\x1b[0m`);
    const child = spawn("node", [path.join(__dirname, script)], { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed with exit code ${code}`));
    });
  });
}

async function main() {
  let hasError = false;
  for (const script of testScripts) {
    try {
      await runTest(script);
    } catch (err) {
      console.error(`\x1b[31m${err.message}\x1b[0m`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("\n\x1b[31m❌ Some tests failed.\x1b[0m");
    process.exit(1);
  } else {
    console.log("\n\x1b[32m✅ All tests passed successfully!\x1b[0m");
    process.exit(0);
  }
}

main();
