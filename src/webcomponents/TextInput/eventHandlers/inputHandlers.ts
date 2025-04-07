import type { TextInputEventProps } from "../TextInput.types";

export type InputChangeEventHandler = (event: Event) => void;

/** Creates the handler for the input element's 'change' event. */
export function createInputChangeHandler(props: TextInputEventProps): InputChangeEventHandler {
    return (event: Event) => {
        if (event.target instanceof HTMLInputElement) {
            const newValue = event.target.value;
            props.setValue(newValue, true);
        }
    };
}