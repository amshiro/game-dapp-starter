// Checks the local environment against the Environment Contract without printing values.
// Usage: node scripts/env-check.ts [--mode development|production]
import { loadEnv } from "vite";
import {
  checkEnvironment,
  formatEnvCheck,
} from "../src/shared/config/check-environment.ts";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex === -1 ? "development" : process.argv[modeIndex + 1];

if (mode !== "development" && mode !== "production") {
  console.error("FAIL --mode: must be development or production");
  process.exit(2);
}

// Vite's loader applies .env < .env.local < .env.<mode> < .env.<mode>.local < process.env.
const env = loadEnv(mode, process.cwd(), "");
const results = checkEnvironment(env, mode);
console.log(formatEnvCheck(mode, results));
process.exitCode = results.some((r) => r.status === "FAIL") ? 1 : 0;
