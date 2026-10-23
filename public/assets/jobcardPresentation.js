export function jobcardPresentation(jobcard = {}){
  let location = String(jobcard.placering || "").trim();
  let notice = String(jobcard.merk || "").trim();
  const placement = notice.match(/^\s*Placering\s*:\s*([^\r\n]+)(?:\r?\n\s*)*/i);

  if(placement){
    if(!location) location = placement[1].trim();
    notice = notice.slice(placement[0].length).trim();
  }

  return { location, notice };
}
