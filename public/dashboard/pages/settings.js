import { loadDashboard } from "../services/dashboard.js";
import {
    buildJobcardMenuUrl,
    getJobcards,
    getJobcardSettings,
    saveJobcardSettings,
    getJobcardDocuments,
    uploadJobcardDocument,
    deleteJobcardDocument
} from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";
import { showToast } from "../components/toast.js";

function escapeHtml(value){
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
}

function eyeIcon(visible){
    return visible
        ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.75"/></svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.2 18.2 0 0 1-3.1 3.7M6.3 8.1A18.4 18.4 0 0 0 2 12s3.5 6 10 6a10.8 10.8 0 0 0 3.1-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
}

const manualIntervals = [
    [1, "manualIntervalMonthly", "Månedlig"],
    [2, "manualIntervalEveryTwoMonths", "Hver 2. måned"],
    [3, "manualIntervalQuarterly", "Hvert kvartal"],
    [6, "manualIntervalEverySixMonths", "Hver 6. måned"],
    [12, "manualIntervalYearly", "Årlig"],
    [24, "manualIntervalEveryTwoYears", "Hvert 2. år"]
];

function renderManualIntervalOptions(selectedMonths){
    return manualIntervals.map(([months, key, fallback]) => `
        <option value="${months}" ${months === selectedMonths ? "selected" : ""}>${t(key, fallback)}</option>
    `).join("");
}

