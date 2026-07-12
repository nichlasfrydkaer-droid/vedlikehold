import { state } from "./state.js";
import { dom } from "./dom.js";
import { appendFormattedText } from "./utils.js";

const t=(key,fallback)=>state.translations?.[key] || fallback;

export function updateTexts(){
  dom.startBtn.querySelector("span").textContent=t("startWork","Start arbeidet");
  dom.finishBtn.querySelector("span").textContent=t("finish","Ferdigmeld");
  dom.startBtn.dataset.mobileLabel=t("mobileStart","START");
  dom.finishBtn.dataset.mobileLabel=t("mobileFinish","FULLFØR");
  dom.frequency.textContent="";
  dom.timeLabel.textContent=t("timeUsed","Tid brukt");
  dom.nameLabel.textContent=t("name","Navn");
  dom.checklistLabel.textContent=t("checklist","Kontrolliste");
  dom.notesLabel.textContent=t("notes","Notater");
  dom.photosLabel.textContent=t("photos","Bilder");
  dom.addPhotoText.textContent=t("addPhoto","Legg til bilde");
  dom.progressLabel.textContent=t("progress","Fremdrift");
  dom.noticeLabel.textContent=t("important","Viktig");
}

export function renderHeader(){
  const jobCard=t("jobCard","Jobbkort");
  document.title=`${jobCard} ${state.currentJob.nummer}`;
  document.getElementById("appleAppTitle").setAttribute("content",jobCard);
  dom.topJobNumber.textContent=`${jobCard} ${state.currentJob.nummer}`;
  dom.jobNumber.textContent=`${jobCard} ${state.currentJob.nummer}`;
  dom.title.textContent=state.currentJob.titel;
  dom.subtitle.textContent=state.currentJob.undertittel || "";
  dom.subtitle.hidden=!state.currentJob.undertittel;
  dom.frequency.textContent=state.currentJob.frekvens || "";
  const params=new URLSearchParams(location.search);
  dom.backToMenu.href=`/jobbkort-menu.html?id=${encodeURIComponent(state.currentJob.nummer)}&language=${encodeURIComponent(params.get("language") || "no")}&congregation=${encodeURIComponent(params.get("congregation") || "")}`;
}

export function renderNotes(){
  if(state.currentJob.merk){ dom.noticeSection.hidden=false; appendFormattedText(dom.merkText,state.currentJob.merk); }
  else dom.noticeSection.hidden=true;
  appendFormattedText(dom.notatInfo,state.currentJob.notatInfo || "");
  dom.notatInfo.hidden=!state.currentJob.notatInfo;
}
