// src/components/dateNavigator/eventHandlers/dateNavigationHandlers.ts
import { App } from "obsidian";
import { DatePickerModal } from "../../datePicker/DatePickerModal";
import { PluginState } from "src/pluginState";
import { parseDateISO, formatDateISO } from "../../datePicker/datePickerUtils";
import { NavigationPeriod } from "../dateNavigator.types";

/** Updates the global plugin state with the new date and triggers necessary updates */
function updateGlobalDate(newDate: Date, pluginState: PluginState, app: App): void {
    const newIsoDate = formatDateISO(newDate);
    if (pluginState.selectedDate !== newIsoDate) {
        pluginState.selectedDate = newIsoDate;
        // Optional: Force re-render if needed, maybe make this configurable
        // app.workspace.getActiveViewOfType(MarkdownView)?.previewMode?.rerender(true);
    }
    //todo: Could add dispatchEvent here for more reactive updates elsewhere
}

/** //? Creates the handler for the "previous" button click */
export function createPrevHandler(
    pluginState: PluginState,
    period: NavigationPeriod,
    app: App,
    //? Callback to update the display text after changing the date
    updateDisplayCallback: (newIsoDate: string) => void
): () => void {
    return () => {
        const currentDate = parseDateISO(pluginState.selectedDate) ?? new Date(); // Default to today on parse error
        switch (period) {
            case 'day':
                currentDate.setUTCDate(currentDate.getUTCDate() - 1);
                break;
            //todo: Implement 'week', 'month', etc.
            default:
                console.warn(`[DateNavHandlers] Unsupported period for prev navigation: ${period}`);
                return;
        }
        updateGlobalDate(currentDate, pluginState, app);
        updateDisplayCallback(formatDateISO(currentDate)); // Update local display
    };
}

/** Creates the handler for the "next" button click */
export function createNextHandler(
    pluginState: PluginState,
    period: NavigationPeriod,
    app: App,
    updateDisplayCallback: (newIsoDate: string) => void
): () => void {
    return () => {
        const currentDate = parseDateISO(pluginState.selectedDate) ?? new Date();
       //& console.log(`[DateNavHandlers] Next clicked. Current: ${formatDateISO(currentDate)}, Period: ${period}`);
        switch (period) {
            case 'day':
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                break;
            //todo: Implement 'week', 'month', etc.
            default:
                console.warn(`[DateNavHandlers] Unsupported period for next navigation: ${period}`);
                return;
        }
        updateGlobalDate(currentDate, pluginState, app);
        updateDisplayCallback(formatDateISO(currentDate));
    };
}

/** Creates the handler for the "open modal" button click */
export function createOpenModalHandler(
    pluginState: PluginState,
    app: App,
    updateDisplayCallback: (newIsoDate: string) => void
): () => void {
    return () => {
        new DatePickerModal(app, pluginState.selectedDate, (newIsoDate) => {
            //? This is the callback executed when the modal confirms a selection
            //? No need to call updateGlobalDate here, modal already did via pluginState setter
            updateDisplayCallback(newIsoDate);
        }).open();
    };
}