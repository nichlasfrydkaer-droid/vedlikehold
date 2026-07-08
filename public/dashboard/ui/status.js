export function status(status){

    let icon = "⚪";
    let text = status;

    switch(status){

        case "completed":

            icon = "🟢";
            text = "Fullført";

            break;

        case "open":

            icon = "🟠";
            text = "Åpent";

            break;

        case "created":

            icon = "🟡";
            text = "Opprettet";

            break;

    }

    return `

        <div class="status">

            ${icon}

            ${text}

        </div>

    `;

}
