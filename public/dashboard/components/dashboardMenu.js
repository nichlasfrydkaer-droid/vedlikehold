import { logout, getUser } from "../js/session.js";

export function renderDashboardMenu(

    target = document.getElementById(
        "dashboard"
    )

){

    const dashboard =

        typeof target === "string"

            ? document.getElementById(
                target
            )

            : target;

    if(!dashboard){

        return;

    }

    dashboard.insertAdjacentHTML(

        "beforeend",

        `
        <div
            id="dashboardMenu"
            class="dashboard-menu-dropdown hidden"
        >

            <button
                class="dashboard-menu-item"
                id="menuJobcards"
            >

                📋

                <span>

                    Jobbkort

                </span>

            </button>

            ${getUser()?.is_owner ? `<button class="dashboard-menu-item" id="menuCongregations"><span>⛪</span><span>Menigheter</span></button>` : ""}

            <button
                class="dashboard-menu-item"
                id="menuReports"
            >

                📄

                <span>

                    Rapporter

                </span>

            </button>

            <button
                class="dashboard-menu-item"
                id="menuTasks"
            >

                🔧

                <span>

                    Oppdrag

                </span>

            </button>

            <button
                class="dashboard-menu-item"
                id="menuUsers"
            >

                👥

                <span>

                    Brukere

                </span>

            </button>

            <button
                class="dashboard-menu-item"
                id="menuSettings"
            >

                ⚙️

                <span>

                    Innstillinger

                </span>

            </button>

            <hr>

            <button
                class="dashboard-menu-item"
                id="menuLogout"
            >

                🚪

                <span>

                    Logg ut

                </span>

            </button>

        </div>
        `

    );

}

export function initDashboardMenu(){

    const button =
        document.getElementById(
            "menuButton"
        );

    const menu =
        document.getElementById(
            "dashboardMenu"
        );

    if(!button || !menu){

        return;

    }

    button.addEventListener(

        "click",

        e=>{

            e.stopPropagation();

            menu.classList.toggle(
                "hidden"
            );

        }

    );

    menu.addEventListener(

        "click",

        e=>{

            e.stopPropagation();

        }

    );

    document.addEventListener(

        "click",

        ()=>{

            menu.classList.add(
                "hidden"
            );

        }

    );

    document.addEventListener(

        "keydown",

        e=>{

            if(e.key==="Escape"){

                menu.classList.add(
                    "hidden"
                );

            }

        }

    );

    document
        .getElementById(
            "menuReports"
        )
        ?.addEventListener(

            "click",

            ()=>{

                location.href =
                    "/dashboard/reports.html";

            }

        );

    document
        .getElementById(
            "menuTasks"
        )
        ?.addEventListener(

            "click",

            ()=>{

                location.href =
                    "/dashboard/tasks.html";

            }

        );

    document
        .getElementById(
            "menuJobcards"
        )
        ?.addEventListener(

            "click",

            ()=>{

                location.href =
                    "/dashboard/jobcards.html";

            }

        );

    document
        .getElementById(
            "menuUsers"
        )
        ?.addEventListener(

            "click",

            ()=>{

                location.href = "/dashboard/users.html";

            }

        );

    document.getElementById("menuCongregations")?.addEventListener("click",()=>{ location.href="/dashboard/congregations.html"; });

    document
        .getElementById(
            "menuSettings"
        )
        ?.addEventListener(

            "click",

            ()=>{

                location.href =
                    "/dashboard/settings.html";

            }

        );

    document
        .getElementById(
            "menuLogout"
        )
        ?.addEventListener(

            "click",

            logout

        );

}
