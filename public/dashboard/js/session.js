import { state } from "./state.js";

export function getUser(){

    return state.user;

}

export function getCongregation(){

    return state.congregation;

}

export function getCongregations(){

    return state.congregations;

}

export function setCongregation(id){

    const congregation =
        state.congregations.find(

            c => c.id === id

        );

    if(!congregation){

        return;

    }

    state.congregation =
        congregation;

    localStorage.setItem(

        "dashboard_congregation",

        congregation.id

    );

}

export function loadCongregation(){

    const id =
        localStorage.getItem(
            "dashboard_congregation"
        );

    if(!id){

        return;

    }

    const congregation =
        state.congregations.find(

            c => c.id === id

        );

    if(congregation){

        state.congregation =
            congregation;

    }

}

export function isLoggedIn(){

    return !!state.token;

}

export function logout(){

    localStorage.removeItem(
        "dashboard_token"
    );

    localStorage.removeItem(
        "dashboard_congregation"
    );

    window.location.href =
        "/dashboard/login.html";

}
