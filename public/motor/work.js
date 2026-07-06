import { state } from "./state.js";
import { dom } from "./dom.js";
import { startTimer } from "./timer.js";

export function startWork() {

    startTimer();

    document
        .querySelectorAll(".task")
        .forEach(x => x.disabled = false);

    if (
        !state.currentCongregation ||
        state.currentCongregation.settings.showName
    ) {
        dom.nameInput.disabled = false;
    }

    if (
        !state.currentCongregation ||
        state.currentCongregation.settings.allowComments
    ) {
        dom.notes.disabled = false;
    }

    if (
        !state.currentCongregation ||
        state.currentCongregation.settings.allowPhotos
    ) {
        dom.photos.disabled = false;
    }

    dom.startBtn.style.display = "none";

    dom.finishBtn.style.display = "block";
    dom.finishBtn.classList.add("pulse");

}
