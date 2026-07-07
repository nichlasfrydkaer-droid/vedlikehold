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

                <strong>

                    ${reportId}

                </strong>

            </p>

            <hr>

            <h2>

                Original kommentar

            </h2>

            <label>

                <input
                    type="checkbox"
                    checked
                    id="includeComment"
                >

                Inkluder kommentar i oppdrag

            </label>

            <br><br>

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

            <h2>

                Bilder

            </h2>

            <p>

                (kommer i neste steg)

            </p>

            <br>

            <button
                id="createTask"
            >

                Opprett oppdrag

            </button>

        </div>

    `;

    document
        .getElementById(
            "addItem"
        )
        .addEventListener(

            "click",

            ()=>{

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

            }

        );

}
