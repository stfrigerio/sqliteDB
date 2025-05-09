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
        instance._updateData().catch(err => {
            console.error(`[BooleanSwitchChangeHandler ${instance.habitKey}] Error during update:`, err);
            if (event.target instanceof HTMLInputElement) {
                event.target.checked = !event.target.checked;
            }
        });
    };
}