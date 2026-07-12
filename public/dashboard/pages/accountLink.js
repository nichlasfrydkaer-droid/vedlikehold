import { account } from "../js/api.js";

function passwordForm({title,intro,action,showName=false}){
  document.querySelector("main").innerHTML=`<section class="auth-card"><img class="auth-logo" src="/dashboard/assets/logo.png" alt="Vedlikeholdsystem"><h1>${title}</h1><p class="auth-intro">${intro}</p><form id="accountForm" autocomplete="off">${showName?'<label>Navn</label><input name="full_name" autocomplete="off" required>':''}<label>Ny adgangskode</label><input name="new_password" type="password" autocomplete="off" minlength="10" required><button class="auth-submit" type="submit">Lagre adgangskode</button><p id="status" class="auth-status"></p></form></section>`;
  document.getElementById("accountForm").onsubmit=async event=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const result=await account(action,{
      name:form.get("full_name") || undefined,
      password:form.get("new_password"),
      token:new URLSearchParams(location.search).get("token")
    });
    document.getElementById("status").textContent=result.success?"Adgangskoden er klar. Du kan nå logge inn.":(result.message||"Kunne ikke lagre adgangskoden.");
    if(result.success) setTimeout(()=>location.href="/dashboard/login.html",900);
  };
}
export function initActivate(){passwordForm({title:'Velkommen',intro:'Opprett en sikker adgangskode for kontoen din.',action:'activate',showName:true});}
export function initResetPassword(){passwordForm({title:'Ny adgangskode',intro:'Velg en ny sikker adgangskode.',action:'reset-password'});}
export function initForgotPassword(){document.querySelector('main').innerHTML=`<section class="auth-card"><img class="auth-logo" src="/dashboard/assets/logo.png" alt="Vedlikeholdsystem"><h1>Glemt adgangskode?</h1><p class="auth-intro">Skriv e-postadressen din, så sender vi en lenke hvis kontoen finnes.</p><form id="forgotForm"><label>E-post</label><input name="email" type="email" autocomplete="email" required><button class="auth-submit" type="submit">Send lenke</button><p id="status" class="auth-status"></p></form></section>`;document.getElementById('forgotForm').onsubmit=async e=>{e.preventDefault();const r=await account('forgot-password',Object.fromEntries(new FormData(e.currentTarget)));document.getElementById('status').textContent=r.message||'Sjekk innboksen din.';};}
