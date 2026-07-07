import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";

export function renderDashboardOverview(){

    const content = `

        <div class="dashboard-overview-grid">

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Jobbkort

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Rapporter

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Oppdrag

                </div>

            </div>

            <div class="dashboard-overview-box">

                <div class="dashboard-overview-number">-</div>

                <div class="dashboard-overview-title">

                    Brukere

                </div>

            </div>

        </div>

    `;

    addDashboardWidget(

        createCard(

            "📊 Hurtigt overblik",

            content

        )

    );

}
