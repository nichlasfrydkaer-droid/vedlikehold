import {
    loadDashboard
}
from "../services/dashboard.js";

import {
    getReport
}
from "../js/api.js";

import {
    loadTask,
    saveTask
}
from "../services/tasks.js";

import {
    renderTaskView
}
from "../components/taskView.js";

export async function initTask(){

    const me =
        await loadDashboard();

    if(!me){

        return;

    }

    const container =
        document.getElementById(
            "task"
        );

    const params =
        new URLSearchParams(
            location.search
        );

    const reportId =
        params.get("report");

    const taskId =
        params.get("id");

    let report = null;

    let task = null;

    //
    // Eksisterende oppdrag
    //

    if(taskId){

        task =
            await loadTask(
                taskId
            );

        if(!task){

            container.innerHTML = `

                <div class="dashboard-card">

                    <h2>

                        Oppdrag ikke funnet

                    </h2>

                </div>

            `;

            return;

        }

        const result =
            await getReport(
                task.report_id
            );

        if(!result.success){

            container.innerHTML = `

                <div class="dashboard-card">

                    <h2>

                        Rapport kunne ikke hentes

                    </h2>

                </div>

            `;

            return;

        }

        report =
            result.report;

    }

    //
    // Nytt oppdrag
    //

    else{

        if(!reportId){

            container.innerHTML = `

                <div class="dashboard-card">

                    <h2>

                        Rapport mangler

                    </h2>

                </div>

            `;

            return;

        }

        const result =
            await getReport(
                reportId
            );

        if(!result.success){

            container.innerHTML = `

                <div class="dashboard-card">

                    <h2>

                        Rapport kunne ikke hentes

                    </h2>

                </div>

            `;

            return;

        }

        report =
            result.report;

    }

    container.innerHTML =

        renderTaskView({

            report,

            task,

            isExisting:
                !!task

        });

    if(task){

        return;

    }

    document

        .getElementById(
            "saveTask"
        )

        .onclick = async ()=>{

            const checklist = [];

            document

                .querySelectorAll(
                    ".checkItem"
                )

                .forEach(input=>{

                    if(input.value.trim()){

                        checklist.push({

                            id:
                                crypto.randomUUID(),

                            text:
                                input.value.trim()

                        });

                    }

                });

            const response =

                await saveTask({

                    report_id:
                        report.id,

                    title:
                        document
                            .getElementById(
                                "taskTitle"
                            )
                            .value,

                    description:

                        document
                            .getElementById(
                                "includeComment"
                            )
                            .checked

                        ?

                        report.notes ?? ""

                        :

                        "",

                    deadline:
                        document
                            .getElementById(
                                "deadline"
                            )
                            .value,

                    checklist,

                    photos:[]

                });

            if(response.success){

                location.href =

                    "/dashboard/taskCreated.html?id=" +

                    response.task.id +

                    "&code=" +

                    response.task.link_code;

            }

            else{

                alert(

                    "Kunne ikke opprette oppdrag."

                );

            }

        };

}
