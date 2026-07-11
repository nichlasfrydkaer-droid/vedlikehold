import {
    getPublicTask,
    completePublicTask,
    startPublicTask
}
from "../js/api.js";

export async function initO(){

    const container =
        document.getElementById(
            "taskPage"
        );

    const linkCode =
        new URLSearchParams(
            location.search
        ).get(
            "code"
        );

    const result =
        await getPublicTask(
            linkCode
        );

    if(!result.success){

        container.innerHTML = `

            <div class="dashboard-card">

                <h2>

                    Oppdraget finnes ikke.

                </h2>

            </div>

        `;

        return;

    }

    const task =
        result.task;

    const checklist =
        JSON.parse(
            task.checklist_json ?? "[]"
        );

    container.innerHTML = `

        <div class="task-page">

            <div class="dashboard-card">

                <h1>

                    ${task.title}

                </h1>

                <p>

                    ${task.description ?? ""}

                </p>

                ${task.original_comment ? `

                <div class="task-original-comment">

                    <strong>Opprinnelig kommentar</strong>

                    <p>${task.original_comment}</p>

                </div>

                ` : ""}

                <br>

                <strong>

                    Frist

                </strong>

                <br>

                ${task.deadline ?? "-"}

                ${task.status === "open" ? `

                    <br><br>

                    <button id="startButton" type="button">Start</button>

                ` : ""}

                <hr>

                <div
                    id="checklist"
                >

                </div>

                <hr>

                <h3>

                    Kommentar

                </h3>

                <textarea
                    id="comment"
                ></textarea>

                <br><br>

                <h3>

                    Navn

                </h3>

                <input
                    id="completedName"
                    type="text"
                >

                <br><br>

                <button
                    id="finishButton"
                    disabled
                >

                    Ferdigmeld

                </button>

            </div>

        </div>

    `;

    const list =
        document.getElementById(
            "checklist"
        );

    document
        .getElementById("startButton")
        ?.addEventListener("click", async event => {

            const response = await startPublicTask(linkCode);

            if(response.success){

                event.currentTarget.textContent = "Startet";
                event.currentTarget.disabled = true;

            }

        });

    checklist.forEach(

        item=>{

            list.insertAdjacentHTML(

                "beforeend",

                `

                <label
                    class="task-check-item"
                >

                    <input

                        class="taskCheckbox"

                        type="checkbox"

                    >

                    ${item.text}

                </label>

                <br>

                `

            );

        }

    );

    validateForm();

    document

        .querySelectorAll(
            ".taskCheckbox"
        )

        .forEach(

            box=>

                box.onchange =
                    validateForm

        );

    document

        .getElementById(
            "completedName"
        )

        .oninput =
            validateForm;

    document

        .getElementById(
            "finishButton"
        )

        .onclick = async ()=>{

            const completedChecklist =

                [...document.querySelectorAll(

                    ".taskCheckbox"

                )]

                .map(

                    (box,index)=>({

                        text:
                            checklist[index].text,

                        checked:
                            box.checked

                    })

                );

            const response =

                await completePublicTask({

                    link_code:
                        linkCode,

                    completed_name:

                        document

                            .getElementById(
                                "completedName"
                            )

                            .value

                            .trim(),

                    completed_comment:

                        document

                            .getElementById(
                                "comment"
                            )

                            .value

                            .trim(),

                    checklist:

                        completedChecklist,

                    completed_photos:[]

                });

            if(!response.success){

                alert(

                    "Kunne ikke ferdigmelde oppdrag."

                );

                return;

            }

            container.innerHTML = `

                <div class="dashboard-card">

                    <h1>

                        ✅ Takk!

                    </h1>

                    <br>

                    <p>

                        Oppdraget er ferdigmeldt.

                    </p>

                </div>

            `;

        };

}

function validateForm(){

    const name =
        document
            .getElementById(
                "completedName"
            );

    if(!name){

        return;

    }

    const allChecked =
        [...document.querySelectorAll(

            ".taskCheckbox"

        )]

        .every(

            c=>c.checked

        );

    document

        .getElementById(
            "finishButton"
        )

        .disabled =

            !(

                allChecked &&

                name.value.trim()

            );

}
