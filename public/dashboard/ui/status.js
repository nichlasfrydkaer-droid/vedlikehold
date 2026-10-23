import { t } from "../js/i18n.js";

export function status(status){

    let icon = "⚪";
    let text = status;

    switch(status){

        case "completed":

            icon = "🟢";
            text = t("taskCompleted","Fullført");

            break;

        case "open":

            icon = "🟠";
            text = t("taskOpen","Åpent");

            break;

        case "created":

            icon = "🟡";
            text = t("created","Opprettet");

            break;

    }

    return `

        <div class="status">

            ${icon}

            ${text}

        </div>

    `;

}
