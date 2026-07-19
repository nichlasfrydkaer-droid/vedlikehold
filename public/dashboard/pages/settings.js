import { loadDashboard } from "../services/dashboard.js";
import { buildJobcardMenuUrl, getJobcards, getJobcardSettings, saveJobcardSettings, getJobcardDocuments, uploadJobcardDocument, updateJobcardDocument, deleteJobcardDocument, getJobcardAssignments, saveJobcardAssignment, deleteJobcardAssignment, account } from "../js/api.js";
import { getCongregation, getUser } from "../js/session.js";
import { state } from "../js/state.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";
import { showToast } from "../components/toast.js";

const manualIntervals = [[1,"manualIntervalMonthly","Månedlig"],[2,"manualIntervalEveryTwoMonths","Hver 2. måned"],[3,"manualIntervalQuarterly","Hvert kvartal"],[6,"manualIntervalEverySixMonths","Hver 6. måned"],[12,"manualIntervalYearly","Årlig"],[24,"manualIntervalEveryTwoYears","Hvert 2. år"]];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
const icon = (name) => ({user:"<circle cx='12' cy='8' r='3'/><path d='M5 21c.8-3.6 3.2-5.5 7-5.5s6.2 1.9 7 5.5'/>",users:"<circle cx='9' cy='8' r='2.5'/><circle cx='17' cy='10' r='2'/><path d='M3.5 20c.7-3.4 2.8-5.2 5.5-5.2 2.8 0 4.9 1.8 5.6 5.2'/><path d='M14.5 15.5c2.6.1 4.5 1.6 5 4.5'/>",document:"<path d='M6 3h9l4 4v14H6z'/><path d='M15 3v5h5'/>",jobcard:"<rect x='4' y='3' width='16' height='18' rx='2'/><path d='M8 7h8M8 11h8M8 15h5'/>",edit:"<path d='m4 20 4.3-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.3 16 4 20z'/><path d='m13.8 7.5 3 3'/>",plus:"<path d='M12 5v14M5 12h14'/>",remove:"<path d='M5 7h14M10 11v5M14 11v5M9 7l1-3h4l1 3M7 7l1 14h8l1-14'/>",chevron:"<path d='m8 10 4 4 4-4'/>",eye:"<path d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z'/><circle cx='12' cy='12' r='2.75'/>",eyeOff:"<path d='M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.2 18.2 0 0 1-3.1 3.7M6.3 8.1A18.4 18.4 0 0 0 2 12s3.5 6 10 6a10.8 10.8 0 0 0 3.1-.5'/><path d='M9.9 9.9a3 3 0 0 0 4.2 4.2'/>"})[name];
const svg = (name) => `<svg viewBox='0 0 24 24' aria-hidden='true'>${icon(name)}</svg>`;

function section(id, title, description, symbol, content){
    return `<section class="settings-section" data-settings-section="${id}"><button class="settings-section-toggle" type="button" aria-expanded="false"><span class="settings-section-icon">${svg(symbol)}</span><span><strong>${title}</strong><small>${description}</small></span><span class="settings-section-chevron">${svg("chevron")}</span></button><div class="settings-section-content" hidden>${content}</div></section>`;
}

