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

    try{

        const me =
            await getMe();

        if(me?.success){

            state.user =
                me.user;

            state.congregations =
                me.congregations || [];

            state.sessionStartedAt = me.sessionStartedAt || null;

            state.csrfToken = me.csrfToken || null;

            if(
                state.congregations.length &&
                !state.congregation
            ){

                state.congregation =
                    state.congregations[0];

            }

            loadCongregation();

            await loadTranslations(

                state.congregation?.language ??

                "no"

            );

            return me;

        }

    }catch(error){

        console.error("Dashboard load failed", error);

    }

    if(
        state.user ||
        state.congregations.length ||
        state.congregation
    ){

        loadCongregation();

        await loadTranslations(

            state.congregation?.language ??

            "no"

        );

        return {
            success:false,
            fallback:true,
            user: state.user,
            congregations: state.congregations
        };

    }

    loadCongregation();

    await loadTranslations(

        state.congregation?.language ??

        "no"

    );

    return {
        success:false,
        fallback:true
    };

}
