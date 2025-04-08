import type { TextInput } from "../TextInput";
import { DatePickerModal } from "src/components/DatePickerModal/DatePickerModal";
import { TimePickerModal } from "src/components/TimePickerModal/TimePickerModal";

export type ModalTriggerHandler = (event: MouseEvent) => void;

/** //? Creates the handler for the modal trigger element's 'click' event. */
//^ Accept the component instance 'this' instead of props object
export function createModalTriggerHandler(instance: TextInput): ModalTriggerHandler {
    return (event: MouseEvent) => {
        const modalType = instance.config.modalType; // Get current modalType from config
        const app = instance.appInstance; // Get app instance
        const currentValue = instance.currentValue; // Get current value
        const label = instance.config.label; // Get label for logging

        if (!app) {
            console.error(`[ModalTriggerHandler ${label}] Cannot open modal: App instance is missing.`);
            return;
        }

        switch (modalType) {
            case 'time-picker':
                new TimePickerModal(app, currentValue, (selectedTime: string) => {
                    //? Use component's method to set value
                    instance._setValue(selectedTime, true);
                }).open();
                break;

            case 'date-picker':
                const initialDate = currentValue || new Date().toISOString().split('T')[0];
                new DatePickerModal(app, initialDate, (selectedDate: string) => {
                    instance._setValue(selectedDate, true);
                }).open();
                break;

            case 'none':
            default:
                console.warn(`[ModalTriggerHandler ${label}] Clicked trigger but modalType is '${modalType}'.`);
                break;
        }
    };
}