import { state } from "./state.js";
import { dom } from "./dom.js";

const DB_NAME = "vedlikehold-work-drafts";
const STORE_NAME = "drafts";
const DRAFT_TIMEOUT_MS = 24 * 60 * 60 * 1000;
let saveTimer = null;

function openDb(){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME,{keyPath:"key"});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const transaction = db.transaction(STORE_NAME,mode);
    const request = callback(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

function draftData(){
  return {
    key: state.draftKey,
    savedAt: Date.now(),
    started: state.started,
    startTime: state.startTime,
    expiresAt: state.started && state.startTime ? Number(state.startTime) + DRAFT_TIMEOUT_MS : null,
    name: dom.nameInput.value,
    notes: dom.notes.value,
    checked: [...document.querySelectorAll(".task")].map(task=>task.checked),
    photos: state.selectedPhotos.map(file=>({blob:file,name:file.name,type:file.type,lastModified:file.lastModified}))
  };
}

function isExpiredDraft(draft){
  if(!draft || !draft.started) return false;
  const expiresAt=Number(draft.expiresAt) || Number(draft.startTime) + DRAFT_TIMEOUT_MS;
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

export function createDraftKey(){
  const params = new URLSearchParams(location.search);
  return ["jobcard",params.get("congregation") || "public",params.get("language") || "no",state.currentJob?.nummer || params.get("id")].join(":");
}

export async function saveDraft(){
  if(!state.draftKey || state.sending) return;
  try{ await withStore("readwrite",store=>store.put(draftData())); }catch(error){ console.warn("Could not save work draft",error); }
}

export function scheduleDraftSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{ void saveDraft(); },280);
}

export async function loadDraft(){
  if(!state.draftKey) return null;
  try{
    const draft=await withStore("readonly",store=>store.get(state.draftKey));
    if(isExpiredDraft(draft)){
      await withStore("readwrite",store=>store.delete(state.draftKey));
      return null;
    }
    return draft;
  }catch(error){ console.warn("Could not load work draft",error); return null; }
}

export async function clearExpiredDrafts(){
  try{
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const transaction=db.transaction(STORE_NAME,"readwrite");
      const request=transaction.objectStore(STORE_NAME).openCursor();
      request.onsuccess=()=>{
        const cursor=request.result;
        if(!cursor) return;
        if(isExpiredDraft(cursor.value)) cursor.delete();
        cursor.continue();
      };
      request.onerror=()=>reject(request.error);
      transaction.oncomplete=()=>{db.close();resolve();};
      transaction.onerror=()=>{db.close();reject(transaction.error);};
    });
  }catch(error){ console.warn("Could not clear expired work drafts",error); }
}

export async function clearDraft(){
  clearTimeout(saveTimer);
  if(!state.draftKey) return;
  try{ await withStore("readwrite",store=>store.delete(state.draftKey)); }catch(error){ console.warn("Could not clear work draft",error); }
}
