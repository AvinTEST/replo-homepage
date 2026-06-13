import nextEnv from "@next/env";
import { checkEnvironment } from "../src/lib/env/check.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const result = checkEnvironment(process.env);

console.log(`[check:env] environment=${result.environment}`);
for (const item of result.configured) console.log(`[ok] ${item}`);
for (const item of result.warnings) console.warn(`[warning] ${item}`);
for (const item of result.errors) console.error(`[error] ${item}`);

if (result.errors.length > 0) {
  process.exitCode = 1;
} else {
  console.log("[check:env] configuration is ready");
}
