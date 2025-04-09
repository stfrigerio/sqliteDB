import { App, MarkdownView } from "obsidian";
import { NavigationPeriod } from "./codeblocks/dateHeader/dateNavigator.types";
import { calculatePeriodRange } from "./helpers/datePeriodUtils";

export const DATE_CHANGED_EVENT_NAME = 'plugin-date-changed';

export class PluginState {
    private app: App | null = null;

    private _selectedDate: string; // YYYY-MM-DD (Represents a specific day within the current period)
    private _currentPeriod: NavigationPeriod;
    private _periodStartDate: string; // YYYY-MM-DD
    private _periodEndDate: string;   // YYYY-MM-DD

    public initialize(app: App, initialDate?: string, initialPeriod: NavigationPeriod = 'day'): void {
        this.app = app;
        this._currentPeriod = initialPeriod;
        // Call setter to perform initial calculation and dispatch (if needed)
        this.selectedDate = initialDate ?? new Date().toISOString().split("T")[0];
        // Ensure initial range is set if date wasn't changed by setter
        if (!this._periodStartDate) {
            this._recalculatePeriodRange();
        }
        console.log("[PluginState] Initialized.");
    }

    // --- Getters ---
    get selectedDate(): string { return this._selectedDate; }
    get currentPeriod(): NavigationPeriod { return this._currentPeriod; }
    get periodStartDate(): string { return this._periodStartDate; }
    get periodEndDate(): string { return this._periodEndDate; }

    // --- Setters ---
    set selectedDate(newIsoDate: string) {
        //? Basic validation - can be enhanced
        if (!newIsoDate || !/^\d{4}-\d{2}-\d{2}$/.test(newIsoDate)) {
            console.warn(`[PluginState] Invalid date format passed to selectedDate setter: ${newIsoDate}`);
            // Optionally default to today or throw error? Defaulting silently for now.
            newIsoDate = new Date().toISOString().split("T")[0];
        }

        //? Only update and recalculate if the selected date actually changes
        if (this._selectedDate !== newIsoDate) {
            this._selectedDate = newIsoDate;
            this._recalculatePeriodRange(); // Recalculate start/end based on new selected date and current period
            this._dispatchDateChangeEventAndRefreshViews();
        }
    }

    set currentPeriod(newPeriod: NavigationPeriod) {
        //? Only update if the period type changes
        if (this._currentPeriod !== newPeriod) {
            this._currentPeriod = newPeriod;
            this._recalculatePeriodRange(); // Recalculate start/end based on the new period and current selected date
            this._dispatchDateChangeEventAndRefreshViews(); // Also notify listeners of period change implicitly via date change event
        }
    }

    /** Recalculates start and end dates based on current _selectedDate and _currentPeriod */
    private _recalculatePeriodRange(): void {
        const range = calculatePeriodRange(this._selectedDate, this._currentPeriod);
        if (range) {
            this._periodStartDate = range.startDate;
            this._periodEndDate = range.endDate;
        } else {
            //? Handle error or default case if calculation fails
            console.error(`[PluginState] Failed to calculate period range.`);
            // Set default range (e.g., just the selected day)
            this._periodStartDate = this._selectedDate;
            this._periodEndDate = this._selectedDate;
        }
    }

    /** Dispatches the custom event to notify listeners of changes */
    private _dispatchDateChangeEventAndRefreshViews(): void {
        document.dispatchEvent(new CustomEvent(DATE_CHANGED_EVENT_NAME, {
            detail: { /* ... date/period details ... */ }
        }));

        if (this.app) {
            this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
                if (leaf.view instanceof MarkdownView) {
                    const view = leaf.view;
                    //? Force re-render of the preview mode.
                    //? This should cause code blocks to be re-processed.
                    view.previewMode?.rerender(true);
                    //? For Live Preview, forcing re-render is more complex and might
                    //? require interacting with the CodeMirror view state if the simple
                    //? previewMode rerender isn't sufficient. Start with this.
                }
            });
        } else {
            console.warn("[PluginState] Cannot refresh views: App instance not available.");
        }
    }
}

export const pluginState = new PluginState();