export function qs(id){

  return document.getElementById(id);

}

export function qsa(selector){

  return document.querySelectorAll(selector);

}

export function params(){

  return new URLSearchParams(
    window.location.search
  );

}
