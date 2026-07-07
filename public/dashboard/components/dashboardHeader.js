import {
    renderCongregationSelector,
    initCongregationSelector
} from "./dashboardCongregationSelector.js";

import {
    getUser
} from "../js/session.js";

export function renderDashboardHeader() {

    const dashboard =
        document.getElementById("dashboard");

    const user =
        getUser();

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <header class="dashboard-header">

            <div class="dashboard-logo">

                <h1>

                    Vedlikeholdsystem

                </h1>

            </div>

            <div class="dashboard-user">

                <div class="dashboard-user-info">

                    <div class="dashboard-user-name">

                        ${user?.name ?? ""}

                    </div>

                    ${renderCongregationSelector()}

                </div>

                <div class="dashboard-menu">

                    <button
                        id="menuButton"
                        class="dashboard-user-button"
                        title="Meny">

                        ⠿

                    </button>

                </div>

            </div>

        </header>
        `

    );

    initCongregationSelector();

}
