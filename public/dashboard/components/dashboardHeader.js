import { getCongregation } from "../js/session.js";
import { getActivity, markActivitySeen } from "../js/api.js";
import { renderCongregationSelector, initCongregationSelector } from "./dashboardCongregationSelector.js";
import { t } from "../js/i18n.js";

function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
}

function closeActivityPanel(){
    document.querySelector(".dashboard-notification-panel")?.remove();
}

const activityVisuals = {
    report_created:{ icon:"report", tone:"report", label:"activityReportCompleted", fallback:"Jobbkort utført", actorLabel:"performedBy", actorFallback:"Utført av" },
    task_completed:{ icon:"check", tone:"completed", label:"activityTaskCompleted", fallback:"Oppgave utført", actorLabel:"performedBy", actorFallback:"Utført av" },
    task_created:{ icon:"plus", tone:"created", label:"activityTaskCreated", fallback:"Oppgave opprettet" },
    task_started:{ icon:"play", tone:"started", label:"activityTaskStarted", fallback:"Oppgave startet" },
    task_reopened:{ icon:"reopen", tone:"reopened", label:"activityTaskReopened", fallback:"Oppgave gjenåpnet" },
    task_updated:{ icon:"edit", tone:"updated", label:"activityTaskUpdated", fallback:"Oppgave oppdatert" },
    jobcard_reminder_sent:{ icon:"bell", tone:"reminder", label:"activityJobcardReminderSent", fallback:"Påminnelse sendt" },
    jobcard_assignment_created:{ icon:"user", tone:"created", label:"activityJobcardAssigned", fallback:"Jobbkort fast tildelt" },
    jobcard_assignment_updated:{ icon:"user", tone:"updated", label:"activityJobcardAssigned", fallback:"Jobbkort fast tildelt" }
};

function activityIcon(name){
    const icons = {
        report:"<path d='M6 3h9l4 4v14H6z'/><path d='M15 3v5h5M9 14h6M9 18h5'/>",
        check:"<circle cx='12' cy='12' r='9'/><path d='m8 12 2.5 2.5L16 9'/>",
        plus:"<path d='M12 5v14M5 12h14'/>",
        play:"<path d='m9 6 9 6-9 6z'/>",
        reopen:"<path d='M4 12a8 8 0 1 0 2.4-5.7'/><path d='M4 5v5h5'/>",
        edit:"<path d='m4 20 4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16z'/><path d='m13.5 7.5 3 3'/>",
        bell:"<path d='M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'/>",
        user:"<circle cx='12' cy='8' r='3'/><path d='M5 21c.8-3.6 3.2-5.5 7-5.5s6.2 1.9 7 5.5'/>"
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.report}</svg>`;
}

function formatActivityDate(value){
    if(!value) return "";
    const date = new Date(`${String(value).replace(" ", "T")}Z`);
    if(Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(date);
}

function renderActivityCard(item){
    const visual = activityVisuals[item.action] || { icon:"report", tone:"updated", label:"activityUpdated", fallback:"Oppdatert" };
    const actor = String(item.actor_name || "").trim();
    const actorText = actor ? `${t(visual.actorLabel || "by", visual.actorFallback || "Av")}: ${escapeHtml(actor)} · ` : "";
    return `<a class="activity-news-card activity-news-${visual.tone}" href="${escapeHtml(item.target_url || "#")}"><span class="activity-news-icon">${activityIcon(visual.icon)}</span><span class="activity-news-copy"><strong>${t(visual.label, visual.fallback)}</strong><span>${escapeHtml(item.title || item.object_type || "")}</span><small>${actorText}${escapeHtml(formatActivityDate(item.created_at))}</small></span></a>`;
}

function renderActivityPanel(items){
    const panel = document.createElement("section");
    panel.className = "dashboard-notification-panel";
    panel.style.cssText += "max-height:calc(100vh - 76px);max-height:calc(100dvh - 76px);overflow-y:auto;scrollbar-gutter:stable;";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t("newSinceLastLogin", "Nytt siden sist"));
    panel.innerHTML = `<h2>${t("newSinceLastLogin", "Nytt siden sist")}</h2><div class="activity-news-list">${items.length
        ? items.slice(0, 20).map(renderActivityCard).join("")
        : `<p>${t("noNewActivity", "Ingen nye aktiviteter.")}</p>`}</div>`;
    panel.addEventListener("click", (event) => event.stopPropagation());
    document.body.appendChild(panel);
    setTimeout(() => document.addEventListener("click", closeActivityPanel, { once:true }), 0);
}

function initActivityBell(congregation){
    const bell = document.getElementById("activityBell");
    const badge = document.getElementById("activityBadge");
    if(!bell || !congregation?.id) return;

    const refreshBadge = async () => {
        const result = await getActivity(congregation.id);
        if(result?.unseen){
            badge.hidden = false;
            badge.textContent = result.unseen > 99 ? "99+" : result.unseen;
        }
        return result?.items || [];
    };

    refreshBadge().catch(() => {});

    bell.addEventListener("click", async (event) => {
        event.stopImmediatePropagation();
        event.stopPropagation();
        if(document.querySelector(".dashboard-notification-panel")){
            closeActivityPanel();
            return;
        }
        const items = await refreshBadge().catch(() => []);
        renderActivityPanel(items);
        badge.hidden = true;
        markActivitySeen(congregation.id).catch(() => {});
    });
}

export function renderDashboardHeader(target = document.getElementById("dashboard")){
    const root = typeof target === "string" ? document.getElementById(target) : target;
    if(!root || document.getElementById("dashboardHeader")) return;

    const congregation = getCongregation();
    const language = (congregation?.language || "no").toUpperCase();
    root.insertAdjacentHTML("afterbegin", `<header id="dashboardHeader" class="dashboard-header">
        <button id="menuButton" class="dashboard-mobile-menu" aria-label="${t("menu", "Meny")}"><span></span><span></span><span></span></button>
        <div class="dashboard-top-context"><strong>${escapeHtml(congregation?.name || "")}</strong><span>${language}</span></div>
        <button id="activityBell" class="dashboard-bell" type="button" aria-label="${t("newSinceLastLogin", "Nytt siden sist")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><b id="activityBadge" hidden>0</b></button>
    </header>`);

    initActivityBell(congregation);
    setTimeout(() => {
        const user = document.querySelector(".dashboard-sidebar-user");
        if(user && !document.getElementById("congregationButton")){
            user.insertAdjacentHTML("afterbegin", renderCongregationSelector());
            initCongregationSelector();
        }
    }, 0);
}
