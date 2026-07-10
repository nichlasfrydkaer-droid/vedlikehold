import { loadDashboard } from "../services/dashboard.js";
import { getJobcards } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { t } from "../js/i18n.js";

export async function initJobcards(){

    const me = await loadDashboard();

    if(!me){

        return;

    }

    const container = document.getElementById("jobcards");

    if(!container){

        return;

    }

    const congregation = getCongregation();

    if(!congregation){

        container.innerHTML = `

            <div class="dashboard-card">

                ${t("noCongregationSelected", "Ingen menighet valgt.")}

            </div>

        `;

        return;

    }

    const result = await getJobcards(congregation.id);

    if(!result || (!result.success && !Array.isArray(result) && !result.jobcards)){

        const errorMessage = typeof result === "string"
            ? result
            : (result?.error || result?.message || "Worker OK");

        container.innerHTML = `

            <div class="dashboard-card">

                <h2>${t("jobcards", "Jobbkort")}</h2>

                <p>${t("jobcardsLoadFailed", "Kunne ikke hente jobbkort.")}</p>
                <p style="color: #b91c1c;">${errorMessage}</p>

            </div>

        `;

        return;

    }

    const jobcards = Array.isArray(result)
        ? result
        : (result?.jobcards ?? []);

    if(jobcards.length === 0){

        container.innerHTML = `

            <div class="dashboard-card">

                <h2>${t("jobcards", "Jobbkort")}</h2>

                <p>${t("noJobcards", "Ingen jobbkort tilgjengelig for denne menigheten.")}</p>

            </div>

        `;

        return;

    }

    container.innerHTML = `

        <div class="dashboard-card">

            <h2>${t("jobcards", "Jobbkort")}</h2>

            <p>${t("jobcardsDescription", "Her kan du se og administrere jobbkort for denne menigheten.")}</p>

        </div>

        ${jobcards.map(jobcard => `
            <div class="dashboard-card">
                <h3>${jobcard.title ?? jobcard.id}</h3>
                <p>${jobcard.description ?? ""}</p>
                <small>${t("jobNumber", "Jobbkort")}: ${jobcard.jobcard_number ?? jobcard.id}</small>
            </div>
        `).join("")}

    `;

}
