import { getReport } from "../js/api.js";

export async function loadReport(id){

    const result =
        await getReport(id);

    if(!result.success){

        return null;

    }

    return result;

}
