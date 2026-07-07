import { renderDashboardHeader } from "../components/dashboardHeader.js";
import { renderDashboardMenu } from "../components/dashboardMenu.js";
import { initDashboardMenu } from "../components/dashboardMenu.js";

import { renderDashboardNews } from "../components/dashboardNews.js";
import { renderDashboardOverview } from "../components/dashboardOverview.js";
import { renderDashboardUpcoming } from "../components/dashboardUpcoming.js";
import { renderDashboardTasks } from "../components/dashboardTasks.js";
import { renderDashboardReports } from "../components/dashboardReports.js";
import { renderDashboardFooter } from "../components/dashboardFooter.js";

export async function initDashboard() {

    const dashboard =
        document.getElementById("dashboard");

    dashboard.innerHTML = "";

    renderDashboardHeader();

    renderDashboardMenu();

    initDashboardMenu();

    dashboard.insertAdjacentHTML(
        "beforeend",
        `
        <div id="dashboardGrid"
             class="dashboard-grid">
        </div>
        `
    );

    renderDashboardNews();

    renderDashboardOverview();

    renderDashboardUpcoming();

    renderDashboardTasks();

    renderDashboardReports();

    renderDashboardFooter();

}
