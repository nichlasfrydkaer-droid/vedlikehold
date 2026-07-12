import { buildReport } from "./report.js";
import { checkPageSpace } from "./pdfHelpers.js";
import { drawTasks } from "./pdfTasks.js";
import { state } from "./state.js";
import { dom } from "./dom.js";
import { uploadReport } from "./upload.js";
import { stopTimer, startTimer } from "./timer.js";
export async function generatePDF(){

  stopTimer();

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  let y = 15;

  doc.setFontSize(18);
  doc.text(
    `JOBBKORT ${state.currentJob.nummer}`,
    10,
    y
  );

  y += 10;

doc.setFontSize(14);
doc.text(
  state.currentJob.titel.toUpperCase(),
  10,
  y
);

y += 10;

if(state.currentJob.undertittel){

  doc.setFontSize(11);
  doc.setFont(undefined,"bold");

  doc.text(
    state.currentJob.undertittel,
    10,
    y
  );

  y += 10;

}

y += 5;

  const navn =
    dom.nameInput.value;

  const tid =
  dom.timeInput.textContent;

const datoObj = new Date();

const dato =
  String(datoObj.getDate()).padStart(2,"0") + "." +
  String(datoObj.getMonth()+1).padStart(2,"0") + "." +
  datoObj.getFullYear();

  doc.setFontSize(11);

  doc.text(`${state.translations.pdfName}: ${navn}`,10,y);
  y += 8;

  doc.text(`${state.translations.pdfDate}: ${dato}`,10,y);
  y += 8;

  doc.text(`${state.translations.pdfTime}: ${tid}`,10,y);
  y += 15;

doc.setFontSize(13);

doc.setFont(undefined,"bold");

doc.text(state.translations.pdfChecklist,10,y);

y += 12;

doc.setFontSize(10);

y = drawTasks(doc, y);

doc.setFontSize(13);
  
  doc.setFont(undefined,"bold");
  
const notater =
  dom.notes.value || "-";

const noteLines =
  doc.splitTextToSize(notater, 180);

y = checkPageSpace(
  doc,
  y,
  (noteLines.length * 6) + 20
);

doc.text(state.translations.pdfNotes, 10, y);
    
doc.setFontSize(11);

  y += 8;

  doc.setFont(undefined,"normal");

  doc.text(noteLines,10,y);

  y += (noteLines.length * 6) + 10;

doc.text(
  `${state.translations.pdfAttachedPhotos}: ${state.selectedPhotos.length}`,
 10,
 y
);
const report =
    buildReport();

const pdfBlob =
    doc.output("blob");

const sent = await uploadReport(

    pdfBlob,

    report

);

if(!sent && state.started){
  startTimer();
}

}
