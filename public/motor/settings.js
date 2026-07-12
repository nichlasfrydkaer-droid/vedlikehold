import { state } from "./state.js";

export function applySettings(){

  if(!state.currentCongregation){
    return;
  }

  const settings = {
    allowPhotos:true,
    allowComments:true,
    showTime:true,
    showName:true,
    ...(state.currentCongregation.settings || {})
  };

  if(!settings.allowPhotos){

    document.getElementById(
      "photosSection"
    ).style.display = "none";

  }

  if(!settings.allowComments){

    document.getElementById(
      "commentsSection"
    ).style.display = "none";

  }

  if(!settings.showTime){

    document.querySelector(
      ".work-progress-time"
    )?.style.setProperty("display","none");

  }

  if(!settings.showName){

    document.getElementById(
      "nameSection"
    ).style.display = "none";

  }

}
