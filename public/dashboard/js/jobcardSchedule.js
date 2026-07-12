function toDateOnly(value){
    if(!value){
        return null;
    }

    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return null;
    }

    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));
}

function formatDateInput(date){
    return date ? date.toISOString().slice(0, 10) : "";
}

function addMonths(date, months){
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + months);
    return result;
}

export function mergeJobcardSchedules(jobcards, response){
    const settings = new Map(
        (response?.settings || []).map(setting => [String(setting.jobcard_id), setting])
    );
    const completed = new Map(
        (response?.completed || []).map(item => [String(item.jobcard_id), item.last_performed_at])
    );
    const intervals = new Map(
        (response?.intervals || []).map(interval => [String(interval.jobcard_id), interval])
    );

    return jobcards.map(jobcard => {
        const setting = settings.get(String(jobcard.id)) || {};
        const definition = intervals.get(String(jobcard.id)) || {};
        const autoInterval = setting.auto_interval !== 0;
        const lastPerformedAt = completed.get(String(jobcard.id)) || null;
        const intervalMonths = Number(definition.interval_months) || null;
        const manualIntervalMonths = Number(setting.manual_interval_months) || null;
        const effectiveIntervalMonths = autoInterval
            ? intervalMonths
            : manualIntervalMonths;
        const nextExecution = effectiveIntervalMonths
            ? formatDateInput(addMonths(toDateOnly(lastPerformedAt) || new Date(), effectiveIntervalMonths))
            : "";

        return {
            ...jobcard,
            interval: definition.display_label || jobcard.interval || "",
            intervalMonths,
            visible: setting.visible !== 0,
            autoInterval,
            lastPerformedAt,
            manualIntervalMonths,
            nextExecution
        };
    });
}

export function isUpcoming(jobcard, today = new Date()){
    if(!jobcard.visible){
        return false;
    }

    const next = toDateOnly(jobcard.nextExecution);

    if(!next){
        return false;
    }

    const limit = toDateOnly(today);
    limit.setUTCDate(limit.getUTCDate() + 30);
    return next <= limit;
}
