export function renderReportCard(report){

    return `

        <div
            class="dashboard-card report-card"
            data-id="${report.id}"
        >

<h2>

    JOBBKORT ${report.job_number}

</h2>

<h3 class="report-title">

    ${report.title ?? ""}

</h3>

<p class="report-subtitle">

    ${report.subtitle ?? ""}

</p>

            <br>

            <p>

                👤 ${report.performed_by || "-"}

            </p>

            <p>

                📅 ${new Date(
                    report.finished_at
                ).toLocaleString("no-NO")}

            </p>

            <p>

                📷 ${report.photo_count}

            </p>

        </div>

    `;

}
