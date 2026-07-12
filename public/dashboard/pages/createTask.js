import { loadDashboard } from "../services/dashboard.js";
import { getReport, createTaskFromReport, uploadTaskPhotos } from "../js/api.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);

export async function initCreateTask(){
    const root = document.getElementById("createTask");
    const reportId = new URLSearchParams(location.search).get("report");
    if(!(await loadDashboard()) || !reportId){ root.innerHTML = "<p>Rapport mangler.</p>"; return; }

    const result = await getReport(reportId);
    if(!result.success){ root.innerHTML = "<p>Rapport kunne ikke hentes.</p>"; return; }

    const report = result.report;
    const suggestedTitle = String(report.title || `Jobbkort ${report.job_number || ""}`).trim();
    const sourcePhotos = JSON.parse(report.photo_urls_json || "[]");
    const selected = new Set();

    const renderPhotos = () => {
        root.querySelector("[data-photos]").innerHTML = sourcePhotos.map((url, index) => `<button type="button" class="task-source-photo ${selected.has(url) ? "selected" : ""}" data-photo="${index}"><img src="${escapeHtml(url)}" alt="Bilde ${index + 1}"><span>✓</span></button>`).join("");
        root.querySelectorAll("[data-photo]").forEach((button) => button.addEventListener("click", () => {
            const url = sourcePhotos[Number(button.dataset.photo)];
            selected.has(url) ? selected.delete(url) : selected.add(url);
            renderPhotos();
        }));
    };

    root.innerHTML = `<a class="create-task-back" href="/dashboard/report.html?id=${encodeURIComponent(report.id)}">← Tilbake til rapport</a><section class="create-task-card"><p class="create-task-context">Jobbkort ${escapeHtml(report.job_number)} · ${escapeHtml(report.congregation_id)}</p><h1>Opprett oppdrag</h1><label>Tittel<input id="title" value="${escapeHtml(suggestedTitle)}"></label><label>Ny kommentar<textarea id="description" rows="4"></textarea></label><section class="create-task-original"><label><input id="includeOriginal" type="checkbox"> Medtag original kommentar</label><p>${escapeHtml(report.notes || "–")}</p></section><section><h2>Sjekkpunkter</h2><div id="checklist"><input class="check-item" placeholder="Skriv et sjekkpunkt"></div><button type="button" id="addCheck" class="task-add">+ Legg til punkt</button></section><section><h2>Bilder</h2><p class="create-task-help">Trykk på bildene du vil ta med i oppdraget.</p><div class="task-source-photo-grid" data-photos></div><label class="task-upload">+ Tilføy bilde<input id="newPhotos" type="file" accept="image/*" multiple hidden></label></section><label class="task-require-photos"><input id="requireCompletionPhotos" type="checkbox"> Krev bildedokumentasjon ved fullføring</label><label>Frist<input id="deadline" type="date" required></label><button id="createTaskButton" class="create-task-submit" type="button">Opprett oppdrag</button><p id="status"></p></section>`;
    renderPhotos();
    root.querySelector("#addCheck").addEventListener("click", () => root.querySelector("#checklist").insertAdjacentHTML("beforeend", '<input class="check-item" placeholder="Skriv et sjekkpunkt">'));
    root.querySelector("#newPhotos").addEventListener("change", async (event) => {
        const response = await uploadTaskPhotos(event.target.files);
        if(response.success){ response.photos.forEach((url) => { sourcePhotos.push(url); selected.add(url); }); renderPhotos(); }
    });
    root.querySelector("#createTaskButton").addEventListener("click", async () => {
        const title = root.querySelector("#title").value.trim() || suggestedTitle;
        const deadline = root.querySelector("#deadline").value;
        const checklist = [...root.querySelectorAll(".check-item")].map((input) => input.value.trim()).filter(Boolean).map((text) => ({id:crypto.randomUUID(),text}));
        const response = await createTaskFromReport({ report_id:report.id, title, description:root.querySelector("#description").value.trim(), include_original_comment:root.querySelector("#includeOriginal").checked, require_completion_photos:root.querySelector("#requireCompletionPhotos").checked, checklist, photos:[...selected], deadline });
        if(response.success){ location.href = `/dashboard/taskCreated.html?id=${response.task.id}&code=${response.task.link_code}`; return; }
        root.querySelector("#status").textContent = response.message || "Kunne ikke opprette oppdrag.";
    });
}
