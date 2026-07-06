export function fitJobTitle(){

  const title =
    document.getElementById("jobTitle");

  if(!title){
    return;
  }

  title.style.fontSize = "";

  let size =
    parseFloat(
      getComputedStyle(title).fontSize
    );

  const style =
    getComputedStyle(title);

  const lineHeight =
    parseFloat(style.lineHeight) ||
    parseFloat(style.fontSize) * 1.2;

  const maxHeight =
    (lineHeight * 2) + 2;

  while(
    title.scrollHeight > maxHeight &&
    size > 18
  ){

    size--;

    title.style.fontSize =
      size + "px";

  }

}

export function initTitle(){

  window.addEventListener(
    "resize",
    fitJobTitle
  );

}
