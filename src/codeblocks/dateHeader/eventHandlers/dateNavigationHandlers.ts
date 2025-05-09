import { App } from "obsidian";
import { DatePickerModal } from "src/components/DatePickerModal/DatePickerModal";
import { PluginState } from "src/pluginState";
import { calculateAdjacentPeriodDate } from "src/helpers/datePeriodUtils";

/** Updates the global plugin state with the new date and triggers necessary updates */
function updateGlobalDate(newIsoDate: string, pluginState: PluginState): void {
    //? pluginState setter handles recalculation and event dispatch
    pluginState.selectedDate = newIsoDate;
}

/** Creates the handler for the "previous" button click */
export function createPrevHandler(
    pluginState: PluginState,
    app: App
): () => void {
    return () => {
        const currentPeriod = pluginState.currentPeriod;
        const newIsoDate = calculateAdjacentPeriodDate(pluginState.selectedDate, currentPeriod, 'prev');
        if (newIsoDate) {
            updateGlobalDate(newIsoDate, pluginState); // Updates state -> triggers display update via listener
        } else { 
            console.error("[DateNavHandlers] Failed to calculate previous date.");
        }
    };
}

/** Creates the handler for the "next" button click */
export function createNextHandler(
    pluginState: PluginState,
    app: App
): () => void {
    return () => {
        const currentPeriod = pluginState.currentPeriod;
        const newIsoDate = calculateAdjacentPeriodDate(pluginState.selectedDate, currentPeriod, 'next');
        if (newIsoDate) {
            updateGlobalDate(newIsoDate, pluginState);
        } else { 
            console.error("[DateNavHandlers] Failed to calculate next date.");
        }
    };
}

/** Creates the handler for the "open modal" button click */
export function createOpenModalHandler(
    pluginState: PluginState,
    app: App,
): () => void {
    return () => {
        new DatePickerModal(app, pluginState.selectedDate, (newIsoDate) => {
            //? Modal selecting a specific DAY always updates the global selectedDate
            //? State setter will handle recalculation and events
            updateGlobalDate(newIsoDate, pluginState);
            // updateDisplayCallback(newIsoDate); // Display updates via listener
        }).open();
    };
}

