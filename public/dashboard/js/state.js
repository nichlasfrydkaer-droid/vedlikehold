export const state = {

    token:
        localStorage.getItem(
            "dashboard_token"
        ),

    user:null,

    congregation:null,

    congregations:[],

    language:"no"

};
