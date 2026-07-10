import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getTasks } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { state } from "../js/state.js";
import { t } from "../js/i18n.js";

export async function renderDashboardNews(){

    const congregation = getCongregation();
    let tasks = [];

    if(congregation){
        const result = await getTasks(congregation.id);
        tasks = result?.success
            ? result.tasks.filter(task => task.status === "completed" && (!state.sessionStartedAt || task.completed_at >= state.sessionStartedAt))
            : [];
    }

    const content = tasks.length ? `
        <div class="dashboard-news-list">
            ${tasks.map(task => `
                <div class="dashboard-news-item">
                    <span>✅</span>
                    <span>${task.title} · ${t("completedBy", "Utført av")}: ${task.completed_name || "-"}</span>
                </div>
            `).join("")}
        </div>
    ` : `
        <div class="dashboard-news-list">
            <div class="dashboard-news-item">${t("noNewActivity", "Ingen nye hendelser.")}</div>
        </div>
    `;

    addDashboardWidget(createCard(`🔔 ${t("newSinceLastLogin", "Nytt siden sist")}`, content));

}
