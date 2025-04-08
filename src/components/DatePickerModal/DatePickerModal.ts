import { Modal, App, Notice } from "obsidian";
import { buildDatePickerHeader } from "./dom/buildDatePickerHeader";
import { buildWeekdayHeaders } from "./dom/buildWeekdayHeaders";
import { buildCalendarGrid } from "./dom/buildCalendarGrid";
import { buildDatePickerFooter } from "./dom/buildDatePickerFooter";
import { formatDateISO, parseDateISO } from "src/helpers/dateUtils";

export class DatePickerModal extends Modal {
    private selectedDateObj: Date; //? Internal state as Date object
    private currentDisplayMonth: Date; //? Month being displayed in the calendar
    private today: Date; //? Today's date (normalized)

    //? Callback to notify the parent component of the selection
    private onSelectCallback: (newIsoDate: string) => void;

    constructor(app: App, currentIsoDate: string, onSelect: (newIsoDate: string) => void) {
        super(app);
        this.onSelectCallback = onSelect;

        const initialDate = parseDateISO(currentIsoDate);
        //? Ensure selectedDateObj is always a valid Date object, default to today if parse fails
        this.selectedDateObj = initialDate && !isNaN(initialDate.getTime()) ? initialDate : new Date();
        //? Set time to 00:00:00 UTC to compare dates easily
        this.selectedDateObj.setUTCHours(0, 0, 0, 0);

        this.today = new Date();
        this.today.setUTCHours(0, 0, 0, 0);

        //? Start display month from the selected date's month
        this.currentDisplayMonth = new Date(Date.UTC(this.selectedDateObj.getUTCFullYear(), this.selectedDateObj.getUTCMonth(), 1));

    }

    onOpen() {
        this.contentEl.addClass("custom-datepicker-modal-content");
        this.render();
    }

    private render() {
        const { contentEl } = this;
        contentEl.empty(); // Clear previous content

        // --- Build Header ---
        const headerEl = buildDatePickerHeader(
            this.currentDisplayMonth,
            this._handlePrevMonth, // Pass handler references
            this._handleNextMonth
        );
        contentEl.appendChild(headerEl);

        // --- Build Weekday Headers ---
        const weekdaysEl = buildWeekdayHeaders(true); // Include week number header
        contentEl.appendChild(weekdaysEl);

        // --- Build Calendar Grid ---
        const gridEl = buildCalendarGrid(
            this.currentDisplayMonth,
            this.selectedDateObj,
            this.today,
            this._handleDateSelect // Pass date selection handler
        );
        contentEl.appendChild(gridEl);

        // --- Build Footer ---
        const footerEl = buildDatePickerFooter(
            this.selectedDateObj,
            this._confirmSelection // Pass confirmation handler
        );
        contentEl.appendChild(footerEl);
    }

    // --- Handlers passed to builders ---

    private _handlePrevMonth = (): void => {
        this.currentDisplayMonth.setUTCMonth(this.currentDisplayMonth.getUTCMonth() - 1);
        this.render(); // Re-render the whole modal
    };

    private _handleNextMonth = (): void => {
        this.currentDisplayMonth.setUTCMonth(this.currentDisplayMonth.getUTCMonth() + 1);
        this.render(); // Re-render the whole modal
    };

    private _handleDateSelect = (selected: Date): void => {
        this.selectedDateObj = selected; // Update internal state
        //? Re-render to update selection highlight and footer display
        //? Alternatively, could update only specific elements for performance
        this.render();
    };

    private _confirmSelection = (): void => {
        const isoDate = formatDateISO(this.selectedDateObj);
        this.onSelectCallback(isoDate); // Notify parent component
        new Notice(`Date set to ${isoDate}`);
        this.close();
    };

    onClose() {
        this.contentEl.empty();
    }
}