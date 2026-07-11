import { login } from "../js/api.js";
import { state } from "../js/state.js";
export function initLogin(){
  const form=document.getElementById("loginForm"),status=document.getElementById("status"),button=document.getElementById("loginBtn");
  const passwordInput=document.getElementById("password"),passwordToggle=document.querySelector("[data-password-toggle]");
  passwordToggle?.addEventListener("click",()=>{const visible=passwordInput.type==="password";passwordInput.type=visible?"text":"password";passwordToggle.setAttribute("aria-pressed",String(visible));passwordToggle.setAttribute("aria-label",visible?"Skjul adgangskode":"Vis adgangskode");passwordToggle.innerHTML=visible?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.2 18.2 0 0 1-3.1 3.7M6.3 8.1A18.4 18.4 0 0 0 2 12s3.5 6 10 6a10.8 10.8 0 0 0 3.1-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/></svg>';});
  form?.addEventListener("submit",async event=>{event.preventDefault();button.disabled=true;status.textContent="";const result=await login(document.getElementById("email").value,document.getElementById("password").value);button.disabled=false;if(result.success){state.csrfToken=result.csrfToken||null;status.textContent="Innlogging vellykket.";location.href="/dashboard/dashboard.html";}else status.textContent=result.message||"Kunne ikke logge inn.";});

}
