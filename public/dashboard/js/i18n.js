let translations = {};

import { state } from "./state.js";

function normalizeLanguage(language = ""){

    const normalized =
        String(language || "")
            .trim()
            .toLowerCase();

    if(!normalized){

        return "no";

    }

    if(
        ["da", "danish", "dansk"]
            .includes(normalized)
    ){

        return "da";

    }

    if(
        ["nb", "nn", "no", "norwegian", "norsk", "bokmål", "nynorsk"]
            .includes(normalized)
    ){

        return "no";

    }

    if(
        ["en", "eng", "english", "engelsk"]
            .includes(normalized)
    ){

        return "en";

    }

    return normalized;

}

async function loadLanguageFile(language){

    const normalizedLanguage =
        normalizeLanguage(language);

    const response =
        await fetch(
            `/dashboard/lang/${normalizedLanguage}.json`
        );

    if(!response.ok){

        throw new Error(
            `Language file not found: ${normalizedLanguage}`
        );

    }

    const text =
        await response.text();

    if(!text){

        throw new Error(
            `Empty language file: ${normalizedLanguage}`
        );

    }

    return JSON.parse(text);

}

export async function loadTranslations(language){

    state.language =
        normalizeLanguage(language);

    try{

        translations =
            await loadLanguageFile(
                state.language
            );

        return;

    }catch(error){

        console.error(error);

    }

    try{

        translations =
            await loadLanguageFile("no");

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
