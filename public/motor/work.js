import { state } from "./state.js";
import { dom } from "./dom.js";
import { startTimer } from "./timer.js";
import { scheduleDraftSave, saveDraft } from "./draft.js";

const t=(key,fallback)=>state.translations?.[key] || fallback;

export function setWorkState(){
  const active=state.started;
  const settings={allowPhotos:true,allowComments:true,showName:true,...(state.currentCongregation?.settings || {})};
  document.querySelectorAll(".task").forEach(task=>task.disabled=!active);
  if(settings.showName) dom.nameInput.disabled=!active;
  if(settings.allowComments) dom.notes.disabled=!active;
  if(settings.allowPhotos){ dom.photos.disabled=!active; dom.addPhotoLabel.classList.toggle("is-disabled",!active); }
  dom.startBtn.hidden=active;
  dom.finishBtn.hidden=!active;
  dom.nameInput.classList.toggle("is-invalid",active && !dom.nameInput.value.trim());
  dom.startHint.classList.toggle("is-started",active);
  dom.startHintTitle.textContent=t(active ? "workStarted" : "readyToStart",active ? "Arbeidet er startet" : "Klar til å starte");
  dom.startHintText.textContent=t(active ? "workStartedHelp" : "readyToStartHelp",active ? "Du kan nå fylle ut kontrollisten og rapporten." : "Trykk START nederst for å fylle ut kontrollisten og rapporten.");
}

export function startWork(){
  state.started=true;
  setWorkState();
  startTimer();
  void saveDraft();
}

function summaryIcon(name){
  const paths={check:`<path d="m5 12 4.5 4.5L19 7"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8"/>`,missing:`<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>`,photo:`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1"/><path d="m3 17 5-5 3.5 3.5 2.5-2.5 4 4"/>`};
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

export function openFinishConfirmation(){
  const name=dom.nameInput.value.trim();
  if(!name){ dom.nameInput.classList.add("is-invalid"); dom.nameInput.focus(); return; }
  dom.nameInput.classList.remove("is-invalid");
  const tasks=[...document.querySelectorAll(".task")],complete=tasks.filter(task=>task.checked).length,missing=tasks.length-complete;
  dom.finishModal.hidden=false;
  dom.modalSummary.hidden=false;
  dom.modalSending.hidden=true;
  dom.finishModalTitle.textContent=t("finishConfirmTitle","Klar til å sende?");
  dom.finishModalIntro.textContent=t("finishConfirmIntro","Se over opplysningene før rapporten sendes.");
  dom.finishSummary.innerHTML=`<span>${summaryIcon("check")}${(t("completedPoints","{count} punkter utført")).replace("{count}",complete)}</span><span>${summaryIcon("missing")}${(t("missingPoints","{count} punkter mangler")).replace("{count}",missing)}</span><span>${summaryIcon("photo")}${(t("photoCount","{count} bilder")).replace("{count}",state.selectedPhotos.length)}</span>`;
  dom.modalConfirm.textContent=t("confirm","Bekreft");
  dom.modalCancel.textContent=t("cancel","Angre");
  dom.modalConfirm.disabled=false;
  dom.modalCancel.disabled=false;
}

export function closeFinishConfirmation(){ if(!state.sending) dom.finishModal.hidden=true; }

export function showSending(){
  state.sending=true;
  dom.modalSummary.hidden=true;
  dom.modalSending.hidden=false;
  dom.sendingTitle.textContent=t("statusSending","Sender rapport…");
  dom.sendingText.textContent=t("doNotLeave","Ikke forlat siden.");
  dom.modalConfirm.disabled=true;
  dom.modalCancel.disabled=true;
}

export function showSendError(message){
  state.sending=false;
  dom.modalSummary.hidden=false;
  dom.modalSending.hidden=true;
  dom.finishModalIntro.textContent=message || t("statusError","Feil ved sending. Arbeidet ditt er fortsatt lagret.");
  dom.modalConfirm.textContent=t("retry","Prøv igjen");
  dom.modalConfirm.disabled=false;
  dom.modalCancel.disabled=false;
  scheduleDraftSave();
}
