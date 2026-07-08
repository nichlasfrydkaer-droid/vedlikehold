import { getMe } from "../js/api.js";
import { state } from "../js/state.js";
import { loadCongregation } from "../js/session.js";
import { loadTranslations } from "../js/i18n.js";
import { renderDashboardHeader } from "../components/dashboardHeader.js";
import { renderDashboardMenu } from "../components/dashboardMenu.js";
import { initDashboardMenu } from "../components/dashboardMenu.js";

import { renderDashboardNews } from "../components/dashboardNews.js";
import { renderDashboardOverview } from "../components/dashboardOverview.js";
import { renderDashboardUpcoming } from "../components/dashboardUpcoming.js";
import { renderDashboardTasks } from "../components/dashboardTasks.js";
import { renderDashboardReports } from "../components/dashboardReports.js";
import { renderDashboardFooter } from "../components/dashboardFooter.js";

export function initDashboardMenu(){

    const button =
        document.getElementById("menuButton");

    const menu =
        document.getElementById("dashboardMenu");

    console.log("INIT");

    console.log(button);

    console.log(menu);

    if(!button || !menu){

        return;

    }

    button.onclick = e=>{

        console.log("BUTTON");

        e.stopPropagation();

        menu.classList.toggle("hidden");

    };

    menu.onclick = e=>{

        console.log("MENU");

        e.stopPropagation();

    };

    document.onclick = ()=>{

        console.log("DOCUMENT");

        menu.classList.add("hidden");

    };

}

    state.user =
        me.user;

    state.congregations =
        me.congregations;
// Standard er første menighed
if(me.congregations.length){

    state.congregation =
        me.congregations[0];

}

// Overskriv med gemt valg hvis det findes
loadCongregation();

// Indlæs oversættelser for den valgte menighed
await loadTranslations(

    state.congregation?.language ?? "no"

);

renderDashboardHeader();

renderDashboardMenu();

initDashboardMenu();

    initDashboardMenu();

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <div
            id="dashboardGrid"
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
