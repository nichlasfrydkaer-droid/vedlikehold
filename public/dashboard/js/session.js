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

    window.location.href =
        "/dashboard/login.html";

}
