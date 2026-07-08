import {

    createTask,

    getTask

}
from "../js/api.js";

export async function loadTask(
    id
){

    const result =
        await getTask(id);

    if(!result.success){

        return null;

    }

    return result.task;

}

export async function saveTask(
    task
){

    return await createTask(
        task
    );

}
