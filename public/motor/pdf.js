import { state } from "./state.js";
import { dom } from "./dom.js";
import { uploadReport } from "./upload.js";
import { stopTimer } from "./work.js";
import { checkPageSpace } from "./pdf-utils.js";
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
    dom.timeInput.value;

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
    
let taskIndex = 0; 

state.currentJob.oppgaver.forEach(item => {

  // Gruppe med overskrift
  if (
  typeof item === "object" &&
  (item.punkter || item.innhold)
) {

    doc.setFontSize(12);
    doc.setFont(undefined,"bold");

    doc.text(
      item.overskrift.toUpperCase(),
      10,
      y
    );

    y += 10;
    
if(item.innhold){

  item.innhold.forEach(del => {

    if(del.type === "tekst"){

      doc.setFont(undefined,"normal");

      const tekstLinjer =
        doc.splitTextToSize(
          del.tekst.replace(/<[^>]*>/g, ""),
          180
        );

const blockHeight =
  (tekstLinjer.length * 6) + 8;

y =   checkPageSpace(     doc,     y,     blockHeight   );
      
      doc.text(tekstLinjer,10,y);

      y += (tekstLinjer.length * 6) + 8;

    }

    if(del.type === "punkt"){

const linjer =
  doc.splitTextToSize(del.tekst,120);

const blockHeight =
  (linjer.length * 6) + 10;

y =   checkPageSpace(     doc,     y,     blockHeight   );

const task =
  document.querySelectorAll(".task")[taskIndex];

      taskIndex++;

      if(task && task.checked){

        doc.setFont(undefined,"bold");
        doc.setTextColor(0,160,0);

        doc.text(state.translations.pdfDone,10,y);

      }else{

        doc.setFont(undefined,"bold");
        doc.setTextColor(200,0,0);

        doc.text(state.translations.pdfNotDone,10,y);

      }

      doc.setTextColor(0,0,0);
      doc.setFont(undefined,"normal");

      doc.text(
        linjer,
        55,
        y
      );

      y += (linjer.length * 6) + 6;

    }

  });

}
    
    // Valgfri tekst under overskrift
    if(item.tekst){

      doc.setFontSize(11);
      doc.setFont(undefined,"normal");

      const tekstLinjer =
        doc.splitTextToSize(
          item.tekst.replace(/<[^>]*>/g, ""),
          180
        );

const blockHeight =
  (tekstLinjer.length * 6) + 4;

y =   checkPageSpace(     doc,     y,     blockHeight   );      
      
      doc.text(tekstLinjer,10,y);

      y += (tekstLinjer.length * 6) + 4;

    }

if(item.punkter){

  item.punkter.forEach(tekst => {

      const linjer =
        doc.splitTextToSize(tekst,120);

const blockHeight =
  (linjer.length * 6) + 10;

y =   checkPageSpace(     doc,     y,     blockHeight   );    
    
      const task =
        document.querySelectorAll(".task")[taskIndex];

      taskIndex++;

      if(task && task.checked){

        doc.setFont(undefined,"bold");
        doc.setTextColor(0,160,0);
        doc.text(state.translations.pdfDone,10,y);

      }else{

        doc.setFont(undefined,"bold");
        doc.setTextColor(200,0,0);
        doc.text(state.translations.pdfNotDone,10,y);

      }

      doc.setTextColor(0,0,0);
      doc.setFont(undefined,"normal");

      doc.text(
        linjer,
        55,
        y
      );

      y += (linjer.length * 6) + 6;

    });

y += 4;

}

  }

  // Fritstående tekst uden checkbox
  else if (
    typeof item === "object" &&
    item.tekst
  ) {

    doc.setFont(undefined,"normal");

    const tekstLinjer =
      doc.splitTextToSize(
        item.tekst.replace(/<[^>]*>/g, ""),
        180
      );

const blockHeight =
  (tekstLinjer.length * 6) + 8;

y =   checkPageSpace(     doc,     y,     blockHeight   );    
    
    doc.text(tekstLinjer,10,y);

    y += (tekstLinjer.length * 6) + 8;

  }

  // Almindelig checkbox-opgave
  else {

    const tekst =
      String(item);

const linjer =
  doc.splitTextToSize(tekst,120);

const blockHeight =
  (linjer.length * 6) + 10;

y =   checkPageSpace(     doc,     y,     blockHeight   );

const task =
  document.querySelectorAll(".task")[taskIndex];

    taskIndex++;

    if(task && task.checked){

      doc.setFont(undefined,"bold");
      doc.setTextColor(0,160,0);
      doc.text(state.translations.pdfDone,10,y);

    }else{

      doc.setFont(undefined,"bold");
      doc.setTextColor(200,0,0);
      doc.text(state.translations.pdfNotDone,10,y);

    }

    doc.setTextColor(0,0,0);
    doc.setFont(undefined,"normal");

    doc.text(
      linjer,
      55,
      y
    );

    y += (linjer.length * 6) + 6;

  }

});
      
  doc.setFontSize(13);
  
  doc.setFont(undefined,"bold");
  
  checkPageSpace(50);

doc.text(state.translations.pdfNotes,10,y);
    
doc.setFontSize(11);

  y += 8;

  doc.setFont(undefined,"normal");

  const notater =
    document.getElementById("notes").value || "-";

  const noteLines =
    doc.splitTextToSize(notater,180);

  doc.text(noteLines,10,y);

  y += (noteLines.length * 6) + 10;

doc.text(
  `${state.translations.pdfAttachedPhotos}: ${state.selectedPhotos.length}`,
 10,
 y
);
const pdfBlob = doc.output("blob");

await uploadReport(pdfBlob);  
