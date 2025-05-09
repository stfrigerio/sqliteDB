import { Setting } from "obsidian";
import { createHourOptions, createMinuteOptions } from "../timePickerUtils";

//? Interface for the references to the created select elements
export interface TimePickerDOMElements {
    hourSelect: HTMLSelectElement;
    minuteSelect: HTMLSelectElement;
}

/**
 * Builds the core UI elements (dropdowns) for the Time Picker Modal.
 * @param contentEl - The HTMLElement to append the controls to.
 * @param initialHour - The initially selected hour (0-23).
 * @param initialMinute - The initially selected minute (0-59).
 * @returns Object containing references to the select elements.
 */
export function buildTimePickerDOM(
    contentEl: HTMLElement,
    initialHour: number,
    initialMinute: number
): TimePickerDOMElements {

    // Use Obsidian's Setting components for structure and alignment
    const setting = new Setting(contentEl)
        .setName("Select Time")
        .setClass("time-picker-controls"); // Add class for specific styling

    // --- Hour Dropdown ---
    const hourSelect = document.createElement("select");
    hourSelect.classList.add("dropdown", "time-picker-select", "time-picker-hour");
    hourSelect.setAttribute("aria-label", "Hour");
    hourSelect.appendChild(createHourOptions(initialHour)); // Populate options
    setting.controlEl.appendChild(hourSelect); // Add to setting's control area

    // --- Separator ---
    const separator = document.createElement("span");
    separator.textContent = ":";
    separator.addClass("time-picker-separator");
    setting.controlEl.appendChild(separator);

    // --- Minute Dropdown ---
    const minuteSelect = document.createElement("select");
    minuteSelect.classList.add("dropdown", "time-picker-select", "time-picker-minute");
    minuteSelect.setAttribute("aria-label", "Minute");
    minuteSelect.appendChild(createMinuteOptions(initialMinute)); // Populate options
    setting.controlEl.appendChild(minuteSelect);

    return { hourSelect, minuteSelect };
}

/** Builds the action buttons (Cancel, Confirm) for the modal. */
export function buildTimePickerActions(
    contentEl: HTMLElement,
    onCancel: () => void,
    onConfirm: () => void
): void {
    new Setting(contentEl)
        .setClass("time-picker-actions") // Add class for styling
        .addButton(button => button
            .setButtonText("Cancel")
            .onClick(onCancel))
        .addButton(button => button
            .setButtonText("Confirm")
            .setCta() // Make it the primary action
            .onClick(onConfirm));
}