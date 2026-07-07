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

    return await response.json();

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

        "/report?id=" + id

    );

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

        "/o/" + linkCode

    );

}
