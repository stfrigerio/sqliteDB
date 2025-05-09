import { pluginState } from "src/pluginState";
import { getPeriodId } from "./datePeriodUtils";
import { parseDateISO, getISOWeekNumber } from "./dateUtils";

//? Helper function to replace all date/period placeholders
export const replacePlaceholders = (source: string): string => {
    let processedSource = source;
    const selectedDateStr = pluginState.selectedDate;
    const selectedPeriod = pluginState.currentPeriod; // The *type* ('day', 'week'...)
    const startDate = pluginState.periodStartDate;     // 'YYYY-MM-DD'
    const endDate = pluginState.periodEndDate;       // 'YYYY-MM-DD'

    //^ Calculate the specific Period ID String ('YYYY-Www', 'YYYY-MM', etc.)
    const periodId = getPeriodId(selectedDateStr, selectedPeriod);

    const selectedDateObj = parseDateISO(selectedDateStr);

    // --- Perform Replacements ---
    processedSource = processedSource.replace(/@startDate/g, startDate);
    processedSource = processedSource.replace(/@endDate/g, endDate);
    //? Replace @periodId with the calculated identifier string
    processedSource = processedSource.replace(/@periodId/g, periodId);
    //? Keep @date for the specific selected day
    processedSource = processedSource.replace(/@date/g, selectedDateStr);

    //? Replace individual components if needed
    if (selectedDateObj) {
        processedSource = processedSource.replace(/@year/g, String(selectedDateObj.getUTCFullYear()));
        processedSource = processedSource.replace(/@quarter/g, String(Math.floor(selectedDateObj.getUTCMonth() / 3) + 1));
        processedSource = processedSource.replace(/@month/g, String(selectedDateObj.getUTCMonth() + 1).padStart(2, '0'));
        // Use the week part from the period ID for consistency
        processedSource = processedSource.replace(/@week/g, periodId.startsWith(selectedDateObj.getUTCFullYear() + "-W") ? periodId.split('-')[1] : 'W' + String(getISOWeekNumber(selectedDateObj)).padStart(2,'0')); // Extracts Www
        processedSource = processedSource.replace(/@day/g, String(selectedDateObj.getUTCDate()).padStart(2, '0'));
    } else {
        // Clear date component placeholders if date is invalid
        processedSource = processedSource.replace(/@year|@quarter|@month|@week|@day/g, '');
    }

    return processedSource;
};