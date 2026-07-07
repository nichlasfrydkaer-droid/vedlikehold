import { state } from "./state.js";
import { dom } from "./dom.js";

export function buildReport(){

    const finishedAt =
        new Date();

    const startedAt =
        state.startTime
            ? new Date(state.startTime)
            : finishedAt;

    const durationSeconds =
        Math.floor(
            (finishedAt - startedAt) / 1000
        );

    const tasks = [];

    let taskIndex = 0;

    state.currentJob.oppgaver.forEach(item=>{

        if(
            typeof item === "object"
            && item.punkter
        ){

            item.punkter.forEach(text=>{

                const checkbox =
                    document.querySelectorAll(".task")[taskIndex];

                tasks.push({

                    text,

                    completed:
                        checkbox?.checked ?? false

                });

                taskIndex++;

            });

        }

        else if(
            typeof item === "object"
            && item.innhold
        ){

            item.innhold.forEach(del=>{

                if(del.type==="punkt"){

                    const checkbox =
                        document.querySelectorAll(".task")[taskIndex];

                    tasks.push({

                        text:
                            del.tekst,

                        completed:
                            checkbox?.checked ?? false

                    });

                    taskIndex++;

                }

            });

        }

        else if(
            typeof item === "string"
        ){

            const checkbox =
                document.querySelectorAll(".task")[taskIndex];

            tasks.push({

                text:item,

                completed:
                    checkbox?.checked ?? false

            });

            taskIndex++;

        }

    });

    return {

        congregation:
            state.currentCongregation?.id,

        jobNumber:
            state.currentJob.nummer,

        title:
            state.currentJob.titel,

        subtitle:
            state.currentJob.undertittel ?? "",

        performedBy:
            dom.nameInput.value,

        notes:
            dom.notes.value,

        startedAt:
            startedAt.toISOString(),

        finishedAt:
            finishedAt.toISOString(),

        durationSeconds,

        tasks

    };

}
