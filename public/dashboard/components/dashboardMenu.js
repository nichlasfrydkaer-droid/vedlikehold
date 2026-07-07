export function renderDashboardMenu() {

    return `

        <div
            id="dashboardMenu"
            class="dashboard-menu-dropdown hidden"
        >

            <button
                class="dashboard-menu-item"
                id="menuJobcards"
            >
                📋
                <span>Jobbkort</span>
            </button>

            <button
                class="dashboard-menu-item"
                id="menuReports"
            >
                📄
                <span>Rapporter</span>
            </button>

            <button
                class="dashboard-menu-item"
                id="menuTasks"
            >
                🔧
                <span>Oppdrag</span>
            </button>

            <button
                class="dashboard-menu-item"
                id="menuUsers"
            >
                👥
                <span>Brukere</span>
            </button>

            <button
                class="dashboard-menu-item"
                id="menuSettings"
            >
                ⚙️
                <span>Innstillinger</span>
            </button>

            <hr>

            <button
                class="dashboard-menu-item"
                id="menuLogout"
            >
                🚪
                <span>Logg ut</span>
            </button>

        </div>

    `;

}

export function initDashboardMenu(){

    const button =
        document.getElementById("menuButton");

    const menu =
        document.getElementById("dashboardMenu");

    if(!button || !menu){
        return;
    }

    button.addEventListener("click", e=>{

        e.stopPropagation();

        menu.classList.toggle("hidden");

    });

    document.addEventListener("click",()=>{

        menu.classList.add("hidden");

    });

    menu.addEventListener("click",e=>{

        e.stopPropagation();

    });

    document.addEventListener("keydown",e=>{

        if(e.key==="Escape"){

            menu.classList.add("hidden");

        }

    });

}
