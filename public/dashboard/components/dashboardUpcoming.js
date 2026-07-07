import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";

export function renderDashboardUpcoming(){

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

    addDashboardWidget(

        createCard(

            "📅 Kommende Jobbkort",

            content

        )

    );

}
