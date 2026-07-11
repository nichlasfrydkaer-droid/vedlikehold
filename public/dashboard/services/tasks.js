import {
    createTask,
    getTask,
    updateTask
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

    result.task.checklist = JSON.parse(result.task.checklist_json || "[]");
    result.task.photos = JSON.parse(result.task.photos_json || "[]");

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

export async function saveExistingTask(task){
    return await updateTask(task);
}
