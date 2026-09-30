import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { fixture } from "./fixture";
import { QUESTIONS } from "../src/shared/cbam-navigator";
const root = path.resolve(process.cwd(), "..");
const out = path.join(root, "tmp/navigator-qa");
await mkdir(out, { recursive: true });
const secret = randomBytes(32).toString("hex");
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NAVIGATOR_SESSION_SECRET: secret,
  NAVIGATOR_INTAKE_SECRET: secret,
  ISO_SESSION_SECRET: secret,
  NAVIGATOR_INTAKE_URL: "http://localhost:3101/api/cbam/navigator-intake",
  NAVIGATOR_PRIVACY_RETENTION: "TEST ONLY",
  NAVIGATOR_PRIVACY_PROCESSORS: "TEST ONLY",
  NAVIGATOR_PRIVACY_CONTACT: "test@example.invalid",
};
delete env.NETLIFY;
delete env.NETLIFY_BLOBS_CONTEXT;
delete env.NETLIFY_SITE_ID;
delete env.OPENAI_API_KEY;
const children: ReturnType<typeof spawn>[] = [];
function start(folder: string, port: string) {
  const p = spawn(
    process.execPath,
    [
      path.join(root, folder, "node_modules/next/dist/bin/next"),
      "start",
      "--port",
      port,
      "--hostname",
      "localhost",
    ],
    {
      cwd: path.join(root, folder),
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  children.push(p);
  let log = "";
  p.stdout!.on("data", (x) => {
    log += x.toString();
  });
  p.stderr!.on("data", (x) => {
    log += x.toString();
  });
  return () => log;
}
const logs = [start("web-app", "3101"), start("navigator-app", "3100")];
async function wait(url: string) {
  for (let i = 0; i < 90; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Server did not start");
}
let browser;
const passed: string[] = [];
try {
  await Promise.all([
    wait("http://localhost:3100"),
    wait("http://localhost:3101"),
  ]);
  const base = "http://localhost:3100",
    internal = "http://localhost:3101";
  for (const route of [
    "/",
    "/cn-search",
    "/applicability",
    "/product-map",
    "/readiness",
    "/evidence",
    "/application",
    "/privacy",
    "/legal",
  ])
    assert.equal((await fetch(base + route)).status, 200, route);
  for (const route of [
    "/admin",
    "/cbam/admin",
    "/documents",
    "/cbam/documents",
    "/iso",
    "/system",
    "/generator",
    "/kets-contract",
    "/internal",
    "/iso/login",
    "/iso/setup",
    "/api/cbam/applications",
    "/templates/P1173_CBAM_Client_Enquiry_Form_Template.docx",
  ])
    assert.equal((await fetch(base + route)).status, 404, route);
  passed.push("9 public routes 200; 13 internal routes/assets 404");
  assert.equal(
    (await fetch(base + "/api/public/cbam/application")).status,
    405,
  );
  const sessionResponse = await fetch(base + "/api/public/cbam/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(sessionResponse.status, 200);
  const session = await sessionResponse.json();
  const cookie = sessionResponse.headers.get("set-cookie")!.split(";")[0];
  const headers = { "Content-Type": "application/json", Cookie: cookie };
  const post = (route: string, value: unknown, extra = {}) =>
    fetch(base + route, {
      method: "POST",
      headers: { ...headers, ...extra },
      body: JSON.stringify(value),
    });
  const api = "/api/public/cbam";
  assert.equal(
    (await post(api + "/cn-search", { kind: "codes", codes: "7318 15 90" }))
      .status,
    200,
  );
  const result = await (
    await post(api + "/cn-search", { kind: "codes", codes: "7318 15 90" })
  ).json();
  assert.equal(result.assessments[0].normalized, "73181590");
  const product = await (
    await post(api + "/cn-search", {
      kind: "product",
      productName: "철강 볼트",
    })
  ).json();
  assert.ok(product.candidates.length);
  assert.equal("model" in product, false);
  const empty = await (
    await post(api + "/cn-search", {
      kind: "product",
      productName: "unknown synthetic widget",
    })
  ).json();
  assert.deepEqual(empty.candidates, []);
  assert.equal(
    (
      await post(api + "/cn-search", {
        kind: "product",
        productName: "a".repeat(3001),
      })
    ).status,
    413,
  );
  assert.equal(
    (
      await post(
        api + "/cn-search",
        { kind: "codes", codes: "7318" },
        { Origin: "https://attacker.invalid" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + api + "/cn-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  passed.push(
    "CN formats, dictionary/no-key fallback, oversized input, cross-origin and missing-session controls",
  );
  const f = fixture();
  f.navigatorData.sessionId = session.sessionId;
  f.navigatorData.readinessAnswers = Object.fromEntries(
    QUESTIONS.map((q) => [q.id, "ready"]),
  );
  const id = crypto.randomUUID();
  const response = await post(api + "/application", f, {
    "idempotency-key": id,
  });
  assert.equal(response.status, 201, await response.clone().text());
  const receipt = await response.json();
  assert.deepEqual(Object.keys(receipt), ["reference"]);
  const duplicate = await (
    await post(api + "/application", f, { "idempotency-key": id })
  ).json();
  assert.equal(duplicate.reference, receipt.reference);
  assert.equal((await fetch(internal + "/api/cbam/applications")).status, 401);
  assert.equal(
    (
      await fetch(internal + "/api/cbam/navigator-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  const payload = Buffer.from(
    JSON.stringify({
      username: "local-qa",
      role: "admin",
      expiresAt: Date.now() + 3600000,
    }),
  ).toString("base64url");
  const authCookie = `lrqa_iso_admin=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
  const auth = { Cookie: authCookie };
  const stored = await (
    await fetch(internal + "/api/cbam/applications", { headers: auth })
  ).json();
  assert.equal(stored.applications.length, 1);
  const app = stored.applications[0];
  assert.equal(app.source, "NAVIGATOR");
  assert.equal(app.navigatorData.readinessScore, 100);
  assert.equal(app.quotedDays, 3.5);
  assert.equal(app.companyName, f.application.companyName);
  const put = await fetch(internal + "/api/cbam/applications", {
    method: "PUT",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: app.reference,
      application: f.application,
      pricing: {
        quotedDays: 4,
        dayRate: 1300000,
        expenses: 600000,
        reason: "Local QA",
      },
    }),
  });
  assert.equal(put.status, 200);
  const updated = (await put.json()).application;
  assert.equal(updated.source, "NAVIGATOR");
  assert.equal(updated.navigatorData.readinessScore, 100);
  assert.equal(updated.quotedDays, 4);
  assert.equal(updated.intakeDigest, app.intakeDigest);
  assert.equal(
    (
      await fetch(
        internal + "/cbam/documents?type=quote&ref=" + app.reference,
        { headers: auth },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(
        internal + "/cbam/documents?type=contract&ref=" + app.reference,
        { headers: auth },
      )
    ).status,
    200,
  );
  passed.push(
    "Public receipt only, signed intake -> existing store, idempotency, admin auth, pricing edit preserves diagnostics, quote/contract routes",
  );
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(base);
  await page.screenshot({
    path: path.join(out, "home-desktop.png"),
    fullPage: true,
  });
  await page
    .getByLabel("제품명 또는 CN 코드", { exact: true })
    .fill("7318 15 90");
  await page.getByRole("button", { name: "CBAM 대상 확인" }).click();
  await page
    .getByRole("button", { name: "대상 여부 확인", exact: true })
    .click();
  await page.getByText("CBAM 대상", { exact: true }).waitFor();
  await page.getByRole("button", { name: "이 코드로 계속하기" }).click();
  await page.getByRole("link", { name: "거래 적용 가능성 확인" }).click();
  assert.equal(
    await page.getByLabel("검토할 CN 코드").inputValue(),
    "73181590",
  );
  await page.getByLabel("EU로 반입되는 거래인가요?").selectOption("yes");
  await page.getByLabel("관세 원산지").selectOption("KR");
  await page.getByLabel("귀사의 역할").selectOption("operator");
  await page.getByLabel("EU 수입자별 연간 대상 수입량 합계(t)").fill("100");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "적용 가능성 확인", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  await page
    .getByRole("link", { name: "제품·공정 구조 확인", exact: true })
    .click();
  await page.getByLabel("제품명", { exact: true }).fill("시험용 철강 볼트");
  await page.getByLabel("생산공정 (확인한 내용만 입력)").fill("압연");
  await page.getByLabel("사업장 (선택)").fill("시험 사업장");
  await page
    .getByRole("link", { name: "검증 준비도 진단", exact: true })
    .click();
  for (const q of QUESTIONS)
    await page.locator(`input[name="${q.id}"]`).first().check();
  await page.getByRole("button", { name: "진단 결과 확인" }).click();
  await page.locator(".score").waitFor();
  assert.match(await page.locator(".score").innerText(), /100/);
  await page.getByRole("link", { name: "필요한 증빙자료 확인" }).click();
  await page.getByLabel("자료 준비상태").first().selectOption("ready");
  const link = await page.getByRole("link", { name: "LRQA 검증 신청", exact: true }).getAttribute('href');
  assert.ok(link?.startsWith('https://ketsquot-pigeon.netlify.app/cbam#navigator='));
  await page.goto(internal + '/cbam' + new URL(link!).hash);
  await page.getByRole('heading', { name: 'Navigator 진단정보가 연결되었습니다' }).waitFor();
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await page.getByRole('textbox', {name:'8자리 CN 코드',exact:true}).inputValue(), '73181590');
  await page.getByLabel('회사명 *', {exact:true}).fill('내비게이터 시험 회사');
  await page.getByLabel('담당자명 *', {exact:true}).fill('테스트 담당자');
  await page.getByLabel('이메일 *', {exact:true}).fill('qa@example.invalid');
  await page.getByLabel('전화번호 *', {exact:true}).fill('000-0000-0000');
  await page.getByRole('checkbox', {name:'개인정보 처리 및 신청정보의 업무상 이용에 동의합니다. *',exact:true}).check();
  await page.getByRole('button', {name:'CBAM 서비스 신청서 제출'}).click();
  await page.getByRole('heading', {name:'CBAM 서비스 신청이 접수되었습니다.'}).waitFor();
  const handoffSaved = (await (await fetch(internal + '/api/cbam/applications', {headers:auth})).json()).applications.find((x: any) => x.companyName === '내비게이터 시험 회사');
  assert.equal(handoffSaved.source, 'NAVIGATOR');
  assert.equal(handoffSaved.navigatorData.readinessScore, 100);
  assert.equal(handoffSaved.navigatorData.productName, '시험용 철강 볼트');
  passed.push('External application link, automatic prefill, fragment removal, consent and diagnostic persistence');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/cn-search",
      "/applicability",
      "/product-map",
      "/readiness",
      "/evidence",
      "/application",
    ]) {
      await page.goto(base + route);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(over, false, `overflow ${width} ${route}`);
    }
  }
  await page.goto(base);
  await page.screenshot({
    path: path.join(out, "home-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(pageErrors, []);
  passed.push(
    "Browser flow, scope/diagnosis/application auto-fill, 320px/390px mobile routes, no browser exceptions",
  );
  // Complete production document render with the existing internal UI.
  const admin = await browser.newContext();
  await admin.addCookies([
    { name: "lrqa_iso_admin", value: authCookie.split("=")[1], url: internal },
  ]);
  const ap = await admin.newPage();
  await ap.goto(internal + "/cbam/admin");
  await ap
    .getByRole("heading", { name: "유입경로 · CBAM Navigator" })
    .waitFor();
  for (const type of ["quote", "contract"]) {
    await ap.goto(
      internal + `/cbam/documents?ref=${app.reference}&type=${type}`,
    );
    await ap.locator("article.cbam-document").waitFor();
    assert.match(
      await ap.locator("article.cbam-document").innerText(),
      /Navigator Test Company/,
    );
    const downloading = ap.waitForEvent("download");
    await ap.getByRole("button", { name: `Word ${type === "contract" ? "계약서" : "견적서"} 다운로드` }).click();
    const download = await downloading;
    const target = path.join(out, `${type}-regression.docx`);
    await download.saveAs(target);
    const bytes = await readFile(target);
    assert.ok(bytes.length > 5000);
    assert.equal(bytes.subarray(0, 2).toString(), "PK");
  }
  passed.push(
    "Existing admin displays Navigator lead; quote and contract render and download actual Word files",
  );
  const legacy = await fetch(internal + '/api/cbam/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fixture().application, sites: '', country: '', verificationYears: ['2024'], serviceType: 'other', dayRate: 1, source: 'NAVIGATOR' }) });
  assert.equal(legacy.status, 201);
  const oldReceipt = await legacy.json();
  assert.deepEqual(Object.keys(oldReceipt.application), ['reference']);
  const oldRecord = (await (await fetch(internal + '/api/cbam/applications?ref=' + oldReceipt.application.reference, { headers: auth })).json()).application;
  assert.equal(oldRecord.source, undefined);
  assert.equal(oldRecord.dayRate, undefined);
  passed.push('Legacy direct application accepts prior year/optional site, strips price/source injection and returns reference only');
  // Session/IP limiting tested last to avoid interfering with functional tests.
  let limited = false;
  for (let i = 0; i < 65; i++) {
    const r = await post(api + "/cn-search", { kind: "codes", codes: "7318" });
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  assert.equal(limited, true);
  passed.push("Repeated search eventually returns 429");
  await writeFile(
    path.join(out, "integration.json"),
    JSON.stringify({ passed, at: new Date().toISOString() }, null, 2),
  );
  console.log(passed.join("\n"));
} finally {
  await browser?.close();
  children.forEach((p) => p.kill());
  await Promise.all(
    logs.map((log, i) => writeFile(path.join(out, `server-${i}.log`), log())),
  );
}
