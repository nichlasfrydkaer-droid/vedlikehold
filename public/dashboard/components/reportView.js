import { page } from "../ui/page.js";
import { card } from "../ui/card.js";
import { section } from "../ui/section.js";
import { button } from "../ui/button.js";
import { status } from "../ui/status.js";
import { infoRow } from "../ui/infoRow.js";

import { t } from "../js/i18n.js";
import {
    formatDate,
    formatMinutes
}
from "../js/format.js";

export function renderReportView(
    report,
    task,
    checklist
){

    return page(

        card(

            `

            <h2>

                JOBBKORT ${report.job_number}

            </h2>

            <h1 class="report-title">

                ${report.title ?? ""}

            </h1>

            <p class="report-subtitle">

                ${report.subtitle ?? ""}

            </p>

            ${status(

                task

                    ? task.status

                    : "created"

            )}

            <br>

            <div class="report-info">

                ${infoRow(

                    "👤",

                    report.performed_by || "-"

                )}

                ${infoRow(

                    "📅",

                    formatDate(
                        report.finished_at
                    )

                )}

                ${infoRow(

                    "⏱",

                    formatMinutes(
                        report.duration_seconds
                    )

                )}

                ${infoRow(

                    "📷",

                    report.photo_count + " bilder"

                )}

            </div>

            <hr>

            ${section(

                t("comment"),

                `

                <div class="report-comment">

                    ${report.notes || "-"}

                </div>

                `

            )}

            <hr>

            ${section(

                t("checklist"),

                checklist.length

                    ?

                    checklist.map(task=>`

                        <p>

                            ${task.completed ? "✅" : "❌"}

                            ${task.text}

                        </p>

                    `).join("")

                    :

                    "<p>-</p>"

            )}

            <hr>

            ${report.pdf_url

                ?

                `

                <a

                    href="${report.pdf_url}"

                    target="_blank"

                    class="button-primary report-button"

                >

                    📄 ${t("downloadPdf")}

                </a>

                `

                :

                ""

            }

            <br><br>

            ${button({

                id:"taskButton",

                text:

                    task

                        ?

                        t("openTask")

                        :

                        t("createTask")

            })}

            <hr>

            <p
                style="font-size:12px;color:#999;"
            >

                ${t("reportId")}

            </p>

            <p
                style="font-size:11px;color:#bbb;word-break:break-all;"
            >

                ${report.id}

            </p>

            `

        )

    );

}
