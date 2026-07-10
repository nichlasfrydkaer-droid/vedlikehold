import { t } from "./i18n.js";

export function getTaskStatus(task, now = new Date()){
    if(task.status === "completed"){
        return "completed";
    }

    if(task.deadline && new Date(`${task.deadline}T23:59:59`) < now){
        return "overdue";
    }

    if(task.status === "started" || task.started_at){
        return "started";
    }

    return "open";
}

export function renderTaskStatus(task){
    const status = getTaskStatus(task);
    const labels = {
        open:t("taskOpen", "Åpen"),
        started:t("taskStarted", "Startet"),
        completed:t("taskCompleted", "Utført"),
        overdue:t("taskOverdue", "Overskredet")
    };

    return `<span class="task-status task-status-${status}"><span class="task-status-dot"></span>${labels[status]}</span>`;
}
