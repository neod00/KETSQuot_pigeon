import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessCnCode,
  parseCnCodeInput,
  searchProductCatalog,
} from "../src/shared/cbam-cn";
import {
  productStructure,
  assessApplicability,
  CBAM_CN_MASTER,
} from "../src/shared/cbam-regulatory";
import {
  QUESTIONS,
  scoreReadiness,
  PRIVACY_VERSION,
} from "../src/shared/cbam-navigator";
import {
  parseIntake,
  parseApplication,
} from "../src/shared/cbam-intake-schema";
import { signIntake, verifyIntake } from "../src/shared/cbam-intake-signature";
import {
  calculateCbamDays,
  createDefaultCbamApplication,
  estimateCbamCost,
} from "../../web-app/src/lib/cbam";
import { fixture } from "./fixture";

for (const [code, status] of [
  ["73181590", "in_scope"],
  ["7318", "in_scope"],
  ["730300", "in_scope"],
  ["7318 15 90", "in_scope"],
  ["7318-15-90", "in_scope"],
  ["3105", "partial"],
  ["25070080", "conditional"],
  ["7204", "out_of_scope"],
  ["31056000", "out_of_scope"],
  ["39269097", "out_of_scope"],
  ["7318159", "invalid"],
  ["abc73181590", "invalid"],
  ["", "invalid"],
])
  test(`CN ${code}: ${status}`, () =>
    assert.equal(assessCnCode(code).status, status));
