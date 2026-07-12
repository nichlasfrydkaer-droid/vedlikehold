import { state } from "./state.js";
import { dom } from "./dom.js";
import { scheduleDraftSave } from "./draft.js";
import { appendFormattedText } from "./utils.js";

export function renderTasks(){
  const container = dom.taskContainer;
  container.innerHTML = "";
  state.currentJob.oppgaver.forEach(task=>renderTask(container,task));
  document.querySelectorAll(".task").forEach(task=>task.addEventListener("change",()=>{
    task.closest(".work-check-row")?.classList.toggle("is-complete",task.checked);
    renderProgress();
    scheduleDraftSave();
  }));
  renderProgress();
}

function renderTask(container,task){
  if(typeof task === "object" && (task.punkter || task.innhold)) return renderGroup(container,task);
  if(typeof task === "object" && task.tekst) return renderText(container,task.tekst);
  renderCheckbox(container,task);
}

function renderGroup(container,task){
  if(task.overskrift){ const heading=document.createElement("h3"); heading.className="taskHeading"; appendFormattedText(heading,task.overskrift); container.appendChild(heading); }
  task.innhold?.forEach(item=>item.type === "punkt" ? renderCheckbox(container,item.tekst) : item.type === "tekst" ? renderText(container,item.tekst) : null);
  if(task.tekst) renderText(container,task.tekst);
  task.punkter?.forEach(item=>renderCheckbox(container,item));
}

function renderText(container,text){
  const element=document.createElement("p");
  element.className="taskText";
  appendFormattedText(element,text);
  container.appendChild(element);
}

function renderCheckbox(container,text){
  const label=document.createElement("label");
  label.className="work-check-row";
  const input=document.createElement("input");
  input.type="checkbox";
  input.className="task";
  input.disabled=true;
  const copy=document.createElement("span");
  appendFormattedText(copy,text);
  label.append(input,copy);
  container.appendChild(label);
}

export function renderProgress(){
  const tasks=[...document.querySelectorAll(".task")];
  const done=tasks.filter(task=>task.checked).length;
  const total=tasks.length;
  const percent=total ? Math.round((done/total)*100) : 0;
  const noun=state.translations?.points || "punkter";
  dom.checklistCount.textContent=`${total} ${noun}`;
  dom.progressText.textContent=(state.translations?.progressCount || "{done} av {total} punkter").replace("{done}",done).replace("{total}",total);
  dom.progressPercent.textContent=`${percent} %`;
  dom.progressBar.style.width=`${percent}%`;
}
