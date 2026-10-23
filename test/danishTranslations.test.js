import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { localeForLanguage } from "../public/dashboard/js/i18n.js";
import { formatExecutionMonth } from "../public/dashboard/js/jobcardSchedule.js";

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

test("annual overview job card dialog is translated in every supported language",()=>{
  const keys=["plannerJobcardInfo","plannerScheduledMonth","plannerStatus","plannerOverdueStatus","openJobcardDescription","shareJobcardDescription","manualApprovalCompleted"];
  for(const language of ["da","no","en"]){
    const values=JSON.parse(readFileSync(join(root,`public/dashboard/lang/${language}.json`),"utf8"));
    assert.deepEqual(keys.filter(key=>!values[key]),[],`${language} is missing planner dialog translations`);
  }
});

test("month names follow the selected dashboard language",()=>{
  assert.equal(localeForLanguage("da"),"da-DK");
  assert.equal(localeForLanguage("no"),"nb-NO");
  assert.equal(localeForLanguage("en"),"en-GB");
  assert.equal(formatExecutionMonth("2026-05",localeForLanguage("da")),"Maj 2026");
  assert.equal(formatExecutionMonth("2026-05",localeForLanguage("no")),"Mai 2026");
  assert.equal(formatExecutionMonth("2026-05",localeForLanguage("en")),"May 2026");
});

test("annual overview uses the standard share icon for job cards",()=>{
  const source=readFileSync(join(root,"public/dashboard/pages/planner.js"),"utf8");
  assert.match(source,/const shareIcon = `<svg[^`]+M12 3v12M8 7l4-4 4 4/);
  assert.match(source,/data-share-jobcard>[\s\S]*?\$\{shareIcon\}/);
});

test("annual overview uses a checked document icon to open job cards",()=>{
  const source=readFileSync(join(root,"public/dashboard/pages/planner.js"),"utf8");
  assert.match(source,/const openJobcardIcon = `<svg[^`]+M6 3h8l4 4v14H6z[^`]+m9 14 2 2 4-4/);
  assert.match(source,/href="\$\{esc\(jobcardUrl\)\}"[\s\S]*?\$\{openJobcardIcon\}/);
});
