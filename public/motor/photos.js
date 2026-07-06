import { state } from "./state.js";
import { dom } from "./dom.js";

export function initPhotos(){

  dom.photos.addEventListener("change", e => {

    state.selectedPhotos =
      state.selectedPhotos.concat(
        Array.from(e.target.files)
      );

    e.target.value = "";

    renderPreview();

  });

}

export function autoResizeNotes(){

  dom.notes.addEventListener("input", function(){

    this.style.height = "auto";
    this.style.height =
      this.scrollHeight + "px";

  });

}

export function renderPreview(){

  dom.preview.innerHTML = "";

  state.selectedPhotos.forEach((file,index)=>{

    const url =
      URL.createObjectURL(file);

    dom.preview.innerHTML += `
      <div class="previewItem">
        <img src="${url}">
        <button
          class="removeBtn"
          data-index="${index}">
          ×
        </button>
      </div>
    `;

  });

  dom.preview
    .querySelectorAll(".removeBtn")
    .forEach(btn=>{

      btn.onclick = () => {

        removePhoto(
          Number(btn.dataset.index)
        );

      };

    });

}

export function removePhoto(index){

  state.selectedPhotos.splice(index,1);

  renderPreview();

}
