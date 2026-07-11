import {
    renderCongregationSelector,
    initCongregationSelector
} from "./dashboardCongregationSelector.js";

import {
    getUser
} from "../js/session.js";

export function renderDashboardHeader(

    target = document.getElementById(
        "dashboard"
    )

) {

    const dashboard =

        typeof target === "string"

            ? document.getElementById(
                target
            )

            : target;

    if(!dashboard){

        return;

    }

    const user =
        getUser();

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <header class="dashboard-header">

            <a
                class="dashboard-logo"
                href="/dashboard/dashboard.html"
                aria-label="Gå til dashboard">

                <h1>

                    Vedlikeholdsystem

                </h1>

            </a>

            <div class="dashboard-user">

                <div class="dashboard-user-info">

                    <div class="dashboard-user-name">

                        ${user?.name ?? ""}

                    </div>

                    ${renderCongregationSelector()}

                </div>

                <div class="dashboard-actions">

                    <div class="dashboard-menu">

                        <button
                            id="menuButton"
                            class="dashboard-user-button"
                            title="Meny"
                            aria-label="Meny">

                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="4" y="4" width="3" height="3" rx=".6"/>
                                <rect x="10.5" y="4" width="3" height="3" rx=".6"/>
                                <rect x="17" y="4" width="3" height="3" rx=".6"/>
                                <rect x="4" y="10.5" width="3" height="3" rx=".6"/>
                                <rect x="10.5" y="10.5" width="3" height="3" rx=".6"/>
                                <rect x="17" y="10.5" width="3" height="3" rx=".6"/>
                                <rect x="4" y="17" width="3" height="3" rx=".6"/>
                                <rect x="10.5" y="17" width="3" height="3" rx=".6"/>
                                <rect x="17" y="17" width="3" height="3" rx=".6"/>
                            </svg>

                        </button>

                    </div>

                </div>

            </div>

        </header>
        `

    );

    initCongregationSelector();

}
