import { config } from "./config.js";
import { state } from "./state.js";

async function request(
    endpoint,
    options = {}
){

    const headers = {

        "Content-Type":"application/json",

        ...(options.headers || {})

    };

    const csrf = state.csrfToken;

    if(csrf && ["POST","PUT","PATCH","DELETE"].includes(String(options.method || "GET").toUpperCase())){
        headers["X-CSRF-Token"] = decodeURIComponent(csrf);
    }

    const response =
        await fetch(

            config.api + endpoint,

            {

                ...options,

                headers,

                credentials:"include"

            }

        );

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    let data = {};

    try{

        if(
            contentType.includes(
                "application/json"
            )
        ){

            data = await response.json();

        }else{

            const text =
                await response.text();

            if(text){

                try{

                    data = JSON.parse(text);

                }catch(error){

                    data = {
                        success:false,
                        error:text
                    };

                }

            }

        }

    }catch(error){

        return {
            success:false,
            status:response.status,
            statusText:response.statusText,
            error:error.message
        };

    }

    if(!response.ok){

        return {
            success:false,
            status:response.status,
            statusText:response.statusText,
            ...(typeof data === "object" && data && !Array.isArray(data) ? data : {}),
            error:data?.error || "Request failed"
        };

    }

    return data;

}

const pause = milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds));

async function getWithRetry(endpoint){
    let result;

    for(let attempt=0;attempt<2;attempt+=1){
        try{
            result = await request(endpoint);
        }catch(error){
            result = {success:false,error:error?.message || "Network request failed"};
        }

        if(result?.success || attempt === 1 || [400,401,403,404].includes(result?.status)){
            return result;
        }

        await pause(300);
    }

    return result;
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

export async function logoutRequest(){ return await request("/logout", {method:"POST"}); }
export async function rotateSession(){ const result=await request("/session/rotate", {method:"POST"}); if(result?.csrfToken) state.csrfToken=result.csrfToken; return result; }

export async function getMembers(congregationId){ return request("/members?congregation=" + encodeURIComponent(congregationId)); }
export async function inviteMember(congregationId, member){ return request("/members?congregation=" + encodeURIComponent(congregationId), {method:"POST",body:JSON.stringify(member)}); }
export async function updateMember(congregationId, member){ return request("/members?congregation=" + encodeURIComponent(congregationId), {method:"PUT",body:JSON.stringify(member)}); }
export async function updateMemberReportRecipient(congregationId, userId, receivesReports){ return updateMember(congregationId, {action:"report_recipient",user_id:userId,receives_reports:receivesReports}); }
export async function removeMember(congregationId, userId){ return request("/members?congregation=" + encodeURIComponent(congregationId), {method:"DELETE",body:JSON.stringify({user_id:userId})}); }
export async function getCongregationManagement(){ return request("/congregations"); }
export async function createCongregation(data){ return request("/congregations",{method:"POST",body:JSON.stringify(data)}); }
export async function updateCongregation(data){ return request("/congregations",{method:"PUT",body:JSON.stringify(data)}); }
export async function account(action,data){ return request("/account?action="+encodeURIComponent(action),{method:"POST",body:JSON.stringify(data)}); }

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

export async function getActivity(congregationId){return await request("/activity?congregation="+encodeURIComponent(congregationId));}
export async function markActivitySeen(congregationId){return await request("/activity?congregation="+encodeURIComponent(congregationId),{method:"PUT"});}

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

    return await getWithRetry(

        "/report?id=" +

        encodeURIComponent(
            id
        )

    );

}

export async function createTaskFromReport(data){ return await request("/task/from-report",{method:"POST",body:JSON.stringify(data)}); }
export async function uploadTaskPhotos(files){
    const form=new FormData();[...files].forEach(file=>form.append("photos",file));
    const csrf=state.csrfToken;const response=await fetch(config.api+"/task-photos",{method:"POST",credentials:"include",headers:csrf?{"X-CSRF-Token":csrf}:{},body:form});
    return response.json();
}

export async function getTasks(
    congregationId
){

    return await request(

        "/tasks?congregation=" +

        encodeURIComponent(
            congregationId
        )

    );

}

export async function getTaskReport(id){
    return await request("/task-report?id=" + encodeURIComponent(id));
}

export async function getJobcardSettings(congregationId){

    return await request(
        "/jobcard-settings?congregation=" + encodeURIComponent(congregationId)
    );

}

export async function saveJobcardSettings(settings){

    return await request(
        "/jobcard-settings",
        {
            method:"PUT",
            body:JSON.stringify(settings)
        }
    );

}

export async function getJobcardDocuments(congregationId){
    return request("/jobcard-documents?congregation=" + encodeURIComponent(congregationId));
}

export async function uploadJobcardDocument({ congregationId, label, appliesToAll, jobcardIds, file, presetKey = null }){
    const form = new FormData();
    form.append("label", label);
    form.append("applies_to_all", String(appliesToAll));
    form.append("jobcard_ids", JSON.stringify(jobcardIds || []));
    if(presetKey) form.append("preset_key", presetKey);
    form.append("file", file);
    const headers = {};
    if(state.csrfToken) headers["X-CSRF-Token"] = decodeURIComponent(state.csrfToken);
    const response = await fetch(config.api + "/jobcard-documents?congregation=" + encodeURIComponent(congregationId), {
        method:"POST", credentials:"include", headers, body:form
    });
    try { return await response.json(); } catch { return { success:false, status:response.status }; }
}

