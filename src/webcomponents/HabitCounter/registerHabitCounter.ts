// src/webcomponents/registration.ts
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

        const habitKey = placeholderEl.dataset.habit; //^ Read 'habit' data attribute
        const date = placeholderEl.dataset.date;
        const emoji = placeholderEl.dataset.emoji;
        const table = placeholderEl.dataset.table;

        // --- Validation ---
        if (!habitKey) {
            console.warn("[HabitCounter Reg] Placeholder missing data-habit:", placeholderEl);
            placeholderEl.textContent = "[Missing habit name]";
            return;
        }
        if (!table) {
            console.warn(`[HabitCounter Reg] Placeholder for habit "${habitKey}" missing data-table:`, placeholderEl);
            placeholderEl.textContent = "[Missing table name]";
            return;
        }
        // --- End Validation ---

        try {
            //& console.log(`[HabitCounter Reg] Creating component for habit: ${habitKey}, table: ${table}`);
            const component = document.createElement("habit-counter") as HabitCounter;

            //^ Set attributes that the component will read later
            component.setAttribute("habit", habitKey); // Set 'habit' attribute
            component.setAttribute("table", table);
            if (date) component.setAttribute("date", date);
            else component.setAttribute("date", "@date");
            if (emoji) component.setAttribute("emoji", emoji);

            //& console.log(`[HabitCounter Reg] Injecting DBService for habit: ${habitKey}`);
            //? Inject the DBService dependency - component reads attributes inside this call now
            component.setDbService(dbService);

            placeholderEl.replaceWith(component);
            //& console.log(`[HabitCounter Reg] Replacement successful for habit: ${habitKey}`);

        } catch (error) {
            console.error(`[HabitCounter Reg] Error processing placeholder for habit "${habitKey}":`, error, placeholderEl);
            placeholderEl.textContent = "[Error Loading Counter]";
        }
    });
}