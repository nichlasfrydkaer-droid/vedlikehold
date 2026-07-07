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

                <button
                    class="dashboard-user-button"
                    title="Brukermeny"
                >

                    ☰

                </button>

            </div>

        </header>
        `

    );

}
