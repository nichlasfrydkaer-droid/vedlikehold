import { getMe } from "../js/api.js";

import { state } from "../js/state.js";

import {
    loadCongregation
}
from "../js/session.js";

import {
    loadTranslations
}
from "../js/i18n.js";

export async function loadDashboard(){

    const me =
        await getMe();

    if(!me.success){

        localStorage.removeItem(
            "dashboard_token"
        );

        localStorage.removeItem(
            "dashboard_congregation"
        );

        location.href =
            "/dashboard/login.html";

        return null;

    }

    state.user =
        me.user;

    state.congregations =
        me.congregations;

    if(
        me.congregations.length &&
        !state.congregation
    ){

        state.congregation =
            me.congregations[0];

    }

    loadCongregation();

    await loadTranslations(

        state.congregation?.language ??

        "no"

    );

    return me;

}