test("formatted codes remain whole; invalid tokens are not discarded", () => {
  assert.deepEqual(parseCnCodeInput("7318 15 90, 7604\n7303-00"), [
    "7318 15 90",
    "7604",
    "7303-00",
  ]);
  assert.deepEqual(parseCnCodeInput("abcd 73181590"), ["abcd", "73181590"]);
});
test("Korean and English discovery uses dictionary without credentials", () => {
  for (const productName of ["철강 볼트", "steel bolt", "알루미늄 프로파일"])
    assert.ok(searchProductCatalog({ productName }).length);
  assert.ok(
    searchProductCatalog({
      productName: "pipe",
      material: "steel",
      form: "seamless",
      use: "industrial",
    }).length,
  );
  assert.ok(searchProductCatalog({ productName: "시멘트" }).length > 1);
});
test("functional units follow article 4, including cement exception and electricity kWh", () => {
  assert.match(productStructure("25231000").unit, /클링커/);
  assert.match(productStructure("25233000").unit, /제품의 생산량/);
  assert.match(productStructure("27160000").unit, /kWh/);
  assert.match(productStructure("28141000").unit, /kg/);
  assert.match(productStructure("31021010").unit, /보충 단위/);
  assert.match(productStructure("72210010").category, /철강 제품/);
});
test("all master rules are versioned including exclusions", () => {
  assert.ok(CBAM_CN_MASTER.some((x) => x.excluded));
  for (const r of CBAM_CN_MASTER)
    for (const key of [
      "effectiveFrom",
      "effectiveTo",
      "sourceRegulation",
      "sourceUrl",
      "legalReference",
      "revision",
      "lastCheckedAt",
    ])
      assert.ok(key in r);
});
const applicability = {
  euExport: "yes",
  cnCode: "73181590",
  origin: "KR",
  importer: "operator",
  mass: "50",
  allImports: true,
};
test("50t importer-wide limit; hydrogen/electricity exception; unknown is not zero", () => {
  assert.match(assessApplicability(applicability), /면제 적용 가능/);
  assert.match(
    assessApplicability({ ...applicability, mass: "50.1" }),
    /가능성이 높/,
  );
  assert.match(assessApplicability({ ...applicability, mass: "" }), /합계/);
  assert.match(
    assessApplicability({ ...applicability, allImports: false }),
    /합계/,
  );
  assert.match(
    assessApplicability({ ...applicability, cnCode: "28041000", mass: "1" }),
    /면제가 적용되지/,
  );
  assert.match(
    assessApplicability({ ...applicability, origin: "NO" }),
    /원산지 제외/,
  );
  assert.match(
    assessApplicability({ ...applicability, cnCode: "25070080" }),
    /추가 정보/,
  );
});
test("24-question scores and gaps; incomplete results never stored as complete", () => {
  assert.equal(QUESTIONS.length, 24);
  assert.equal(scoreReadiness({}).complete, false);
  const answers = Object.fromEntries(
    QUESTIONS.map((q) => [q.id, "ready" as const]),
  );
  assert.equal(scoreReadiness(answers).readinessScore, 100);
  assert.deepEqual(scoreReadiness(answers).gapCodes, []);
  assert.equal(
    scoreReadiness({ ...answers, S1: "missing" }).readinessScore,
    96,
  );
  const value = parseIntake({
    ...fixture(),
    navigatorData: {
      ...fixture().navigatorData,
      readinessScore: 100,
      readinessAnswers: { S1: "missing" },
    },
  });
  assert.equal(value.navigatorData.readinessScore, undefined);
});
test("intake strips internal properties, recomputes scores, separates consent", () => {
  const value = fixture();
  const clean = parseIntake({
    ...value,
    application: { ...value.application, estimatedCost: 1, source: "ADMIN" },
    navigatorData: { ...value.navigatorData, readinessScore: 100 },
    marketingConsent: false,
  });
  assert.equal("estimatedCost" in clean.application, false);
  assert.equal("source" in clean.application, false);
  assert.equal(clean.marketingConsent, false);
  assert.equal(clean.navigatorData.readinessScore, undefined);
  assert.throws(() => parseIntake({ ...value, privacyNoticeVersion: "old" }));
  assert.throws(() =>
    parseIntake({
      ...value,
      application: { ...value.application, consent: false },
    }),
  );
  assert.throws(() =>
    parseApplication({ ...value.application, email: "not-email" }),
  );
  assert.throws(() =>
    parseApplication({ ...value.application, processCount: "-1" }),
  );
  assert.throws(() => parseApplication({ ...value.application, chp: "false" }));
  assert.throws(() =>
    parseIntake({ ...value, navigatorData: { sessionId: "bad" } }),
  );
  assert.equal(clean.privacyNoticeVersion, PRIVACY_VERSION);
});
test("signature rejects altered body, expired request and short/missing secret", () => {
  const secret = "test-only-".repeat(5),
    body = '{"a":1}',
    timestamp = String(Date.now());
  const sig = signIntake(body, timestamp, secret);
  assert.equal(verifyIntake(body, timestamp, sig, secret), true);
  assert.equal(verifyIntake(body + " ", timestamp, sig, secret), false);
  assert.equal(
    verifyIntake(body, timestamp, sig, secret, Number(timestamp) + 300_001),
    false,
  );
  assert.equal(verifyIntake(body, timestamp, sig, ""), false);
});
test("legacy input retains optional site/year and other-service behavior while removing price injection", () => {
  const input = {
    ...fixture().application,
    sites: "",
    country: "",
    verificationYears: [],
    serviceType: "other",
    dayRate: 1,
  };
  const result = parseApplication(input, true);
  assert.equal(result.serviceType, "other");
  assert.equal(result.sites, "");
  assert.equal("dayRate" in result, false);
});
test("existing day and cost golden results remain unchanged for representative inputs", () => {
  const base = createDefaultCbamApplication();
  assert.equal(calculateCbamDays(base).quotedDays, 3.5);
  assert.equal(
    calculateCbamDays({ ...base, clientType: "importer" }).quotedDays,
    2.5,
  );
  assert.equal(
    calculateCbamDays({
      ...base,
      processCount: "5",
      goodsCount: "5",
      mmdStatus: "none",
    }).quotedDays,
    7.5,
  );
  assert.equal(
    calculateCbamDays({
      ...base,
      processCount: "5",
      goodsCount: "5",
      mmdStatus: "none",
      knownClient: true,
    }).quotedDays,
    7,
  );
  assert.equal(estimateCbamCost(3.5), 5_150_000);
});
