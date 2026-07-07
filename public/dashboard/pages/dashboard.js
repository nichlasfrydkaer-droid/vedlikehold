import { renderDashboardHeader } from "../components/dashboardHeader.js";
import { renderDashboardNews } from "../components/dashboardNews.js";
import { renderDashboardOverview } from "../components/dashboardOverview.js";
import { renderDashboardUpcoming } from "../components/dashboardUpcoming.js";
import { renderDashboardTasks } from "../components/dashboardTasks.js";
import { renderDashboardReports } from "../components/dashboardReports.js";
import { renderDashboardFooter } from "../components/dashboardFooter.js";

export async function initDashboard() {

    renderDashboardHeader();

    renderDashboardNews();

    renderDashboardOverview();

    renderDashboardUpcoming();

    renderDashboardTasks();

    renderDashboardReports();

    renderDashboardFooter();

}
