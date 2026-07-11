import { loadDashboard } from "../services/dashboard.js";
import { getTask } from "../js/api.js";
import { t } from "../js/i18n.js";

const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
const formatDate=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"}):"–";
const successIcon=`<span class="task-created-success-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></svg></span>`;

export async function initTaskCreated(){
 const container=document.getElementById("task"),params=new URLSearchParams(location.search),id=params.get("id"),code=params.get("code");
 if(!(await loadDashboard())||!id||!code){container.innerHTML=`<section class="dashboard-card"><p>${t("taskNotFound","Oppdrag ikke funnet.")}</p></section>`;return;}
 const result=await getTask(id);if(!result?.success){container.innerHTML=`<section class="dashboard-card"><p>${t("taskNotFound","Oppdrag ikke funnet.")}</p></section>`;return;}
 const task=result.task,url=`${location.origin}/o.html?code=${encodeURIComponent(code)}`,mailSubject=t("taskShareSubject","Nytt oppdrag tildelt: {title}").replace("{title}",task.title),mailBody=t("taskShareBody","Du har fått tildelt {title}.\n\nÅpne oppdraget: {link}").replace("{title}",task.title).replace("{link}",url);
 container.innerHTML=`<section class="task-created-card"><div class="task-created-heading">${successIcon}<div><p>${t("taskCreated","Oppdrag opprettet")}</p><h1>${escapeHtml(task.title)}</h1><span>${t("dueBy","Skal utføres innen")}: <strong>${formatDate(task.deadline)}</strong></span></div></div><div class="task-created-share"><h2>Del oppdrag</h2><p>${t("taskCreatedText","Oppdraget er klart til å deles og utføres.")}</p><label>${t("taskLink","Oppgavelenke")}<input id="taskLink" value="${escapeHtml(url)}" readonly></label><div class="task-created-share-actions"><button class="dashboard-button" id="copyButton" type="button">${t("copyLink","Kopier lenke")}</button><a class="dashboard-button dashboard-button-secondary" href="mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}">${t("email","E-post")}</a></div><img class="task-created-qr" alt="${t("qrCode","QR-kode")}" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}"></div><div class="task-created-actions"><a class="dashboard-button" href="/dashboard/task.html?id=${encodeURIComponent(task.id)}">${t("openTask","Åpne oppdrag")}</a><a class="task-created-back" href="/dashboard/tasks.html">${t("backToTasks","Tilbake til oppgaver")}</a></div></section>`;
 container.querySelector("#copyButton").onclick=async event=>{await navigator.clipboard.writeText(url);event.currentTarget.textContent=t("copied","Kopiert");};
}
