import { formatDateForDisplay, parseDateISO } from "src/helpers/dateUtils";
import type { DateNavigatorDOMElements } from "../dateNavigator.types";

//? Structure for the handlers needed by the builder
export interface DateNavigatorHandlers {
    handlePrev: () => void;
    handleNext: () => void;
    handleOpenModal: () => void;
}

/** //? Builds the DOM for the date navigator header. */
export function buildDateNavigatorDOM(
    containerEl: HTMLElement,
    initialIsoDate: string,
    handlers: DateNavigatorHandlers
): DateNavigatorDOMElements {
    containerEl.empty();
    const wrapper = containerEl.createDiv({ cls: "date-navigator-wrapper" });
    const navRow = wrapper.createDiv({ cls: "date-nav-row" });

    // --- Navigation Buttons ---
    const prevButton = navRow.createEl("button", { text: "←", cls: "clickable-icon date-nav-button date-nav-prev" });
    prevButton.setAttribute("aria-label", "Previous Day"); //todo: Make label dynamic based on period
    prevButton.addEventListener("click", handlers.handlePrev);

    // --- Date Display (H1) ---
    const dateDisplay = navRow.createEl("h1", { cls: "date-navigator-display" });
    const initialDateObj = parseDateISO(initialIsoDate);
    dateDisplay.textContent = initialDateObj ? formatDateForDisplay(initialDateObj) : "Invalid Date";

    const nextButton = navRow.createEl("button", { text: "→", cls: "clickable-icon date-nav-button date-nav-next" });
    nextButton.setAttribute("aria-label", "Next Day"); //todo: Make label dynamic
    nextButton.addEventListener("click", handlers.handleNext);

    // --- Open Modal Button ---
    //? Placed below the H1 for structure
    const openModalButton = wrapper.createEl("button", { text: "Select Date", cls: "date-nav-open-modal" });
    openModalButton.addEventListener("click", handlers.handleOpenModal);

    return { wrapper, navRow, prevButton, nextButton, dateDisplay, openModalButton };
}

/** Updates the displayed date text in the navigator. */
export function updateDateNavigatorDisplay(dateDisplayElement: HTMLElement, newIsoDate: string): void {
    const dateObj = parseDateISO(newIsoDate);
    const displayString = dateObj ? formatDateForDisplay(dateObj) : "Invalid Date";
    if (dateDisplayElement) {
        dateDisplayElement.textContent = displayString;
    } else {
        console.error("[DateNavDOM] Cannot update display, element not found.");
    }
}