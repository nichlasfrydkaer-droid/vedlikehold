export async function initO(){

    const page =
        document.getElementById(
            "taskPage"
        );

    page.innerHTML = `

    <div class="task-page">

        <div class="dashboard-card">

            <div class="task-title">

                Bytt batteri i røykvarsler

            </div>

            <div class="task-deadline">

                Frist:
                14. august 2026

            </div>

            <div class="task-checklist">

                <label class="task-check-item">

                    <input type="checkbox">

                    Kontroller røykvarsler

                </label>

                <label class="task-check-item">

                    <input type="checkbox">

                    Bytt batteri

                </label>

                <label class="task-check-item">

                    <input type="checkbox">

                    Test alarm

                </label>

            </div>

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
                id="name"
                type="text"
            >

            <br><br>

            <h3>

                Bilder

            </h3>

            <button>

                Legg til bilde

            </button>

            <br><br>

            <button>

                Ferdigmeld oppdrag

            </button>

        </div>

    </div>

    `;

}
