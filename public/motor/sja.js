import { state } from "./state.js";
import { config } from "./config.js";

const escape=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const t=(key,fallback)=>state.translations?.[key]||fallback;
const request=async(path,options={})=>{const response=await fetch(`${config.apiUrl.replace(/\/$/,"")}${path}`,options);return response.json();};
const key=()=>{if(!state.workKey)state.workKey=crypto.randomUUID();return state.workKey;};
const info=(text)=>`<button class="sja-info" type="button" aria-label="${t("moreInfo","Mer informasjon")}" aria-expanded="false"><span aria-hidden="true">i</span><span class="sja-info-popover" hidden>${text}</span></button>`;

export async function initSja(){
  const params=new URLSearchParams(location.search),congregation=params.get("congregation"),jobcard=String(state.currentJob?.nummer||params.get("id")||"").replace(/^0+/,"")||"0";
  if(!congregation)return;
  const result=await request(`/sja?congregation=${encodeURIComponent(congregation)}&jobcard=${encodeURIComponent(jobcard)}&work_key=${encodeURIComponent(key())}`);
  state.sjaRequired=!!result.required;state.sja=result.sja||null;
  if(!state.sjaRequired)return;
  render(result.guideUrl);
}

function render(guideUrl){
  const section=document.getElementById("sjaSection");if(!section)return;section.hidden=false;
  if(state.sja){
    section.innerHTML=`<div class="sja-complete"><div><strong>${t("sjaComplete","Sikker jobb-analyse er utfylt")}</strong><p>${escape(state.sja.work_description)}</p></div><button type="button" data-sja-edit>${t("open","Åpne")}</button><a href="${escape(state.sja.pdf_url)}" target="_blank" rel="noopener">${t("downloadSja","Last ned SJA (DC-85)")}</a></div>`;
    section.querySelector("[data-sja-edit]").addEventListener("click",()=>form(guideUrl));
    return;
  }
  section.innerHTML=`<div class="sja-required"><strong>${t("sjaRequired","Sikker jobb-analyse må fylles ut før arbeidet kan startes")}</strong><button type="button" data-sja-start>${t("fillSja","Fyll ut SJA")}</button></div>`;
  section.querySelector("[data-sja-start]").addEventListener("click",()=>form(guideUrl));
}

