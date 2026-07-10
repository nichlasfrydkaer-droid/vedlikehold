import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getTasks } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { t } from "../js/i18n.js";
import { renderTaskStatus } from "../js/taskStatus.js";

export async function renderDashboardTasks(){

    const congregation = getCongregation();
    let tasks = [];

    if(congregation){
        const result = await getTasks(congregation.id);
        tasks = result?.success
            ? result.tasks.filter(task => task.status !== "completed")
            : [];
    }

    const content = tasks.length ? `
        <div class="dashboard-upcoming-list">
            ${tasks.sort((left, right) => String(left.deadline || "9999-12-31").localeCompare(String(right.deadline || "9999-12-31"))).slice(0, 3).map(task => `
                <div class="dashboard-upcoming-item">
                    <div class="dashboard-upcoming-title">${task.title} ${renderTaskStatus(task)}</div>
                    <div class="dashboard-upcoming-subtitle">${t("deadline", "Frist")}: ${task.deadline || "-"}</div>
                </div>
            `).join("")}
        </div>
    ` : `<p>${t("noUpcomingTasks", "Ingen kommende oppgaver.")}</p>`;

    addDashboardWidget(createCard(`✅ ${t("upcomingTasks", "Kommende oppgaver")}`, content));

}
