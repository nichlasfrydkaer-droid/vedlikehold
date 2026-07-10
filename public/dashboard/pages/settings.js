import { loadDashboard } from "../services/dashboard.js";
import {
    buildJobcardMenuUrl,
    getJobcards,
    getJobcardSettings,
    saveJobcardSettings
} from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";

function eyeIcon(visible){
    return visible
        ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.75"/></svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.2 18.2 0 0 1-3.1 3.7M6.3 8.1A18.4 18.4 0 0 0 2 12s3.5 6 10 6a10.8 10.8 0 0 0 3.1-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
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

    const [cardsResult, settingsResult] = await Promise.all([
        getJobcards(congregation),
        getJobcardSettings(congregation.id)
    ]);

    if(!cardsResult?.success || !settingsResult?.success){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><h2>${t("settingsLandingTitle", "Indstillinger")}</h2><p>${t("jobcardsLoadFailed", "Kunne ikke hente jobkort.")}</p></div>`;
        return;
    }

    const jobcards = mergeJobcardSchedules(cardsResult.jobcards, settingsResult);

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
                    <th>${t("jobcardNextExecution", "Næste udførelse")}</th>
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
                        <td><input type="date" class="dashboard-input" data-next-execution value="${jobcard.nextExecution || ""}" ${jobcard.autoInterval ? "disabled" : ""}></td>
                        <td><button type="button" class="dashboard-icon-button" data-visibility aria-pressed="${jobcard.visible}" aria-label="${jobcard.visible ? t("jobcardVisible", "Synlig") : t("jobcardHidden", "Skjult")}" title="${jobcard.visible ? t("jobcardVisible", "Synlig") : t("jobcardHidden", "Skjult")}">${eyeIcon(jobcard.visible)}</button></td>
                    </tr>
                `).join("")}</tbody>
            </table></div>
        </div>`;

    for(const row of container.querySelectorAll("[data-jobcard-id]")){
        const id = row.dataset.jobcardId;
        const autoInput = row.querySelector("[data-auto-interval]");
        const nextInput = row.querySelector("[data-next-execution]");
        const visibilityButton = row.querySelector("[data-visibility]");

        const save = async () => {
            const visible = visibilityButton.getAttribute("aria-pressed") === "true";
            const result = await saveJobcardSettings({
                congregation_id: congregation.id,
                jobcard_id: id,
                visible,
                auto_interval: autoInput.checked,
                manual_next_execution: nextInput.value || null
            });
            if(!result?.success){
                console.error("Could not save jobcard settings", result);
            }
        };

        autoInput.addEventListener("change", () => {
            nextInput.disabled = autoInput.checked;
            row.querySelector(".dashboard-switch-label").textContent = autoInput.checked ? t("automatic", "Automatisk") : t("manual", "Manuel");
            save();
        });
        nextInput.addEventListener("change", save);
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
