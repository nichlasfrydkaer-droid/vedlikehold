import { state } from "./state.js";

export function formatDate(date){

    if(!date){

        return "-";

    }

    return new Date(date).toLocaleString(

        state.language,

        {

            dateStyle:"medium",

            timeStyle:"short"

        }

    );

}

export function formatShortDate(date){

    if(!date){

        return "-";

    }

    return new Date(date).toLocaleDateString(

        state.language

    );

}

export function formatMinutes(seconds){

    if(!seconds){

        return "-";

    }

    return Math.round(seconds / 60) + " min";

}
