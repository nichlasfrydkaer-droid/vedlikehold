import {
    getUser
} from "../js/session.js";

import {
    renderDashboardHeader
} from "../components/dashboardHeader.js";

import {
    renderDashboardMenu,
    initDashboardMenu
} from "../components/dashboardMenu.js";

const dashboardStyles = [
    "/dashboard/css/dashboardHeader.css",
    "/dashboard/css/dashboardMenu.css",
    "/dashboard/css/dashboardCongregationSelector.css"
];

function ensureDashboardStyles(){

    for(const href of dashboardStyles){

        if(
            document.querySelector(
                `link[href="${href}"]`
            )
        ){

            continue;

        }

        const link =
            document.createElement("link");

        link.rel = "stylesheet";
        link.href = href;

        document.head.appendChild(
            link
        );

    }

}

export function renderDashboardLayout(){

    if(!getUser()){

        return;

    }

    if(
        document.getElementById(
            "menuButton"
        )
    ){

        return;

    }

    const main =
        document.querySelector(
            "main"
        );

    if(!main){

        return;

    }

    ensureDashboardStyles();

    const shell =
        document.createElement(
            "div"
        );

    shell.id = "dashboard";

    main.parentNode.insertBefore(
        shell,
        main
    );

    renderDashboardHeader(
        shell
    );

    renderDashboardMenu(
        shell
    );

    initDashboardMenu();

    shell.appendChild(
        main
    );

}
