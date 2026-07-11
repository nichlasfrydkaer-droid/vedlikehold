import { logout, getUser } from "../js/session.js";

function icon(name){
    const paths={
        home:`<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>`,
        jobcards:`<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>`,
        reports:`<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 14h6M9 17h6"/>`,
        tasks:`<path d="M5 4h14v17H5z"/><path d="m8 10 2 2 4-4M8 16h8"/>`,
        users:`<circle cx="12" cy="8" r="3"/><path d="M5 21c.8-3.6 3.2-5.5 7-5.5s6.2 1.9 7 5.5"/>`,
        congregations:`<path d="M4 21h16M6 21V9l6-5 6 5v12M9 21v-5h6v5M12 4V2"/>`,
        settings:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L6.6 17l.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 8l-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1z"/>`,
        logout:`<path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/>`
    };
    return `<span class="dashboard-menu-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg></span>`;
}

function item(id,label,iconName){ return `<button class="dashboard-menu-item" id="${id}">${icon(iconName)}<span>${label}</span></button>`; }

export function renderDashboardMenu(target=document.getElementById("dashboard")){
    const dashboard=typeof target === "string" ? document.getElementById(target) : target;
    if(!dashboard) return;
    const ownerItems=getUser()?.is_owner ? item("menuCongregations","Menigheter","congregations") : "";
    dashboard.insertAdjacentHTML("beforeend",`<div id="dashboardMenu" class="dashboard-menu-dropdown hidden">${item("menuHome","Hjem","home")}${item("menuJobcards","Jobbkort","jobcards")}${item("menuReports","Rapporter","reports")}${item("menuTasks","Oppdrag","tasks")}${item("menuUsers","Brukere","users")}${ownerItems}${item("menuSettings","Innstillinger","settings")}<hr>${item("menuLogout","Logg ut","logout")}</div>`);
}

export function initDashboardMenu(){
    const button=document.getElementById("menuButton"),menu=document.getElementById("dashboardMenu");
    if(!button||!menu) return;
    button.addEventListener("click",event=>{event.stopPropagation();menu.classList.toggle("hidden");});
    menu.addEventListener("click",event=>event.stopPropagation());
    document.addEventListener("click",()=>menu.classList.add("hidden"));
    document.addEventListener("keydown",event=>{if(event.key==="Escape")menu.classList.add("hidden");});
    const routes={menuHome:"/dashboard/dashboard.html",menuJobcards:"/dashboard/jobcards.html",menuReports:"/dashboard/reports.html",menuTasks:"/dashboard/tasks.html",menuUsers:"/dashboard/users.html",menuCongregations:"/dashboard/congregations.html",menuSettings:"/dashboard/settings.html"};
    Object.entries(routes).forEach(([id,href])=>document.getElementById(id)?.addEventListener("click",()=>{location.href=href;}));
    document.getElementById("menuLogout")?.addEventListener("click",logout);
}
