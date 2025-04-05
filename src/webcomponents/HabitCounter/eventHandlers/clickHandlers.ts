//? Type for the component instance
//? It needs access to the method that triggers the data update.
interface HabitCounterInstance {
    _updateData: (delta: number) => Promise<void>;
    habitKey: string;
}

/** Creates the handler for the decrement button click. */
export function createDecrementHandler(instance: HabitCounterInstance): () => void {
    return () => {
       //& console.log(`[HabitCounterClickHandler ${instance.habitKey}] Decrement clicked.`);
        instance._updateData(-1).catch(err => {
            console.error(`[HabitCounterClickHandler ${instance.habitKey}] Error during decrement update:`, err);
        });
    };
}

/** Creates the handler for the increment button click. */
export function createIncrementHandler(instance: HabitCounterInstance): () => void {
    return () => {
       //& console.log(`[HabitCounterClickHandler ${instance.habitKey}] Increment clicked.`);
        instance._updateData(1).catch(err => {
            console.error(`[HabitCounterClickHandler ${instance.habitKey}] Error during increment update:`, err);
        });
    };
}