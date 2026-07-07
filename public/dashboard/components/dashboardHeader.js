import { state } from "../js/state.js";

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

                        ${
                            state.user?.name ??
                            ""
                        }

                    </div>

                    <div class="dashboard-user-congregation">

                        ${
                            state.congregation?.name ??
                            ""
                        }

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

}
