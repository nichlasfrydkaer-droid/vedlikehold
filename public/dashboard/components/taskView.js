import { page } from "../ui/page.js";
import { card } from "../ui/card.js";
import { section } from "../ui/section.js";
import { button } from "../ui/button.js";

import { t } from "../js/i18n.js";

export function renderTaskView({

    report,

    task,

    isExisting

}){

    return page(

        card(

            `

            <h2>

                ${isExisting

                    ? t("task")

                    : t("createTask")

                }

            </h2>

            <br>

            <p>

                <strong>

                    ${t("report")}:

                </strong>

                ${report.id}

            </p>

            <p>

                <strong>

                    ${t("jobcard")}:

                </strong>

                JOBBKORT ${report.job_number}

            </p>

            <hr>

            ${section(

                t("originalComment"),

                `

                <label>

                    <input

                        id="includeComment"

                        type="checkbox"

                        checked

                    >

                    ${t("includeComment")}

                </label>

                <br><br>

                <textarea

                    id="originalComment"

                    rows="5"

                    readonly

                >${report.notes ?? ""}</textarea>

                `

            )}

            <hr>

            ${section(

                t("title"),

                `

                <input

                    id="taskTitle"

                    type="text"

                    value="${task?.title ?? report.title ?? ""}"

                >

                `

            )}

            <br>

            ${section(

                t("deadline"),

                `

                <input

                    id="deadline"

                    type="date"

                    value="${task?.deadline ?? ""}"

                >

                `

            )}

            <hr>

            ${section(

                t("checklist"),

                `

                <div id="checklist"></div>

                <br>

                <button

                    id="addItem"

                >

                    + ${t("addChecklistItem")}

                </button>

                `

            )}

            <hr>

            ${section(

                t("photos"),

                `

                <div id="photos">

                    ${t("noPhotos")}

                </div>

                `

            )}

            <br>

            ${button({

                id:"saveTask",

                text:

                    isExisting

                        ? t("save")

                        : t("createTask")

            })}

            `

        )

    );

}
