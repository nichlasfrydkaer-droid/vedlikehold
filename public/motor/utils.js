export function qs(id){

  return document.getElementById(id);

}

export function qsa(selector){

  return document.querySelectorAll(selector);

}

// Job card content is maintained as data. Only bold text and line breaks are
// intentionally supported; every other tag is rendered as plain, safe text.
export function appendFormattedText(element,value=""){
  element.replaceChildren();
  let bold=false;
  String(value).split(/(<\/?strong>|<br\s*\/?>)/gi).forEach(part=>{
    const token=part.toLowerCase();
    if(token === "<strong>"){ bold=true; return; }
    if(token === "</strong>"){ bold=false; return; }
    if(/^<br\s*\/?>$/i.test(part)){ element.appendChild(document.createElement("br")); return; }
    const text=part.replace(/<[^>]*>/g,"");
    if(!text) return;
    const node=bold ? document.createElement("strong") : document.createTextNode(text);
    if(bold) node.textContent=text;
    element.appendChild(node);
  });
}

export function params(){

  return new URLSearchParams(
    window.location.search
  );

}
