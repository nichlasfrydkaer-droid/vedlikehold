import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getTasks, getReports } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { state } from "../js/state.js";
import { t } from "../js/i18n.js";

export async function renderDashboardNews(){

    const congregation = getCongregation();
    let items = [];

    if(congregation){
        const [tasksResult, reportsResult] = await Promise.all([
            getTasks(congregation.id),
            getReports(congregation.id)
        ]);

        const completedTasks = tasksResult?.success
            ? tasksResult.tasks.filter(task => task.status === "completed" && (!state.sessionStartedAt || task.completed_at >= state.sessionStartedAt)).map(task => ({ title:task.title, name:task.completed_name, date:task.completed_at }))
            : [];
        const reports = reportsResult?.success
            ? reportsResult.reports.filter(report => !state.sessionStartedAt || (report.finished_at || report.created_at) >= state.sessionStartedAt).map(report => ({ title:report.title || `${t("jobcard", "Jobbkort")} ${report.job_number}`, name:report.performed_by, date:report.finished_at || report.created_at }))
            : [];

        items = [...completedTasks, ...reports].sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
    }

    const content = items.length ? `
        <div class="dashboard-news-list">
            ${items.map(item => `
                <div class="dashboard-news-item">
                    <span>✅</span>
                    <span>${item.title} · ${t("completedBy", "Utført av")}: ${item.name || "-"}</span>
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
