import { App } from "obsidian";

//? Type defining the available modal types this component can trigger
export type ModalType = 'time-picker' | 'date-picker' | 'none';

//? Configuration options read from attributes for TextInput
export interface TextInputConfig {
    //? UI Config
    label?: string;
    placeholder?: string;
    initialValueAttr?: string;
    modalType?: ModalType;
    isButton?: boolean;

    //? Data Config (Similar to BooleanSwitch/HabitCounter)
    table?: string;
    date?: string;
    valueCol?: string;
    dateCol?: string;
}

//? References to the DOM elements for TextInput
export interface TextInputDOMElements {
    wrapper: HTMLElement;
    labelElement: HTMLLabelElement | null;
    inputElement: HTMLInputElement;
    modalTriggerElement: HTMLElement;
}

//? Properties needed by event handlers for TextInput
export interface TextInputEventProps extends TextInputConfig {
    app: App;
    uiElements: TextInputDOMElements;
    currentValue: string;
    setValue: (newValue: string, triggerSave?: boolean) => void;
}

//? Types for the Data Service
export interface TextRecord {
    value: string | null; // Value can be text or null
}

//? Base arguments for identifying an entry in DB
export interface TextDataArgs {
    table: string;
    date: string;      // Date to identify the row
    valueCol: string;  // Column to fetch/update
    dateCol: string;   // Column containing the date key
}

//? Arguments for upserting the text value
export interface UpsertTextArgs extends TextDataArgs {
    newValue: string | null; // Allow saving null/empty string
}