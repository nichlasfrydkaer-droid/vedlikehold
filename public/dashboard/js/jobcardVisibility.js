function getStorageKey(congregationId = ""){
  return `dashboard_jobcard_visibility_${String(congregationId || "").trim()}`;
}

export function getEnabledJobcardIds(congregationId = "", jobcards = []){
  const storageKey = getStorageKey(congregationId);
  const rawValue = localStorage.getItem(storageKey);

  if(rawValue === null){
    return (jobcards || []).map(jobcard => String(jobcard.id));
  }

  try{
    const parsed = JSON.parse(rawValue);

    if(Array.isArray(parsed)){
      return parsed.map(value => String(value));
    }
  }catch(error){
    console.error(error);
  }

  return (jobcards || []).map(jobcard => String(jobcard.id));
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
