import { logout } from "../js/session.js";

export function renderDashboardMenu(){

    const dashboard =
        document.getElementById("dashboard");

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

            if(
                e.key==="Escape"
            ){

                menu.classList.add(
                    "hidden"
                );

            }

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
