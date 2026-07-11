import { loadDashboard } from "../services/dashboard.js";
import { getTasks } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { getTaskStatus } from "../js/taskStatus.js";
import { renderTaskCard } from "../components/taskCard.js";
import { t } from "../js/i18n.js";
import { openTaskShareDialog } from "../components/jobcardShare.js";

const filters=["all","open","started","overdue","completed"];
function sortTasks(tasks, filter){ return [...tasks].sort((a,b)=> filter === "all" ? String(b.created_at).localeCompare(String(a.created_at)) : filter === "completed" ? String(b.completed_at).localeCompare(String(a.completed_at)) : String(a.deadline||"9999").localeCompare(String(b.deadline||"9999"))); }
export async function initTasks(){
 const container=document.getElementById("tasks"); const me=await loadDashboard(); const congregation=getCongregation(); if(!container||!me||!congregation)return;
 const response=await getTasks(congregation.id); const tasks=response?.tasks||[]; let active=new URLSearchParams(location.search).get("filter"); if(!filters.includes(active))active="all";
 const render=()=>{const counts=Object.fromEntries(filters.map(filter=>[filter,filter==="all"?tasks.filter(task=>!task.deleted_at).length:tasks.filter(task=>getTaskStatus(task)===filter).length])); const shown=sortTasks(tasks.filter(task=>active==="all"?!task.deleted_at:getTaskStatus(task)===active),active); container.innerHTML=`<section class="dashboard-card dashboard-full task-toolbar"><h2>${t("tasks","Oppgaver")}</h2><div class="task-filters">${filters.map(filter=>`<button data-filter="${filter}" class="${active===filter?"active":""}">${t("taskFilter"+filter[0].toUpperCase()+filter.slice(1),filter)} (${counts[filter]||0})</button>`).join("")}</div></section><section class="task-list">${shown.map(renderTaskCard).join("")||`<p>${t("noTasks","Ingen oppgaver.")}</p>`}</section>`;
 container.querySelectorAll("[data-filter]").forEach(button=>button.onclick=()=>{active=button.dataset.filter;render();});
 container.querySelectorAll("[data-share]").forEach(button=>button.onclick=()=>{const task=tasks.find(item=>item.link_code===button.dataset.share);openTaskShareDialog(task,`${location.origin}/o.html?code=${button.dataset.share}`);});
 container.querySelectorAll("[data-reopen]").forEach(button=>button.onclick=()=>{location.href=`/dashboard/task.html?copy=${encodeURIComponent(button.dataset.reopen)}`;});}; render();
}
