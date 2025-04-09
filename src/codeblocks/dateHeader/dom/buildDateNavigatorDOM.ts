import type { DateNavigatorDOMElements, NavigationPeriod } from "../dateNavigator.types";
import { formatPeriodForDisplay } from "src/helpers/datePeriodUtils";

//? Structure for the handlers needed by the builder
export interface DateNavigatorHandlers {
    handlePrev: () => void;
    handleNext: () => void;
    handleOpenModal: () => void;
    handlePeriodChange: (event: Event) => void;
}

/** Builds the DOM for the date navigator header. */
export function buildDateNavigatorDOM(
    containerEl: HTMLElement,
    initialIsoDate: string,
    initialPeriod: NavigationPeriod,
    handlers: DateNavigatorHandlers
): DateNavigatorDOMElements {

    containerEl.empty();
    const wrapper = containerEl.createDiv({ cls: "date-navigator-wrapper" });
    const navRow = wrapper.createDiv({ cls: "date-nav-row" });

    // --- Navigation Buttons ---
    const prevLabel = `Previous ${initialPeriod}`;
    const nextLabel = `Next ${initialPeriod}`;

    const prevButton = navRow.createEl("button", { text: "←", cls: "clickable-icon date-nav-button date-nav-prev" });
    prevButton.setAttribute("aria-label", prevLabel);
    prevButton.addEventListener("click", handlers.handlePrev);

    // --- Date Display (H1) ---
    const dateDisplay = navRow.createEl("h1", { cls: "date-navigator-display" });
    dateDisplay.textContent = formatPeriodForDisplay(initialIsoDate, initialPeriod);

    const nextButton = navRow.createEl("button", { text: "→", cls: "clickable-icon date-nav-button date-nav-next" });
    nextButton.setAttribute("aria-label", nextLabel);
    nextButton.addEventListener("click", handlers.handleNext);

    const controlsRow = wrapper.createDiv({cls: "date-controls-row"}); // Inner div for controls

    // --- Open Modal Button ---
    //? Placed below the H1 for structure
    const openModalButton = controlsRow.createEl("button", { text: "Select Date", cls: "date-nav-open-modal" });
    openModalButton.addEventListener("click", handlers.handleOpenModal);

    //todo meh i dont like it
    // const periodSelect = controlsRow.createEl("select", { cls: "dropdown date-nav-period-select" });
    // periodSelect.setAttribute("aria-label", "Select Period");
    // const periods: NavigationPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];
    // periods.forEach(p => {
    //     const option = periodSelect.createEl("option");
    //     option.value = p;
    //     option.textContent = p.charAt(0).toUpperCase() + p.slice(1); // Capitalize
    //     if (p === initialPeriod) {
    //         option.selected = true; // Set initial selection
    //     }
    // });
    // periodSelect.addEventListener("change", handlers.handlePeriodChange);

    return { wrapper, prevButton, nextButton, dateDisplay, openModalButton }; 
}

/** Updates the displayed date text in the navigator. */
export function updateDateNavigatorDisplay(
    elements: DateNavigatorDOMElements | null,
    newIsoDate: string,
    newPeriod: NavigationPeriod
): void {
    const displayString = formatPeriodForDisplay(newIsoDate, newPeriod);
    if (!elements) { console.error("[DateNavDOM] Cannot update display, elements object is null."); return; }

    // Update Title
    if (elements.dateDisplay) {
        elements.dateDisplay.textContent = displayString;
    }
    // Update Button Labels
    const prevLabel = `Previous ${newPeriod.charAt(0).toUpperCase() + newPeriod.slice(1)}`;
    const nextLabel = `Next ${newPeriod.charAt(0).toUpperCase() + newPeriod.slice(1)}`;
    if (elements.prevButton) elements.prevButton.setAttribute("aria-label", prevLabel);
    if (elements.nextButton) elements.nextButton.setAttribute("aria-label", nextLabel);

    // Update Period Selector (if its value differs from the new global period)
    if (elements.periodSelect && elements.periodSelect.value !== newPeriod) {
        elements.periodSelect.value = newPeriod;
    }
}