function form(guideUrl){
  const section=document.getElementById("sjaSection"),data=state.sja||{};
  const field=(name,label,value="",required=true,type="text")=>`<label>${label}<input name="${name}" type="${type}" ${required?"required":""} value="${escape(value)}"></label>`;
  const step=(item={},removable=false)=>`<div class="sja-step">${removable?`<button type="button" class="sja-remove" aria-label="${t("remove","Fjern arbeidssteg")}">×</button>`:""}<label>${t("sjaWorkStep","Arbeidssteg")}${info(t("sjaWorkStepHelp","Beskriv arbeidsoppgaven i den rekkefølgen den skal utføres."))}<textarea name="step" rows="1" required>${escape(item.step)}</textarea></label><label>${t("sjaRisk","Risiko")}${info(t("sjaRiskHelp","Skriv hva som kan gå galt eller føre til skade."))}<textarea name="risk" rows="1" required>${escape(item.risk)}</textarea></label><label>${t("sjaMeasure","Kontrolltiltak")}${info(t("sjaMeasureHelp","Skriv hva dere gjør for å redusere risikoen."))}<textarea name="measure" rows="1" required>${escape(item.measure)}</textarea></label></div>`;
  const steps=data.steps?.length?data.steps:[{}];
  section.innerHTML=`<div class="sja-form"><header><div><h2>${t("sjaTitle","Sikker jobb-analyse")}</h2><p>${t("sjaIntro","Fyll ut analysen før arbeidet starter.")}</p></div>${guideUrl?`<a href="${escape(guideUrl)}" target="_blank" rel="noopener">${t("sjaGuide","Usikker på hvordan denne skal utfylles? Last ned veiledning")}</a>`:""}</header><div class="sja-fields">${field("work_description",t("sjaWorkDescription","Beskrivelse av arbeid"),data.work_description)}${field("location",t("sjaLocation","Sted"),data.location)}${field("planned_start_date",t("sjaDate","Planlagt startdato"),data.planned_start_date,true,"date")}${field("emergency_numbers",t("sjaEmergency","Nødnumre"),data.emergency_numbers,false)}</div><h3>${t("sjaRiskAssessment","Risikovurdering")}</h3><div data-sja-steps>${steps.map((item,index)=>step(item,index>0)).join("")}</div><button type="button" class="sja-add" data-sja-add>+ ${t("sjaAddStep","Legg til arbeidssteg")}</button><div class="sja-fields sja-names">${field("prepared_by",t("sjaPreparedBy","Utarbeidet av"),data.prepared_by)}${field("reviewed_by",t("sjaReviewedBy","Gjennomgått av"),data.reviewed_by)}</div><button class="work-primary sja-save" type="button" data-sja-submit>✓ ${t("saveSja","Lagre analyse")}</button><p data-sja-status class="work-status"></p></div>`;
  bindInteractions(section);
  section.querySelector("[data-sja-add]").addEventListener("click",()=>{section.querySelector("[data-sja-steps]").insertAdjacentHTML("beforeend",step({},true));bindInteractions(section);});
  section.querySelector("[data-sja-submit]").addEventListener("click",async()=>{
    const status=section.querySelector("[data-sja-status]"),formData=new FormData();
    section.querySelectorAll(".sja-fields input").forEach(input=>formData.set(input.name,input.value.trim()));
    const steps=[...section.querySelectorAll(".sja-step")].map(block=>Object.fromEntries([...block.querySelectorAll("textarea")].map(field=>[field.name,field.value.trim()])));
    if([...section.querySelectorAll("input[required],textarea[required]")].some(field=>!field.value.trim())){status.textContent=t("sjaMissing","Fyll ut alle påkrevde felt.");return;}
    const params=new URLSearchParams(location.search);
    const response=await request("/sja",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:state.sja?.id,target_type:"jobcard",congregation_id:params.get("congregation"),jobcard_id:String(state.currentJob.nummer).replace(/^0+/,"")||"0",target_key:`${params.get("congregation")}:${String(state.currentJob.nummer).replace(/^0+/,"")||"0"}:${key()}`,work_description:formData.get("work_description"),location:formData.get("location"),planned_start_date:formData.get("planned_start_date"),emergency_numbers:formData.get("emergency_numbers"),prepared_by:formData.get("prepared_by"),reviewed_by:formData.get("reviewed_by"),steps})});
    if(!response.success){status.textContent=response.message||"Kunne ikke lagre SJA.";return;}
    state.sja=response.sja;window.dispatchEvent(new Event("sjachange"));render(guideUrl);
  });
}

function bindInteractions(section){
  section.querySelectorAll(".sja-step textarea").forEach(field=>{
    const resize=()=>{field.style.height="auto";field.style.height=`${field.scrollHeight}px`;};
    if(!field.dataset.autoResize){field.addEventListener("input",resize);field.dataset.autoResize="true";}
    resize();
  });
  section.querySelectorAll(".sja-remove").forEach(button=>button.addEventListener("click",()=>button.closest(".sja-step").remove()));
  section.querySelectorAll(".sja-info").forEach(button=>button.addEventListener("click",()=>{
    const expanded=button.getAttribute("aria-expanded")==="true";
    section.querySelectorAll(".sja-info").forEach(item=>{item.setAttribute("aria-expanded","false");item.querySelector(".sja-info-popover").hidden=true;});
    if(!expanded){button.setAttribute("aria-expanded","true");button.querySelector(".sja-info-popover").hidden=false;}
  }));
}
