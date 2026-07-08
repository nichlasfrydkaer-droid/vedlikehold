import { createTask } from "../js/api.js";

export async function saveTask(task){

    return await createTask(task);

}
