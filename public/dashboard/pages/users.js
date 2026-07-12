import { loadDashboard } from "../services/dashboard.js";
import { getCongregation } from "../js/session.js";
import { getMembers, inviteMember, updateMember, updateMemberReportRecipient, removeMember } from "../js/api.js";
import { t } from "../js/i18n.js";

const safe = (value) => String(value || "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const reportIcon = (enabled) => enabled
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`;

export async function initUsers(){
    const me = await loadDashboard();
    const main = document.querySelector("main");
    const congregation = getCongregation();
    if(!me?.success || !congregation){
        main.innerHTML = `<section class='dashboard-card dashboard-full'><h2>${t("users","Brukere")}</h2><p>${t("selectCongregationFirst","Velg en menighet først.")}</p></section>`;
        return;
    }
    const render = async () => {
        const data = await getMembers(congregation.id);
        if(!data.success){
            main.innerHTML = `<section class="dashboard-card dashboard-full"><h2>${t("users","Brukere")}</h2><p>${safe(data.message || t("usersLoadFailed","Kunne ikke hente brukere."))}</p></section>`;
            return;
        }
        const canManage = data.canManageMembers;
        const members = data.members.map((member) => {
            const receivesReports = !!member.receives_reports;
            const recipientControl = canManage && member.role === "member"
                ? `<div class="member-report-setting"><span>${t("receiveReports","Motta rapporter")}</span><button type="button" class="report-recipient-toggle ${receivesReports ? "is-enabled" : "is-disabled"}" data-report-recipient="${member.id}" aria-pressed="${receivesReports}" aria-label="${receivesReports ? t("reportRecipientEnabled","Mottar rapporter") : t("reportRecipientDisabled","Mottar ikke rapporter")}" title="${receivesReports ? t("reportRecipientEnabled","Mottar rapporter") : t("reportRecipientDisabled","Mottar ikke rapporter")}">${reportIcon(receivesReports)}</button></div>`
                : "";
            return `<article class="member-row"><div class="member-avatar">${safe(member.name).slice(0,1).toUpperCase()}</div><div class="member-main"><strong>${safe(member.name)}</strong><span>${safe(member.email)}</span></div><span class="role-pill ${member.role}">${member.role === "admin" ? t("administrator","Administrator") : t("member","Medlem")}</span>${recipientControl}${data.canManageAdmins ? `<select data-role="${member.id}" aria-label="${t("role","Rolle")}"><option value="member" ${member.role === "member" ? "selected" : ""}>${t("member","Medlem")}</option><option value="admin" ${member.role === "admin" ? "selected" : ""}>${t("administrator","Administrator")}</option></select>` : ""}${canManage ? `<button class="text-danger" data-remove="${member.id}">${t("remove","Fjern")}</button>` : ""}</article>`;
        }).join("") || `<p>${t("noMembersYet","Ingen medlemmer ennå.")}</p>`;
        main.innerHTML = `<section class="dashboard-card dashboard-full management-heading"><div><p class="page-eyebrow">${safe(congregation.name)}</p><h2>${t("users","Brukere")}</h2><p>${t("usersDescription","Administrer hvem som har tilgang til denne menigheten.")}</p></div></section><section class="dashboard-card dashboard-full member-card"><h3>${t("usersWithAccess","Brukere med tilgang")}</h3><div class="member-list">${members}</div></section>${canManage ? `<section class="dashboard-card dashboard-full member-card"><h3>${t("grantUserAccess","Gi en bruker tilgang")}</h3><p class="section-help">${t("inviteMemberHelp","Eksisterende brukere får tilgang med én gang. Nye brukere mottar en invitasjon som er gyldig i 7 dager.")}</p><form id="inviteForm" class="inline-form"><input name="email" type="email" placeholder="navn@eksempel.no" required><select name="role">${data.canManageAdmins ? `<option value="member">${t("member","Medlem")}</option><option value="admin">${t("administrator","Administrator")}</option>` : `<option value="member">${t("member","Medlem")}</option>`}</select><button type="submit">${t("sendInvitation","Send invitasjon")}</button></form><p id="memberStatus" class="form-status"></p></section>` : ""}`;
        main.querySelectorAll("[data-role]").forEach((select) => select.addEventListener("change", async () => {
            const result = await updateMember(congregation.id, {user_id:Number(select.dataset.role),role:select.value});
            if(!result.success) alert(result.message || t("roleUpdateFailed","Kunne ikke endre rolle.")); else render();
        }));
        main.querySelectorAll("[data-report-recipient]").forEach((button) => button.addEventListener("click", async () => {
            const enabled = button.getAttribute("aria-pressed") !== "true";
            button.disabled = true;
            const result = await updateMemberReportRecipient(congregation.id, Number(button.dataset.reportRecipient), enabled);
            if(!result.success){
                button.disabled = false;
                alert(result.message || t("reportRecipientUpdateFailed","Kunne ikke oppdatere rapportmottaker."));
                return;
            }
            render();
        }));
        main.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", async () => {
            if(!confirm(t("removeMemberConfirm","Fjern denne brukeren fra menigheten?"))) return;
            const result = await removeMember(congregation.id, Number(button.dataset.remove));
            if(!result.success) alert(result.message || t("memberRemoveFailed","Kunne ikke fjerne brukeren.")); else render();
        }));
        main.querySelector("#inviteForm")?.addEventListener("submit", async (event) => {
            event.preventDefault(); const form = new FormData(event.currentTarget);
            const result = await inviteMember(congregation.id, {email:form.get("email"),role:form.get("role")});
            main.querySelector("#memberStatus").textContent = result.success ? (result.immediate ? t("memberAdded","Brukeren har fått tilgang.") : t("invitationSent","Invitasjonen er sendt.")) : (result.message || t("invitationSendFailed","Kunne ikke sende invitasjon."));
            if(result.success){ event.currentTarget.reset(); render(); }
        });
    };
    await render();
}
