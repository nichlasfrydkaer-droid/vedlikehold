import { getReports } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { renderReportCard } from "../components/reportCard.js";

export async function initReports(){

    const container =
        document.getElementById(
            "reports"
        );

    const congregation =
        getCongregation();

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

    container.innerHTML =
        result.reports
            .map(renderReportCard)
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
