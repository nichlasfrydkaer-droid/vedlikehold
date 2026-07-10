import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getReports, getTasks } from "../js/api.js";
import { getCongregation } from "../js/session.js";

export async function renderDashboardOverview(){

    const content = `

        <div class="dashboard-overview-grid">

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Jobbkort

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div id="overviewReportsCount" class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Rapporter

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div id="overviewTasksCount" class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Oppdrag

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Brukere

                </div>

            </div>

        </div>

    `;

    addDashboardWidget(

        createCard(

            "📊 Hurtigt overblik",

            content

        )

    );

    const congregation = getCongregation();

    if(!congregation){

        return;

    }

    const [tasksResult, reportsResult] = await Promise.all([

        getTasks(congregation.id),
        getReports(congregation.id)

    ]);

    const reportsCount = reportsResult?.success
        ? reportsResult.reports?.length ?? 0
        : 0;

    const tasksCount = tasksResult?.success
        ? tasksResult.tasks?.length ?? 0
        : 0;

    const reportsElement = document.getElementById("overviewReportsCount");
    const tasksElement = document.getElementById("overviewTasksCount");

    if(reportsElement){

        reportsElement.textContent = String(reportsCount);

    }

    if(tasksElement){

        tasksElement.textContent = String(tasksCount);

    }

}
