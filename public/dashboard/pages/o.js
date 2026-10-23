import { getPublicTask, completePublicTask, startPublicTask, uploadPublicTaskPhotos, getPublicTaskSja, savePublicTaskSja } from "../js/api.js";
import { pt, publicTaskLocale, setPublicTaskLanguage } from "../js/publicTaskI18n.js";

const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const icon=name=>{const paths={calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`,person:`<circle cx="12" cy="8" r="3"/><path d="M5 21c.8-3.6 3.2-5.5 7-5.5s6.2 1.9 7 5.5"/>`,photo:`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.2"/><path d="m3 17 5-5 3.5 3.5 2.5-2.5 4 4"/>`,check:`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 2.5 2.5L16 9"/>`};return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;};
const formatDate=value=>{const date=new Date(value);return value&&!Number.isNaN(date.getTime())?date.toLocaleString(publicTaskLocale(),{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"–";};
const sjaInfo=text=>`<details class="public-sja-info"><summary aria-label="${pt("moreInformation","Mer informasjon")}">i</summary><span>${text}</span></details>`;

const finishDialogs=()=>`<div class="public-finish-modal hidden" data-finish-modal role="dialog" aria-modal="true" aria-labelledby="finishDialogTitle"><section class="public-finish-dialog"><div class="public-finish-dialog-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></div><h2 id="finishDialogTitle">${pt("readyToFinish","Klar til å ferdigmelde?")}</h2><p>${pt("reviewBeforeSend","Kontroller oppsummeringen før rapporten sendes.")}</p><div class="public-finish-summary"><span data-finish-name></span><span data-finish-checklist></span><span data-finish-photos></span></div><div class="public-finish-actions"><button type="button" class="public-finish-cancel" data-finish-cancel>${pt("undo","Angre")}</button><button type="button" class="public-finish-confirm" data-finish-confirm>${pt("confirm","Bekreft")}</button></div></section></div><div class="public-sending-modal hidden" data-sending-modal role="status" aria-live="assertive"><section class="public-sending-dialog"><div class="public-sending-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 4 3 5 4 6 1-1 4-2 4-6M8 21c0-4 3-5 4-6 1 1 4 2 4 6"/></svg></div><h2>${pt("sendingReport","Sender rapport …")}</h2><p>${pt("doNotLeave","Ikke forlat siden.")}</p></section></div>`;

export async function initO(){
  const root=document.getElementById("taskPage"),code=new URLSearchParams(location.search).get("code"),result=await getPublicTask(code);
  setPublicTaskLanguage(new URLSearchParams(location.search).get("language")||result.language||result.task?.language||"no");
  if(!result.success){root.innerHTML=`<main class="public-task-shell"><section class="public-task-card"><h1>${pt("taskNotFound","Oppdraget finnes ikke")}</h1></section></main>`;return;}
  const task=result.task,report=result.report||{},checklist=JSON.parse(task.checklist_json||"[]"),sourcePhotos=JSON.parse(task.photos_json||"[]"),uploaded=[];
  const sjaResponse=task.require_sja?await getPublicTaskSja(code):{};
  let sja=sjaResponse?.sja||null,editingSja=!sja;
  const form={name:"",comment:"",checked:checklist.map(()=>false)};
  let started=task.status!=="open";
  const snapshot=()=>{form.name=root.querySelector("#completedName")?.value||form.name;form.comment=root.querySelector("#comment")?.value||form.comment;form.checked=checklist.map((_,index)=>root.querySelector(`.taskCheckbox[data-index="${index}"]`)?.checked??form.checked[index]);};
  const sjaStep=(item={},removable=false)=>`<div class="public-sja-step">${removable?`<button type="button" class="public-sja-remove" aria-label="${pt("removeWorkStep","Fjern arbeidssteg")}">×</button>`:""}<label>${pt("workStep","Arbeidssteg")} ${sjaInfo(pt("workStepHelp","Beskriv arbeidsoppgaven i den rekkefølgen den skal utføres."))}<textarea name="step" rows="1" required>${escapeHtml(item.step)}</textarea></label><label>${pt("risk","Risiko")} ${sjaInfo(pt("riskHelp","Skriv hva som kan gå galt eller føre til skade."))}<textarea name="risk" rows="1" required>${escapeHtml(item.risk)}</textarea></label><label>${pt("measure","Kontrolltiltak")} ${sjaInfo(pt("measureHelp","Skriv hva dere gjør for å redusere risikoen."))}<textarea name="measure" rows="1" required>${escapeHtml(item.measure)}</textarea></label></div>`;
  const sjaMarkup=()=>{
    if(!task.require_sja)return "";
    if(sja&&!editingSja)return `<section class="public-sja public-sja-complete"><div><strong>${pt("sjaComplete","Sikker jobb-analyse er utfylt")}</strong><p>${escapeHtml(sja.work_description)}</p></div><div><button type="button" data-sja-edit>${pt("open","Åpne")}</button><a href="${escapeHtml(sja.pdf_url)}" target="_blank" rel="noopener">${pt("downloadSja","Last ned SJA (DC-85)")}</a></div></section>`;
    const steps=sja?.steps?.length?sja.steps:[{}];
    return `<section id="publicSja" class="public-sja"><header><div><h2>${pt("sjaTitle","Sikker jobb-analyse")}</h2><p>${pt("sjaIntro","Fyll ut analysen før arbeidet starter.")}</p></div>${sjaResponse?.guideUrl?`<a href="${escapeHtml(sjaResponse.guideUrl)}" target="_blank" rel="noopener">${pt("sjaGuide","Veiledning: Sikker jobb-analyse (DC-85)")}</a>`:""}</header><div class="public-sja-fields"><label>${pt("workDescription","Beskrivelse av arbeid")}<input name="work_description" required value="${escapeHtml(sja?.work_description)}"></label><label>${pt("location","Sted")}<input name="location" required value="${escapeHtml(sja?.location)}"></label><label>${pt("plannedStart","Planlagt startdato")}<input name="planned_start_date" type="date" required value="${escapeHtml(sja?.planned_start_date)}"></label><label>${pt("emergencyNumbers","Nødnumre")}<input name="emergency_numbers" value="${escapeHtml(sja?.emergency_numbers)}"></label></div><h2>${pt("riskAssessment","Risikovurdering")}</h2><div data-sja-steps>${steps.map((item,index)=>sjaStep(item,index>0)).join("")}</div><button type="button" class="public-sja-add" data-sja-add>+ ${pt("addWorkStep","Legg til arbeidssteg")}</button><div class="public-sja-fields"><label>${pt("preparedBy","Utarbeidet av")}<input name="prepared_by" required value="${escapeHtml(sja?.prepared_by)}"></label><label>${pt("reviewedBy","Gjennomgått av")}<input name="reviewed_by" required value="${escapeHtml(sja?.reviewed_by)}"></label></div><button type="button" class="public-sja-save" data-sja-save>✓ ${pt("saveAnalysis","Lagre analyse")}</button><p class="public-sja-status" role="status"></p></section>`;
  };
  const render=()=>{
    const disabled=started?"":"disabled",statusLabel=task.status==="open"?pt("openStatus","Åpen"):task.status==="started"?pt("startedStatus","Startet"):pt("overdueStatus","Overskredet"),startBlocked=task.require_sja&&!sja;
    root.innerHTML=`<main class="public-task-shell"><header class="public-task-brand">Vedlikeholdsystem</header><section class="public-task-card"><header class="public-task-hero"><div class="public-task-status ${task.status}">${statusLabel}</div><h1>${escapeHtml(task.title)}</h1><p class="public-task-deadline">${icon("calendar")}<span>${pt("deadline","Frist")} <strong>${escapeHtml(task.deadline||"–")}</strong></span></p></header><section class="public-task-section public-task-brief"><h2>${pt("task","Oppgaven")}</h2><p>${escapeHtml(task.description||"–")}</p>${task.original_comment?`<aside class="public-report-note"><div class="public-report-note-heading"><span>${icon("check")}</span><div><h2>${pt("reportNote","Notat fra vedlikeholdsrapport")}</h2><div class="public-report-meta"><span>${icon("calendar")}${pt("reportCompleted","Vedlikeholdsrapport utført")} ${formatDate(report.finished_at)}</span><span>${icon("person")}${escapeHtml(report.performed_by||"–")}</span></div></div></div><p>${escapeHtml(task.original_comment)}</p></aside>`:""}${sourcePhotos.length?`<section class="public-source-section"><h2>${icon("photo")}${pt("taskPhotos","Bilder til oppgaven")}</h2><div class="public-source-photos">${sourcePhotos.map((url,index)=>`<button type="button" data-source-photo="${index}"><img src="${escapeHtml(url)}" alt="${pt("taskPhoto","Bilde til oppgaven")} ${index+1}"><span>${pt("viewLarger","Se større")}</span></button>`).join("")}</div></section>`:""}${sjaMarkup()}${!started?`<button id="startButton" class="public-start" ${startBlocked?"disabled":""}>${pt("startWork","Start arbeid")}</button>${startBlocked?`<p class="public-sja-start-note">${pt("sjaBeforeStart","Fyll ut og lagre sikker jobb-analyse før arbeidet startes.")}</p>`:""}`:""}</section><section class="public-completion ${started?"":"locked"}"><header><h2>${pt("completion","Utførelse")}</h2>${!started?`<p>${pt("startHelp","Trykk Start arbeid for å fylle ut oppgaven.")}</p>`:""}</header><label class="public-required-name">${pt("enterName","Fyll inn navn")} <span aria-hidden="true">*</span><input id="completedName" required autocomplete="name" placeholder="${pt("yourName","Navnet ditt")}" value="${escapeHtml(form.name)}" ${disabled}></label><section class="public-checklist"><h2>${icon("check")}${pt("checklist","Sjekkpunkter")} <small>${checklist.length} ${pt("points","punkter")}</small></h2><div>${checklist.map((item,index)=>`<label class="public-check ${form.checked[index]?"is-complete":""}"><input class="taskCheckbox" data-index="${index}" type="checkbox" ${form.checked[index]?"checked":""} ${disabled}><span>${escapeHtml(item.text||item)}</span></label>`).join("")||`<p>${pt("noChecklist","Ingen sjekkpunkter.")}</p>`}</div></section><label>${pt("comment","Kommentar")}<textarea id="comment" ${disabled}>${escapeHtml(form.comment)}</textarea></label><section class="public-completion-photos"><h2>${icon("photo")}${pt("completionPhotos","Bilder fra utførelsen")}</h2><div id="newPhotos" class="public-new-photos">${uploaded.map((photo,index)=>`<div><img src="${escapeHtml(photo.url)}" alt="${pt("image","Bilde")}"><button type="button" data-remove="${index}" aria-label="${pt("removeImage","Fjern bilde")}">×</button></div>`).join("")}</div><label class="public-upload ${started?"":"disabled"}">+ ${pt("addImage","Legg til bilde")}<input id="photoInput" type="file" accept="image/*" multiple ${disabled} hidden></label></section><button id="finishButton" class="public-finish" ${disabled}>${pt("finishTask","Ferdigmeld oppdrag")}</button><p id="status" role="status"></p></section></section><div class="public-photo-modal hidden" data-photo-modal><button type="button" data-close-photo aria-label="${pt("close","Lukk")}">×</button><img data-modal-image alt=""><p data-modal-caption></p></div>${finishDialogs()}</main>`;
    bind();
  };
  const bindSja=()=>{
    const resizeStepFields=(scope=root)=>scope.querySelectorAll(".public-sja-step textarea").forEach(field=>{
      const resize=()=>{field.style.height="auto";field.style.height=`${field.scrollHeight}px`;};
      if(!field.dataset.autoResize){field.addEventListener("input",resize);field.dataset.autoResize="true";}
      resize();
    });
    resizeStepFields();
    root.querySelector("[data-sja-edit]")?.addEventListener("click",()=>{snapshot();editingSja=true;render();});
    root.querySelectorAll(".public-sja-remove").forEach(button=>button.addEventListener("click",()=>button.closest(".public-sja-step").remove()));
    root.querySelector("[data-sja-add]")?.addEventListener("click",()=>{const steps=root.querySelector("[data-sja-steps]");steps.insertAdjacentHTML("beforeend",sjaStep({},true));resizeStepFields(steps);});
    root.querySelector("[data-sja-save]")?.addEventListener("click",async()=>{const section=root.querySelector("#publicSja"),status=section.querySelector(".public-sja-status"),inputs=[...section.querySelectorAll("input,textarea")];if(inputs.filter(input=>input.required).some(input=>!input.value.trim())){status.textContent=pt("requiredFields","Fyll ut alle påkrevde felt.");return;}const steps=[...section.querySelectorAll(".public-sja-step")].map(block=>Object.fromEntries([...block.querySelectorAll("textarea")].map(input=>[input.name,input.value.trim()])));const value=name=>section.querySelector(`[name="${name}"]`)?.value.trim()||"";const response=await savePublicTaskSja({id:sja?.id,target_type:"task",task_code:code,work_description:value("work_description"),location:value("location"),planned_start_date:value("planned_start_date"),emergency_numbers:value("emergency_numbers"),prepared_by:value("prepared_by"),reviewed_by:value("reviewed_by"),steps});if(!response.success){status.textContent=response.message||pt("saveAnalysisFailed","Kunne ikke lagre analysen.");return;}snapshot();sja=response.sja;editingSja=false;render();});
  };
  const bind=()=>{
    bindSja();
    root.querySelector("#completedName")?.addEventListener("input",event=>event.currentTarget.classList.toggle("is-valid",Boolean(event.currentTarget.value.trim())));
    root.querySelectorAll(".taskCheckbox").forEach(input=>input.addEventListener("change",event=>event.currentTarget.closest(".public-check")?.classList.toggle("is-complete",event.currentTarget.checked)));
    root.querySelector("#startButton")?.addEventListener("click",async()=>{const response=await startPublicTask(code);if(response.success){snapshot();started=true;task.status="started";render();}});
    root.querySelector("#photoInput")?.addEventListener("change",async event=>{snapshot();const response=await uploadPublicTaskPhotos(code,event.target.files);if(response.success){uploaded.push(...response.photos);render();}});
    root.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{snapshot();uploaded.splice(Number(button.dataset.remove),1);render();}));
    const modal=root.querySelector("[data-photo-modal]"),openPhoto=index=>{modal.querySelector("[data-modal-image]").src=sourcePhotos[index];modal.querySelector("[data-modal-caption]").textContent=pt("imageOf","Bilde {current} av {total}").replace("{current}",index+1).replace("{total}",sourcePhotos.length);modal.classList.remove("hidden");};
    root.querySelectorAll("[data-source-photo]").forEach(button=>button.addEventListener("click",()=>openPhoto(Number(button.dataset.sourcePhoto))));
    root.querySelector("[data-close-photo]")?.addEventListener("click",()=>modal.classList.add("hidden"));modal?.addEventListener("click",event=>{if(event.target===modal)modal.classList.add("hidden");});
    const showFinishDialog=()=>{
      const modal=root.querySelector("[data-finish-modal]"),checkedCount=form.checked.filter(Boolean).length;
      modal.querySelector("[data-finish-name]").textContent=`${pt("completedBy","Utført av")}: ${form.name.trim()}`;
      modal.querySelector("[data-finish-checklist]").textContent=`${pt("checklist","Sjekkpunkter")}: ${checkedCount} / ${checklist.length} ${pt("completed","utført")}`;
      modal.querySelector("[data-finish-photos]").textContent=`${pt("completionPhotos","Bilder fra utførelsen")}: ${uploaded.length}`;
      modal.classList.remove("hidden");
      modal.querySelector("[data-finish-cancel]").onclick=()=>modal.classList.add("hidden");
      modal.querySelector("[data-finish-confirm]").onclick=submitCompletion;
    };
    const submitCompletion=async()=>{
      const modal=root.querySelector("[data-finish-modal]"),sending=root.querySelector("[data-sending-modal]"),status=root.querySelector("#status"),button=root.querySelector("#finishButton"),confirm=modal.querySelector("[data-finish-confirm]");
      confirm.disabled=true;modal.classList.add("hidden");sending.classList.remove("hidden");
      const completedChecklist=checklist.map((item,index)=>({text:item.text||item,checked:Boolean(form.checked[index])}));
      try{
        const response=await completePublicTask({link_code:code,completed_name:form.name.trim(),completed_comment:form.comment.trim(),checklist:completedChecklist,completed_photos:uploaded});
        if(response.success){location.replace(`/ferdig.html?congregation=${encodeURIComponent(task.congregation_id||"")}`);return;}
        status.textContent=response.message||pt("finishFailed","Kunne ikke ferdigmelde oppdraget.");
      }catch{
        status.textContent=pt("finishFailed","Kunne ikke ferdigmelde oppdraget.");
      }
      sending.classList.add("hidden");button.disabled=false;confirm.disabled=false;
    };
    root.querySelector("#finishButton")?.addEventListener("click",()=>{
      snapshot();
      const status=root.querySelector("#status");
      if(!form.name.trim()){status.textContent=pt("enterNameBeforeFinish","Skriv inn navnet ditt før du ferdigmelder oppdraget.");root.querySelector("#completedName").focus();return;}
      if(task.require_completion_photos&&!uploaded.length){status.textContent=pt("photoRequired","Denne oppgaven krever minst ett bilde før den kan ferdigmeldes.");return;}
      status.textContent="";
      showFinishDialog();
    });

  };
  render();
}
