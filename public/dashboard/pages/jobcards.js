import { loadDashboard } from "../services/dashboard.js";
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

    container.innerHTML = `

        <div class="dashboard-card">

            <h2>${t("jobcards", "Jobbkort")}</h2>

            <p>${t("jobcardsDescription", "Her kan du se og administrere jobbkort for denne menigheten.")}</p>

        </div>

    `;

}
