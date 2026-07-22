import { loadDashboard } from "../services/dashboard.js";
import { getJobcards, getJobcardSettings, getPlanner, savePlanner } from "../js/api.js";
import { getCongregation } from "../js/session.js";
import { mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";

const INTERVALS = [1, 2, 3, 6, 12, 24];

function esc(value){ const node = document.createElement("span"); node.textContent = String(value ?? ""); return node.innerHTML; }
function monthLabel(year, month){ const label = new Intl.DateTimeFormat(document.documentElement.lang || "no", { month:"long", year:"numeric" }).format(new Date(year, month, 1, 12)); return label.replace(/^./, value => value.toUpperCase()); }
function intervalLabel(value){ return ({ 1:t("monthly", "Månedlig"), 2:t("everySecondMonth", "Hver 2. måned"), 3:t("quarterly", "Kvartalsvis"), 6:t("everySixMonths", "Hver 6. måned"), 12:t("annual", "Årlig"), 24:t("everySecondYear", "Hvert 2. år") })[Number(value)] || "–"; }
function dateFromMonth(value){ const match = String(value || "").match(/^(\d{4})-(\d{2})/); return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1, 12) : null; }
function monthKey(year, month){ return `${year}-${String(month + 1).padStart(2, "0")}`; }
function cardEntry(entries, card){ return (entries || []).find(entry => String(entry.jobcard_id) === String(card.id)); }
function monthsFor(year, firstMonth, interval){ const result = []; for(let month = Number(firstMonth); month < 12; month += Number(interval)){ result.push(monthKey(year, month)); } return result; }
function freshState(cards){ return cards.map(card => ({ jobcard_id:String(card.id), selected:true, first_month:0, auto_interval:card.autoInterval !== false, manual_interval_months:Number(card.manualIntervalMonths || card.intervalMonths || 12), planned_months:[] })); }
function existingState(cards, entries){ return cards.map(card => { const entry = cardEntry(entries, card); const first = dateFromMonth(entry?.planned_months?.[0]); return { jobcard_id:String(card.id), selected:Boolean(entry?.planned_months?.length), first_month:first?.getMonth() ?? 0, auto_interval:entry ? Number(entry.auto_interval) !== 0 : card.autoInterval !== false, manual_interval_months:Number(entry?.manual_interval_months || card.manualIntervalMonths || card.intervalMonths || 12), planned_months:entry?.planned_months || [] }; }); }
function continuedState(cards, previousEntries){ return cards.map(card => { const entry = cardEntry(previousEntries, card); const first = dateFromMonth(entry?.planned_months?.[0]); const auto = entry ? Number(entry.auto_interval) !== 0 : card.autoInterval !== false; const interval = Number(auto ? card.intervalMonths : entry?.manual_interval_months || card.manualIntervalMonths || card.intervalMonths || 12); const isEverySecondYear = interval === 24 && entry?.planned_months?.length; return { jobcard_id:String(card.id), selected:Boolean(entry?.planned_months?.length) && !isEverySecondYear, first_month:first?.getMonth() ?? 0, auto_interval:auto, manual_interval_months:Number(entry?.manual_interval_months || card.manualIntervalMonths || card.intervalMonths || 12), planned_months:[] }; }); }
function canPlan(year){ const now = new Date(); return year <= now.getFullYear() || now >= new Date(year - 1, 11, 1); }
const eyeIcon = `<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>`;

