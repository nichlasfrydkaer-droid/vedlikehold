import { config } from "./config.js";

async function request(
    endpoint,
    options = {}
){

    const headers = {

        "Content-Type":"application/json",

        ...(options.headers || {})

    };

    const token =
        localStorage.getItem(
            "dashboard_token"
        );

    if(token){

        headers.Authorization =
            "Bearer " + token;

    }

    const response =
        await fetch(

            config.api + endpoint,

            {

                ...options,

                headers

            }

        );

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    let data = {};

    try{

        if(
            contentType.includes(
                "application/json"
            )
        ){

            data = await response.json();

        }else{

            const text =
                await response.text();

            if(text){

                try{

                    data = JSON.parse(text);

                }catch(error){

                    data = {
                        success:false,
                        error:text
                    };

                }

            }

        }

    }catch(error){

        return {
            success:false,
            status:response.status,
            statusText:response.statusText,
            error:error.message
        };

    }

    if(!response.ok){

        return {
            success:false,
            status:response.status,
            statusText:response.statusText,
            ...(typeof data === "object" && data && !Array.isArray(data) ? data : {}),
            error:data?.error || "Request failed"
        };

    }

    return data;

}

export async function login(
    email,
    password
){

    return await request(

        "/login",

        {

            method:"POST",

            body:JSON.stringify({

                email,
                password

            })

        }

    );

}

export async function getMe(){

    return await request(
        "/me"
    );

}

export async function getInbox(){

    return await request(
        "/inbox"
    );

}

export async function getReports(
    congregationId
){

    return await request(

        "/reports?congregation=" +

        encodeURIComponent(
            congregationId
        )

    );

}

export async function getReport(
    id
){

    return await request(

        "/report?id=" +

        encodeURIComponent(
            id
        )

    );

}

export async function getTasks(
    congregationId
){

    return await request(

        "/tasks?congregation=" +

        encodeURIComponent(
            congregationId
        )

    );

}

export async function getTask(
    id
){

    return await request(

        "/task?id=" +

        encodeURIComponent(
            id
        )

    );

}

function normalizeJobcardLanguage(value = ""){

    const normalized = String(value || "").trim().toLowerCase();

    if(!normalized){
        return "da";
    }

    if(["no", "nb", "nn", "norsk", "norwegian"].includes(normalized)){
        return "no";
    }

    if(["da", "dk", "danish", "dansk"].includes(normalized)){
        return "da";
    }

    if(normalized.includes("no") || normalized.includes("nor") || normalized.includes("norsk")){
        return "no";
    }

    if(normalized.includes("da") || normalized.includes("dk") || normalized.includes("dan")){
        return "da";
    }

    return "da";

}

export function resolveJobcardContext(congregation){

    const name = String(
        congregation?.name ||
        congregation?.title ||
        congregation?.slug ||
        congregation?.id || ""
    ).trim();

    const reference = String(
        congregation?.id ||
        congregation?.slug ||
        congregation?.congregation_slug ||
        name || ""
    ).trim();

    const slug = reference
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const language = normalizeJobcardLanguage(
        congregation?.language ||
        congregation?.lang ||
        name ||
        reference
    );

    const isTestCongregation = /(^|-)test(-|$)/.test(slug) || /test\s*dk/i.test(name);

    return {
        language,
        allowedIds: isTestCongregation ? ["1"] : null,
        congregationName: name,
        congregationSlug: slug || "menighed"
    };

}

export function buildJobcardMenuUrl(jobcard, congregation){

    const context = resolveJobcardContext(congregation);
    const jobcardId = String(
        jobcard?.jobcard_number ??
        jobcard?.number ??
        jobcard?.id ??
        jobcard?.nummer ??
        jobcard?.raw?.nummer ??
        jobcard?.raw?.number ??
        1
    );

    return `https://vedlikeholdsystem.no/jobbkort-menu?id=${encodeURIComponent(jobcardId)}&congregation=${encodeURIComponent(context.congregationSlug)}`;

}

export async function getJobcards(
    congregation
){

    const context = resolveJobcardContext(congregation);
    const language = context.language;

    const response =
        await fetch(
            `https://vedlikeholdsystem.no/jobdata/${language}/index.json`
        );

    if(!response.ok){

        return {
            success:false,
            error:"Kunne ikke hente jobkort"
        };

    }

    const data = await response.json();

    let jobcards = Array.isArray(data)
        ? data.map(jobcard => ({
            id: jobcard.nummer,
            title: jobcard.titel || jobcard.nummer,
            description: jobcard.undertittel || "",
            jobcard_number: jobcard.nummer,
            interval: jobcard.frekvens || "",
            next_execution: "",
            visible: true,
            raw: jobcard
        }))
        : [];

    if(context.allowedIds){

        jobcards = jobcards.filter(jobcard => allowedIds.includes(String(jobcard.id)));

    }

    return {
        success:true,
        jobcards
    };

}

export async function createTask(
    task
){

    return await request(

        "/task",

        {

            method:"POST",

            body:JSON.stringify(
                task
            )

        }

    );

}

export async function getPublicTask(
    linkCode
){

    return await request(

        "/o/" +

        encodeURIComponent(
            linkCode
        )

    );

}

export async function completePublicTask(
    data
){

    return await request(

        "/o/complete",

        {

            method:"POST",

            body:JSON.stringify(
                data
            )

        }

    );

}
