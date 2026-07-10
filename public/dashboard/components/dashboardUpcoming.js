import { createCard } from "./card.js";
import { addDashboardWidget } from "./dashboardWidget.js";
import { getCongregation } from "../js/session.js";
import { getJobcards, getJobcardSettings } from "../js/api.js";
import { isUpcoming, mergeJobcardSchedules } from "../js/jobcardSchedule.js";
import { t } from "../js/i18n.js";

export async function renderDashboardUpcoming(){

    const congregation = getCongregation();
    let jobcards = [];

    if(congregation){
        const [cardsResult, settingsResult] = await Promise.all([
            getJobcards(congregation),
            getJobcardSettings(congregation.id)
        ]);

        if(cardsResult?.success && settingsResult?.success){
            jobcards = mergeJobcardSchedules(cardsResult.jobcards, settingsResult)
                .filter(isUpcoming)
                .sort((left, right) => String(left.nextExecution).localeCompare(String(right.nextExecution)));
        }
    }

    const content = jobcards.length ? `

        <div class="dashboard-upcoming-list">
            ${jobcards.map(jobcard => `
                <div class="dashboard-upcoming-item">
                    <div class="dashboard-upcoming-title">${jobcard.title}</div>
                    <div class="dashboard-upcoming-subtitle">
                        ${jobcard.autoInterval
                            ? `${t("jobcard", "Jobbkort")} ${jobcard.jobcard_number} · ${jobcard.interval}`
                            : `${t("jobcardNextExecution", "Neste utførelse")}: ${jobcard.nextExecution}`}
                    </div>
                </div>
            `).join("")}
        </div>

    ` : `

        <div class="dashboard-upcoming-list">

            <div class="dashboard-upcoming-item">

                <div class="dashboard-upcoming-title">

                    ${t("noUpcomingJobcards", "Ingen kommende jobbkort.")}

                </div>

                <div class="dashboard-upcoming-subtitle">

                    ${t("allUpdated", "Alt er oppdatert.")}

                </div>

            </div>

        </div>

    `;

    addDashboardWidget(

        createCard(

            `📅 ${t("upcomingJobcards", "Kommende Jobbkort")}`,

            content

        )

    );

}
