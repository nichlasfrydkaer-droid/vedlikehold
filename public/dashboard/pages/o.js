import {
    getPublicTask
}
from "../js/api.js";

export async function initO(){

    const container =
        document.getElementById(
            "taskPage"
        );

    const linkCode =
        location.pathname
            .split("/")
            .pop();

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

                    ${task.instructions ?? ""}

                </p>

                <br>

                <strong>

                    Frist

                </strong>

                <br>

                ${task.deadline ?? "-"}

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
