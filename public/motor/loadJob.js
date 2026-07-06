import { state } from "./state.js";
import { dom } from "./dom.js";
import { fitJobTitle } from "./title.js";
import { renderTasks } from "./render.js";

export async function loadJob() {
const params =
  new URLSearchParams(window.location.search);

const id =
  params.get("id") || "41";

const congregationId =
  params.get("congregation");
  state.currentCongregation =
  JSON.parse(
    localStorage.getItem(
      "congregationData"
    )
  );

let language =
  state.currentCongregation?.language || "no";

let response =
  await fetch(`/jobdata/${language}/${id}.json`);

if(!response.ok){

  throw new Error("Kunne ikke indlæse jobbkort.");

}

state.currentJob =
  await response.json();

console.log("Language:", language);
console.log("URL:", `/lang/${language}.json`);
    
let languageResponse =
  await fetch(`/lang/${language}.json`);

if(!languageResponse.ok){

  languageResponse =

    await fetch("/lang/no.json");

}

if(!languageResponse.ok){

  throw new Error("Kunne ikke indlæse sprogfil.");

}

state.translations =

  await languageResponse.json();
dom.startBtn.innerHTML =
  state.translations?.startWork || "▶ Start arbeidet";

dom.finishBtn.innerHTML =
  state.translations?.finish || "✓ Ferdigmeld";

document.getElementById("frequencyLabel").innerText =
  (state.translations?.frequency || "Frekvens") + ":";

document.getElementById("timeLabel").innerText =
  state.translations?.timeUsed || "Tid brukt";

document.getElementById("nameLabel").innerText =
  state.translations?.name || "Navn";

document.getElementById("checklistLabel").innerText =
  state.translations?.checklist || "Kontrolliste";

document.getElementById("notesLabel").innerText =
  state.translations?.notes || "Notater";

document.getElementById("photosLabel").innerText =
  state.translations?.photos || "Bilder";

document.title =
  `${state.translations.jobCard} ${state.currentJob.nummer}`;
document
  .getElementById("appleAppTitle")
  .setAttribute(
    "content",
    state.translations.jobCard
  );

document.getElementById("jobTitle").innerText =
  `${state.translations.jobCard} ${state.currentJob.nummer} - ${state.currentJob.titel.toUpperCase()}`;

if(state.currentJob.undertittel){

  document.getElementById("jobSubtitle").innerText =
    state.currentJob.undertittel;

  if(state.currentCongregation){

  const info =
    document.createElement("div");

  info.style.marginBottom = "15px";
  info.style.padding = "10px";
  info.style.background = "#eef6ff";
  info.style.borderLeft = "4px solid #2563eb";
  info.style.borderRadius = "6px";

info.innerHTML =
  `<strong>${state.translations?.congregation || "Menighed"}:</strong> ${state.currentCongregation.name}`;

  document
    .getElementById("jobSubtitle")
    .after(info);

}

}else{

  document.getElementById("jobSubtitle").style.display =
    "none";

}
  
  document.getElementById("frequency").innerText =
    state.currentJob.frekvens;
if(state.currentJob.merk){

  const noticeText =
    state.translations?.notice || "MERK";

  document.getElementById("merkText").innerHTML =
    `<strong>${noticeText}:</strong> ${state.currentJob.merk}`;

}else{

  document.getElementById("merkText").style.display="none";

}
const notatInfoElement =
  document.getElementById("notatInfo");

if(state.currentJob.notatInfo){

  notatInfoElement.innerText =
    state.currentJob.notatInfo;

}else{

  notatInfoElement.style.display = "none";

}
