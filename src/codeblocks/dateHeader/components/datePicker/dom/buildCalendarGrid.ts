import { getISOWeekNumber } from "../datePickerUtils";

/**
 * Builds the main grid of days for the calendar month.
 * @param currentDisplayMonth - The month/year being displayed (Date object, 1st of month UTC).
 * @param selectedDateObj - The currently selected date (Date object, normalized to UTC midnight).
 * @param today - Today's date (Date object, normalized to UTC midnight).
 * @param onDateSelect - Callback function executed when a day button is clicked, passing the selected Date object.
 * @returns The HTMLElement representing the calendar grid.
 */
export function buildCalendarGrid(
    currentDisplayMonth: Date,
    selectedDateObj: Date,
    today: Date,
    onDateSelect: (selected: Date) => void
): HTMLElement {
    const grid = document.createElement("div");
    grid.className = "calendar-grid"; // Grid container

    const year = currentDisplayMonth.getUTCFullYear();
    const month = currentDisplayMonth.getUTCMonth();

    //? Day of the week for the 1st of the month (0=Sun, 6=Sat). Use UTC methods.
    const firstDayWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    //? Calculate offset for Monday start (0=Mon, 6=Sun)
    const startOffset = (firstDayWeekday + 6) % 7;

    //? Last day of the *current* month. Use UTC month+1, day 0.
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    let dayCounter = 1 - startOffset; // Start day counter including offset for leading empty cells
    let currentWeekNumber = -1; // Track week number to avoid duplicates per row

    while (dayCounter <= daysInMonth) {
        // --- Add Week Number Cell (at the start of each visual row) ---
        const dateForWeekNum = new Date(Date.UTC(year, month, dayCounter > 0 ? dayCounter : 1));
        const weekNumber = getISOWeekNumber(dateForWeekNum);

        //? Add week number cell at the start of grid row (every 8th element: 1 week# + 7 days)
        if (grid.children.length % 8 === 0) {
            const weekEl = document.createElement("div");
            weekEl.className = "week-number";
            weekEl.textContent = `${String(weekNumber).padStart(2, "0")}`;
            grid.appendChild(weekEl);
            currentWeekNumber = weekNumber;
        }

        // --- Add 7 Day Cells for the current week ---
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement("div");
            cell.className = "calendar-day-cell"; // Container for potential button

            if (dayCounter < 1 || dayCounter > daysInMonth) {
                //? Empty cell (before start or after end of month)
                cell.classList.add("empty");
            } else {
                //? Valid day within the month
                const currentDate = new Date(Date.UTC(year, month, dayCounter));
                //? No need to normalize time, UTC dates are already at midnight

                const dayButton = document.createElement("button");
                dayButton.textContent = String(dayCounter);
                dayButton.className = "calendar-day";
                dayButton.setAttribute("aria-label", currentDate.toLocaleDateString(undefined, { // Use local format for aria-label
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
                }));

                //? Check if this is the currently selected date
                if (currentDate.getTime() === selectedDateObj.getTime()) {
                    dayButton.classList.add("selected");
                    dayButton.setAttribute("aria-selected", "true");
                } else {
                    dayButton.setAttribute("aria-selected", "false");
                }

                //? Check if this is today's date
                if (currentDate.getTime() === today.getTime()) {
                    dayButton.classList.add("today");
                }

                //? Attach click handler
                dayButton.onclick = () => {
                    onDateSelect(currentDate); // Pass the Date object back to the modal's handler
                };

                cell.appendChild(dayButton);
            }
            grid.appendChild(cell);
            dayCounter++;
        }
    }

    return grid;
}