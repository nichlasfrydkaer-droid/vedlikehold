import { getReport } from "../js/api.js";

export async function initReport(){

    const reportElement =
        document.getElementById(
            "report"
        );

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");

    if(!id){

        reportElement.innerHTML = `

            <div class="dashboard-card">

                <h2>

                    Rapport ikke funnet

                </h2>

            </div>

        `;

        return;

    }

    const result =
        await getReport(id);

    if(!result.success){

        reportElement.innerHTML = `

            <div class="dashboard-card">

                <h2>

                    Rapport kunne ikke lastes

                </h2>

            </div>

        `;

        return;

    }

    const report =
        result.report;

    reportElement.innerHTML = `

        <div class="dashboard-card">

            <h1>

                Rapport ${report.report_number ?? report.id}

            </h1>

            <p>

                <strong>Jobbkort:</strong>

                ${report.jobcard_id}

            </p>

            <p>

                <strong>Status:</strong>

                ${report.status}

            </p>

            <p>

                <strong>Utført av:</strong>

                ${report.completed_by ?? "-"}

            </p>

            <p>

                <strong>Dato:</strong>

                ${report.completed_at ?? "-"}

            </p>

            <hr>

            <button
                id="createTaskButton"
                class="button-primary"
            >

                Opprett oppdrag

            </button>

        </div>

    `;

    document
        .getElementById(
            "createTaskButton"
        )
        .addEventListener(

            "click",

            ()=>{

                location.href =
                    "/dashboard/task.html?report=" + report.id;

            }

        );

}
