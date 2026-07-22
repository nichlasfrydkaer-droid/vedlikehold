import { loadDashboard } from "../services/dashboard.js";
import { getJobcards, getJobcardSettings, getPlanner, getReports, markPlannerCompletion, savePlanner } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";

const MONTHS_IN_YEAR = 12;
const MIN_PLANNER_YEAR = 2026;
const INTERVALS = [1, 2, 3, 6, 12, 24];

function dateFromMonth(value){ const match = String(value || "").match(/^(\d{4})-(\d{2})/); return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1, 12) : null; }
function addMonths(date, amount){ return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12); }
function monthKey(date){ return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function monthsFor(year, firstMonth, interval){
    const first = dateFromMonth(`${year}-${String(firstMonth + 1).padStart(2, "0")}`);
    if(!first || !Number.isInteger(interval) || interval < 1) return [];
    const result = [];
    for(let cursor = first; cursor.getFullYear() === year; cursor = addMonths(cursor, interval)) result.push(monthKey(cursor));
    return result;
}
function jobcardKeys(value){ const key = String(value ?? "").trim(); const numeric = key.match(/^0*(\d+)([A-Za-z]?)$/); const normalized = numeric ? `${Number(numeric[1])}${numeric[2].toUpperCase()}` : key.toUpperCase(); return [...new Set([key, normalized])].filter(Boolean); }
function esc(value){ const element = document.createElement("span"); element.textContent = String(value ?? ""); return element.innerHTML; }
function monthLabel(date){ const label = new Intl.DateTimeFormat(document.documentElement.lang || "no", { month:"long", year:"numeric" }).format(date); return label.replace(/^./, letter => letter.toUpperCase()); }
function intervalLabel(months, fallback = ""){
    const labels = { 1:t("monthly", "Månedlig"), 2:t("everySecondMonth", "Hver 2. måned"), 3:t("quarterly", "Kvartalsvis"), 6:t("everySixMonths", "Hver 6. måned"), 12:t("annual", "Årlig"), 24:t("everySecondYear", "Hvert 2. år") };
    return labels[Number(months)] || fallback || "–";
}
function reportCompletionIndex(reports){
    const completed = new Set();
    (reports || []).forEach(report => { const date = new Date(report.finished_at || report.created_at || ""); if(!Number.isNaN(date.getTime())) jobcardKeys(report.job_number || report.jobcard_id).forEach(key => completed.add(`${key}:${monthKey(date)}`)); });
    return completed;
}
function entriesByJobcard(entries){
    const map = new Map();
    (entries || []).forEach(entry => jobcardKeys(entry.jobcard_id).forEach(key => map.set(key, entry)));
    return map;
}
function scheduledForYear(jobcards, year, completed, entries){
    const months = Array.from({ length:MONTHS_IN_YEAR }, () => []);
    const planEntries = entriesByJobcard(entries);
    jobcards.forEach(jobcard => {
        const entry = jobcardKeys(jobcard.id).map(key => planEntries.get(key)).find(Boolean);
        const interval = Number(entry ? (Number(entry.auto_interval) !== 0 ? jobcard.intervalMonths : entry.manual_interval_months) : (jobcard.autoInterval ? jobcard.intervalMonths : jobcard.manualIntervalMonths));
        const occurrences = entry ? (entry.planned_months || []) : (() => {
            const anchor = dateFromMonth(jobcard.nextExecution);
            if(!anchor || !Number.isFinite(interval) || interval < 1) return [];
            const result = [];
            for(let offset = -24; offset <= 24; offset += 1){ const occurrence = addMonths(anchor, offset * interval); if(occurrence.getFullYear() === year) result.push(monthKey(occurrence)); }
            return [...new Set(result)];
        })();
        occurrences.forEach(value => {
            const date = dateFromMonth(value); if(!date || date.getFullYear() !== year) return;
            const index = date.getMonth(); if(months[index].some(item => String(item.id) === String(jobcard.id))) return;
            const complete = jobcardKeys(jobcard.id).some(key => completed.has(`${key}:${value}`));
            months[index].push({ ...jobcard, completed:complete, executionMonth:value });
        });
    });
    return months.map(items => items.sort((left, right) => String(left.jobcard_number).localeCompare(String(right.jobcard_number), undefined, { numeric:true })));
}
function cardMarkup(card, index, moreLimit){
    return `<div class="planner-jobcard ${card.completed ? "is-completed" : ""} ${index >= moreLimit ? "is-extra" : ""}" title="${esc(card.title)}">
        <span class="planner-status" aria-label="${card.completed ? t("completed", "Utført") : t("planned", "Planlagt")}">${card.completed ? "✓" : ""}</span>
        <span class="planner-jobcard-copy"><strong><em>${esc(card.jobcard_number)}</em>${esc(card.title)}</strong></span>
        ${card.completed ? "" : `<button class="planner-card-actions" type="button" data-manual-complete="${esc(card.id)}" data-execution-month="${card.executionMonth}" aria-label="${t("plannerActions", "Flere valg")}">…</button>`}
    </div>`;
}
function renderMonth(month, cards){
    const complete = cards.filter(card => card.completed).length;
    const visibleLimit = 5;
    const extraCount = Math.max(0, cards.length - visibleLimit);
    return `<article class="planner-month-card" data-planner-month="${month.getMonth()}"><header><h2>${monthLabel(month)}</h2><span>${complete}/${cards.length}</span></header><div class="planner-month-list">${cards.length ? cards.map((card, index) => cardMarkup(card, index, visibleLimit)).join("") : `<p class="planner-empty">${t("noJobcardsPlanned", "Ingen planlagte jobbkort.")}</p>`}${extraCount ? `<button class="planner-more" type="button" data-open-month="${month.getMonth()}">${t("plannerMoreItems", "+ {count} flere").replace("{count}", extraCount)}</button>` : ""}</div></article>`;
}
function closeOverlay(overlay){ overlay.remove(); }
function openMonthDialog(root, month, cards, onAction){
    const complete = cards.filter(card => card.completed).length;
    const overlay = document.createElement("div"); overlay.className = "planner-month-overlay";
    overlay.innerHTML = `<section class="planner-month-dialog" role="dialog" aria-modal="true"><header><div><h2>${monthLabel(month)}</h2><p>${complete}/${cards.length}</p></div><button type="button" data-close aria-label="${t("close", "Lukk")}">×</button></header><div class="planner-month-dialog-list">${cards.map(card => cardMarkup(card, -1, Infinity)).join("")}</div></section>`;
    const close = () => closeOverlay(overlay); overlay.addEventListener("click", event => { if(event.target === overlay) close(); }); overlay.querySelector("[data-close]").addEventListener("click", close);
    overlay.querySelectorAll("[data-manual-complete]").forEach(button => button.addEventListener("click", () => { close(); onAction(button.dataset.manualComplete, button.dataset.executionMonth); })); root.append(overlay);
}
function openPlannerActionsMenu(root, card, executionMonth, onManualComplete){
    const overlay = document.createElement("div"); overlay.className = "planner-month-overlay planner-actions-overlay";
    overlay.innerHTML = `<section class="planner-actions-menu" role="dialog" aria-modal="true" aria-label="${t("plannerActions", "Flere valg")}"><button class="planner-close" type="button" data-close aria-label="${t("close", "Lukk")}">×</button><header><p class="page-eyebrow">${esc(card.jobcard_number)}</p><h2>${esc(card.title)}</h2></header><div class="planner-actions-list"><button type="button" data-manual-complete><span class="planner-actions-icon" aria-hidden="true">✓</span><span><strong>${t("manualApproval", "Manuell godkjenning")}</strong><small>${t("manualApprovalDescription", "Registrer jobbkortet som utført uten rapport.")}</small></span><span class="planner-actions-arrow" aria-hidden="true">›</span></button></div></section>`;
    const close = () => closeOverlay(overlay);
    overlay.addEventListener("click", event => { if(event.target === overlay) close(); });
    overlay.querySelector("[data-close]").addEventListener("click", close);
    overlay.querySelector("[data-manual-complete]").addEventListener("click", () => { close(); onManualComplete(executionMonth); });
    root.append(overlay);
}
function openManualCompleteDialog(root, card, executionMonth, onConfirm){
    const overlay = document.createElement("div"); overlay.className = "planner-month-overlay";
    const month = dateFromMonth(executionMonth);
    overlay.innerHTML = `<section class="planner-confirm-dialog" role="dialog" aria-modal="true"><button class="planner-close" type="button" data-close aria-label="${t("close", "Lukk")}">×</button><header><p class="page-eyebrow">${t("manualApproval", "Manuell godkjenning")}</p><h2>${t("markJobcardCompleted", "Marker jobbkort som utført")}</h2><p class="planner-confirm-jobcard"><strong>${esc(card.jobcard_number)}</strong><span>${esc(card.title)}</span></p></header><label>${t("executionMonth", "Utført måned")}<select data-month>${Array.from({length:12}, (_, index) => `<option value="${index}" ${index === month.getMonth() ? "selected" : ""}>${monthLabel(new Date(month.getFullYear(), index, 1, 12))}</option>`).join("")}</select></label><footer><button type="button" class="button-secondary" data-close>${t("cancel", "Avbryt")}</button><button type="button" class="button-primary" data-confirm>${t("confirm", "Bekreft")}</button></footer></section>`;
    const close = () => closeOverlay(overlay); overlay.addEventListener("click", event => { if(event.target === overlay) close(); }); overlay.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", close)); overlay.querySelector("[data-confirm]").addEventListener("click", () => { const selected = Number(overlay.querySelector("[data-month]").value); close(); onConfirm(`${month.getFullYear()}-${String(selected + 1).padStart(2, "0")}`); }); root.append(overlay);
}
function freshEntries(jobcards, year){
    return jobcards.map(card => ({ jobcard_id:String(card.id), planned_months:[], auto_interval:card.autoInterval !== false, manual_interval_months:card.manualIntervalMonths || card.intervalMonths || 12, selected:false, first_month:0 }));
}
function continuedEntries(jobcards, year, current){
    const currentById = entriesByJobcard(current?.entries);
    const planned = scheduledForYear(jobcards, year, new Set(), current?.entries || []);
    const byId = new Map(); planned.flat().forEach(card => { const item = byId.get(String(card.id)) || []; item.push(card.executionMonth); byId.set(String(card.id), item); });
    return jobcards.map(card => { const stored = jobcardKeys(card.id).map(key => currentById.get(key)).find(Boolean); const months = byId.get(String(card.id)) || []; return { jobcard_id:String(card.id), planned_months:months, auto_interval:stored ? Number(stored.auto_interval) !== 0 : card.autoInterval !== false, manual_interval_months:stored?.manual_interval_months || card.manualIntervalMonths || card.intervalMonths || 12, selected:months.length > 0, first_month:months[0] ? dateFromMonth(months[0]).getMonth() : 0 }; });
}
function buildEditableEntry(state, card, year){
    const interval = state.auto_interval ? Number(card.intervalMonths) : Number(state.manual_interval_months);
    return { ...state, planned_months:state.selected ? monthsFor(year, Number(state.first_month), interval) : [] };
}
function openPlanEditor(root, { year, jobcards, existing, onSaved }){
    const overlay = document.createElement("div"); overlay.className = "planner-month-overlay planner-editor-overlay";
    const hasPlan = Boolean(existing?.plan);
    let mode = existing?.plan?.mode || "manual";
    let state = hasPlan
        ? jobcards.map(card => { const entry = (existing.entries || []).find(item => String(item.jobcard_id) === String(card.id)); const first = entry?.planned_months?.[0] ? dateFromMonth(entry.planned_months[0]).getMonth() : 0; return { jobcard_id:String(card.id), planned_months:entry?.planned_months || [], auto_interval:entry ? Number(entry.auto_interval) !== 0 : card.autoInterval !== false, manual_interval_months:entry?.manual_interval_months || card.manualIntervalMonths || card.intervalMonths || 12, selected:Boolean(entry?.planned_months?.length), first_month:first }; })
        : null;
    const close = () => closeOverlay(overlay);
    const persist = async () => {
        const missing = state.filter(item => !item.selected).map(item => jobcards.find(card => String(card.id) === item.jobcard_id)).filter(Boolean);
        if(missing.length && !window.confirm(`${t("plannerMissingConfirm", "Følgende jobbkort mangler planlegging. Vil du fortsette?")}\n\n${missing.map(card => `${card.jobcard_number} ${card.title}`).join("\n")}`)) return;
        const entries = state.map(item => { const card = jobcards.find(value => String(value.id) === item.jobcard_id); return buildEditableEntry(item, card, year); });
        const result = await savePlanner({ congregation_id:existing.congregation_id, year, mode, entries });
        if(!result?.success){ window.alert(t("plannerSaveFailed", "Kunne ikke lagre årsplanen.")); return; }
        close(); await onSaved();
    };
    const drawRows = () => state.map((item, index) => {
        const card = jobcards[index]; const interval = item.auto_interval ? card.intervalMonths : item.manual_interval_months;
        return `<article class="planner-edit-row ${item.selected ? "is-selected" : ""}" data-row="${index}"><label class="planner-edit-enabled"><input type="checkbox" data-enabled="${index}" ${item.selected ? "checked" : ""}><span>${esc(card.jobcard_number)} ${esc(card.title)}</span></label><div class="planner-edit-controls"><label>${t("firstExecutionMonth", "Første utførelsesmåned")}<select data-first-month="${index}" ${item.selected ? "" : "disabled"}>${Array.from({length:12}, (_, month) => `<option value="${month}" ${Number(item.first_month) === month ? "selected" : ""}>${monthLabel(new Date(year, month, 1, 12))}</option>`).join("")}</select></label><label class="planner-edit-switch"><span>${item.auto_interval ? t("automatic", "Automatisk") : t("manual", "Manuell")}</span><input type="checkbox" data-auto="${index}" ${item.auto_interval ? "checked" : ""} ${item.selected ? "" : "disabled"}></label><label>${t("interval", "Intervall")}<select data-interval="${index}" ${item.selected && !item.auto_interval ? "" : "disabled"}>${INTERVALS.map(value => `<option value="${value}" ${Number(interval) === value ? "selected" : ""}>${intervalLabel(value)}</option>`).join("")}</select></label></div></article>`;
    }).join("");
    const draw = () => {
        overlay.innerHTML = `<section class="planner-editor-dialog" role="dialog" aria-modal="true"><header><div><p class="page-eyebrow">${year}</p><h2>${t("planYear", "Planlegg året")}</h2><p>${t("plannerEditorDescription", "Velg første utførelsesmåned. Gjentakelser fylles inn automatisk.")}</p></div><button type="button" data-close aria-label="${t("close", "Lukk")}">×</button></header><div class="planner-plan-mode"><button type="button" data-mode="continued" class="${mode === "continued" ? "is-selected" : ""}">${t("continueIntervals", "Fortsett intervall fra {year}").replace("{year}", year - 1)}</button><button type="button" data-mode="manual" class="${mode === "manual" ? "is-selected" : ""}">${t("planYearFromScratch", "Planlegg hele året på nytt")}</button></div><div class="planner-edit-list">${state ? drawRows() : ""}</div><aside class="planner-missing-info"><strong>${t("missingPlanning", "Mangler planlegging")}</strong><span>${state?.filter(item => !item.selected).map(item => { const card = jobcards.find(value => String(value.id) === item.jobcard_id); return `${card?.jobcard_number || ""} ${card?.title || ""}`; }).join(" · ") || t("allJobcardsPlanned", "Alle jobbkort er planlagt.")}</span></aside><footer><button type="button" class="button-secondary" data-close>${t("cancel", "Avbryt")}</button><button type="button" class="button-primary" data-save>${t("savePlan", "Lagre plan")}</button></footer></section>`;
        overlay.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", close));
        overlay.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => { mode = button.dataset.mode; if(mode === "continued") state = continuedEntries(jobcards, year, existing); else if(!hasPlan) state = freshEntries(jobcards, year); draw(); }));
        overlay.querySelectorAll("[data-enabled]").forEach(input => input.addEventListener("change", () => { state[Number(input.dataset.enabled)].selected = input.checked; draw(); }));
        overlay.querySelectorAll("[data-first-month]").forEach(select => select.addEventListener("change", () => { state[Number(select.dataset.firstMonth)].first_month = Number(select.value); }));
        overlay.querySelectorAll("[data-auto]").forEach(input => input.addEventListener("change", () => { state[Number(input.dataset.auto)].auto_interval = input.checked; draw(); }));
        overlay.querySelectorAll("[data-interval]").forEach(select => select.addEventListener("change", () => { state[Number(select.dataset.interval)].manual_interval_months = Number(select.value); }));
        overlay.querySelector("[data-save]").addEventListener("click", persist);
    };
    overlay.addEventListener("click", event => { if(event.target === overlay) close(); }); root.append(overlay);
    if(!state){
        overlay.innerHTML = `<section class="planner-choice-dialog" role="dialog" aria-modal="true"><button class="planner-close" type="button" data-close aria-label="${t("close", "Lukk")}">×</button><h2>${t("planYear", "Planlegg året")} ${year}</h2><p>${t("plannerYearChoice", "Velg hvordan du vil starte årsplanen.")}</p><button type="button" data-choice="continued"><strong>${t("continueIntervals", "Fortsett intervall fra {year}").replace("{year}", year - 1)}</strong><span>${t("continueIntervalsDescription", "Bruk forrige års plan som utgangspunkt.")}</span></button><button type="button" data-choice="manual"><strong>${t("planYearFromScratch", "Planlegg hele året på nytt")}</strong><span>${t("planFromScratchDescription", "Velg første utførelsesmåned for hvert jobbkort.")}</span></button></section>`;
        overlay.querySelector("[data-close]").addEventListener("click", close);
        overlay.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => { mode = button.dataset.choice; state = mode === "continued" ? continuedEntries(jobcards, year, existing) : freshEntries(jobcards, year); draw(); }));
    } else draw();
}

