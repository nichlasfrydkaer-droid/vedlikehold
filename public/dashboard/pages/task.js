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
    saveTask,
    saveExistingTask
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

    const copyId =
        params.get("copy");

    let report = null;
    let task = null;
    let seedTask = null;

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

        // An existing task must remain available even if its original report
        // is no longer accessible. The task endpoint includes the small set of
        // report fields needed for this safe fallback.
        report = {
            id: task.report_id,
            job_number: task.report_job_number ?? "-",
            notes: task.original_comment ?? task.report_notes ?? ""
        };

        const result =
            await getReport(
                task.report_id
            );

        if(result.success){

            report =
                result.report;

        }

    }

    //
    // Nytt oppdrag
    //

    else if(copyId){

        seedTask = await loadTask(copyId);

        if(!seedTask){
            container.innerHTML = `<div class="dashboard-card"><h2>Oppdrag ikke funnet</h2></div>`;
            return;
        }

        report = {id:seedTask.report_id,job_number:seedTask.report_job_number ?? "-",notes:seedTask.original_comment ?? seedTask.report_notes ?? ""};
        const result = await getReport(seedTask.report_id);
        if(result.success){ report = result.report; }
        seedTask = {...seedTask,deadline:""};

    }

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

            task: task ?? seedTask,

            isExisting:
                !!task

        });

    //
    // Eksisterende task
    //

    if(task){

        if(document.getElementById("saveTask")?.disabled){
            return;
        }

        document.getElementById("addItem")?.addEventListener("click",()=>{
            document.getElementById("checklist").insertAdjacentHTML("beforeend",'<div class="checklist-row"><input class="checkItem" type="text"></div>');
        });

        document.getElementById("saveTask").onclick = async ()=>{
            const checklist=[...document.querySelectorAll(".checkItem")].map(input=>({id:crypto.randomUUID(),text:input.value.trim()})).filter(item=>item.text);
            const response=await saveExistingTask({id:task.id,title:document.getElementById("taskTitle").value.trim(),description:document.getElementById("taskComment").value.trim(),deadline:document.getElementById("deadline").value,checklist});
            if(response.success){ location.reload(); return; }
            alert(response.message || "Kunne ikke lagre oppdraget.");
        };

        return;

    }

    if(seedTask){
        document.getElementById("includeComment").checked = false;
    }

    //
    // Tilføj checklistpunkt
    //

    document

        .getElementById(
            "addItem"
        )

        ?.addEventListener(

            "click",

            ()=>{

                const wrapper =
                    document.getElementById(
                        "checklist"
                    );

                wrapper.insertAdjacentHTML(

                    "beforeend",

                    `

                    <div class="checklist-row">

                        <input

                            class="checkItem"

                            type="text"

                        >

                    </div>

                    `

                );

            }

        );

    //
    // Gem task
    //

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

                    const text =
                        input.value.trim();

                    if(text){

                        checklist.push({

                            id:
                                crypto.randomUUID(),

                            text

                        });

                    }

                });

            let description =

                document

                    .getElementById(
                        "taskComment"
                    )

                    .value

                    .trim();

            if(

                document

                    .getElementById(
                        "includeComment"
                    )

                    .checked

            ){

                if(report.notes){

                    description =

                        report.notes +

                        "\n\n" +

                        description;

                }

            }

            const response =

                await saveTask({

                    report_id:
                        report.id,

                    title:

                        document

                            .getElementById(
                                "taskTitle"
                            )

                            .value

                            .trim(),

                    description,

                    deadline:

                        document

                            .getElementById(
                                "deadline"
                            )

                            .value,

                    checklist,

                    photos:seedTask?.photos ?? []

                });

            if(response.success){

                location.href =

                    "/dashboard/taskCreated.html?id=" +

                    response.task.id +

                    "&code=" +

                    response.task.link_code;

                return;

            }

            alert(

                response.message ??

                "Kunne ikke opprette oppdrag."

            );

        };

}
