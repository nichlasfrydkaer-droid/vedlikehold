import { getCongregation } from "../js/session.js";
import { getActivity, markActivitySeen } from "../js/api.js";
import { renderCongregationSelector, initCongregationSelector } from "./dashboardCongregationSelector.js";
import { t } from "../js/i18n.js";

function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
}

function closeActivityPanel(){
    document.querySelector(".dashboard-notification-panel")?.remove();
}

function renderActivityPanel(items){
    const panel = document.createElement("section");
    panel.className = "dashboard-notification-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t("newSinceLastLogin", "Nytt siden sist"));
    panel.innerHTML = `<h2>${t("newSinceLastLogin", "Nytt siden sist")}</h2>${items.length
        ? items.slice(0, 8).map((item) => `<a href="${escapeHtml(item.target_url || "#")}">${escapeHtml(item.title || item.action)}</a>`).join("")
        : `<p>${t("noNewActivity", "Ingen nye aktiviteter.")}</p>`}`;
    panel.addEventListener("click", (event) => event.stopPropagation());
    document.body.appendChild(panel);
    setTimeout(() => document.addEventListener("click", closeActivityPanel, { once:true }), 0);
}

function initActivityBell(congregation){
    const bell = document.getElementById("activityBell");
    const badge = document.getElementById("activityBadge");
    if(!bell || !congregation?.id) return;

    const refreshBadge = async () => {
        const result = await getActivity(congregation.id);
        if(result?.unseen){
            badge.hidden = false;
            badge.textContent = result.unseen > 99 ? "99+" : result.unseen;
        }
        return result?.items || [];
    };

    refreshBadge().catch(() => {});

    bell.addEventListener("click", async (event) => {
        event.stopImmediatePropagation();
        event.stopPropagation();
        if(document.querySelector(".dashboard-notification-panel")){
            closeActivityPanel();
            return;
        }
        const items = await refreshBadge().catch(() => []);
        renderActivityPanel(items);
        badge.hidden = true;
        markActivitySeen(congregation.id).catch(() => {});
    });
}

export function renderDashboardHeader(target = document.getElementById("dashboard")){
    const root = typeof target === "string" ? document.getElementById(target) : target;
    if(!root || document.getElementById("dashboardHeader")) return;

    const congregation = getCongregation();
    const language = (congregation?.language || "no").toUpperCase();
    root.insertAdjacentHTML("afterbegin", `<header id="dashboardHeader" class="dashboard-header">
        <button id="menuButton" class="dashboard-mobile-menu" aria-label="${t("menu", "Meny")}"><span></span><span></span><span></span></button>
        <div class="dashboard-top-context"><strong>${escapeHtml(congregation?.name || "")}</strong><span>${language}</span></div>
        <button id="activityBell" class="dashboard-bell" type="button" aria-label="${t("newSinceLastLogin", "Nytt siden sist")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><b id="activityBadge" hidden>0</b></button>
    </header>`);

    initActivityBell(congregation);
    setTimeout(() => {
        const user = document.querySelector(".dashboard-sidebar-user");
        if(user && !document.getElementById("congregationButton")){
            user.insertAdjacentHTML("afterbegin", renderCongregationSelector());
            initCongregationSelector();
        }
    }, 0);
}
