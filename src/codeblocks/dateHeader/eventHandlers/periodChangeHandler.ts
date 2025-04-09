import { PluginState } from "src/pluginState";
import { NavigationPeriod } from "src/codeblocks/dateHeader/dateNavigator.types";

/** Creates the handler for the period selector's 'change' event. */
export function createPeriodChangeHandler(
    pluginState: PluginState
): (event: Event) => void {
    return (event: Event) => {
        if (event.target instanceof HTMLSelectElement) {
            const newPeriod = event.target.value as NavigationPeriod;

            //? Validate if it's a known period type before setting
            const validPeriods: NavigationPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];
            if (validPeriods.includes(newPeriod)) {
                //^ Update the GLOBAL plugin state's period
                //? This will trigger recalculation and the 'plugin-date-changed' event
                pluginState.currentPeriod = newPeriod;
            } else {
                console.warn(`[PeriodChangeHandler] Invalid period selected: ${newPeriod}`);
            }
        }
    };
}