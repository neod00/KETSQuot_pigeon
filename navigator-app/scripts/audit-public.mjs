import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const allowed = [
  "/",
  "/_not-found",
  "/_global-error",
  "/cn-search",
  "/applicability",
  "/product-map",
  "/readiness",
  "/evidence",
  "/application",
  "/privacy",
  "/legal",
];
const forbidden =
  /DEFAULT_CBAM_DAY_RATE|DEFAULT_CBAM_EXPENSES|automaticQuotedDays|manualQuotedDays|estimatedCost|pricingAdjustmentReason|P1173|ISO_ADMIN_PASSWORD|ISO_SESSION_SECRET/;
async function walk(dir) {
  const results = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...(await walk(p)));
    else results.push(p);
  }
  return results;
}
const manifest = JSON.parse(
  await readFile(".next/server/app-paths-manifest.json", "utf8"),
);
for (const route of Object.keys(manifest))
  if (
    ![
      "/page",
      "/[step]/page",
      "/_not-found/page",
      "/_global-error/page",
    ].includes(route) &&
    !/^\/api\/public\/cbam\/(session|cn-search|application|events)\/route$/.test(
      route,
    ) && route !== '/api/public/cbam/leads/route'
  )
    throw new Error(`Unexpected route: ${route}`);
const prerender = JSON.parse(
  await readFile(".next/prerender-manifest.json", "utf8"),
);
for (const route of Object.keys(prerender.routes))
  if (!allowed.includes(route))
    throw new Error(`Unexpected rendered page: ${route}`);
for (const file of await walk(path.join(root, ".next/static")))
  if (/\.(js|json)$/.test(file) && forbidden.test(await readFile(file, "utf8")))
    throw new Error(`Internal data in browser asset: ${file}`);
const assets = await readdir("public");
if (assets.some((x) => !["lrqa-logo.png", "fonts", "__forms.html"].includes(x)))
  throw new Error("Unexpected public asset");
const fonts = await readdir("public/fonts");
if (fonts.some(x => !["NotoSansKR-Regular.ttf", "OFL.txt"].includes(x)))
  throw new Error("Unexpected public font asset");
console.log(
  "PASS: public routes, browser bundles and assets contain no internal features/pricing.",
);
