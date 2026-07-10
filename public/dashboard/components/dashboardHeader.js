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

                <div class="dashboard-actions">

                    <button
                        id="homeButton"
                        class="dashboard-action-button"
                        title="Gå til dashboard"
                        type="button">

                        🏠

                    </button>

                    <div class="dashboard-menu">

                        <button
                            id="menuButton"
                            class="dashboard-user-button"
                            title="Meny">

                            ⠿

                        </button>

                    </div>

                </div>

            </div>

        </header>
        `

    );

    initCongregationSelector();

    const homeButton = document.getElementById("homeButton");

    if(homeButton){

        homeButton.addEventListener("click", ()=>{

            window.location.href = "/dashboard/dashboard.html";

        });

    }

}
