function getStorageKey(congregationId = ""){
  return `dashboard_jobcard_visibility_${String(congregationId || "").trim()}`;
}

export function getEnabledJobcardIds(congregationId = "", jobcards = []){
  const storageKey = getStorageKey(congregationId);
  const rawValue = localStorage.getItem(storageKey);
  const allIds = (jobcards || []).map(jobcard => String(jobcard.id));

  if(rawValue === null){
    return allIds;
  }

  try{
    const parsed = JSON.parse(rawValue);

    if(Array.isArray(parsed)){
      const normalizedIds = parsed
        .map(value => String(value))
        .filter(Boolean);

      return normalizedIds;
    }
  }catch(error){
    console.error(error);
  }

  return allIds;
}

export function setEnabledJobcardIds(congregationId = "", jobcardIds = []){
  const storageKey = getStorageKey(congregationId);
  const normalizedIds = Array.from(new Set(jobcardIds.map(value => String(value))));
  localStorage.setItem(storageKey, JSON.stringify(normalizedIds));
}

export function getVisibleJobcards(congregationId = "", jobcards = []){
  const enabledIds = new Set(getEnabledJobcardIds(congregationId, jobcards));

  return (jobcards || []).filter(jobcard => enabledIds.has(String(jobcard.id)));
}

export function isJobcardEnabled(congregationId = "", jobcardId) {
  return getEnabledJobcardIds(congregationId).includes(String(jobcardId));
}
