import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const load = (locale) => JSON.parse(readFileSync(new URL(`../public/orden/locales/${locale}.json`, import.meta.url), "utf8"));

test("all orden locale files contain the same translation keys", () => {
  const norwegian = Object.keys(load("nb-NO")).sort();
  for (const locale of ["da-DK", "en-US"]) assert.deepEqual(Object.keys(load(locale)).sort(), norwegian, locale);
});

test("phase two navigation and guard restrictions are translated", () => {
  for (const locale of ["nb-NO", "da-DK", "en-US"]) {
    const messages = load(locale);
    for (const key of ["nav.guards", "nav.posts", "nav.contacts", "nav.defaults", "base.restrictions", "base.editGuard", "base.editPost", "base.editContact"]) {
      assert.equal(typeof messages[key], "string", `${locale}: ${key}`);
      assert.ok(messages[key].trim().length > 0, `${locale}: ${key}`);
    }
  }
});

test("planning history and same-day warnings are translated", () => {
  for (const locale of ["nb-NO", "da-DK", "en-US"]) {
    const messages = load(locale);
    for (const key of ["planning.historyLabel", "planning.historySeason.spring", "planning.historySeason.autumn", "planning.assignedSameDayCount", "planning.sameDayWarning", "planning.sameDayConfirm"]) {
      assert.equal(typeof messages[key], "string", `${locale}: ${key}`);
      assert.ok(messages[key].trim().length > 0, `${locale}: ${key}`);
    }
  }
});
