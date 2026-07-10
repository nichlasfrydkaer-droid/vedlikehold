export const state = {

    token:
        sessionStorage.getItem(
            "dashboard_token"
        ),

    user:null,

    congregation:null,

    congregations:[],

    language:"no",

    sessionStartedAt:null

};
