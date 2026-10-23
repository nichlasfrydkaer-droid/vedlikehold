import test from "node:test";
import assert from "node:assert/strict";
import { jobcardKey, jobcardSlug, normalizeLegacyJobcardNumber } from "../public/assets/jobcardIdentity.js";

test("same shown number can have separate hall and apartment identities", () => {
  assert.equal(jobcardKey({ key:"da:hall:8", nummer:"8" }), "da:hall:8");
  assert.equal(jobcardKey({ key:"da:apartment:8", nummer:"8" }), "da:apartment:8");
  assert.equal(jobcardSlug({ slug:"apartment-8", nummer:"8" }), "apartment-8");
});

test("legacy numeric identities remain compatible", () => {
  assert.equal(normalizeLegacyJobcardNumber("00041"), "41");
  assert.equal(normalizeLegacyJobcardNumber("031a"), "31A");
});
