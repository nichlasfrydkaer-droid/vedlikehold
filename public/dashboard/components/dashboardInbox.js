export function renderDashboardInbox(){

    const grid =
        document.getElementById(
            "dashboardGrid"
        );

    grid.insertAdjacentHTML(

        "beforeend",

        `

        <section
            class="dashboard-card dashboard-full"
        >

            <div
                class="dashboard-inbox"
            >

                <div
                    class="dashboard-inbox-title"
                >

                    📥 Innboks

                </div>

                <div
                    class="dashboard-inbox-empty"
                >

                    Ingen elementer i innboksen.

                </div>

            </div>

        </section>

        `

    );

}
