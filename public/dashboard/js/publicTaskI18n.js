const danish = {
  moreInformation:"Mere information", readyToFinish:"Klar til at afslutte?", reviewBeforeSend:"Kontrollér opsummeringen, før rapporten sendes.", undo:"Fortryd", confirm:"Bekræft", sendingReport:"Sender rapport ...", doNotLeave:"Forlad ikke siden.", taskNotFound:"Opgaven blev ikke fundet", removeWorkStep:"Fjern arbejdstrin", workStep:"Arbejdstrin", workStepHelp:"Beskriv arbejdsopgaven i den rækkefølge, den skal udføres.", risk:"Risiko", riskHelp:"Skriv, hvad der kan gå galt eller medføre skade.", measure:"Kontrolforanstaltning", measureHelp:"Skriv, hvad I gør for at reducere risikoen.", sjaComplete:"Sikker jobanalyse er udfyldt", open:"Åbn", downloadSja:"Download SJA (DC-85)", sjaTitle:"Sikker jobanalyse", sjaIntro:"Udfyld analysen, før arbejdet starter.", sjaGuide:"Vejledning: Sikker jobanalyse (DC-85)", workDescription:"Beskrivelse af arbejdet", location:"Sted", plannedStart:"Planlagt startdato", emergencyNumbers:"Nødnumre", riskAssessment:"Risikovurdering", addWorkStep:"Tilføj arbejdstrin", preparedBy:"Udarbejdet af", reviewedBy:"Gennemgået af", saveAnalysis:"Gem analyse", openStatus:"Åben", startedStatus:"Startet", overdueStatus:"Overskredet", deadline:"Frist", task:"Opgaven", reportNote:"Notat fra vedligeholdelsesrapport", reportCompleted:"Vedligeholdelsesrapport udført", taskPhotos:"Billeder til opgaven", taskPhoto:"Billede til opgaven", viewLarger:"Se større", startWork:"Start arbejdet", sjaBeforeStart:"Udfyld og gem sikker jobanalyse, før arbejdet startes.", completion:"Udførelse", startHelp:"Tryk på Start arbejdet for at udfylde opgaven.", enterName:"Indtast navn", yourName:"Dit navn", checklist:"Tjekpunkter", points:"punkter", noChecklist:"Ingen tjekpunkter.", comment:"Kommentar", completionPhotos:"Billeder fra udførelsen", image:"Billede", removeImage:"Fjern billede", addImage:"Tilføj billede", finishTask:"Afslut opgaven", close:"Luk", requiredFields:"Udfyld alle obligatoriske felter.", saveAnalysisFailed:"Analysen kunne ikke gemmes.", completedBy:"Udført af", completed:"udført", finishFailed:"Opgaven kunne ikke afsluttes.", enterNameBeforeFinish:"Indtast dit navn, før du afslutter opgaven.", photoRequired:"Denne opgave kræver mindst ét billede, før den kan afsluttes.", imageOf:"Billede {current} af {total}"
};

let language = "no";

export function setPublicTaskLanguage(value){
  const normalized=String(value||"").toLowerCase();
  language=normalized.startsWith("da")||normalized.includes("dansk")?"da":"no";
  document.documentElement.lang=language;
}

export function pt(key,norwegian){ return language==="da" ? (danish[key]||norwegian) : norwegian; }
export function publicTaskLocale(){ return language==="da" ? "da-DK" : "nb-NO"; }
