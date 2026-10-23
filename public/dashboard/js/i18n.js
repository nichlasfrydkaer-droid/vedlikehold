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

export function localeForLanguage(language = ""){

    return ({
        da:"da-DK",
        en:"en-GB",
        no:"nb-NO"
    })[normalizeLanguage(language)] || "nb-NO";

}

export function getDashboardLocale(){

    return localeForLanguage(
        state.language ||
        (typeof document !== "undefined" ? document.documentElement.lang : "") ||
        "no"
    );

}

function applyLanguage(language){

    state.language = normalizeLanguage(language);

    if(typeof document !== "undefined"){

        document.documentElement.lang = state.language;

    }

    localStorage.setItem("dashboard_language",state.language);

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

    applyLanguage(language);

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

        applyLanguage("no");

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