export async function initPlannerEdit(){
    const root = document.getElementById("planner-edit");
    const me = await loadDashboard(); const congregation = getCongregation();
    if(!root || !me || (!me.success && !me.fallback) || !congregation) return;
    const requestedYear = Number(new URLSearchParams(location.search).get("year"));
    const year = Number.isInteger(requestedYear) && requestedYear >= 2026 ? requestedYear : new Date().getFullYear();
    if(!canPlan(year)){
        root.innerHTML = `<section class="planner-edit-page dashboard-full"><a class="planner-back-link" href="/dashboard/planner.html">← ${t("backToPlanner", "Tilbake til årsoversikt")}</a><section class="planner-locked-card"><h1>${t("planYear", "Planlegg året")} ${year}</h1><p>${t("plannerLockedUntil", "Planlegging av {year} kan utføres fra 1. desember {previousYear}.").replace("{year}", year).replace("{previousYear}", year - 1)}</p></section></section>`;
        return;
    }
    const [cardsResult, settingsResult, currentResult, previousResult] = await Promise.all([getJobcards(congregation), getJobcardSettings(congregation.id), getPlanner(congregation.id, year), getPlanner(congregation.id, year - 1)]);
    if(!cardsResult?.success || !settingsResult?.success){ root.innerHTML = `<section class="dashboard-card dashboard-full"><p>${t("plannerLoadFailed", "Kunne ikke hente årsoversikten.")}</p></section>`; return; }
    const cards = mergeJobcardSchedules(cardsResult.jobcards || [], settingsResult).filter(card => card.visible);
    const current = currentResult?.success ? currentResult : { plan:null, entries:[] };
    const previous = previousResult?.success ? previousResult : { plan:null, entries:[] };
    let mode = current.plan?.mode || (previous.plan ? "choice" : "manual");
    let state = current.plan ? existingState(cards, current.entries) : (previous.plan ? null : freshState(cards));
    const save = async () => {
        const missing = state.filter(item => !item.selected).map(item => cards.find(card => String(card.id) === item.jobcard_id)).filter(Boolean);
        if(missing.length && !window.confirm(`${t("plannerMissingConfirm", "Følgende jobbkort mangler planlegging. Vil du fortsette?")}\n\n${missing.map(card => `${card.jobcard_number} ${card.title}`).join("\n")}`)) return;
        const entries = state.map(item => { const card = cards.find(value => String(value.id) === item.jobcard_id); const interval = item.auto_interval ? Number(card.intervalMonths) : Number(item.manual_interval_months); return { ...item, planned_months:item.selected ? monthsFor(year, item.first_month, interval) : [] }; });
        const result = await savePlanner({ congregation_id:congregation.id, year, mode, entries });
        if(!result?.success){ window.alert(t("plannerSaveFailed", "Kunne ikke lagre årsplanen.")); return; }
        location.href = `/dashboard/planner.html?year=${year}`;
    };
    const rows = () => state.map((item, index) => {
        const card = cards[index]; const shownInterval = item.auto_interval ? card.intervalMonths : item.manual_interval_months;
        const visibilityLabel = (item.selected ? t("hideJobcardYear", "Skjul jobbkort i {year}") : t("showJobcardYear", "Vis jobbkort i {year}")).replace("{year}", year);
        return `<article class="planner-edit-row ${item.selected ? "is-selected" : "is-hidden"}"><div class="planner-edit-title"><strong><em>${esc(card.jobcard_number)}</em>${esc(card.title)}</strong><button type="button" class="planner-visibility-button" data-visibility="${index}" aria-pressed="${item.selected}">${eyeIcon}${visibilityLabel}</button></div><div class="planner-edit-controls"><label>${t("firstExecutionMonth", "Første utførelsesmåned")}<select data-first="${index}" ${item.selected ? "" : "disabled"}>${Array.from({ length:12 }, (_, month) => `<option value="${month}" ${Number(item.first_month) === month ? "selected" : ""}>${monthLabel(year, month)}</option>`).join("")}</select></label><label class="planner-edit-switch"><span data-switch-copy="${index}">${item.auto_interval ? t("automatic", "Automatisk") : t("manual", "Manuell")}</span><input type="checkbox" data-auto="${index}" ${item.auto_interval ? "checked" : ""} ${item.selected ? "" : "disabled"}></label><label>${t("interval", "Intervall")}<select data-interval="${index}" ${item.selected && !item.auto_interval ? "" : "disabled"}>${INTERVALS.map(value => `<option value="${value}" ${Number(shownInterval) === value ? "selected" : ""}>${intervalLabel(value)}</option>`).join("")}</select></label></div></article>`;
    }).join("");
    const render = () => {
        const missing = state?.filter(item => !item.selected).map(item => cards.find(card => String(card.id) === item.jobcard_id)).filter(Boolean) || [];
        root.innerHTML = `<section class="planner-edit-page dashboard-full"><a class="planner-back-link" href="/dashboard/planner.html?year=${year}">← ${t("backToPlanner", "Tilbake til årsoversikt")}</a><header class="planner-edit-page-header"><p class="page-eyebrow">${year}</p><h1>${t("planYear", "Planlegg året")}</h1><p>${t("plannerEditorDescription", "Velg første utførelsesmåned. Gjentakelser fylles inn automatisk.")}</p></header>${state ? `<div class="planner-edit-list planner-edit-page-list">${rows()}</div><aside class="planner-missing-info"><strong>${t("missingPlanning", "Mangler planlegging")}</strong><span>${missing.length ? missing.map(card => `${card.jobcard_number} ${card.title}`).join(" · ") : t("allJobcardsPlanned", "Alle jobbkort er planlagt.")}</span></aside><footer class="planner-edit-page-footer"><button type="button" class="button-secondary" data-cancel>${t("cancel", "Avbryt")}</button><button type="button" class="button-primary" data-save>${t("savePlan", "Lagre plan")}</button></footer>` : `<section class="planner-edit-choice"><h2>${t("plannerYearChoice", "Velg hvordan du vil starte årsplanen.")}</h2><button type="button" data-continue><strong>${t("continueIntervals", "Fortsett intervall fra {year}").replace("{year}", year - 1)}</strong><span>${t("continueIntervalsDescription", "Bruk forrige års plan som utgangspunkt.")}</span></button><button type="button" data-manual><strong>${t("planYearFromScratch", "Planlegg hele året på nytt")}</strong><span>${t("planFromScratchDescription", "Velg første utførelsesmåned for hvert jobbkort.")}</span></button></section>`}</section>`;
        root.querySelector("[data-cancel]")?.addEventListener("click", () => location.href = `/dashboard/planner.html?year=${year}`);
        root.querySelector("[data-save]")?.addEventListener("click", save);
        root.querySelector("[data-continue]")?.addEventListener("click", () => { mode = "continued"; state = continuedState(cards, previous.entries); render(); });
        root.querySelector("[data-manual]")?.addEventListener("click", () => { mode = "manual"; state = freshState(cards); render(); });
        root.querySelectorAll("[data-visibility]").forEach(button => button.addEventListener("click", () => { state[Number(button.dataset.visibility)].selected = !state[Number(button.dataset.visibility)].selected; render(); }));
        root.querySelectorAll("[data-first]").forEach(select => select.addEventListener("change", () => { state[Number(select.dataset.first)].first_month = Number(select.value); }));
        root.querySelectorAll("[data-auto]").forEach(input => input.addEventListener("change", () => { state[Number(input.dataset.auto)].auto_interval = input.checked; render(); }));
        root.querySelectorAll("[data-interval]").forEach(select => select.addEventListener("change", () => { state[Number(select.dataset.interval)].manual_interval_months = Number(select.value); }));
    };
    render();
}
