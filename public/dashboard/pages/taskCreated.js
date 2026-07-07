export function initTaskCreated(){

    const container =
        document.getElementById(
            "task"
        );

    const params =
        new URLSearchParams(
            location.search
        );

    const id =
        params.get("id");

    const code =
        params.get("code");

    const url =
        `${location.origin}/o/${code}`;

    container.innerHTML = `

        <div class="dashboard-card">

            <h1>

                ✅ Oppdrag opprettet

            </h1>

            <br>

            <p>

                Oppdragsnummer

            </p>

            <h2>

                ${id}

            </h2>

            <br>

            <label>

                Link

            </label>

            <input

                id="taskLink"

                readonly

                value="${url}"

            >

            <br><br>

            <button
                id="copyButton"
            >

                📋 Kopier link

            </button>

            <br><br>

            <button
                id="mailButton"
            >

                ✉ Send på e-post

            </button>

        </div>

    `;

    document

        .getElementById(
            "copyButton"
        )

        .onclick = async ()=>{

            await navigator
                .clipboard
                .writeText(url);

            alert(
                "Link kopiert."
            );

        };

    document

        .getElementById(
            "mailButton"
        )

        .onclick = ()=>{

            location.href =

                `mailto:?subject=Nytt vedlikeholdsoppdrag&body=${encodeURIComponent(url)}`;

        };

}
