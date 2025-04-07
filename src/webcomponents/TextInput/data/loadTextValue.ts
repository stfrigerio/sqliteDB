import { TextInputDataService } from "../../services/TextInputDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";

/** Interface describing the necessary parts of the TextInput component instance for loading. */
interface LoadTextComponentInstance {
    textDataService: TextInputDataService | null; // Use the correct service
    table: string;
    date: string; // The initial date string ('@date' or 'YYYY-MM-DD')
    valueCol: string;
    dateCol: string;
    _updateDisplay: (value: string) => void; // Method to update component UI/state
    showErrorState: (message: string) => void; // Method to show error UI
    config: { initialValueAttr?: string }; // Access to initial value from attribute if DB fails/missing
}

/**
 * Orchestrates loading the text value using the TextInputDataService.
 * @param instance - The TextInput component instance.
 */
export async function loadTextValue(instance: LoadTextComponentInstance): Promise<void> {
    if (!instance.textDataService) {
        console.error(`[LoadTextValue ${instance.table}] Cannot load data: Missing textDataService.`);
        //? Use initial value from attribute as fallback before showing error?
        instance._updateDisplay(instance.config.initialValueAttr ?? "");
        instance.showErrorState("Load Error - DB");
        return;
    }

    const missingProps: string[] = [];
    if (!instance.table) missingProps.push("table");
    if (!instance.date) missingProps.push("date");
    if (!instance.valueCol) missingProps.push("valueCol");
    if (!instance.dateCol) missingProps.push("dateCol");

    if (missingProps.length > 0) {
        const missingPropsStr = missingProps.join(", ");
        console.error(`[LoadTextValue ${instance.table || 'UNKNOWN'}] Cannot load data: Missing required configuration properties: ${missingPropsStr}.`);
        //? Use initial value from attribute as fallback before showing error?
        instance._updateDisplay(instance.config.initialValueAttr ?? "");
        instance.showErrorState("Load Error - Config");
        return;
    }

    const args = {
        table: instance.table,
        date: calculateEffectiveDate(instance.date), // Use effective date
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        const value = await instance.textDataService.fetchTextValue(args);
        instance._updateDisplay(value); // Update component with fetched value (or empty string if not found)

    } catch (error) {
        console.error(`[LoadTextValue ${instance.table}] Failed to load data:`, error);
        //? Use initial value from attribute as fallback on DB error
        instance._updateDisplay(instance.config.initialValueAttr ?? "");
        instance.showErrorState("Load Error - DB");
    }
}