import { state } from "./state.js";
import { dom } from "./dom.js";
import { scheduleDraftSave } from "./draft.js";

let objectUrls=[];

async function compressImage(file){
  if(!file.type.startsWith("image/") || file.type.includes("svg") || file.size < 700_000) return file;
  try{
    const image=await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),element=new Image();element.onload=()=>{URL.revokeObjectURL(url);resolve(element);};element.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image could not be read"));};element.src=url;});
    const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.84));
    return blob ? new File([blob],file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg",lastModified:file.lastModified}) : file;
  }catch{return file;}
}

export function initPhotos(){
  dom.photos.addEventListener("change",async event=>{
    const files=await Promise.all([...event.target.files].map(compressImage));
    state.selectedPhotos.push(...files);
    event.target.value="";
    renderPreview();
    scheduleDraftSave();
  });
}

export function initDraftInputs(){
  dom.nameInput.addEventListener("input",()=>{
    dom.nameInput.classList.toggle("is-invalid",!dom.nameInput.value.trim());
    scheduleDraftSave();
  });
  dom.notes.addEventListener("input",scheduleDraftSave);
}

export function resizeNotes(){ dom.notes.style.height="auto";dom.notes.style.height=`${Math.max(112,dom.notes.scrollHeight)}px`; }

export function autoResizeNotes(){ dom.notes.addEventListener("input",resizeNotes); }

export function renderPreview(){
  objectUrls.forEach(URL.revokeObjectURL); objectUrls=[];
  dom.preview.innerHTML="";
  state.selectedPhotos.forEach((file,index)=>{
    const url=URL.createObjectURL(file);objectUrls.push(url);
    const item=document.createElement("div");item.className="work-photo-item";
    item.innerHTML=`<img src="${url}" alt="Bilde ${index+1}"><button type="button" class="work-photo-remove" data-index="${index}" aria-label="Fjern bilde">×</button>`;
    dom.preview.appendChild(item);
  });
  dom.preview.querySelectorAll(".work-photo-remove").forEach(button=>button.addEventListener("click",()=>removePhoto(Number(button.dataset.index))));
}

export function removePhoto(index){ state.selectedPhotos.splice(index,1); renderPreview(); scheduleDraftSave(); }
