export function renderDashboardNews() {

    const dashboard =
        document.getElementById("dashboard");

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <section class="dashboard-card">

            <h2>

                🔔 Nyt siden sidst

            </h2>

            <div class="dashboard-news-list">

                <div class="dashboard-news-item">

                    Ingen nye hendelser.

                </div>

            </div>

        </section>
        `

    );

}
