import { HabitDataService } from "../../services/HabitDataService";
import { calculateEffectiveDate } from "../../services/utils/calculateEffectiveDate";

//? Interface describing the necessary parts of the component instance for loading.
interface LoadComponentInstance {
    habitDataService: HabitDataService | null;
    table: string;
    habitKey: string;
    initialDate: string;
    habitIdCol: string;
    valueCol: string;
    dateCol: string;
    _updateDisplay: (value: number) => void;
    showErrorState: (message: string) => void;
}

/**
 * Orchestrates loading the habit data using the HabitDataService.
 * @param instance - The HabitCounter component instance.
 */
export async function loadHabitData(instance: LoadComponentInstance): Promise<void> {
    if (!instance.habitDataService || !instance.table || !instance.habitKey) {
        console.error(`[LoadHabitData ${instance.habitKey}] Cannot load data: Missing service, table, or habitKey.`);
        instance.showErrorState("Load Error");
        return;
    }

    const args = {
        table: instance.table,
        habitKey: instance.habitKey,
        date: calculateEffectiveDate(instance.initialDate),
        habitIdCol: instance.habitIdCol,
        valueCol: instance.valueCol,
        dateCol: instance.dateCol,
    };

    try {
        const value = await instance.habitDataService.fetchHabitValue(args);
        instance._updateDisplay(value);
    } catch (error) {
        console.error(`[LoadHabitData ${instance.habitKey}] Failed to load data:`, error);
        instance.showErrorState("Load Error");
    }
}