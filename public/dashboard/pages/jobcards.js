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

function renderCards(container, jobcards, congregation){
    container.querySelector("[data-jobcard-list]").innerHTML = sortJobcards(jobcards, container.querySelector("[data-jobcard-sort]").value)
        .map(jobcard => {
            const url = buildJobcardMenuUrl(jobcard, congregation);
            return `
                <article class="dashboard-card dashboard-full dashboard-jobcard-card">
                    <div>
                        <h3>${jobcard.title}</h3>
                        <p class="dashboard-table-muted">${t("jobcard", "Jobbkort")} ${jobcard.jobcard_number}</p>
                        <p>${jobcard.description || ""}</p>
                    </div>
                    <div class="dashboard-jobcard-meta">
                        <span>${t("jobcardSuggestedInterval", "Foreslått intervall")}: ${jobcard.interval || "-"}</span>
                        <span>${t("jobcardLastPerformed", "Sist utført")}: ${jobcard.lastPerformedAt ? jobcard.lastPerformedAt.slice(0, 10) : "-"}</span>
                        <span>${t("jobcardNextExecution", "Neste utførelse")}: ${jobcard.nextExecution || "-"}</span>
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
            <label>${t("sortJobcards", "Sorter jobbkort")}
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
