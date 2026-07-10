import { loadDashboard } from "../services/dashboard.js";
import { getJobcards } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { t } from "../js/i18n.js";

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
                                                ${jobcard.visible === 1 || jobcard.visible === true ? "checked" : ""}
                                            >

                                            <span>${jobcard.visible === 1 || jobcard.visible === true ? t("jobcardVisibleOnPage", "Synlig på jobbkort-siden") : t("jobcardHiddenOnPage", "Skjult på jobbkort-siden")}</span>

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

}
