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