function intervalOptions(selected){ return manualIntervals.map(([months, key, fallback]) => `<option value="${months}" ${months === selected ? "selected" : ""}>${t(key, fallback)}</option>`).join(""); }
function executionMonthOptions(selectedMonth){
    const locale = document.documentElement.lang || "no";
    const formatter = new Intl.DateTimeFormat(locale,{month:"long",year:"numeric"});
    const selected = new Date(`${selectedMonth}-01T12:00:00`);
    const today = new Date();
    const current = new Date(today.getFullYear(),today.getMonth(),1,12);
    const first = Number.isNaN(selected.getTime()) || selected > current ? current : selected;
    return Array.from({length:121},(_,index) => {
        const date = new Date(first.getFullYear(),first.getMonth() + index,1,12);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}`;
        const label = formatter.format(date).replace(/^./,letter => letter.toUpperCase());
        return `<option value="${value}" ${value === selectedMonth ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
}
function presetRows(){ return [{key:"dc85",label:t("documentDc85","Sikker jobb-analyse (DC-85)")},{key:"dc85i",label:t("documentDc85i","Veiledning til DC-85 (DC-85i)")},{key:"dc82",label:t("documentDc82","Arbeid trygt sammen (DC-82)")}]; }

export async function initSettings(){
    const container = document.getElementById("settings");
    if(!container) return;
    const me = await loadDashboard();
    const congregation = getCongregation();
    const user = getUser();
    if(!me || (!me.success && !me.fallback) || !congregation || !user){
        container.innerHTML = `<section class="dashboard-card dashboard-full"><h2>${t("settings","Innstillinger")}</h2><p>${t("dashboardLoadFailed","Kunne ikke hente dashboarddata lige nu.")}</p></section>`;
        return;
    }
    const canManageAssignments = user.is_owner || ["owner", "admin"].includes(congregation.role);
    const [cardsResult, settingsResult, documentsResult, assignmentsResult] = await Promise.all([
        getJobcards(congregation),
        getJobcardSettings(congregation.id),
        getJobcardDocuments(congregation.id),
        canManageAssignments ? getJobcardAssignments(congregation.id) : Promise.resolve({ success:true, assignments:[] })
    ]);
    if(!cardsResult?.success || !settingsResult?.success || !documentsResult?.success || !assignmentsResult?.success){
        container.innerHTML = `<section class="dashboard-card dashboard-full"><h2>${t("settings","Innstillinger")}</h2><p>${t("jobcardsLoadFailed","Kunne ikke hente jobbkort.")}</p></section>`;
        return;
    }
    const jobcards = mergeJobcardSchedules(cardsResult.jobcards, settingsResult);
    let documents = documentsResult.documents || [];
    let assignments = assignmentsResult.assignments || [];

    const renderDocumentRows = () => {
        const rows = presetRows().map((preset) => ({ preset, document:documents.find((document) => document.presetKey === preset.key) }));
        const own = documents.filter((document) => !document.presetKey).map((document) => ({ document }));
        return [...rows, ...own].map(({preset, document}) => {
            const title = document?.label || preset.label;
            const scope = document ? (document.appliesToAll ? t("documentAllJobcards","Alle jobbkort") : t("documentSelectedJobcards","{count} valgte jobbkort").replace("{count}", document.jobcardIds.length)) : t("documentNoFile","Ingen fil valgt");
            return `<article class="settings-document-row"><span class="settings-document-icon">${svg("document")}</span><div class="settings-document-main"><strong>${escapeHtml(title)}</strong><small>${document ? escapeHtml(document.filename) : scope}</small>${document ? `<em>${scope}</em>` : ""}</div><div class="settings-document-actions"><button class="settings-icon-action" type="button" data-edit-document="${document?.id || ""}" data-edit-preset="${preset?.key || ""}" aria-label="${t("edit","Rediger")}" title="${t("edit","Rediger")}">${svg("edit")}</button>${document ? `<button class="settings-icon-action danger" type="button" data-remove-document="${document.id}" aria-label="${t("remove","Fjern")}" title="${t("remove","Fjern")}">${svg("remove")}</button>` : ""}</div></article>`;
        }).join("");
    };

    const documentsContent = () => `<div class="settings-section-intro"><div><h3>${t("jobcardDocumentsTitle","Vedlegg til jobbkort")}</h3><p>${t("jobcardDocumentsDescription","Last opp dokumenter som kan åpnes fra jobbkortets startside.")}</p></div></div><div class="settings-document-table" data-document-table>${renderDocumentRows()}</div><button class="settings-add-document" type="button" data-add-own-document>${svg("plus")}<span>${t("jobcardDocumentAdd","Legg til eget dokument")}</span></button>`;
    const assignmentInterval = (assignment) => assignment.auto_interval ? t("automatic","Automatisk") : t("manualIntervalMonths","Hver {count}. måned").replace("{count}", assignment.manual_interval_months);
    const assignmentRows = () => assignments.map((assignment) => `<article class="settings-assignment-row"><span class="settings-document-icon">${svg("user")}</span><div class="settings-assignment-main"><strong>${escapeHtml(t("jobcard","Jobbkort"))} ${escapeHtml(assignment.jobcard_number || assignment.jobcard_id)} · ${escapeHtml(assignment.jobcard_title || "")}</strong><small>${escapeHtml(t("responsible","Ansvarlig"))}: ${escapeHtml(assignment.responsible_name)}</small>${assignment.helper_name ? `<small>${escapeHtml(t("helper","Medhjelper"))}: ${escapeHtml(assignment.helper_name)}</small>` : ""}<em>${escapeHtml(assignmentInterval(assignment))} · ${escapeHtml(t("firstExecutionDeadline","Frist for første utførelse"))}: ${escapeHtml(assignment.first_execution_month)}${assignment.reminder_enabled ? ` · ${escapeHtml(t("assignmentReminderEnabled","Påminnelse aktiv"))}` : ""}</em></div><div class="settings-document-actions"><button class="settings-icon-action" type="button" data-edit-assignment="${escapeHtml(assignment.id)}" aria-label="${escapeHtml(t("edit","Rediger"))}">${svg("edit")}</button><button class="settings-icon-action danger" type="button" data-remove-assignment="${escapeHtml(assignment.id)}" aria-label="${escapeHtml(t("remove","Fjern"))}">${svg("remove")}</button></div></article>`).join("") || `<p class="settings-empty">${escapeHtml(t("noFixedAssignments","Ingen faste tildelinger ennå."))}</p>`;
    const assignmentsContent = () => `<div class="settings-section-intro"><div><h3>${t("fixedAssignments","Faste tildelinger")}</h3><p>${t("fixedAssignmentsDescription","Endre ansvarlig, medhjelper, intervall eller påminnelse for faste jobbkort.")}</p></div></div><div class="settings-assignment-table" data-assignment-table>${assignmentRows()}</div>`;
    const accountContent = () => `<div class="settings-account-grid"><form data-profile-form><label>${t("name","Navn")}<input class="dashboard-input" name="name" value="${escapeHtml(user.name)}" required maxlength="120"></label><label>${t("email","E-post")}<input class="dashboard-input" value="${escapeHtml(user.email)}" readonly aria-readonly="true"></label><button class="dashboard-button" type="submit">${t("save","Lagre")}</button></form><form data-password-form><h3>${t("changePassword","Endre adgangskode")}</h3><label>${t("currentPassword","Nåværende adgangskode")}<input class="dashboard-input" name="currentPassword" type="password" autocomplete="current-password" required></label><label>${t("newPassword","Ny adgangskode")}<input class="dashboard-input" name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="dashboard-button" type="submit">${t("saveNewPassword","Lagre ny adgangskode")}</button></form></div>`;
    const jobcardsContent = () => `<div class="dashboard-table-wrapper"><table class="dashboard-table settings-jobcard-table"><thead><tr><th>${t("title","Tittel")}</th><th>${t("jobcardSuggestedInterval","Foreslått intervall")}</th><th>${t("jobcardAutoInterval","Automatisk intervall")}</th><th>${t("jobcardManualInterval","Manuelt intervall")}</th><th>${t("requireSja","Krev SJA")}</th><th>${t("jobcardVisibility","Synlighet")}</th></tr></thead><tbody>${jobcards.map((jobcard) => `<tr data-jobcard-id="${escapeHtml(jobcard.id)}"><td><strong>${escapeHtml(jobcard.title)}</strong><div class="dashboard-table-muted">${t("jobcard","Jobbkort")} ${escapeHtml(jobcard.jobcard_number)}</div><a href="${buildJobcardMenuUrl(jobcard, congregation)}" target="_blank" rel="noopener noreferrer" class="dashboard-jobcard-link">${t("openJobcard","Åpne jobbkort")}</a></td><td>${escapeHtml(jobcard.interval || "-")}</td><td><label class="dashboard-switch"><input type="checkbox" data-auto-interval ${jobcard.autoInterval ? "checked" : ""}><span></span><span class="dashboard-switch-label">${jobcard.autoInterval ? t("automatic","Automatisk") : t("manual","Manuell")}</span></label></td><td><select class="dashboard-input" data-manual-interval ${jobcard.autoInterval ? "disabled" : ""}>${intervalOptions(jobcard.manualIntervalMonths || jobcard.intervalMonths || 12)}</select></td><td><label class="dashboard-switch settings-sja-switch"><input type="checkbox" data-require-sja ${jobcard.requireSja ? "checked" : ""}><span></span></label></td><td><button type="button" class="dashboard-icon-button" data-visibility aria-pressed="${jobcard.visible}" aria-label="${jobcard.visible ? t("jobcardVisible","Synlig") : t("jobcardHidden","Skjult")}">${svg(jobcard.visible ? "eye" : "eyeOff")}</button></td></tr>`).join("")}</tbody></table></div>`;

    container.innerHTML = `<div class="settings-page"><header class="settings-page-header"><h1>${t("settings","Innstillinger")}</h1><p>${t("settingsLandingDescription","Administrer innstillinger for konto og jobbkort.")}</p></header>${section("account",t("personalAccount","Personlig konto"),t("personalAccountDescription","Navn og adgangskode."),"user",accountContent())}${section("documents",t("jobcardDocumentsTitle","Vedlegg til jobbkort"),t("jobcardDocumentsShort","Dokumenter og knapper på jobbkort."),"document",documentsContent())}${canManageAssignments ? section("assignments",t("fixedAssignments","Faste tildelinger"),t("fixedAssignmentsShort","Ansvarlig, medhjelper og påminnelser."),"users",assignmentsContent()) : ""}${section("jobcards",t("jobcards","Jobbkort"),t("jobcardsSettingsShort","Intervall og synlighet."),"jobcard",jobcardsContent())}</div>`;

    const jobcardLabels = [t("title","Tittel"),t("jobcardSuggestedInterval","Foreslått intervall"),t("jobcardAutoInterval","Automatisk intervall"),t("jobcardManualInterval","Manuelt intervall"),t("requireSja","Krev SJA"),t("jobcardVisibility","Synlighet")];
    container.querySelectorAll(".settings-jobcard-table tbody tr").forEach((row) => row.querySelectorAll("td").forEach((cell, index) => { cell.dataset.label = jobcardLabels[index]; }));

    container.querySelectorAll(".settings-section-toggle").forEach((button) => button.addEventListener("click", () => {
        const content = button.parentElement.querySelector(".settings-section-content");
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open)); content.hidden = !open;
    }));
    const requestedSection = new URLSearchParams(location.search).get("section");
    const requestedSettingsSection = [...container.querySelectorAll("[data-settings-section]")].find((section) => section.dataset.settingsSection === requestedSection);
    if(requestedSettingsSection){
        const button = requestedSettingsSection.querySelector(".settings-section-toggle");
        const content = requestedSettingsSection.querySelector(".settings-section-content");
        button.setAttribute("aria-expanded","true"); content.hidden=false;
        requestAnimationFrame(() => requestedSettingsSection.scrollIntoView({block:"start",behavior:"smooth"}));
    }

    container.querySelector("[data-profile-form]").addEventListener("submit", async (event) => {
        event.preventDefault(); const name = new FormData(event.currentTarget).get("name").trim();
        const result = await account("update-profile", {name});
        if(!result?.success){ showToast(t("saveFailed","Kunne ikke lagre."),"error"); return; }
        state.user = {...state.user, name:result.user.name}; showToast(t("saved","Lagret")); setTimeout(() => location.reload(), 350);
    });
    container.querySelector("[data-password-form]").addEventListener("submit", async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const result = await account("change-password", {currentPassword:form.get("currentPassword"),password:form.get("password")});
        if(!result?.success){ showToast(result?.message || t("saveFailed","Kunne ikke lagre."),"error"); return; }
        event.currentTarget.reset(); showToast(t("passwordUpdated","Adgangskoden er oppdatert.")); setTimeout(() => { location.href = "/dashboard/login.html"; }, 900);
    });

    const refreshDocuments = () => { container.querySelector("[data-document-table]").innerHTML = renderDocumentRows(); };
    const refreshAssignments = () => { const table = container.querySelector("[data-assignment-table]"); if(table) table.innerHTML = assignmentRows(); };
    const openAssignmentModal = (assignment) => {
        const assignedJobcard = jobcards.find((jobcard) => String(jobcard.id) === String(assignment.jobcard_id));
        const automaticIntervalMonths = Number(assignedJobcard?.intervalMonths) || 12;
        const initialAutomatic = Number(assignment.auto_interval) !== 0;
        const dialog = document.createElement("div");
        dialog.className = "settings-document-backdrop";
        dialog.innerHTML = `<section class="settings-document-dialog" role="dialog" aria-modal="true"><button class="settings-dialog-close" type="button" data-close-assignment>×</button><h2>${escapeHtml(t("editFixedAssignment","Endre fast tildeling"))}</h2><form data-assignment-form><div class="settings-assignment-jobcard"><strong>${escapeHtml(t("jobcard","Jobbkort"))} ${escapeHtml(assignment.jobcard_number || assignment.jobcard_id)}</strong><span>${escapeHtml(assignment.jobcard_title || "")}</span></div><div class="settings-assignment-form-grid"><label>${escapeHtml(t("responsible","Ansvarlig"))}<input class="dashboard-input" name="responsible_name" maxlength="120" value="${escapeHtml(assignment.responsible_name)}" required></label><label>${escapeHtml(t("email","E-post"))}<input class="dashboard-input" name="responsible_email" type="email" value="${escapeHtml(assignment.responsible_email)}" required></label><label>${escapeHtml(t("helper","Medhjelper"))}<input class="dashboard-input" name="helper_name" maxlength="120" value="${escapeHtml(assignment.helper_name || "")}"></label><label>${escapeHtml(t("email","E-post"))}<input class="dashboard-input" name="helper_email" type="email" value="${escapeHtml(assignment.helper_email || "")}"></label></div><div class="settings-assignment-form-grid"><label class="dashboard-switch"><input name="auto_interval" type="checkbox" ${initialAutomatic ? "checked" : ""}><span></span><span class="dashboard-switch-label">${escapeHtml(initialAutomatic ? t("automatic","Automatisk") : t("manual","Manuell"))}</span></label><label>${escapeHtml(t("assignmentInterval","Intervall"))}<select class="dashboard-input" name="manual_interval_months" ${initialAutomatic ? "disabled" : ""}>${intervalOptions(Number(assignment.manual_interval_months || 12))}</select></label><label>${escapeHtml(t("firstExecutionDeadline","Frist for første utførelse"))}<select class="dashboard-input" name="first_execution_month" required>${executionMonthOptions(assignment.first_execution_month)}</select></label><label class="dashboard-check-row"><input name="reminder_enabled" type="checkbox" ${assignment.reminder_enabled ? "checked" : ""}><span>${escapeHtml(t("sendAssignmentReminder","Send påminnelse på e-post 30 dager før"))}</span></label></div><div class="settings-dialog-actions"><button class="dashboard-button dashboard-button-secondary" type="button" data-close-assignment>${escapeHtml(t("cancel","Avbryt"))}</button><button class="dashboard-button" type="submit">${escapeHtml(t("save","Lagre"))}</button></div></form></section>`;
        document.body.append(dialog);
        const close = () => dialog.remove();
        dialog.querySelectorAll("[data-close-assignment]").forEach((button) => button.addEventListener("click", close));
        dialog.addEventListener("click", (event) => { if(event.target === dialog) close(); });
        const auto = dialog.querySelector('[name="auto_interval"]'); const manual = dialog.querySelector('[name="manual_interval_months"]');
        let manualIntervalMonths = manual.value;
        auto.addEventListener("change", () => {
            if(auto.checked){ manualIntervalMonths = manual.value; manual.value=String(automaticIntervalMonths); }
            else { manual.value=manualIntervalMonths; }
            manual.disabled = auto.checked;
            dialog.querySelector(".dashboard-switch-label").textContent=auto.checked ? t("automatic","Automatisk") : t("manual","Manuell");
        });
        dialog.querySelector("[data-assignment-form]").addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await saveJobcardAssignment({ id:assignment.id, congregation_id:congregation.id, jobcard_id:assignment.jobcard_id, jobcard_number:assignment.jobcard_number, jobcard_title:assignment.jobcard_title, jobcard_url:assignment.jobcard_url, language:assignment.language, responsible_name:form.get("responsible_name"), responsible_email:form.get("responsible_email"), helper_name:form.get("helper_name"), helper_email:form.get("helper_email"), auto_interval:auto.checked, manual_interval_months:Number(manual.value), first_execution_month:form.get("first_execution_month"), reminder_enabled:form.get("reminder_enabled") === "on" }); if(!result?.success){showToast(result?.message || t("saveFailed","Kunne ikke lagre."),"error");return;} assignments = assignments.map((item) => item.id === assignment.id ? result.assignment : item); refreshAssignments(); close(); showToast(t("saved","Lagret")); });
    };
    const openDocumentModal = ({document = null, preset = null} = {}) => {
        const defaultLabel = document?.label || presetRows().find((item) => item.key === preset)?.label || "";
        const selected = new Set(document?.jobcardIds || []); const selectedScope = document ? !document.appliesToAll : false;
        window.document.body.insertAdjacentHTML("beforeend", `<div class="settings-document-backdrop" data-document-modal><section class="settings-document-dialog" role="dialog" aria-modal="true"><button type="button" class="settings-dialog-close" data-close-document-modal aria-label="${t("close","Lukk")}">×</button><h2>${document ? t("editDocument","Rediger dokument") : t("jobcardDocumentAdd","Legg til dokument")}</h2><form data-document-form><label>${t("jobcardDocumentLabel","Knappetekst")}<input class="dashboard-input" name="label" value="${escapeHtml(defaultLabel)}" required maxlength="160"></label><label>${t("jobcardDocumentFile","Fil")}<input class="dashboard-input" name="file" type="file" ${document ? "" : "required"}>${document ? `<small>${t("currentFile","Nåværende fil")}: ${escapeHtml(document.filename)}</small>` : ""}</label><fieldset class="settings-scope-cards"><legend>${t("jobcardDocumentVisibility","Vis dokumentet")}</legend><label class="${!selectedScope ? "selected" : ""}"><input type="radio" name="scope" value="all" ${!selectedScope ? "checked" : ""}><span>${t("jobcardDocumentAll","Ved alle jobbkort")}</span></label><label class="${selectedScope ? "selected" : ""}"><input type="radio" name="scope" value="selected" ${selectedScope ? "checked" : ""}><span>${t("jobcardDocumentSelected","Ved valgte jobbkort")}</span></label></fieldset><div class="settings-document-jobcards" data-document-jobcards ${selectedScope ? "" : "hidden"}>${jobcards.map((jobcard) => `<label><input type="checkbox" value="${escapeHtml(jobcard.id)}" ${selected.has(String(jobcard.id)) ? "checked" : ""}> ${t("jobcard","Jobbkort")} ${escapeHtml(jobcard.jobcard_number)} · ${escapeHtml(jobcard.title)}</label>`).join("")}</div><div class="settings-dialog-actions"><button type="button" class="dashboard-button dashboard-button-secondary" data-close-document-modal>${t("cancel","Avbryt")}</button><button class="dashboard-button" type="submit">${document ? t("save","Lagre") : t("upload","Last opp")}</button></div></form></section></div>`);
        const modal = window.document.querySelector("[data-document-modal]"); const close = () => modal.remove();
        modal.querySelectorAll("[data-close-document-modal]").forEach((button) => button.addEventListener("click",close)); modal.addEventListener("click",(event) => {if(event.target === modal) close();});
        modal.querySelectorAll('input[name="scope"]').forEach((input) => input.addEventListener("change", () => {const selectedMode = modal.querySelector('input[name="scope"]:checked').value === "selected"; modal.querySelector("[data-document-jobcards]").hidden = !selectedMode; modal.querySelectorAll(".settings-scope-cards label").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked));}));
        modal.querySelector("[data-document-form]").addEventListener("submit", async (event) => {event.preventDefault(); const form = event.currentTarget; const scopeSelected = form.elements.scope.value === "selected"; const file = form.elements.file.files[0]; const jobcardIds = [...modal.querySelectorAll("[data-document-jobcards] input:checked")].map((input) => input.value); const submit = form.querySelector('[type="submit"]'); submit.disabled = true; const data = {congregationId:congregation.id,label:form.elements.label.value.trim(),appliesToAll:!scopeSelected,jobcardIds,file}; const result = document ? await updateJobcardDocument({...data,id:document.id}) : await uploadJobcardDocument({...data,presetKey:preset}); submit.disabled = false; if(!result?.success){showToast(t("jobcardDocumentUploadFailed","Dokumentet kunne ikke lastes opp."),"error");return;} documents = document ? documents.map((item) => item.id === document.id ? result.document : item) : [...documents,result.document]; refreshDocuments();close();showToast(t("saved","Lagret"));});
    };
    container.addEventListener("click", async (event) => {
        const assignmentEdit = event.target.closest("[data-edit-assignment]");
        if(assignmentEdit){ const assignment = assignments.find((item) => item.id === assignmentEdit.dataset.editAssignment); if(assignment) openAssignmentModal(assignment); return; }
        const assignmentRemove = event.target.closest("[data-remove-assignment]");
        if(assignmentRemove){ if(!confirm(t("removeFixedAssignmentConfirm","Fjern denne faste tildelingen?"))) return; const result = await deleteJobcardAssignment(congregation.id, assignmentRemove.dataset.removeAssignment); if(!result?.success){showToast(result?.message || t("saveFailed","Kunne ikke lagre."),"error");return;} assignments = assignments.filter((item) => item.id !== assignmentRemove.dataset.removeAssignment); refreshAssignments(); showToast(t("saved","Lagret")); return; }
        const edit = event.target.closest("[data-edit-document], [data-edit-preset]");
        if(edit){ const document = documents.find((item) => item.id === edit.dataset.editDocument) || null; openDocumentModal({document,preset:edit.dataset.editPreset || null}); return; }
        if(event.target.closest("[data-add-own-document]")){openDocumentModal();return;}
        const remove = event.target.closest("[data-remove-document]"); if(!remove) return;
        if(!confirm(t("jobcardDocumentRemoveConfirm","Vil du fjerne dette dokumentet?"))) return;
        const result = await deleteJobcardDocument(congregation.id,remove.dataset.removeDocument); if(!result?.success){showToast(t("jobcardDocumentRemoveFailed","Dokumentet kunne ikke fjernes."),"error");return;} documents = documents.filter((item) => item.id !== remove.dataset.removeDocument); refreshDocuments();showToast(t("saved","Lagret"));
    });
    container.querySelectorAll("[data-jobcard-id]").forEach((row) => {
        const auto = row.querySelector("[data-auto-interval]"), manual = row.querySelector("[data-manual-interval]"), visibility = row.querySelector("[data-visibility]"), requireSja=row.querySelector("[data-require-sja]");
        const save = async () => {const result = await saveJobcardSettings({congregation_id:congregation.id,jobcard_id:row.dataset.jobcardId,visible:visibility.getAttribute("aria-pressed") === "true",auto_interval:auto.checked,manual_interval_months:Number(manual.value),require_sja:requireSja.checked}); if(!result?.success) showToast(t("saveFailed","Kunne ikke lagre."),"error");};
        auto.addEventListener("change",()=>{manual.disabled=auto.checked;row.querySelector(".dashboard-switch-label").textContent=auto.checked?t("automatic","Automatisk"):t("manual","Manuell");save();}); requireSja.addEventListener("change",()=>{const guide=documents.find(item=>item.presetKey==="dc85i");if(requireSja.checked&&!guide){requireSja.checked=false;showToast("Last opp Veiledning til DC-85 (DC-85i) før SJA aktiveres.","warning");return;}save();}); manual.addEventListener("change",save); visibility.addEventListener("click",()=>{const visible=visibility.getAttribute("aria-pressed")!=="true";visibility.setAttribute("aria-pressed",String(visible));visibility.innerHTML=svg(visible?"eye":"eyeOff");save();});
    });
}
