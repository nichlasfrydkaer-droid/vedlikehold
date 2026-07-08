import {
    formatDate
}
from "../js/format.js";

export function renderTaskCard(
    task
){

    return `

        <div
            class="dashboard-card task-card"
            data-id="${task.id}"
        >

            <h2>

                JOBBKORT ${task.job_number ?? "-"}

            </h2>

            <h3 class="report-title">

                ${task.title ?? ""}

            </h3>

            <p class="report-subtitle">

                ${task.subtitle ?? ""}

            </p>

            <br>

            <p>

                📅 Frist:
                ${task.deadline
                    ? formatDate(
                        task.deadline
                    )
                    : "-"}

            </p>

            <p>

                🗓 Opprettet:
                ${formatDate(
                    task.created_at
                )}

            </p>

            <p>

                ${task.status==="completed"

                    ? "🟢 Fullført"

                    : task.status==="open"

                        ? "🟠 Åpent"

                        : "⚪ Opprettet"

                }

            </p>

        </div>

    `;

}