export async function updateJobcardDocument({ congregationId, id, label, appliesToAll, jobcardIds, file }){
    const form = new FormData();
    form.append("id", id);
    form.append("label", label);
    form.append("applies_to_all", String(appliesToAll));
    form.append("jobcard_ids", JSON.stringify(jobcardIds || []));
    if(file) form.append("file", file);
    const headers = {};
    if(state.csrfToken) headers["X-CSRF-Token"] = decodeURIComponent(state.csrfToken);
    const response = await fetch(config.api + "/jobcard-documents?congregation=" + encodeURIComponent(congregationId), {
        method:"PUT", credentials:"include", headers, body:form
    });
    try { return await response.json(); } catch { return { success:false, status:response.status }; }
}

export async function deleteJobcardDocument(congregationId, id){
    return request("/jobcard-documents?congregation=" + encodeURIComponent(congregationId), {
        method:"DELETE", body:JSON.stringify({ id })
    });
}

export async function getTask(
    id
){

    return await request(

        "/task?id=" +

        encodeURIComponent(
            id
        )

    );

}

export async function updateTask(data){
    return await request("/task",{method:"PUT",body:JSON.stringify(data)});
}

export async function reopenTask(taskId, deadline){
    return await request("/task/reopen", {method:"POST",body:JSON.stringify({task_id:taskId,deadline})});
}

function normalizeJobcardLanguage(value = ""){

    const normalized = String(value || "").trim().toLowerCase();

    if(!normalized){
        return null;
    }

    if(["no", "nb", "nn", "norsk", "norwegian"].includes(normalized)){
        return "no";
    }

    if(["da", "dk", "danish", "dansk"].includes(normalized)){
        return "da";
    }

    return null;

}

export function resolveJobcardContext(congregation){

    const name = String(
        congregation?.name ||
        congregation?.title ||
        congregation?.slug ||
        congregation?.id || ""
    ).trim();

    const reference = String(
        congregation?.id ||
        congregation?.slug ||
        congregation?.congregation_slug ||
        name || ""
    ).trim();

    const slug = reference
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // The API owns this value.  A congregation name is not a reliable source
    // for language and must not decide which jobcards a congregation sees.
    const language = normalizeJobcardLanguage(
        congregation?.language || congregation?.lang
    );

    return {
        language,
        congregationName: name,
        congregationSlug: slug || "menighed"
    };

}

export function buildJobcardMenuUrl(jobcard, congregation){

    const context = resolveJobcardContext(congregation);
    const jobcardId = String(
        jobcard?.jobcard_number ??
        jobcard?.number ??
        jobcard?.id ??
        jobcard?.nummer ??
        jobcard?.raw?.nummer ??
        jobcard?.raw?.number ??
        1
    );

    return `https://vedlikeholdsystem.no/jobbkort-menu?id=${encodeURIComponent(jobcardId)}&language=${encodeURIComponent(context.language || "no")}&congregation=${encodeURIComponent(context.congregationSlug)}&congregationId=${encodeURIComponent(congregation?.id || "")}`;

}

export async function getJobcards(
    congregation
){

    const context = resolveJobcardContext(congregation);
    const language = context.language;

    if(!language){

        return {
            success:false,
            error:"Menigheden mangler et gyldigt sprog."
        };

    }

    const response =
        await fetch(
            `https://vedlikeholdsystem.no/jobdata/${language}/index.json`
        );

    if(!response.ok){

        return {
            success:false,
            error:"Kunne ikke hente jobkort"
        };

    }

    const data = await response.json();

    let jobcards = Array.isArray(data)
        ? data.map(jobcard => ({
            id: jobcard.nummer,
            title: jobcard.titel || jobcard.nummer,
            description: jobcard.undertittel || "",
            jobcard_number: jobcard.nummer,
            interval: jobcard.frekvens || "",
            intervalMonths: Number.isInteger(jobcard.intervalMonths)
                ? jobcard.intervalMonths
                : null,
            visible: true,
            raw: jobcard
        }))
        : [];

    return {
        success:true,
        jobcards
    };

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

        "/o/" +

        encodeURIComponent(
            linkCode
        )

    );

}

export async function completePublicTask(
    data
){

    return await request(

        "/o/complete",

        {

            method:"POST",

            body:JSON.stringify(
                data
            )

        }

    );

}

export async function startPublicTask(linkCode){

    return await request(
        "/o/start",
        {
            method:"POST",
            body:JSON.stringify({ link_code:linkCode })
        }
    );

}

export async function uploadPublicTaskPhotos(linkCode,files){const form=new FormData();form.append("link_code",linkCode);[...files].forEach(file=>form.append("photos",file));const response=await fetch(config.api+"/o/photos",{method:"POST",body:form});return response.json();}
