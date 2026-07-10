import { t } from "../js/i18n.js";

function escapeHtml(value){
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function interpolate(key, fallback, values){
    return Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, value),
        t(key, fallback)
    );
}

export function openJobcardShareDialog(jobcard, url){
    const subject = interpolate(
        "jobcardShareSubject",
        "New job card assigned: {title}",
        { title: jobcard.title }
    );
    const body = interpolate(
        "jobcardShareBody",
        "You have been assigned {title}.\n\nOpen the job card: {link}\n\nRegards,\nMaintenance System",
        { title: jobcard.title, link:url }
    );
    const dialog = document.createElement("div");
    dialog.className = "dashboard-share-backdrop";
    dialog.innerHTML = `
        <section class="dashboard-share-dialog" role="dialog" aria-modal="true" aria-labelledby="jobcardShareTitle">
            <button type="button" class="dashboard-share-close" aria-label="${escapeHtml(t("close", "Close"))}">×</button>
            <h2 id="jobcardShareTitle">${escapeHtml(t("shareJobcard", "Share job card"))}</h2>
            <p>${escapeHtml(jobcard.title)}</p>
            <input class="dashboard-input dashboard-share-url" value="${escapeHtml(url)}" readonly aria-label="${escapeHtml(t("jobcardLink", "Job card link"))}">
            <div class="dashboard-share-actions">
                <button type="button" class="dashboard-button" data-copy>${escapeHtml(t("copyLink", "Copy link"))}</button>
                <a class="dashboard-button dashboard-button-secondary" href="mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">${escapeHtml(t("email", "Email"))}</a>
            </div>
            <img class="dashboard-share-qr" alt="${escapeHtml(t("qrCode", "QR code"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}">
        </section>`;

    const close = () => dialog.remove();
    dialog.querySelector(".dashboard-share-close").addEventListener("click", close);
    dialog.addEventListener("click", event => {
        if(event.target === dialog){
            close();
        }
    });
    dialog.querySelector("[data-copy]").addEventListener("click", async event => {
        await navigator.clipboard.writeText(url);
        event.currentTarget.textContent = t("copied", "Copied");
    });
    document.body.append(dialog);
}

export function openTaskShareDialog(task, url){
    const subject = interpolate(
        "taskShareSubject",
        "New task assigned: {title}",
        { title:task.title }
    );
    const body = interpolate(
        "taskShareBody",
        "You have been assigned {title}.\n\nOpen the task: {link}\n\nRegards,\nMaintenance System",
        { title:task.title, link:url }
    );
    const dialog = document.createElement("div");
    dialog.className = "dashboard-share-backdrop";
    dialog.innerHTML = `
        <section class="dashboard-share-dialog" role="dialog" aria-modal="true" aria-labelledby="taskShareTitle">
            <button type="button" class="dashboard-share-close" aria-label="${escapeHtml(t("close", "Close"))}">×</button>
            <h2 id="taskShareTitle">${escapeHtml(t("shareTask", "Share task"))}</h2>
            <p>${escapeHtml(task.title)}</p>
            <input class="dashboard-input dashboard-share-url" value="${escapeHtml(url)}" readonly aria-label="${escapeHtml(t("taskLink", "Task link"))}">
            <div class="dashboard-share-actions">
                <button type="button" class="dashboard-button" data-copy>${escapeHtml(t("copyLink", "Copy link"))}</button>
                <a class="dashboard-button dashboard-button-secondary" href="mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">${escapeHtml(t("email", "Email"))}</a>
            </div>
            <img class="dashboard-share-qr" alt="${escapeHtml(t("qrCode", "QR code"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}">
        </section>`;
    const close = () => dialog.remove();
    dialog.querySelector(".dashboard-share-close").addEventListener("click", close);
    dialog.addEventListener("click", event => { if(event.target === dialog){ close(); } });
    dialog.querySelector("[data-copy]").addEventListener("click", async event => {
        await navigator.clipboard.writeText(url);
        event.currentTarget.textContent = t("copied", "Copied");
    });
    document.body.append(dialog);
}
