/** Calculates the ISO 8601 week number for a given date. */
export function getISOWeekNumber(date: Date): number {
    const temp = new Date(date.getTime());
    temp.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
    const week1 = new Date(temp.getFullYear(), 0, 4);
    return (
        1 +
        Math.round(
            ((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7 // Adjusted calculation slightly
        )
    );
}

/** Formats a Date object into YYYY-MM-DD string */
export function formatDateISO(date: Date): string {
    if (!date || isNaN(date.getTime())) {
        return ""; //? Handle invalid date
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Parses a YYYY-MM-DD string into a Date object (at UTC midnight) */
export function parseDateISO(dateString: string): Date | null {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return null;
    }
    //? Parse as UTC to avoid timezone issues affecting the date part
    const parts = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (isNaN(date.getTime())) {
        return null;
    }
    return date;
}

/** Formats a date for display (e.g., "January 15, 2024") */
export function formatDateForDisplay(date: Date): string {
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString(undefined, { // Use user's locale
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        // timeZone: 'UTC'
    });
}