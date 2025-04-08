import type { TextInput } from "../TextInput";

export type InputChangeEventHandler = (event: Event) => void;

/** Creates the handler for the input element's 'change' event. */
export function createInputChangeHandler(instance: TextInput): InputChangeEventHandler {
    return (event: Event) => {
        if (event.target instanceof HTMLInputElement) {
            const newValue = event.target.value;
            //? Access component's method directly
            //? Pass true to trigger save on 'change' event
            instance._setValue(newValue, true);
        }
    };
}