import { getDashboardLocale } from "./i18n.js";

export function formatDate(date){

    if(!date){

        return "-";

    }

    return new Date(date).toLocaleString(

        getDashboardLocale(),

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

        getDashboardLocale()

    );

}

export function formatMinutes(seconds){

    if(!seconds){

        return "-";

    }

    return Math.round(seconds / 60) + " min";

}
