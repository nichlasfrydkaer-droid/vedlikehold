import { state } from "./state.js";
import { dom } from "./dom.js";
import { scheduleDraftSave } from "./draft.js";

export function updateTimer(){
  if(!state.startTime){
    dom.timeInput.textContent=state.translations?.notStarted || "Ikke startet";
    return;
  }
  const seconds=Math.max(0,Math.floor((Date.now()-(state.startTime || Date.now()))/1000));
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;
  dom.timeInput.textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export function startTimer(){
  if(!state.startTime) state.startTime=Date.now();
  clearInterval(state.timerInterval);
  updateTimer();
  state.timerInterval=setInterval(updateTimer,1000);
  scheduleDraftSave();
}

export function stopTimer(){
  clearInterval(state.timerInterval);
  state.timerInterval=null;
  updateTimer();
}
