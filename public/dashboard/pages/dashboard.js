import { getMe } from "../js/api.js";
import { state } from "../js/state.js";

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

    //
    // Hent den aktuelle bruger
    //

    const me =
        await getMe();

    if(me.success){

        state.user =
            me.user;

        state.congregations =
            me.congregations;

        if(me.congregations.length){

            state.congregation =
                me.congregations[0];

        }

    }else{

        localStorage.removeItem(
            "dashboard_token"
        );

        window.location.href =
            "/dashboard/login.html";

        return;

    }

    //
    // Header
    //

    renderDashboardHeader();

    renderDashboardMenu();

    initDashboardMenu();

    //
    // Dashboard Grid
    //

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <div
            id="dashboardGrid"
            class="dashboard-grid">
        </div>
        `

    );

    //
    // Widgets
    //

    renderDashboardNews();

    renderDashboardOverview();

    renderDashboardUpcoming();

    renderDashboardTasks();

    renderDashboardReports();

    renderDashboardFooter();

}
