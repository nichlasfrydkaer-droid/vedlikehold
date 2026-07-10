import { renderTaskStatus, getTaskStatus } from "../js/taskStatus.js";
import { t } from "../js/i18n.js";

function icon(name){
    const paths = {
        calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`,
        created:`<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 13h6M9 17h4"/>`,
        started:`<path d="M8 5v14l11-7z"/>`
    };
    return `<span class="task-info-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg></span>`;
}

export function renderTaskCard(task){
    const status = getTaskStatus(task);
    return `<article class="task-card task-card-${status}" data-id="${task.id}">
        <div class="task-card-main">
            ${renderTaskStatus(task)}
            <h2>${task.title || ""}</h2>
            <p class="task-card-context">${t("jobcard", "Jobbkort")} ${task.job_number || "-"}${task.subtitle ? ` · ${task.subtitle}` : ""}</p>
            <div class="task-card-details">
                <span>${icon("calendar")}${t("deadline", "Frist")}: ${task.deadline || "-"}</span>
                <span>${icon("created")}${t("created", "Opprettet")}: ${(task.created_at || "").slice(0,10)}</span>
                ${task.started_at ? `<span>${icon("started")}${t("taskStarted", "Startet")}: ${task.started_at.slice(0,10)}</span>` : ""}
            </div>
        </div>
        <div class="task-card-actions">
            <a class="dashboard-button" href="/dashboard/task.html?id=${encodeURIComponent(task.id)}">${t("openTask", "Åpne oppgave")}</a>
            ${status === "overdue" ? `<button class="dashboard-button dashboard-button-secondary" data-reopen="${task.id}">${t("reopenTask", "Genåbn")}</button>` : status !== "completed" ? `<button class="dashboard-button dashboard-button-secondary" data-share="${task.link_code}">${t("shareTask", "Del oppgave")}</button>` : ""}
        </div>
    </article>`;
}
