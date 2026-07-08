import {

    loadDashboard

}

from "../services/dashboard.js";

import {

    getReports

}

from "../js/api.js";

import {

    getCongregation

}

from "../js/session.js";

import {

    renderReportCard

}

from "../components/reportCard.js";

export async function initReports(){

    const me =

        await loadDashboard();

    if(!me){

        return;

    }

    const container =

        document.getElementById(

            "reports"

        );

    const congregation =

        getCongregation();

    if(!congregation){

        container.innerHTML = `

            <div class="dashboard-card">

                Ingen menighet valgt.

            </div>

        `;

        return;

    }

    const result =

        await getReports(

            congregation.id

        );

    if(!result.success){

        container.innerHTML = `

            <div class="dashboard-card">

                Kunne ikke hente rapporter.

            </div>

        `;

        return;

    }

    if(result.reports.length===0){

        container.innerHTML = `

            <div class="dashboard-card">

                Ingen rapporter ennå.

            </div>

        `;

        return;

    }

    container.innerHTML =

        result.reports

            .map(

                renderReportCard

            )

            .join("");

    container

        .querySelectorAll(

            ".report-card"

        )

        .forEach(card=>{

            card.onclick = ()=>{

                location.href =

                    "/dashboard/report.html?id=" +

                    card.dataset.id;

            };

        });

}
