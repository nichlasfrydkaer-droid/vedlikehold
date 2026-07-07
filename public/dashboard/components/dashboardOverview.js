import { createCard } from "./card.js";

export function renderDashboardOverview(){

    const grid =
        document.getElementById("dashboardGrid");

    const content = `

        <div class="dashboard-overview-grid">

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">

                    -

                </div>

                <div class="dashboard-overview-title">

                    Jobbkort

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">

                    -

                </div>

                <div class="dashboard-overview-title">

                    Rapporter

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">

                    -

                </div>

                <div class="dashboard-overview-title">

                    Oppdrag

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">

                    -

                </div>

                <div class="dashboard-overview-title">

                    Brukere

                </div>

            </div>

        </div>

    `;

    grid.insertAdjacentHTML(

        "beforeend",

        createCard(
            "📊 Hurtigt overblik",
            content
        )

    );

}
