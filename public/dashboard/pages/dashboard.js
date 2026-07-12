import { loadDashboard } from "../services/dashboard.js";
import { renderDashboardHeader } from "../components/dashboardHeader.js";
import { renderDashboardMenu,initDashboardMenu } from "../components/dashboardMenu.js";
import { getJobcards,getJobcardSettings,getTasks,getReports,getActivity } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules, isUpcoming } from "../js/jobcardSchedule.js";
import { getTaskStatus,renderTaskStatus } from "../js/taskStatus.js";
import { t } from "../js/i18n.js";

const esc=value=>String(value == null ? "" : value).replace(/[&<'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"})[character]);
const fmt=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short"}):"–";
const monthName=date=>new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(date);
const urlFor=item=>item.type==="task"?`/dashboard/task.html?id=${encodeURIComponent(item.id)}`:"/dashboard/jobcards.html";

const activityVisuals={
  report_created:{icon:"report",tone:"report",label:"activityReportCompleted",fallback:"Jobbkort utført"},
  task_completed:{icon:"check",tone:"completed",label:"activityTaskCompleted",fallback:"Oppgave utført"},
  task_created:{icon:"plus",tone:"created",label:"activityTaskCreated",fallback:"Oppgave opprettet"},
  task_started:{icon:"play",tone:"started",label:"activityTaskStarted",fallback:"Oppgave startet"},
  task_reopened:{icon:"reopen",tone:"reopened",label:"activityTaskReopened",fallback:"Oppgave gjenåpnet"},
  task_updated:{icon:"edit",tone:"updated",label:"activityTaskUpdated",fallback:"Oppgave oppdatert"}
};
const activityIcon=name=>{
  const icons={report:`<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 14h6M9 18h5"/>`,check:`<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>`,plus:`<path d="M12 5v14M5 12h14"/>`,play:`<path d="m9 6 9 6-9 6z"/>`,reopen:`<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 5v5h5"/>`,edit:`<path d="m4 20 4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16z"/><path d="m13.5 7.5 3 3"/>`};
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.report}</svg>`;
};

export async function initDashboard(){
  const me=await loadDashboard(),root=document.getElementById("dashboard");
  if(!me||!root)return;
  root.innerHTML="";
  renderDashboardMenu(root);
  renderDashboardHeader(root);
  initDashboardMenu();
  root.insertAdjacentHTML("beforeend",'<div id="dashboardContent"></div>');
  const congregation=getCongregation();
  if(!congregation)return;
  const [cards,settings,tasksResult,reportsResult,activityResult]=await Promise.all([getJobcards(congregation),getJobcardSettings(congregation.id),getTasks(congregation.id),getReports(congregation.id),getActivity(congregation.id)]);
  const tasks=tasksResult && tasksResult.tasks || [];
  const reports=reportsResult && reportsResult.reports || [];
  const jobcards=cards && cards.success && settings && settings.success ? mergeJobcardSchedules(cards.jobcards,settings).filter(item=>item.visible):[];
  const upcomingTasks=tasks.filter(task=>["open","started"].includes(getTaskStatus(task))).sort((left,right)=>String(left.deadline).localeCompare(String(right.deadline)));
  const upcomingCards=jobcards.filter(isUpcoming).sort((left,right)=>String(left.nextExecution).localeCompare(String(right.nextExecution)));
  const activity=activityResult && activityResult.items || [];
  let shownMonth=new Date();shownMonth.setDate(1);let expanded=false;

  const monthSection=(title,items,type,limit)=>`<div class="dashboard-month-section"><h3>${title}</h3>${items.slice(0,limit).map(item=>`<a href="${urlFor({type,id:item.id})}"><time>${fmt(type==="task"?item.deadline:item.nextExecution)}</time><span>${esc(item.title)}</span>${type==="task"?renderTaskStatus(item):`<small>Jobbkort ${esc(item.jobcard_number)}</small>`}</a>`).join("")||`<p>Ingen planlagte ${title.toLowerCase()}.</p>`}</div>`;
  const listCard=(title,items,type,href)=>{const filteredHref=type==="task"?`${href}?filter=open`:`${href}?sort=dueDate`;return `<section class="dashboard-home-card"><header><h2>${title}</h2><a href="${filteredHref}">Se alle (${items.length})</a></header><div class="dashboard-simple-list">${items.slice(0,3).map(item=>`<a href="${urlFor({type,id:item.id})}"><span>${esc(item.title)}</span><small>${fmt(type==="task"?item.deadline:item.nextExecution)}</small></a>`).join("")||"<p>Ingen kommende elementer.</p>"}</div></section>`;};
  const activityRows=()=>activity.slice(0,5).map(item=>{const visual=activityVisuals[item.action]||{icon:"report",tone:"updated",label:"activityUpdated",fallback:"Oppdatert"};return `<a class="dashboard-activity-${visual.tone}" href="${esc(item.target_url||"#")}"><span class="dashboard-activity-icon">${activityIcon(visual.icon)}</span><span><strong>${esc(item.title||item.action)}</strong><small>${t(visual.label,visual.fallback)} · ${fmt(String(item.created_at||"").slice(0,10))}</small></span></a>`;}).join("")||"<p>Ingen aktivitet ennå.</p>";
  const render=()=>{
    const key=`${shownMonth.getFullYear()}-${String(shownMonth.getMonth()+1).padStart(2,"0")}`;
    const monthlyTasks=upcomingTasks.filter(item=>String(item.deadline||"").startsWith(key));
    const monthlyCards=upcomingCards.filter(item=>String(item.nextExecution||"").startsWith(key));
    const limit=expanded?999:3;
    const overdue=tasks.filter(item=>getTaskStatus(item)==="overdue").length;
    root.querySelector("#dashboardContent").innerHTML=`<main class="dashboard-home" id="dashboardContent"><section class="dashboard-stat-grid"><a href="/dashboard/tasks.html" class="dashboard-stat danger"><strong>${overdue}</strong><span>Overskredne oppgaver</span></a><a href="/dashboard/tasks.html" class="dashboard-stat"><strong>${tasks.filter(item=>getTaskStatus(item)==="open").length}</strong><span>Åpne oppgaver</span></a><a href="/dashboard/jobcards.html" class="dashboard-stat"><strong>${upcomingCards.length}</strong><span>Kommende jobbkort</span></a><a href="/dashboard/reports.html" class="dashboard-stat"><strong>${reports.filter(item=>String(item.finished_at||item.created_at||"").startsWith(key)).length}</strong><span>Rapporter denne måned</span></a></section><section class="dashboard-home-card dashboard-month-card"><header><button data-month="-1" aria-label="Forrige måned">‹</button><h2>Oppgaver for ${monthName(shownMonth)}</h2><button data-month="1" aria-label="Neste måned">›</button></header>${monthSection("Oppgaver",monthlyTasks,"task",limit)}${monthSection("Jobbkort",monthlyCards,"jobcard",limit)}${monthlyTasks.length+monthlyCards.length>6?`<button class="dashboard-expand" data-expand>${expanded?"Vis færre":"Vis alle"}</button>`:""}</section><div class="dashboard-two-column">${listCard("Kommende oppgaver",upcomingTasks,"task","/dashboard/tasks.html")}${listCard("Kommende jobbkort",upcomingCards,"jobcard","/dashboard/jobcards.html")}</div><section class="dashboard-home-card dashboard-activity-card"><header><h2>Aktivitet</h2><a href="#" aria-disabled="true">Se all aktivitet</a></header><div class="dashboard-activity-list">${activityRows()}</div></section></main>`;
    const labels=[t("overdueTasks","Overskredne oppgaver"),t("openTasks","Åpne oppgaver"),t("upcomingJobcards","Kommende jobbkort"),t("reportsThisMonth","Rapporter denne måned")];
    root.querySelectorAll(".dashboard-stat span").forEach((element,index)=>element.textContent=labels[index]);
    root.querySelector(".dashboard-month-card h2").textContent=t("tasksForMonth","Oppgaver for {month}").replace("{month}",monthName(shownMonth));
    root.querySelectorAll(".dashboard-month-section h3").forEach((element,index)=>element.textContent=index?t("jobcards","Jobbkort"):t("tasks","Oppgaver"));
    root.querySelectorAll(".dashboard-home-card h2").forEach(element=>{const labels={"Kommende oppgaver":t("upcomingTasks","Kommende oppgaver"),"Kommende jobbkort":t("upcomingJobcards","Kommende jobbkort"),"Aktivitet":t("activity","Aktivitet")};element.textContent=labels[element.textContent]||element.textContent;});
    root.querySelectorAll(".dashboard-expand").forEach(element=>element.textContent=expanded?t("showLess","Vis færre"):t("showAll","Vis alle"));
    root.querySelectorAll(".dashboard-simple-list p").forEach(element=>element.textContent=t("noUpcomingItems","Ingen kommende elementer."));
    root.querySelectorAll(".dashboard-month-section p").forEach((element,index)=>element.textContent=t("noPlanned","Ingen planlagte {items}.").replace("{items}",index?t("jobcards","jobbkort"):t("tasks","oppgaver")));
    root.querySelectorAll("[data-month]").forEach(button=>button.onclick=()=>{shownMonth.setMonth(shownMonth.getMonth()+Number(button.dataset.month));expanded=false;render();});
    const expandButton=root.querySelector("[data-expand]");
    if(expandButton) expandButton.addEventListener("click",()=>{expanded=!expanded;render();});
  };
  render();
}
