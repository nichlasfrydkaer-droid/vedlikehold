import {
    loadDashboard
}
from "../services/dashboard.js";

import {
    getTasks
}
from "../js/api.js";

import {
    getCongregation
}
from "../js/session.js";

import {
    renderTaskCard
}
from "../components/taskCard.js";

export async function initTasks(){

    const me =
        await loadDashboard();

    if(!me){

        return;

    }

    const container =
        document.getElementById(
            "tasks"
        );

    const congregation =
        getCongregation();

    if(!congregation){

        container.innerHTML = `

            <div class="dashboard-card">

                Ingen menighet valgt.

            </div>

        `;

        return;

    }

console.log(
    "Congregation:",
    congregation
);

console.log(
    "Congregation ID:",
    congregation.id
);
    
    const result =
        await getTasks(

            congregation.id

        );

    const result =
    await getTasks(

        congregation.id

    );

    if(!result.success){

        container.innerHTML = `

            <div class="dashboard-card">

                Kunne ikke hente oppdrag.

            </div>

        `;

        return;

    }

    if(result.tasks.length===0){

        container.innerHTML = `

            <div class="dashboard-card">

                <h2>

                    Ingen oppdrag

                </h2>

            </div>

        `;

        return;

    }

    container.innerHTML =

        result.tasks

            .map(

                renderTaskCard

            )

            .join("");

    container

        .querySelectorAll(

            ".task-card"

        )

        .forEach(card=>{

            card.onclick = ()=>{

                location.href =

                    "/dashboard/task.html?id=" +

                    card.dataset.id;

            };

        });

}
