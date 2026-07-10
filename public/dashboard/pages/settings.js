import { loadDashboard } from "../services/dashboard.js";
import { buildJobcardMenuUrl, getJobcards } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { t } from "../js/i18n.js";
import {
    getEnabledJobcardIds,
    setEnabledJobcardIds,
    getVisibleJobcards
} from "../js/jobcardVisibility.js";

export async function initSettings(){

    const me = await loadDashboard();

    if(!me){

        return;

    }

    const container = document.getElementById("settings");

    if(!container){

        return;

    }

    const congregation = getCongregation();

    if(!congregation){

        container.innerHTML = `

            <div class="dashboard-card dashboard-full">

                <h2>${t("settingsLandingTitle", "Indstillinger")}</h2>

                <p>${t("noCongregationSelected", "Ingen menighet valgt.")}</p>

            </div>

        `;

        return;

    }

    const result = await getJobcards(congregation.id);

    let jobcards = [];
    let loadError = "";

    if(Array.isArray(result)){

        jobcards = result;

    }else if(result?.success && Array.isArray(result.jobcards)){

        jobcards = result.jobcards;

    }else if(result?.jobcards){

        jobcards = result.jobcards;

    }else if(typeof result === "string"){

        loadError = result;

    }else if(result?.error){

        loadError = result.error;

    }else if(result?.message){

        loadError = result.message;

    }else {

        loadError = "Worker OK";

    }

    const enabledIds = new Set(getEnabledJobcardIds(congregation.id, jobcards));
    const visibleJobcards = getVisibleJobcards(congregation.id, jobcards);

    container.innerHTML = `

        <div class="dashboard-card dashboard-full">

            <h2>${t("settingsLandingTitle", "Indstillinger")}</h2>

            <p>${t("settingsLandingDescription", "Administrer innstillinger og jobbkort for denne menigheten.")}</p>

        </div>

        <div class="dashboard-card dashboard-full">

            <h3>${t("jobcards", "Jobbkort")}</h3>

            ${loadError ? `<p style="color: #b91c1c;">${loadError}</p>` : ""}

            ${jobcards.length === 0 ? `<p>${t("noJobcards", "Ingen jobbkort tilgjengelig for denne menigheten.")}</p>` : `

                <div class="dashboard-table-wrapper">

                    <table class="dashboard-table">

                        <thead>

                            <tr>

                                <th>${t("title", "Titel")}</th>

                                <th>${t("jobcardSuggestedInterval", "Foreslått intervall")}</th>

                                <th>${t("jobcardNextExecution", "Neste utførelse")}</th>

                                <th>${t("jobcardVisibility", "Synlighet")}</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${jobcards.map(jobcard => `

                                <tr>

                                    <td>

                                        <strong>${jobcard.title ?? jobcard.id}</strong>

                                        <div class="dashboard-table-muted">${jobcard.jobcard_number ?? jobcard.id}</div>
                                        <div style="margin-top: 0.35rem;">
                                            <a
                                                href="${buildJobcardMenuUrl(jobcard, congregation)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style="display: inline-block; padding: 0.35rem 0.6rem; background: #2563eb; color: #fff; border-radius: 0.375rem; text-decoration: none; font-size: 0.875rem;"
                                            >
                                                ${t("openJobcard", "Åbn jobkort")}
                                            </a>
                                        </div>

                                    </td>

                                    <td>${jobcard.interval ?? "-"}</td>

                                    <td>

                                        <input
                                            type="date"
                                            class="dashboard-input"
                                            value="${jobcard.next_execution ?? ""}"
                                            aria-label="${t("jobcardNextExecution", "Neste utførelse")}" 
                                        >

                                    </td>

                                    <td>

                                        <label class="dashboard-visibility-toggle">

                                            <input
                                                type="checkbox"
                                                data-jobcard-id="${jobcard.id ?? jobcard.jobcard_number ?? jobcard.number ?? jobcard.title}"
                                                ${enabledIds.has(String(jobcard.id ?? jobcard.jobcard_number ?? jobcard.number ?? jobcard.title)) ? "checked" : ""}
                                            >

                                            <span>${enabledIds.has(String(jobcard.id ?? jobcard.jobcard_number ?? jobcard.number ?? jobcard.title)) ? t("jobcardVisibleOnPage", "Synlig på jobbkort-siden") : t("jobcardHiddenOnPage", "Skjult på jobbkort-siden")}</span>

                                        </label>

                                    </td>

                                </tr>

                            `).join("")}

                        </tbody>

                    </table>

                </div>

            `}

        </div>

    `;

    container.querySelectorAll("[data-jobcard-id]").forEach(checkbox => {

        checkbox.addEventListener("change", () => {

            const jobcardId = checkbox.dataset.jobcardId;
            const selectedIds = Array.from(container.querySelectorAll("[data-jobcard-id]:checked"))
                .map(input => input.dataset.jobcardId);

            setEnabledJobcardIds(congregation.id, selectedIds);

        });

    });

}
