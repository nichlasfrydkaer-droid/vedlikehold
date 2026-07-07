import {
    renderDashboardMenu,
    initDashboardMenu
} from "./dashboardMenu.js";

export function renderDashboardHeader() {

    const dashboard =
        document.getElementById("dashboard");

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

                        Nichlas Frydkær

                    </div>

                    <div class="dashboard-user-congregation">

                        Elverum

                    </div>

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

    dashboard.insertAdjacentHTML(

        "beforeend",

        renderDashboardMenu()

    );

initDashboardMenu();    

}
