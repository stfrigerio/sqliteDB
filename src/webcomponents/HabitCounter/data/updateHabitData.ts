import { HabitDataService } from "../../services/HabitDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";
import { Notice } from "obsidian";

//? Interface describing the necessary parts of the component instance for updating.
interface UpdateComponentInstance {
    habitDataService: HabitDataService | null;
    table: string;
    habitKey: string;
    initialDate: string;
    currentValue: number;
    habitIdCol: string;
    valueCol: string;
    dateCol: string;
    _updateDisplay: (value: number) => void;
    showErrorState: (message: string) => void;
    clearErrorState: () => void;
}


/**
 * Orchestrates updating the habit data via the HabitDataService.
 * @param instance - The HabitCounter component instance.
 * @param delta - The amount to change the value by (+1 or -1).
 */
export async function updateHabitData(instance: UpdateComponentInstance, delta: number): Promise<void> {
    if (!instance.habitDataService || !instance.table || !instance.habitKey) {
        console.error(`[UpdateHabitData ${instance.habitKey}] Cannot update data: Missing service, table, or habitKey.`);
        instance.showErrorState("Save Error");
        new Notice("Cannot update habit: Setup incomplete.");
        return;
    }

    const currentNumericValue = typeof instance.currentValue === 'number' ? instance.currentValue : 0;
    const newValue = Math.max(0, currentNumericValue + delta); //? Prevent negative values

    const args = {
        table: instance.table,
        habitKey: instance.habitKey,
        date: calculateEffectiveDate(instance.initialDate),
        newValue: newValue,
        habitIdCol: instance.habitIdCol,
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        await instance.habitDataService.updateHabitValue(args);
        instance._updateDisplay(newValue); //? Update UI only on successful save
        instance.clearErrorState();
    } catch (error) {
        console.error(`[UpdateHabitData ${instance.habitKey}] Failed to update data:`, error);
        instance.showErrorState("Save Error");
        new Notice(`Error saving value for ${instance.habitKey}`);
    }
}