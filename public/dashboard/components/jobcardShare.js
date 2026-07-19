import { saveJobcardAssignment } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { t } from "../js/i18n.js";
import { showToast } from "./toast.js";

function escapeHtml(value){ return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function interpolate(key, fallback, values){ return Object.entries(values).reduce((text,[name,value]) => text.replaceAll(`{${name}}`,value), t(key,fallback)); }
function formatDeadline(value){ const date=new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(document.documentElement.lang || undefined,{day:"2-digit",month:"2-digit",year:"numeric"}); }
const manualIntervals = [[1,"manualIntervalMonthly","Månedlig"],[2,"manualIntervalEveryTwoMonths","Hver 2. måned"],[3,"manualIntervalQuarterly","Hvert kvartal"],[6,"manualIntervalEverySixMonths","Hver 6. måned"],[12,"manualIntervalYearly","Årlig"],[24,"manualIntervalEveryTwoYears","Hvert 2. år"]];

function intervalOptions(selected){
    return manualIntervals.map(([months,key,fallback]) => `<option value="${months}" ${Number(selected) === months ? "selected" : ""}>${escapeHtml(t(key,fallback))}</option>`).join("");
}

function executionMonthOptions(initialMonth){
    const locale = document.documentElement.lang || "no";
    const formatter = new Intl.DateTimeFormat(locale,{ month:"long", year:"numeric" });
    const first = new Date(`${initialMonth}-01T12:00:00`);
    return Array.from({ length:25 },(_,index) => {
        const date = new Date(first.getFullYear(),first.getMonth() + index,1,12);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}`;
        const label = formatter.format(date).replace(/^./,letter => letter.toUpperCase());
        return `<option value="${value}">${escapeHtml(label)}</option>`;
    }).join("");
}

function openShareDialog({ item, url, type }){
    const isTask = type === "task";
    const congregation = getCongregation();
    const canManageFixedAssignment = congregation && ["owner", "admin"].includes(congregation.role);
    const subject = interpolate(isTask ? "taskShareSubject" : "jobcardShareSubject", isTask ? "New task assigned: {title}" : "New job card assigned: {title}", {title:item.title});
    const body = interpolate(isTask ? "taskShareBody" : "jobcardShareBody", isTask ? "You have been assigned {title}.\n\nOpen the task: {link}\n\nRegards,\nMaintenance System" : "You have been assigned {title}.\n\nOpen the job card: {link}\n\nRegards,\nMaintenance System", {title:item.title,link:url});
    const linkLabel = t(isTask ? "taskLink" : "jobcardLink", isTask ? "Task link" : "Job card link");
    const taskEmailAction = isTask ? `<button type="button" class="dashboard-button dashboard-button-secondary" data-task-email>${escapeHtml(t("email","Email"))}</button>` : "";
    const initialMonth = new Date().toISOString().slice(0,7);
    const jobcardEmailFlow = isTask ? "" : `
        <section class="dashboard-share-email-flow" data-email-flow>
            <button type="button" class="dashboard-button dashboard-button-secondary" data-email>${escapeHtml(t("email","E-post"))}</button>
            <section class="dashboard-share-deadline" data-deadline hidden>
                <label>${escapeHtml(t("shareDeadline","Frist for utførelse"))}<input class="dashboard-input" type="date" data-deadline-input></label>
                <button type="button" class="dashboard-button" data-deadline-confirm disabled>${escapeHtml(t("confirmDeadline","Bekreft dato"))}</button>
            </section>
            ${canManageFixedAssignment ? `<section class="dashboard-fixed-assignment" data-fixed-assignment hidden>
                <label class="dashboard-check-row"><input type="checkbox" data-fixed-enabled> <span>${escapeHtml(t("assignJobcardPermanently","Tildel jobbkortet fast til personer"))}</span></label>
                <div class="dashboard-fixed-fields" data-fixed-fields hidden>
                    <h3>${escapeHtml(t("fixedAssignment","Fast tildeling"))}</h3>
                    <div class="dashboard-fixed-person-grid">
                        <label>${escapeHtml(t("responsible","Ansvarlig"))}<input class="dashboard-input" data-responsible-name maxlength="120" autocomplete="name" placeholder="${escapeHtml(t("name","Navn"))}"></label>
                        <label>${escapeHtml(t("email","E-post"))}<input class="dashboard-input" data-responsible-email type="email" maxlength="320" autocomplete="email" placeholder="example@example.com"></label>
                    </div>
                    <button type="button" class="dashboard-button dashboard-button-secondary dashboard-add-helper" data-add-helper><span aria-hidden="true">+</span> ${escapeHtml(t("addHelper","Legg til medhjelper"))}</button>
                    <div class="dashboard-fixed-person-grid" data-helper-fields hidden>
                        <label>${escapeHtml(t("helper","Medhjelper"))}<input class="dashboard-input" data-helper-name maxlength="120" autocomplete="name" placeholder="${escapeHtml(t("name","Navn"))}"></label>
                        <label>${escapeHtml(t("email","E-post"))}<input class="dashboard-input" data-helper-email type="email" maxlength="320" autocomplete="email" placeholder="example@example.com"></label>
                    </div>
                    <div class="dashboard-fixed-schedule-grid">
                        <label class="dashboard-switch"><input type="checkbox" data-assignment-auto checked><span></span><span class="dashboard-switch-label">${escapeHtml(t("automatic","Automatisk"))}</span></label>
                        <label>${escapeHtml(t("assignmentInterval","Intervall"))}<select class="dashboard-input" data-assignment-interval disabled>${intervalOptions(item.intervalMonths || 12)}</select></label>
                        <label class="dashboard-first-execution">${escapeHtml(t("firstExecutionDeadline","Frist for første utførelse"))}<select class="dashboard-input" data-first-execution required>${executionMonthOptions(initialMonth)}</select></label>
                    </div>
                    <label class="dashboard-check-row"><input type="checkbox" data-reminder-enabled> <span>${escapeHtml(t("sendAssignmentReminder","Send én påminnelse på e-post 30 dager før"))}</span></label>
                    <button type="button" class="dashboard-button dashboard-assignment-submit" data-assignment-submit>${escapeHtml(t("assignJobcard","Tildel jobbkort"))}</button>
                </div>
            </section>` : ""}
        </section>`;
    const dialog=document.createElement("div");
    dialog.className="dashboard-share-backdrop";
    dialog.innerHTML=`<section class="dashboard-share-dialog" role="dialog" aria-modal="true" aria-labelledby="shareTitle"><button type="button" class="dashboard-share-close" aria-label="${escapeHtml(t("close","Close"))}">×</button><h2 id="shareTitle">${escapeHtml(t(isTask ? "shareTask" : "shareJobcard", isTask ? "Share task" : "Share job card"))}</h2><p>${escapeHtml(item.title)}</p><input class="dashboard-input dashboard-share-url" value="${escapeHtml(url)}" readonly aria-label="${escapeHtml(linkLabel)}"><div class="dashboard-share-actions"><button type="button" class="dashboard-button" data-copy>${escapeHtml(t("copyLink","Copy link"))}</button>${taskEmailAction}</div>${jobcardEmailFlow}<img class="dashboard-share-qr" alt="${escapeHtml(t("qrCode","QR code"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}"></section>`;
    const close = () => dialog.remove();
    dialog.querySelector(".dashboard-share-close").addEventListener("click",close);
    dialog.addEventListener("click",event=>{ if(event.target === dialog) close(); });
    dialog.querySelector("[data-copy]").addEventListener("click",async event=>{ await navigator.clipboard.writeText(url); event.currentTarget.textContent=t("copied","Copied"); });
    if(isTask){
        dialog.querySelector("[data-task-email]").addEventListener("click",()=>{ const mailBody=`${body}\n\n${t("shareDeadline","Completion deadline")}: ${formatDeadline(item.deadline || "–")}`; location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`; });
    }else{
        const deadline=dialog.querySelector("[data-deadline]"), input=dialog.querySelector("[data-deadline-input]"), confirm=dialog.querySelector("[data-deadline-confirm]");
        const fixed=dialog.querySelector("[data-fixed-assignment]"), fixedEnabled=dialog.querySelector("[data-fixed-enabled]"), fixedFields=dialog.querySelector("[data-fixed-fields]");
        dialog.querySelector("[data-email]").addEventListener("click",()=>{ deadline.hidden=false; if(fixed) fixed.hidden=false; dialog.querySelector("[data-email-flow]").classList.add("is-open"); });
        input.addEventListener("input",()=>{ confirm.disabled=!input.value; });
        confirm.addEventListener("click",()=>{ const mailBody=`${body}\n\n${t("shareDeadline","Completion deadline")}: ${formatDeadline(input.value)}`; location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`; });
        if(!fixedEnabled){ document.body.append(dialog); return; }
        fixedEnabled.addEventListener("change",()=>{ fixedFields.hidden=!fixedEnabled.checked; deadline.hidden=fixedEnabled.checked; });
        const auto = dialog.querySelector("[data-assignment-auto]"), interval = dialog.querySelector("[data-assignment-interval]");
        auto.addEventListener("change",()=>{ interval.disabled=auto.checked; });
        dialog.querySelector("[data-add-helper]").addEventListener("click",event=>{ event.currentTarget.hidden=true; dialog.querySelector("[data-helper-fields]").hidden=false; });
        dialog.querySelector("[data-assignment-submit]").addEventListener("click",async event=>{
            const responsibleName=dialog.querySelector("[data-responsible-name]").value.trim();
            const responsibleEmail=dialog.querySelector("[data-responsible-email]").value.trim();
            const firstExecutionMonth=dialog.querySelector("[data-first-execution]").value;
            if(!responsibleName || !responsibleEmail || !firstExecutionMonth){ showToast(t("assignmentRequiredFields","Fyll ut navn, e-post og første utførelsesmåned."),"error"); return; }
            const button=event.currentTarget; button.disabled=true;
            const result=await saveJobcardAssignment({
                congregation_id:congregation.id,
                jobcard_id:item.id,
                jobcard_number:item.jobcard_number || item.id,
                jobcard_title:item.title,
                jobcard_url:url,
                language:(document.documentElement.lang || "no").slice(0,2),
                responsible_name:responsibleName,
                responsible_email:responsibleEmail,
                helper_name:dialog.querySelector("[data-helper-name]").value.trim(),
                helper_email:dialog.querySelector("[data-helper-email]").value.trim(),
                auto_interval:auto.checked,
                manual_interval_months:Number(interval.value),
                first_execution_month:firstExecutionMonth,
                reminder_enabled:dialog.querySelector("[data-reminder-enabled]").checked
            });
            button.disabled=false;
            if(!result?.success){ showToast(result?.message || t("saveFailed","Kunne ikke lagre."),"error"); return; }
            showToast(result.email_sent === false ? t("assignmentSavedEmailFailed","Tildelingen er lagret, men e-posten kunne ikke sendes.") : t("assignmentSaved","Jobbkortet er tildelt og e-post er sendt."), result.email_sent === false ? "warning" : "success");
            close();
        });
    }
    document.body.append(dialog);
}

export function openJobcardShareDialog(jobcard,url){ openShareDialog({item:jobcard,url,type:"jobcard"}); }
export function openTaskShareDialog(task,url){ openShareDialog({item:task,url,type:"task"}); }
