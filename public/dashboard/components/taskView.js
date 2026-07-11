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

    const checklist =

        task?.checklist ??

        [

            {

                text:""

            }

        ];

    return page(

        card(

            `

            <div data-unsaved-changes>

            <h2>

                ${

                    isExisting

                        ? t("task")

                        : t("createTask")

                }

            </h2>

            <br>

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

                <div
                    class="task-original-comment"
                >

                    ${

                        report.notes ??

                        "<em>Ingen kommentar.</em>"

                    }

                </div>

                <br>

                <label>

                    <input

                        id="includeComment"

                        type="checkbox"

                        checked

                    >

                    ${t("includeComment")}

                </label>

                `

            )}

            <hr>

            ${section(

                t("title"),

                `

                <input

                    id="taskTitle"

                    type="text"

                    value="${

                        task?.title ??

                        report.title ??

                        ""

                    }"

                >

                `

            )}

            <hr>

            ${section(

                t("comment"),

                `

                <textarea

                    id="taskComment"

                    rows="5"

                    placeholder="${t("comment")}"

                >${

                    task?.description ??

                    ""

                }</textarea>

                `

            )}

            <hr>

            ${section(

                t("deadline"),

                `

                <input

                    id="deadline"

                    type="date"

                    value="${

                        task?.deadline ??

                        ""

                    }"

                >

                `

            )}

            <hr>

            ${section(

                t("checklist"),

                `

                <div id="checklist">

                    ${

                        checklist.map(

                            item=>`

                                <div class="checklist-row">

                                    <input

                                        class="checkItem"

                                        type="text"

                                        value="${

                                            item.text ??

                                            ""

                                        }"

                                    >

                                </div>

                            `

                        ).join("")

                    }

                </div>

                <br>

                <button

                    id="addItem"

                    type="button"

                >

                    +

                    ${

                        t("addChecklistItem")

                    }

                </button>

                `

            )}

            <hr>

            ${section(

                t("photos"),

                `

                <div id="photos">

                    ${

                        t("noPhotos")

                    }

                </div>

                `

            )}

            <br>

            ${button({

                id:

                    "saveTask",

                text:

                    isExisting

                        ? t("save")

                        : t("createTask")

            })}

            ${isExisting ? `

            <p class="task-report-id">

                ${t("reportId")}: ${report.id}

            </p>

            ` : ""}

            </div>

            `

        )

    );

}
