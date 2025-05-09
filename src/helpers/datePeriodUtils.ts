import { NavigationPeriod } from "../codeblocks/dateHeader/dateNavigator.types";
import { parseDateISO, formatDateISO, getISOWeekNumber } from "./dateUtils"; 

import { formatDateForDisplay } from "./dateUtils";
export interface DateRange {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

/** Calculates the start and end date (YYYY-MM-DD) for a given period containing the reference date. */
export function calculatePeriodRange(refIsoDate: string, period: NavigationPeriod): DateRange | null {
    const refDate = parseDateISO(refIsoDate);
    if (!refDate) {
        console.error(`[DatePeriodUtils] Invalid reference date: ${refIsoDate}`);
        return null;
    }

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'day':
            startDate = new Date(refDate); // Clone
            endDate = new Date(refDate);   // Clone
            break;

        case 'week':
            startDate = new Date(refDate); // Clone
            // Find Monday (day 1, Sunday is 0 in JS Date). Adjust backward.
            const dayOfWeek = startDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days; else go back (dayOfWeek - 1) days.
            startDate.setUTCDate(startDate.getUTCDate() + diffToMonday);

            endDate = new Date(startDate); // Clone start date (Monday)
            endDate.setUTCDate(endDate.getUTCDate() + 6); // Add 6 days to get Sunday
            break;

        case 'month':
            startDate = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1));
            // End date is day 0 of the *next* month
            endDate = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 0));
            break;

        case 'quarter':
            const currentMonth = refDate.getUTCMonth(); // 0-11
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, 9
            startDate = new Date(Date.UTC(refDate.getUTCFullYear(), quarterStartMonth, 1));
            // End date is day 0 of the month *after* the quarter ends
            endDate = new Date(Date.UTC(refDate.getUTCFullYear(), quarterStartMonth + 3, 0));
            break;

        case 'year':
            startDate = new Date(Date.UTC(refDate.getUTCFullYear(), 0, 1)); // Jan 1st
            endDate = new Date(Date.UTC(refDate.getUTCFullYear(), 11, 31)); // Dec 31st
            break;

        default:
            console.error(`[DatePeriodUtils] Unsupported period type: ${period}`);
            return null;
    }

    return {
        startDate: formatDateISO(startDate),
        endDate: formatDateISO(endDate),
    };
}

/** Calculates the date representing the start of the next/previous period. */
export function calculateAdjacentPeriodDate(refIsoDate: string, period: NavigationPeriod, direction: 'next' | 'prev'): string | null {
    const refDate = parseDateISO(refIsoDate);
    if (!refDate) return null;

    const multiplier = direction === 'next' ? 1 : -1;

    switch (period) {
        case 'day':
            refDate.setUTCDate(refDate.getUTCDate() + multiplier);
            break;
        case 'week':
            refDate.setUTCDate(refDate.getUTCDate() + (7 * multiplier));
            break;
        case 'month':
            refDate.setUTCMonth(refDate.getUTCMonth() + multiplier, 1); // Set day to 1 to avoid month skipping issues
            break;
        case 'quarter':
            refDate.setUTCMonth(refDate.getUTCMonth() + (3 * multiplier), 1);
            break;
        case 'year':
            refDate.setUTCFullYear(refDate.getUTCFullYear() + multiplier, 0, 1); // Set month/day to Jan 1st
            break;
        default:
            return null;
    }

    return formatDateISO(refDate);
}

/** Generates a display string for the current period/date range. */
export function formatPeriodForDisplay(isoDate: string, period: NavigationPeriod): string {
    const dateObj = parseDateISO(isoDate);
    if (!dateObj) return "Invalid Date";

    const range = calculatePeriodRange(isoDate, period);
    if (!range) return formatDateForDisplay(dateObj); // Fallback

    const startObj = parseDateISO(range.startDate);
    const endObj = parseDateISO(range.endDate);
    if (!startObj || !endObj) return formatDateForDisplay(dateObj); // Fallback

    const year = startObj.getUTCFullYear(); // Assume range is within same year mostly
    const optionsMonthDay: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };

    switch (period) {
        case 'day':
            return formatDateForDisplay(dateObj); // Just show the single day
        case 'week': {
            const weekNum = getISOWeekNumber(dateObj);
            const startStr = startObj.toLocaleDateString(undefined, optionsMonthDay);
            const endStr = endObj.toLocaleDateString(undefined, optionsMonthDay);
            return `Week ${weekNum}: ${startStr} - ${endStr}, ${year}`;
        } 
        case 'month':
            return dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
        case 'quarter': { 
            const quarter = Math.floor(dateObj.getUTCMonth() / 3) + 1;
            const startStr = startObj.toLocaleDateString(undefined, optionsMonthDay);
            const endStr = endObj.toLocaleDateString(undefined, optionsMonthDay);
            // Optionally format quarter nicely: return `Q${quarter} ${year}: ${startStr} - ${endStr}`;
            return `Q${quarter} ${year}`; // Simpler Q display
        }
        case 'year':
            return String(year);
        default:
            return formatDateForDisplay(dateObj);
    }
}

/** Calculates the ISO Week string (YYYY-Www). */
export function getIsoWeekId(date: Date): string {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const weekNum = getISOWeekNumber(date);

    if (weekNum === 1 && month === 11) return `${year + 1}-W01`;
    if (weekNum >= 52 && month === 0) return `${year - 1}-W${String(weekNum).padStart(2, '0')}`;
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/** Calculates the Quarter string (YYYY-Qq). */
export function getQuarterId(date: Date): string {
    const year = date.getUTCFullYear();
    const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
}

/** Calculates the Month string (YYYY-MM). */
export function getMonthId(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Calculates the specific period identifier string based on the date and period type.
 * e.g., '2024-W15', '2024-04', '2024-Q2', '2024', '2024-04-15'
*/
export function getPeriodId(isoDate: string, period: NavigationPeriod): string {
    const dateObj = parseDateISO(isoDate);
    if (!dateObj) {
        console.warn(`[getPeriodId] Invalid date: ${isoDate}, returning date string.`);
        return isoDate; // Fallback
    }

    switch (period) {
        case 'day': return isoDate; // Returns 'YYYY-MM-DD'
        case 'week': return getIsoWeekId(dateObj); // Returns 'YYYY-Www'
        case 'month': return getMonthId(dateObj); // Returns 'YYYY-MM'
        case 'quarter': return getQuarterId(dateObj); // Returns 'YYYY-Qq'
        case 'year': return String(dateObj.getUTCFullYear()); // Returns 'YYYY'
        default:
            console.warn(`[getPeriodId] Unknown period type: ${period}, returning ISO date.`);
            return isoDate; // Fallback
    }
}