export async function initSettings(){
    const container = document.getElementById("settings");

    if(!container){
        return;
    }

    const me = await loadDashboard();

    if(!me || (!me.success && !me.fallback)){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><h2>${t("settingsLandingTitle", "Indstillinger")}</h2><p>${t("dashboardLoadFailed", "Kunne ikke hente dashboarddata lige nu.")}</p></div>`;
        return;
    }

    const congregation = getCongregation();

    if(!congregation){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><h2>${t("settingsLandingTitle", "Indstillinger")}</h2><p>${t("noCongregationSelected", "Ingen menighed valgt.")}</p></div>`;
        return;
    }

    const [cardsResult, settingsResult, documentsResult] = await Promise.all([
        getJobcards(congregation),
        getJobcardSettings(congregation.id),
        getJobcardDocuments(congregation.id)
    ]);

    if(!cardsResult?.success || !settingsResult?.success || !documentsResult?.success){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><h2>${t("settingsLandingTitle", "Indstillinger")}</h2><p>${t("jobcardsLoadFailed", "Kunne ikke hente jobkort.")}</p></div>`;
        return;
    }

    const jobcards = mergeJobcardSchedules(cardsResult.jobcards, settingsResult);
    let documents = documentsResult.documents || [];

    const documentForm = () => `
        <div class="jobcard-document-create">
            <div class="jobcard-document-create-heading">
                <div><h3>${t("jobcardDocumentsTitle", "Vedlæg til jobkort")}</h3><p>${t("jobcardDocumentsDescription", "Upload dokumenter, der kan åbnes fra jobkortets startside.")}</p></div>
                <button type="button" class="dashboard-button" data-add-document>${t("jobcardDocumentAdd", "Upload eget dokument")}</button>
            </div>
            <div class="jobcard-document-presets">
                <button type="button" class="dashboard-button dashboard-button-secondary" data-add-document="${t("jobcardDocumentSja", "Sikker jobanalyse")}">${t("jobcardDocumentSja", "Sikker jobanalyse")}</button>
                <button type="button" class="dashboard-button dashboard-button-secondary" data-add-document="${t("jobcardDocumentDc85", "DC-85 Sikker jobanalyse")}">${t("jobcardDocumentDc85", "DC-85 Sikker jobanalyse")}</button>
                <button type="button" class="dashboard-button dashboard-button-secondary" data-add-document="${t("jobcardDocumentDc82", "DC-82 Arbeid trygt sammen")}">${t("jobcardDocumentDc82", "DC-82 Arbeid trygt sammen")}</button>
            </div>
            <div class="jobcard-document-list" data-document-list>${renderDocuments(documents)}</div>
        </div>`;

    const renderDocuments = (items) => items.length ? items.map((document) => `
        <div class="jobcard-document-row">
            <div class="jobcard-document-file"><strong>${escapeHtml(document.label)}</strong><span>${escapeHtml(document.filename)}</span></div>
            <button type="button" class="jobcard-document-remove" data-remove-document="${escapeHtml(document.id)}" aria-label="${t("remove", "Fjern")}" title="${t("remove", "Fjern")}">× <span>${t("remove", "Fjern")}</span></button>
        </div>`).join("") : `<p class="dashboard-table-muted">${t("jobcardDocumentsEmpty", "Der er endnu ikke vedlagt dokumenter.")}</p>`;

    const renderModal = (label = "") => `
        <div class="jobcard-document-modal-backdrop" data-document-modal>
            <section class="jobcard-document-modal" role="dialog" aria-modal="true" aria-labelledby="documentModalTitle">
                <button type="button" class="jobcard-document-close" data-close-document-modal aria-label="${t("close", "Luk")}">×</button>
                <h2 id="documentModalTitle">${t("jobcardDocumentAdd", "Upload eget dokument")}</h2>
                <form data-document-form>
                    <label>${t("jobcardDocumentLabel", "Knaptekst")}<input class="dashboard-input" name="label" required maxlength="160" value="${escapeHtml(label)}" placeholder="${t("jobcardDocumentLabelPlaceholder", "For eksempel: Sikker jobanalyse")}"></label>
                    <label>${t("jobcardDocumentFile", "Fil")}<input class="dashboard-input" name="file" type="file" required></label>
                    <fieldset class="jobcard-document-scope"><legend>${t("jobcardDocumentVisibility", "Vis dokumentet")}</legend>
                        <label><input type="radio" name="scope" value="all" checked> ${t("jobcardDocumentAll", "Ved alle jobkort")}</label>
                        <label><input type="radio" name="scope" value="selected"> ${t("jobcardDocumentSelected", "Ved valgte jobkort")}</label>
                    </fieldset>
                    <div class="jobcard-document-jobcards" data-document-jobcards hidden>${jobcards.map((jobcard) => `<label><input type="checkbox" value="${escapeHtml(jobcard.id)}"> ${t("jobcard", "Jobbkort")} ${escapeHtml(jobcard.jobcard_number)} · ${escapeHtml(jobcard.title)}</label>`).join("")}</div>
                    <div class="jobcard-document-actions"><button type="button" class="dashboard-button dashboard-button-secondary" data-close-document-modal>${t("cancel", "Annuller")}</button><button class="dashboard-button" type="submit">${t("upload", "Upload")}</button></div>
                </form>
            </section>
        </div>`;

    container.innerHTML = `
        <div class="dashboard-card dashboard-full">
            <h2>${t("settingsLandingTitle", "Indstillinger")}</h2>
            <p>${t("settingsLandingDescription", "Administrer indstillinger og jobkort for denne menighed.")}</p>
        </div>
        <div class="dashboard-card dashboard-full">
            <h3>${t("jobcards", "Jobbkort")}</h3>
            <div class="dashboard-table-wrapper"><table class="dashboard-table">
                <thead><tr>
                    <th>${t("title", "Titel")}</th>
                    <th>${t("jobcardSuggestedInterval", "Foreslået interval")}</th>
                    <th>${t("jobcardAutoInterval", "Automatisk interval")}</th>
                    <th>${t("jobcardManualInterval", "Manuelt interval")}</th>
                    <th>${t("jobcardVisibility", "Synlighed")}</th>
                </tr></thead>
                <tbody>${jobcards.map(jobcard => `
                    <tr data-jobcard-id="${jobcard.id}">
                        <td><strong>${jobcard.title}</strong>
                            <div class="dashboard-table-muted">${t("jobcard", "Jobbkort")} ${jobcard.jobcard_number}</div>
                            <a href="${buildJobcardMenuUrl(jobcard, congregation)}" target="_blank" rel="noopener noreferrer" class="dashboard-jobcard-link">${t("openJobcard", "Åbn jobkort")}</a>
                        </td>
                        <td>${jobcard.interval || "-"}</td>
                        <td><label class="dashboard-switch"><input type="checkbox" data-auto-interval ${jobcard.autoInterval ? "checked" : ""}><span></span><span class="dashboard-switch-label">${jobcard.autoInterval ? t("automatic", "Automatisk") : t("manual", "Manuel")}</span></label></td>
                        <td><select class="dashboard-input" data-manual-interval ${jobcard.autoInterval ? "disabled" : ""}>${renderManualIntervalOptions(jobcard.manualIntervalMonths || jobcard.intervalMonths || 12)}</select></td>
                        <td><button type="button" class="dashboard-icon-button" data-visibility aria-pressed="${jobcard.visible}" aria-label="${jobcard.visible ? t("jobcardVisible", "Synlig") : t("jobcardHidden", "Skjult")}" title="${jobcard.visible ? t("jobcardVisible", "Synlig") : t("jobcardHidden", "Skjult")}">${eyeIcon(jobcard.visible)}</button></td>
                    </tr>
                `).join("")}</tbody>
            </table></div>
        </div>
        <div class="dashboard-card dashboard-full">${documentForm()}</div>`;

    const refreshDocuments = () => {
        const list = container.querySelector("[data-document-list]");
        if(list) list.innerHTML = renderDocuments(documents);
    };

    const openDocumentModal = (label) => {
        document.body.insertAdjacentHTML("beforeend", renderModal(label));
        const modal = document.querySelector("[data-document-modal]");
        const close = () => modal?.remove();
        modal.querySelectorAll("[data-close-document-modal]").forEach((button) => button.addEventListener("click", close));
        modal.addEventListener("click", (event) => { if(event.target === modal) close(); });
        modal.querySelectorAll('input[name="scope"]').forEach((input) => input.addEventListener("change", () => {
            modal.querySelector("[data-document-jobcards]").hidden = modal.querySelector('input[name="scope"]:checked').value !== "selected";
        }));
        modal.querySelector("[data-document-form]").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const selectedScope = form.elements.scope.value === "selected";
            const file = form.elements.file.files[0];
            const selectedIds = [...modal.querySelectorAll("[data-document-jobcards] input:checked")].map((input) => input.value);
            const submit = form.querySelector('[type="submit"]');
            submit.disabled = true;
            const result = await uploadJobcardDocument({ congregationId:congregation.id, label:form.elements.label.value.trim(), appliesToAll:!selectedScope, jobcardIds:selectedIds, file });
            submit.disabled = false;
            if(!result?.success){ showToast(t("jobcardDocumentUploadFailed", "Dokumentet kunne ikke uploades."), "error"); return; }
            documents = [result.document, ...documents];
            refreshDocuments(); close(); showToast(t("saved", "Gemt"));
        });
    };

    container.querySelectorAll("[data-add-document]").forEach((button) => button.addEventListener("click", () => openDocumentModal(button.dataset.addDocument || "")));
    container.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-remove-document]");
        if(!button) return;
        if(!confirm(t("jobcardDocumentRemoveConfirm", "Vil du fjerne dette dokument?"))) return;
        button.disabled = true;
        const result = await deleteJobcardDocument(congregation.id, button.dataset.removeDocument);
        if(!result?.success){ button.disabled = false; showToast(t("jobcardDocumentRemoveFailed", "Dokumentet kunne ikke fjernes."), "error"); return; }
        documents = documents.filter((document) => document.id !== button.dataset.removeDocument);
        refreshDocuments(); showToast(t("saved", "Gemt"));
    });

    for(const row of container.querySelectorAll("[data-jobcard-id]")){
        const id = row.dataset.jobcardId;
        const autoInput = row.querySelector("[data-auto-interval]");
        const manualIntervalInput = row.querySelector("[data-manual-interval]");
        const visibilityButton = row.querySelector("[data-visibility]");

        const save = async () => {
            const visible = visibilityButton.getAttribute("aria-pressed") === "true";
            const result = await saveJobcardSettings({
                congregation_id: congregation.id,
                jobcard_id: id,
                visible,
                auto_interval: autoInput.checked,
                manual_interval_months: Number(manualIntervalInput.value)
            });
            if(!result?.success){
                console.error("Could not save jobcard settings", result);
            }
        };

        autoInput.addEventListener("change", () => {
            manualIntervalInput.disabled = autoInput.checked;
            row.querySelector(".dashboard-switch-label").textContent = autoInput.checked ? t("automatic", "Automatisk") : t("manual", "Manuel");
            save();
        });
        manualIntervalInput.addEventListener("change", save);
        visibilityButton.addEventListener("click", () => {
            const visible = visibilityButton.getAttribute("aria-pressed") !== "true";
            visibilityButton.setAttribute("aria-pressed", String(visible));
            visibilityButton.setAttribute("aria-label", visible ? t("jobcardVisible", "Synlig") : t("jobcardHidden", "Skjult"));
            visibilityButton.title = visibilityButton.getAttribute("aria-label");
            visibilityButton.innerHTML = eyeIcon(visible);
            save();
        });
    }
}
