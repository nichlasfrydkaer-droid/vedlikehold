import test from "node:test";
import assert from "node:assert/strict";
import { jobcardKey, jobcardSlug, normalizeLegacyJobcardNumber } from "../public/assets/jobcardIdentity.js";
import { jobcardPresentation } from "../public/assets/jobcardPresentation.js";

test("same shown number can have separate hall and apartment identities", () => {
  assert.equal(jobcardKey({ key:"da:hall:8", nummer:"8" }), "da:hall:8");
  assert.equal(jobcardKey({ key:"da:apartment:8", nummer:"8" }), "da:apartment:8");
  assert.equal(jobcardSlug({ slug:"apartment-8", nummer:"8" }), "apartment-8");
});

test("legacy numeric identities remain compatible", () => {
  assert.equal(normalizeLegacyJobcardNumber("00041"), "41");
  assert.equal(normalizeLegacyJobcardNumber("031a"), "31A");
});

test("placement is separated from the yellow notice without its label", () => {
  assert.deepEqual(
    jobcardPresentation({ merk:"Placering: I rigssalen\n\nHUSK: Kontrollér døren." }),
    { location:"I rigssalen", notice:"HUSK: Kontrollér døren." }
  );
  assert.deepEqual(
    jobcardPresentation({ placering:"Lejligheden", merk:"" }),
    { location:"Lejligheden", notice:"" }
  );
});
