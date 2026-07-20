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

function monthStart(date){
    if(!date){ return null; }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthStartFromValue(value){
    if(!/^\d{4}-\d{2}$/.test(String(value || ""))){ return null; }
    return new Date(`${value}-01T00:00:00.000Z`);
}

function scheduledMonth(firstExecutionMonth, lastPerformedAt, intervalMonths){
    const first = monthStartFromValue(firstExecutionMonth);
    if(!first || !intervalMonths){ return null; }
    const completed = monthStart(toDateOnly(lastPerformedAt));
    if(!completed || completed < first){ return first; }
    const elapsedMonths = (completed.getUTCFullYear() - first.getUTCFullYear()) * 12
        + completed.getUTCMonth() - first.getUTCMonth();
    return addMonths(first, (Math.floor(elapsedMonths / intervalMonths) + 1) * intervalMonths);
}

function jobcardKeys(value){
    const key = String(value ?? "").trim();
    const numericKey = key.match(/^0*(\d+)([A-Za-z]?)$/);
    const normalized = numericKey
        ? `${Number(numericKey[1])}${numericKey[2].toUpperCase()}`
        : key.toUpperCase();

    return [...new Set([key, normalized])].filter(Boolean);
}

export function mergeJobcardSchedules(jobcards, response){
    const settings = new Map(
        (response?.settings || []).map(setting => [String(setting.jobcard_id), setting])
    );
    const completed = new Map();
    (response?.completed || []).forEach(item => {
        jobcardKeys(item.jobcard_id).forEach(key => completed.set(key, item.last_performed_at));
    });
    const intervals = new Map(
        (response?.intervals || []).map(interval => [String(interval.jobcard_id), interval])
    );
    const assignments = new Map();
    (response?.assignments || []).forEach(assignment => {
        jobcardKeys(assignment.jobcard_id).forEach(key => assignments.set(key, assignment));
    });

    return jobcards.map(jobcard => {
        const setting = settings.get(String(jobcard.id)) || {};
        const definition = intervals.get(String(jobcard.id)) || {};
        const autoInterval = setting.auto_interval !== 0;
        const lastPerformedAt = jobcardKeys(jobcard.id)
            .map(key => completed.get(key))
            .find(Boolean) || null;
        const intervalMonths = Number(definition.interval_months) || null;
        const manualIntervalMonths = Number(setting.manual_interval_months) || null;
        const fixedAssignment = jobcardKeys(jobcard.id)
            .map(key => assignments.get(key))
            .find(Boolean) || null;
        const assignmentAutoInterval = fixedAssignment ? Number(fixedAssignment.auto_interval) !== 0 : autoInterval;
        const effectiveIntervalMonths = assignmentAutoInterval
            ? intervalMonths
            : (fixedAssignment ? Number(fixedAssignment.manual_interval_months) || null : manualIntervalMonths);
        const scheduled = fixedAssignment
            ? scheduledMonth(fixedAssignment.first_execution_month, lastPerformedAt, effectiveIntervalMonths)
            : effectiveIntervalMonths
                ? monthStart(addMonths(monthStart(toDateOnly(lastPerformedAt) || new Date()), effectiveIntervalMonths))
                : null;
        const nextExecution = scheduled
            ? formatDateInput(scheduled)
            : "";

        return {
            ...jobcard,
            interval: definition.display_label || jobcard.interval || "",
            intervalMonths,
            visible: setting.visible !== 0,
            autoInterval:assignmentAutoInterval,
            lastPerformedAt,
            manualIntervalMonths:fixedAssignment ? Number(fixedAssignment.manual_interval_months) || null : manualIntervalMonths,
            requireSja: setting.require_sja === 1,
            fixedAssignment: fixedAssignment ? {
                responsibleName:fixedAssignment.responsible_name,
                helperName:fixedAssignment.helper_name,
                firstExecutionMonth:fixedAssignment.first_execution_month,
                reminderEnabled:fixedAssignment.reminder_enabled === 1
            } : null,
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

export function isOverdue(jobcard, today = new Date()){
    if(!jobcard.visible){
        return false;
    }

    const next = toDateOnly(jobcard.nextExecution);

    if(!next){
        return false;
    }

    const currentMonth = toDateOnly(today);
    currentMonth.setUTCDate(1);
    return next < currentMonth;
}
