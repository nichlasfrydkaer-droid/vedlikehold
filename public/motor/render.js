import { state } from "./state.js";

export function renderTasks() {
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  state.currentJob.oppgaver.forEach(task => {
    renderTask(container, task);
  });
}

function renderTask(container, task) {

  // Gruppe med overskrift
  if (
    typeof task === "object" &&
    (task.punkter || task.innhold)
  ) {

    renderGroup(container, task);
    return;
  }

  // Ren tekst
  if (
    typeof task === "object" &&
    task.tekst
  ) {

    renderText(container, task.tekst);
    return;
  }

  // Almindelig checkbox
  renderCheckbox(container, task);

}

function renderGroup(container, task) {

  const heading = document.createElement("h3");
  heading.className = "taskHeading";
  heading.innerText = task.overskrift;
  container.appendChild(heading);

  if (task.innhold) {

    task.innhold.forEach(item => {

      if (item.type === "tekst") {
        renderText(container, item.tekst);
      }

      if (item.type === "punkt") {
        renderCheckbox(container, item.tekst);
      }

    });

  }

  if (task.tekst) {
    renderText(container, task.tekst, true);
  }

  if (task.punkter) {

    task.punkter.forEach(punkt => {
      renderCheckbox(container, punkt);
    });

  }

}

function renderText(container, text, bottomOnly = false) {

  const div = document.createElement("div");

  if (bottomOnly) {
    div.style.marginBottom = "10px";
  } else {
    div.style.margin = "10px 0";
  }

  div.style.lineHeight = "1.5";
  div.innerHTML = text;

  container.appendChild(div);

}

function renderCheckbox(container, text) {

  const label = document.createElement("label");

  label.innerHTML =
    `<input type="checkbox" class="task" disabled> ${text}`;

  container.appendChild(label);

}
