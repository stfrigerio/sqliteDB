import { BooleanSwitchDataService } from "../../services/BooleanDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";

//? Interface describing the component instance parts needed for loading
interface LoadBooleanComponentInstance {
    booleanDataService: BooleanSwitchDataService | null;
    table: string; habitKey: string; initialDate: string;
    habitIdCol: string; valueCol: string; dateCol: string;
    _updateDisplay: (value: 0 | 1) => void; // Expects 0 or 1
    showErrorState: (message: string) => void;
}

/** Orchestrates loading the boolean value using the BooleanSwitchDataService. */
export async function loadBooleanValue(instance: LoadBooleanComponentInstance): Promise<void> {
    if (!instance.booleanDataService || !instance.table || !instance.habitKey || !instance.habitIdCol || !instance.valueCol || !instance.dateCol) {
        console.error(`[LoadBooleanValue ${instance.habitKey}] Cannot load data: Missing required properties.`);
        instance.showErrorState("Load Error - Config");
        return;
    }

    const effectiveDate = calculateEffectiveDate(instance.initialDate); 

    const args = {
        table: instance.table,
        habitKey: instance.habitKey,
        date: effectiveDate,
        habitIdCol: instance.habitIdCol,
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        const value = await instance.booleanDataService.fetchBooleanValue(args);
        instance._updateDisplay(value);

    } catch (error) {
        console.error(`[LoadBooleanValue ${instance.habitKey}] Failed to load data:`, error);
        instance.showErrorState("Load Error - DB");
    }
}