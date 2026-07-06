import { state } from "./state.js";
import { dom } from "./dom.js";

export function startTimer(){

  state.startTime = Date.now();

  state.timerInterval = setInterval(()=>{

    const diff = Date.now() - state.startTime;

    const h =
      Math.floor(diff / 3600000);

    const m =
      Math.floor((diff % 3600000) / 60000);

    const s =
      Math.floor((diff % 60000) / 1000);

    dom.timeInput.value =
      String(h).padStart(2,"0") + ":" +
      String(m).padStart(2,"0") + ":" +
      String(s).padStart(2,"0");

  },1000);

}

export function stopTimer(){

  clearInterval(state.timerInterval);

}
