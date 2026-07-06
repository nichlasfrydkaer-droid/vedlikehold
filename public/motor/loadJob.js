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
    params.get("id") || "41";

  state.currentCongregation =
    JSON.parse(
      localStorage.getItem("congregationData")
    );

  const language =
    state.currentCongregation?.language || "no";

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

  if(
    state.currentCongregation &&
    !state.currentCongregation.settings.allowPhotos
  ){

    document.getElementById(
      "photosSection"
    ).style.display = "none";

  }

  if(
    state.currentCongregation &&
    !state.currentCongregation.settings.allowComments
  ){

    document.getElementById(
      "commentsSection"
    ).style.display = "none";

  }

  if(
    state.currentCongregation &&
    !state.currentCongregation.settings.showTime
  ){

    document.getElementById(
      "timeSection"
    ).style.display = "none";

  }

  if(
    state.currentCongregation &&
    !state.currentCongregation.settings.showName
  ){

    document.getElementById(
      "nameSection"
    ).style.display = "none";

  }

  requestAnimationFrame(fitJobTitle);

}
