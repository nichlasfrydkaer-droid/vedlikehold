import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve("public/orden/locales");
const files = (await readdir(directory)).filter((file) => file.endsWith(".json") && file !== "manifest.json").sort((left, right) => {
  if (left === "nb-NO.json") return -1;
  if (right === "nb-NO.json") return 1;
  return left.localeCompare(right);
});
const dictionaries = await Promise.all(files.map(async (file) => [file, JSON.parse(await readFile(resolve(directory, file), "utf8"))]));
const [referenceFile, reference] = dictionaries[0];
const referenceKeys = Object.keys(reference).sort();

for (const [file, dictionary] of dictionaries) {
  const keys = Object.keys(dictionary).sort();
  const missing = referenceKeys.filter((key) => !(key in dictionary));
  const extra = keys.filter((key) => !(key in reference));
  if (missing.length || extra.length) {
    throw new Error(`${file} matcher ikke ${referenceFile}. Mangler: ${missing.join(", ") || "ingen"}. Ekstra: ${extra.join(", ") || "ingen"}.`);
  }
}

const manifest = dictionaries.map(([, dictionary]) => ({ code: dictionary["_meta.code"], name: dictionary["_meta.name"] }));
await writeFile(resolve(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write(`Kontrolleret ${dictionaries.length} sprogfiler med ${referenceKeys.length} ens nøgler og opdateret manifestet.\n`);
