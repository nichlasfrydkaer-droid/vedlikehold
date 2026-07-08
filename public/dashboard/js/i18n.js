let translations = {};

import { state } from "./state.js";

export async function loadTranslations(language){

    state.language =
        language;

    try{

        const response =
            await fetch(
                `/dashboard/translations/${language}.json`
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
            "/dashboard/translations/no.json"
        );

    translations =
        await fallback.json();

}

export function t(key){

    return translations[key] ?? key;

}

export function getTranslations(){

    return translations;

}
