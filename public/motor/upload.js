import { state } from "./state.js";
import { config } from "./config.js";
import { dom } from "./dom.js";

export async function uploadReport(
    pdfBlob,
    report
){

    const formData =
        new FormData();

    const params =
        new URLSearchParams(
            window.location.search
        );

    const congregation =
        params.get("congregation");

    formData.append(

        "file",

        pdfBlob,

        `Jobbkort-${state.currentJob.nummer}.pdf`

    );

    formData.append(

        "congregation",

        congregation

    );

    formData.append(

        "token",

        config.apiToken

    );

    //
    // Hele rapporten sendes til Dashboard
    //

    formData.append(

        "report",

        JSON.stringify(report)

    );

    state.selectedPhotos.forEach(photo=>{

        formData.append(

            "photos",

            photo,

            photo.name

        );

    });

    if(state.selectedPhotos.length > config.maxFiles){

        alert(

            state.translations.alertMaxFiles
                .replace(
                    "{count}",
                    config.maxFiles
                )

        );

        return false;

    }

    const totalBytes =
        state.selectedPhotos.reduce(

            (sum,file)=>

                sum + file.size,

            0

        );

    const totalMB =
        totalBytes / 1024 / 1024;

    if(totalMB > config.maxTotalMB){

        alert(

            state.translations.alertMaxSize

                .replace(
                    "{size}",
                    totalMB.toFixed(1)
                )

                .replace(
                    "{max}",
                    config.maxTotalMB
                )

        );

        return false;

    }

    dom.status.innerHTML =
        state.translations.statusSending;

    try{

        dom.finishBtn.disabled =
            true;

        dom.finishBtn.innerHTML =
            state.translations.buttonSending;

        const response =
            await fetch(

                config.apiUrl,

                {

                    method:"POST",

                    body:formData

                }

            );

        if(!response.ok){

            throw new Error(
                "Upload feilet"
            );

        }

        dom.status.innerHTML =
            state.translations.statusSent;

        setTimeout(()=>{

            window.location.href =

                `ferdig.html?congregation=${congregation}`;

        },1000);

        return true;

    }

    catch(err){

        console.error(err);

        dom.finishBtn.disabled =
            false;

        dom.finishBtn.innerHTML =
            state.translations.finish;

        dom.status.innerHTML =
            state.translations.statusError;

        return false;

    }

}
