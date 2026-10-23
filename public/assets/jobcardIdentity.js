export function normalizeLegacyJobcardNumber(value){
  const raw = String(value ?? "").trim();
  const match = raw.match(/^0*(\d+)([A-Za-z]?)$/);
  return match ? `${Number(match[1])}${match[2].toUpperCase()}` : raw;
}

export function jobcardKey(jobcard){
  return String(
    jobcard?.key ??
    jobcard?.jobcard_key ??
    jobcard?.jobcardKey ??
    jobcard?.id ??
    jobcard?.nummer ??
    ""
  ).trim();
}

export function jobcardSlug(jobcard){
  return String(jobcard?.slug ?? jobcard?.nummer ?? jobcard?.jobcard_number ?? jobcard?.id ?? "1").trim();
}

export function jobcardSeries(jobcard){
  return jobcard?.series === "apartment" ? "apartment" : "hall";
}
