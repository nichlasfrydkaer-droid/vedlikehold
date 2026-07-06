import { state } from "./state.js";

export function renderTasks() {
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  state.currentJob.oppgaver.forEach(task => {

    // ... hele den store forEach-blok ...

  });
}
