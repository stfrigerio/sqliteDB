import { DBService } from "../../DBService";
import { HabitCounter } from "./HabitCounter";

//? Define element if needed here or ensure it's defined elsewhere before this runs
if (!customElements.get("habit-counter")) {
    customElements.define("habit-counter", HabitCounter);
}

/**
 * Finds placeholder elements and replaces them with initialized HabitCounter components.
 * @param el The container element to search within.
 * @param dbService The DBService instance for dependency injection.
 */
export const registerHabitCounter = (el: HTMLElement, dbService: DBService) => {
    const placeholders = el.querySelectorAll("span.habit-counter-placeholder");

    placeholders.forEach((placeholderEl) => { //~ Removed index as it wasn't used
        if (!(placeholderEl instanceof HTMLElement)) return;

        const habitKey = placeholderEl.dataset.habit;
        const date = placeholderEl.dataset.date;
        const emoji = placeholderEl.dataset.emoji;
        const table = placeholderEl.dataset.table;
        const habitIdCol = placeholderEl.dataset.habitIdCol; 
        const valueCol = placeholderEl.dataset.valueCol;     
        const dateCol = placeholderEl.dataset.dateCol; 

        if (!habitKey || !table || !habitIdCol || !valueCol || !dateCol) {
            console.warn("[HabitCounter Reg] Placeholder missing one or more required data attributes (habit, table, habit-id-col, value-col, date-col):", placeholderEl);
            placeholderEl.textContent = "[Config Error]";
            return;
        }

        try {
            const component = document.createElement("habit-counter") as HabitCounter;

            //^ Set attributes that the component will read later
            component.setAttribute("habit", habitKey);
            component.setAttribute("table", table);
            if (date) component.setAttribute("date", date);
            else component.setAttribute("date", "@date");
            if (emoji) component.setAttribute("emoji", emoji);
            component.setAttribute("data-habit-id-col", habitIdCol);
            component.setAttribute("data-value-col", valueCol);
            component.setAttribute("data-date-col", dateCol);

            //? Inject the DBService dependency - component reads attributes inside this call now
            component.setDbService(dbService);

            placeholderEl.replaceWith(component);
        } catch (error) {
            console.error(`[HabitCounter Reg] Error processing placeholder for habit "${habitKey}":`, error, placeholderEl);
            placeholderEl.textContent = "[Error Loading Counter]";
        }
    });
}