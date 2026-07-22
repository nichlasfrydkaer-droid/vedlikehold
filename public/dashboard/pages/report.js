import { loadDashboard } from "../services/dashboard.js";
import { getReport } from "../js/api.js";
import { t } from "../js/i18n.js";

const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
const formatDate=value=>{const date=new Date(value);return value&&!Number.isNaN(date.getTime())?date.toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"–";};
const formatDuration=value=>{const seconds=Number(value);if(!Number.isFinite(seconds))return "–";const total=Math.max(0,Math.round(seconds));return total<60?`${total} sek`:`${Math.floor(total/60)} min ${total%60} sek`;};
const parseJson=value=>{try{return JSON.parse(value||"[]");}catch{return [];}};

function icon(name){
  const paths={back:`<path d="m14 6-6 6 6 6"/><path d="M8 12h12"/>`,person:`<circle cx="12" cy="8" r="3"/><path d="M5 21c.8-3.6 3.2-5.5 7-5.5s6.2 1.9 7 5.5"/>`,calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`,time:`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,pdf:`<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M8 15h8M8 18h6"/>`,note:`<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>`,check:`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 2.5 2.5L16 9"/>`,images:`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.2"/><path d="m3 17 5-5 3.5 3.5 2.5-2.5 4 4"/>`,reports:`<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 14h6M9 17h6"/>`};
  return `<span class="report-detail-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg></span>`;
}

function renderChecklist(items){
  if(!items.length)return `<p class="report-detail-empty">${t("noChecklistItems","Ingen punkter.")}</p>`;
  return `<ul class="report-checklist-list">${items.map(item=>item?.type==="heading"?`<li class="report-checklist-heading">${escapeHtml(item.text||item.title||"")}</li>`:`<li class="${item?.completed?"is-complete":""}"><span class="report-check-mark">${item?.completed?"✓":"–"}</span><span>${escapeHtml(item?.text||item?.title||item)}</span></li>`).join("")}</ul>`;
}

function renderRelated(reports,jobNumber){
  if(!reports.length)return "";
  return `<section class="report-detail-section"><h2>${icon("reports")}${t("previousReports","Tidligere rapporter for dette jobbkortet")}</h2><div class="report-related-list">${reports.map(report=>`<a href="/dashboard/report.html?id=${encodeURIComponent(report.id)}"><span><strong>${escapeHtml(report.title||t("report","Rapport"))}</strong><small>${formatDate(report.finished_at)} · ${escapeHtml(report.performed_by||"–")}</small></span><span class="report-related-open">${t("openReport","Åpne rapport")}</span></a>`).join("")}</div><a class="report-all-link" href="/dashboard/reports.html?jobcard=${encodeURIComponent(jobNumber)}">${t("allReportsForJobcard","Se alle rapporter for jobbkortet")}</a></section>`;
}

function renderPhotoCards(photos,previews){
  return photos.map((url,index)=>`<div class="report-photo-item"><button type="button" class="report-photo-button" data-photo-index="${index}"><img data-preview-src="${escapeHtml(previews[index]||url)}" data-original-src="${escapeHtml(url)}" alt="${t("photo","Bilde")} ${index+1}" loading="lazy" decoding="async"></button><a class="report-photo-download" href="${escapeHtml(url)}" download title="${t("download","Last ned")}" aria-label="${t("download","Last ned")} ${t("photo","Bilde")} ${index+1}">↓</a></div>`).join("");
}

