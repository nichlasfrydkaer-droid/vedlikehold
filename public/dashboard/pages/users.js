import { loadDashboard } from "../services/dashboard.js";
import { getCongregation } from "../js/session.js";
import { getMembers, inviteMember, updateMember, removeMember } from "../js/api.js";

const safe = (value) => String(value || "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);

export async function initUsers(){
    const me = await loadDashboard();
    const main = document.querySelector("main");
    const congregation = getCongregation();
    if(!me?.success || !congregation){
        main.innerHTML = "<section class='dashboard-card dashboard-full'><h2>Brukere</h2><p>Velg en menighet først.</p></section>";
        return;
    }
    const render = async () => {
        const data = await getMembers(congregation.id);
        if(!data.success){
            main.innerHTML = `<section class="dashboard-card dashboard-full"><h2>Brukere</h2><p>${safe(data.message || "Kunne ikke hente brukere.")}</p></section>`;
            return;
        }
        const canManage = data.canManageMembers;
        main.innerHTML = `<section class="dashboard-card dashboard-full management-heading"><div><p class="page-eyebrow">${safe(congregation.name)}</p><h2>Brukere</h2><p>Administrer hvem som har tilgang til denne menigheten.</p></div></section><section class="dashboard-card dashboard-full member-card"><h3>Brukere med tilgang</h3><div class="member-list">${data.members.map((member) => `<article class="member-row"><div class="member-avatar">${safe(member.name).slice(0,1).toUpperCase()}</div><div class="member-main"><strong>${safe(member.name)}</strong><span>${safe(member.email)}</span></div><span class="role-pill ${member.role}">${member.role === "admin" ? "Administrator" : "Medlem"}</span>${data.canManageAdmins ? `<select data-role="${member.id}"><option value="member" ${member.role === "member" ? "selected" : ""}>Medlem</option><option value="admin" ${member.role === "admin" ? "selected" : ""}>Administrator</option></select>` : ""}${canManage ? `<button class="text-danger" data-remove="${member.id}">Fjern</button>` : ""}</article>`).join("") || "<p>Ingen medlemmer ennå.</p>"}</div></section>${canManage ? `<section class="dashboard-card dashboard-full member-card"><h3>Gi en bruker tilgang</h3><p class="section-help">Eksisterende brukere får tilgang med én gang. Nye brukere mottar en invitasjon som er gyldig i 7 dager.</p><form id="inviteForm" class="inline-form"><input name="email" type="email" placeholder="navn@eksempel.no" required><select name="role">${data.canManageAdmins ? "<option value='member'>Medlem</option><option value='admin'>Administrator</option>" : "<option value='member'>Medlem</option>"}</select><button type="submit">Send invitasjon</button></form><p id="memberStatus" class="form-status"></p></section>` : ""}`;
        main.querySelectorAll("[data-role]").forEach((select) => select.addEventListener("change", async () => {
            const result = await updateMember(congregation.id, {user_id:Number(select.dataset.role),role:select.value});
            if(!result.success) alert(result.message || "Kunne ikke endre rolle."); else render();
        }));
        main.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", async () => {
            if(!confirm("Fjern denne brukeren fra menigheten?")) return;
            const result = await removeMember(congregation.id, Number(button.dataset.remove));
            if(!result.success) alert(result.message || "Kunne ikke fjerne brukeren."); else render();
        }));
        main.querySelector("#inviteForm")?.addEventListener("submit", async (event) => {
            event.preventDefault(); const form = new FormData(event.currentTarget);
            const result = await inviteMember(congregation.id, {email:form.get("email"),role:form.get("role")});
            main.querySelector("#memberStatus").textContent = result.success ? (result.immediate ? "Brukeren har fått tilgang." : "Invitasjonen er sendt.") : (result.message || "Kunne ikke sende invitasjon.");
            if(result.success){ event.currentTarget.reset(); render(); }
        });
    };
    await render();
}
