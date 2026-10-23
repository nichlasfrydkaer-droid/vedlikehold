import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root=new URL("../",import.meta.url).pathname;
const translations=JSON.parse(readFileSync(join(root,"public/dashboard/lang/da.json"),"utf8"));

function javascriptFiles(directory){
  return readdirSync(directory).flatMap(name=>{
    const path=join(directory,name);
    return statSync(path).isDirectory()?javascriptFiles(path):path.endsWith(".js")?[path]:[];
  });
}

test("every static dashboard translation key has a Danish value",()=>{
  const keys=new Set();
  for(const file of javascriptFiles(join(root,"public/dashboard"))){
    const source=readFileSync(file,"utf8");
    for(const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) keys.add(match[1]);
  }
  keys.delete("taskFilter"); // Prefix used to construct the five translated filter keys dynamically.
  assert.deepEqual([...keys].filter(key=>!(key in translations)).sort(),[]);
});

test("Danish translations do not contain common Norwegian UI wording",()=>{
  const norwegian=/\b(jobbkort|veiledning|arbeid|lagre|velg|bruker|utført|åpne|tilbake|krever|påminnelse|innstillinger|fullført|nåværende|avbryt|sjekkpunkter|opprettet)\b/i;
  const matches=Object.entries(translations).filter(([,value])=>typeof value==="string"&&norwegian.test(value));
  assert.deepEqual(matches,[]);
});
