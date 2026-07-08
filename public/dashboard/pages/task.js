import { authenticate } from "../services/auth.js";

import {
    generateTaskId,
    generateLinkCode
}
from "../services/id.js";

import {
    createTask,
    getTaskById
}
from "../repositories/tasks.js";

import {
    getUserCongregations
}
from "../repositories/congregations.js";

export async function handleTask(
    request,
    env,
    corsHeaders
){

    const session =
        await authenticate(
            request,
            env.DB
        );

    if(!session){

        return new Response(

            JSON.stringify({

                success:false,

                message:"Unauthorized"

            }),

            {

                status:401,

                headers:{
                    ...corsHeaders,
                    "Content-Type":"application/json"
                }

            }

        );

    }

    //
    // Hent eksisterende oppdrag
    //

    if(request.method==="GET"){

        const id =
            new URL(request.url)
                .searchParams
                .get("id");

        if(!id){

            return new Response(

                JSON.stringify({

                    success:false,

                    message:"Missing id"

                }),

                {

                    status:400,

                    headers:{
                        ...corsHeaders,
                        "Content-Type":"application/json"
                    }

                }

            );

        }

        const task =
            await getTaskById(

                env.DB,

                id

            );

        if(!task){

            return new Response(

                JSON.stringify({

                    success:false,

                    message:"Task not found"

                }),

                {

                    status:404,

                    headers:{
                        ...corsHeaders,
                        "Content-Type":"application/json"
                    }

                }

            );

        }

        return new Response(

            JSON.stringify({

                success:true,

                task

            }),

            {

                headers:{
                    ...corsHeaders,
                    "Content-Type":"application/json"
                }

            }

        );

    }

    //
    // Opprett nytt oppdrag
    //

    if(request.method!=="POST"){

        return new Response(

            "Method Not Allowed",

            {

                status:405,

                headers:corsHeaders

            }

        );

    }

    const body =
        await request.json();

    const congregationResult =
        await getUserCongregations(

            env.DB,

            session.user_id

        );

    const allowed =
        congregationResult.results.find(

            c =>

                c.id ===

                body.congregation_id

        );

    if(!allowed){

        return new Response(

            JSON.stringify({

                success:false,

                message:"Invalid congregation"

            }),

            {

                status:403,

                headers:{
                    ...corsHeaders,
                    "Content-Type":"application/json"
                }

            }

        );

    }

    const task = {

        id:
            generateTaskId(),

        link_code:
            generateLinkCode(),

        report_id:
            body.report_id,

        congregation_id:
            body.congregation_id,

        title:
            body.title,

        description:
            body.description ?? "",

        checklist:
            body.checklist ?? [],

        photos:
            body.photos ?? [],

        deadline:
            body.deadline,

        created_at:
            new Date().toISOString(),

        created_by:
            session.user_id,

        status:
            "open"

    };

    await createTask(

        env.DB,

        task

    );

    return new Response(

        JSON.stringify({

            success:true,

            task

        }),

        {

            headers:{
                ...corsHeaders,
                "Content-Type":"application/json"
            }

        }

    );

}
