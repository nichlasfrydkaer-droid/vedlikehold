import {
    loadDashboard
}
from "../services/dashboard.js";

const me =
    await loadDashboard();

if(!me){

    return;

}
import { getMe } from "../js/api.js";
import { state } from "../js/state.js";
import {
    loadCongregation
} from "../js/session.js";
import {
    loadTranslations
} from "../js/i18n.js";

import {
    renderDashboardHeader
} from "../components/dashboardHeader.js";

import {
    renderDashboardMenu,
    initDashboardMenu
} from "../components/dashboardMenu.js";

import {
    renderDashboardNews
} from "../components/dashboardNews.js";

import {
    renderDashboardOverview
} from "../components/dashboardOverview.js";

import {
    renderDashboardUpcoming
} from "../components/dashboardUpcoming.js";

import {
    renderDashboardTasks
} from "../components/dashboardTasks.js";

import {
    renderDashboardReports
} from "../components/dashboardReports.js";

import {
    renderDashboardFooter
} from "../components/dashboardFooter.js";

export async function initDashboard(){

    const dashboard =
        document.getElementById(
            "dashboard"
        );

    dashboard.innerHTML = "";

    const me =
        await getMe();

    if(!me.success){

        localStorage.removeItem(
            "dashboard_token"
        );

        localStorage.removeItem(
            "dashboard_congregation"
        );

        location.href =
            "/dashboard/login.html";

        return;

    }

    state.user =
        me.user;

    state.congregations =
        me.congregations;

    if(me.congregations.length){

        state.congregation =
            me.congregations[0];

    }

    loadCongregation();

    await loadTranslations(

        state.congregation?.language ??

        "no"

    );

    renderDashboardHeader();

    renderDashboardMenu();

    initDashboardMenu();

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <div
            id="dashboardGrid"
            class="dashboard-grid"
        ></div>
        `

    );

    renderDashboardNews();

    renderDashboardOverview();

    renderDashboardUpcoming();

    renderDashboardTasks();

    renderDashboardReports();

    renderDashboardFooter();

}
