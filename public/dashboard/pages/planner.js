import { loadDashboard } from "../services/dashboard.js";
import { getJobcards, getJobcardSettings, getReports } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";

const MONTHS_IN_YEAR = 12;

function dateFromMonth(value){
    const match = String(value || "").match(/^(\d{4})-(\d{2})/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1, 12) : null;
}

function addMonths(date, amount){ return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12); }
function monthKey(date){ return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

function jobcardKeys(value){
    const key = String(value ?? "").trim();
    const numeric = key.match(/^0*(\d+)([A-Za-z]?)$/);
    const normalized = numeric ? `${Number(numeric[1])}${numeric[2].toUpperCase()}` : key.toUpperCase();
    return [...new Set([key, normalized])].filter(Boolean);
}

function reportCompletionIndex(reports){
    const completed = new Set();
    (reports || []).forEach(report => {
        const date = new Date(report.finished_at || report.created_at || "");
        if(Number.isNaN(date.getTime())) return;
        jobcardKeys(report.job_number || report.jobcard_id).forEach(key => completed.add(`${key}:${monthKey(date)}`));
    });
    return completed;
}

function scheduledForYear(jobcards, year, completed){
    const months = Array.from({ length:MONTHS_IN_YEAR }, () => []);
    jobcards.forEach(jobcard => {
        const interval = Number(jobcard.autoInterval ? jobcard.intervalMonths : jobcard.manualIntervalMonths);
        const anchor = dateFromMonth(jobcard.nextExecution);
        if(!anchor || !Number.isFinite(interval) || interval < 1) return;
        for(let offset = -24; offset <= 24; offset += 1){
            const occurrence = addMonths(anchor, offset * interval);
            if(occurrence.getFullYear() !== year) continue;
            const index = occurrence.getMonth();
            if(months[index].some(item => String(item.id) === String(jobcard.id))) continue;
            const complete = jobcardKeys(jobcard.id).some(key => completed.has(`${key}:${monthKey(occurrence)}`));
            months[index].push({ ...jobcard, completed:complete });
        }
    });
    return months.map(items => items.sort((left, right) => String(left.jobcard_number).localeCompare(String(right.jobcard_number), undefined, { numeric:true })));
}

function esc(value){ const element = document.createElement("span"); element.textContent = String(value ?? ""); return element.innerHTML; }
function monthLabel(date){
    const label = new Intl.DateTimeFormat(document.documentElement.lang || "no", { month:"long", year:"numeric" }).format(date);
    return label.replace(/^./, letter => letter.toUpperCase());
}

function renderMonth(month, cards){
    const complete = cards.filter(card => card.completed).length;
    const visibleLimit = 5;
    const extraCount = Math.max(0, cards.length - visibleLimit);
    return `<article class="planner-month-card" data-planner-month="${month.getMonth()}">
        <header><h2>${monthLabel(month)}</h2><span>${complete}/${cards.length}</span></header>
        <div class="planner-month-list">${cards.length ? cards.map((card, index) => `<div class="planner-jobcard ${card.completed ? "is-completed" : ""} ${index >= visibleLimit ? "is-extra" : ""}" title="${esc(card.title)}">
            <span class="planner-status" aria-label="${card.completed ? t("completed", "Utført") : t("planned", "Planlagt")}">${card.completed ? "✓" : ""}</span>
            <span class="planner-jobcard-copy"><strong><em>${t("jobcard", "Jobbkort")} ${esc(card.jobcard_number)}</em>${esc(card.title)}</strong><small>${t("jobcard", "Jobbkort")} ${esc(card.jobcard_number)}</small></span>
        </div>`).join("") : `<p class="planner-empty">${t("noJobcardsPlanned", "Ingen planlagte jobbkort.")}</p>`}${extraCount ? `<button class="planner-more" type="button" data-open-month="${month.getMonth()}">${t("plannerMoreItems", "+ {count} flere").replace("{count}", extraCount)}</button>` : ""}</div>
    </article>`;
}

function openMonthDialog(root, month, cards){
    const complete = cards.filter(card => card.completed).length;
    const overlay = document.createElement("div");
    overlay.className = "planner-month-overlay";
    overlay.innerHTML = `<section class="planner-month-dialog" role="dialog" aria-modal="true" aria-label="${monthLabel(month)}">
        <header><div><h2>${monthLabel(month)}</h2><p>${complete}/${cards.length}</p></div><button type="button" data-close-month aria-label="${t("close", "Lukk")}">×</button></header>
        <div class="planner-month-dialog-list">${cards.map(card => `<div class="planner-jobcard ${card.completed ? "is-completed" : ""}">
            <span class="planner-status" aria-label="${card.completed ? t("completed", "Utført") : t("planned", "Planlagt")}">${card.completed ? "✓" : ""}</span>
            <span class="planner-jobcard-copy"><strong><em>${t("jobcard", "Jobbkort")} ${esc(card.jobcard_number)}</em>${esc(card.title)}</strong><small>${t("jobcard", "Jobbkort")} ${esc(card.jobcard_number)}</small></span>
        </div>`).join("")}</div>
    </section>`;
    const close = () => {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
    };
    const onKeydown = event => { if(event.key === "Escape") close(); };
    overlay.addEventListener("click", event => { if(event.target === overlay) close(); });
    overlay.querySelector("[data-close-month]").addEventListener("click", close);
    document.addEventListener("keydown", onKeydown);
    root.append(overlay);
    overlay.querySelector("[data-close-month]").focus();
}

export async function initPlanner(){
    const root = document.getElementById("planner");
    if(!root) return;
    const me = await loadDashboard();
    const congregation = getCongregation();
    if(!me || (!me.success && !me.fallback) || !congregation){
        root.innerHTML = `<section class="dashboard-card dashboard-full"><p>${t("noCongregationSelected", "Ingen menighet valgt.")}</p></section>`;
        return;
    }
    const [cardsResult, settingsResult, reportsResult] = await Promise.all([getJobcards(congregation), getJobcardSettings(congregation.id), getReports(congregation.id)]);
    if(!cardsResult?.success || !settingsResult?.success){
        root.innerHTML = `<section class="dashboard-card dashboard-full"><h1>${t("planner", "Planlegger")}</h1><p>${t("plannerLoadFailed", "Kunne ikke hente årsoversikten.")}</p></section>`;
        return;
    }
    const jobcards = mergeJobcardSchedules(cardsResult.jobcards || [], settingsResult).filter(card => card.visible);
    const completed = reportCompletionIndex(reportsResult?.reports);
    let year = new Date().getFullYear();
    let activeMonth = new Date().getMonth();

    const changeMonth = difference => {
        const next = activeMonth + difference;
        if(next < 0){ activeMonth = 11; year -= 1; }
        else if(next > 11){ activeMonth = 0; year += 1; }
        else activeMonth = next;
    };
    const render = () => {
        const planned = scheduledForYear(jobcards, year, completed);
        root.innerHTML = `<section class="planner-heading dashboard-full"><div><p class="page-eyebrow">${esc(congregation.name)}</p><h1>${t("planner", "Planlegger")}</h1><p>${t("plannerDescription", "Årsoversikt over planlagte jobbkort.")}</p></div><div class="planner-year-nav" aria-label="${t("selectYear", "Velg år")}"><button type="button" data-year="-1" aria-label="${t("previousYear", "Forrige år")}">‹</button><strong>${year}</strong><button type="button" data-year="1" aria-label="${t("nextYear", "Neste år")}">›</button></div></section><section class="planner-mobile-nav dashboard-full" aria-label="${t("selectMonth", "Velg måned")}"><button type="button" data-month="-1" aria-label="${t("previousMonth", "Forrige måned")}">‹</button><strong>${monthLabel(new Date(year, activeMonth, 1, 12))}</strong><button type="button" data-month="1" aria-label="${t("nextMonth", "Neste måned")}">›</button></section><section class="planner-grid dashboard-full" data-planner-grid data-active-month="${activeMonth}">${planned.map((cards, index) => renderMonth(new Date(year, index, 1, 12), cards)).join("")}</section>`;
        root.querySelectorAll("[data-year]").forEach(button => button.addEventListener("click", () => { year += Number(button.dataset.year); render(); }));
        root.querySelectorAll("[data-month]").forEach(button => button.addEventListener("click", () => { changeMonth(Number(button.dataset.month)); render(); }));
        root.querySelectorAll("[data-open-month]").forEach(button => button.addEventListener("click", () => {
            const index = Number(button.dataset.openMonth);
            openMonthDialog(root, new Date(year, index, 1, 12), planned[index]);
        }));
        const grid = root.querySelector("[data-planner-grid]");
        let startX = null;
        grid.addEventListener("pointerdown", event => { startX = event.clientX; });
        grid.addEventListener("pointerup", event => { if(startX === null) return; const difference = event.clientX - startX; startX = null; if(Math.abs(difference) < 45) return; changeMonth(difference < 0 ? 1 : -1); render(); });
    };
    render();
}
