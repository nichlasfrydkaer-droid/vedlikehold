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

            <div class="dashboard-card report-page">

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

    let checklist = [];

    try{

        checklist =
            JSON.parse(
                report.tasks_json || "[]"
            );

    }catch{

        checklist = [];

    }

    reportElement.innerHTML = `

        <div class="dashboard-card">

            <h2>

                JOBBKORT ${report.job_number}

            </h2>

            <h1 class="report-title">

                ${report.title ?? ""}

            </h1>

            <p class="report-subtitle">

                ${report.subtitle ?? ""}

            </p>

            <br>

<div class="report-info">

    <div>

        👤 ${report.performed_by || "-"}

    </div>

    <div>

        📅 ${report.finished_at
            ? new Date(report.finished_at)
                .toLocaleString("no-NO")
            : "-"}

    </div>

    <div>

        ⏱ ${report.duration_seconds
            ? Math.round(report.duration_seconds / 60) + " min"
            : "-"}

    </div>

    <div>

        📷 ${report.photo_count} bilder

    </div>

</div>

            <hr>
<div class="report-section">

    <h3>

        Kommentar

    </h3>

    <div class="report-comment">

        ${report.notes || "-"}

    </div>

</div>

            <hr>
<div class="report-section">

    <h3>

        Sjekkpunkter

    </h3>

    <div
        id="taskList"
        class="report-checklist"
    >

                ${checklist.length

                    ?

                    checklist.map(task=>`

                        <p>

                            ${task.completed ? "✅" : "❌"}

                            ${task.text}

                        </p>

                    `).join("")

                    :

                    "<p>-</p>"

                }

            </div>

</div>

            <hr>

            ${report.pdf_url ? `

                <p>
<a
    href="${report.pdf_url}"
    target="_blank"
    class="button-primary report-button"
>

    📄 Last ned PDF

</a>

                </p>

            ` : ""}

            <br>

            <button

                id="createTaskButton"

                class="button-primary"

            >

                Opprett oppdrag

            </button>

            <hr>

            <p
                style="
                    font-size:12px;
                    color:#999;
                    margin-bottom:4px;
                "
            >

                Rapport-ID

            </p>

            <p
                style="
                    font-size:11px;
                    color:#bbb;
                    word-break:break-all;
                "
            >

                ${report.id}

            </p>

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

                    "/dashboard/task.html?report=" +

                    report.id;

            }

        );

}