export async function initPlanner(){
    const root = document.getElementById("planner"); if(!root) return;
    const me = await loadDashboard(); const congregation = getCongregation();
    if(!me || (!me.success && !me.fallback) || !congregation){ root.innerHTML = `<section class="dashboard-card dashboard-full"><p>${t("noCongregationSelected", "Ingen menighet valgt.")}</p></section>`; return; }
    const [cardsResult, settingsResult, reportsResult] = await Promise.all([getJobcards(congregation), getJobcardSettings(congregation.id), getReports(congregation.id)]);
    if(!cardsResult?.success || !settingsResult?.success){ root.innerHTML = `<section class="dashboard-card dashboard-full"><h1>${t("planner", "Planlegger")}</h1><p>${t("plannerLoadFailed", "Kunne ikke hente årsoversikten.")}</p></section>`; return; }
    const jobcards = mergeJobcardSchedules(cardsResult.jobcards || [], settingsResult).filter(card => card.visible);
    const completed = reportCompletionIndex(reportsResult?.reports);
    let year = new Date().getFullYear(); let activeMonth = new Date().getMonth(); let planData = null;
    const refreshPlan = async () => { const result = await getPlanner(congregation.id, year); planData = result?.success ? { ...result, congregation_id:congregation.id } : { congregation_id:congregation.id, plan:null, entries:[], manualCompletions:[] }; (planData.manualCompletions || []).forEach(item => jobcardKeys(item.jobcard_id).forEach(key => completed.add(`${key}:${item.execution_month}`))); };
    const render = async () => {
        await refreshPlan(); const planned = scheduledForYear(jobcards, year, completed, planData.entries);
        root.innerHTML = `<section class="planner-heading dashboard-full"><div class="planner-title"><p class="page-eyebrow">${esc(congregation.name)}</p><h1>${t("planner", "Planlegger")}</h1><p>${t("plannerDescription", "Årsoversikt over planlagte jobbkort.")}</p></div><div class="planner-year-nav" aria-label="${t("selectYear", "Velg år")}"><button type="button" data-year="-1" aria-label="${t("previousYear", "Forrige år")}" ${year <= MIN_PLANNER_YEAR ? "disabled" : ""}>‹</button><strong>${year}</strong><button type="button" data-year="1" aria-label="${t("nextYear", "Neste år")}">›</button></div><button class="planner-year-action" type="button" data-plan-year>${t("planYear", "Planlegg året")}</button></section><section class="planner-mobile-nav dashboard-full" aria-label="${t("selectMonth", "Velg måned")}"><button type="button" data-month="-1" aria-label="${t("previousMonth", "Forrige måned")}" ${year <= MIN_PLANNER_YEAR && activeMonth === 0 ? "disabled" : ""}>‹</button><strong>${monthLabel(new Date(year, activeMonth, 1, 12))}</strong><button type="button" data-month="1" aria-label="${t("nextMonth", "Neste måned")}">›</button></section><section class="planner-grid dashboard-full" data-planner-grid data-active-month="${activeMonth}">${planned.map((cards, index) => renderMonth(new Date(year, index, 1, 12), cards)).join("")}</section>`;
        root.querySelectorAll("[data-year]").forEach(button => button.addEventListener("click", async () => { const nextYear = year + Number(button.dataset.year); if(nextYear < MIN_PLANNER_YEAR) return; year = nextYear; await render(); }));
        root.querySelectorAll("[data-month]").forEach(button => button.addEventListener("click", async () => { activeMonth = Math.max(0, Math.min(11, activeMonth + Number(button.dataset.month))); await render(); }));
        root.querySelector("[data-plan-year]").addEventListener("click", () => openPlanEditor(root, { year, jobcards, existing:planData, onSaved:render }));
        const complete = (id, executionMonth) => { const card = jobcards.find(item => String(item.id) === String(id)); if(card) openManualCompleteDialog(root, card, executionMonth, async selectedMonth => { const result = await markPlannerCompletion({ congregation_id:congregation.id, year, jobcard_id:String(id), execution_month:selectedMonth }); if(result?.success){ jobcardKeys(id).forEach(key => completed.add(`${key}:${selectedMonth}`)); await render(); } else window.alert(t("plannerCompletionFailed", "Kunne ikke markere jobbkortet som utført.")); }); };
        const openActions = (id, executionMonth) => { const card = jobcards.find(item => String(item.id) === String(id)); if(card) openPlannerActionsMenu(root, card, executionMonth, selectedMonth => complete(id, selectedMonth)); };
        root.querySelectorAll("[data-manual-complete]").forEach(button => button.addEventListener("click", () => openActions(button.dataset.manualComplete, button.dataset.executionMonth)));
        root.querySelectorAll("[data-open-month]").forEach(button => button.addEventListener("click", () => { const index = Number(button.dataset.openMonth); openMonthDialog(root, new Date(year, index, 1, 12), planned[index], openActions); }));
    };
    await render();
}
