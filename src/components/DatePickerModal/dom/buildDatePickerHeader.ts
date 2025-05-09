
/**
 * Builds the header section of the date picker modal (Prev, Title, Next).
 * @param currentDisplayMonth - The Date object representing the month/year being displayed.
 * @param onPrevMonth - Callback function to execute when the 'Previous' button is clicked.
 * @param onNextMonth - Callback function to execute when the 'Next' button is clicked.
 * @returns The HTMLElement representing the header.
 */
export function buildDatePickerHeader(
    currentDisplayMonth: Date,
    onPrevMonth: () => void,
    onNextMonth: () => void
): HTMLElement {
    const header = document.createElement("div");
    header.className = "calendar-header";

    // --- Previous Month Button ---
    const prevBtn = header.createEl("button", { text: "←", cls: "clickable-icon" });
    prevBtn.setAttribute("aria-label", "Previous month");
    prevBtn.onclick = onPrevMonth; // Assign the provided handler

    // --- Month/Year Title ---
    const title = header.createEl("span", {
        cls: "calendar-title",
        text: currentDisplayMonth.toLocaleString("default", { // Use user's default locale
            month: "long",
            year: "numeric",
            timeZone: 'UTC' // Ensure month/year is based on UTC date
        }),
    });

    // --- Next Month Button ---
    const nextBtn = header.createEl("button", { text: "→", cls: "clickable-icon" });
    nextBtn.setAttribute("aria-label", "Next month");
    nextBtn.onclick = onNextMonth; // Assign the provided handler

    return header;
}