import { state } from "./state.js";
import { config } from "./config.js";

const escape=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const t=(key,fallback)=>state.translations?.[key]||fallback;
const request=async(path,options={})=>{const response=await fetch(`${config.apiUrl.replace(/\/$/,"")}${path}`,options);return response.json();};
const key=()=>{if(!state.workKey)state.workKey=crypto.randomUUID();return state.workKey;};

export async function initSja(){
  const params=new URLSearchParams(location.search), congregation=params.get("congregation"),jobcard=String(state.currentJob?.nummer||params.get("id")||"").replace(/^0+/,"")||"0";
  if(!congregation)return;
  const result=await request(`/sja?congregation=${encodeURIComponent(congregation)}&jobcard=${encodeURIComponent(jobcard)}&work_key=${encodeURIComponent(key())}`);
  state.sjaRequired=!!result.required;state.sja=result.sja||null;
  if(!state.sjaRequired)return;
  render(result.guideUrl);
}

function render(guideUrl){
  const section=document.getElementById("sjaSection");if(!section)return;section.hidden=false;
  if(state.sja){section.innerHTML=`<div class="sja-complete"><div><strong>${t("sjaComplete","Sikker jobb-analyse er utfylt")}</strong><p>${escape(state.sja.work_description)}</p></div><button type="button" data-sja-edit>${t("open","Åpne")}</button><a href="${escape(state.sja.pdf_url)}" target="_blank" rel="noopener">${t("downloadSja","Last ned SJA (DC-85)")}</a></div>`;section.querySelector("[data-sja-edit]").addEventListener("click",()=>form(guideUrl));return;}
  section.innerHTML=`<div class="sja-required"><strong>${t("sjaRequired","Sikker jobb-analyse må fylles ut før arbeidet kan startes")}</strong><button type="button" data-sja-start>${t("fillSja","Fyll ut SJA")}</button></div>`;section.querySelector("[data-sja-start]").addEventListener("click",()=>form(guideUrl));
}

function form(guideUrl){
  const section=document.getElementById("sjaSection"),data=state.sja||{};
  const row=(name,label,value="")=>`<label>${label}<input name="${name}" required value="${escape(value)}"></label>`;
  const step=(item={})=>`<div class="sja-step"><button type="button" class="sja-remove" aria-label="Fjern arbeidssteg">×</button>${row("step",t("sjaWorkStep","Arbeidssteg"),item.step)}${row("risk",t("sjaRisk","Risiko"),item.risk)}${row("measure",t("sjaMeasure","Kontrolltiltak"),item.measure)}</div>`;
  section.innerHTML=`<div class="sja-form"><header><div><h2>${t("sjaTitle","Sikker jobb-analyse")}</h2><p>${t("sjaIntro","Fyll ut analysen før arbeidet starter.")}</p></div>${guideUrl?`<a href="${escape(guideUrl)}" target="_blank" rel="noopener">${t("sjaGuide","Usikker på hvordan denne skal utfylles? Last ned veiledning")}</a>`:""}</header><div class="sja-fields">${row("work_description",t("sjaWorkDescription","Beskrivelse av arbeid"),data.work_description)}${row("location",t("sjaLocation","Sted"),data.location)}${row("planned_start_date",t("sjaDate","Planlagt startdato"),data.planned_start_date)}${row("emergency_numbers",t("sjaEmergency","Nødnumre"),data.emergency_numbers)}</div><h3>${t("sjaRiskAssessment","Risikovurdering")}</h3><div data-sja-steps>${(data.steps?.length?data.steps:[{}]).map(step).join("")}</div><button type="button" class="sja-add" data-sja-add>+ ${t("sjaAddStep","Legg til arbeidssteg")}</button><div class="sja-fields sja-names">${row("prepared_by",t("sjaPreparedBy","Utarbeidet av"),data.prepared_by)}${row("reviewed_by",t("sjaReviewedBy","Gjennomgått av"),data.reviewed_by)}</div><button class="work-primary" type="button" data-sja-submit>${t("saveSja","Lagre analyse")}</button><p data-sja-status class="work-status"></p></div>`;
  const bind=()=>section.querySelectorAll(".sja-remove").forEach(button=>button.addEventListener("click",()=>{const all=section.querySelectorAll(".sja-step");if(all.length>1)button.closest(".sja-step").remove();}));bind();section.querySelector("[data-sja-add]").addEventListener("click",()=>{section.querySelector("[data-sja-steps]").insertAdjacentHTML("beforeend",step());bind();});
  section.querySelector("[data-sja-submit]").addEventListener("click",async()=>{const status=section.querySelector("[data-sja-status]"),formData=new FormData();section.querySelectorAll("input").forEach(input=>formData.set(input.name,input.value.trim()));const steps=[...section.querySelectorAll(".sja-step")].map(block=>Object.fromEntries([...block.querySelectorAll("input")].map(input=>[input.name,input.value.trim()])));if([...section.querySelectorAll("input[required]")].some(input=>!input.value.trim())){status.textContent=t("sjaMissing","Fyll ut alle påkrevde felt.");return;}const params=new URLSearchParams(location.search);const response=await request("/sja",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:state.sja?.id,target_type:"jobcard",congregation_id:params.get("congregation"),jobcard_id:String(state.currentJob.nummer).replace(/^0+/,"")||"0",target_key:`${params.get("congregation")}:${String(state.currentJob.nummer).replace(/^0+/,"")||"0"}:${key()}`,work_description:formData.get("work_description"),location:formData.get("location"),planned_start_date:formData.get("planned_start_date"),emergency_numbers:formData.get("emergency_numbers"),prepared_by:formData.get("prepared_by"),reviewed_by:formData.get("reviewed_by"),steps})});if(!response.success){status.textContent=response.message||"Kunne ikke lagre SJA.";return;}state.sja=response.sja;window.dispatchEvent(new Event("sjachange"));render(guideUrl);});
}
