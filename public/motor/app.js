import { loadJob } from "./loadJob.js";
import { initPhotos, autoResizeNotes } from "./photos.js";
import { initTitle } from "./title.js";
import { generatePDF } from "./pdf.js";
import { startWork } from "./work.js";
import { state } from "./state.js";
import { dom } from "./dom.js";

export async function initApp() {

    initTitle();

    initPhotos();

    autoResizeNotes();

    dom.startBtn.addEventListener("click", startWork);

    dom.finishBtn.addEventListener("click", () => {

        const navn = dom.nameInput.value.trim();

        if (!navn) {

            alert(state.translations.alertNameRequired);
            dom.nameInput.focus();
            return;

        }

        generatePDF();

    });

    await loadJob();

}
