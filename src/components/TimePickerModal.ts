import { App, Modal, Notice, Setting } from "obsidian";

//? A very basic example modal for selecting a time.
export class TimePickerModal extends Modal {
    private currentTime: string; // e.g., "HH:MM"
    private onSelectCallback: (selectedTime: string) => void;

    constructor(app: App, initialTime: string | undefined, onSelect: (selectedTime: string) => void) {
        super(app);
        //? Basic validation or default
        this.currentTime = initialTime && /^\d{2}:\d{2}$/.test(initialTime) ? initialTime : "12:00";
        this.onSelectCallback = onSelect;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("time-picker-modal-content"); // For styling

        contentEl.createEl("h2", { text: "Select Time" });

        // --- Basic Time Input (replace with better UI later) ---
        let tempTime = this.currentTime;
        new Setting(contentEl)
            .setName("Time (HH:MM)")
            .addText(text => text
                .setValue(tempTime)
                .setPlaceholder("HH:MM")
                .onChange(value => {
                    // Basic format check
                    if (/^\d{1,2}:\d{1,2}$/.test(value)) {
                         // Format to HH:MM
                        const parts = value.split(':');
                        const hh = parts[0].padStart(2,'0');
                        const mm = parts[1].padStart(2,'0');
                        // Basic hour/minute range check (can be improved)
                        if (parseInt(hh) >= 0 && parseInt(hh) <= 23 && parseInt(mm) >= 0 && parseInt(mm) <= 59) {
                        tempTime = `${hh}:${mm}`;
                        } else {
                            // Handle invalid range slightly? Or let confirm check.
                        }
                    }
                }));

        // --- Action Buttons ---
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText("Cancel")
                .onClick(() => this.close()))
            .addButton(button => button
                .setButtonText("Confirm")
                .setCta() // Make it the primary action
                .onClick(() => {
                    //? Final validation before confirming
                    if (/^\d{2}:\d{2}$/.test(tempTime)) {
                        this.onSelectCallback(tempTime);
                        this.close();
                    } else {
                        new Notice("Invalid time format. Use HH:MM.");
                    }
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}