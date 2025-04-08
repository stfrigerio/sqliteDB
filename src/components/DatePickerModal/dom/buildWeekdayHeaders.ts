/**
 * Builds the row displaying weekday abbreviations (Mo, Tu, etc.).
 * @param includeWeekNumber - If true, adds a "W#" header cell at the beginning.
 * @returns The HTMLElement representing the weekday header row.
 */
export function buildWeekdayHeaders(includeWeekNumber: boolean = false): HTMLElement {
    const weekdaysContainer = document.createElement("div");
    weekdaysContainer.className = "calendar-weekdays";

    //? Header for Week# column (optional)
    if (includeWeekNumber) {
        weekdaysContainer.createDiv({ cls: "week-number-header", text: "W#" });
    }

    //? Standard Monday-first weekdays
    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    weekdays.forEach(day => weekdaysContainer.createDiv({ cls: "calendar-weekday", text: day }));

    return weekdaysContainer;
}