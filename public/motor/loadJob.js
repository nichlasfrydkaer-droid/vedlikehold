import { applySettings } from "./settings.js";
import { state } from "./state.js";
import { dom } from "./dom.js";
import { renderTasks } from "./render.js";
import {
  updateTexts,
  renderHeader,
  renderNotes
} from "./ui.js";
import { fitJobTitle } from "./title.js";

export async function loadJob(){

  const params =
    new URLSearchParams(window.location.search);

  const id =
    params.get("id") || "1";

  state.currentCongregation =
    JSON.parse(
      localStorage.getItem("congregationData") || "null"
    );

  const requestedLanguage =
    String(params.get("language") || "").trim().toLowerCase();

  const language =
    ["no", "da", "en"].includes(requestedLanguage)
      ? requestedLanguage
      : state.currentCongregation?.language || "no";

  let response =
    await fetch(`/jobdata/${language}/${id}.json`);

  if(!response.ok){

    throw new Error("Kunne ikke indlæse jobbkort.");

  }

  state.currentJob =
    await response.json();

  let languageResponse =
    await fetch(`/lang/${language}.json`);

  if(!languageResponse.ok){

    languageResponse =
      await fetch("/lang/no.json");

  }

  if(!languageResponse.ok){

    throw new Error("Kunne ikke indlæse sprogfil.");

  }

  state.translations =
    await languageResponse.json();

  updateTexts();

  renderHeader();

  renderNotes();

 renderTasks();

applySettings();

  // All work inputs remain locked until the person explicitly starts work.
  // app.js applies the restored/new work state after loading a local draft.

requestAnimationFrame(fitJobTitle);
  
}
