import { t } from "../js/i18n.js";

function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");}
function interpolate(key,fallback,values){return Object.entries(values).reduce((text,[name,value])=>text.replaceAll(`{${name}}`,value),t(key,fallback));}
function formatDeadline(value){const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?value:date.toLocaleDateString(document.documentElement.lang||undefined,{day:"2-digit",month:"2-digit",year:"numeric"});}

function openShareDialog({item,url,type}){
    const isTask=type==="task";
    const subject=interpolate(isTask?"taskShareSubject":"jobcardShareSubject",isTask?"New task assigned: {title}":"New job card assigned: {title}",{title:item.title});
    const body=interpolate(isTask?"taskShareBody":"jobcardShareBody",isTask?"You have been assigned {title}.\n\nOpen the task: {link}\n\nRegards,\nMaintenance System":"You have been assigned {title}.\n\nOpen the job card: {link}\n\nRegards,\nMaintenance System",{title:item.title,link:url});
    const linkLabel=t(isTask?"taskLink":"jobcardLink",isTask?"Task link":"Job card link");
    const dialog=document.createElement("div");
    dialog.className="dashboard-share-backdrop";
    dialog.innerHTML=`<section class="dashboard-share-dialog" role="dialog" aria-modal="true" aria-labelledby="shareTitle"><button type="button" class="dashboard-share-close" aria-label="${escapeHtml(t("close","Close"))}">×</button><h2 id="shareTitle">${escapeHtml(t(isTask?"shareTask":"shareJobcard",isTask?"Share task":"Share job card"))}</h2><p>${escapeHtml(item.title)}</p><input class="dashboard-input dashboard-share-url" value="${escapeHtml(url)}" readonly aria-label="${escapeHtml(linkLabel)}"><div class="dashboard-share-actions"><button type="button" class="dashboard-button" data-copy>${escapeHtml(t("copyLink","Copy link"))}</button></div><section class="dashboard-share-email-flow" data-email-flow><button type="button" class="dashboard-button dashboard-button-secondary" data-email>${escapeHtml(t("email","Email"))}</button><section class="dashboard-share-deadline" data-deadline hidden><label>${escapeHtml(t("shareDeadline","Completion deadline"))}<input class="dashboard-input" type="date" data-deadline-input></label><button type="button" class="dashboard-button" data-deadline-confirm disabled>${escapeHtml(t("confirmDeadline","Confirm date"))}</button></section></section><img class="dashboard-share-qr" alt="${escapeHtml(t("qrCode","QR code"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}"></section>`;
    const close=()=>dialog.remove();
    dialog.querySelector(".dashboard-share-close").addEventListener("click",close);
    dialog.addEventListener("click",event=>{if(event.target===dialog)close();});
    dialog.querySelector("[data-copy]").addEventListener("click",async event=>{await navigator.clipboard.writeText(url);event.currentTarget.textContent=t("copied","Copied");});
    const deadline=dialog.querySelector("[data-deadline]"),input=dialog.querySelector("[data-deadline-input]"),confirm=dialog.querySelector("[data-deadline-confirm]");
    dialog.querySelector("[data-email]").addEventListener("click",()=>{deadline.hidden=false;dialog.querySelector("[data-email-flow]").classList.add("is-open");input.focus();});
    input.addEventListener("input",()=>{confirm.disabled=!input.value;});
    confirm.addEventListener("click",()=>{const mailBody=`${body}\n\n${t("shareDeadline","Completion deadline")}: ${formatDeadline(input.value)}`;location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;});
    document.body.append(dialog);
}

export function openJobcardShareDialog(jobcard,url){openShareDialog({item:jobcard,url,type:"jobcard"});}
export function openTaskShareDialog(task,url){openShareDialog({item:task,url,type:"task"});}
