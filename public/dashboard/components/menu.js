import { t } from "../js/i18n.js";

export function renderMenu(){

    return `

        <div
            id="appMenu"
            class="app-menu hidden"
        >

            <button>

                📋
                ${t("jobcards","Jobbkort")}

            </button>

            <button>

                📄
                ${t("reports","Rapporter")}

            </button>

            <button>

                🔧
                ${t("tasks","Oppdrag")}

            </button>

            <button>

                👥
                ${t("users","Brukere")}

            </button>

            <button>

                ⚙️
                ${t("settings","Innstillinger")}

            </button>

            <hr>

            <button>

                🚪
                ${t("logout","Logg ut")}

            </button>

        </div>

    `;

}
