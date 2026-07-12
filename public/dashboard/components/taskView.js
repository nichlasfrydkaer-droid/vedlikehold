import { t } from "../js/i18n.js";
import { getTaskStatus, renderTaskStatus } from "../js/taskStatus.js";

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"})[character]);

const formatDuration = value => {
    const seconds = Number(value);
    if(!Number.isFinite(seconds)) return "–";
    const total = Math.max(0, Math.round(seconds));
    return total < 60 ? `${total} sek` : `${Math.floor(total / 60)} min ${total % 60} sek`;
};

export function renderTaskView({ report, task, isExisting }){
    const isEditable = !isExisting || getTaskStatus(task) === "open";
    const locked = isEditable ? "" : "disabled";
    const checklist = task?.checklist?.length ? task.checklist : [{text:""}];
    const photos = task?.photos ?? [];
    const title = task?.title ?? report.title ?? "";
    const description = task?.description ?? "";
    const originalComment = task?.original_comment ?? report.notes ?? "";

    return `
        <a class="create-task-back" href="/dashboard/tasks.html">← ${t("backToTasks","Tilbake til oppgaver")}</a>
        <section class="create-task-card task-detail-card">
            <div class="task-detail-heading">
                <div>
                    <p class="create-task-context">${t("jobcard","Jobbkort")} ${escapeHtml(report.job_number ?? "–")}</p>
                    <h1>${isExisting ? escapeHtml(title) : t("createTask","Opprett oppdrag")}</h1>
                </div>
                ${isExisting ? renderTaskStatus(task) : ""}
            </div>

            ${isExisting && !isEditable ? `<p class="task-locked-notice">${t("taskLocked","Denne oppgaven kan ikke endres etter at den er startet, overskredet eller utført.")}</p>` : ""}

            ${isExisting && Number.isFinite(Number(task?.duration_seconds)) ? `<p class="task-locked-notice">${t("duration","Tidsbruk")}: ${formatDuration(task.duration_seconds)}</p>` : ""}

            <section class="create-task-original">
                <h2>${t("originalComment","Opprinnelig kommentar")}</h2>
                <p>${escapeHtml(originalComment || "–")}</p>
                ${!isExisting ? `<label><input id="includeComment" type="checkbox" checked> ${t("includeComment","Medtag kommentar")}</label>` : ""}
            </section>

            <label>${t("title","Tittel")}
                <input id="taskTitle" type="text" value="${escapeHtml(title)}" ${locked}>
            </label>

            <label>${t("comment","Kommentar")}
                <textarea id="taskComment" rows="5" ${locked}>${escapeHtml(description)}</textarea>
            </label>

            <label>${t("deadline","Frist")}
                <input id="deadline" type="date" value="${escapeHtml(task?.deadline ?? "")}" ${locked}>
            </label>

            <section class="task-detail-checklist">
                <h2>${t("checklist","Sjekkpunkter")}</h2>
                <div id="checklist">${checklist.map(item => `<input class="checkItem" type="text" value="${escapeHtml(item.text)}" ${locked}>`).join("")}</div>
                <button id="addItem" class="task-add" type="button" ${locked}>+ ${t("addChecklistItem","Legg til punkt")}</button>
            </section>

            <section class="task-detail-photos">
                <h2>${t("photos","Bilder")}</h2>
                ${photos.length ? `<div class="task-detail-photo-grid">${photos.map((url,index) => `<img src="${escapeHtml(url)}" alt="${t("photo","Bilde")} ${index + 1}">`).join("")}</div>` : `<p class="create-task-help">${t("noPhotos","Ingen bilder.")}</p>`}
            </section>

            <button id="saveTask" class="create-task-submit" type="button" ${locked}>${isExisting ? t("save","Lagre endringer") : t("createTask","Opprett oppdrag")}</button>
            ${isExisting ? `<p class="task-report-id">${t("reportId","Rapport-id")}: ${escapeHtml(report.id)}</p>` : ""}
        </section>`;
}