function renderReport(report,checklist,photos,previews,relatedReports){
  return `<a class="report-back-link" href="/dashboard/reports.html">${icon("back")}${t("backToReports","Tilbake til rapporter")}</a><article class="report-detail-card"><header class="report-detail-header"><div><p class="report-detail-jobcard">${t("jobcard","Jobbkort")} ${escapeHtml(report.job_number||"–")}</p><h1>${escapeHtml(report.title||t("report","Rapport"))}</h1>${report.subtitle?`<p>${escapeHtml(report.subtitle)}</p>`:""}</div><div class="report-detail-actions"><a class="dashboard-button" href="${escapeHtml(report.pdf_url||"")}" target="_blank" rel="noopener noreferrer" download>${icon("pdf")}${t("downloadPdf","Last ned PDF")}</a>${report.sja_pdf_url?`<a class="dashboard-button report-sja-download" href="${escapeHtml(report.sja_pdf_url)}" target="_blank" rel="noopener noreferrer" download>${icon("pdf")}${t("downloadSja","Last ned SJA (DC-85)")}</a>`:""}</div></header><div class="report-detail-meta"><span>${icon("person")}<small>${t("completedBy","Utført av")}</small><strong>${escapeHtml(report.performed_by||"–")}</strong></span><span>${icon("calendar")}<small>${t("finished","Utført")}</small><strong>${formatDate(report.finished_at)}</strong></span><span>${icon("time")}<small>${t("duration","Varighet")}</small><strong>${formatDuration(report.duration_seconds)}</strong></span></div><section class="report-detail-section"><h2>${icon("note")}${t("notes","Notater")}</h2><div class="report-notes">${escapeHtml(report.notes||"–")}</div></section><section class="report-detail-section"><h2>${icon("check")}${t("checklist","Sjekkpunkter")}</h2>${renderChecklist(checklist)}</section><section class="report-detail-section"><h2>${icon("images")}${t("photos","Bilder")} (${photos.length})</h2>${photos.length?`<div class="report-photo-grid">${renderPhotoCards(photos,previews)}</div>`:`<p class="report-detail-empty">${t("noPhotos","Ingen bilder.")}</p>`}</section>${renderRelated(relatedReports,report.job_number)}</article><div class="report-photo-modal hidden" data-photo-modal><button class="report-photo-close" type="button" data-photo-close aria-label="${t("close","Lukk")}">×</button><button class="report-photo-nav previous" type="button" data-photo-previous aria-label="${t("previous","Forrige")}">‹</button><img data-photo-full alt=""><button class="report-photo-nav next" type="button" data-photo-next aria-label="${t("next","Neste")}">›</button><p data-photo-count></p></div>`;
}

function initSequentialPhotoLoading(root){
  const images=[...root.querySelectorAll("img[data-preview-src]")];let index=0;
  const loadNext=()=>{const image=images[index++];if(!image)return;const load=(source,canFallback)=>{image.onload=()=>{image.onload=null;image.onerror=null;loadNext();};image.onerror=()=>{if(canFallback&&image.dataset.originalSrc&&source!==image.dataset.originalSrc){load(image.dataset.originalSrc,false);return;}image.onload=null;image.onerror=null;loadNext();};image.src=source;};load(image.dataset.previewSrc,image.dataset.previewSrc!==image.dataset.originalSrc);};
  loadNext();
}

function initPhotoViewer(photos){
  const modal=document.querySelector("[data-photo-modal]");if(!modal||!photos.length)return;let index=0;
  const show=next=>{index=(next+photos.length)%photos.length;modal.querySelector("[data-photo-full]").src=photos[index];modal.querySelector("[data-photo-count]").textContent=`${index+1} / ${photos.length}`;modal.classList.remove("hidden");};
  document.querySelectorAll("[data-photo-index]").forEach(button=>button.addEventListener("click",()=>show(Number(button.dataset.photoIndex))));modal.querySelector("[data-photo-close]").addEventListener("click",()=>modal.classList.add("hidden"));modal.querySelector("[data-photo-previous]").addEventListener("click",()=>show(index-1));modal.querySelector("[data-photo-next]").addEventListener("click",()=>show(index+1));modal.addEventListener("click",event=>{if(event.target===modal)modal.classList.add("hidden");});document.addEventListener("keydown",event=>{if(modal.classList.contains("hidden"))return;if(event.key==="Escape")modal.classList.add("hidden");if(event.key==="ArrowLeft")show(index-1);if(event.key==="ArrowRight")show(index+1);});
}

export async function initReport(){
  const container=document.getElementById("report"),me=await loadDashboard(),id=new URLSearchParams(location.search).get("id");
  if(!me||(!me.success&&!me.fallback)||!id){container.innerHTML=`<section class="dashboard-card"><p>${t("reportNotFound","Rapport ikke funnet.")}</p></section>`;return;}
  const result=await getReport(id);
  if(!result?.success){container.innerHTML=`<section class="dashboard-card"><p>${t("reportLoadFailed","Rapport kunne ikke lastes.")}</p></section>`;return;}
  const report=result.report,checklist=parseJson(report.tasks_json),photos=parseJson(report.photo_urls_json),previews=parseJson(report.photo_preview_urls_json);
  container.innerHTML=renderReport(report,checklist,photos,previews,result.relatedReports||[]);
  container.querySelector(".report-detail-header")?.insertAdjacentHTML("beforeend",`<a class="dashboard-button report-create-task" href="/dashboard/create-task.html?report=${encodeURIComponent(report.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>${t("createTask","Opprett oppdrag")}</a>`);
  initSequentialPhotoLoading(container);initPhotoViewer(photos);
}
