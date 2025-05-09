import { App, Modal } from "obsidian";
import { buildTimePickerDOM, buildTimePickerActions, TimePickerDOMElements } from "./dom/buildTimePickerDOM";
import { parseTimeString, formatTimeString } from "./timePickerUtils";

export class TimePickerModal extends Modal {
    private initialHour: number;
    private initialMinute: number;
    private onSelectCallback: (selectedTime: string) => void;

    //? References to the dropdown elements
    private uiElements: TimePickerDOMElements | null = null;

    constructor(app: App, initialTime: string | undefined, onSelect: (selectedTime: string) => void) {
        super(app);
        this.onSelectCallback = onSelect;

        //? Parse initial time into numbers
        const { hour, minute } = parseTimeString(initialTime ?? ""); // Provide default if undefined
        this.initialHour = hour;
        this.initialMinute = minute;

    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("time-picker-modal-content"); // For styling

        contentEl.createEl("h2", { text: "Select Time" });

        // --- Build Dropdowns ---
        this.uiElements = buildTimePickerDOM(contentEl, this.initialHour, this.initialMinute);

        // --- Build Actions ---
        buildTimePickerActions(contentEl, this._handleCancel, this._handleConfirm);
    }

    // --- Handlers ---

    private _handleCancel = (): void => {
        this.close();
    };

    private _handleConfirm = (): void => {
        if (!this.uiElements) {
            console.error("[TimePickerModal] Cannot confirm: UI elements not found.");
            return;
        }
        //? Get current values from dropdowns
        const selectedHour = this.uiElements.hourSelect.value;
        const selectedMinute = this.uiElements.minuteSelect.value;

        //? Format the selected time
        const selectedTime = formatTimeString(selectedHour, selectedMinute);

        this.onSelectCallback(selectedTime); // Pass HH:MM string back
        this.close();
    };

    onClose() {
        this.contentEl.empty();
        this.uiElements = null; // Clear references
    }
}