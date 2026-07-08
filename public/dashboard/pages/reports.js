import {
    loadDashboard
}
from "../services/dashboard.js";

const me =
    await loadDashboard();

if(!me){

    return;

}
import { getMe, getReports } from "../js/api.js";
import { state } from "../js/state.js";
import { loadCongregation } from "../js/session.js";
import { renderReportCard } from "../components/reportCard.js";

export async function initReports(){

    const container =
        document.getElementById("reports");

    const me =
        await getMe();

    if(!me.success){

        localStorage.removeItem(
            "dashboard_token"
        );

        localStorage.removeItem(
            "dashboard_congregation"
        );

        location.href =
            "/dashboard/login.html";

        return;

    }

    state.user =
        me.user;

    state.congregations =
        me.congregations;

    if(me.congregations.length){

        state.congregation =
            me.congregations[0];

    }

    loadCongregation();

    if(!state.congregation){

        container.innerHTML = `

            <div class="dashboard-card">

                Ingen menighet valgt.

            </div>

        `;

        return;

    }

    const result =
        await getReports(
            state.congregation.id
        );

    if(!result.success){

        container.innerHTML = `

            <div class="dashboard-card">

                Kunne ikke hente rapporter.

            </div>

        `;

        return;

    }

    if(result.reports.length === 0){

        container.innerHTML = `

            <div class="dashboard-card">

                Ingen rapporter ennå.

            </div>

        `;

        return;

    }

    container.innerHTML =
        result.reports
            .map(renderReportCard)
            .join("");

    container
        .querySelectorAll(".report-card")
        .forEach(card=>{

            card.onclick = ()=>{

                location.href =
                    "/dashboard/report.html?id=" +
                    card.dataset.id;

            };

        });

}
