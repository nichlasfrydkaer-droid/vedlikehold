export function renderDashboardOverview() {

    const dashboard =
        document.getElementById("dashboard");

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <section class="dashboard-card">

            <h2>

                📊 Hurtigt overblik

            </h2>

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

        </section>
        `

    );

}
