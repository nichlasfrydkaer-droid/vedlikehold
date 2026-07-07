import { createCard } from "./card.js";

export function renderDashboardUpcoming(){

    const dashboard =
        document.getElementById("dashboard");

    const content = `

        <div class="dashboard-upcoming-list">

            <div class="dashboard-upcoming-item">

                <div class="dashboard-upcoming-title">

                    Ingen kommende Jobbkort.

                </div>

                <div class="dashboard-upcoming-subtitle">

                    Alt er oppdatert.

                </div>

            </div>

        </div>

    `;

    dashboard.insertAdjacentHTML(

        "beforeend",

        createCard(

            "📅 Kommende Jobbkort",

            content

        )

    );

}
