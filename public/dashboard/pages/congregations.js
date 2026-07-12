import { loadDashboard } from "../services/dashboard.js";
import { getCongregationManagement,createCongregation,updateCongregation } from "../js/api.js";
import { t } from "../js/i18n.js";
import { showToast } from "../components/toast.js";

const safe=value=>String(value||"").replace(/[&<'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"})[char]);
const timeZones=[
  ["Pacific/Pago_Pago","GMT−11:00 · Pago Pago"],
  ["Pacific/Honolulu","GMT−10:00 · Honolulu"],
  ["America/Anchorage","GMT−09:00 · Anchorage"],
  ["America/Los_Angeles","GMT−08:00 · Los Angeles"],
  ["America/Denver","GMT−07:00 · Denver"],
  ["America/Chicago","GMT−06:00 · Chicago"],
  ["America/New_York","GMT−05:00 · New York"],
  ["America/Halifax","GMT−04:00 · Halifax"],
  ["America/St_Johns","GMT−03:30 · St. John's"],
  ["America/Sao_Paulo","GMT−03:00 · Brasília"],
  ["Atlantic/South_Georgia","GMT−02:00 · Grytviken"],
  ["Atlantic/Azores","GMT−01:00 · Ponta Delgada"],
  ["Europe/London","GMT+00:00 · London"],
  ["Europe/Oslo","GMT+01:00 · Oslo"],
  ["Europe/Copenhagen","GMT+01:00 · København"],
  ["Europe/Berlin","GMT+01:00 · Berlin"],
  ["Europe/Athens","GMT+02:00 · Athen"],
  ["Europe/Moscow","GMT+03:00 · Moskva"],
  ["Asia/Dubai","GMT+04:00 · Dubai"],
  ["Asia/Karachi","GMT+05:00 · Islamabad"],
  ["Asia/Kolkata","GMT+05:30 · New Delhi"],
  ["Asia/Kathmandu","GMT+05:45 · Kathmandu"],
  ["Asia/Dhaka","GMT+06:00 · Dhaka"],
  ["Asia/Yangon","GMT+06:30 · Naypyidaw"],
  ["Asia/Bangkok","GMT+07:00 · Bangkok"],
  ["Asia/Singapore","GMT+08:00 · Singapore"],
  ["Australia/Eucla","GMT+08:45 · Eucla"],
  ["Asia/Tokyo","GMT+09:00 · Tokyo"],
  ["Australia/Adelaide","GMT+09:30 · Adelaide"],
  ["Australia/Sydney","GMT+10:00 · Sydney"],
  ["Pacific/Noumea","GMT+11:00 · Nouméa"],
  ["Pacific/Auckland","GMT+12:00 · Wellington"],
  ["Pacific/Chatham","GMT+12:45 · Chatham"],
  ["Pacific/Tongatapu","GMT+13:00 · Nuku'alofa"],
  ["Pacific/Kiritimati","GMT+14:00 · Kiritimati"]
];
const languageName=value=>({no:t("languageNorwegian","Norsk"),da:t("languageDanish","Dansk"),en:t("languageEnglish","English")}[value]);
const zoneOptions=selected=>timeZones.map(([value,label])=>`<option value="${value}" ${value===selected?"selected":""}>${label}</option>`).join("");

export async function initCongregations(){
  const me=await loadDashboard();
  const main=document.querySelector("main");
  if(!me?.user?.is_owner){ location.href="/dashboard/dashboard.html"; return; }

  const render=async()=>{
    const result=await getCongregationManagement();
    if(!result.success){
      main.innerHTML=`<section class="dashboard-card dashboard-full"><h2>${t("congregations","Menigheter")}</h2><p>${t("congregationsLoadFailed","Kunne ikke hente menighetene.")}</p></section>`;
      return;
    }

    main.innerHTML=`<section class="dashboard-card dashboard-full management-heading"><p class="page-eyebrow">${t("systemAdministration","Systemadministrasjon")}</p><h2>${t("congregations","Menigheter")}</h2><p>${t("congregationsIntro","Opprett menigheter og velg språk, tidssone og første administrator.")}</p></section><section class="dashboard-card dashboard-full member-card"><h3>${t("newCongregation","Ny menighet")}</h3><form id="createCongregation" class="congregation-form"><input name="name" placeholder="${t("congregationName","Navn på menighet")}" required><input name="id" placeholder="${t("congregationIdOptional","Kort id (valgfritt)")}"><select name="language">${["no","da","en"].map(value=>`<option value="${value}">${languageName(value)}</option>`).join("")}</select><select name="timezone">${zoneOptions("Europe/Oslo")}</select><input name="admin_email" type="email" placeholder="${t("firstAdminEmail","Første administrators e-post")}" required><button type="submit">${t("createCongregation","Opprett menighet")}</button></form><p id="congregationStatus" class="form-status"></p></section><section class="dashboard-card dashboard-full member-card"><h3>${t("allCongregations","Alle menigheter")}</h3><div class="congregation-list">${result.congregations.map(congregation=>`<form class="congregation-row" data-congregation="${safe(congregation.id)}"><div><strong>${safe(congregation.name)}</strong><span>${safe(congregation.id)} · ${congregation.member_count} ${t("users","brukere")} · ${congregation.admin_count} ${t("administrators","administratorer")}</span></div><input name="name" value="${safe(congregation.name)}" required><select name="language">${["no","da","en"].map(value=>`<option value="${value}" ${congregation.language===value?"selected":""}>${languageName(value)}</option>`).join("")}</select><select name="timezone">${zoneOptions(congregation.timezone)}</select><button type="submit">${t("save","Lagre")}</button></form>`).join("")}</div></section>`;

    document.getElementById("createCongregation").onsubmit=async event=>{
      event.preventDefault();
      const button=event.currentTarget.querySelector("button");
      const original=button.textContent;
      button.disabled=true;
      button.textContent=t("saving","Lagrer...");
      const response=await createCongregation(Object.fromEntries(new FormData(event.currentTarget)));
      button.disabled=false;
      button.textContent=original;
      document.getElementById("congregationStatus").textContent=response.success?"":(response.message||t("congregationCreateFailed","Kunne ikke opprette menigheten."));
      if(response.success){ showToast(t("congregationCreated","Menigheten er opprettet.")); event.currentTarget.reset(); render(); }
    };

    document.querySelectorAll("[data-congregation]").forEach(form=>form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector("button");
      const original=button.textContent;
      button.disabled=true;
      button.textContent=t("saving","Lagrer...");
      const response=await updateCongregation({id:form.dataset.congregation,...Object.fromEntries(new FormData(form))});
      button.disabled=false;
      button.textContent=original;
      if(!response.success){ alert(response.message||t("saveFailed","Kunne ikke lagre.")); return; }
      showToast(t("saved","Lagret"));
      render();
    });
  };

  await render();
}
