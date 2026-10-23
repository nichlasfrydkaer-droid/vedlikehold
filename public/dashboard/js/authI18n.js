const strings={
  no:{welcomeBack:"Velkommen tilbake",login:"Logg inn",loginIntro:"Logg inn for å administrere menigheten din.",email:"E-post",password:"Adgangskode",showPassword:"Vis adgangskode",hidePassword:"Skjul adgangskode",forgotPassword:"Glemt adgangskode?",loginFailed:"Kunne ikke logge inn.",name:"Navn",newPassword:"Ny adgangskode",savePassword:"Lagre adgangskode",passwordReady:"Adgangskoden er klar. Du kan nå logge inn.",saveFailed:"Kunne ikke lagre adgangskoden.",welcome:"Velkommen",activateIntro:"Opprett en sikker adgangskode for kontoen din.",resetIntro:"Velg en ny sikker adgangskode.",forgotIntro:"Skriv e-postadressen din, så sender vi en lenke hvis kontoen finnes.",sendLink:"Send lenke",checkInbox:"Sjekk innboksen din."},
  da:{welcomeBack:"Velkommen tilbage",login:"Log ind",loginIntro:"Log ind for at administrere din menighed.",email:"E-mail",password:"Adgangskode",showPassword:"Vis adgangskode",hidePassword:"Skjul adgangskode",forgotPassword:"Glemt adgangskode?",loginFailed:"Kunne ikke logge ind.",name:"Navn",newPassword:"Ny adgangskode",savePassword:"Gem adgangskode",passwordReady:"Adgangskoden er klar. Du kan nu logge ind.",saveFailed:"Adgangskoden kunne ikke gemmes.",welcome:"Velkommen",activateIntro:"Opret en sikker adgangskode til din konto.",resetIntro:"Vælg en ny sikker adgangskode.",forgotIntro:"Indtast din e-mailadresse, så sender vi et link, hvis kontoen findes.",sendLink:"Send link",checkInbox:"Tjek din indbakke."}
};

export function authText(){
  const requested=new URLSearchParams(location.search).get("language")||localStorage.getItem("dashboard_language")||navigator.language||"no";
  const language=String(requested).toLowerCase().startsWith("da")?"da":"no";
  document.documentElement.lang=language;
  localStorage.setItem("dashboard_language",language);
  return strings[language];
}
