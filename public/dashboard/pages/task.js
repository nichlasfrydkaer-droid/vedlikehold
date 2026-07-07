import {
    createTask
} from "../js/api.js";

export async function initTask(){

    const task =
        document.getElementById(
            "task"
        );

    const reportId =
        new URLSearchParams(
            location.search
        ).get("report");

    task.innerHTML = `

        <div class="dashboard-card">

            <h1>

                Opprett oppdrag

            </h1>

            <p>

                Rapport:
                <strong>${reportId}</strong>

            </p>

            <hr>

            <label>

                Tittel

            </label>

            <input
                id="taskTitle"
                type="text"
                placeholder="Skriv tittel..."
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
                    type="text"
                    placeholder="Første punkt..."
                >

            </div>

            <br>

            <button
                id="addItem"
            >

                + Legg til punkt

            </button>

            <br><br>

            <button
                id="createTaskButton"
            >

                Opprett oppdrag

            </button>

            <div
                id="result"
                style="margin-top:30px;"
            ></div>

        </div>

    `;

    document
        .getElementById(
            "addItem"
        )
        .onclick = ()=>{

            document
                .getElementById(
                    "checklist"
                )
                .insertAdjacentHTML(

                    "beforeend",

                    `

                    <input
                        class="checkItem"
                        type="text"
                        placeholder="Nytt punkt..."
                    >

                    `

                );

        };

    document
        .getElementById(
            "createTaskButton"
        )
        .onclick = async ()=>{

            const checklist =
                [];

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

            const result =
                await createTask({

                    report_id:
                        reportId,

                    title:
                        document
                            .getElementById(
                                "taskTitle"
                            )
                            .value,

                    deadline:
                        document
                            .getElementById(
                                "deadline"
                            )
                            .value,

                    checklist,

                    photos:[]

                });

            if(result.success){

                document
                    .getElementById(
                        "result"
                    )
                    .innerHTML = `

                        <h2>

                            ✅ Oppdrag opprettet

                        </h2>

                        <p>

                            ID:

                            ${result.task.id}

                        </p>

                        <p>

                            Link:

                            https://vedlikeholdsystem.no/o/${result.task.link_code}

                        </p>

                    `;

            }else{

                alert(
                    "Kunne ikke opprette oppdrag."
                );

            }

        };

}
