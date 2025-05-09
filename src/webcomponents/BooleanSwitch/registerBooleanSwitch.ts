import { DBService } from "../../DBService";
import { BooleanSwitch } from "./BooleanSwitch";

//? Define element if needed
if (!customElements.get("boolean-switch")) {
    customElements.define("boolean-switch", BooleanSwitch);
}

/**
 * Finds placeholder elements and replaces them with initialized BooleanSwitch components.
 * @param el The container element to search within.
 * @param dbService The DBService instance for dependency injection.
 */
export const registerBooleanSwitch = (el: HTMLElement, dbService: DBService) => {
    const placeholders = el.querySelectorAll("span.boolean-switch-placeholder");

    placeholders.forEach((placeholderEl) => {
        if (!(placeholderEl instanceof HTMLElement)) return;

        //~ Read all expected attributes from the placeholder
        const habitKey = placeholderEl.dataset.habit;
        const date = placeholderEl.dataset.date;
        const emoji = placeholderEl.dataset.emoji;
        const table = placeholderEl.dataset.table;
        const habitIdCol = placeholderEl.dataset.habitIdCol;
        const valueCol = placeholderEl.dataset.valueCol;
        const dateCol = placeholderEl.dataset.dateCol;

        // --- Basic Validation ---
        if (!habitKey || !table || !habitIdCol || !valueCol || !dateCol) {
            console.warn("[BooleanSwitch Reg] Placeholder missing one or more required data attributes (habitKey, table, habitIdCol, valueCol, dateCol):", placeholderEl);
            placeholderEl.textContent = "[Config Error]";
            return;
        }

        try {
            const component = document.createElement("boolean-switch") as BooleanSwitch;

            //~ Set all attributes on the component element
            component.setAttribute("data-key", habitKey);
            component.setAttribute("data-table", table);
            if (date) component.setAttribute("data-date", date);
            else component.setAttribute("data-date", "@date"); // Default to dynamic date
            if (emoji) component.setAttribute("data-emoji", emoji);
            component.setAttribute("data-key-id-col", habitIdCol);
            component.setAttribute("data-value-col", valueCol);
            component.setAttribute("data-date-col", dateCol);

            component.setDbService(dbService);

            placeholderEl.replaceWith(component);

        } catch (error) {
            console.error(`[BooleanSwitch Reg] Error processing placeholder for key "${habitKey}":`, error, placeholderEl);
            placeholderEl.textContent = "[Error Loading]";
        }
    });
}