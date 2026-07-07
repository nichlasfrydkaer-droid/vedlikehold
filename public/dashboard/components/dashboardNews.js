import { createCard } from "./card.js";

export function renderDashboardNews(){

    const dashboard =
        document.getElementById("dashboard");

    const content = `

        <div class="dashboard-news-list">

            <div class="dashboard-news-item">

                Ingen nye hendelser.

            </div>

        </div>

    `;

    dashboard.insertAdjacentHTML(

        "beforeend",

        createCard(

            "🔔 Nyt siden sist",

            content

        )

    );

}
