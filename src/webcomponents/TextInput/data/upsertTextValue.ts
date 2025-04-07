import { TextInputDataService } from "../../services/TextInputDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";
import { Notice } from "obsidian";

//? Interface describing the necessary parts of the TextInput component instance for upserting.
interface UpsertTextComponentInstance {
    textDataService: TextInputDataService | null;
    table: string;
    date: string; // The initial date string ('@date' or 'YYYY-MM-DD')
    currentValue: string; // The current value held by the component
    valueCol: string;
    dateCol: string;
    _updateDisplay: (value: string) => void; // Method to update UI (maybe not needed here if optimistic?)
    showErrorState: (message: string) => void;
    clearErrorState: () => void;
}

/**
 * Orchestrates upserting the text value via the TextInputDataService.
 * @param instance - The TextInput component instance.
 */
export async function upsertTextValue(instance: UpsertTextComponentInstance): Promise<void> {
    if (!instance.textDataService || !instance.table || !instance.date || !instance.valueCol || !instance.dateCol) {
        console.error(`[UpsertTextValue ${instance.table}] Cannot save data: Missing required configuration properties.`);
        instance.showErrorState("Save Error - Config");
        new Notice("Cannot save text input: Configuration incomplete.");
        return;
    }

    const args = {
        table: instance.table,
        date: calculateEffectiveDate(instance.date), 
        newValue: instance.currentValue,
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        await instance.textDataService.upsertTextValue(args);
        instance.clearErrorState(); 

    } catch (error) {
        console.error(`[UpsertTextValue ${instance.table}] Failed to save data:`, error);
        instance.showErrorState("Save Error - DB");
        new Notice(`Error saving value for ${instance.table}`);
        //? Should we revert the UI? Depends on desired UX.
        //? For now, keep the user's input but show error state.
    }
}