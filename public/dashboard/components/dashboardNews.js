import { createCard } from "./card.js";

export function renderDashboardNews(){

    const grid =
        document.getElementById("dashboardGrid");

    const content = `

        <div class="dashboard-news-list">

            <div class="dashboard-news-item">

                Ingen nye hendelser.

            </div>

        </div>

    `;

    grid.insertAdjacentHTML(

        "beforeend",

        createCard(
            "🔔 Nyt siden sist",
            content
        )

    );

}
