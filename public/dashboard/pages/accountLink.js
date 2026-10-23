import { account } from "../js/api.js";
import { authText } from "../js/authI18n.js";

function passwordForm({title,intro,action,showName=false}){
  const text=authText();document.querySelector("main").innerHTML=`<section class="auth-card"><img class="auth-logo" src="/dashboard/assets/logo.png" alt="Vedlikeholdsystem"><h1>${title(text)}</h1><p class="auth-intro">${intro(text)}</p><form id="accountForm" autocomplete="off">${showName?`<label>${text.name}</label><input name="full_name" autocomplete="off" required>`:""}<label>${text.newPassword}</label><input name="new_password" type="password" autocomplete="off" minlength="10" required><button class="auth-submit" type="submit">${text.savePassword}</button><p id="status" class="auth-status"></p></form></section>`;
  document.getElementById("accountForm").onsubmit=async event=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const result=await account(action,{
      name:form.get("full_name") || undefined,
      password:form.get("new_password"),
      token:new URLSearchParams(location.search).get("token")
    });
    document.getElementById("status").textContent=result.success?text.passwordReady:(result.message||text.saveFailed);
    if(result.success) setTimeout(()=>location.href="/dashboard/login.html",900);
  };
}
export function initActivate(){passwordForm({title:text=>text.welcome,intro:text=>text.activateIntro,action:'activate',showName:true});}
export function initResetPassword(){passwordForm({title:text=>text.newPassword,intro:text=>text.resetIntro,action:'reset-password'});}
export function initForgotPassword(){const text=authText();document.querySelector('main').innerHTML=`<section class="auth-card"><img class="auth-logo" src="/dashboard/assets/logo.png" alt="Vedlikeholdsystem"><h1>${text.forgotPassword}</h1><p class="auth-intro">${text.forgotIntro}</p><form id="forgotForm"><label>${text.email}</label><input name="email" type="email" autocomplete="email" required><button class="auth-submit" type="submit">${text.sendLink}</button><p id="status" class="auth-status"></p></form></section>`;document.getElementById('forgotForm').onsubmit=async e=>{e.preventDefault();const r=await account('forgot-password',Object.fromEntries(new FormData(e.currentTarget)));document.getElementById('status').textContent=r.message||text.checkInbox;};}
