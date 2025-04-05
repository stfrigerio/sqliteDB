//? Type for the component instance
interface BooleanSwitchInstance {
    _updateData: () => Promise<void>;
    habitKey: string;
}

//? Type for the event handler function itself
export type ChangeEventHandler = (event: Event) => void;

/** Creates the handler for the checkbox's 'change' event. */
export function createChangeHandler(instance: BooleanSwitchInstance): ChangeEventHandler {
    return (event: Event) => {
        //? We don't actually need the event target's value,
        //? the component's _updateData method will flip the *current* state.
        instance._updateData().catch(err => {
            //? Error logging, specific handling is inside _updateData
            console.error(`[BooleanSwitchChangeHandler ${instance.habitKey}] Error during update:`, err);
            //? Consider reverting the checkbox state visually if update fails? Requires more complex state management.
            if (event.target instanceof HTMLInputElement) {
                // Example: Revert visual state - CAUTION: might fight with error state UI
                event.target.checked = !event.target.checked;
            }
        });
    };
}