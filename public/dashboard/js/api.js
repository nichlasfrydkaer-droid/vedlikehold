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

export async function getJobcards(
    congregationId
){

    const congregationName =
        String(congregationId || "").trim();

    const language =
        congregationName === "Elverum"
            ? "no"
            : "da";

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

    const allowedIds =
        congregationName === "Test DK"
            ? ["1"]
            : (congregationName === "Elverum"
                ? null
                : null);

    if(allowedIds){

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
