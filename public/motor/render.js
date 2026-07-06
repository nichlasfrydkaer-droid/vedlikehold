import { state } from "./state.js";

export function renderTasks() {
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  state.currentJob.oppgaver.forEach(task => {

  const container =
    document.getElementById("taskContainer");
  container.innerHTML = "";
state.currentJob.oppgaver.forEach(task => {

// Gruppe med overskrift

if (

  typeof task === "object" &&

  (task.punkter || task.innhold)

) {

    const heading =
      document.createElement("h3");

    heading.className = "taskHeading";
    heading.innerText = task.overskrift;

  container.appendChild(heading);

if(task.innhold){

  task.innhold.forEach(item => {

    if(item.type === "tekst"){

      const tekst =
        document.createElement("div");

      tekst.style.margin = "10px 0";
      tekst.style.lineHeight = "1.5";

      tekst.innerHTML = item.tekst;

      container.appendChild(tekst);

    }

    if(item.type === "punkt"){

      const label =
        document.createElement("label");

      label.innerHTML =
        `<input type="checkbox" class="task" disabled> ${item.tekst}`;

      container.appendChild(label);

    }

  });

  });
}
