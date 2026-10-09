import { test } from "node:test";
import assert from "node:assert/strict";
import { searchWithAi } from "../src/shared/cbam-product-search";

test("AI discovery without configuration is empty and makes no network call", async () => {
  const oldKey = process.env.OPENAI_API_KEY,
    oldFetch = globalThis.fetch;
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async () => {
    throw new Error("Must not call network");
  };
  try {
    assert.deepEqual(
      (await searchWithAi({ kind: "product", productName: "unknown" }))
        .candidates,
      [],
    );
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
test("AI suggestions still pass through deterministic exclusions and scope rules", async () => {
  const oldKey = process.env.OPENAI_API_KEY,
    oldFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "synthetic-test-only";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          candidates: [
            {
              code: "7204",
              titleKo: "스크랩",
              titleEn: "scrap",
              reasoning: "candidate",
              confidence: "high",
              missingInformation: [],
            },
            {
              code: "25070080",
              titleKo: "점토",
              titleEn: "clay",
              reasoning: "candidate",
              confidence: "high",
              missingInformation: [],
            },
          ],
        }),
      }),
      { status: 200 },
    );
  try {
    const result = await searchWithAi({ kind: "product", productName: "test" });
    assert.equal(result.candidates[0].assessment.status, "out_of_scope");
    assert.equal(result.candidates[1].assessment.status, "conditional");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
test("provider failures and invalid JSON are rejected so public handler can fall back", async () => {
  const oldKey = process.env.OPENAI_API_KEY,
    oldFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "synthetic-test-only";
  try {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(
      searchWithAi({ kind: "product", productName: "test" }),
    );
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ output_text: "invalid" }), { status: 200 });
    await assert.rejects(
      searchWithAi({ kind: "product", productName: "test" }),
    );
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('AI fallback cannot restore a steel candidate rejected by a plastic material', async () => {
  const oldKey = process.env.OPENAI_API_KEY, oldFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'synthetic-test-only';
  globalThis.fetch = async () => new Response(JSON.stringify({ output_text: JSON.stringify({ candidates: [
    { code: '7318', titleKo: '철강 볼트', titleEn: 'steel bolt', reasoning: 'candidate', confidence: 'high', missingInformation: [] },
    { code: '39269097', titleKo: '플라스틱 제품', titleEn: 'plastic article', reasoning: 'candidate', confidence: 'medium', missingInformation: [] },
  ] }) }), { status: 200 });
  try {
    const result = await searchWithAi({ kind: 'product', productName: '플라스틱 볼트', material: '폴리프로필렌' });
    assert.deepEqual(result.candidates.map(c => c.code), ['39269097']);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
