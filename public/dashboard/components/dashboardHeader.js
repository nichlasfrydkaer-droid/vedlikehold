export function renderDashboardHeader(){

    const dashboard =
        document.getElementById("dashboard");

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <section class="dashboard-card">

            <h1>
                Vedlikeholdsystem
            </h1>

            <p>

                Velkommen.

            </p>

        </section>
        `

    );

}
