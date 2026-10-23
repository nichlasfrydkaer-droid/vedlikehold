import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../public/orden/assets/app.js", import.meta.url), "utf8");

test("orden forms capture their values before disabling controls", () => {
  const handlers = [
    /const form = event\.currentTarget; const data = new FormData\(form\); setFormBusy\(form, true\)/,
    /const form = event\.currentTarget; const payload = formPayload\(form\); setFormBusy\(form, true\)/,
    /const currentForm = event\.currentTarget; const data = Object\.fromEntries\(new FormData\(currentForm\)\); setFormBusy\(currentForm, true\)/,
    /const form = event\.currentTarget; const data = Object\.fromEntries\(new FormData\(form\)\); data\.shiftCount = Number\(data\.shiftCount\); setFormBusy\(form, true\)/,
    /const form = event\.currentTarget; const payload = formPayload\(form, true\); setFormBusy\(form, true\)/,
  ];

  for (const pattern of handlers) assert.match(source, pattern);
});

test("no orden handler disables a form before reading FormData", () => {
  assert.doesNotMatch(source, /setFormBusy\((form|currentForm), true\);[^\n]*new FormData\(/);
  assert.doesNotMatch(source, /setFormBusy\(form, true\);[^\n]*formPayload\(/);
});
