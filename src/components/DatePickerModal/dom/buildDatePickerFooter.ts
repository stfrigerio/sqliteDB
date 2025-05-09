import { formatDateForDisplay } from "src/helpers/dateUtils";

/**
 * Builds the footer section of the date picker modal (Selected Date Display, Confirm Button).
 * @param selectedDateObj - The currently selected date (Date object).
 * @param onConfirm - Callback function to execute when the 'Select' button is clicked.
 * @returns The HTMLElement representing the footer.
 */
export function buildDatePickerFooter(
    selectedDateObj: Date,
    onConfirm: () => void
): HTMLElement {
    const footer = document.createElement("div");
    footer.className = "calendar-footer";

    // --- Display Currently Selected Date ---
    const selectedDateDisplay = footer.createEl("span", { cls: "selected-date-display" });
    selectedDateDisplay.textContent = `Selected: ${formatDateForDisplay(selectedDateObj)}`;

    // --- Confirm Button ---
    const confirmBtn = footer.createEl("button", { text: "Select", cls: "mod-cta" }); // Use Obsidian's primary button style
    confirmBtn.onclick = onConfirm; // Assign the provided handler

    return footer;
}