import { login } from "../js/api.js";
export function initLogin(){
  const form=document.getElementById("loginForm"),status=document.getElementById("status"),button=document.getElementById("loginBtn");
  document.querySelector("[data-password-toggle]")?.addEventListener("click",()=>{const input=document.getElementById("password");input.type=input.type==="password"?"text":"password";});
  form?.addEventListener("submit",async event=>{event.preventDefault();button.disabled=true;status.textContent="";const result=await login(document.getElementById("email").value,document.getElementById("password").value);button.disabled=false;if(result.success){sessionStorage.setItem("dashboard_token",result.token);status.textContent="Innlogging vellykket.";location.href="/dashboard/dashboard.html";}else status.textContent=result.message||"Kunne ikke logge inn.";});

}
