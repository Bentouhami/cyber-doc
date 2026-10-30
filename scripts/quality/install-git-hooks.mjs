import { execFileSync } from "node:child_process";
import path from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

execFileSync("git", ["config", "--local", "core.hooksPath", ".githooks"], {
  cwd: root,
  stdio: "inherit",
});

console.log(`Git hooks enabled from ${path.join(root, ".githooks")}`);
