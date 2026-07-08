import { getReport } from "../js/api.js";
import { renderReportView } from "../components/reportView.js";

export async function initReport(){

    const container =
        document.getElementById(
            "report"
        );

    const id =
        new URLSearchParams(
            location.search
        ).get("id");

    if(!id){

        container.innerHTML = `

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

        container.innerHTML = `

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

    const task =
        result.task;

    let checklist = [];

    try{

        checklist =
            JSON.parse(
                report.tasks_json || "[]"
            );

    }catch{

        checklist = [];

    }

    container.innerHTML =
        renderReportView(

            report,

            task,

            checklist

        );

    document
        .getElementById(
            "taskButton"
        )
        .onclick = ()=>{

            if(task){

                location.href =

                    "/dashboard/task.html?id=" +

                    task.id;

            }else{

                location.href =

                    "/dashboard/task.html?report=" +

                    report.id;

            }

        };

}
