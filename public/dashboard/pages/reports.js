import { getReport } from "../js/api.js";

export async function initReport(){

    const id =
        new URLSearchParams(
            location.search
        ).get("id");

    const result =
        await getReport(id);

    console.log(result);

}
