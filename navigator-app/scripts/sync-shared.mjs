import { copyFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(root, "../web-app/src/lib");
const files = [
  "cbam-input.ts",
  "cbam-handoff.ts",
  "cbam-cn.ts",
  "cbam-cn-data.ts",
  "cbam-cn-data.2026-09-29.ts",
  "cbam-product-search.ts",
  "cbam-navigator.ts",
  "cbam-regulatory.ts",
  "cbam-intake-schema.ts",
  "cbam-intake-signature.ts",
];
await mkdir(path.join(root, "src/shared"), { recursive: true });
const existing = await readdir(path.join(root, "src/shared"));
if (existing.some((file) => !files.includes(file)))
  throw new Error("Unexpected file in public shared allowlist");
for (const file of files)
  await copyFile(path.join(source, file), path.join(root, "src/shared", file));
await mkdir(path.join(root, "public"), { recursive: true });
await copyFile(
  path.join(root, "../web-app/public/lrqa-logo.png"),
  path.join(root, "public/lrqa-logo.png"),
);
console.log(`Synced ${files.length} allowed modules and existing LRQA logo.`);
