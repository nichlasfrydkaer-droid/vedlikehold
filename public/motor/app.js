import { loadJob } from "./loadJob.js";
import { initPhotos, autoResizeNotes, initDraftInputs, renderPreview, resizeNotes } from "./photos.js";
import { initTitle } from "./title.js";
import { buildReport } from "./report.js";
import { uploadReport } from "./upload.js";
import { startWork, setWorkState, openFinishConfirmation, closeFinishConfirmation } from "./work.js";
import { state } from "./state.js";
import { dom } from "./dom.js";
import { createDraftKey, clearExpiredDrafts, loadDraft, saveDraft } from "./draft.js";
import { startTimer, updateTimer } from "./timer.js";
import { renderProgress } from "./render.js";

async function restoreDraft(){
  state.draftKey=createDraftKey();
  await clearExpiredDrafts();
  const draft=await loadDraft();
  if(!draft) return;
  state.started=Boolean(draft.started);
  state.startTime=draft.startTime || null;
  dom.nameInput.value=draft.name || "";
  dom.notes.value=draft.notes || "";
  [...document.querySelectorAll(".task")].forEach((task,index)=>{task.checked=Boolean(draft.checked?.[index]);task.closest(".work-check-row")?.classList.toggle("is-complete",task.checked);});
  state.selectedPhotos=(draft.photos || []).map(photo=>new File([photo.blob],photo.name || "bilde.jpg",{type:photo.type || photo.blob?.type || "image/jpeg",lastModified:photo.lastModified || Date.now()}));
  renderPreview();
  setWorkState();
  renderProgress();
  if(state.started && state.startTime) startTimer(); else updateTimer();
  resizeNotes();
}

export async function initApp(){
  initTitle();
  initPhotos();
  initDraftInputs();
  autoResizeNotes();
  dom.startBtn.addEventListener("click",startWork);
  dom.finishBtn.addEventListener("click",openFinishConfirmation);
  dom.modalCancel.addEventListener("click",closeFinishConfirmation);
  dom.finishModal.addEventListener("click",event=>{if(event.target === dom.finishModal) closeFinishConfirmation();});
  dom.modalConfirm.addEventListener("click",()=>{void uploadReport(buildReport());});
  dom.backToMenu.addEventListener("click",async event=>{event.preventDefault();await saveDraft();location.href=dom.backToMenu.href;});
  window.addEventListener("pagehide",()=>{ void saveDraft(); });
  try{
    await loadJob();
    await restoreDraft();
    setWorkState();
    updateTimer();
  }catch(error){
    console.error("Could not load job card",error);
    dom.title.textContent="Kunne ikke laste jobbkortet.";
    dom.status.textContent="Kontroller at lenken inneholder et gyldig jobbkortnummer.";
    dom.startBtn.hidden=true;
  }
}
