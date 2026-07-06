export function checkPageSpace(doc, y, requiredHeight){

  if(y + requiredHeight > 270){

    doc.addPage();

    return 20;

  }

  return y;

}
