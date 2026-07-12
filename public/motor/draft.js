import { state } from "./state.js";
import { dom } from "./dom.js";

const DB_NAME = "vedlikehold-work-drafts";
const STORE_NAME = "drafts";
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
    name: dom.nameInput.value,
    notes: dom.notes.value,
    checked: [...document.querySelectorAll(".task")].map(task=>task.checked),
    photos: state.selectedPhotos.map(file=>({blob:file,name:file.name,type:file.type,lastModified:file.lastModified}))
  };
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
  try{ return await withStore("readonly",store=>store.get(state.draftKey)); }catch(error){ console.warn("Could not load work draft",error); return null; }
}

export async function clearDraft(){
  clearTimeout(saveTimer);
  if(!state.draftKey) return;
  try{ await withStore("readwrite",store=>store.delete(state.draftKey)); }catch(error){ console.warn("Could not clear work draft",error); }
}
