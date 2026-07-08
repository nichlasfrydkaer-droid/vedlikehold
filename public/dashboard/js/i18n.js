let translations = {};

import { state } from "./state.js";

export async function loadTranslations(language){

    state.language =
        language;

    try{

        const response =
            await fetch(
                `/dashboard/lang/${language}.json`
            );

        if(response.ok){

            translations =
                await response.json();

            return;

        }

    }catch(e){

        console.error(e);

    }

    const fallback =
        await fetch(
            "/dashboard/lang/no.json"
        );

    translations =
        await fallback.json();

}

export function t(key, fallback = ""){

    if(key in translations){

        return translations[key];

    }

    return fallback || key;

}

export function getTranslations(){

    return translations;

}
