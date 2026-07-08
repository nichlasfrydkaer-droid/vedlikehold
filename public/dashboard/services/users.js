import { getMe } from "../js/api.js";

export async function loadCurrentUser(){

    return await getMe();

}
