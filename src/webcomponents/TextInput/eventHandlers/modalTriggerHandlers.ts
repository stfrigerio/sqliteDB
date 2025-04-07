import type { TextInputEventProps } from "../TextInput.types";
import { TimePickerModal } from "../../../components/TimePickerModal";
import { DatePickerModal } from "../../../codeblocks/dateHeader/components/datePicker/DatePickerModal";

export type ModalTriggerHandler = (event: MouseEvent) => void;

/** //? Creates the handler for the modal trigger element's 'click' event. */
export function createModalTriggerHandler(props: TextInputEventProps): ModalTriggerHandler { // Use renamed type
    return (event: MouseEvent) => {
        // No debug log needed at start

        switch (props.modalType) {
            case 'time-picker':
                new TimePickerModal(props.app, props.currentValue, (selectedTime: string) => {
                    props.setValue(selectedTime, true);
                }).open();
                break;

            case 'date-picker':
                const initialDate = props.currentValue || new Date().toISOString().split('T')[0];
                new DatePickerModal(props.app, initialDate, (selectedDate: string) => {
                    props.setValue(selectedDate, true);
                }).open();
                break;

            // todo: Add cases for 'list-select', 'custom', etc.

            case 'none':
            default:
                // Do nothing or console.warn if unexpected click
                // console.warn(`[ModalTriggerHandler ${props.label}] Clicked trigger but modalType is '${props.modalType}'.`);
                break;
        }
    };
}