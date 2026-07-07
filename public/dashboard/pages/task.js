import {
    getReport,
    createTask
}
from "../js/api.js";

export async function initTask(){

    const container =
        document.getElementById(
            "task"
        );

    const reportId =
        new URLSearchParams(
            location.search
        ).get("report");

    if(!reportId){

        container.innerHTML=`

            <div class="dashboard-card">

                <h2>

                    Rapport mangler.

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

        container.innerHTML=`

            <div class="dashboard-card">

                <h2>

                    Rapport kunne ikke hentes.

                </h2>

            </div>

        `;

        return;

    }

    const report =
        result.report;

    container.innerHTML=`

    <div class="dashboard-card">

        <h1>

            Opprett oppdrag

        </h1>

        <br>

        <p>

            <strong>

                Rapport:

            </strong>

            ${report.report_number ?? report.id}

        </p>

        <p>

            <strong>

                Jobbkort:

            </strong>

            ${report.jobcard_id ?? "-"}

        </p>

        <hr>

        <h2>

            Original kommentar

        </h2>

        <label>

            <input
                id="includeComment"
                type="checkbox"
                checked
            >

            Inkluder kommentar

        </label>

        <br><br>

        <textarea

            id="originalComment"

            rows="5"

            readonly

        >${report.comment ?? ""}</textarea>

        <br><br>

        <label>

            Tittel

        </label>

        <input

            id="taskTitle"

            type="text"

            value="${report.title ?? ""}"

        >

        <br><br>

        <label>

            Frist

        </label>

        <input

            id="deadline"

            type="date"

        >

        <br><br>

        <h2>

            Sjekkpunkter

        </h2>

        <div
            id="checklist"
        >

            <input

                class="checkItem"

                placeholder="Første punkt..."

            >

        </div>

        <br>

        <button
            id="addItem"
        >

            + Legg til punkt

        </button>

        <hr>

        <h2>

            Bilder

        </h2>

        <div
            id="photos"
        >

            Ingen bilder ennå.

        </div>

        <br>

        <button
            id="createTask"

        >

            Opprett oppdrag

        </button>

        <div
            id="result"
        ></div>

    </div>

    `;

    document

        .getElementById(
            "addItem"
        )

        .onclick=()=>{

            document

                .getElementById(
                    "checklist"
                )

                .insertAdjacentHTML(

                    "beforeend",

                    `

                    <input

                        class="checkItem"

                        placeholder="Nytt punkt..."

                    >

                    `

                );

        };

    document

        .getElementById(
            "createTask"
        )

        .onclick=async()=>{

            const checklist=[];

            document

                .querySelectorAll(
                    ".checkItem"
                )

                .forEach(

                    input=>{

                        if(

                            input.value.trim()

                        ){

                            checklist.push({

                                id:

                                    crypto.randomUUID(),

                                text:

                                    input.value.trim()

                            });

                        }

                    }

                );

            const response=

                await createTask({

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

                        report.comment

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

        `/dashboard/taskCreated.html?id=${response.task.id}&code=${response.task.link_code}`;

}

                document

                    .getElementById(
                        "result"
                    )

                    .innerHTML=`

                        <hr>

                        <h2>

                            ✅ Oppdrag opprettet

                        </h2>

                        <p>

                            <strong>

                                Oppdrag:

                            </strong>

                            ${response.task.id}

                        </p>

                        <p>

                            <strong>

                                Linkkode:

                            </strong>

                            ${response.task.link_code}

                        </p>

                    `;

            }

        };

}
