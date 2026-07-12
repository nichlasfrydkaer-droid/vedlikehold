import { state } from "./state.js";
import { config } from "./config.js";
import { dom } from "./dom.js";
import { clearDraft } from "./draft.js";
import { showSending, showSendError } from "./work.js";

export async function uploadReport(report){
  if(state.selectedPhotos.length > config.maxFiles){
    showSendError(state.translations.alertMaxFiles.replace("{count}",config.maxFiles));
    return false;
  }
  const totalMB=state.selectedPhotos.reduce((sum,file)=>sum+file.size,0)/1024/1024;
  if(totalMB > config.maxTotalMB){
    showSendError(state.translations.alertMaxSize.replace("{size}",totalMB.toFixed(1)).replace("{max}",config.maxTotalMB));
    return false;
  }
  const params=new URLSearchParams(location.search);
  const congregation=params.get("congregation");
  const formData=new FormData();
  formData.append("congregation",congregation || "");
  formData.append("token",config.apiToken);
  formData.append("report",JSON.stringify(report));
  state.selectedPhotos.forEach(photo=>formData.append("photos",photo,photo.name));
  state.pdfPhotos.forEach(photo=>formData.append("pdfPhotos",photo,photo.name));

  showSending();
  dom.finishBtn.disabled=true;
  try{
    const response=await fetch(config.apiUrl,{method:"POST",body:formData});
    if(!response.ok) throw new Error("Upload failed");
    await clearDraft();
    dom.status.textContent=state.translations.statusSent;
    location.href=`/ferdig.html?congregation=${encodeURIComponent(congregation || "")}`;
    return true;
  }catch(error){
    dom.finishBtn.disabled=false;
    showSendError();
    return false;
  }
}
