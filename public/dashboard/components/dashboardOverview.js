import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getReports, getTasks } from "../js/api.js";
import { getCongregation } from "../js/session.js";

export async function renderDashboardOverview(){

    const content = `

        <div class="dashboard-overview-grid">

            <button type="button" class="dashboard-overview-box" data-overview-target="jobcards">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Jobbkort

                </div>

            </button>

            <button type="button" class="dashboard-overview-box" data-overview-target="reports">

                <div id="overviewReportsCount" class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Rapporter

                </div>

            </button>

            <button type="button" class="dashboard-overview-box" data-overview-target="tasks">

                <div id="overviewTasksCount" class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Oppdrag

                </div>

            </button>

            <button type="button" class="dashboard-overview-box" data-overview-target="users" disabled>

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Brukere

                </div>

            </button>

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

    document.querySelectorAll("[data-overview-target]").forEach(button => {

        button.addEventListener("click", () => {

            const target = button.dataset.overviewTarget;

            if(target === "jobcards"){

                location.href = "/dashboard/jobcards.html";

            }

            if(target === "reports"){

                location.href = "/dashboard/reports.html";

            }

            if(target === "tasks"){

                location.href = "/dashboard/tasks.html";

            }

        });

    });

}
