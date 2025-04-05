import { HabitDataService } from "../services/HabitDataService";
import { calculateEffectiveDate } from "./calculateEffectiveDate";

//? Interface describing the necessary parts of the component instance for loading.
interface LoadComponentInstance {
    habitDataService: HabitDataService | null;
    table: string;
    habitKey: string;
    initialDate: string; // Needed for effective date calculation
    _updateDisplay: (value: number) => void; // Method to update UI
    showErrorState: (message: string) => void; // Method to show error UI
}

/**
 * //? Orchestrates loading the habit data using the HabitDataService.
 * @param instance - The HabitCounter component instance.
 */
export async function loadHabitData(instance: LoadComponentInstance): Promise<void> {
    //& console.log(`[LoadHabitData ${instance.habitKey}] loadHabitData running.`);
    if (!instance.habitDataService || !instance.table || !instance.habitKey) {
        console.error(`[LoadHabitData ${instance.habitKey}] Cannot load data: Missing service, table, or habitKey.`);
        instance.showErrorState("Load Error");
        return;
    }

    const args = {
        table: instance.table,
        habitKey: instance.habitKey,
        date: calculateEffectiveDate(instance.initialDate), //~ Delegate date calculation
    };

    try {
        const value = await instance.habitDataService.fetchHabitValue(args);
       //& console.log(`[LoadHabitData ${instance.habitKey}] Data loaded successfully: ${value}`);
        instance._updateDisplay(value);
    } catch (error) {
        console.error(`[LoadHabitData ${instance.habitKey}] Failed to load data:`, error);
        instance.showErrorState("Load Error");
    }
}