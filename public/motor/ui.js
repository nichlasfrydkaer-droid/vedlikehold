import { state } from "./state.js";
import { dom } from "./dom.js";
import { appendFormattedText } from "./utils.js";
import { jobcardSlug } from "../assets/jobcardIdentity.js";
import { jobcardPresentation } from "../assets/jobcardPresentation.js";

const t=(key,fallback)=>state.translations?.[key] || fallback;
const setMobileLabel=(button,label)=>{
  const text=String(label||"");
  button.dataset.mobileLabel=text;
  button.style.setProperty("--mobile-label-size",text.length>10?".46rem":text.length>8?".53rem":text.length>6?".59rem":".65rem");
};

export function updateTexts(){
  dom.startBtn.querySelector("span").textContent=t("startWork","Start arbeidet");
  dom.finishBtn.querySelector("span").textContent=t("finish","Ferdigmeld");
  setMobileLabel(dom.startBtn,t("mobileStart","START"));
  setMobileLabel(dom.finishBtn,t("mobileFinish","FULLFØR"));
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
  const presentation=jobcardPresentation(state.currentJob);
  dom.location.textContent=presentation.location;
  dom.locationBadge.hidden=!presentation.location;
  const params=new URLSearchParams(location.search);
  dom.backToMenu.href=`/jobbkort-menu.html?id=${encodeURIComponent(jobcardSlug(state.currentJob))}&jobcardKey=${encodeURIComponent(state.currentJob.key || state.currentJob.nummer)}&language=${encodeURIComponent(params.get("language") || "no")}&congregation=${encodeURIComponent(params.get("congregation") || "")}&congregationId=${encodeURIComponent(params.get("congregationId") || "")}`;
}

export function renderNotes(){
  const { notice }=jobcardPresentation(state.currentJob);
  if(notice){ dom.noticeSection.hidden=false; appendFormattedText(dom.merkText,notice); }
  else dom.noticeSection.hidden=true;
  appendFormattedText(dom.notatInfo,state.currentJob.notatInfo || "");
  dom.notatInfo.hidden=!state.currentJob.notatInfo;
}
