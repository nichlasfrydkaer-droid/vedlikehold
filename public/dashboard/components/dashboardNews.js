import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";

export function renderDashboardNews(){

    const content = `

        <div class="dashboard-news-list">

            <div class="dashboard-news-item">

                Ingen nye hendelser.

            </div>

        </div>

    `;

    addDashboardWidget(

        createCard(

            "🔔 Nyt siden sist",

            content

        )

    );

}
