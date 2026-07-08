import {
    createTask,
    getTask
}
from "../js/api.js";

import {
    getCongregation
}
from "../js/session.js";

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

    const congregation =
        getCongregation();

    return await createTask({

        ...task,

        congregation_id:
            congregation.id

    });

}
