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

            const text =
                await response.text();

            if(text){

                try{

                    translations =
                        JSON.parse(text);

                    return;

                }catch(error){

                    console.error(error);

                }

            }

        }

    }catch(error){

        console.error(error);

    }

    try{

        const fallback =
            await fetch(
                "/dashboard/lang/no.json"
            );

        const fallbackText =
            await fallback.text();

        translations =
            fallbackText
                ? JSON.parse(fallbackText)
                : {};

    }catch(error){

        console.error(error);
        translations = {};

    }

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
