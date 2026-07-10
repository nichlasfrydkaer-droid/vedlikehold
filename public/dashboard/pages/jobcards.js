import { loadDashboard } from "../services/dashboard.js";
import { buildJobcardMenuUrl, getJobcards, getJobcardSettings } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";
import { openJobcardShareDialog } from "../components/jobcardShare.js";

function sortJobcards(jobcards, sortBy){
    return [...jobcards].sort((left, right) => {
        if(sortBy === "lastPerformed"){
            return String(right.lastPerformedAt || "").localeCompare(String(left.lastPerformedAt || ""));
        }
        if(sortBy === "dueDate"){
            return String(left.nextExecution || "9999-12-31").localeCompare(String(right.nextExecution || "9999-12-31"));
        }
        return String(left.jobcard_number).localeCompare(String(right.jobcard_number), undefined, { numeric:true });
    });
}

function icon(name){
    const paths = {
        interval:`<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/>`,
        completed:`<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 14l2 2 4-4"/>`,
        due:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`
    };
    return `<span class="jobcard-info-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg></span>`;
}

function renderCards(container, jobcards, congregation){
    container.querySelector("[data-jobcard-list]").innerHTML = sortJobcards(jobcards, container.querySelector("[data-jobcard-sort]").value)
        .map(jobcard => {
            const url = buildJobcardMenuUrl(jobcard, congregation);
            return `
                <article class="dashboard-jobcard-card">
                    <div class="dashboard-jobcard-main">
                        <h3>${jobcard.title}</h3>
                        <p class="dashboard-table-muted">${t("jobcard", "Jobbkort")} ${jobcard.jobcard_number}</p>
                        ${jobcard.description ? `<p class="dashboard-jobcard-description">${jobcard.description}</p>` : ""}
                        <div class="dashboard-jobcard-meta">
                            <span>${icon("interval")}${t("jobcardSuggestedInterval", "Foreslått intervall")}: ${jobcard.interval || "-"}</span>
                            <span>${icon("completed")}${t("jobcardLastPerformed", "Sist utført")}: ${jobcard.lastPerformedAt ? jobcard.lastPerformedAt.slice(0, 10) : "-"}</span>
                            <span>${icon("due")}${t("jobcardNextExecution", "Neste utførelse")}: ${jobcard.nextExecution || "-"}</span>
                        </div>
                    </div>
                    <div class="dashboard-jobcard-actions">
                        <a class="dashboard-button" href="${url}" target="_blank" rel="noopener noreferrer">${t("openJobcard", "Åbn jobkort")}</a>
                        <button type="button" class="dashboard-button dashboard-button-secondary" data-share-id="${jobcard.id}">${t("shareJobcard", "Del jobbkort")}</button>
                    </div>
                </article>`;
        }).join("");

    container.querySelectorAll("[data-share-id]").forEach(button => {
        button.addEventListener("click", () => {
            const jobcard = jobcards.find(item => String(item.id) === button.dataset.shareId);
            openJobcardShareDialog(jobcard, buildJobcardMenuUrl(jobcard, congregation));
        });
    });
}

export async function initJobcards(){
    const container = document.getElementById("jobcards");
    if(!container){ return; }

    const me = await loadDashboard();
    const congregation = getCongregation();
    if(!me || (!me.success && !me.fallback) || !congregation){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><p>${t("noCongregationSelected", "Ingen menighet valgt.")}</p></div>`;
        return;
    }

    const [cardsResult, settingsResult] = await Promise.all([getJobcards(congregation), getJobcardSettings(congregation.id)]);
    if(!cardsResult?.success || !settingsResult?.success){
        container.innerHTML = `<div class="dashboard-card dashboard-full"><p>${t("jobcardsLoadFailed", "Kunne ikke hente jobbkort.")}</p></div>`;
        return;
    }

    const jobcards = mergeJobcardSchedules(cardsResult.jobcards, settingsResult).filter(jobcard => jobcard.visible);
    container.innerHTML = `
        <section class="dashboard-card dashboard-full dashboard-jobcard-toolbar">
            <div><h2>${t("jobcards", "Jobbkort")}</h2><p>${t("jobcardsDescription", "Her kan du se og administrere jobbkort for denne menigheten.")}</p></div>
            <label>${t("sortJobcards", "Sorter:")}
                <select class="dashboard-input" data-jobcard-sort>
                    <option value="number">${t("sortByNumber", "Nummer")}</option>
                    <option value="lastPerformed">${t("sortByLastPerformed", "Sist utført")}</option>
                    <option value="dueDate">${t("sortByDueDate", "Skal utføres")}</option>
                </select>
            </label>
        </section>
        <section class="dashboard-jobcard-list" data-jobcard-list></section>`;

    container.querySelector("[data-jobcard-sort]").addEventListener("change", () => renderCards(container, jobcards, congregation));
    renderCards(container, jobcards, congregation);
}
