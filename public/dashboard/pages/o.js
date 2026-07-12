import { getPublicTask, completePublicTask, startPublicTask, uploadPublicTaskPhotos } from "../js/api.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);

export async function initO(){
    const root = document.getElementById("taskPage");
    const code = new URLSearchParams(location.search).get("code");
    const result = await getPublicTask(code);
    if(!result.success){
        root.innerHTML = '<main class="public-task-shell"><section class="public-task-card"><h1>Oppdraget finnes ikke</h1></section></main>';
        return;
    }

    const task = result.task;
    const checklist = JSON.parse(task.checklist_json || "[]");
    const sourcePhotos = JSON.parse(task.photos_json || "[]");
    const uploaded = [];
    let started = task.status !== "open";

    const render = () => {
        root.innerHTML = `<main class="public-task-shell"><header class="public-task-brand">Vedlikeholdsystem</header><section class="public-task-card"><div class="public-task-status ${task.status}">${task.status === "open" ? "Åpen" : task.status === "started" ? "Startet" : "Overskredet"}</div><h1>${escapeHtml(task.title)}</h1><p class="public-task-deadline">Frist: <strong>${escapeHtml(task.deadline || "–")}</strong></p><section class="public-task-section"><h2>Oppgaven</h2><p>${escapeHtml(task.description || "–")}</p>${task.original_comment ? `<div class="public-original"><strong>Opprinnelig kommentar</strong><p>${escapeHtml(task.original_comment)}</p></div>` : ""}${sourcePhotos.length ? `<h3>Bilder til oppgaven</h3><div class="public-source-photos">${sourcePhotos.map((url) => `<img src="${escapeHtml(url)}" alt="Bilde til oppgaven">`).join("")}</div>` : ""}<h3>Sjekkpunkter</h3><div>${checklist.map((item, index) => `<label class="public-check"><input class="taskCheckbox" data-index="${index}" type="checkbox">${escapeHtml(item.text)}</label>`).join("") || "<p>Ingen sjekkpunkter.</p>"}</div>${!started ? '<button id="startButton" class="public-start">Start</button>' : ""}</section><section class="public-completion ${started ? "" : "locked"}"><h2>Din utførelse</h2>${!started ? "<p>Trykk Start for å begynne.</p>" : ""}<label class="public-required-name">Fyll inn navn <span aria-hidden="true">*</span><input id="completedName" required autocomplete="name" placeholder="Navnet ditt" ${started ? "" : "disabled"}></label><label>Kommentar<textarea id="comment" ${started ? "" : "disabled"}></textarea></label><h3>Bilder fra utførelsen</h3><div id="newPhotos" class="public-new-photos"></div><label class="public-upload ${started ? "" : "disabled"}">+ Tilføy bilde<input id="photoInput" type="file" accept="image/*" multiple ${started ? "" : "disabled"} hidden></label><button id="finishButton" class="public-finish" ${started ? "" : "disabled"}>Ferdigmeld oppdrag</button><p id="status" role="status"></p></section></section></main>`;

        const finishButton = root.querySelector("#finishButton");
        const validate = () => { if(finishButton) finishButton.disabled = !started; };

        root.querySelector("#completedName")?.addEventListener("input", event => {
            event.currentTarget.classList.toggle("is-valid", Boolean(event.currentTarget.value.trim()));
        });

        root.querySelector("#startButton")?.addEventListener("click", async () => {
            const response = await startPublicTask(code);
            if(response.success){ started = true; task.status = "started"; render(); }
        });

        root.querySelector("#photoInput")?.addEventListener("change", async (event) => {
            const response = await uploadPublicTaskPhotos(code, event.target.files);
            if(response.success){
                uploaded.push(...response.photos);
                root.querySelector("#newPhotos").innerHTML = uploaded.map((photo, index) => `<div><img src="${escapeHtml(photo.url)}" alt="Bilde"><button type="button" data-remove="${index}" aria-label="Fjern bilde">×</button></div>`).join("");
                root.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => { uploaded.splice(Number(button.dataset.remove), 1); render(); }));
                validate();
            }
        });

        finishButton?.addEventListener("click", async () => {
            const name = root.querySelector("#completedName");
            const status = root.querySelector("#status");
            if(!name.value.trim()){
                status.textContent = "Skriv inn navnet ditt før du ferdigmelder oppdraget.";
                name.focus();
                return;
            }
            if(task.require_completion_photos && !uploaded.length){
                status.textContent = "Denne oppgaven krever minst ett bilde før den kan ferdigmeldes.";
                return;
            }
            finishButton.disabled = true;
            const completedChecklist = checklist.map((item, index) => ({ text:item.text, checked:root.querySelector(`.taskCheckbox[data-index="${index}"]`)?.checked || false }));
            const response = await completePublicTask({ link_code:code, completed_name:name.value.trim(), completed_comment:root.querySelector("#comment").value.trim(), checklist:completedChecklist, completed_photos:uploaded });
            if(response.success){
                root.innerHTML = '<main class="public-task-shell"><section class="public-task-card"><h1>Oppdraget er ferdigmeldt</h1><p>Takk for innsatsen.</p></section></main>';
                return;
            }
            status.textContent = response.message || "Kunne ikke ferdigmelde oppdraget.";
            finishButton.disabled = false;
        });
    };
    render();
}
