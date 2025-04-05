import { BooleanSwitchDataService } from "../../services/BooleanDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";
import { Notice } from "obsidian";

//? Interface describing the component instance parts needed for upserting
interface UpsertBooleanComponentInstance {
    booleanDataService: BooleanSwitchDataService | null;
    table: string; habitKey: string; initialDate: string;
    currentValue: 0 | 1;
    habitIdCol: string; valueCol: string; dateCol: string;
    _updateDisplay: (value: 0 | 1) => void;
    showErrorState: (message: string) => void;
    clearErrorState: () => void;
}

/** Orchestrates upserting the boolean value via the BooleanSwitchDataService. */
export async function upsertBooleanValue(instance: UpsertBooleanComponentInstance): Promise<void> {
    if (!instance.booleanDataService || !instance.table || !instance.habitKey || !instance.habitIdCol || !instance.valueCol || !instance.dateCol) {
        console.error(`[UpsertBooleanValue ${instance.habitKey}] Cannot update data: Missing required properties.`);
        instance.showErrorState("Save Error - Config");
        new Notice("Cannot update switch: Configuration incomplete.");
        return;
    }

    //^ Flip the current value (0 becomes 1, 1 becomes 0)
    const newValue = instance.currentValue === 1 ? 0 : 1;

    const args = {
        table: instance.table,
        habitKey: instance.habitKey,
        date: calculateEffectiveDate(instance.initialDate),
        newValue: newValue as 0 | 1,
        habitIdCol: instance.habitIdCol,
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        await instance.booleanDataService.upsertBooleanValue(args);
        instance._updateDisplay(newValue); // Update UI with the new value
        instance.clearErrorState();
    } catch (error) {
        console.error(`[UpsertBooleanValue ${instance.habitKey}] Failed to upsert data:`, error);
        instance.showErrorState("Save Error - DB");
        new Notice(`Error saving switch state for ${instance.habitKey}`);
    }
}