import { renderTaskStatus, getTaskStatus } from "../js/taskStatus.js";
import { t } from "../js/i18n.js";

export function renderTaskCard(task){
    const status = getTaskStatus(task);
    return `<article class="task-card task-card-${status}" data-id="${task.id}">
        <div class="task-card-main">
            ${renderTaskStatus(task)}
            <h2>${task.title || ""}</h2>
            <p class="task-card-context">${t("jobcard", "Jobbkort")} ${task.job_number || "-"}${task.subtitle ? ` · ${task.subtitle}` : ""}</p>
            <div class="task-card-details">
                <span><b>□</b>${t("deadline", "Frist")}: ${task.deadline || "-"}</span>
                <span><b>○</b>${t("created", "Opprettet")}: ${(task.created_at || "").slice(0,10)}</span>
                ${task.started_at ? `<span><b>▷</b>${t("taskStarted", "Startet")}: ${task.started_at.slice(0,10)}</span>` : ""}
            </div>
        </div>
        <div class="task-card-actions">
            <a class="dashboard-button" href="/dashboard/task.html?id=${encodeURIComponent(task.id)}">${t("openTask", "Åpne oppgave")}</a>
            ${status === "overdue" ? `<button class="dashboard-button dashboard-button-secondary" data-reopen="${task.id}">${t("reopenTask", "Genåbn")}</button>` : status !== "completed" ? `<button class="dashboard-button dashboard-button-secondary" data-share="${task.link_code}">${t("shareTask", "Del oppgave")}</button>` : ""}
        </div>
    </article>`;
}
